import React, { useEffect, useRef, useState } from 'react';
import { Biodata, DiagnosticData, SubjectStudentGrade, StudentEvaluationGrade } from '../types';
import { saveRpmSource, loadRpmDraft, saveRpmDraft } from '../utils/rpmStorage';
import {
  Printer,
  Download,
  Plus,
  Trash2,
  Eye,
  BookOpenCheck,
  School,
  Wand2,
  Users,
  Target,
  GitFork,
  FolderOpen,
  GraduationCap,
  BookOpen,
  Sparkles,
  ClipboardCheck,
  UserCheck,
  Upload
} from 'lucide-react';

interface RpmSkenario { id: number; judul: string; awal: string; inti: string; penutup: string; }
interface RpmRubrik { id: number; pernyataan: string; mapel: string; tingkat: string; }
const RUBRIK_LEVELS = ['Sangat Paham', 'Paham', 'Mulai Paham', 'Belum Paham'];
interface RpmSiswa { id: number; nomor: string; nama: string; mapel: string; kelompok: string; mendengarkan: string; nonVerbal: string; prestasi: string; }
interface RpmTP { id: number; teks: string; }
interface RpmDiag { id: number; kategori: string; deskripsi: string; }

interface RpmState {
  tahunPelajaran: string;
  hari: string;
  tanggal: string;
  mapel: string;
  bab: string;
  materi: string;
  materiGambar: string;
  jp: string;
  targetPeserta: string;
  jumlahPeserta: string;
  sarana: string;
  media: string[];
  alatBahan: string;
  ppp: string[];
  pendekatan: string;
  model: string;
  metode: string;
  cp: string;
  lintasDisiplin: string;
  tujuanPembelajaran: string;
  praktikPedagogis: string;
  pemanfaatanDigital: string;
  analisaData: string;
  tps: RpmTP[];
  elemen: string;
  pertanyaanPemantik: string;
  pemahamanBermakna: string;
  persiapan: string;
  diagnostik: RpmDiag[];
  skenario: RpmSkenario[];
  rubrik: RpmRubrik[];
  lembarSiswa: RpmSiswa[];
  remedial: string;
  pengayaan: string;
  asesmenAwal: string;
  asesmenProses: string;
  asesmenSumatif: string;
}

interface RpmProps {
  biodata: Biodata;
  diagnosticDatabase?: Record<string, DiagnosticData>;
  defaultSubjectData?: Record<string, Record<string, string[]>>;
  subjectGradesDatabase?: Record<string, SubjectStudentGrade[]>;
  gradesDatabase?: Record<string, StudentEvaluationGrade[]>;
  showToast: (msg: string) => void;
  isDemo?: boolean;
}

const PROFIL_LULUSAN = [
  { nama: 'Keimanan dan Ketakwaan terhadap Tuhan Yang Maha Esa', deskripsi: 'Peserta didik memiliki keyakinan kepada Tuhan Yang Maha Esa, menjalankan ajaran agama sesuai kepercayaannya, berakhlak mulia, bersyukur, jujur, disiplin, toleran, serta menunjukkan perilaku yang mencerminkan nilai-nilai religius dalam kehidupan sehari-hari.' },
  { nama: 'Kewargaan', deskripsi: 'Peserta didik memahami hak dan kewajibannya sebagai warga negara Indonesia, menghargai keberagaman suku, agama, budaya, dan bahasa, memiliki semangat persatuan, cinta tanah air, serta berpartisipasi aktif dalam kehidupan bermasyarakat berdasarkan nilai-nilai Pancasila.' },
  { nama: 'Penalaran Kritis', deskripsi: 'Peserta didik mampu memperoleh, memahami, menganalisis, mengevaluasi, dan menggunakan informasi secara logis untuk memecahkan masalah, mengambil keputusan, serta menghasilkan solusi yang tepat berdasarkan bukti dan fakta.' },
  { nama: 'Kreativitas', deskripsi: 'Peserta didik mampu menghasilkan gagasan, karya, atau solusi yang orisinal, inovatif, dan bermanfaat melalui proses berpikir kreatif, eksplorasi, eksperimen, serta pemanfaatan berbagai sumber belajar dan teknologi.' },
  { nama: 'Kolaborasi', deskripsi: 'Peserta didik mampu bekerja sama dengan orang lain secara efektif, menghargai perbedaan pendapat, berbagi tanggung jawab, saling membantu, serta mencapai tujuan bersama melalui komunikasi yang baik.' },
  { nama: 'Kemandirian', deskripsi: 'Peserta didik mampu mengatur proses belajar, bertanggung jawab terhadap tugas dan keputusan yang diambil, memiliki motivasi belajar sepanjang hayat, percaya diri, serta mampu menyelesaikan pekerjaan tanpa bergantung pada orang lain.' },
  { nama: 'Kesehatan', deskripsi: 'Peserta didik menerapkan pola hidup bersih dan sehat, menjaga kesehatan fisik maupun mental, berolahraga secara teratur, menjaga kebersihan lingkungan, serta memiliki kesadaran akan pentingnya keselamatan diri dan orang lain.' },
  { nama: 'Komunikasi', deskripsi: 'Peserta didik mampu menyampaikan gagasan, pendapat, informasi, dan hasil pemikiran secara lisan, tulisan, visual, maupun digital dengan santun, jelas, efektif, serta mampu menjadi pendengar yang baik dalam berbagai situasi komunikasi.' }
];
const PPP_OPTIONS = PROFIL_LULUSAN.map((p) => p.nama);
const PROFIL_ALIASES: Record<string, string> = {
  'Beriman dan Bertakwa kepada Tuhan YME': 'Keimanan dan Ketakwaan terhadap Tuhan Yang Maha Esa',
  'Berkebinekaan Global': 'Kewargaan',
  'Bergotong Royong': 'Kolaborasi',
  'Mandiri': 'Kemandirian',
  'Bernalar Kritis': 'Penalaran Kritis',
  'Kreatif': 'Kreativitas'
};
const normalizeProfil = (nama: string): string => PROFIL_ALIASES[nama] || nama;
const effectivePpp = (ppp: string[]): string[] =>
  ppp.map(normalizeProfil).filter((n) => PROFIL_LULUSAN.some((p) => p.nama === n));
const PENDEKATAN_OPTIONS = ['Deep Learning', 'Discovery Learning', 'Problem Based Learning', 'Project Based Learning', 'Inquiry Learning', 'Saintifik'];
const METODE_OPTIONS = ['Ceramah', 'Diskusi', 'Tanya Jawab', 'Demonstrasi', 'Bermain Peran', 'Permainan (Games)', 'Presentasi', 'Proyek'];
const MEDIA_OPTIONS = ['IFP (Interactive Flat Panel)', 'YouTube Edu', 'Video Animasi', 'Quizizz', 'Wordwall', 'Canva', 'Google Classroom', 'Buku Teks', 'Lembar Kerja (LKPD)'];
const TARGET_OPTIONS = ['Peserta didik regular/tipikal', 'Peserta didik dengan kesulitan belajar', 'Peserta didik pencapaian tinggi (cepat)', 'Peserta didik berkebutuhan khusus'];

const SYSTEM_SUBJECTS = [
  'Pendidikan Pancasila (PKN)',
  'Pendidikan Agama Islam',
  'Baca Tulis Al-Quran',
  'Bahasa Indonesia',
  'Matematika',
  'IPAS (Ilmu Pengetahuan Alam dan Sosial)',
  'TIK (Informatika / Komputer)',
  'Bahasa dan Sastra Banjar',
  'SBdP (Seni Budaya & Prakarya)',
  'PJOK',
  'Bahasa Inggris'
];

// CP otomatis berdasarkan mata pelajaran yang dipilih guru
const SUBJ_CP: Record<string, string> = {
  'Pendidikan Pancasila (PKN)': 'Peserta didik mampu memahami nilai-nilai Pancasila sebagai dasar negara dan pandangan hidup bangsa, menunjukkan sikap cinta tanah air, menghargai keberagaman, melaksanakan hak dan kewajiban sebagai warga negara, serta berpartisipasi aktif dalam kehidupan bermasyarakat sesuai dengan nilai-nilai demokrasi dan gotong royong.',
  'Pendidikan Agama Islam': 'Peserta didik mampu memahami ajaran agama Islam sesuai dengan keyakinannya, menghayati nilai-nilai keimanan dan ketakwaan kepada Allah Swt., serta mengamalkannya dalam kehidupan sehari-hari melalui perilaku yang jujur, disiplin, santun, peduli, bertanggung jawab, dan menghargai keberagaman.',
  'Baca Tulis Al-Quran': 'Peserta didik mampu membaca Al-Qur\u2019an dengan tartil sesuai kaidah tajwid dan makhraj yang benar, menulis huruf hijaiyah serta potongan ayat dengan tepat, memahami kandungan dan pesan yang terkandung di dalamnya, serta mengamalkan nilai-nilai Al-Qur\u2019an dalam kehidupan sehari-hari.',
  'Bahasa Indonesia': 'Peserta didik mampu menyimak, membaca, berbicara, mempresentasikan, dan menulis berbagai jenis teks secara efektif sesuai tujuan komunikasi. Peserta didik mampu memahami isi teks, menganalisis informasi, menyampaikan gagasan secara lisan maupun tulisan, serta menghasilkan karya tulis sederhana dengan menggunakan bahasa Indonesia yang baik dan benar.',
  'Matematika': 'Peserta didik mampu memahami konsep bilangan, aljabar, geometri, pengukuran, data, dan peluang sederhana; menggunakan penalaran matematis untuk memecahkan masalah; mengomunikasikan hasil pemikiran matematika; serta menerapkan konsep matematika dalam kehidupan sehari-hari secara logis, sistematis, dan kreatif.',
  'IPAS (Ilmu Pengetahuan Alam dan Sosial)': 'Peserta didik mampu memahami fenomena alam dan kehidupan sosial melalui kegiatan mengamati, menanya, mencoba, menalar, dan mengomunikasikan hasil pengamatan. Peserta didik menunjukkan kepedulian terhadap lingkungan, memahami hubungan antara manusia dengan alam dan masyarakat, serta mampu mengambil keputusan yang bertanggung jawab berdasarkan fakta.',
  'TIK (Informatika / Komputer)': 'Peserta didik mampu mengenal, memahami, dan menggunakan teknologi informasi dan komunikasi secara aman, bertanggung jawab, kreatif, serta beretika. Peserta didik mampu mengoperasikan perangkat digital, mengelola informasi, menggunakan berbagai aplikasi untuk belajar dan berkarya, berpikir komputasional dalam menyelesaikan masalah sederhana, serta menghasilkan karya digital yang bermanfaat sesuai dengan tingkat perkembangannya.',
  'Bahasa dan Sastra Banjar': 'Peserta didik mampu memahami, menggunakan, dan melestarikan Bahasa dan Sastra Banjar sebagai bagian dari identitas budaya daerah. Peserta didik mampu menyimak, berbicara, membaca, dan menulis dalam Bahasa Banjar sesuai tingkat perkembangannya, mengapresiasi karya sastra daerah, serta menunjukkan sikap bangga, santun, dan bertanggung jawab dalam menggunakan bahasa daerah sebagai warisan budaya Kalimantan Selatan. Peserta didik juga mampu mengenali dan mengamalkan nilai-nilai budaya Banjar melalui cerita rakyat, pantun, syair, peribahasa, kaulinan (permainan tradisional), adat istiadat, kesenian, makanan khas, dan kearifan lokal dalam kehidupan sehari-hari.',
  'SBdP (Seni Budaya & Prakarya)': 'Peserta didik mampu mengapresiasi, mengekspresikan, dan menciptakan karya seni sesuai minat dan bakat melalui seni rupa, musik, tari, dan teater. Peserta didik mampu mengembangkan kreativitas, imajinasi, estetika, serta menghargai keberagaman budaya Indonesia.',
  'PJOK': 'Peserta didik mampu menunjukkan keterampilan gerak dasar, menjaga kebugaran jasmani, menerapkan pola hidup sehat, memahami pentingnya keselamatan diri, bekerja sama dalam aktivitas olahraga, serta menunjukkan sikap sportif, disiplin, percaya diri, dan bertanggung jawab.',
  'Bahasa Inggris': 'Peserta didik mampu memahami dan menggunakan kosakata serta ungkapan sederhana dalam konteks kehidupan sehari-hari melalui kegiatan menyimak, berbicara, membaca, dan menulis. Peserta didik mampu berkomunikasi sederhana secara lisan maupun tulisan menggunakan bahasa Inggris sesuai tingkat perkembangannya.'
};

// Deskripsi Rubrik Penilaian per mata pelajaran (level 4-1) — diisi otomatis ke kolom "Pernyataan Refleksi"
const SUBJ_RUBRIK_DESC: Record<string, { tingkat: string; pernyataan: string }[]> = {
  'Pendidikan Agama Islam': [
    { tingkat: 'Sangat Paham', pernyataan: 'Mampu memahami ajaran yang dipelajari dengan sangat baik serta menunjukkan penerapannya dalam perilaku sehari-hari secara konsisten.' },
    { tingkat: 'Paham', pernyataan: 'Mampu memahami ajaran yang dipelajari dengan baik dan menunjukkan perilaku yang sesuai dalam kehidupan sehari-hari.' },
    { tingkat: 'Mulai Paham', pernyataan: 'Mulai memahami materi dan menunjukkan perilaku yang sesuai, tetapi masih memerlukan arahan dan pembiasaan.' },
    { tingkat: 'Belum Paham', pernyataan: 'Masih memerlukan bimbingan dalam memahami materi dan menerapkan nilai-nilai yang dipelajari dalam kehidupan sehari-hari.' }
  ],
  'Pendidikan Pancasila (PKN)': [
    { tingkat: 'Sangat Paham', pernyataan: 'Mampu memahami nilai Pancasila, aturan, hak dan kewajiban serta menerapkannya secara konsisten dalam kehidupan sehari-hari.' },
    { tingkat: 'Paham', pernyataan: 'Mampu memahami nilai Pancasila dan menunjukkan perilaku yang sesuai dalam kehidupan sehari-hari.' },
    { tingkat: 'Mulai Paham', pernyataan: 'Mulai memahami nilai dan aturan yang dipelajari, tetapi masih memerlukan bimbingan dalam penerapannya.' },
    { tingkat: 'Belum Paham', pernyataan: 'Masih memerlukan bimbingan dalam memahami nilai Pancasila, aturan, hak, kewajiban, dan penerapannya.' }
  ],
  'Bahasa Indonesia': [
    { tingkat: 'Sangat Paham', pernyataan: 'Mampu menyimak, berbicara, membaca, dan menulis dengan sangat baik serta mampu menyampaikan gagasan secara jelas, runtut, dan kreatif.' },
    { tingkat: 'Paham', pernyataan: 'Mampu memahami dan menyampaikan informasi dengan baik melalui kegiatan menyimak, berbicara, membaca, dan menulis.' },
    { tingkat: 'Mulai Paham', pernyataan: 'Mulai mampu memahami dan menyampaikan informasi, tetapi masih memerlukan bimbingan dalam menggunakan bahasa secara tepat.' },
    { tingkat: 'Belum Paham', pernyataan: 'Masih memerlukan bimbingan dalam memahami informasi serta mengungkapkan gagasan secara lisan maupun tulisan.' }
  ],
  'Matematika': [
    { tingkat: 'Sangat Paham', pernyataan: 'Mampu memahami konsep, menggunakan prosedur, melakukan penalaran, dan menyelesaikan masalah matematika secara tepat dan mandiri.' },
    { tingkat: 'Paham', pernyataan: 'Mampu memahami konsep dan menyelesaikan sebagian besar masalah matematika dengan baik.' },
    { tingkat: 'Mulai Paham', pernyataan: 'Mulai memahami konsep matematika, tetapi masih memerlukan bantuan dalam memilih strategi dan menyelesaikan masalah.' },
    { tingkat: 'Belum Paham', pernyataan: 'Masih memerlukan bimbingan dalam memahami konsep, menggunakan prosedur, dan menyelesaikan masalah matematika.' }
  ],
  'IPAS (Ilmu Pengetahuan Alam dan Sosial)': [
    { tingkat: 'Sangat Paham', pernyataan: 'Mampu memahami konsep sains dan sosial, melakukan pengamatan atau penyelidikan, menganalisis informasi, serta mengaitkannya dengan kehidupan sehari-hari secara mandiri.' },
    { tingkat: 'Paham', pernyataan: 'Mampu memahami konsep dan melakukan pengamatan atau penyelidikan dengan baik serta menghubungkannya dengan kehidupan sehari-hari.' },
    { tingkat: 'Mulai Paham', pernyataan: 'Mulai memahami konsep dan melakukan pengamatan, tetapi masih memerlukan bimbingan dalam menganalisis dan menyimpulkan informasi.' },
    { tingkat: 'Belum Paham', pernyataan: 'Masih memerlukan bimbingan dalam memahami konsep, melakukan pengamatan, mengolah informasi, dan menarik kesimpulan.' }
  ],
  'PJOK': [
    { tingkat: 'Sangat Paham', pernyataan: 'Mampu melakukan gerak dasar dan aktivitas olahraga dengan sangat baik, menunjukkan kebugaran, sportivitas, disiplin, serta memahami pentingnya pola hidup sehat.' },
    { tingkat: 'Paham', pernyataan: 'Mampu melakukan berbagai aktivitas gerak dan olahraga dengan baik serta menunjukkan sikap sportif dan disiplin.' },
    { tingkat: 'Mulai Paham', pernyataan: 'Mulai mampu melakukan gerakan dan aktivitas olahraga, tetapi masih memerlukan bimbingan untuk meningkatkan keterampilan dan kebugaran.' },
    { tingkat: 'Belum Paham', pernyataan: 'Masih memerlukan bimbingan dalam melakukan gerakan dasar, mengikuti aktivitas olahraga, dan menerapkan pola hidup sehat.' }
  ],
  'SBdP (Seni Budaya & Prakarya)': [
    { tingkat: 'Sangat Paham', pernyataan: 'Mampu mengeksplorasi, menciptakan, menampilkan, dan mengapresiasi karya seni dengan sangat baik, kreatif, dan percaya diri.' },
    { tingkat: 'Paham', pernyataan: 'Mampu menghasilkan dan menampilkan karya seni dengan baik serta menunjukkan kreativitas dan apresiasi terhadap karya.' },
    { tingkat: 'Mulai Paham', pernyataan: 'Mulai mampu menghasilkan karya seni, tetapi masih memerlukan arahan dalam mengembangkan ide, teknik, dan ekspresi.' },
    { tingkat: 'Belum Paham', pernyataan: 'Masih memerlukan bimbingan dalam mengeksplorasi ide, menggunakan teknik, dan menghasilkan karya seni.' }
  ],
  'Bahasa Inggris': [
    { tingkat: 'Sangat Paham', pernyataan: 'Mampu memahami dan menggunakan kosakata serta ungkapan sederhana dengan sangat baik dalam kegiatan menyimak, berbicara, membaca, dan menulis.' },
    { tingkat: 'Paham', pernyataan: 'Mampu memahami dan menggunakan kosakata serta ungkapan sederhana dengan baik dalam konteks yang sesuai.' },
    { tingkat: 'Mulai Paham', pernyataan: 'Mulai memahami kosakata dan ungkapan sederhana, tetapi masih memerlukan bantuan dalam penggunaannya.' },
    { tingkat: 'Belum Paham', pernyataan: 'Masih memerlukan bimbingan dalam memahami dan menggunakan kosakata serta ungkapan sederhana.' }
  ],
  'Baca Tulis Al-Quran': [
    { tingkat: 'Sangat Paham', pernyataan: 'Mampu membaca Al-Quran dengan tartil sesuai tajwid dan makhraj yang benar serta menulis huruf hijaiyah dan ayat dengan sangat tepat secara mandiri.' },
    { tingkat: 'Paham', pernyataan: 'Mampu membaca Al-Quran dengan tartil dan menulis huruf hijaiyah serta ayat sesuai kaidah dengan baik.' },
    { tingkat: 'Mulai Paham', pernyataan: 'Mulai mampu membaca dan menulis huruf hijaiyah, tetapi masih memerlukan bimbingan dalam tajwid dan kelancaran bacaan.' },
    { tingkat: 'Belum Paham', pernyataan: 'Masih memerlukan bimbingan dalam membaca dan menulis Al-Quran sesuai kaidah.' }
  ],
  'Bahasa dan Sastra Banjar': [
    { tingkat: 'Sangat Paham', pernyataan: 'Mampu memahami, menggunakan, dan mengapresiasi Bahasa dan Sastra Banjar secara lisan maupun tulisan dengan sangat baik, runtut, dan santun.' },
    { tingkat: 'Paham', pernyataan: 'Mampu memahami dan menggunakan Bahasa dan Sastra Banjar dengan baik dalam kehidupan sehari-hari dan apresiasi karya sastra daerah.' },
    { tingkat: 'Mulai Paham', pernyataan: 'Mulai mampu menyimak, berbicara, membaca, dan menulis dalam Bahasa Banjar, tetapi masih memerlukan bimbingan penggunaan yang tepat.' },
    { tingkat: 'Belum Paham', pernyataan: 'Masih memerlukan bimbingan dalam memahami dan menggunakan bahasa serta karya sastra Banjar.' }
  ],
  'TIK (Informatika / Komputer)': [
    { tingkat: 'Sangat Paham', pernyataan: 'Mampu menggunakan perangkat dan teknologi digital secara mandiri, kreatif, aman, dan bertanggung jawab serta mampu menyelesaikan masalah sederhana menggunakan teknologi.' },
    { tingkat: 'Paham', pernyataan: 'Mampu menggunakan perangkat dan aplikasi digital dengan baik serta memahami penggunaan teknologi secara aman dan bertanggung jawab.' },
    { tingkat: 'Mulai Paham', pernyataan: 'Mulai mampu memahami kosakata dan penggunaan perangkat serta aplikasi digital, tetapi masih memerlukan bimbingan dalam penerapannya.' },
    { tingkat: 'Belum Paham', pernyataan: 'Masih memerlukan bimbingan dalam mengoperasikan perangkat, menggunakan aplikasi, dan menerapkan perilaku digital yang aman.' }
  ]
};

const fallbackRubrik = (mapel: string): string =>
  `Mampu memahami materi ${mapel} dengan baik dan menerapkannya dalam kehidupan sehari-hari.`;

const getRubrikFor = (mapel: string): { tingkat: string; pernyataan: string }[] => {
  const match = SUBJ_RUBRIK_DESC[mapel] || Object.entries(SUBJ_RUBRIK_DESC).find(([k]) => mapel.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(mapel.toLowerCase()))?.[1];
  return match || [
    { tingkat: 'Sangat Paham', pernyataan: `Mampu memahami materi ${mapel} dengan sangat baik.` },
    { tingkat: 'Paham', pernyataan: fallbackRubrik(mapel) },
    { tingkat: 'Mulai Paham', pernyataan: `Mulai memahami materi ${mapel}, tetapi masih memerlukan arahan.` },
    { tingkat: 'Belum Paham', pernyataan: `Masih memerlukan bimbingan dalam memahami materi ${mapel}.` }
  ];
};

const fallbackCp = (mapel: string): string =>
  `Peserta didik mampu memahami konsep dasar ${mapel}, mengaplikasikannya dalam kehidupan sehari-hari, serta mengomunikasikan hasil belajarnya secara logis, kreatif, dan bertanggung jawab.`;
const getCpFor = (mapel: string): string => SUBJ_CP[mapel] || fallbackCp(mapel);

// Analisa Data dan Peluang otomatis berdasarkan mata pelajaran yang dipilih guru
const SUBJ_ADP: Record<string, string> = {
  'Pendidikan Pancasila (PKN)': 'Peserta didik mampu mengumpulkan data sederhana tentang kehidupan bermasyarakat, keberagaman, hak dan kewajiban warga negara, kemudian mengolah, menganalisis, dan menyajikan informasi sebagai dasar untuk mengambil keputusan yang bertanggung jawab sesuai nilai-nilai Pancasila.',
  'Pendidikan Agama Islam': 'Peserta didik mampu mengumpulkan, mengelompokkan, dan menganalisis informasi sederhana mengenai penerapan nilai-nilai keagamaan dalam kehidupan sehari-hari, kemudian menyajikan hasilnya dalam bentuk tabel, gambar, grafik sederhana, atau laporan sebagai dasar pengambilan keputusan yang mencerminkan akhlak mulia.',
  'Baca Tulis Al-Quran': 'Peserta didik mampu mengumpulkan dan menganalisis informasi mengenai bacaan, tajwid, makhraj, serta makna ayat Al-Qur\u2019an, kemudian menyajikan hasil analisisnya untuk memperbaiki kualitas bacaan dan penulisan serta mengamalkannya dalam kehidupan sehari-hari.',
  'Bahasa Indonesia': 'Peserta didik mampu menemukan, mengelompokkan, membandingkan, dan menganalisis informasi dari berbagai jenis teks, grafik, tabel, diagram, maupun media digital, kemudian menyimpulkan dan menyampaikan informasi secara lisan maupun tulisan secara logis dan sistematis.',
  'Matematika': 'Peserta didik mampu mengumpulkan, menyajikan, membaca, menganalisis, dan menafsirkan data dalam bentuk tabel, diagram, grafik, serta memahami konsep peluang sederhana untuk memecahkan masalah dalam kehidupan sehari-hari.',
  'IPAS (Ilmu Pengetahuan Alam dan Sosial)': 'Peserta didik mampu mengumpulkan data hasil pengamatan, percobaan, atau investigasi lingkungan, mengolah dan menganalisis data tersebut, kemudian menyimpulkan hubungan sebab-akibat sebagai dasar pengambilan keputusan yang bertanggung jawab terhadap lingkungan dan kehidupan sosial.',
  'TIK (Informatika / Komputer)': 'Peserta didik mampu mengumpulkan, mengolah, menganalisis, memvisualisasikan, dan menginterpretasikan data menggunakan perangkat digital, serta memahami konsep peluang sederhana, pengambilan keputusan berbasis data, dan berpikir komputasional dalam menyelesaikan masalah.',
  'Bahasa dan Sastra Banjar': 'Peserta didik mampu mengumpulkan dan menganalisis informasi tentang bahasa, sastra, adat, budaya, permainan tradisional, makanan khas, serta kearifan lokal Banjar melalui wawancara, observasi, atau berbagai sumber informasi, kemudian menyajikan hasilnya dalam bentuk laporan, tabel, poster, atau presentasi sederhana sebagai upaya pelestarian budaya daerah.',
  'SBdP (Seni Budaya & Prakarya)': 'Peserta didik mampu mengumpulkan informasi mengenai karya seni, budaya, dan proses berkarya, kemudian menganalisis karakteristik, fungsi, serta menyajikan hasil pengamatan sebagai inspirasi dalam menciptakan karya kreatif.',
  'PJOK': 'Peserta didik mampu mengumpulkan dan menganalisis data sederhana mengenai aktivitas fisik, kebugaran, pola hidup sehat, maupun hasil pengukuran kebugaran, kemudian menggunakannya untuk meningkatkan kesehatan diri secara berkelanjutan.',
  'Bahasa Inggris': 'Peserta didik mampu memperoleh informasi sederhana dari teks, gambar, tabel, grafik, maupun media digital berbahasa Inggris, kemudian mengelompokkan, menganalisis, dan menyajikan kembali informasi tersebut dalam bentuk lisan maupun tulisan sederhana.'
};

const fallbackAdp = (mapel: string): string =>
  `Peserta didik mampu mengumpulkan, mengolah, menganalisis, dan menyajikan data atau informasi sederhana terkait ${mapel}, kemudian menggunakannya sebagai dasar pengambilan keputusan dalam kehidupan sehari-hari.`;
const getAdpFor = (mapel: string): string => SUBJ_ADP[mapel] || fallbackAdp(mapel);

// Ringkasan materi otomatis berdasarkan mata pelajaran yang dipilih guru (umum jenjang SD)
const SUBJ_MATERI: Record<string, string> = {
  'Pendidikan Pancasila (PKN)': 'Materi mengembangkan pemahaman peserta didik terhadap nilai-nilai Pancasila, hak dan kewajiban sebagai warga negara, keberagaman, demokrasi, gotong royong, persatuan, serta sikap cinta tanah air. Pembelajaran mendorong peserta didik menjadi warga negara yang berkarakter, bertanggung jawab, menghargai perbedaan, serta mampu berpartisipasi aktif dalam kehidupan bermasyarakat.',
  'Pendidikan Agama Islam': 'Pembelajaran berfokus pada penguatan keimanan, ketakwaan kepada Tuhan Yang Maha Esa, pembentukan akhlak mulia, serta pembiasaan perilaku terpuji dalam kehidupan sehari-hari. Peserta didik mempelajari ajaran agama sesuai keyakinannya melalui pemahaman ibadah, kisah keteladanan, nilai-nilai moral, toleransi, kasih sayang, kepedulian, dan tanggung jawab sebagai wujud pengamalan ajaran agama.',
  'Baca Tulis Al-Quran': 'Pengenalan huruf hijaiyah dan tanda baca; makhraj dan sifat huruf; hukum bacaan tajwid dasar (nun mati, mim mati, mad); membaca Al-Qur\u2019an dengan tartil; menulis huruf hijaiyah dan kalimat sederhana; menghafal surat-surat pendek; serta memahami makna singkat ayat yang dipelajari.',
  'Bahasa Indonesia': 'Pembelajaran mengembangkan kemampuan menyimak, berbicara, membaca, memirsa, menulis, dan mempresentasikan berbagai jenis teks sesuai tingkat perkembangan peserta didik. Materi meliputi pengembangan literasi, kemampuan memahami informasi, berpikir kritis, mengemukakan gagasan secara santun, serta menghasilkan karya tulis sederhana maupun kreatif sebagai sarana komunikasi yang efektif.',
  'Matematika': 'Materi berfokus pada pemahaman konsep bilangan, operasi hitung, pola, pengukuran, geometri, data, dan peluang sederhana. Pembelajaran mengembangkan kemampuan bernalar, memecahkan masalah, berpikir logis, menganalisis informasi kuantitatif, serta menerapkan konsep matematika dalam berbagai situasi kehidupan sehari-hari.',
  'IPAS (Ilmu Pengetahuan Alam dan Sosial)': 'Pembelajaran mengintegrasikan konsep ilmu pengetahuan alam dan ilmu pengetahuan sosial melalui kegiatan mengamati, menyelidiki, bereksperimen, dan memecahkan masalah. Materi mencakup makhluk hidup, lingkungan, energi, bumi dan alam semesta, kehidupan sosial, budaya, ekonomi, sejarah, serta interaksi manusia dengan lingkungan untuk membangun kepedulian terhadap keberlanjutan kehidupan.',
  'TIK (Informatika / Komputer)': 'Pembelajaran membekali peserta didik dengan literasi digital, pengenalan perangkat komputer, internet, keamanan digital, berpikir komputasional, analisis data, algoritma, serta penggunaan berbagai aplikasi untuk menghasilkan karya digital secara kreatif, aman, bertanggung jawab, dan beretika.',
  'Bahasa dan Sastra Banjar': 'Materi mengembangkan kemampuan menyimak, berbicara, membaca, dan menulis dalam Bahasa Banjar, serta memahami sastra dan budaya Banjar sebagai bagian dari identitas daerah. Peserta didik mempelajari kosakata, percakapan, cerita rakyat, pantun, syair, madihin, peribahasa, adat istiadat, permainan tradisional, lagu daerah, makanan khas, dan berbagai bentuk kearifan lokal guna menumbuhkan rasa bangga serta kepedulian terhadap pelestarian budaya Banjar.',
  'SBdP (Seni Budaya & Prakarya)': 'Pembelajaran mengembangkan kreativitas, apresiasi estetika, dan kemampuan berekspresi melalui seni rupa, musik, tari, dan teater. Peserta didik belajar menciptakan karya seni, memahami unsur-unsur seni, menghargai karya sendiri maupun orang lain, serta mengenal dan melestarikan seni budaya daerah maupun nasional.',
  'PJOK': 'Materi bertujuan mengembangkan keterampilan gerak, kebugaran jasmani, kesehatan fisik dan mental, permainan, olahraga, keselamatan diri, serta pola hidup sehat. Pembelajaran menumbuhkan sportivitas, disiplin, kerja sama, tanggung jawab, dan kebiasaan hidup aktif sepanjang hayat.',
  'Bahasa Inggris': 'Materi mengembangkan kemampuan berkomunikasi sederhana dalam Bahasa Inggris melalui kegiatan menyimak, berbicara, membaca, dan menulis. Peserta didik mempelajari kosakata, ungkapan, kalimat sederhana, serta penggunaan bahasa dalam konteks kehidupan sehari-hari sehingga tumbuh rasa percaya diri dan minat belajar bahasa asing sebagai sarana komunikasi global.'
};

const fallbackMateri = (mapel: string): string =>
  `Materi pokok ${mapel} meliputi pemahaman konsep dasar, aplikasi dalam kehidupan sehari-hari, latihan keterampilan, serta kegiatan penguatan karakter sesuai tahap perkembangan peserta didik jenjang Sekolah Dasar.`;
const getMateriFor = (mapel: string): string => SUBJ_MATERI[mapel] || fallbackMateri(mapel);

// Pengayaan & Remedial disesuaikan dengan mapel dan topik materi yang dipilih guru
// Sistem MEMILIH salah satu dari 3 jenis kalimat yang paling tepat untuk mapel terpilih
const PENG_VARIANTS = [
  'Peserta didik yang telah mencapai tujuan pembelajaran diberikan tugas membuat poster digital tentang {M}, mencari informasi tambahan dari berbagai sumber, kemudian mempresentasikan hasilnya kepada teman sekelas.',
  'Peserta didik yang telah mencapai tujuan pembelajaran diberikan tugas pengembangan berupa proyek, studi kasus, atau soal HOTS terkait {M}.',
  'Peserta didik mencari informasi dari berbagai sumber dan mempresentasikan hasilnya. Peserta didik membuat produk kreatif yang berkaitan dengan {M}.'
];
const REM_VARIANTS = [
  'Peserta didik yang belum mencapai tujuan pembelajaran memperoleh bimbingan secara individu atau kelompok kecil, mengulang materi {M} menggunakan media yang lebih sederhana, mengerjakan latihan tambahan, kemudian mengikuti asesmen ulang.',
  'Guru memberikan pembelajaran ulang dengan pendekatan yang lebih sederhana. Peserta didik mengerjakan latihan sesuai kesulitan yang dialami pada {M}.',
  'Guru melakukan bimbingan individu atau kelompok kecil. Peserta didik mengikuti asesmen ulang setelah pendampingan pada {M}.'
];

// Pilihan varian Pengayaan yang paling sesuai per mapel
const PENG_VMAP: Record<string, number> = {
  'SBdP (Seni Budaya & Prakarya)': 0,
  'IPAS (Ilmu Pengetahuan Alam dan Sosial)': 0,
  'Pendidikan Pancasila (PKN)': 0,
  'Matematika': 1,
  'TIK (Informatika / Komputer)': 1,
  'Bahasa Indonesia': 2,
  'Bahasa dan Sastra Banjar': 2,
  'Pendidikan Agama Islam': 2,
  'Baca Tulis Al-Quran': 2,
  'PJOK': 2,
  'Bahasa Inggris': 2
};
// Pilihan varian angka yang relevancy per mapel untuk Remedial
const REM_VMAP: Record<string, number> = {
  'Matematika': 1,
  'TIK (Informatika / Komputer)': 1,
  'SBdP (Seni Budaya & Prakarya)': 2,
  'PJOK': 2,
  'Bahasa Inggris': 2
};

const fillVariant = (s: string, materi: string): string =>
  s.replaceAll('{M}', materi.trim() || 'materi yang dipelajari');

const buildPengayaan = (mapel: string, materi: string): string =>
  fillVariant(PENG_VARIANTS[PENG_VMAP[mapel] ?? 0], materi);

const buildRemedial = (mapel: string, materi: string): string =>
  fillVariant(REM_VARIANTS[REM_VMAP[mapel] ?? 0], materi);

// Lintas Disiplin Ilmu per mapel, menyisipkan {M} = topik materi yang ditulis guru
const SUBJ_LINTAS: Record<string, string> = {
  'IPAS (Ilmu Pengetahuan Alam dan Sosial)': 'Pembelajaran materi "{M}" dikaitkan dengan mata pelajaran lain secara terpadu:\n• IPA: mengkaji konsep ekosistem, konservasi, habitat, dan spesies endemik terkait materi.\n• IPS: mengkaji sejarah, geografi (lokasi), kehidupan sosial, serta pariwisata.\n• Matematika: membaca dan menginterpretasi data pada grafik, tabel, atau diagram.\n• Bahasa Indonesia: menyusun laporan hasil pengamatan atau presentasi.',
  'Pendidikan Pancasila (PKN)': 'Pembelajaran materi "{M}" dikaitkan dengan mata pelajaran lain:\n• IPAS: memahami kehidupan bermasyarakat dan lingkungan.\n• Bahasa Indonesia: mengemukakan pendapat dan nilai secara santun.\n• Seni Budaya: mengenal simbol-simbol dan budaya daerah.\n• PPKn lintas: menerapkan nilai gotong royong dan demokrasi.',
  'Pendidikan Agama Islam': 'Pembelajaran materi "{M}" dikaitkan dengan karakter dan akhlak mulia pada mapel lain:\n• PKn: toleransi dan cinta tanah air.\n• Bahasa Indonesia: sikap santun dalam bertutur.\n• Seni Budaya: apresiasi seni religius dan budaya santun.\n• IPAS: wujud syukur terhadap alam ciptaan Tuhan.',
  'Baca Tulis Al-Quran': 'Pembelajaran materi "{M}" dikaitkan dengan capaian lain:\n• Bahasa Indonesia: pelafalan dan makna kosakata.\n• Pendidikan Agama Islam: pemahaman kandungan ayat.\n• Seni Budaya: seni kaligrafi dan senandung Al-Quran.\n• Matematika: penghitungan bacaan (mad) dalam tajwid.',
  'Bahasa Indonesia': 'Pembelajaran materi "{M}" dikaitkan dengan mapel lain:\n• IPAS: gagas dari teks tentang alam dan sosial.\n• Matematika: data dalam teks eksposisi.\n• Pendidikan Pancasila: nilai dalam cerita rakyat.\n• Seni Budaya: drama/teks cerita pendek.',
  'Matematika': 'Pembelajaran materi "{M}" dikaitkan dengan mapel lain:\n- IPAS: pengukuran dan data percobaan alam.\n- Bahasa Indonesia: membaca soal cerita secara kritis.\n- TIK: mengolah data menggunakan aplikasi/grafik digital.\n- PJOK: pengukuran jarak/waktu dalam aktivitas fisik.',
  'TIK (Informatika / Komputer)': 'Pembelajaran materi "{M}" dikaitkan dengan mapel lain:\n• Matematika: analisis dan visualisasi data.\n• Bahasa Indonesia: menyusun konten digital yang santun.\n• IPAS: mengolah data percobaan sederhana.\n- Seni Budaya: menciptakan karya digital kreatif.',
  'Bahasa dan Sastra Banjar': 'Pembelajaran materi "{M}" dikaitkan dengan mapel lain:\n• IPAS: kearifan lokal dan budaya daerah.\n• Bahasa Indonesia: perbandingan kosakata dan sastra.\n• Seni Budaya: madihin, lagu, dan tari daerah.\n• IPS: sejarah dan adat istiadat Banjar.',
  'SBdP (Seni Budaya & Prakarya)': 'Pembelajaran materi "{M}" dikaitkan dengan mapel lain:\n• IPAS: pengetahuan alam sebagai inspirasi karya.\n• Bahasa Indonesia: teks cerita untuk pertunjukan.\n• Matematika: pola dan simetri dalam seni rupa.\n- IPS: budaya daerah dan nasional.',
  'PJOK': 'Pembelajaran materi "{M}" dikaitkan dengan mapel lain:\n• IPAS: ciri-ciri aktivitas fisik dan kesehatan.\n• Matematika: menghitung rasio waktu, jarak, denyut nadi.\n• Bahasa Indonesia: instruksi gerakan.\n- PPKn: sportivitas, disiplin, kepatuhan aturan.',
  'Bahasa Inggris': 'Pembelajaran materi "{M}" dikaitkan dengan mapel lain:\n• Bahasa Indonesia: perbandingan ungkapan antar bahasa.\n• Matematika: angka dan waktu dalam bahasa Inggris.\n- IPAS: menyebut benda alam dalam kosakata Bahasa Inggris.\n• Seni Budaya: lagu sederhana berbahasa Inggris.'
};

const buildLintasDisiplin = (mapel: string, materi: string): string => {
  const topik = materi.trim();
  const tmpl = SUBJ_LINTAS[mapel] || 'Pembelajaran materi "{M}" dikaitkan dengan mata pelajaran lain (Bahasa Indonesia, Matematika, dan IPAS) agar pemahaman bermakna dan aplikatif dalam kehidupan sehari-hari.';
  return tmpl.replace(/\{M\}/g, topik || mapel);
};

// Deskripsi komponen Desain Pembelajaran per Fase (A/B/C) sesuai data guru
const FASE_DESA = {
  A: {
    lintas: 'Pembelajaran mengintegrasikan berbagai mata pelajaran melalui tema yang dekat dengan kehidupan peserta didik, seperti diri sendiri, keluarga, sekolah, dan lingkungan sekitar. Peserta didik diajak menghubungkan pengalaman nyata dengan konsep yang dipelajari sehingga memperoleh pemahaman yang utuh.',
    tujuan: 'Peserta didik mampu mengenal konsep-konsep dasar, mengembangkan keterampilan awal, membangun kebiasaan belajar yang positif, serta menunjukkan karakter yang mencerminkan Profil Lulusan melalui aktivitas bermain, mengamati, bertanya, mencoba, dan berkreasi.',
    praktik: 'Pembelajaran dilaksanakan melalui Pembelajaran Bermakna (Meaningful Learning) dengan mengaitkan materi pada pengalaman sehari-hari; Pembelajaran Menyenangkan (Joyful Learning) melalui permainan edukatif, lagu, cerita, demonstrasi, eksperimen sederhana, dan aktivitas kreatif; serta Pembelajaran Penuh Kesadaran (Mindful Learning) dengan membangun kebiasaan refleksi sederhana, rasa syukur, disiplin, dan kepedulian terhadap diri sendiri maupun lingkungan sekitar.',
    digital: 'Guru memanfaatkan media digital interaktif, video pembelajaran, animasi, permainan edukasi, gambar, audio, dan aplikasi sederhana untuk memperkuat pengalaman belajar peserta didik secara aman, menarik, dan sesuai tahap perkembangannya.'
  },
  B: {
    lintas: 'Pembelajaran menghubungkan berbagai konsep antar mata pelajaran untuk menyelesaikan permasalahan kontekstual yang berkaitan dengan kehidupan sehari-hari, lingkungan, budaya, teknologi, kesehatan, dan masyarakat sehingga peserta didik memperoleh pengalaman belajar yang lebih terpadu.',
    tujuan: 'Peserta didik mampu memahami konsep secara mendalam, mengembangkan kemampuan berpikir kritis dan kreatif, berkolaborasi, berkomunikasi secara efektif, serta menerapkan hasil belajar dalam kehidupan sehari-hari melalui berbagai aktivitas pembelajaran yang bermakna.',
    praktik: 'Pembelajaran menerapkan Meaningful Learning melalui pemecahan masalah nyata, Joyful Learning melalui proyek, permainan edukatif, eksperimen, diskusi kelompok, dan presentasi, serta Mindful Learning melalui refleksi, evaluasi diri, dan pembiasaan berpikir sebelum mengambil keputusan. Guru memfasilitasi pembelajaran yang aktif, kolaboratif, dan berpusat pada peserta didik.',
    digital: 'Peserta didik memanfaatkan teknologi digital untuk mencari informasi, menggunakan aplikasi pembelajaran, membuat presentasi sederhana, menghasilkan karya digital, serta berkomunikasi dan berkolaborasi secara bertanggung jawab di bawah bimbingan guru.'
  },
  C: {
    lintas: 'Pembelajaran mengintegrasikan berbagai disiplin ilmu melalui kegiatan investigasi, proyek, penelitian sederhana, dan pemecahan masalah kontekstual yang berkaitan dengan lingkungan, sosial, budaya, sains, teknologi, dan kewirausahaan sehingga peserta didik memperoleh pengalaman belajar yang holistik.',
    tujuan: 'Peserta didik mampu menguasai konsep secara mendalam, menghasilkan karya yang kreatif dan inovatif, memecahkan masalah secara sistematis, mengomunikasikan hasil pemikiran secara efektif, serta menunjukkan karakter sebagai pembelajar sepanjang hayat sesuai Profil Lulusan.',
    praktik: 'Pembelajaran dilaksanakan melalui Meaningful Learning dengan mengaitkan materi pada kehidupan nyata dan isu-isu kontekstual, Joyful Learning melalui pembelajaran berbasis proyek, studi kasus, eksperimen, simulasi, debat, dan kolaborasi, serta Mindful Learning melalui refleksi mendalam, penilaian diri, pengambilan keputusan, dan pengembangan kesadaran belajar secara mandiri. Guru berperan sebagai fasilitator, pembimbing, dan mitra belajar dalam mengembangkan kompetensi peserta didik secara optimal.',
    digital: 'Peserta didik memanfaatkan teknologi digital untuk melakukan pencarian informasi, analisis data, kolaborasi, pembuatan dokumen, presentasi, multimedia, pemrograman dasar, asesmen digital, serta menghasilkan karya inovatif dengan menerapkan etika, keamanan, dan tanggung jawab dalam penggunaan teknologi.'
  }
};
const faseKeyOf = (b: Biodata): 'A' | 'B' | 'C' => {
  const f = (b.fase || '').toUpperCase();
  return f === 'C' ? 'C' : f === 'B' ? 'B' : 'A';
};

// Bangun CP & komponen Desain Pembelajaran agar mengarah ke topik materi yang ditulis guru
const generateKontekstual = (mapel: string, faseKey: 'A' | 'B' | 'C', faseKelas: string, materi: string) => {
  const base = FASE_DESA[faseKey] || FASE_DESA.A;
  const topik = materi.trim();
  const fokus = (t: string) => topik ? `${t} Fokus pembelajaran pada materi "${topik}" (${faseKelas}).` : t;
  return {
    cp: fokus(getCpFor(mapel)),
    lintasDisiplin: buildLintasDisiplin(mapel, materi),
    tujuanPembelajaran: fokus(base.tujuan),
    praktikPedagogis: fokus(base.praktik),
    pemanfaatanDigital: fokus(base.digital)
  };
};

const TEMPLATE_AWAL = 'Berkesadaran/Bermakna: salam, doa, dan menyiapkan kesiapan siswa.\nApersepsi: mengaitkan materi dengan pengalaman sehari-hari.\nRefleksi dinamika kesepakatan kelas & penyampaian tujuan.';
// Deskripsi Kegiatan Inti disesuaikan dengan mata pelajaran yang dipilih guru
const buildIntiTemplate = (mapel: string): string => {
  const m = (mapel || '').trim();
  const konteks = m
    ? ` sesuai dengan karakteristik materi ${m}`
    : '';
  const contohAktifitas = (() => {
    const mLower = m.toLowerCase();
    if (mLower.includes('bahasa indonesia')) {
      return 'Dalam Bahasa Indonesia, peserta didik dapat mengolah informasi dari teks dan menyajikannya dalam bentuk tulisan atau presentasi.';
    }
    if (mLower.includes('matematika')) {
      return 'Dalam Matematika, peserta didik dapat menggunakan konsep dan prosedur untuk menyelesaikan masalah kontekstual.';
    }
    if (mLower.includes('ipas') || mLower.includes('alam dan sosial')) {
      return 'Dalam IPAS, peserta didik dapat melakukan pengamatan atau penyelidikan sederhana dan mengolah hasilnya.';
    }
    if (mLower.includes('pancasila') || mLower.includes('pkn')) {
      return 'Pada Pendidikan Pancasila, peserta didik dapat menganalisis situasi dan mempraktikkan nilai-nilai Pancasila dalam kehidupan sehari-hari.';
    }
    if (mLower.includes('agama')) {
      return 'Pada Pendidikan Agama, peserta didik dapat menganalisis situasi dan mempraktikkan nilai-nilai ajaran yang dipelajari.';
    }
    if (mLower.includes('pjok')) {
      return 'Pada PJOK, peserta didik dapat mempraktikkan berbagai gerak dan aktivitas kebugaran jasmani.';
    }
    if (mLower.includes('sbdp') || mLower.includes('seni')) {
      return 'Pada Seni, peserta didik dapat mengeksplorasi teknik dan menghasilkan karya seni sederhana.';
    }
    if (mLower.includes('inggris')) {
      return 'Dalam Bahasa Inggris, peserta didik dapat menggunakan bahasa untuk menyelesaikan tugas dan menghasilkan produk yang bermakna.';
    }
    if (mLower.includes('informatika') || mLower.includes('tik') || mLower.includes('komputer')) {
      return 'Pada Informatika, peserta didik dapat menggunakan teknologi untuk menyelesaikan tugas dan menghasilkan karya digital yang bermakna.';
    }
    if (mLower.includes('banjar')) {
      return 'Pada Bahasa dan Sastra Banjar, peserta didik dapat menggunakan bahasa daerah untuk mengapresiasi dan menghasilkan karya sastra sederhana.';
    }
    if (mLower.includes('al-quran') || mLower.includes('quran')) {
      return 'Pada Baca Tulis Al-Quran, peserta didik dapat berlatih membaca dan menulis Al-Quran sesuai kaidah yang dipelajari.';
    }
    return '';
  })();

  return `1. MEMAHAMI (Mindful & Joyful)

Peserta didik mengikuti proses pembelajaran dengan penuh perhatian dan dalam suasana yang menyenangkan melalui kegiatan mengamati, menyimak, membaca, berdiskusi, mencoba, atau mengeksplorasi berbagai sumber dan pengalaman belajar${konteks}. Peserta didik menghubungkan pengetahuan dan pengalaman awal dengan pembelajaran yang akan dilakukan, mengidentifikasi informasi, konsep, keterampilan, atau permasalahan yang relevan, serta mengajukan dan menjawab pertanyaan pemantik untuk membangun pemahaman terhadap tujuan pembelajaran. Guru memberikan rangsangan, arahan, dan pendampingan sesuai kebutuhan peserta didik agar proses memahami berlangsung secara aktif, bertahap, bermakna, dan menyenangkan.


2. MENGAPLIKASI (Meaningful & Joyful)

Peserta didik menerapkan pemahaman, pengetahuan, dan keterampilan yang telah diperoleh melalui berbagai aktivitas belajar yang sesuai dengan karakteristik mata pelajaran${konteks} dan tujuan pembelajaran. Peserta didik melakukan eksplorasi, praktik, latihan, diskusi, pemecahan masalah, penyelidikan, penciptaan, simulasi, atau kegiatan lain yang relevan secara individu maupun kelompok. ${contohAktifitas ? contohAktifitas + ' ' : ''}Peserta didik menggunakan pengetahuan dan keterampilannya untuk menyelesaikan tugas, menghadapi situasi atau permasalahan, menghasilkan karya atau hasil belajar, serta mengomunikasikan proses dan hasil pembelajaran. Guru memberikan bimbingan, penguatan, dan umpan balik agar peserta didik mampu mengembangkan kemampuan berpikir, kreativitas, komunikasi, kolaborasi, kemandirian, dan penerapan pengetahuan dalam konteks kehidupan nyata.


3. MEREFLEKSI (Mindful & Meaningful)

Peserta didik meninjau kembali proses dan hasil pembelajaran dengan menyampaikan pemahaman, pengalaman, hal yang sudah dikuasai, serta kesulitan atau tantangan yang dihadapi selama kegiatan belajar. Peserta didik menyusun atau menyampaikan kesimpulan, menghubungkan pengetahuan dan keterampilan yang diperoleh dengan pengalaman serta kehidupan sehari-hari, dan melakukan evaluasi terhadap proses maupun hasil belajarnya. Peserta didik menerima dan memberikan umpan balik secara positif serta menentukan hal yang perlu dipertahankan, diperbaiki, atau dikembangkan sebagai tindak lanjut pembelajaran. Guru memfasilitasi refleksi dan memberikan penguatan untuk membantu peserta didik menyadari perkembangan belajarnya dan membangun motivasi untuk belajar secara berkelanjutan.`;
};
const TEMPLATE_PENUTUP = 'Menyimpulkan materi.\nMenyusun rencana tindak lanjut.\nMemuliakan & apresiasi.\nDoa penutup.';

// Fase/Kelas otomatis mengikuti data Biodata Kelas yang diisi guru
const faseKelasOf = (b: Biodata): string =>
  [b.fase, b.kelas].filter(Boolean).join(' · ') || 'Kelas II';

// Alokasi waktu: 1 JP = 35 menit. Total dibagi otomatis
// Awal 15% - Inti (sisanya) - Penutup 15%
const timeSplit = (jp: string): { total: number; awal: number; inti: number; penutup: number } => {
  const total = (parseInt(jp) || 0) * 35;
  if (total <= 0) return { total: 0, awal: 0, inti: 0, penutup: 0 };
  const awal = Math.round(total * 0.15);
  const penutup = Math.round(total * 0.15);
  const inti = Math.max(0, total - awal - penutup);
  return { total, awal, inti, penutup };
};

const emptyForm = (biodata: Biodata): RpmState => ({
  tahunPelajaran: '2025/2026',
  hari: '',
  tanggal: '',
  mapel: SYSTEM_SUBJECTS[0],
  bab: 'Bab 1',
  materi: '',
  materiGambar: '',
  jp: '2',
  targetPeserta: TARGET_OPTIONS[0],
  jumlahPeserta: '',
  sarana: '',
  media: ['IFP (Interactive Flat Panel)', 'Lembar Kerja (LKPD)'],
  alatBahan: '',
  ppp: ['Penalaran Kritis', 'Kreativitas'],
  pendekatan: 'Deep Learning',
  model: 'Model Pembelajaran Deep Learning',
  metode: 'Diskusi',
  cp: '',
  lintasDisiplin: '',
  tujuanPembelajaran: '',
  praktikPedagogis: '',
  pemanfaatanDigital: '',
  analisaData: '',
  tps: [],
  elemen: '',
  pertanyaanPemantik: '',
  pemahamanBermakna: '',
  persiapan: '',
  diagnostik: emptyDiag(),
  skenario: [{ id: 1, judul: 'Pertemuan 1', awal: TEMPLATE_AWAL, inti: buildIntiTemplate(SYSTEM_SUBJECTS[0]), penutup: TEMPLATE_PENUTUP }],
  rubrik: [
    { id: 1, pernyataan: 'Saya dapat mengambil pesan/hikmah dari sebuah cerita legenda.', mapel: SYSTEM_SUBJECTS[0], tingkat: 'Paham' },
    { id: 2, pernyataan: 'Saya dapat membedakan mana kalimat yang berupa fakta dan mana yang opini.', mapel: SYSTEM_SUBJECTS[0], tingkat: 'Paham' },
    { id: 3, pernyataan: 'Saya bisa membaca informasi dari sebuah grafik.', mapel: SYSTEM_SUBJECTS[0], tingkat: 'Paham' },
    { id: 4, pernyataan: 'Saya bisa menulis laporan dari sesuatu yang saya amati.', mapel: SYSTEM_SUBJECTS[0], tingkat: 'Paham' },
    { id: 5, pernyataan: 'Saya sadar bahwa menjaga alam dan situs sejarah itu penting.', mapel: SYSTEM_SUBJECTS[0], tingkat: 'Paham' }
  ],
  lembarSiswa: [
    { id: 1, nomor: '1', nama: '', mapel: SYSTEM_SUBJECTS[0], kelompok: '', mendengarkan: '', nonVerbal: '', prestasi: '' },
    { id: 2, nomor: '2', nama: '', mapel: SYSTEM_SUBJECTS[0], kelompok: '', mendengarkan: '', nonVerbal: '', prestasi: '' },
    { id: 3, nomor: '3', nama: '', mapel: SYSTEM_SUBJECTS[0], kelompok: '', mendengarkan: '', nonVerbal: '', prestasi: '' },
    { id: 4, nomor: '4', nama: '', mapel: SYSTEM_SUBJECTS[0], kelompok: '', mendengarkan: '', nonVerbal: '', prestasi: '' }
  ],
  remedial: '',
  pengayaan: '',
  asesmenAwal: 'Tes awal (pretest) singkat, observasi kesiapan belajar peserta didik, dan tanya jawab pemetaan pengetahuan awal untuk mengelompokkan peserta didik berdasarkan kebutuhan belajarnya.',
  asesmenProses: 'Observasi keterlibatan selama pembelajaran, kuis, diskusi/tanya jawab, dan refleksi peserta didik pada tahap Memahami, Mengaplikasi, serta Merefleksi untuk memberikan umpan balik berkelanjutan.',
  asesmenSumatif: 'Tes tulis (pilihan ganda/uraian), penilaian proyek/kinerja, atau portofolio untuk mengukur ketercapaian tujuan pembelajaran pada akhir bab.'
});

const emptyDiag = (): RpmDiag[] => [
  { id: 1, kategori: 'Pengetahuan Awal', deskripsi: '' },
  { id: 2, kategori: 'Minat Belajar', deskripsi: '' },
  { id: 3, kategori: 'Kebutuhan Belajar', deskripsi: '' }
];

// Cocokkan nama mapel (mis. "Pendidikan Pancasila (PKN)") dengan kunci data sistem
const fuzzySubjectKey = (mapel: string, keys: string[]): string | undefined => {
  const mL = mapel.toLowerCase();
  return keys.find((k) => {
    const kL = k.toLowerCase();
    if (mL === kL) return true;
    if (mL.includes(kL) || kL.includes(mL)) return true;
    if ((mL.includes('pkn') || mL.includes('pancasila')) && (kL.includes('pkn') || kL.includes('pancasila'))) return true;
    if (mL.includes('sbdp') && (kL.includes('sbdp') || kL.includes('seni'))) return true;
    if (mL.includes('tik') && (kL.includes('tik') || kL.includes('informatika') || kL.includes('komputer'))) return true;
    if (mL.includes('inggris') && kL.includes('inggris')) return true;
    if (mL.includes('banjar') && kL.includes('banjar')) return true;
    if (mL.includes('pjok') && kL.includes('pjok')) return true;
    return false;
  });
};

// ==== Profil deskripsi per mapel (berdasarkan gaya contoh Identifikasi Murid) ====
const SUBJ_PROFILE: Record<string, { kaya: string; kurang: string; minat: string; visual: string; makna: string; gembira: string; sadar: string }> = {
  pancasila: {
    kaya: 'pemahaman dasar tentang nilai-nilai Pancasila dan aturan yang berlaku di lingkungan sekolah, keluarga, dan masyarakat',
    kurang: 'menerapkan nilai Pancasila pada kasus/peristiwa nyata dan membedakan perbuatan yang mencerminkan sikap baik dan kurang baik',
    minat: 'cerita keteladanan tokoh, kegiatan berdiskusi, dan permainan peran',
    visual: 'gambar simbol Pancasila dan bagan nilai',
    makna: 'mengaitkan nilai Pancasila dan semangat gotong royong dengan sikap serta tanggung jawab dalam kehidupan sehari-hari',
    gembira: 'bercerita tentang tokoh keteladanan, permainan kartu nilai, dan kegiatan bermain peran',
    sadar: 'mengamati sikap dan peristiwa di sekitar kemudian merefleksikan hikmah penerapan nilai Pancasila'
  },
  indonesia: {
    kaya: 'kemampuan membaca dan memahami alur cerita sederhana serta perbendaharaan kosakata',
    kurang: 'membedakan fakta dan opini, menangkap informasi visual seperti grafik, dan menulis laporan/teks secara sistematis',
    minat: 'cerita petualangan, dongeng, dan cerita rakyat',
    visual: 'gambar, peta cerita, dan grafik',
    makna: 'mengaitkan isi teks dengan pengalaman serta nilai kehidupan untuk menumbuhkan budi pekerti',
    gembira: 'bercerita, bermain peran tokoh, dan permainan kosakata bersama',
    sadar: 'mengamati isi teks dengan saksama dan merefleksikan amanat atau hikmah dari cerita'
  },
  matematika: {
    kaya: 'kemampuan menghitung dasar, mengenal bilangan, dan pola sederhana',
    kurang: 'menerapkan konsep pada soal cerita, menganalisis data seperti grafik, dan menyajikan langkah penyelesaian secara runtut',
    minat: 'permainan angka, tantangan teka-teki, dan kegiatan berkelompok',
    visual: 'diagram, bagan, dan benda konkret',
    makna: 'menghubungkan konsep matematika dengan situasi nyata sehari-hari agar bermakna bagi kehidupan murid',
    gembira: 'permainan angka, kuis, dan masalah cerita yang menantang',
    sadar: 'melatih ketelitian serta merefleksikan proses menemukan penyelesaian'
  },
  ipa: {
    kaya: 'pengetahuan dasar tentang alam sekitar, makhluk hidup, dan pengalaman pengamatan sederhana',
    kurang: 'mengamati secara sistematis, mengolah data, dan menulis laporan hasil percobaan',
    minat: 'pengamatan langsung, percobaan sederhana, dan keajaiban alam seperti hewan atau tumbuhan unik',
    visual: 'gambar, diagram, dan tabel hasil pengamatan',
    makna: 'mengaitkan konsep sains dengan rasa syukur serta tanggung jawab dalam melestarikan lingkungan',
    gembira: 'percobaan sederhana, observasi di lingkungan sekitar, dan kegiatan kreatif',
    sadar: 'melatih kepekaan terhadap alam sekitar dan merefleksikan pentingnya menjaga kelestarian'
  },
  ips: {
    kaya: 'pengetahuan dasar tentang keragaman hayati, budaya, sejarah, dan tempat-tempat terkenal di Indonesia',
    kurang: 'membedakan fakta dan opini, menganalisis data visual seperti peta dan grafik, serta menulis laporan pengamatan secara sistematis',
    minat: 'cerita petualangan, hewan-hewan unik seperti komodo dan orang utan, serta tempat-tempat eksotis',
    visual: 'peta, gambar, dan grafik',
    makna: 'mengaitkan kekayaan alam dan sejarah Indonesia dengan rasa syukur dan tanggung jawab untuk menjaganya serta isu konservasi yang relevan',
    gembira: 'bercerita (legenda), permainan kartu memori, dan kegiatan kreatif seperti memberi nama hewan',
    sadar: 'melatih kepekaan terhadap lingkungan melalui pengamatan dan merefleksikan hikmah menjaga warisan alam dan budaya'
  },
  inggris: {
    kaya: 'kosakata dan ungkapan sederhana serta pemahaman dasar saat mendengarkan',
    kurang: 'berbicara dan menulis dengan runtut serta memahami teks yang lebih panjang',
    minat: 'lagu, permainan kata, dan kartu bergambar',
    visual: 'gambar, kartu kata, dan video pendek',
    makna: 'menghubungkan bahasa Inggris dengan pengalaman sehari-hari agar digunakan dalam komunikasi nyata',
    gembira: 'menyanyi, permainan bahasa, dan kegiatan berbasis cerita',
    sadar: 'mengamati penggunaan bahasa dan merefleksikan cara belajar yang paling sesuai'
  },
  pjok: {
    kaya: 'kesegaran jasmani dan pengalaman gerak dasar serta bermain',
    kurang: 'melakukan gerak dengan terampil dan bekerja sama dalam permainan',
    minat: 'permainan, perlombaan, dan olahraga',
    visual: 'peragaan gerak dan contoh aktivitas',
    makna: 'menghubungkan aktivitas jasmani dengan kebugaran tubuh dan nilai sportivitas',
    gembira: 'permainan dan perlombaan yang menyenangkan',
    sadar: 'melatih keamanan saat bergerak dan merefleksikan manfaat olahraga bagi kesehatan'
  },
  seni: {
    kaya: 'pengalaman mengamati dan menirukan karya seni sederhana',
    kurang: 'mengekspresikan ide melalui karya secara kreatif dan detail',
    minat: 'menggambar, mewarnai, menyanyi, dan bergerak',
    visual: 'contoh karya, warna, dan media seni',
    makna: 'mengekspresikan perasaan dan pesan melalui karya serta menghargai keindahan budaya',
    gembira: 'menggambar, bernyanyi, dan kegiatan berkreasi',
    sadar: 'mengamati proses berkarya dan merefleksikan apa yang ingin disampaikan melalui karya'
  },
  informatika: {
    kaya: 'pengalaman menggunakan perangkat dan aplikasi sederhana',
    kurang: 'berpikir komputasional serta membuat produk atau laporan digital secara sistematis',
    minat: 'permainan, teknologi, dan media digital',
    visual: 'perangkat, aplikasi, dan video',
    makna: 'memanfaatkan teknologi secara bijak untuk belajar dan produktivitas',
    gembira: 'permainan edukatif digital dan proyek kreatif',
    sadar: 'menjaga keamanan digital dan menggunakan teknologi secara bertanggung jawab'
  }
};

const genericProfile = {
  kaya: 'pengetahuan dasar yang berhubungan dengan materi yang dipelajari dari pengalaman dan pelajaran sebelumnya',
  kurang: 'membedakan fakta dan opini, menganalisis informasi visual seperti gambar dan grafik, serta menyampaikan gagasan secara sistematis',
  minat: 'cerita yang menarik, kegiatan berkelompok, dan tantangan yang sesuai tingkat usianya',
  visual: 'gambar, peta, dan grafik',
  makna: 'mengaitkan materi dengan pengalaman sehari-hari dan menumbuhkan sikap positif terhadap isinya',
  gembira: 'bercerita, permainan, dan kegiatan kreatif yang berkaitan dengan materi',
  sadar: 'melatih kepekaan melalui pengamatan dan merefleksikan hikmah dari materi yang dipelajari'
};

const getSubjProfile = (mapel: string) => {
  const m = mapel.toLowerCase();
  if (m.includes('pkn') || m.includes('pancasila')) return SUBJ_PROFILE.pancasila;
  if (m.includes('indonesia')) return SUBJ_PROFILE.indonesia;
  if (m.includes('matematika')) return SUBJ_PROFILE.matematika;
  if (m.includes('ipa') || m.includes('sains')) return SUBJ_PROFILE.ipa;
  if (m.includes('ips')) return SUBJ_PROFILE.ips;
  if (m.includes('inggris')) return SUBJ_PROFILE.inggris;
  if (m.includes('pjok') || m.includes('penjaskes')) return SUBJ_PROFILE.pjok;
  if (m.includes('seni') || m.includes('sbdp') || m.includes('sbk')) return SUBJ_PROFILE.seni;
  if (m.includes('informatika') || m.includes('tik') || m.includes('komputer')) return SUBJ_PROFILE.informatika;
  return genericProfile;
};

// Susun deskripsi Identifikasi Murid yang menyesuaikan dengan mapel yang dipilih guru
const buildDiagDescriptions = (
  mapel: string,
  bab: string,
  diagDb?: Record<string, DiagnosticData>,
  defaultSubjectData?: Record<string, Record<string, string[]>>,
  fase?: string
): Record<string, string> => {
  const d = diagDb ? diagDb[fuzzySubjectKey(mapel, Object.keys(diagDb)) || ''] : undefined;
  const hasDiag = !!d && (d.n90 + d.n80 + d.n70 + d.n60) > 0;
  let pBaik = 0;
  let pPerlu = 0;
  if (hasDiag && d) {
    const tot = d.n90 + d.n80 + d.n70 + d.n60;
    pBaik = Math.round(((d.n90 + d.n80) / tot) * 100);
    pPerlu = Math.round(((d.n70 + d.n60) / tot) * 100);
  }
  // Ambil fokus & CP mapel terpilih dari fase aktif agar deskripsi mengikuti mapel
  const phaseData = (defaultSubjectData && fase && defaultSubjectData[fase]) || {};
  const cpKey = fuzzySubjectKey(mapel, Object.keys(phaseData)) || '';
  const cps = phaseData[cpKey] || [];
  const focus = cps[0]?.replace(/^Siswa mampu\s+/i, '').trim() || `materi ${bab}`;

  const p = getSubjProfile(mapel);

  return {
    'Pengetahuan Awal': hasDiag
      ? `Berdasarkan asesmen diagnostik ${mapel}, ±${pBaik}% peserta didik telah memiliki pengetahuan awal yang baik, sedangkan ±${pPerlu}% masih memerlukan bimbingan. Secara umum, peserta didik memiliki ${p.kaya}. Namun, kemampuan untuk ${p.kurang} masih memerlukan pengembangan melalui pembelajaran ${focus}.`
      : `Peserta didik memiliki ${p.kaya}. Mereka memahami dasar-dasar yang berkaitan dengan ${focus}. Namun, kemampuan untuk ${p.kurang} masih memerlukan pengembangan melalui pembelajaran ${mapel} (${bab}).`,
    'Minat Belajar': `Peserta didik umumnya tertarik pada ${p.minat}. Minat visual mereka juga tinggi, sehingga penggunaan ${p.visual} akan sangat efektif untuk menarik perhatian pada materi ${focus}.`,
    'Kebutuhan Belajar': `Peserta didik memerlukan pendekatan pembelajaran yang mengintegrasikan Deep Learning pada materi ${focus}:\n1. Pembelajaran Bermakna (Meaningful): ${p.makna}.\n2. Pembelajaran Menyenangkan (Joyful): melalui kegiatan ${p.gembira}.\n3. Pembelajaran Penuh Kesadaran (Mindful): ${p.sadar}.`
  };
};

const inputCls = 'mt-1 w-full px-2.5 py-1.5 border rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400';
const textareaCls = 'mt-1 w-full px-2.5 py-1.5 border rounded-lg text-[11px] bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400';
const btn = (color: string) => `text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition active:scale-95 cursor-pointer ${color}`;

const Label: React.FC<{ text: string; accent?: string; children: React.ReactNode }> = ({ text, accent = 'text-slate-600', children }) => (
  <label className="block">
    <span className={`text-[11px] font-bold ${accent}`}>{text}</span>
    {children}
  </label>
);

const Card: React.FC<{ title: string; icon: React.ReactNode; action?: React.ReactNode; subtitle?: string; children: React.ReactNode }> = ({ title, icon, action, subtitle, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div className="px-4 py-3 bg-indigo-900 text-white flex items-center justify-between">
      <div className="flex items-center space-x-2">
        {icon}
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wide">{title}</h3>
          {subtitle && <p className="text-[10px] text-indigo-200 font-semibold">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
    <div className="p-4 space-y-3">{children}</div>
  </div>
);

const DokDivider: React.FC<{ text: string; accent?: string }> = ({ text, accent = 'bg-indigo-900' }) => (
  <div className={`${accent} text-white px-3 py-2 rounded-lg text-sm font-extrabold uppercase tracking-wide flex items-center space-x-2`}>
    <span className="w-2 h-2 rounded-full bg-amber-300 inline-block shrink-0"></span>
    <span>{text}</span>
  </div>
);

const ChipToggle: React.FC<{ options: string[]; selected: string[]; onToggle: (it: string) => void; activeCls: string }> = ({ options, selected, onToggle, activeCls }) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map((it) => (
      <button key={it} type="button" onClick={() => onToggle(it)}
        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${selected.includes(it) ? `${activeCls} text-white border-transparent` : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'}`}>
        {it}
      </button>
    ))}
  </div>
);

export const RpmTab: React.FC<RpmProps> = ({ biodata, diagnosticDatabase, defaultSubjectData, subjectGradesDatabase, gradesDatabase, showToast, isDemo }) => {
  const [form, setForm] = useState<RpmState>(() => {
    const base = emptyForm(biodata);
    const saved = loadRpmDraft(biodata.nipGuru || '');
    if (saved) {
      const merged = { ...base, ...saved };
      const migrateRubrik = (list: unknown): RpmRubrik[] => {
        if (!Array.isArray(list)) return base.rubrik;
        return list.map((it, idx) => {
          const x = it as Record<string, unknown>;
          if (typeof x.pernyataan === 'string') {
            return { id: idx + 1, pernyataan: x.pernyataan, mapel: typeof x.mapel === 'string' ? x.mapel : base.mapel, tingkat: String(x.tingkat || 'Paham') };
          }
          const kriteria = typeof x.kriteria === 'string' ? x.kriteria : '';
          return { id: idx + 1, pernyataan: kriteria, mapel: base.mapel, tingkat: 'Paham' };
        });
      };
      return { ...merged, rubrik: migrateRubrik(saved.rubrik), skenario: (saved.skenario as RpmState['skenario']) || base.skenario };
    }
    return { ...base, diagnostik: emptyDiag() };
  });
  const firstRun = useRef(true);
  const [subTab, setSubTab] = useState<'generator' | 'rubrik'>('generator');

  const set = <K extends keyof RpmState>(key: K, val: RpmState[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const toggleInList = (key: 'media' | 'ppp', item: string) => {
    const arr = key === 'ppp' ? effectivePpp(form[key]) : form[key];
    set(key, arr.includes(item) ? arr.filter((d) => d !== item) : [...arr, item]);
  };

  const setDiag = (id: number, key: keyof RpmDiag, val: string) =>
    set('diagnostik', form.diagnostik.map((d) => (d.id === id ? { ...d, [key]: val } : d)));
  const addDiag = () => set('diagnostik', [...form.diagnostik, { id: Date.now(), kategori: '', deskripsi: '' }]);
  const removeDiag = (id: number) => set('diagnostik', form.diagnostik.filter((d) => d.id !== id));

  const setSken = (id: number, key: 'judul' | 'awal' | 'inti' | 'penutup', val: string) =>
    set('skenario', form.skenario.map((s) => (s.id === id ? { ...s, [key]: val } : s)));

  const setRubrik = (id: number, key: keyof RpmRubrik, val: string | boolean) =>
    set('rubrik', form.rubrik.map((r) => (r.id === id ? { ...r, [key]: val } : r)));
  const addRubrik = () => set('rubrik', [...form.rubrik, { id: Date.now(), pernyataan: '', mapel: form.mapel, tingkat: 'Paham' }]);
  const removeRubrik = (id: number) => set('rubrik', form.rubrik.filter((r) => r.id !== id));
  const setSiswa = (id: number, key: keyof RpmSiswa, val: string) =>
    set('lembarSiswa', form.lembarSiswa.map((s) => (s.id === id ? { ...s, [key]: val } : s)));
  const addSiswa = () => {
    const num = form.lembarSiswa.length + 1;
    set('lembarSiswa', [...form.lembarSiswa, { id: Date.now(), nomor: String(num), nama: '', mapel: form.mapel, kelompok: '', mendengarkan: '', nonVerbal: '', prestasi: '' }]);
  };
  const removeSiswa = (id: number) => set('lembarSiswa', form.lembarSiswa.filter((s) => s.id !== id));

  // Sinkronkan nama siswa dari daftar Absensi/Buku Nilai ke Rubrik Penilaian 2 (Lembar Penilaian Siswa).
  // Tanpa batas jumlah (mendukung > 50 siswa); isian manual (kelompok/nilai) ikut dipertahankan.
  const syncLembarSiswa = () => {
    if (isDemo) {
      showToast('Mode demo: data siswa dikunci.');
      return;
    }
    const map = new Map<number, { id: number; nama: string }>();
    Object.keys(subjectGradesDatabase || {}).forEach((sub) => {
      (subjectGradesDatabase![sub] || []).forEach((s) => {
        if (s && s.id && s.nama) map.set(s.id, { id: s.id, nama: s.nama });
      });
    });
    Object.keys(gradesDatabase || {}).forEach((sub) => {
      (gradesDatabase![sub] || []).forEach((s) => {
        if (s && s.id && s.nama && !map.has(s.id)) map.set(s.id, { id: s.id, nama: s.nama });
      });
    });
    const siswaFromAbsensi = Array.from(map.values()).sort((a, b) => a.id - b.id).filter((s) => s.nama.trim() !== '');
    if (siswaFromAbsensi.length === 0) {
      showToast('Belum ada data siswa pada menu Absensi/Buku Nilai.');
      return;
    }
    setForm((prev) => {
      const existingByNama = new Map<string, RpmSiswa>();
      prev.lembarSiswa.forEach((s) => {
        const key = s.nama.trim().toLowerCase();
        if (key && !existingByNama.has(key)) existingByNama.set(key, s);
      });
      const next = siswaFromAbsensi.map((siswa, idx) => {
        const key = siswa.nama.trim().toLowerCase();
        const keep = existingByNama.get(key);
        return {
          id: idx + 1,
          nomor: String(idx + 1),
          nama: siswa.nama,
          mapel: keep?.mapel || prev.mapel,
          kelompok: keep?.kelompok || '',
          mendengarkan: keep?.mendengarkan || '',
          nonVerbal: keep?.nonVerbal || '',
          prestasi: keep?.prestasi || ''
        };
      });
      return { ...prev, lembarSiswa: next };
    });
    showToast(`Lembar Penilaian Siswa terisi ${siswaFromAbsensi.length} siswa dari daftar Absensi.`);
  };

  // Isi otomatis Identifikasi Murid (Bagian 2) dari data sistem
  const applyAutoDiagnostik = () => {
    const descs = buildDiagDescriptions(form.mapel, form.bab, diagnosticDatabase, defaultSubjectData, biodata.fase);
    set('diagnostik', form.diagnostik.map((d) => (descs[d.kategori] ? { ...d, deskripsi: descs[d.kategori] } : d)));
  };

  // Kegiatan Inti pada setiap pertemuan disesuaikan dengan mata pelajaran yang dipilih guru
  const applyAutoInti = () => {
    const inti = buildIntiTemplate(form.mapel);
    set('skenario', form.skenario.map((s, i) => ({ ...s, judul: `Pertemuan ${i + 1}`, inti })));
  };

  // Sistem otomatis mengisi Bagian 2 saat RPM dibuat / mapel diganti agar sesuai mapel pilihan guru
  useEffect(() => {
    if (isDemo) return;
    if (firstRun.current) {
      firstRun.current = false;
      applyAutoDiagnostik();
      applyAutoCp();
      applyAutoAdp();
      applyAutoMateri();
      applyAutoDesain();
      applyAutoPR();
      applyAutoRubrik();
      applyAutoInti();
      return;
    }
    applyAutoDiagnostik();
    applyAutoCp();
    applyAutoAdp();
    applyAutoMateri();
    applyAutoDesain();
    applyAutoPR();
    applyAutoRubrik();
    applyAutoInti();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.mapel]);

  // Mata pelajaran pada Rubrik Penilaian & Lembar Siswa mengikuti pilihan di sub menu Generator RPM
  useEffect(() => {
    if (isDemo) return;
    setForm((prev) => ({
      ...prev,
      rubrik: prev.rubrik.map((r) => ({ ...r, mapel: prev.mapel })),
      lembarSiswa: prev.lembarSiswa.map((s) => ({ ...s, mapel: prev.mapel }))
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.mapel]);

  // Saat menu Absensi/Buku Nilai diperbarui, nama siswa pada Rubrik Penilaian 2 otomatis mengikuti (mendukung > 50 siswa)
  useEffect(() => {
    if (isDemo) return;
    const map = new Map<number, { id: number; nama: string }>();
    Object.keys(subjectGradesDatabase || {}).forEach((sub) => {
      (subjectGradesDatabase![sub] || []).forEach((s) => {
        if (s && s.id && s.nama) map.set(s.id, { id: s.id, nama: s.nama });
      });
    });
    Object.keys(gradesDatabase || {}).forEach((sub) => {
      (gradesDatabase![sub] || []).forEach((s) => {
        if (s && s.id && s.nama && !map.has(s.id)) map.set(s.id, { id: s.id, nama: s.nama });
      });
    });
    const siswaFromAbsensi = Array.from(map.values()).sort((a, b) => a.id - b.id).filter((s) => s.nama.trim() !== '');
    if (siswaFromAbsensi.length === 0) return;

    setForm((prev) => {
      const existingByNama = new Map<string, RpmSiswa>();
      prev.lembarSiswa.forEach((s) => {
        const key = s.nama.trim().toLowerCase();
        if (key && !existingByNama.has(key)) existingByNama.set(key, s);
      });
      const next = siswaFromAbsensi.map((siswa, idx) => {
        const key = siswa.nama.trim().toLowerCase();
        const keep = existingByNama.get(key);
        return {
          id: idx + 1,
          nomor: String(idx + 1),
          nama: siswa.nama,
          mapel: keep?.mapel || prev.mapel,
          kelompok: keep?.kelompok || '',
          mendengarkan: keep?.mendengarkan || '',
          nonVerbal: keep?.nonVerbal || '',
          prestasi: keep?.prestasi || ''
        };
      });
      return { ...prev, lembarSiswa: next };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectGradesDatabase, gradesDatabase]);

  // Jumlah pertemuan menyesuaikan JP: kelipatan 2 JP = 1 pertemuan (2 JP -> 1, 4 JP -> 2, dst.)
  // Teks Kegiatan Inti selalu diterapkan ke SEMUA pertemuan sesuai jumlah JP yang guru tentukan.
  useEffect(() => {
    if (isDemo) return;
    const jpn = parseInt(form.jp) || 0;
    const count = Math.max(1, Math.ceil(jpn / 2));
    setForm((prev) => {
      const arr = prev.skenario.slice(0, count);
      for (let i = 0; i < count; i++) {
        const existing = arr[i];
        if (existing) {
          arr[i] = { ...existing, judul: `Pertemuan ${i + 1}`, inti: buildIntiTemplate(prev.mapel) };
        } else {
          arr.push({ id: Date.now() + i, judul: `Pertemuan ${i + 1}`, awal: TEMPLATE_AWAL, inti: buildIntiTemplate(prev.mapel), penutup: TEMPLATE_PENUTUP });
        }
      }
      return { ...prev, skenario: arr };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.jp]);

  // CP di II. Desain Pembelajaran terisi otomatis sesuai mapel yang dipilih guru
  const applyAutoCp = () => {
    const cp = getCpFor(form.mapel);
    if (cp) set('cp', cp);
  };

  // Analisa Data dan Peluang di II. Desain Pembelajaran terisi otomatis sesuai mapel yang dipilih guru
  const applyAutoAdp = () => {
    const adp = getAdpFor(form.mapel);
    if (adp) set('analisaData', adp);
  };

  // Materi Pelajaran terisi otomatis sesuai mapel yang dipilih guru
  const applyAutoMateri = () => {
    const materi = getMateriFor(form.mapel);
    if (materi) set('materi', materi);
  };

  // Komponen Desain Pembelajaran (Lintas/Tujuan/Praktik/Digital) terisi otomatis sesuai Fase & mapel
  const applyAutoDesain = () => {
    const base = FASE_DESA[faseKeyOf(biodata)] || FASE_DESA.A;
    set('lintasDisiplin', buildLintasDisiplin(form.mapel, form.materi));
    set('tujuanPembelajaran', base.tujuan);
    set('praktikPedagogis', base.praktik);
    set('pemanfaatanDigital', base.digital);
  };

  // Pengayaan & Remedial terisi otomatis sesuai mapel & materi yang dipilih guru
  const applyAutoPR = () => {
    set('pengayaan', buildPengayaan(form.mapel, form.materi));
    set('remedial', buildRemedial(form.mapel, form.materi));
  };

  // Pernyataan Refleksi pada Rubrik Penilaian terisi otomatis sesuai mata pelajaran yang dipilih
  const applyAutoRubrik = () => {
    const descs = getRubrikFor(form.mapel);
    set('rubrik', descs.map((d, idx) => ({ id: idx + 1, pernyataan: d.pernyataan, mapel: form.mapel, tingkat: d.tingkat })));
  };

  // Tombol manual: arahkan semua komponen Desain Pembelajaran ke topik materi yang ditulis guru
  const handleGenerateMateri = () => {
    if (isDemo) { showToast('Mode demo: pengeditan dikunci.'); return; }
    if (!form.materi.trim()) { showToast('Tuliskan terlebih dahulu topik Materi Pelajaran.'); return; }
    const { cp, lintasDisiplin, tujuanPembelajaran, praktikPedagogis, pemanfaatanDigital } = generateKontekstual(form.mapel, faseKeyOf(biodata), faseKelasOf(biodata), form.materi);
    set('cp', cp);
    set('lintasDisiplin', lintasDisiplin);
    set('tujuanPembelajaran', tujuanPembelajaran);
    set('praktikPedagogis', praktikPedagogis);
    set('pemanfaatanDigital', pemanfaatanDigital);
    showToast('Komponen Desain Pembelajaran disesuaikan dengan materi.');
  };

  // Upload foto (jpg/png) untuk Materi Pelajaran pada mata pelajaran terpilih
  const handleMateriGambarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDemo) { showToast('Mode demo: pengeditan dikunci.'); return; }
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpe?g|png)$/i.test(file.type)) {
      showToast('Hanya file JPG atau PNG yang diperbolehkan.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      set('materiGambar', result);
      showToast('Foto materi berhasil diunggah.');
    };
    reader.readAsDataURL(file);
  };

  const removeMateriGambar = () => {
    if (isDemo) { showToast('Mode demo: pengeditan dikunci.'); return; }
    set('materiGambar', '');
    showToast('Foto materi dihapus.');
  };

  const fillTemplate = () => {
    if (isDemo) { showToast('Mode demo: pengeditan dikunci.'); return; }
    set('skenario', [{ id: 1, judul: 'Pertemuan 1', awal: TEMPLATE_AWAL, inti: buildIntiTemplate(form.mapel), penutup: TEMPLATE_PENUTUP }]);
    showToast('Sintaks Deep Learning berhasil dimuat.');
  };

  const handlePrint = () => {
    document.body.classList.add('print-rpm');
    window.print();
    setTimeout(() => document.body.classList.remove('print-rpm'), 400);
  };

  const handleExportDoc = () => {
    const html = exportHTML(form, biodata);
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RPM_${sanitize(form.mapel)}_${sanitize(form.bab)}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Dokumen Word berhasil diunduh.');
  };

  const tm = timeSplit(form.jp);
  const pm = timeSplit(String(Math.max(1, Math.round((parseInt(form.jp) || 0) / Math.max(1, form.skenario.length)))));

  // Simpan otomatis data RPM ke penyimpanan bersama -> dibaca Jurnal Mengajar
  const nip = biodata.nipGuru || '';
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isDemo) return;
      saveRpmSource(nip, {
        mapel: form.mapel,
        kelas: faseKelasOf(biodata),
        bab: form.bab,
        materi: form.materi,
        jp: form.jp,
        tps: form.tps.map((t) => t.teks).filter(Boolean),
        pendekatan: form.pendekatan,
        model: form.model,
        skenario: form.skenario.map((s) => ({ judul: s.judul, awal: s.awal, inti: s.inti, penutup: s.penutup })),
        updatedAt: new Date().toISOString()
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [form, nip, biodata, isDemo]);

  // Simpan draf lengkap RPM agar tidak hilang saat pindah halaman
  useEffect(() => {
    if (isDemo) return;
    const timer = setTimeout(() => saveRpmDraft(nip, form), 300);
    return () => clearTimeout(timer);
  }, [form, nip, isDemo]);

  return (
    <div id="tab-rpm" className="tab-content space-y-6">
      <div className="flex flex-wrap items-center gap-2 no-print">
        <div className="flex items-center space-x-2 mr-auto">
          <div className="bg-indigo-900 text-white p-2 rounded-xl shadow-md"><BookOpenCheck className="w-5 h-5 text-amber-300" /></div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 leading-tight">Generator RPM</h2>
            <p className="text-[11px] text-slate-500 font-medium">Rencana Pembelajaran Mendalam (I. Informasi Umum · II. Desain Pembelajaran)</p>
          </div>
        </div>
        <button onClick={fillTemplate} className={btn('bg-emerald-600 hover:bg-emerald-500')}>
          <Wand2 className="w-3.5 h-3.5 text-white" /><span>Buat Sintaks DL</span>
        </button>
        <button onClick={handleExportDoc} className={btn('bg-sky-600 hover:bg-sky-500')}>
          <Download className="w-3.5 h-3.5 text-white" /><span>Export Word</span>
        </button>
        <button onClick={handlePrint} className={btn('bg-rose-600 hover:bg-rose-500')}>
          <Printer className="w-3.5 h-3.5 text-white" /><span>Cetak / PDF</span>
        </button>
      </div>

      {/* ===== SUB MENU RPM ===== */}
      <div className="no-print inline-flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
        <button onClick={() => setSubTab('generator')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${subTab === 'generator' ? 'bg-indigo-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}>
          Generator RPM
        </button>
        <button onClick={() => setSubTab('rubrik')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${subTab === 'rubrik' ? 'bg-indigo-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}>
          Rubrik
        </button>
      </div>

      {subTab === 'generator' && (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

        {/* ===== FORM PANE ===== */}
        <div className="space-y-5 no-print">

          {/* ===== I. INFORMASI UMUM ===== */}
          <DokDivider text="I. Informasi Umum" />

          {/* A. IDENTITAS RPM */}
          <Card title="A · Identitas RPM" icon={<School className="w-4 h-4 text-amber-300" />}>
            <div className="grid grid-cols-2 gap-3">
              <Label text="Nama Penyusun (otomatis)">
                <input type="text" value={biodata.namaGuru || '-'} readOnly className={inputCls} title="Terisi otomatis dari menu Biodata Guru" />
              </Label>
              <Label text="Sekolah Penyusun (otomatis)">
                <input type="text" value={biodata.namaSekolah || '-'} readOnly className={inputCls} title="Terisi otomatis dari menu Biodata Sekolah" />
              </Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Label text="Tahun Pelajaran">
                <input type="text" value={form.tahunPelajaran} onChange={(e) => set('tahunPelajaran', e.target.value)} placeholder="cth: 2025/2026" className={inputCls} />
              </Label>
              <Label text="Fase / Kelas (otomatis)">
                <input type="text" value={faseKelasOf(biodata)} readOnly className={inputCls} title="Terisi otomatis dari menu Biodata Kelas" />
              </Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Label text="Mata Pelajaran">
                <select value={form.mapel} onChange={(e) => set('mapel', e.target.value)} className={inputCls}>
                  {SYSTEM_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Label>
              <Label text="Alokasi Waktu (JP) · 1 JP = 35 menit">
                <input type="number" min="1" max="40" value={form.jp} onChange={(e) => set('jp', e.target.value)} className={inputCls} />
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Total: {tm.total} menit</span>
              </Label>
            </div>
            <div>
              <Label text="Bab / Judul Modul">
                <input type="text" value={form.bab} onChange={(e) => set('bab', e.target.value)} placeholder="cth: Berteman dalam Keragaman" className={inputCls} />
              </Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Label text="Hari">
                <input type="text" value={form.hari} onChange={(e) => set('hari', e.target.value)} placeholder="cth: Senin" className={inputCls} />
              </Label>
              <Label text="Tanggal">
                <input type="text" value={form.tanggal} onChange={(e) => set('tanggal', e.target.value)} placeholder="cth: 5 Agustus 2026" className={inputCls} />
              </Label>
            </div>
          </Card>

          {/* B. IDENTIFIKASI MURID */}
          <Card title="B · Identifikasi Murid" icon={<Users className="w-4 h-4 text-amber-300" />} action={
            <div className="flex items-center space-x-1.5">
              <button onClick={() => { if (isDemo) { showToast('Mode demo: pengeditan dikunci.'); return; } applyAutoDiagnostik(); showToast('Identifikasi Murid terisi otomatis dari data sistem.'); }}
                className="bg-amber-500 hover:bg-amber-400 text-indigo-950 px-2 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition cursor-pointer">
                <Wand2 className="w-3.5 h-3.5" /><span>Isi Otomatis</span>
              </button>
              <button onClick={addDiag} className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition cursor-pointer">
                <Plus className="w-3.5 h-3.5" /><span>Tambah</span>
              </button>
            </div>
          }>
            <p className="text-[10px] text-slate-500 font-semibold -mt-1">Isi dua kolom horizontal: <b>Kategori</b> dan <b>Deskripsi</b>.</p>
            <div className="space-y-2">
              {form.diagnostik.map((d) => (
                <div key={d.id} className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
                  <Label text="Kategori">
                    <input type="text" value={d.kategori} onChange={(e) => setDiag(d.id, 'kategori', e.target.value)} className={inputCls} />
                  </Label>
                  <div className="flex items-start space-x-2">
                    <div className="flex-1">
                      <Label text="Deskripsi">
                        <textarea value={d.deskripsi} rows={2} onChange={(e) => setDiag(d.id, 'deskripsi', e.target.value)} className={textareaCls + ' resize-none'} />
                      </Label>
                    </div>
                    <button onClick={() => removeDiag(d.id)} className="text-rose-500 hover:text-rose-700 transition cursor-pointer mt-5 shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* C. MATERI PELAJARAN */}
          <Card title="C · Materi Pelajaran" icon={<BookOpen className="w-4 h-4 text-amber-300" />}>
            <Label text="Materi Pelajaran">
              <textarea value={form.materi} rows={3} onChange={(e) => set('materi', e.target.value)} className={textareaCls + ' resize-none'} placeholder="cth: Pengertian dan nilai-nilai Pancasila..." />
            </Label>
            <div>
              <span className="block text-[11px] font-bold text-slate-600 mb-1.5">Foto Materi (opsional) · JPG / PNG</span>
              {form.materiGambar ? (
                <div className="relative inline-block">
                  <img src={form.materiGambar} alt="Foto Materi" className="max-h-40 rounded-lg border border-slate-200 shadow" />
                  <button type="button" onClick={removeMateriGambar} title="Hapus foto" className="absolute -top-2 -right-2 p-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow transition cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl py-4 text-slate-500 hover:text-indigo-600 text-xs font-bold cursor-pointer transition">
                  <Upload className="w-4 h-4" />
                  <span>Pilih atau seret foto materi di sini</span>
                  <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleMateriGambarUpload} className="hidden" />
                </label>
              )}
            </div>
            <button type="button" onClick={handleGenerateMateri} className={btn('bg-violet-600 hover:bg-violet-500')}>
              <Wand2 className="w-3.5 h-3.5 text-white" /><span>Buatkan sesuai Materi</span>
            </button>
          </Card>

          {/* D. DIMENSI PROFIL LULUSAN */}
          <Card title="D · Dimensi Profil Lulusan" icon={<Sparkles className="w-4 h-4 text-amber-300" />}>
            <ChipToggle options={PPP_OPTIONS} selected={effectivePpp(form.ppp)} onToggle={(it) => toggleInList('ppp', it)} activeCls="bg-emerald-600 border-emerald-700" />
          </Card>

          {/* E. SARANA & PRASARANA / MEDIA / ALAT BAHAN */}
          <Card title="E · Sarana & Prasarana / Media / Alat dan Bahan" icon={<FolderOpen className="w-4 h-4 text-amber-300" />}>
            <Label text="Sarana & Prasarana">
              <textarea value={form.sarana} rows={2} onChange={(e) => set('sarana', e.target.value)} className={textareaCls + ' resize-none'} placeholder="cth: Ruang kelas, IFP, koneksi internet..." />
            </Label>
            <div>
              <span className="block text-[11px] font-bold text-slate-600 mb-1.5">Media Pembelajaran</span>
              <ChipToggle options={MEDIA_OPTIONS} selected={form.media} onToggle={(it) => toggleInList('media', it)} activeCls="bg-indigo-600 border-indigo-700" />
            </div>
            <Label text="Alat dan Bahan">
              <textarea value={form.alatBahan} rows={2} onChange={(e) => set('alatBahan', e.target.value)} className={textareaCls + ' resize-none'} placeholder="cth: Lembar kerja, spidol, kartu kata..." />
            </Label>
          </Card>

          {/* F. TARGET PESERTA DIDIK */}
          <Card title="F · Target Peserta Didik" icon={<Target className="w-4 h-4 text-amber-300" />}>
            <div className="grid grid-cols-2 gap-3">
              <Label text="Target Peserta Didik">
                <select value={form.targetPeserta} onChange={(e) => set('targetPeserta', e.target.value)} className={inputCls}>
                  {TARGET_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Label>
              <Label text="Jumlah Peserta Didik">
                <input type="number" min="0" value={form.jumlahPeserta} onChange={(e) => set('jumlahPeserta', e.target.value)} placeholder="cth: 28" className={inputCls} />
              </Label>
            </div>
          </Card>

          {/* G. PENDEKATAN, MODEL, METODE */}
          <Card title="G · Pendekatan, Model, dan Metode Pembelajaran" icon={<GitFork className="w-4 h-4 text-amber-300" />}>
            <div className="grid grid-cols-2 gap-3">
              <Label text="Pendekatan">
                <select value={form.pendekatan} onChange={(e) => set('pendekatan', e.target.value)} className={inputCls}>
                  {PENDEKATAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Label>
              <Label text="Model">
                <input type="text" value={form.model} onChange={(e) => set('model', e.target.value)} className={inputCls} />
              </Label>
            </div>
            <div>
              <span className="block text-[11px] font-bold text-slate-600 mb-1.5">Metode Pembelajaran</span>
              <ChipToggle options={METODE_OPTIONS} selected={form.metode.split(',').map((x) => x.trim()).filter(Boolean)} onToggle={(it) => {
                const arr = form.metode.split(',').map((x) => x.trim()).filter(Boolean);
                const next = arr.includes(it) ? arr.filter((d) => d !== it) : [...arr, it];
                set('metode', next.join(', '));
              }} activeCls="bg-sky-600 border-sky-700" />
            </div>
          </Card>

          <DokDivider text="II. Desain Pembelajaran" accent="bg-indigo-800" />

          {/* A. CAPAIAN PEMBELAJARAN */}
          <Card title="A · Capaian Pembelajaran (CP)" icon={<GraduationCap className="w-4 h-4 text-amber-300" />}>
            <Label text="Capaian Pembelajaran (CP)">
              <textarea value={form.cp} rows={4} onChange={(e) => set('cp', e.target.value)} className={textareaCls + ' resize-none'} />
            </Label>
          </Card>

          {/* B. LINTAS DISIPLIN ILMU */}
          <Card title="B · Lintas Disiplin Ilmu" icon={<Users className="w-4 h-4 text-amber-300" />}>
            <Label text="Lintas Disiplin Ilmu">
              <textarea value={form.lintasDisiplin} rows={4} onChange={(e) => set('lintasDisiplin', e.target.value)} className={textareaCls + ' resize-none'} />
            </Label>
          </Card>

          {/* C. TUJUAN PEMBELAJARAN */}
          <Card title="C · Tujuan Pembelajaran" icon={<Target className="w-4 h-4 text-amber-300" />}>
            <Label text="Tujuan Pembelajaran">
              <textarea value={form.tujuanPembelajaran} rows={4} onChange={(e) => set('tujuanPembelajaran', e.target.value)} className={textareaCls + ' resize-none'} />
            </Label>
          </Card>

          {/* D. PRAKTIK PEDAGOGIS */}
          <Card title="D · Praktik Pedagogis (Pendekatan Deep Learning)" icon={<School className="w-4 h-4 text-amber-300" />}>
            <Label text="Praktik Pedagogis (Pendekatan Deep Learning)">
              <textarea value={form.praktikPedagogis} rows={5} onChange={(e) => set('praktikPedagogis', e.target.value)} className={textareaCls + ' resize-none'} />
            </Label>
          </Card>

          {/* E. PEMANFAATAN DIGITAL */}
          <Card title="E · Pemanfaatan Digital" icon={<Wand2 className="w-4 h-4 text-amber-300" />}>
            <Label text="Pemanfaatan Digital">
              <textarea value={form.pemanfaatanDigital} rows={4} onChange={(e) => set('pemanfaatanDigital', e.target.value)} className={textareaCls + ' resize-none'} />
            </Label>
          </Card>
        {/* ===== III. PENGALAMAN BELAJAR ===== */}
          <DokDivider text="III. Pengalaman Belajar (Rincian per Pertemuan)" accent="bg-indigo-800" />

          {form.skenario.map((sk) => (
            <Card key={sk.id} title={sk.judul} icon={<BookOpenCheck className="w-4 h-4 text-amber-300" />}>
              <Label text="Judul Pertemuan">
                <input type="text" value={sk.judul} onChange={(e) => setSken(sk.id, 'judul', e.target.value)} className={inputCls} />
              </Label>
              <Label text="Kegiatan Pendahuluan">
                <textarea value={sk.awal} rows={3} onChange={(e) => setSken(sk.id, 'awal', e.target.value)} className={textareaCls + ' resize-none'} placeholder="Salam, doa, apersepsi, dan penyampaian tujuan..." />
              </Label>
              <Label text="Kegiatan Inti">
                <textarea value={sk.inti} rows={5} onChange={(e) => setSken(sk.id, 'inti', e.target.value)} className={textareaCls + ' resize-none'} placeholder="Memahami, Mengaplikasi, dan Merefleksi (Deep Learning)..." />
              </Label>
              <Label text="Kegiatan Penutup">
                <textarea value={sk.penutup} rows={3} onChange={(e) => setSken(sk.id, 'penutup', e.target.value)} className={textareaCls + ' resize-none'} placeholder="Menyimpulkan, tindak lanjut, dan doa penutup..." />
              </Label>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Pembagian waktu per pertemuan (2 JP): Pendahuluan {pm.awal} menit · Inti {pm.inti} menit · Penutup {pm.penutup} menit · Total Alokasi {tm.total} menit</p>
            </Card>
          ))}

          {/* ===== IV. ASESMEN ===== */}
          <DokDivider text="IV. Asesmen" accent="bg-indigo-800" />
          <Card title="Asesmen" icon={<ClipboardCheck className="w-4 h-4 text-amber-300" />}>
            <Label text="Asesmen Awal (Diagnostik)">
              <textarea value={form.asesmenAwal} rows={3} onChange={(e) => set('asesmenAwal', e.target.value)} className={textareaCls + ' resize-none'} placeholder="Tes awal, observasi kesiapan belajar..." />
            </Label>
            <Label text="Asesmen Proses (Formatif)">
              <textarea value={form.asesmenProses} rows={3} onChange={(e) => set('asesmenProses', e.target.value)} className={textareaCls + ' resize-none'} placeholder="Observasi, kuis, diskusi, refleksi..." />
            </Label>
            <Label text="Asesmen Akhir Bab (Sumatif)">
              <textarea value={form.asesmenSumatif} rows={3} onChange={(e) => set('asesmenSumatif', e.target.value)} className={textareaCls + ' resize-none'} placeholder="Tes tulis, proyek, portofolio..." />
            </Label>
          </Card>

          {/* ===== V. PENGAYAAN & REMEDIAL ===== */}
          <DokDivider text="V. Pengayaan dan Remedial" accent="bg-indigo-800" />
          <Card title="Pengayaan dan Remedial" icon={<Wand2 className="w-4 h-4 text-amber-300" />}>
            <Label text="1. Pengayaan">
              <textarea value={form.pengayaan} rows={5} onChange={(e) => set('pengayaan', e.target.value)} className={textareaCls + ' resize-none'} placeholder="Tugas pengayaan untuk peserta didik yang telah mencapai tujuan..." />
            </Label>
            <Label text="2. Remedial">
              <textarea value={form.remedial} rows={5} onChange={(e) => set('remedial', e.target.value)} className={textareaCls + ' resize-none'} placeholder="Pendampingan untuk peserta didik yang belum mencapai tujuan..." />
            </Label>
          </Card>

        </div>

        {/* ===== PREVIEW PANE ===== */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 no-print">
            <Eye className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-extrabold text-slate-700">Pratinjau Dokumen</h3>
            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">Live</span>
          </div>
          <PreviewDocument data={form} biodata={biodata} />
        </div>
      </div>
      )}

      {subTab === 'rubrik' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          {/* ===== RUBRIK & REFLEKSI FORM ===== */}
          <div className="space-y-5 no-print">
            <DokDivider text="Rubrik Penilaian" accent="bg-indigo-800" />
            <Card title="Rubrik Penilaian" icon={<GraduationCap className="w-4 h-4 text-amber-300" />} action={
              <button onClick={addRubrik} className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition cursor-pointer">
                <Plus className="w-3.5 h-3.5" /><span>Tambah</span>
              </button>
            }>
              <p className="text-[10px] text-slate-500 font-semibold -mt-1">Tulis <b>Pernyataan Refleksi</b> dan pilih tingkat pemahaman pada salah satu kolom.</p>
              <Label text="Mata Pelajaran (dari Generator RPM)">
                <input type="text" value={form.mapel} readOnly className={inputCls} title="Mata pelajaran dapat dipilih di sub menu Generator RPM" />
              </Label>
              <div className="space-y-2">
                {form.rubrik.map((r, idx) => (
                  <div key={r.id} className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-indigo-900 uppercase tracking-wide">Rubrik Penilaian {idx + 1}</span>
                      <button onClick={() => removeRubrik(r.id)} title="Hapus baris" className="p-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 transition cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <Label text="Pernyataan Refleksi">
                      <textarea value={r.pernyataan} rows={2} onChange={(e) => setRubrik(r.id, 'pernyataan', e.target.value)} className={textareaCls + ' resize-none'} placeholder="cth: Saya dapat mengambil pesan/hikmah dari sebuah cerita legenda." />
                    </Label>
                    <div>
                      <span className="block text-[11px] font-bold text-slate-600 mb-1.5">Tingkat Pemahaman</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {RUBRIK_LEVELS.map((lv) => (
                          <button
                            key={lv}
                            onClick={() => setRubrik(r.id, 'tingkat', lv)}
                            className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                              r.tingkat === lv ? 'bg-indigo-900 text-white border-indigo-900' : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
                            }`}
                          >
                            {lv}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Rubrik Penilaian 2" subtitle="Lembar Penilaian Siswa" icon={<ClipboardCheck className="w-4 h-4 text-emerald-300" />} action={
              <div className="flex items-center space-x-1">
                <button onClick={syncLembarSiswa} className="bg-sky-600 hover:bg-sky-500 text-white px-2 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition cursor-pointer">
                  <UserCheck className="w-3.5 h-3.5" /><span>Ikuti Absensi</span>
                </button>
                <button onClick={addSiswa} className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /><span>Tambah</span>
                </button>
              </div>
            }>
              <p className="text-[10px] text-slate-500 font-semibold -mt-1">Isi data siswa, lalu nilai aspek pada kolom <b>Kriteria</b>.</p>
              <div className="space-y-2">
                {form.lembarSiswa.map((s, idx) => (
                  <div key={s.id} className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-indigo-900 uppercase tracking-wide">Siswa {idx + 1}</span>
                      <button onClick={() => removeSiswa(s.id)} title="Hapus baris" className="p-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 transition cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-[60px_1fr] gap-2">
                      <Label text="Nomor">
                        <input value={s.nomor} onChange={(e) => setSiswa(s.id, 'nomor', e.target.value)} className={inputCls} />
                      </Label>
                      <Label text="Nama Siswa">
                        <input value={s.nama} onChange={(e) => setSiswa(s.id, 'nama', e.target.value)} className={inputCls} placeholder="Nama siswa..." />
                      </Label>
                    </div>
                    <Label text="Mata Pelajaran (dari Generator RPM)">
                      <input type="text" value={s.mapel} readOnly className={inputCls} title="Mata pelajaran dapat dipilih di sub menu Generator RPM" />
                    </Label>
                    <Label text="Nama Kelompok">
                      <input value={s.kelompok} onChange={(e) => setSiswa(s.id, 'kelompok', e.target.value)} className={inputCls} placeholder="cth: Kelompok 1" />
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="block text-[11px] font-bold text-slate-600 mb-1.5">Mendengarkan</span>
                        <div className="grid grid-cols-4 gap-1">
                          {[1, 2, 3, 4].map((n) => (
                            <button
                              key={n}
                              onClick={() => setSiswa(s.id, 'mendengarkan', s.mendengarkan === String(n) ? '' : String(n))}
                              className={`px-1 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                s.mendengarkan === String(n) ? 'bg-indigo-900 text-white border-indigo-900' : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="block text-[11px] font-bold text-slate-600 mb-1.5">Komunikasi Non Verbal</span>
                        <div className="grid grid-cols-4 gap-1">
                          {[1, 2, 3, 4].map((n) => (
                            <button
                              key={n}
                              onClick={() => setSiswa(s.id, 'nonVerbal', s.nonVerbal === String(n) ? '' : String(n))}
                              className={`px-1 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                s.nonVerbal === String(n) ? 'bg-indigo-900 text-white border-indigo-900' : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="block text-[11px] font-bold text-slate-600 mb-1.5">Prestasi</span>
                        <div className="grid grid-cols-4 gap-1">
                          {[1, 2, 3, 4].map((n) => (
                            <button
                              key={n}
                              onClick={() => setSiswa(s.id, 'prestasi', s.prestasi === String(n) ? '' : String(n))}
                              className={`px-1 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                s.prestasi === String(n) ? 'bg-indigo-900 text-white border-indigo-900' : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ===== PRATINJAU RUBRIK ===== */}
          <div className="xl:sticky xl:top-24 space-y-4">
            <div className="flex items-center space-x-2 no-print">
              <Eye className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-extrabold text-slate-700">Pratinjau Rubrik</h3>
              <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">Live</span>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 space-y-4 text-[10px]">
              <p className="text-[11px] font-black uppercase text-indigo-800">Rubrik Penilaian</p>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-indigo-900 text-white">
                    <th className="border border-indigo-800 px-2 py-1 text-left">Pernyataan Refleksi</th>
                    <th className="border border-indigo-800 px-2 py-1 text-left">Mata Pelajaran</th>
                    {RUBRIK_LEVELS.map((lv) => (
                      <th key={lv} className="border border-indigo-800 px-2 py-1 text-center text-[9px]">{lv}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {form.rubrik.map((r) => (
                    <tr key={r.id}>
                      <td className="border border-slate-300 px-2 py-1.5 align-top">{r.pernyataan || '-'}</td>
                      <td className="border border-slate-300 px-2 py-1.5 align-top">{r.mapel || '-'}</td>
                      {RUBRIK_LEVELS.map((lv) => (
                        <td key={lv} className="border border-slate-300 px-2 py-1.5 align-top text-center">{r.tingkat === lv ? '✓' : ''}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4">
                <p className="text-[11px] font-black uppercase text-indigo-800 mb-1">Rubrik Penilaian 2 &mdash; Lembar Penilaian Siswa</p>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-indigo-900 text-white">
                      <th rowSpan={3} className="border border-indigo-800 px-2 py-1 text-center">Nomor</th>
                      <th rowSpan={3} className="border border-indigo-800 px-2 py-1 text-left">Nama Siswa</th>
                      <th rowSpan={3} className="border border-indigo-800 px-2 py-1 text-left">Mata Pelajaran</th>
                      <th rowSpan={3} className="border border-indigo-800 px-2 py-1 text-left">Nama Kelompok</th>
                      <th colSpan={12} className="border border-indigo-800 px-2 py-1 text-center">Kriteria</th>
                    </tr>
                    <tr className="bg-indigo-800 text-white">
                      <th colSpan={4} className="border border-indigo-800 px-2 py-1 text-center">Mendengarkan</th>
                      <th colSpan={4} className="border border-indigo-800 px-2 py-1 text-center">Komunikasi Non Verbal</th>
                      <th colSpan={4} className="border border-indigo-800 px-2 py-1 text-center">Prestasi</th>
                    </tr>
                    <tr className="bg-indigo-900 text-white">
                      {[1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4].map((n, i) => (
                        <th key={i} className="border border-indigo-800 px-1 py-1 text-center">{n}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {form.lembarSiswa.map((s) => (
                      <tr key={s.id}>
                        <td className="border border-slate-300 px-2 py-1 text-center">{s.nomor || '-'}</td>
                        <td className="border border-slate-300 px-2 py-1">{s.nama || '-'}</td>
                        <td className="border border-slate-300 px-2 py-1">{s.mapel || '-'}</td>
                        <td className="border border-slate-300 px-2 py-1">{s.kelompok || '-'}</td>
                        {[['mendengarkan'], ['nonVerbal'], ['prestasi']].flatMap(([key]) =>
                          [1, 2, 3, 4].map((n) => (
                            <td key={`${key}-${n}`} className="border border-slate-300 px-2 py-1 text-center">
                              {s[key as 'mendengarkan' | 'nonVerbal' | 'prestasi'] === String(n) ? '\u2713' : ''}
                            </td>
                          ))
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const PreviewDocument: React.FC<{ data: RpmState; biodata: Biodata }> = ({ data, biodata }) => {
  const year = new Date().getFullYear();
  const tm = timeSplit(data.jp);
  const pm = timeSplit(String(Math.max(1, Math.round((parseInt(data.jp) || 0) / Math.max(1, data.skenario.length)))));
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 print-sheet p-6 sm:p-8 space-y-5">
      <div className="text-center border-b-2 border-slate-800 pb-3">
        <h1 className="text-lg font-extrabold text-slate-900 uppercase tracking-wide">Rencana Pembelajaran Mendalam (RPM)</h1>
        <p className="text-[11px] font-semibold text-slate-600">{biodata.namaSekolah}</p>
        <p className="text-[10px] text-slate-500">{biodata.alamat}, {biodata.kota}</p>
      </div>

{/* I. INFORMASI UMUM */}
      <section>
        <DokDivider text="I. Informasi Umum" />
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-[11px] font-black uppercase text-indigo-800 mb-1">A. Identitas RPM</p>
            <div className="text-[11px] py-2 px-4 ml-1 border-l-2 border-indigo-300">
              <div className="grid grid-cols-[120px_12px_1fr] gap-1 py-0.5"><span className="text-left font-bold text-slate-700">Nama Penyusun</span><span className="text-center">:</span><span className="font-medium">{biodata.namaGuru || '-'}</span></div>
              <div className="grid grid-cols-[120px_12px_1fr] gap-1 py-0.5"><span className="text-left font-bold text-slate-700">Sekolah Penyusun</span><span className="text-center">:</span><span className="font-medium">{biodata.namaSekolah || '-'}</span></div>
              <div className="grid grid-cols-[120px_12px_1fr] gap-1 py-0.5"><span className="text-left font-bold text-slate-700">Tahun Pelajaran</span><span className="text-center">:</span><span className="font-medium">{data.tahunPelajaran || '-'}</span></div>
              <div className="grid grid-cols-[120px_12px_1fr] gap-1 py-0.5"><span className="text-left font-bold text-slate-700">Hari</span><span className="text-center">:</span><span className="font-medium">{data.hari || '-'}</span></div>
              <div className="grid grid-cols-[120px_12px_1fr] gap-1 py-0.5"><span className="text-left font-bold text-slate-700">Tanggal</span><span className="text-center">:</span><span className="font-medium">{data.tanggal || '-'}</span></div>
              <div className="grid grid-cols-[120px_12px_1fr] gap-1 py-0.5"><span className="text-left font-bold text-slate-700">Mata Pelajaran</span><span className="text-center">:</span><span className="font-medium">{data.mapel || '-'}</span></div>
              <div className="grid grid-cols-[120px_12px_1fr] gap-1 py-0.5"><span className="text-left font-bold text-slate-700">Modul Ajar</span><span className="text-center">:</span><span className="font-medium">{data.bab || '-'}</span></div>
              <div className="grid grid-cols-[120px_12px_1fr] gap-1 py-0.5"><span className="text-left font-bold text-slate-700">Fase/Kelas</span><span className="text-center">:</span><span className="font-medium">{faseKelasOf(biodata)}</span></div>
              <div className="grid grid-cols-[120px_12px_1fr] gap-1 py-0.5"><span className="text-left font-bold text-slate-700">Alokasi Waktu</span><span className="text-center">:</span><span className="font-medium">{data.jp} JP ({tm.total} menit)</span></div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase text-indigo-800 mb-1">B. Identifikasi Murid</p>
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-indigo-900 text-white">
                  <th className="border border-indigo-800 px-2 py-1 text-left w-1/3">Kategori</th>
                  <th className="border border-indigo-800 px-2 py-1 text-left">Deskripsi</th>
                </tr>
              </thead>
              <tbody>
                {data.diagnostik.map((d) => (
                  <tr key={d.id}>
                    <td className="border border-slate-300 px-2 py-1.5 align-top font-bold">{d.kategori || '-'}</td>
                    <td className="border border-slate-300 px-2 py-1.5 align-top whitespace-pre-wrap">{d.deskripsi || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase text-indigo-800 mb-1">C. MATERI PELAJARAN</p>
            <div className="text-[11px]">
              <div className="grid grid-cols-[120px_12px_1fr] gap-1 py-0.5"><span className="text-left font-bold text-slate-700">Materi Pelajaran</span><span className="text-center">:</span><span className="font-medium whitespace-pre-wrap">{data.materi || '-'}</span></div>
              {data.materiGambar && (
                <div className="mt-2">
                  <span className="text-left font-bold text-slate-700">Foto Materi</span>
                  <img src={data.materiGambar} alt="Foto Materi" className="mt-1 max-h-52 rounded-lg border border-slate-300" />
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase text-indigo-800 mb-1">D. DIMENSI PROFIL LULUSAN</p>
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-indigo-900 text-white">
                  <th className="border border-indigo-800 px-2 py-1 text-left w-[30%]">Dimensi Profil Lulusan</th>
                  <th className="border border-indigo-800 px-2 py-1 text-left">Deskripsi</th>
                </tr>
              </thead>
              <tbody>
                {effectivePpp(data.ppp).length > 0 ? effectivePpp(data.ppp).map((nama) => {
                  const prof = PROFIL_LULUSAN.find((p) => p.nama === nama);
                  return (
                    <tr key={nama}>
                      <td className="border border-slate-300 px-2 py-1.5 align-top font-bold">{nama}</td>
                      <td className="border border-slate-300 px-2 py-1.5 align-top">{prof ? prof.deskripsi : '-'}</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td className="border border-slate-300 px-2 py-1.5 align-top">-</td>
                    <td className="border border-slate-300 px-2 py-1.5 align-top">-</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase text-indigo-800 mb-1">E. Sarana & Prasarana / Media / Alat dan Bahan</p>
            <div className="text-[11px]">
              <div className="grid grid-cols-[120px_12px_1fr] gap-1 py-0.5"><span className="text-left font-bold text-slate-700">Sarana & Prasarana</span><span className="text-center">:</span><span className="font-medium">{data.sarana || '-'}</span></div>
              <div className="grid grid-cols-[120px_12px_1fr] gap-1 py-0.5"><span className="text-left font-bold text-slate-700">Media</span><span className="text-center">:</span><span className="font-medium">{data.media.join(', ') || '-'}</span></div>
              <div className="grid grid-cols-[120px_12px_1fr] gap-1 py-0.5"><span className="text-left font-bold text-slate-700">Alat & Bahan</span><span className="text-center">:</span><span className="font-medium">{data.alatBahan || '-'}</span></div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase text-indigo-800 mb-1">F. Target Peserta Didik</p>
            <div className="text-[11px]">
              <div className="grid grid-cols-[120px_12px_1fr] gap-1 py-0.5"><span className="text-left font-bold text-slate-700">Target</span><span className="text-center">:</span><span className="font-medium">{data.targetPeserta || '-'}</span></div>
              <div className="grid grid-cols-[120px_12px_1fr] gap-1 py-0.5"><span className="text-left font-bold text-slate-700">Jumlah</span><span className="text-center">:</span><span className="font-medium">{data.jumlahPeserta || '-'} peserta didik</span></div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase text-indigo-800 mb-1">G. Pendekatan, Model, dan Metode Pembelajaran</p>
            <div className="text-[11px]">
              <div className="grid grid-cols-[120px_12px_1fr] gap-1 py-0.5"><span className="text-left font-bold text-slate-700">Pendekatan</span><span className="text-center">:</span><span className="font-medium">{data.pendekatan || '-'}</span></div>
              <div className="grid grid-cols-[120px_12px_1fr] gap-1 py-0.5"><span className="text-left font-bold text-slate-700">Model</span><span className="text-center">:</span><span className="font-medium">{data.model || '-'}</span></div>
              <div className="grid grid-cols-[120px_12px_1fr] gap-1 py-0.5"><span className="text-left font-bold text-slate-700">Metode</span><span className="text-center">:</span><span className="font-medium">{data.metode || '-'}</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* II==== DESAIN PEMBELAJARAN */}
      <section>
        <DokDivider text="II. Desain Pembelajaran" accent="bg-indigo-800" />
        <div className="mt-3">
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="bg-indigo-900 text-white">
                <th className="border border-indigo-800 px-2 py-1 text-left align-top w-[30%]">Komponen</th>
                <th className="border border-indigo-800 px-2 py-1 text-left align-top">Deskripsi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 px-2 py-1.5 align-top font-bold">1. Capaian Pembelajaran</td>
                <td className="border border-slate-300 px-2 py-1.5 align-top whitespace-pre-wrap">{data.cp || '-'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-2 py-1.5 align-top font-bold">2. Lintas Disiplin Ilmu</td>
                <td className="border border-slate-300 px-2 py-1.5 align-top whitespace-pre-wrap">{data.lintasDisiplin || '-'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-2 py-1.5 align-top font-bold">3. Tujuan Pembelajaran</td>
                <td className="border border-slate-300 px-2 py-1.5 align-top whitespace-pre-wrap">{data.tujuanPembelajaran || '-'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-2 py-1.5 align-top font-bold">4. Praktik Pedagogis (Pendekatan Deep Learning)</td>
                <td className="border border-slate-300 px-2 py-1.5 align-top whitespace-pre-wrap">{data.praktikPedagogis || '-'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-2 py-1.5 align-top font-bold">5. Pemanfaatan Digital</td>
                <td className="border border-slate-300 px-2 py-1.5 align-top whitespace-pre-wrap">{data.pemanfaatanDigital || '-'}</td>
              </tr>
</tbody>
        </table>
        </div>
      </section>

      {/* III==== PENGALAMAN BELAJAR */}
      <section>
        <DokDivider text="III. Pengalaman Belajar (Rincian per Pertemuan)" accent="bg-indigo-800" />
        <div className="mt-3 space-y-3">
          {data.skenario.map((sk) => (
            <div key={sk.id}>
              <p className="text-[11px] font-bold text-slate-800 mb-1">{sk.judul}</p>
              <table className="w-full border-collapse text-[10px]">
                <thead>
                  <tr className="bg-indigo-900 text-white">
                    <th className="border border-indigo-800 px-2 py-1 text-left w-[18%]">Kegiatan</th>
                    <th className="border border-indigo-800 px-2 py-1 text-left">Deskripsi Kegiatan Pembelajaran</th>
                    <th className="border border-indigo-800 px-2 py-1 text-left w-[12%]">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 px-2 py-1.5 align-top font-bold">Kegiatan Pendahuluan</td>
                    <td className="border border-slate-300 px-2 py-1.5 align-top whitespace-pre-wrap">{sk.awal || '-'}</td>
                    <td className="border border-slate-300 px-2 py-1.5 align-top text-center">{pm.awal} menit</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 px-2 py-1.5 align-top font-bold">Kegiatan Inti</td>
                    <td className="border border-slate-300 px-2 py-1.5 align-top whitespace-pre-wrap">{sk.inti || '-'}</td>
                    <td className="border border-slate-300 px-2 py-1.5 align-top text-center">{pm.inti} menit</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 px-2 py-1.5 align-top font-bold">Kegiatan Penutup</td>
                    <td className="border border-slate-300 px-2 py-1.5 align-top whitespace-pre-wrap">{sk.penutup || '-'}</td>
                    <td className="border border-slate-300 px-2 py-1.5 align-top text-center">{pm.penutup} menit</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>

      {/* IV==== ASESMEN */}
      <section>
        <DokDivider text="IV. Asesmen" accent="bg-indigo-800" />
        <table className="w-full border-collapse text-[10px] mt-3">
          <thead>
            <tr className="bg-indigo-900 text-white">
              <th className="border border-indigo-800 px-2 py-1 text-left w-[30%]">Jenis Asesmen</th>
              <th className="border border-indigo-800 px-2 py-1 text-left">Teknik dan Instrumen</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 px-2 py-1.5 align-top font-bold">1. Asesmen Awal (Diagnostik)</td>
              <td className="border border-slate-300 px-2 py-1.5 align-top whitespace-pre-wrap">{data.asesmenAwal || '-'}</td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-2 py-1.5 align-top font-bold">2. Asesmen Proses (Formatif)</td>
              <td className="border border-slate-300 px-2 py-1.5 align-top whitespace-pre-wrap">{data.asesmenProses || '-'}</td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-2 py-1.5 align-top font-bold">3. Asesmen Akhir Bab (Sumatif)</td>
              <td className="border border-slate-300 px-2 py-1.5 align-top whitespace-pre-wrap">{data.asesmenSumatif || '-'}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* V==== PENGAYAAN & REMEDIAL */}
      <section>
        <DokDivider text="V. Pengayaan dan Remedial" accent="bg-indigo-800" />
        <table className="w-full border-collapse text-[10px] mt-3">
          <thead>
            <tr className="bg-indigo-900 text-white">
              <th className="border border-indigo-800 px-2 py-1 text-left w-[30%]">Program</th>
              <th className="border border-indigo-800 px-2 py-1 text-left">Deskripsi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 px-2 py-1.5 align-top font-bold">1. Pengayaan</td>
              <td className="border border-slate-300 px-2 py-1.5 align-top whitespace-pre-wrap">{data.pengayaan || '-'}</td>
            </tr>
            <tr>
              <td className="border border-slate-300 px-2 py-1.5 align-top font-bold">2. Remedial</td>
              <td className="border border-slate-300 px-2 py-1.5 align-top whitespace-pre-wrap">{data.remedial || '-'}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ===== TANDA TANGAN PENGESAHAN ===== */}
      <section className="pt-4">
        <div className="text-right text-[11px] font-semibold text-slate-600 mb-6 uppercase">
          {[biodata.desa && biodata.desa.trim(), data.tanggal && String(data.tanggal).trim()].filter(Boolean).join(', ')}
        </div>
        <div className="grid grid-cols-2 gap-10 text-center text-[11px]">
          <div>
            <p className="font-semibold text-slate-700">Mengetahui / Menyetujui,</p>
            <p className="font-semibold text-slate-700">Kepala Sekolah</p>
            <div className="mt-14">
              <p className="font-bold text-slate-800">{biodata.namaKepsek || '........................................'}</p>
              <p className="font-semibold text-slate-600">NIP. {biodata.nipKepsek || '........................................'}</p>
            </div>
          </div>
          <div>
            <p className="font-semibold text-slate-700">Guru Mata Pelajaran</p>
            <div className="mt-14">
              <p className="font-extrabold text-slate-900">{biodata.namaGuru || '........................................'}</p>
              <p className="font-semibold text-slate-600">NIP. {biodata.nipGuru || '........................................'}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="text-[10px] text-slate-500 border-t border-slate-300 pt-3 text-center">
        Disusun oleh : {biodata.namaGuru || 'Guru'} &bull; {biodata.namaSekolah} &bull; {year}
      </div>
    </div>
  );
};

function exportHTML(d: RpmState, biodata: Biodata): string {
  const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
  const tm = timeSplit(d.jp);
  const pm = timeSplit(String(Math.max(1, Math.round((parseInt(d.jp) || 0) / Math.max(1, d.skenario.length)))));
  const diagRows = (d.diagnostik || []).map((di) =>
    `<tr><td style="border:1px solid #94a3b8;padding:4px;font-weight:bold;">${esc(di.kategori)}</td><td style="border:1px solid #94a3b8;padding:4px;white-space:pre-wrap;">${esc(di.deskripsi)}</td></tr>`).join('');
  return `<html><head><meta charset="utf-8"><title>RPM</title></head><body style="font-family:Arial,sans-serif;color:#111;">
    <h2 style="text-align:center;">RENCANA PEMBELAJARAN MENDALAM (RPM)</h2>
    <p style="text-align:center;">${esc(biodata.namaSekolah)}<br/>${esc(biodata.alamat)}, ${esc(biodata.kota)}</p>

    <h3 style="background:#312e81;color:#fff;padding:6px;border-radius:4px;">I. INFORMASI UMUM</h3>
    <h4>A. Identitas RPM</h4>
    <p>Nama Penyusun: ${esc(biodata.namaGuru)}<br/>Sekolah Penyusun: ${esc(biodata.namaSekolah)}<br/>Tahun Pelajaran: ${esc(d.tahunPelajaran)}<br/>Hari: ${esc(d.hari)}<br/>Tanggal: ${esc(d.tanggal)}<br/>Mata Pelajaran: ${esc(d.mapel)}<br/>Modul Ajar: ${esc(d.bab)}<br/>Fase/Kelas: ${esc(faseKelasOf(biodata))}<br/>Alokasi Waktu: ${esc(d.jp)} JP (${tm.total} menit)</p>

    <h4 style="margin-top:12px;">B. Identifikasi Murid</h4>
    <table border="1" cellpadding="6" style="border-collapse:collapse;width:100%;">
      <tr style="background:#eee;"><th style="padding:4px;text-align:left;">Kategori</th><th style="padding:4px;text-align:left;">Deskripsi</th></tr>
      ${diagRows}
    </table>

    <h4>C. Materi Pelajaran</h4>
    <p>${esc(d.materi)}</p>
    ${d.materiGambar ? `<p><img src="${d.materiGambar}" alt="Foto Materi" style="max-width:600px;border:1px solid #ccc;border-radius:4px;"/></p>` : ''}

    <h4>D. Dimensi Profil Lulusan</h4>
    ${effectivePpp(d.ppp).length ? effectivePpp(d.ppp).map((nama) => {
      const prof = PROFIL_LULUSAN.find((p) => p.nama === nama);
      return `<p style="font-weight:bold;margin-bottom:2px;">${esc(nama)}</p><p style="margin-bottom:6px;">${esc(prof ? prof.deskripsi : '-')}</p>`;
    }).join('') : '<p>-</p>'}

    <h4>E. Sarana & Prasarana / Media / Alat dan Bahan</h4>
    <p>Sarana & Prasarana: ${esc(d.sarana)}<br/>Media: ${esc(d.media.join(', '))}<br/>Alat & Bahan: ${esc(d.alatBahan)}</p>

    <h4>F. Target Peserta Didik</h4>
    <p>Target: ${esc(d.targetPeserta)}<br/>Jumlah: ${esc(d.jumlahPeserta || '-')} peserta didik</p>

    <h4>G. Pendekatan, Model, dan Metode Pembelajaran</h4>
    <p>Pendekatan: ${esc(d.pendekatan)}<br/>Model: ${esc(d.model)}<br/>Metode: ${esc(d.metode)}</p>

    <h2 style="color:#312e81;margin-top:20px;">II. DESAIN PEMBELAJARAN</h2>

    <table border="1" cellpadding="6" style="border-collapse:collapse;width:100%;">
      <tr style="background:#312e81;color:#fff;"><th style="padding:6px;text-align:left;width:30%;">Komponen</th><th style="padding:6px;text-align:left;">Deskripsi</th></tr>
      <tr><td style="font-weight:bold;">1. Capaian Pembelajaran</td><td>${esc(d.cp) || '-'}</td></tr>
      <tr><td style="font-weight:bold;">2. Lintas Disiplin Ilmu</td><td>${esc(d.lintasDisiplin) || '-'}</td></tr>
      <tr><td style="font-weight:bold;">3. Tujuan Pembelajaran</td><td>${esc(d.tujuanPembelajaran) || '-'}</td></tr>
      <tr><td style="font-weight:bold;">4. Praktik Pedagogis (Pendekatan Deep Learning)</td><td>${esc(d.praktikPedagogis) || '-'}</td></tr>
      <tr><td style="font-weight:bold;">5. Pemanfaatan Digital</td><td>${esc(d.pemanfaatanDigital) || '-'}</td></tr>
    </table>

    <h2 style="color:#312e81;margin-top:20px;">III. PENGALAMAN BELAJAR (RINCIAN PER PERTEMUAN)</h2>

    ${(d.skenario || []).map((sk) => `
      <p style="font-weight:bold;">${esc(sk.judul)}</p>
      <table border="1" cellpadding="6" style="border-collapse:collapse;width:100%;">
        <tr style="background:#312e81;color:#fff;"><th style="padding:6px;text-align:left;width:18%;">Kegiatan</th><th style="padding:6px;text-align:left;">Deskripsi Kegiatan Pembelajaran</th><th style="padding:6px;text-align:left;width:12%;">Waktu</th></tr>
        <tr><td>Kegiatan Pendahuluan</td><td>${esc(sk.awal)}</td><td>${pm.awal} menit</td></tr>
        <tr><td>Kegiatan Inti</td><td>${esc(sk.inti)}</td><td>${pm.inti} menit</td></tr>
        <tr><td>Kegiatan Penutup</td><td>${esc(sk.penutup)}</td><td>${pm.penutup} menit</td></tr>
      </table>`).join('')}

    <h2 style="color:#312e81;margin-top:20px;">IV. ASESMEN</h2>

    <table border="1" cellpadding="6" style="border-collapse:collapse;width:100%;">
      <tr style="background:#312e81;color:#fff;"><th style="padding:6px;text-align:left;width:30%;">Jenis Asesmen</th><th style="padding:6px;text-align:left;">Teknik dan Instrumen</th></tr>
      <tr><td style="font-weight:bold;">1. Asesmen Awal (Diagnostik)</td><td>${esc(d.asesmenAwal)}</td></tr>
      <tr><td style="font-weight:bold;">2. Asesmen Proses (Formatif)</td><td>${esc(d.asesmenProses)}</td></tr>
      <tr><td style="font-weight:bold;">3. Asesmen Akhir Bab (Sumatif)</td><td>${esc(d.asesmenSumatif)}</td></tr>
    </table>

    <h2 style="color:#312e81;margin-top:20px;">V. PENGAYAAN DAN REMEDIAL</h2>

    <table border="1" cellpadding="6" style="border-collapse:collapse;width:100%;">
      <tr style="background:#312e81;color:#fff;"><th style="padding:6px;text-align:left;width:30%;">Program</th><th style="padding:6px;text-align:left;">Deskripsi</th></tr>
      <tr><td style="font-weight:bold;">1. Pengayaan</td><td>${esc(d.pengayaan)}</td></tr>
      <tr><td style="font-weight:bold;">2. Remedial</td><td>${esc(d.remedial)}</td></tr>
    </table>

    <div style="margin-top:40px;">
      <p style="text-align:right;font-size:12px;">${esc([biodata.desa, d.tanggal].filter(Boolean).join(', '))}</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="text-align:center;font-size:12px;width:50%;">
            <p>Mengetahui / Menyetujui,</p>
            <p>Kepala Sekolah</p>
            <div style="height:70px;"></div>
            <p style="font-weight:bold;">${esc(biodata.namaKepsek)}</p>
            <p>NIP. ${esc(biodata.nipKepsek)}</p>
          </td>
          <td style="text-align:center;font-size:12px;width:50%;">
            <p>Guru Mata Pelajaran</p>
            <div style="height:70px;"></div>
            <p style="font-weight:bold;">${esc(biodata.namaGuru)}</p>
            <p>NIP. ${esc(biodata.nipGuru)}</p>
          </td>
        </tr>
      </table>
    </div>

    <p style="text-align:center;font-size:11px;margin-top:16px;">Disusun: ${esc(biodata.namaGuru)} — ${esc(biodata.namaSekolah)} — ${new Date().getFullYear()}</p>
  </body></html>`;
}

function sanitize(s: string): string {
  return (s || '').replace(/[^a-zA-Z0-9 _-]/g, '').trim().replace(/\s+/g, '_') || 'RPM';
}