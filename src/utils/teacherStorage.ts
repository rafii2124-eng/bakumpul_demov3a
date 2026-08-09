// ============================================================
// Helper penyimpanan data per guru (kunci autentik = NIP/NIK)
// Setiap guru punya NIP/NIK unik -> semua data kerjanya disimpan
// di kunci localStorage yang mengandung NIP bersih, sehingga
// antar guru tidak saling menimpa data (tidak bentrok).
// ============================================================

/** Bersihkan NIP/NIK agar aman dipakai sebagai bagian kunci localStorage. */
export const cleanNip = (nip?: string): string =>
  (nip || '').trim().replace(/\s+/g, '');

/** Kunci jurnal milik seorang guru; kosong = kunci global (fallback). */
export const teacherJournalKey = (nip?: string): string => {
  const c = cleanNip(nip);
  return c ? `bakumpul_jurnal_entries_${c}` : 'bakumpul_jurnal_entries';
};

/** Kunci absensi milik seorang guru; kosong = kunci global (fallback). */
export const teacherAbsensiKey = (nip?: string): string => {
  const c = cleanNip(nip);
  return c ? `absensi_database_v1_${c}` : 'absensi_database_v1';
};

/** Baca jurnal milik guru; jika belum ada kunci guru, warisi data global lama. */
export const loadTeacherJournals = <T,>(nip?: string): T[] | null => {
  const key = teacherJournalKey(nip);
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as T[];
    } catch {
      // lanjut ke fallback
    }
  }
  if (cleanNip(nip)) {
    const legacy = localStorage.getItem('bakumpul_jurnal_entries');
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed)) return parsed as T[];
      } catch {
        // abaikan
      }
    }
  }
  return null;
};

/** Simpan jurnal milik guru. */
export const saveTeacherJournals = <T,>(nip: string | undefined, data: T[]): void => {
  try {
    localStorage.setItem(teacherJournalKey(nip), JSON.stringify(data));
  } catch {
    // abaikan quota error
  }
};

/** Baca absensi milik guru; jika belum ada kunci guru, warisi data global lama. */
export const loadTeacherAbsensi = (nip?: string): Record<string, string> => {
  const key = teacherAbsensiKey(nip);
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed as Record<string, string>;
    } catch {
      // lanjut
    }
  }
  if (cleanNip(nip)) {
    const legacy = localStorage.getItem('absensi_database_v1');
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        if (parsed && typeof parsed === 'object') return parsed as Record<string, string>;
      } catch {
        // abaikan
      }
    }
  }
  return {};
};

/** Simpan absensi milik guru. */
export const saveTeacherAbsensi = (nip: string | undefined, data: Record<string, string>): void => {
  try {
    localStorage.setItem(teacherAbsensiKey(nip), JSON.stringify(data));
  } catch {
    // abaikan quota error
  }
};

// ============================================================
// Registry guru yang sedang login (autentikator = NIP/NIK).
// Berbeda dari penanda tunggal sebelumnya, disimpan sebagai
// daftar (array) sehingga BANYAK guru bisa login bersamaan dan
// BANYAK NPSN tampil merah sekaligus di dashboard kepala sekolah.
// ============================================================
const ACTIVE_LOGINS_KEY = 'bakumpul_active_guru_logins';

export interface ActiveGuruLogin {
  nip: string;
  nama: string;
  npsn: string;
  ts: number;
}

/** Baca seluruh guru yang sedang login. */
export const getActiveGuruLogins = (): ActiveGuruLogin[] => {
  try {
    const raw = localStorage.getItem(ACTIVE_LOGINS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as ActiveGuruLogin[];
    }
  } catch {
    // abaikan
  }
  return [];
};

/** Tandai sebuah akun guru sedang login (upsert per NIP bersih). */
export const markActiveGuruLogin = (acc: { nipGuru?: string; namaGuru?: string; npsn?: string }): void => {
  const nip = cleanNip(acc?.nipGuru);
  if (!nip) return;
  const list = getActiveGuruLogins().filter(x => cleanNip(x.nip) !== nip);
  list.push({
    nip,
    nama: (acc?.namaGuru || '').trim(),
    npsn: (acc?.npsn || '').trim(),
    ts: Date.now()
  });
  try {
    localStorage.setItem(ACTIVE_LOGINS_KEY, JSON.stringify(list));
  } catch {
    // abaikan quota error
  }
};

/** Hapus guru dari daftar saat login pada saat logout. */
export const clearActiveGuruLogin = (nip?: string): void => {
  const c = cleanNip(nip);
  const list = getActiveGuruLogins().filter(x => !c || cleanNip(x.nip) !== c);
  try {
    if (list.length === 0) localStorage.removeItem(ACTIVE_LOGINS_KEY);
    else localStorage.setItem(ACTIVE_LOGINS_KEY, JSON.stringify(list));
  } catch {
    // abaikan quota error
  }
};
