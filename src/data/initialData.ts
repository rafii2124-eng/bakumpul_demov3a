import { Biodata, DiagnosticData, SubjectStudentGrade, StudentEvaluationGrade } from '../types';

export const initialBiodata: Biodata = {
  npsn: "",
  namaSekolah: "",
  alamat: "Jl. Pendidikan No. 12",
  kota: "Batu Bahalang",
  desa: "",
  kecamatan: "",
  namaKepsek: "Rafi'i Hamdi,M.Pd.",
  nipKepsek: "19850101 201001 1 001",
  fase: "Fase B",
  kelas: "III",
  kelasLanjutan: "IV",
  semester: "1",
  namaGuru: "Ahmad Mujahid, S.Pd.",
  nipGuru: "19900202 201502 1 002",
  logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_Tut_Wuri_Handayani.png/800px-Logo_Tut_Wuri_Handayani.png"
};

export const initialLockedTargets: Record<string, number> = {
  "PKN": 75.0,
  "Bahasa Indonesia": 78.0,
  "Matematika": 70.0,
  "IPA": 74.0,
  "TIK": 75.0,
  "Bahasa dan Sastra Banjar": 76.0,
  "SBdP": 80.0,
  "PJOK": 82.0,
  "Bahasa Inggris": 72.0,
  "Pendidikan Agama Islam": 78.0,
  "Baca Tulis Al-Quran": 77.0,
  "Coding": 73.0
};

export const initialDiagnosticDatabase: Record<string, DiagnosticData> = {
  "PKN": { n90: 8, n80: 12, n70: 6, n60: 4 },
  "Bahasa Indonesia": { n90: 10, n80: 14, n70: 4, n60: 2 },
  "Matematika": { n90: 4, n80: 8, n70: 12, n60: 6 },
  "IPA": { n90: 6, n80: 12, n70: 8, n60: 4 },
  "TIK": { n90: 8, n80: 12, n70: 6, n60: 2 },
  "Bahasa dan Sastra Banjar": { n90: 8, n80: 11, n70: 7, n60: 4 },
  "SBdP": { n90: 15, n80: 10, n70: 3, n60: 2 },
  "PJOK": { n90: 18, n80: 8, n70: 3, n60: 1 },
  "Bahasa Inggris": { n90: 5, n80: 10, n70: 10, n60: 5 },
  "Pendidikan Agama Islam": { n90: 12, n80: 10, n70: 5, n60: 3 },
  "Baca Tulis Al-Quran": { n90: 9, n80: 11, n70: 8, n60: 2 },
  "Coding": { n90: 6, n80: 10, n70: 11, n60: 3 }
};

export const initialDefaultSubjectData: Record<string, Record<string, string[]>> = {
  "Fase A": {
    "TIK": [
      "Mengenal perangkat keras komputer dasar (layar, keyboard, mouse, CPU) dan fungsinya dengan aman",
      "Mengoperasikan mouse dan keyboard dasar untuk menggambar serta mengetik huruf/angka sederhana",
      "Memahami etika menggunakan perangkat teknologi serta cara menyalakan/mematikan perangkat dengan benar",
      "Mengenal ikon dan tombol navigasi dasar pada aplikasi gambar atau media pembelajaran interaktif",
      "Memahami konsep pola sederhana dan instruksi berurutan (algoritma sederhana) dalam kegiatan sehari-hari"
    ],
    "PKN": [
      "Mengenal simbol-simbol Pancasila dan lambang negara Garuda Pancasila",
      "Mengidentifikasi aturan yang berlaku di rumah dan di sekolah",
      "Menunjukkan sikap menghargai perbedaan di lingkungan sekitar"
    ],
    "Bahasa Indonesia": [
      "Mengenal huruf, suku kata, dan kata-kata yang sering ditemui sehari-hari",
      "Membaca nyaring teks pendek dengan lafal dan intonasi yang tepat",
      "Menulis kata dan kalimat sederhana dengan huruf tegak bersambung atau lepas"
    ],
    "Matematika": [
      "Mengenal dan mengurutkan bilangan cacah sampai dengan 100",
      "Melakukan penjumlahan dan pengurangan bilangan cacah sampai 20",
      "Mengenal bangun datar dan bangun ruang sederhana"
    ]
  },
  "Fase B": {
    "TIK": [
      "Memanfaatkan aplikasi pengolah kata sederhana untuk mengetik teks, mengatur format tulisan, dan menyisipkan gambar",
      "Memahami konsep dasar internet, pencarian informasi sederhana (search engine), dan keamanan data pribadi",
      "Mengenal perangkat lunak presentasi sederhana untuk menyampaikan ide atau karya visual",
      "Menerapkan pemikiran komputasional (computational thinking) melalui pemecahan masalah dan instruksi terstruktur",
      "Mengenal konsep pemrograman visual sederhana (block programming/Scratch Jr) untuk membuat animasi dasar"
    ],
    "PKN": [
      "Menyambut, mengadaptasi, dan mendemonstrasikan tugas kelompok",
      "Memprakarsai dan memaksimalkan diri berkolaborasi",
      "Mendeteksi, memilah dan mengasumsikan kebutuhan sosial",
      "Memahami sejarah singkat dan makna lambang Garuda Pancasila",
      "Mengidentifikasi dan mematuhi aturan serta norma sekolah"
    ],
    "Bahasa Indonesia": [
      "Memahami dan menganalisis ide pokok dari teks informatif",
      "Menulis laporan pengamatan dengan struktur yang runtut",
      "Membaca kata-kata baru dengan pola kombinasi huruf yang kompleks",
      "Menulis kalimat deklaratif dan imperatif dengan benar",
      "Menceritakan ulang isi teks narasi dengan bahasa sendiri"
    ],
    "Matematika": [
      "Mengidentifikasi, membandingkan, serta mengurutkan pecahan biasa",
      "Selesaikan masalah perkalian dan pembagian hingga 1.000",
      "Menentukan keliling dan luas bangun datar sederhana",
      "Menyajikan dan menginterpretasikan data dalam piktogram",
      "Memahami hubungan antar satuan baku panjang dan berat"
    ]
  },
  "Fase C": {
    "TIK": [
      "Menguasai pembuatan dokumen terstruktur pada pengolah kata dan pengolahan data angka pada lembar kerja (spreadsheet) dasar",
      "Membuat presentasi multimedia interaktif dengan kombinasi teks, gambar, grafik, dan transisi menarik",
      "Menganalisis kebenaran informasi digital (literasi digital), pencegahan cyberbullying, dan etika berkomunikasi di internet",
      "Menyusun program visual blok (Scratch/Blockly) menggunakan variabel, percabangan, dan perulangan untuk game edukasi",
      "Memahami sistem jaringan komputer lokal/internet serta konsep penyimpanan awan (cloud storage) dasar"
    ],
    "PKN": [
      "Memahami norma dan aturan yang berlaku dalam kehidupan bermasyarakat",
      "Mengidentifikasi keragaman budaya, suku, dan agama di Indonesia",
      "Menerapkan nilai-nilai Pancasila dalam kehidupan sehari-hari"
    ],
    "Bahasa Indonesia": [
      "Mengidentifikasi unsur-unsur intrinsik dalam cerita pendek",
      "Menulis teks narasi, deskripsi, dan eksposisi dengan ejaan yang disempurnakan",
      "Melakukan wawancara sederhana untuk menggali informasi"
    ],
    "Matematika": [
      "Operasi hitung campuran bilangan cacah, pecahan, dan desimal",
      "Menghitung volume bangun ruang kubus dan balok",
      "Mengolah data statistik sederhana (rata-rata, modus, median)"
    ]
  },
  "Fase D": {
    "TIK": [
      "Menerapkan computational thinking untuk menyelesaikan persoalan komputasi kompleks secara sistematis dan terstruktur",
      "Mengolah data menggunakan fungsi matematika, statistik, serta visualisasi grafik pada aplikasi spreadsheet",
      "Memahami arsitektur sistem komputer, sistem operasi, jaringan lokal/internet, serta protokol enkripsi data dasar",
      "Merancang dan mengembangkan program berbasis blok atau teks (Python/Scratch) menggunakan pengkondisian dan perulangan",
      "Menganalisis dampak sosial TIK, hak kekayaan intelektual (HKI), dan menjaga keamanan siber (cyber security) pribadi"
    ],
    "PKN": [
      "Menganalisis kedudukan Pancasila sebagai dasar negara dan pandangan hidup bangsa",
      "Memahami UUD NRI Tahun 1945 serta tatanan hukum nasional",
      "Memahami konsep Bhinneka Tunggal Ika dan NKRI"
    ],
    "Bahasa Indonesia": [
      "Menganalisis teks berita, ikhtisar, dan teks tanggapan kritis",
      "Menulis karya ilmiah sederhana dengan referensi yang sah",
      "Menyampaikan ide dalam diskusi resmi dan debat terstruktur"
    ],
    "Matematika": [
      "Sistem persamaan linear dua variabel (SPLDV)",
      "Teorema Pythagoras dan geometri lingkaran",
      "Konsep peluang dan analisis data statistik"
    ]
  },
  "Fase E": {
    "TIK": [
      "Menerapkan algoritma pencarian, pengurutan, dan struktur data (array, stack, queue) dalam pemecahan masalah komputasi",
      "Mengintegrasikan aplikasi perkantoran (word processor, spreadsheet, presentation) menggunakan fitur Mail Merge dan OLE",
      "Memahami infrastruktur jaringan komputer, topologi, pengalamatan IP (IPv4/IPv6), dan analisis lalu lintas data",
      "Mengembangkan program berbasis teks/GUI sederhana menggunakan bahasa pemrograman (Python, C++, atau Java)",
      "Menganalisis isu etis TIK, privasi data (GDPR/UU ITE), budaya digital, dan dasar-dasar kecerdasan buatan (AI)"
    ],
    "PKN": [
      "Menganalisis pelanggaran hak dan pengingkaran kewajiban warga negara",
      "Memahami integrasi nasional dalam bingkai Bhinneka Tunggal Ika",
      "Menganalisis sistem politik dan pemerintahan Indonesia"
    ],
    "Bahasa Indonesia": [
      "Menganalisis teks laporan hasil observasi (LHO) dan teks eksposisi",
      "Mengkritisi teks anekdot dan hikayat",
      "Menulis puisi dan naskah drama secara kreatif"
    ],
    "Matematika": [
      "Persamaan dan pertidaksamaan nilai mutlak linear satu variabel",
      "Fungsi kuadrat, eksponen, dan logaritma",
      "Vektor dan trigonometri dasar"
    ]
  },
  "Fase F": {
    "TIK": [
      "Merancang dan mengimplementasikan basis data relasional (SQL) serta integrasinya dengan aplikasi pemrograman",
      "Menganalisis data tingkat lanjut (Data Science) dengan statistik deskriptif, pembersihan data, dan visualisasi interaktif",
      "Mengembangkan sistem perangkat lunak terintegrasi (Web Development / Mobile App) menerapkan prinsip UI/UX",
      "Memahami konsep Kecerdasan Buatan (Machine Learning, Prompt Engineering) dan keamanan jaringan siber tingkat lanjut",
      "Mengevaluasi inovasi teknologi digital, Internet of Things (IoT), serta peluang kewirausahaan berbasis teknologi (Technopreneurship)"
    ],
    "PKN": [
      "Menganalisis peran Indonesia dalam perdamaian dunia",
      "Mengevaluasi kasus pelanggaran HAM di Indonesia",
      "Memahami tata kelola pemerintahan yang baik (good governance)"
    ],
    "Bahasa Indonesia": [
      "Menganalisis surat lamaran pekerjaan dan riwayat hidup",
      "Memahami naskah drama, artikel opini, dan kritik sastra",
      "Menulis esei argumentatif berbasis riset"
    ],
    "Matematika": [
      "Kalkulus dasar (limit, turunan, dan integral)",
      "Geometri ruang (dimensi tiga) dan matriks",
      "Statistika inferensial dan distribusi peluang"
    ]
  }
};

export const sampleStudentNames = ["Ahmad Pratama", "Budi Santoso", "Citra Kirana", "Dewa Purnama", "Eka Rahmawati"];

export function generateSampleSubjectGrades(): Record<string, SubjectStudentGrade[]> {
  const result: Record<string, SubjectStudentGrade[]> = {};
  const subjects = Object.keys(initialDiagnosticDatabase);

  subjects.forEach(subject => {
    result[subject] = sampleStudentNames.map((nama, idx) => {
      const lms = [
        Math.floor(Math.random() * 20) + 75,
        Math.floor(Math.random() * 20) + 75,
        Math.floor(Math.random() * 20) + 75,
        Math.floor(Math.random() * 20) + 75,
        Math.floor(Math.random() * 20) + 75
      ];
      return {
        id: idx + 1,
        nama,
        nisn: `012345670${idx + 1}`,
        lms,
        lm1: lms[0],
        lm2: lms[1],
        lm3: lms[2],
        lm4: lms[3],
        lm5: lms[4],
        sas: Math.floor(Math.random() * 20) + 75
      };
    });
  });

  return result;
}

export function generateSampleEvaluationGrades(): Record<string, StudentEvaluationGrade[]> {
  const result: Record<string, StudentEvaluationGrade[]> = {};
  const subjects = Object.keys(initialDiagnosticDatabase);

  subjects.forEach(subject => {
    result[subject] = sampleStudentNames.map((nama, idx) => ({
      id: idx + 1,
      nama,
      nisn: `012345670${idx + 1}`,
      formatif: Math.floor(Math.random() * 20) + 75,
      sumatifLM: Math.floor(Math.random() * 20) + 75,
      sumatifAS: Math.floor(Math.random() * 20) + 75,
      tindakLanjut: "Pemantapan materi rutin"
    }));
  });

  return result;
}

export const initialScheduleItems = [
  {
    id: 'sch-1',
    hari: 'Senin',
    jamKe: 'Jam 1 - 2',
    waktu: '07:30 - 08:50',
    kelas: 'Kelas IV A',
    matpel: 'Pendidikan Pancasila (PKN)',
    materiDefault: 'Makna Lambang dan Simbol Garuda Pancasila',
    tpDefault: 'Peserta didik mampu memahami sejarah singkat dan makna lambang Garuda Pancasila.',
    metodeDefault: 'Problem Based Learning (PBL)'
  },
  {
    id: 'sch-2',
    hari: 'Senin',
    jamKe: 'Jam 3 - 4',
    waktu: '09:05 - 10:25',
    kelas: 'Kelas IV A',
    matpel: 'Bahasa Indonesia',
    materiDefault: 'Ide Pokok dan Ide Pendukung Teks Informatif',
    tpDefault: 'Peserta didik mampu memahami dan menganalisis ide pokok dari teks informatif.',
    metodeDefault: 'Diskusi Kelompok & Presentasi'
  },
  {
    id: 'sch-3',
    hari: 'Selasa',
    jamKe: 'Jam 1 - 2',
    waktu: '07:30 - 08:50',
    kelas: 'Kelas IV A',
    matpel: 'Matematika',
    materiDefault: 'Pecahan Biasa dan Operasi Penjumlahan',
    tpDefault: 'Peserta didik mampu mengidentifikasi, membandingkan, serta mengurutkan pecahan biasa.',
    metodeDefault: 'Cooperative Learning & Alat Peraga'
  },
  {
    id: 'sch-4',
    hari: 'Selasa',
    jamKe: 'Jam 3 - 4',
    waktu: '09:05 - 10:25',
    kelas: 'Kelas IV A',
    matpel: 'IPA',
    materiDefault: 'Bentuk dan Perubahan Energi di Sekitar Kita',
    tpDefault: 'Peserta didik mampu mengidentifikasi bentuk-bentuk energi dan perubahannya.',
    metodeDefault: 'Eksperimen & Demonstration'
  },
  {
    id: 'sch-5',
    hari: 'Rabu',
    jamKe: 'Jam 1 - 2',
    waktu: '07:30 - 08:50',
    kelas: 'Kelas IV A',
    matpel: 'Bahasa Indonesia',
    materiDefault: 'Menulis Laporan Hasil Pengamatan Objek Lingkungan Sekolah',
    tpDefault: 'Peserta didik mampu menulis laporan pengamatan dengan struktur yang runtut.',
    metodeDefault: 'Project Based Learning (PjBL)'
  },
  {
    id: 'sch-6',
    hari: 'Rabu',
    jamKe: 'Jam 3 - 4',
    waktu: '09:05 - 10:25',
    kelas: 'Kelas IV A',
    matpel: 'Pendidikan Agama Islam',
    materiDefault: 'Membaca dan Memahami Surah Al-Hujurat',
    tpDefault: 'Peserta didik mampu membaca Al-Quran surah pilihan dengan tartil.',
    metodeDefault: 'Drill & Practice / Tilawah'
  },
  {
    id: 'sch-7',
    hari: 'Kamis',
    jamKe: 'Jam 1 - 2',
    waktu: '07:30 - 08:50',
    kelas: 'Kelas IV A',
    matpel: 'Matematika',
    materiDefault: 'Perkalian dan Pembagian Bilangan Celah Sampai 1000',
    tpDefault: 'Peserta didik mampu menyelesaikan masalah perkalian dan pembagian hingga 1.000.',
    metodeDefault: 'Latihan Terbimbing & Game Edukasi'
  },
  {
    id: 'sch-8',
    hari: 'Jumat',
    jamKe: 'Jam 1 - 2',
    waktu: '07:30 - 08:30',
    kelas: 'Kelas IV A',
    matpel: 'SBdP',
    materiDefault: 'Membuat Karya Seni Rupa Dua Dimensi dari Bahan Alam',
    tpDefault: 'Peserta didik mampu mengekspresikan ide melalui karya seni rupa dua dimensi.',
    metodeDefault: 'Praktik / Unjuk Kerja'
  }
];

export const initialJournalEntries = [
  {
    id: 'jrn-101',
    tanggal: '2026-08-03',
    hari: 'Senin',
    jamPelajaran: 'Jam 1 - 2 (07:30 - 08:50)',
    kelas: 'Kelas IV A',
    matpel: 'Pendidikan Pancasila (PKN)',
    materi: 'Makna Lambang dan Simbol Garuda Pancasila',
    tujuanPembelajaran: 'Peserta didik mampu memahami sejarah singkat dan makna lambang Garuda Pancasila.',
    metodePembelajaran: 'Problem Based Learning (PBL)',
    kehadiranSiswa: {
      hadir: 27,
      sakit: 1,
      izin: 0,
      alpa: 0,
      keterangan: 'Budi Santoso (Sakit)'
    },
    keteranganPelaksanaan: 'Terlaksana Sepenuhnya',
    catatanRefleksi: 'Pembelajaran berjalan interaktif. Siswa antusias mencocokkan kartu simbol Pancasila dengan sila yang sesuai.',
    createdAt: '2026-08-03T09:00:00.000Z'
  },
  {
    id: 'jrn-102',
    tanggal: '2026-08-04',
    hari: 'Selasa',
    jamPelajaran: 'Jam 1 - 2 (07:30 - 08:50)',
    kelas: 'Kelas IV A',
    matpel: 'Matematika',
    materi: 'Pecahan Biasa dan Operasi Penjumlahan',
    tujuanPembelajaran: 'Peserta didik mampu mengidentifikasi, membandingkan, serta mengurutkan pecahan biasa.',
    metodePembelajaran: 'Cooperative Learning & Alat Peraga',
    kehadiranSiswa: {
      hadir: 28,
      sakit: 0,
      izin: 0,
      alpa: 0,
      keterangan: 'Hadir Semua'
    },
    keteranganPelaksanaan: 'Terlaksana Sepenuhnya',
    catatanRefleksi: 'Penggunaan media kertas lipat sangat membantu pemahaman konsep pecahan 1/2, 1/4, dan 3/4.',
    createdAt: '2026-08-04T09:00:00.000Z'
  }
];
