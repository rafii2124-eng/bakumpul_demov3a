// ============================================================
// Sinkron jurnal guru -> dashboard kepala sekolah (per NPSN)
// Guru "mengirim" jurnal ke sebuah "kotak masuk sekolah" yang
// dikunci oleh NPSN. Kepala sekolah mengambil semua jurnal dari
// kotak masuk NPSN yang sama, sehingga data terbaca meski guru
// & kepala sekolah memakai perangkat/browser berbeda.
//
// Dua lapisan penyimpanan:
//  1) localStorage (kotak masuk lokal) -> instan, lintas akun
//     pada browser/perangkat yang sama.
//  2) Server Express (data/journal-sync.json) -> lintas perangkat
//     (perlu server dijalankan, lalu diakses lewat jaringan).
// ============================================================

import { JournalEntry } from '../types';
import { cleanNip } from './teacherStorage';

const SCHOOL_INBOX_PREFIX = 'bakumpul_school_journals_';

export interface SchoolInboxData {
  npsn: string;
  namaSekolah: string;
  updatedAt: string;
  journals: JournalEntry[];
}

/** Bersihkan NPSN agar aman dipakai sebagai bagian kunci localStorage. */
export const cleanNpsn = (npsn?: string): string => {
  const c = (npsn || '').trim().replace(/\s+/g, '');
  return c || 'UNKNOWN_SCHOOL';
};

/** Kunci kotak masuk jurnal sekolah milik sebuah NPSN. */
export const schoolInboxKey = (npsn?: string): string => {
  return `${SCHOOL_INBOX_PREFIX}${cleanNpsn(npsn)}`;
};

/** Baca payload kotak masuk; dukung format lama (array) & baru (objek). */
const parseInbox = (raw: string | null): SchoolInboxData | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return {
        npsn: '',
        namaSekolah: '',
        updatedAt: '',
        journals: parsed as JournalEntry[]
      };
    }
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.journals)) {
      return parsed as SchoolInboxData;
    }
  } catch {
    // abaikan
  }
  return null;
};

/** Muat jurnal di kotak masuk sekolah (localStorage) untuk NPSN tertentu. */
export const loadSchoolInbox = (npsn?: string): JournalEntry[] => {
  try {
    const data = parseInbox(localStorage.getItem(schoolInboxKey(npsn)));
    return data ? data.journals : [];
  } catch {
    return [];
  }
};

/** Simpan jurnal ke kotak masuk sekolah (localStorage), gabung tanpa duplikat. */
export const saveSchoolInbox = (
  npsn: string | undefined,
  namaSekolah: string,
  journals: JournalEntry[]
): void => {
  try {
    const key = schoolInboxKey(npsn);
    const existing = parseInbox(localStorage.getItem(key));
    const seen = new Set<string>();
    const merged: JournalEntry[] = [];
    [...(existing ? existing.journals : []), ...journals].forEach((j) => {
      if (j && j.id && !seen.has(j.id)) {
        seen.add(j.id);
        merged.push(j);
      }
    });
    const payload: SchoolInboxData = {
      npsn: cleanNpsn(npsn),
      namaSekolah: namaSekolah || (existing ? existing.namaSekolah : ''),
      updatedAt: new Date().toISOString(),
      journals: merged
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // abaikan quota error
  }
};

/** Enumerasi semua kotak masuk sekolah yang ada di localStorage. */
export const listSchoolInboxes = (): SchoolInboxData[] => {
  const result: SchoolInboxData[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SCHOOL_INBOX_PREFIX)) {
        const data = parseInbox(localStorage.getItem(key));
        if (data) result.push(data);
      }
    }
  } catch {
    // abaikan
  }
  return result;
};

/** Hapus kotak masuk sekolah lokal (dipakai reset bulanan kepsek). */
export const clearSchoolInbox = (npsn?: string): void => {
  try {
    localStorage.removeItem(schoolInboxKey(npsn));
  } catch {
    // abaikan
  }
};

/**
 * KIRIM jurnal guru ke kepala sekolah:
 *  1. tulis ke kotak masuk NPSN (localStorage) -> instan di perangkat yang sama;
 *  2. push ke server agar terbaca lintas perangkat.
 * Selalu kembalikan sukses lokal; server gagal tidak menggagalkan kirim.
 */
export const sendJournalsToSchool = async (
  npsn: string | undefined,
  namaSekolah: string,
  nipGuru: string | undefined,
  journals: JournalEntry[]
): Promise<{ local: boolean; server: boolean }> => {
  // 1. Kotak masuk lokal (pasti berhasil)
  saveSchoolInbox(npsn, namaSekolah, journals);
  // 2. Server push (best-effort)
  let server = false;
  try {
    const res = await fetch('/api/journal/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        npsn: cleanNpsn(npsn),
        namaSekolah,
        guruNip: cleanNip(nipGuru),
        journals
      }),
    });
    server = res.ok;
  } catch {
    server = false;
  }
  return { local: true, server };
};

/** Ambil semua jurnal sekolah (kotak masuk NPSN) dari local storage. */
export const getSchoolJournalsLocally = (npsn?: string): JournalEntry[] => {
  return loadSchoolInbox(npsn);
};

/** Simpan hasil tarik dari server ke kotak masuk lokal (sekali disimpan kepsek). */
export const mergeServerJournals = (
  npsn: string | undefined,
  namaSekolah: string,
  journals: JournalEntry[]
): void => {
  saveSchoolInbox(npsn, namaSekolah, journals);
};

// ============================================================
// Sinkron STATUS LOGIN guru & DAFTAR GURU (upload kepsek) ke
// server agar terbaca di perangkat/browser lain. Semua panggilan
// bersifat best-effort (gagal server tidak menggagalkan fungsi lokal).
// ============================================================

/** Kirim penanda "guru login" ke server (autentikator = NIP/NIK). */
export const pushGuruLogin = async (acc: {
  nipGuru?: string;
  namaGuru?: string;
  npsn?: string;
  namaSekolah?: string;
}): Promise<boolean> => {
  try {
    const res = await fetch('/api/guru-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nip: cleanNip(acc?.nipGuru),
        nama: acc?.namaGuru || '',
        npsn: cleanNpsn(acc?.npsn) === 'UNKNOWN_SCHOOL' ? '' : cleanNpsn(acc?.npsn),
        namaSekolah: acc?.namaSekolah || ''
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
};

/** Kirim penanda "guru logout" ke server (hapus dari daftar login). */
export const pushGuruLogout = async (nipGuru?: string): Promise<boolean> => {
  try {
    const res = await fetch('/api/guru-logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nip: cleanNip(nipGuru) }),
    });
    return res.ok;
  } catch {
    return false;
  }
};

export interface GuruLoginRecord {
  nip: string;
  nama: string;
  npsn: string;
  namaSekolah: string;
  ts: number;
}

/** Ambil daftar guru yang sedang login dari server (per NPSN / nama sekolah). */
export const fetchActiveGuruLogins = async (npsn?: string, namaSekolah?: string): Promise<GuruLoginRecord[]> => {
  try {
    if (npsn) {
      const res = await fetch(`/api/guru-login?npsn=${encodeURIComponent(cleanNpsn(npsn))}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.logins)) return json.logins as GuruLoginRecord[];
      }
    }
    if (namaSekolah) {
      const res = await fetch(`/api/guru-login?school=${encodeURIComponent(namaSekolah)}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.logins)) {
          const fromNpsn = npsn ? await pullActiveGuruLogins(npsn) : [];
          const seen = new Set(fromNpsn.map((l) => l.nip));
          return [...fromNpsn, ...json.logins.filter((l: GuruLoginRecord) => !seen.has(l.nip))];
        }
      }
    }
  } catch {
    // server offline
  }
  return [];
};

const pullActiveGuruLogins = async (npsn?: string): Promise<GuruLoginRecord[]> => {
  try {
    const res = await fetch(`/api/guru-login?npsn=${encodeURIComponent(cleanNpsn(npsn))}`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.logins)) return json.logins as GuruLoginRecord[];
    }
  } catch {
    // abaikan
  }
  return [];
};

/** Simpan daftar guru upload kepsek ke server agar terbaca di perangkat lain. */
export const pushGuruRows = async (
  npsn: string | undefined,
  namaSekolah: string,
  rows: { npsn: string; nama: string; nip: string; kelas: string }[]
): Promise<boolean> => {
  try {
    const res = await fetch('/api/guru-rows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        npsn: cleanNpsn(npsn),
        namaSekolah,
        rows
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
};

/** Ambil daftar guru upload keproe dari server (per NPSN / sekolah). */
export const pullServerGuruRows = async (
  npsn?: string,
  namaSekolah?: string
): Promise<{ npsn: string; nama: string; nip: string; kelas: string }[]> => {
  try {
    if (npsn) {
      const res = await fetch(`/api/guru-rows?npsn=${encodeURIComponent(cleanNpsn(npsn))}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.rows)) return json.rows;
      }
    }
    if (namaSekolah) {
      const res = await fetch(`/api/guru-rows?school=${encodeURIComponent(namaSekolah)}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.rows)) return json.rows;
      }
    }
  } catch {
    // server offline
  }
  return [];
};