// Penyimpanan bersama: data RPM -> Jurnal Mengajar.
// Ketika guru membuat/mengisi RPM, data ini otomatis tersimpan,
// lalu menu Jurnal Mengajar membaca & mengisi form secara otomatis.

export interface RpmSkenarioSource {
  judul: string;
  awal: string;
  inti: string;
  penutup: string;
}

export interface RpmJournalSource {
  mapel: string;
  kelas: string;
  bab: string;
  materi: string;
  jp: string;
  tps: string[];
  pendekatan: string;
  model: string;
  skenario: RpmSkenarioSource[];
  updatedAt: string;
}

export const rpmSourceKey = (nip: string): string => `bakumpul_rpm_${(nip || '').trim().replace(/\s+/g, '')}`;

export function saveRpmSource(nip: string, data: RpmJournalSource): void {
  try {
    localStorage.setItem(rpmSourceKey(nip), JSON.stringify(data));
  } catch {
    // penyimpanan penuh / tidak tersedia
  }
}

export function loadRpmSource(nip: string): RpmJournalSource | null {
  try {
    const raw = localStorage.getItem(rpmSourceKey(nip));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.mapel) return parsed as RpmJournalSource;
  } catch {
    // fallback
  }
  return null;
}

// --- Draf lengkap form RPM (agar data tetap tersimpan saat pindah halaman) ---
export const rpmDraftKey = (nip: string): string => `bakumpul_rpm_draft_${(nip || '').trim().replace(/\s+/g, '')}`;

export function saveRpmDraft(nip: string, data: unknown): void {
  try {
    localStorage.setItem(rpmDraftKey(nip), JSON.stringify(data));
  } catch {
    // penyimpanan penuh / tidak tersedia
  }
}

export function loadRpmDraft(nip: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(rpmDraftKey(nip));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
  } catch {
    // fallback
  }
  return null;
}

// Ringkasan "berita rangkuman kegiatan di kelas" dari skenario RPM
export function buildRangkuman(rpm: RpmJournalSource): string {
  const parts: string[] = [`Rangkuman kegiatan: ${rpm.bab}`];
  rpm.skenario.forEach((s) => {
    parts.push(`• ${s.judul}: Awal — ${s.awal || '-'} | Inti — ${s.inti || '-'} | Penutup — ${s.penutup || '-'}`);
  });
  return parts.join('\n');
}

// Ringkasan singkat (±50 karakter) untuk kolom refleksi agar tidak memakan tempat.
export function buildRangkumanSingkat(rpm: RpmJournalSource, maxLen = 50): string {
  const materi = (rpm.materi || rpm.bab || '').trim();
  const jml = Math.max(rpm.skenario.length, 1);
  let teks = `Kegiatan ${materi || 'pembelajaran'} berlangsung ${jml} pertemuan.`;
  if (teks.length > maxLen) teks = `${materi ? materi : 'Pembelajaran'} (${jml} pertemuan)`;
  if (teks.length > maxLen) teks = teks.slice(0, maxLen - 1).trim() + '…';
  return teks;
}
