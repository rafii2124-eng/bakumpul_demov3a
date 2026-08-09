export interface Biodata {
  npsn?: string;
  namaSekolah: string;
  alamat: string;
  kota: string;
  desa?: string;
  kecamatan?: string;
  namaKepsek: string;
  nipKepsek: string;
  fase: string;
  kelas: string;
  kelasLanjutan: string;
  semester: string;
  namaGuru: string;
  nipGuru: string;
  logo: string | null;
}

export interface DiagnosticData {
  n90: number;
  n80: number;
  n70: number;
  n60: number;
}

export interface SubjectStudentGrade {
  id: number;
  nama: string;
  nisn: string;
  jenisKelamin?: string;
  lm1?: number;
  lm2?: number;
  lm3?: number;
  lm4?: number;
  lm5?: number;
  lms?: number[];
  sas?: number;
}

export interface StudentEvaluationGrade {
  id: number;
  nama: string;
  nisn: string;
  jenisKelamin?: string;
  formatif?: number;
  sumatifLM?: number;
  sumatifAS?: number;
  tindakLanjut?: string;
}

export interface KKTPRow {
  id: number;
  subject: string;
  cp: string;
  score: number;
}

export interface ScheduleItem {
  id: string;
  hari: string;
  jamKe: string;
  waktu: string;
  kelas: string;
  matpel: string;
  materiDefault: string;
  tpDefault: string;
  metodeDefault: string;
}

export interface JournalEntry {
  id: string;
  tanggal: string; // YYYY-MM-DD or formatted
  hari: string;
  jamPelajaran: string;
  kelas: string;
  matpel: string;
  materi: string;
  tujuanPembelajaran: string;
  metodePembelajaran: string;
  kehadiranSiswa: {
    hadir: number;
    sakit: number;
    izin: number;
    alpa: number;
    keterangan?: string;
  };
  keteranganPelaksanaan: string; // 'Terlaksana Sepenuhnya' | 'Terlaksana Sebagian' | etc.
  catatanRefleksi?: string;
  lampiran?: string | null;
  createdAt: string;
  // Identitas pengisi jurnal (agar terekam lengkap di dashboard kepala sekolah)
  guruNama?: string;
  sekolahNama?: string;
  sekolahNpsn?: string;
}

export type MainTab = 'biodata' | 'diagnosa' | 'kktp' | 'bukunilai' | 'absensi' | 'jurnal' | 'rpm';
export type BukuNilaiSubTab = 'rekap-matpel' | 'input-evaluasi' | 'rekap-kolektif';
export type BNFilter = 'all' | 'tuntas' | 'remedial';
