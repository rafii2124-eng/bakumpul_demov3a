import React, { useState } from 'react';
import {
  Biodata,
  BukuNilaiSubTab,
  BNFilter,
  SubjectStudentGrade,
  StudentEvaluationGrade
} from '../types';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Edit3,
  Layers,
  Lock,
  FileUp,
  Download,
  Printer,
  Award,
  Trash2,
  Plus,
  Minus,
  RefreshCw,
  Sliders,
  UserPlus,
  Users,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

interface BukuNilaiTabProps {
  biodata: Biodata;
  subTab: BukuNilaiSubTab;
  setSubTab: (st: BukuNilaiSubTab) => void;
  rekapMatpelSubject: string;
  setRekapMatpelSubject: (s: string) => void;
  bnMatpelSubject: string;
  setBnMatpelSubject: (s: string) => void;
  bnFilter: BNFilter;
  setBnFilter: (f: BNFilter) => void;
  lockedTargets: Record<string, number>;
  kktpCapaian?: Record<string, number>;
  subjectGradesDatabase: Record<string, SubjectStudentGrade[]>;
  setSubjectGradesDatabase: React.Dispatch<React.SetStateAction<Record<string, SubjectStudentGrade[]>>>;
  gradesDatabase: Record<string, StudentEvaluationGrade[]>;
  setGradesDatabase: React.Dispatch<React.SetStateAction<Record<string, StudentEvaluationGrade[]>>>;
  defaultSubjectData: Record<string, Record<string, string[]>>;
  triggerPrint: (mode: 'diagnosa' | 'kktp' | 'bukunilai', viewTitle?: string) => void;
  showToast: (msg: string) => void;
  isDemo?: boolean;
}

export const BukuNilaiTab: React.FC<BukuNilaiTabProps> = ({
  biodata,
  subTab,
  setSubTab,
  rekapMatpelSubject,
  setRekapMatpelSubject,
  bnMatpelSubject,
  setBnMatpelSubject,
  bnFilter,
  setBnFilter,
  lockedTargets,
  kktpCapaian,
  subjectGradesDatabase,
  setSubjectGradesDatabase,
  gradesDatabase,
  setGradesDatabase,
  defaultSubjectData,
  triggerPrint,
  showToast,
  isDemo
}) => {
  const currentRekapTarget = lockedTargets[rekapMatpelSubject] || 75.0;
  const currentBnTarget = lockedTargets[bnMatpelSubject] || 75.0;

  // Nilai "KKTP CAPAIAN" dari menu Hitung KKTP (mengikuti perubahan rubrik guru)
  const rekapCapaian = kktpCapaian?.[rekapMatpelSubject] ?? 75.0;

  // Local state for dynamic LM column count per subject
  const [lmCounts, setLmCounts] = useState<Record<string, number>>({});

  const getLmCount = (subject: string): number => {
    if (lmCounts[subject] !== undefined && lmCounts[subject] > 0) {
      return lmCounts[subject];
    }
    const cpList = (defaultSubjectData[biodata.fase] && defaultSubjectData[biodata.fase][subject]) ?
      defaultSubjectData[biodata.fase][subject] : [];
    return cpList.length > 0 ? cpList.length : 5;
  };

  const setSubjectLmCount = (subject: string, count: number) => {
    if (isDemo) {
      showToast("🔒 Mode Demo: Penyesuaian kolom dikunci dalam mode lihat saja.");
      return;
    }
    const validCount = Math.max(1, count);
    setLmCounts(prev => ({ ...prev, [subject]: validCount }));
    showToast(`Jumlah kolom LM untuk ${subject} disesuaikan menjadi ${validCount} kolom.`);
  };

  const getStudentLMs = (s: SubjectStudentGrade, count: number): (number | undefined)[] => {
    let list: (number | undefined)[] = [];
    if (s.lms && Array.isArray(s.lms) && s.lms.length > 0) {
      list = [...s.lms];
    } else {
      list = [s.lm1, s.lm2, s.lm3, s.lm4, s.lm5];
    }
    while (list.length < count) {
      list.push(undefined);
    }
    return list.slice(0, count);
  };

  // Ubah nilai kosong/undefined menjadi 0 untuk perhitungan, tanpa menampilkan 75 default
  const numOrZero = (v: number | undefined): number => (typeof v === 'number' && !isNaN(v) ? v : 0);

  // Filter analisis ketuntasan belajar pada Rekap e-Rapor
  const [rekapStatusFilter, setRekapStatusFilter] = useState<'all' | 'tuntas' | 'belum' | 'remedial'>('all');

  const REMEDIAL_FLOOR = 60;

  const ketuntasanStatus = (na: number): 'tuntas' | 'belum' | 'remedial' => {
    if (na >= currentRekapTarget) return 'tuntas';
    if (na >= REMEDIAL_FLOOR) return 'belum';
    return 'remedial';
  };

  // Algoritma CAPAIAN KOMPETENSI (DESKRIPSI RAPOR):
  // nilai rapor (NA) dibandingkan dengan Target KKTP lalu dikonversi ke kata.
  //   NA <  KKTP           -> "Belum Muncul"    (Ketuntasan: Belum Tuntas)
  //   NA == KKTP           -> "Sebagian Kecil"  (Ketuntasan: Tuntas)
  //   KKTP < NA (menengah) -> "Sebagian Besar"  (Ketuntasan: Tuntas)
  //   NA sangat tinggi     -> "Keseluruhan"     (Ketuntasan: Tuntas)
  const capaianLevel = (na: number): 'Belum Muncul' | 'Sebagian Kecil' | 'Sebagian Besar' | 'Keseluruhan' => {
    const t = currentRekapTarget;
    if (na < t) return 'Belum Muncul';
    const span = Math.max(1, 100 - t);
    if (na < t + span / 3) return 'Sebagian Kecil';
    if (na < t + (2 * span) / 3) return 'Sebagian Besar';
    return 'Keseluruhan';
  };

  // Analisis ketuntasan belajar per siswa sesuai Target KKTP guru
  const rekapRows = (subjectGradesDatabase[rekapMatpelSubject] || []).map((s) => {
    const currentLmCount = getLmCount(rekapMatpelSubject);
    const lms = getStudentLMs(s, currentLmCount);
    const v = lms.map(numOrZero);
    const avgLM = Math.round(v.reduce((a, b) => a + b, 0) / currentLmCount);
    const na = Math.round((avgLM + numOrZero(s.sas)) / 2);
    const status = ketuntasanStatus(na);
    const cpList = (defaultSubjectData[biodata.fase] && defaultSubjectData[biodata.fase][rekapMatpelSubject])
      ? defaultSubjectData[biodata.fase][rekapMatpelSubject]
      : [];
    const maxVal = Math.max(...v);
    const minVal = Math.min(...v);
    const maxIdx = v.indexOf(maxVal);
    const minIdx = v.indexOf(minVal);
    const level = capaianLevel(na);
    const cpTerbaik = cpList[maxIdx] || `materi LM ${maxIdx + 1}`;
    const cpTerendah = cpList[minIdx] || `materi LM ${minIdx + 1}`;
    const fraseLevel =
      level === 'Belum Muncul' ? 'belum menunjukkan penguasaan pada kompetensi'
      : level === 'Sebagian Kecil' ? 'telah menunjukkan penguasaan pada sebagian kecil kompetensi'
      : level === 'Sebagian Besar' ? 'telah menunjukkan penguasaan pada sebagian besar kompetensi'
      : 'telah menunjukkan penguasaan pada keseluruhan kompetensi';
    let deskripsi = `Ananda ${s.nama}, ${fraseLevel} dalam asesmen sumatif, serta memperlihatkan pemahaman yang baik terhadap ${cpTerbaik}.`;
    if (minVal < currentRekapTarget) {
      deskripsi += ` Perlu bimbingan dalam ${cpTerendah}.`;
    }
    return { s, lms, avgLM, na, status, level, deskripsi };
  });

  const filteredRows = rekapRows.filter(r => rekapStatusFilter === 'all' || r.status === rekapStatusFilter);

  const ketuntasanStats = {
    all: rekapRows.length,
    tuntas: rekapRows.filter(r => r.status === 'tuntas').length,
    belum: rekapRows.filter(r => r.status === 'belum').length,
    remedial: rekapRows.filter(r => r.status === 'remedial').length
  };
  const pctTuntas = ketuntasanStats.all > 0 ? Math.round((ketuntasanStats.tuntas / ketuntasanStats.all) * 100) : 0;

  // Sync rekap grades changes to state and evaluation database
  const updateRekapGrade = (
    subject: string,
    studentId: number | string,
    field: string,
    value: string | number,
    lmIndex?: number
  ) => {
    if (isDemo) {
      showToast("🔒 Mode Demo: Nilai siswa dikunci dalam mode lihat saja.");
      return;
    }
    // Agar baris yang sedang diedit tidak "hilang" saat status ketuntasannya berubah
    // (mis. berubah kategori sehingga tidak lagi cocok dengan filter aktif).
    if (rekapStatusFilter !== 'all') setRekapStatusFilter('all');
    if (field === 'nama' || field === 'nisn') {
      const strVal = value as string;
      setSubjectGradesDatabase(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(subKey => {
          next[subKey] = (next[subKey] || []).map(s => {
            if (s.id === studentId || String(s.id) === String(studentId)) {
              return { ...s, [field]: strVal };
            }
            return s;
          });
        });
        return next;
      });

      setGradesDatabase(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(subKey => {
          next[subKey] = (next[subKey] || []).map(s => {
            if (s.id === studentId || String(s.id) === String(studentId)) {
              return { ...s, [field]: strVal };
            }
            return s;
          });
        });
        return next;
      });
    } else {
      const count = getLmCount(subject);
      setSubjectGradesDatabase(prev => {
        const list = prev[subject] ? [...prev[subject]] : [];
        const idx = list.findIndex(s => s.id === studentId || String(s.id) === String(studentId));
        if (idx !== -1) {
          const student = { ...list[idx] };
          const lms = getStudentLMs(student, count);
          const numVal = value === '' ? undefined : (parseFloat(value as string) || 0);

          if (lmIndex !== undefined) {
            lms[lmIndex] = numVal;
          } else if (field.startsWith('lm')) {
            const mIdx = parseInt(field.replace('lm', ''), 10) - 1;
            if (!isNaN(mIdx) && mIdx >= 0) {
              lms[mIdx] = numVal;
            }
          } else if (field === 'sas') {
            student.sas = numVal;
          }

          student.lms = lms;
          student.lm1 = lms[0] ?? undefined;
          student.lm2 = lms[1] ?? undefined;
          student.lm3 = lms[2] ?? undefined;
          student.lm4 = lms[3] ?? undefined;
          student.lm5 = lms[4] ?? undefined;

          list[idx] = student;

          // Sync to evaluation database
          const filled = lms.filter(v => typeof v === 'number' && !isNaN(v));
          const avgLM = filled.length > 0 ? Math.round(filled.reduce((a, b) => a + (b || 0), 0) / filled.length) : undefined;
          setGradesDatabase(prevEval => {
            const evalList = prevEval[subject] ? [...prevEval[subject]] : [];
            const eIdx = evalList.findIndex(e => e.id === studentId || String(e.id) === String(studentId));
            if (eIdx !== -1) {
              evalList[eIdx] = {
                ...evalList[eIdx],
                sumatifLM: avgLM,
                sumatifAS: student.sas
              };
            }
            return { ...prevEval, [subject]: evalList };
          });
        }
        return { ...prev, [subject]: list };
      });
    }
  };

  const deleteStudent = (studentId?: number | string, indexFallback?: number) => {
    setSubjectGradesDatabase(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(subKey => {
        const list = next[subKey] || [];
        next[subKey] = list.filter((s, idx) => {
          if (studentId !== undefined && s.id !== undefined) {
            return String(s.id) !== String(studentId);
          }
          return idx !== indexFallback;
        });
      });
      return next;
    });

    setGradesDatabase(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(subKey => {
        const list = next[subKey] || [];
        next[subKey] = list.filter((s, idx) => {
          if (studentId !== undefined && s.id !== undefined) {
            return String(s.id) !== String(studentId);
          }
          return idx !== indexFallback;
        });
      });
      return next;
    });

    showToast("Data siswa berhasil dihapus dari Buku Nilai & Absensi.");
  };

  const deleteRekapStudent = (_subject: string, studentId: number | string, indexFallback?: number) => {
    deleteStudent(studentId, indexFallback);
  };

  const exportRekapMatpelExcel = () => {
    const list = subjectGradesDatabase[rekapMatpelSubject] || [];
    const currentLmCount = getLmCount(rekapMatpelSubject);
    const subjectUpper = rekapMatpelSubject.toUpperCase();
    const rawKelas = biodata.kelas || "4";
    const gradeMatch = rawKelas.match(/\d+/);
    const gradeNum = gradeMatch ? gradeMatch[0] : (rawKelas.includes("VI") ? "6" : rawKelas.includes("V") ? "5" : "4");
    const semNum = biodata.semester || "2";
    const kelasFormatted = rawKelas.toUpperCase().startsWith("KELAS") ? rawKelas.toUpperCase() : `KELAS ${rawKelas.toUpperCase()}`;

    // TP codes according to e-Rapor format (e.g. TP.621, TP.622, ...)
    const tpCodes = Array.from({ length: currentLmCount }, (_, i) => `TP.${gradeNum}${semNum}${i + 1}`);

    // Fetch CP descriptions for legend / footer
    const cpList = (defaultSubjectData[biodata.fase] && defaultSubjectData[biodata.fase][rekapMatpelSubject]) ?
      defaultSubjectData[biodata.fase][rekapMatpelSubject] : [];

    // Build AoA (Array of Arrays) according to e-Rapor template format
    const tpHeaderRow2 = [...tpCodes, "NILAI"];
    const aoa: (string | number)[][] = [
      [`FORMAT IMPORT NILAI RAPOR ${subjectUpper}, KELAS ${kelasFormatted}`],
      [], // Empty row
      ["NO", "NISN", "NAMA SISWA", "NILAI RAPOR", "TINGKAT KETERCAPAIAN TP", ...Array(Math.max(0, currentLmCount - 1)).fill(""), "VALIDASI"],
      ["", "", "", "", ...tpHeaderRow2]
    ];

    list.forEach((s, idx) => {
      const lms = getStudentLMs(s, currentLmCount);
      const na = Math.round(lms.reduce((a, b) => numOrZero(a) + numOrZero(b), 0) / currentLmCount);
      const sasN = numOrZero(s.sas);
      const rapor = Math.round((na + sasN) / 2);

      const minVal = Math.min(...lms.map(numOrZero));
      const minIdx = lms.indexOf(lms.find(v => numOrZero(v) === minVal));

      // Determine 'T' (Tercapai / Optimal) vs 'R' (Perlu Peningkatan / Remedial)
      const tpFlags = lms.map((val, i) => {
        if (i === minIdx && rapor < 100) return 'R';
        if (numOrZero(val) < currentRekapTarget) return 'R';
        return 'T';
      });

      aoa.push([
        idx + 1,
        s.nisn,
        s.nama,
        rapor,
        ...tpFlags,
        "Valid"
      ]);
    });

    // Add footer legends and validation notes matching e-Rapor standard
    aoa.push([]);
    aoa.push(["KETERANGAN :"]);
    tpCodes.forEach((code, i) => {
      const desc = cpList[i] || `Peserta didik mampu memahami materi lingkup ${i + 1}`;
      aoa.push([`> ${code} : ${desc}`]);
    });
    aoa.push(["Catatan Validasi:"]);
    aoa.push(["> Jika Nilai Rapor Siswa kurang dari 100, silahkan dipilih Tujuan Pembelajaran mana saja yang masih perlu peningkatan (minimal 1)"]);
    aoa.push(["> Selain memilih Tujuan Pembelajaran yang masih perlu peningkatan, pilih juga Tujuan Pembelajaran yang mana saja sudah dicapai dengan sangat optimal (minimal 1)"]);
    aoa.push(["> Tidak mesti semua Tujuan Pembelajaran yarus dipilih, minimal pilih satu yang paling optimal dan satu yang paling minimal"]);
    aoa.push(["> Pahami Konsep Pembelajaran dan Asesmen sebagaimana telah dimuat pada Buku Panduan PPA agar tidak keliru dalam memahami format nilai rapor ini."]);

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Merges
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 + currentLmCount } },
      { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } },
      { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } },
      { s: { r: 2, c: 2 }, e: { r: 3, c: 2 } },
      { s: { r: 2, c: 3 }, e: { r: 3, c: 3 } },
      { s: { r: 2, c: 4 }, e: { r: 2, c: 3 + currentLmCount } },
    ];

    // Column widths
    const cols = [
      { wch: 6 },  // NO
      { wch: 16 }, // NISN
      { wch: 35 }, // NAMA SISWA
      { wch: 14 }, // NILAI RAPOR
      ...Array(currentLmCount).fill({ wch: 10 }),
      { wch: 14 }, // VALIDASI NILAI
    ];
    ws['!cols'] = cols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "F_Nilai_Rapor");
    XLSX.writeFile(wb, `F_Nilai_Rapor_${subjectUpper.replace(/\s+/g, '_')}_Kelas_${gradeNum}.xlsx`);
    showToast(`Berhasil mengunduh file format import e-Rapor ${rekapMatpelSubject}`);
  };

  // Import nilai rekap dari file Excel format e-Rapor (F_Nilai_Rapor) / f_nilai
  const handleImportRekapExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isDemo) {
      showToast("🔒 Mode Demo: Import nilai rekap dikunci. Nilai hanya untuk guru terdaftar.");
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' });

        // Cari baris header (mengandung NISN & NAMA SISWA)
        let headerIdx = -1;
        let colNisn = -1, colNama = -1, colNilai = -1;
        for (let r = 0; r < aoa.length; r++) {
          const row = (aoa[r] || []).map(c => String(c ?? '').trim().toUpperCase());
          const nisnCol = row.findIndex(c => c === 'NISN' || c === 'NIS' || c === 'NIS/NISN' || c === 'NIS / NISN');
          const namaCol = row.findIndex(c => c === 'NAMA SISWA' || c === 'NAMA PESERTA DIDIK' || c === 'NAMA');
          const nilaiCol = row.findIndex(c => c === 'NILAI RAPOR' || c === 'NA RAPOR' || c === 'NILAI' || c === 'NILAI AKHIR' || c === 'NA');
          if (namaCol !== -1) {
            headerIdx = r;
            colNisn = nisnCol;
            colNama = namaCol;
            colNilai = nilaiCol !== -1 ? nilaiCol : (row.findIndex(c => c.includes('RAPOR')) !== -1 ? row.findIndex(c => c.includes('RAPOR')) : -1);
            break;
          }
        }
        if (headerIdx === -1 || colNama === -1) {
          showToast("Format file tidak dikenali. Pastikan memakai hasil Export Excel Format e-Rapor.");
          return;
        }

        const subject = rekapMatpelSubject;
        const count = getLmCount(subject);
        const imported: Record<string, number> = {};

        for (let r = headerIdx + 1; r < aoa.length; r++) {
          const row = aoa[r] || [];
          const nama = String(row[colNama] ?? '').trim();
          const nisn = colNisn !== -1 ? String(row[colNisn] ?? '').trim() : '';
          const nilaiRaw = colNilai !== -1 ? String(row[colNilai] ?? '').trim() : '';
          if (!nama && !nisn) continue;
          const nilai = parseFloat(nilaiRaw.replace(',', '.'));
          if (isNaN(nilai)) continue;
          imported[nama.toLowerCase()] = nilai;
          if (nisn) imported[nisn.toLowerCase()] = nilai;
        }

        const keys = Object.keys(imported);
        if (keys.length === 0) {
          showToast("Tidak ada nilai terbaca dari file. Periksa kolom NISN / Nama Siswa / Nilai Rapor.");
          return;
        }

        setSubjectGradesDatabase(prev => {
          const list = prev[subject] ? [...prev[subject]] : [];
          let updated = 0;
          const nextList = list.map(s => {
            const score = imported[s.nisn.toLowerCase()] ?? imported[s.nama.toLowerCase()];
            if (score === undefined) return s;
            updated++;
            const lms: number[] = Array(count).fill(score);
            return { ...s, lms, lm1: score, lm2: score, lm3: score, lm4: score, lm5: score, sas: score };
          });
          if (updated > 0) showToast(`Berhasil mengimpor ${updated} nilai untuk ${subject} (LM & SAS diisi dari Nilai Rapor).`);
          else showToast("File terbaca, tapi tidak ada siswa yang cocok dengan daftar di rekap. Impor dibatalkan.");
          return { ...prev, [subject]: updated > 0 ? nextList : list };
        });

        setGradesDatabase(prev => {
          const list = prev[subject] ? [...prev[subject]] : [];
          const nextList = list.map(s => {
            const score = imported[s.nisn.toLowerCase()] ?? imported[s.nama.toLowerCase()];
            if (score === undefined) return s;
            return { ...s, formatif: score, sumatifLM: score, sumatifAS: score };
          });
          return { ...prev, [subject]: nextList };
        });
      } catch {
        showToast("Gagal membaca file Excel. Pastikan format file .xlsx/.xls/.csv.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // Unduh templat rekap nilai (f_nilai) agar guru tinggal mengisi kolom Nilai Rapor lalu upload
  const downloadRekapTemplate = () => {
    const list = subjectGradesDatabase[rekapMatpelSubject] || [];
    const currentLmCount = getLmCount(rekapMatpelSubject);
    const subjectUpper = rekapMatpelSubject.toUpperCase();
    const rawKelas = biodata.kelas || "4";
    const gradeMatch = rawKelas.match(/\d+/);
    const gradeNum = gradeMatch ? gradeMatch[0] : (rawKelas.includes("VI") ? "6" : rawKelas.includes("V") ? "5" : "4");
    const semNum = biodata.semester || "2";
    const kelasFormatted = rawKelas.toUpperCase().startsWith("KELAS") ? rawKelas.toUpperCase() : `KELAS ${rawKelas.toUpperCase()}`;
    const totalCols = 5 + currentLmCount;

    // Kop sekolah + identitas (kiri) dan tabel (kanan) siap isi
    const aoa: (string | number | undefined)[][] = [
      [biodata.namaSekolah || "NAMA SEKOLAH"],
      [`FORMAT IMPORT NILAI RAPOR ${subjectUpper}, KELAS ${kelasFormatted}`],
      [`FASE ${biodata.fase || "-"}  •  SEMESTER ${semNum}  •  TAHUN PELAJARAN 2026/2027`],
      [],
      ["NO", "NISN", "NAMA SISWA", "NILAI RAPOR", "TINGKAT KETERCAPAIAN TP", ...Array(Math.max(0, currentLmCount - 1)).fill(""), "VALIDASI"],
      ["", "", "", "", ...Array(currentLmCount).fill("").map((_, i) => `TP ${i + 1}`), ""]
    ];

    list.forEach((s, idx) => {
      aoa.push([
        idx + 1,
        s.nisn,
        s.nama,
        "",
        ...Array(currentLmCount).fill(""),
        "Valid"
      ]);
    });

    aoa.push([]);
    aoa.push(["PETUNJUK PENGISIAN :"]);
    aoa.push(["> Isi kolom NILAI RAPOR (skala 0-100) untuk setiap siswa."]);
    aoa.push(["> Kolom TINGKAT KETERCAPAIAN TP diisi huruf T (Tercapai) atau R (Perlu Peningkatan)."]);
    aoa.push(["> Simpan file lalu gunakan tombol 'Import File f_nilai (.xlsx)' untuk memuat nilai ke aplikasi."]);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: totalCols - 1 } },
      { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } },
      { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } },
      { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } },
      { s: { r: 4, c: 3 }, e: { r: 5, c: 3 } },
      { s: { r: 4, c: 4 }, e: { r: 4, c: 3 + currentLmCount } },
    ];
    ws['!cols'] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 35 },
      { wch: 14 },
      ...Array(currentLmCount).fill({ wch: 10 }),
      { wch: 14 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Templat Rekap Nilai");
    XLSX.writeFile(wb, `Templat_Rekap_Nilai_${subjectUpper.replace(/\s+/g, '_')}_Kelas_${gradeNum}.xlsx`);
    showToast(`Templat rekap ${rekapMatpelSubject} diunduh. Isi nilai lalu upload lewat tombol Import f_nilai.`);
  };

  // Evaluasi Sub Tab logic
  const updateStudentGrade = (subject: string, studentId: number | string, field: keyof StudentEvaluationGrade, value: string | number) => {
    if (field === 'nama' || field === 'nisn' || field === 'jenisKelamin') {
      const strVal = value as string;
      setGradesDatabase(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(subKey => {
          next[subKey] = (next[subKey] || []).map(s => {
            if (s.id === studentId || String(s.id) === String(studentId)) {
              return { ...s, [field]: strVal };
            }
            return s;
          });
        });
        return next;
      });

      setSubjectGradesDatabase(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(subKey => {
          next[subKey] = (next[subKey] || []).map(s => {
            if (s.id === studentId || String(s.id) === String(studentId)) {
              return { ...s, [field]: strVal };
            }
            return s;
          });
        });
        return next;
      });
    } else {
      setGradesDatabase(prev => {
        const list = prev[subject] ? [...prev[subject]] : [];
        const idx = list.findIndex(s => s.id === studentId || String(s.id) === String(studentId));
        if (idx !== -1) {
          const student = { ...list[idx] };
          if (field === 'formatif' || field === 'sumatifLM' || field === 'sumatifAS') {
            student[field] = value === '' ? undefined : (parseFloat(value as string) || 0);
          } else {
            student[field as 'tindakLanjut'] = value as string;
          }
          list[idx] = student;
        }
        return { ...prev, [subject]: list };
      });
    }
  };

  const addStudentToBukuNilai = () => {
    const newId = Date.now();
    const sampleList = subjectGradesDatabase[bnMatpelSubject] || subjectGradesDatabase["PKN"] || [];
    const count = sampleList.length + 1;
    const newName = `Siswa Baru ${count}`;
    const newNisn = `01234567${count < 10 ? '0' + count : count}`;

    const newSubjectGrade: SubjectStudentGrade = {
      id: newId,
      nama: newName,
      nisn: newNisn,
      jenisKelamin: 'L',
      lm1: 75, lm2: 75, lm3: 75, lm4: 75, lm5: 75, sas: 75
    };

    const newEvalGrade: StudentEvaluationGrade = {
      id: newId,
      nama: newName,
      nisn: newNisn,
      jenisKelamin: 'L',
      formatif: 75,
      sumatifLM: 75,
      sumatifAS: 75,
      tindakLanjut: "Siswa baru ditambahkan"
    };

    setSubjectGradesDatabase(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(subKey => {
        next[subKey] = [...(next[subKey] || []), { ...newSubjectGrade }];
      });
      return next;
    });

    setGradesDatabase(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(subKey => {
        next[subKey] = [...(next[subKey] || []), { ...newEvalGrade }];
      });
      return next;
    });

    showToast("Siswa baru berhasil ditambahkan ke Buku Nilai & Absensi.");
  };

  const deleteStudentFromBukuNilai = (_subject: string, studentId: number | string, indexFallback?: number) => {
    deleteStudent(studentId, indexFallback);
  };

  const downloadStudentTemplate = () => {
    const subject = bnMatpelSubject;

    const templateData = [
      {
        "No": 1,
        "Nama Siswa": "Contoh Nama Siswa 1",
        "NIS/NISN": "0123456701",
        "Jenis Kelamin": "L"
      },
      {
        "No": 2,
        "Nama Siswa": "Contoh Nama Siswa 2",
        "NIS/NISN": "0123456702",
        "Jenis Kelamin": "P"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 28 },
      { wch: 14 },
      { wch: 14 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Data Siswa");
    XLSX.writeFile(wb, `Template_Data_Siswa_${biodata.kelas || 'Kelas'}_${biodata.namaSekolah}.xlsx`);
    showToast("Berhasil mengunduh templat data siswa. Isi lalu upload sekali. Sistem otomatis mendistribusikan ke semua mapel.");
  };

  // Upload data siswa dari Excel (disebarkan ke semua mapel)
  const handleUploadStudentsExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isDemo) {
      showToast("🔒 Mode Demo: Unggah data siswa dikunci. Daftar hanya untuk guru terdaftar.");
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

        let maxId = 0;
        Object.keys(gradesDatabase).forEach((sub) => {
          (gradesDatabase[sub] || []).forEach((s) => { if (Number(s.id) > maxId) maxId = Number(s.id); });
        });
        Object.keys(subjectGradesDatabase).forEach((sub) => {
          (subjectGradesDatabase[sub] || []).forEach((s) => { if (Number(s.id) > maxId) maxId = Number(s.id); });
        });

        const cell = (row: Record<string, unknown>, ...keys: string[]): string => {
          for (const k of keys) {
            const v = row[k];
            if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
          }
          return '';
        };

        const newEval: StudentEvaluationGrade[] = [];
        const newSubject: SubjectStudentGrade[] = [];

        rows.forEach((row, idx) => {
          const nama = cell(row, 'Nama Siswa', 'Nama', 'NAMA SISWA', 'Nama Peserta Didik');
          if (!nama) return;
          const id = maxId + idx + 1;
          const nisn = cell(row, 'NIS/NISN', 'NISN', 'NIS', 'NIS / NISN');
          const jkRaw = cell(row, 'Jenis Kelamin', 'Jenis Kelamin (L/P)', 'JK', 'JenisKelamin', 'JENIS KELAMIN').toUpperCase();
          const jk = jkRaw === 'P' ? 'P' : jkRaw === 'L' ? 'L' : (jkRaw.startsWith('PE') || jkRaw.startsWith('PER')) ? 'P' : jkRaw.startsWith('LA') ? 'L' : '';
          newEval.push({
            id,
            nama,
            nisn,
            jenisKelamin: jk || undefined
          });
          newSubject.push({ id, nama, nisn, jenisKelamin: jk || undefined });
        });

        if (newEval.length === 0) {
          showToast("Tidak ada data siswa terbaca. Periksa kolom (Nama Siswa, NIS/NISN).");
          return;
        }

        // Sebar data siswa yang sama ke SEMUA mata pelajaran sekaligus (upload sekali saja).
        const subjectKeys = Object.keys(lockedTargets);
        const subjectsToFill = subjectKeys.length > 0 ? subjectKeys : [bnMatpelSubject];

        setGradesDatabase(prev => {
          const next = { ...prev };
          subjectsToFill.forEach(sub => { next[sub] = [...newEval]; });
          return next;
        });
        setSubjectGradesDatabase(prev => {
          const next = { ...prev };
          subjectsToFill.forEach(sub => { next[sub] = [...newSubject]; });
          return next;
        });
        showToast(`Berhasil mengunggah ${newEval.length} data siswa. Terdistribusi ke ${subjectsToFill.length} mapel (${subjectsToFill.join(', ')}).`);
      } catch {
        showToast("Gagal membaca file Excel. Pastikan format file .xlsx/.xls/.csv.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // Templat satu file berisi nilai untuk SEMUA mapel (baris = siswa, kolom = mapel)
  const downloadAllSubjectTemplate = () => {
    const matpels = Object.keys(lockedTargets);
    const sampleList = subjectGradesDatabase["PKN"] || subjectGradesDatabase[bnMatpelSubject] || [];

    const header = ["No", "NISN", "Nama Siswa", ...matpels];
    const aoa: (string | number)[][] = [header];

    sampleList.forEach((s, idx) => {
      const row: (string | number)[] = [idx + 1, s.nisn, s.nama];
      matpels.forEach(() => row.push(""));
      aoa.push(row);
    });

    aoa.push([]);
    aoa.push(["PETUNJUK PENGISIAN :"]);
    aoa.push(["> Isi satu nilai (skala 0-100) per mapel untuk setiap siswa."]);
    aoa.push(["> Kolom kosong akan diabaikan. Simpan file lalu upload lewat 'Import Nilai Semua Mapel'."]);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 35 },
      ...matpels.map(() => ({ wch: 14 }))
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Templat Semua Mapel");
    XLSX.writeFile(wb, `Templat_Nilai_Semua_Mapel_${biodata.kelas || 'Kelas'}_${biodata.namaSekolah}.xlsx`);
    showToast(`Templat semua mapel diunduh (${matpels.length} mapel). Isi nilai lalu upload sekali.`);
  };

  // Import nilai untuk SEMUA mapel dari satu file (baris = siswa, kolom = mapel)
  const handleImportAllSubjectGrades = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isDemo) {
      showToast("🔒 Mode Demo: Import nilai dikunci. Nilai hanya untuk guru terdaftar.");
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

        const matpels = Object.keys(lockedTargets);
        // Cari kolom mapel (selain No/NISN/Nama)
        const headerRow = rows.length > 0 ? rows[0] : {};
        const subjectCols: { key: string; subject: string }[] = [];
        Object.keys(headerRow).forEach(k => {
          const norm = String(k).trim().toLowerCase();
          if (norm === 'no' || norm === 'nisn' || norm === 'nama siswa' || norm === 'nama') return;
          const subject = matpels.find(m => m.toLowerCase() === norm);
          if (subject) subjectCols.push({ key: k, subject });
        });
        if (subjectCols.length === 0) {
          showToast("Tidak ada kolom mapel yang dikenali. Gunakan hasil 'Templat Nilai Semua Mapel'.");
          return;
        }

        const cell = (row: Record<string, unknown>, key: string): string => {
          const v = row[key];
          if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
          return '';
        };
        const parseScore = (v: unknown): number | undefined => {
          const n = parseFloat(String(v).replace(',', '.'));
          return isNaN(n) ? undefined : n;
        };

        // Buat indeks pencarian siswa SEKALI (NISN & Nama) agar impor cepat, dan
        // tahan format NISN yang kehilangan nol di depannya (diubah Excel jadi angka)
        const idByNisn = new Map<string, number>();
        const idByNisnNumeric = new Map<number, number>();
        const idByNama = new Map<string, number>();
        Object.keys(gradesDatabase).forEach(sub => {
          (gradesDatabase[sub] || []).forEach(s => {
            if (typeof s.id !== 'number') return;
            if (s.nisn) {
              const n = s.nisn.trim();
              if (n && !idByNisn.has(n)) idByNisn.set(n, s.id);
              const nNum = Number(n);
              if (!isNaN(nNum) && !idByNisnNumeric.has(nNum)) idByNisnNumeric.set(nNum, s.id);
            }
            if (s.nama) {
              const nm = s.nama.trim().toLowerCase();
              if (nm.length > 1 && !idByNama.has(nm)) idByNama.set(nm, s.id);
            }
          });
        });

        const getStudentId = (row: Record<string, unknown>): number | undefined => {
          const nisn = cell(row, "NISN") || cell(row, "NIS");
          const nama = cell(row, "Nama Siswa") || cell(row, "Nama");
          if (nisn) {
            const exact = idByNisn.get(nisn.trim());
            if (exact !== undefined) return exact;
            const nNum = Number(nisn.trim());
            if (!isNaN(nNum)) {
              const hitNumeric = idByNisnNumeric.get(nNum);
              if (hitNumeric !== undefined) return hitNumeric;
            }
          }
          if (nama) {
            const hit = idByNama.get(nama.trim().toLowerCase());
            if (hit !== undefined) return hit;
          }
          return undefined;
        };

        let totalFilled = 0;
        const scoreBySubject: Record<string, number> = {};
        subjectCols.forEach(sc => { scoreBySubject[sc.subject] = 0; });

        const subjectUpdates: Record<string, Map<number, number>> = {};
        matpels.forEach(m => { subjectUpdates[m] = new Map(); });

        // Kumpulkan nama dari template agar nama siswa tetap terjaga meski nilai diedit
        const nameById = new Map<number, string>();

        rows.forEach(row => {
          const studentId = getStudentId(row);
          if (studentId === undefined) return;
          const namaRow = cell(row, "Nama Siswa") || cell(row, "Nama");
          if (namaRow && !nameById.has(studentId)) nameById.set(studentId, namaRow);
          subjectCols.forEach(sc => {
            const score = parseScore(row[sc.key]);
            if (score !== undefined) {
              subjectUpdates[sc.subject].set(studentId, score);
              totalFilled++;
            }
          });
        });

        if (totalFilled === 0) {
          showToast("Tidak ada nilai terbaca. Pastikan kolom sesuai templat dan skala 0-100.");
          return;
        }

        setSubjectGradesDatabase(prev => {
          const next = { ...prev };
          matpels.forEach(m => {
            const updates = subjectUpdates[m];
            if (updates.size === 0) return;
            next[m] = (next[m] || []).map(s => {
              const score = updates.get(s.id);
              if (score === undefined) return s;
              const lms = Array(getLmCount(m)).fill(score);
              const tmplNama = nameById.get(s.id);
              return {
                ...s,
                ...(tmplNama && !s.nama ? { nama: tmplNama } : {}),
                lms,
                lm1: score,
                lm2: score,
                lm3: score,
                lm4: score,
                lm5: score,
                sas: score
              };
            });
          });
          return next;
        });

        setGradesDatabase(prev => {
          const next = { ...prev };
          matpels.forEach(m => {
            const updates = subjectUpdates[m];
            if (updates.size === 0) return;
            next[m] = (next[m] || []).map(s => {
              const score = updates.get(s.id);
              if (score === undefined) return s;
              const tmplNama = nameById.get(s.id);
              return { ...s, ...(tmplNama && !s.nama ? { nama: tmplNama } : {}), formatif: score, sumatifLM: score, sumatifAS: score };
            });
          });
          return next;
        });

        showToast(`Berhasil mengimpor ${totalFilled} nilai untuk ${subjectCols.length} mapel sekaligus.`);
      } catch {
        showToast("Gagal membaca file Excel. Pastikan format file .xlsx/.xls/.csv.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // Rekap Kolektif Export
  const exportRekapKolektifExcel = () => {
    const matpels = Object.keys(lockedTargets);
    const sampleList = subjectGradesDatabase["PKN"] || [];

    const exportData = sampleList.map((s, idx) => {
      const row: Record<string, string | number> = {
        "No": idx + 1,
        "Nama Peserta Didik": s.nama
      };
      let total = 0;
      matpels.forEach(m => {
        const studentSubData = (subjectGradesDatabase[m] || []).find(sub => sub.id === s.id || sub.nama === s.nama);
        let na = 0;
        if (studentSubData) {
          const lms = getStudentLMs(studentSubData, getLmCount(m));
          const avgLM = Math.round(lms.reduce((a, b) => numOrZero(a) + numOrZero(b), 0) / Math.max(1, lms.length));
          na = Math.round((avgLM + numOrZero(studentSubData.sas)) / 2);
        }
        row[m] = na;
        total += na;
      });
      row["Rata-rata Keseluruhan"] = (total / matpels.length).toFixed(1);
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Kolektif");
    XLSX.writeFile(wb, `Rekap_Kolektif_Rapor_Kelas_${biodata.kelas}_${biodata.namaSekolah}.xlsx`);
    showToast("Berhasil mengunduh rekap kolektif Excel.");
  };

  // Evaluasi tab summary metrics
  const evalList = gradesDatabase[bnMatpelSubject] || [];

  return (
    <div id="tab-bukunilai" className="tab-content space-y-6">
      {/* SUB-MENU NAVIGASI BUKU NILAI (NO PRINT) */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-1 no-print">
        <button
          onClick={() => setSubTab('input-evaluasi')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 cursor-pointer ${
            subTab === 'input-evaluasi' ? 'bg-indigo-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Input Data Siswa</span>
        </button>

        <button
          onClick={() => setSubTab('rekap-matpel')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 cursor-pointer ${
            subTab === 'rekap-matpel' ? 'bg-indigo-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-amber-400" />
          <span>Rekap Nilai Bidang Studi (e-Rapor)</span>
        </button>

        <button
          onClick={() => setSubTab('rekap-kolektif')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 cursor-pointer ${
            subTab === 'rekap-kolektif' ? 'bg-indigo-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Rekap Kolektif Semua Matpel</span>
        </button>
      </div>

      {/* HEADER KHUSUS CETAK BUKU NILAI */}
      <div className="hidden print:block border-b-2 border-slate-800 pb-3 mb-4">
        <div className="flex items-center justify-center space-x-4 mb-2">
          {biodata.logo && <img src={biodata.logo} className="print-kop-logo max-h-16 object-contain" alt="Logo" />}
          <div className="text-center">
            <h2 className="text-lg font-bold uppercase tracking-wider text-slate-950">
              {subTab === 'rekap-matpel' ? 'REKAPITULASI NILAI MATA PELAJARAN (E-RAPOR)' : 'DAFTAR DATA SISWA'}
            </h2>
            <h3 className="text-sm font-bold uppercase text-indigo-950">
              MATA PELAJARAN: {(subTab === 'rekap-matpel' ? rekapMatpelSubject : bnMatpelSubject).toUpperCase()}
            </h3>
            <p className="text-xs font-extrabold text-slate-800 mt-0.5 print-text-school">{biodata.namaSekolah}</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 text-[10px] font-bold text-slate-800 max-w-2xl mx-auto mt-2 bg-slate-50 p-2 rounded border border-slate-300">
          <div>Fase: <span className="print-text-fase">{biodata.fase}</span></div>
          <div>Kelas: <span className="print-text-kelas-lanjutan">{biodata.kelas}</span></div>
          <div>Semester: <span className="print-text-semester">{biodata.semester}</span> (2026/2027)</div>
          <div>Target KKTP: <span className="font-black text-rose-700">{(subTab === 'rekap-matpel' ? currentRekapTarget : currentBnTarget).toFixed(1)}</span></div>
        </div>
      </div>

      {/* SUB VIEW 1: REKAP NILAI PER BIDANG STUDI */}
      {subTab === 'rekap-matpel' && (
        <div id="bn-subview-rekap-matpel" className="bn-subview space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 no-print space-y-5">
            {/* HEADER: JUDUL + AKSI */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center space-x-3 flex-1">
                <div className="p-3 bg-indigo-100 text-indigo-900 rounded-xl shrink-0">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Rekap Nilai Hasil Belajar Per Bidang Studi</h2>
                  <p className="text-xs text-slate-500">Rekap e-Rapor: Sumatif Lingkup Materi (LM), Sumatif Akhir (SAS), dan Nilai Akhir Rapor.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <label className="bg-amber-500 hover:bg-amber-600 text-indigo-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition shadow cursor-pointer">
                  <FileUp className="w-4 h-4" />
                  <span>Import f_nilai</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleImportRekapExcel}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={downloadRekapTemplate}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition shadow cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Templat Rekap</span>
                </button>
                <label className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition shadow cursor-pointer">
                  <FileUp className="w-4 h-4" />
                  <span>Import Semua Mapel</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleImportAllSubjectGrades}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={downloadAllSubjectTemplate}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition shadow cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Templat Semua Mapel</span>
                </button>
                <button
                  onClick={exportRekapMatpelExcel}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition shadow cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export e-Rapor</span>
                </button>
                <button
                  onClick={() => triggerPrint('bukunilai', 'rekap-matpel')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition shadow cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak</span>
                </button>
              </div>
            </div>

            {/* PANEL KONFIGURASI: MAPEL + FORMULA + TARGET */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-4">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Mata Pelajaran yang Direkap</label>
                <select
                  value={rekapMatpelSubject}
                  onChange={(e) => setRekapMatpelSubject(e.target.value)}
                  className="w-full bg-indigo-50/50 border border-indigo-200 rounded-xl px-3 py-2.5 text-sm font-bold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PKN">Pendidikan Pancasila (PKN)</option>
                  <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                  <option value="Matematika">Matematika</option>
                  <option value="IPA">IPAS (Sains/IPA)</option>
                  <option value="TIK">TIK (Informatika / Komputer)</option>
                  <option value="Bahasa dan Sastra Banjar">Bahasa dan Sastra Banjar</option>
                  <option value="SBdP">SBdP (Seni Budaya & Prakarya)</option>
                  <option value="PJOK">PJOK</option>
                  <option value="Bahasa Inggris">Bahasa Inggris</option>
                  <option value="Pendidikan Agama Islam">Pendidikan Agama Islam (PAI)</option>
                  <option value="Baca Tulis Al-Quran">Baca Tulis Al-Quran (BTQ)</option>
                  <option value="Coding">Coding</option>
                </select>
              </div>

              <div className="lg:col-span-8">
                <div className="h-full bg-indigo-900 text-white rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-400 text-indigo-950 rounded-lg font-bold shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-amber-300 tracking-wider">Formula Rapor Kurikulum Merdeka</span>
                      <h4 className="text-xs font-semibold text-indigo-100">Nilai Akhir (NA) = (Rata-rata Sumatif LM + Sumatif Akhir) ÷ 2</h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-200 tracking-wider">KKTP Capaian</span>
                    <span className="text-sm font-black bg-amber-400 text-indigo-950 px-3 py-1 rounded-md">
                      {rekapCapaian.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* PENGATURAN JUMLAH KOLOM LM */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50/80 p-3 rounded-xl border border-indigo-100">
              <div className="flex items-center space-x-2 text-xs font-bold text-indigo-950">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Pengaturan Kolom LM ({rekapMatpelSubject}):</span>
                <span className="bg-indigo-900 text-white px-2.5 py-1 rounded-lg text-xs font-extrabold">
                  {getLmCount(rekapMatpelSubject)} Kolom
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSubjectLmCount(rekapMatpelSubject, getLmCount(rekapMatpelSubject) - 1)}
                  disabled={getLmCount(rekapMatpelSubject) <= 1}
                  className="bg-rose-50 hover:bg-rose-100 disabled:opacity-40 text-rose-700 border border-rose-200 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 cursor-pointer transition"
                  title="Kurangi 1 Kolom LM"
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>Kurangi Kolom LM</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubjectLmCount(rekapMatpelSubject, getLmCount(rekapMatpelSubject) + 1)}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 cursor-pointer transition"
                  title="Tambah 1 Kolom LM"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Kolom LM</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const cpList = (defaultSubjectData[biodata.fase] && defaultSubjectData[biodata.fase][rekapMatpelSubject]) ? defaultSubjectData[biodata.fase][rekapMatpelSubject] : [];
                    const targetCount = cpList.length > 0 ? cpList.length : 5;
                    setSubjectLmCount(rekapMatpelSubject, targetCount);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 cursor-pointer transition shadow-xs"
                  title="Samakan jumlah kolom LM dengan jumlah CP di KKTP"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync dari Hitung KKTP ({((defaultSubjectData[biodata.fase] && defaultSubjectData[biodata.fase][rekapMatpelSubject]) || []).length} CP)</span>
                </button>
              </div>
            </div>
          </div>

          {/* ANALISIS KETUNTASAN BELAJAR */}
          <div id="bn-analisis-ketuntasan" className="bg-white p-5 rounded-2xl shadow-lg border border-slate-200 print-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Analisis Ketuntasan Belajar</h3>
                  <p className="text-[11px] text-slate-500">
                    NA Rapor dibandingkan dengan Target KKTP <strong className="text-slate-700">{currentRekapTarget.toFixed(1)}</strong> — {rekapMatpelSubject}
                  </p>
                </div>
              </div>

              {/* FILTER */}
              <div className="flex flex-wrap gap-2 no-print">
                <button
                  type="button"
                  onClick={() => setRekapStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                    rekapStatusFilter === 'all'
                      ? 'bg-indigo-900 text-white border-indigo-900 shadow'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Semua ({ketuntasanStats.all})
                </button>
                <button
                  type="button"
                  onClick={() => setRekapStatusFilter('tuntas')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                    rekapStatusFilter === 'tuntas'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                      : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  Tuntas ({ketuntasanStats.tuntas})
                </button>
                <button
                  type="button"
                  onClick={() => setRekapStatusFilter('belum')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                    rekapStatusFilter === 'belum'
                      ? 'bg-amber-500 text-indigo-950 border-amber-500 shadow'
                      : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50'
                  }`}
                >
                  Belum Tuntas ({ketuntasanStats.belum})
                </button>
                <button
                  type="button"
                  onClick={() => setRekapStatusFilter('remedial')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                    rekapStatusFilter === 'remedial'
                      ? 'bg-rose-600 text-white border-rose-600 shadow'
                      : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
                  }`}
                >
                  Perlu Remedial ({ketuntasanStats.remedial})
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Total Siswa</p>
                <p className="text-xl font-black text-slate-800 mt-1">{ketuntasanStats.all}</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">Tuntas</p>
                <p className="text-xl font-black text-emerald-800 mt-1">{ketuntasanStats.tuntas}</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">Belum Tuntas</p>
                <p className="text-xl font-black text-amber-800 mt-1">{ketuntasanStats.belum}</p>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700">Perlu Remedial</p>
                <p className="text-xl font-black text-rose-800 mt-1">{ketuntasanStats.remedial}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                <span>Ketuntasan Klasikal</span>
                <span className="text-slate-800 font-black">{pctTuntas}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className={`h-full rounded-full transition-all ${pctTuntas >= 70 ? 'bg-emerald-500' : pctTuntas >= 50 ? 'bg-amber-400' : 'bg-rose-500'}`}
                  style={{ width: `${pctTuntas}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">
                Tuntas: NA &ge; {currentRekapTarget.toFixed(1)} &bull; Belum Tuntas: {REMEDIAL_FLOOR} &le; NA &lt; {currentRekapTarget.toFixed(1)} &bull; Perlu Remedial: NA &lt; {REMEDIAL_FLOOR}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 print-card space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-2 border-slate-800 text-xs text-slate-900 font-medium">
                <thead>
                  <tr className="bg-indigo-900 text-white border-b-2 border-slate-800">
                    <th rowSpan={2} className="border-r border-slate-700 px-2 py-3 text-center w-8">NO</th>
                    <th rowSpan={2} className="border-r border-slate-700 px-2 py-3 text-center w-20">NIS / NISN</th>
                    <th rowSpan={2} className="border-r border-slate-700 px-3 py-3 text-left w-48">NAMA PESERTA DIDIK</th>
                    <th rowSpan={2} className="border-r border-slate-700 px-2 py-3 text-center w-24">KELAS</th>
                    <th colSpan={getLmCount(rekapMatpelSubject)} className="border-r border-slate-700 px-2 py-1.5 text-center bg-indigo-950">
                      SUMATIF LINGKUP MATERI (LM)
                    </th>
                    <th rowSpan={2} className="border-r border-slate-700 px-2 py-3 text-center w-16 bg-indigo-950 font-extrabold">RATA LM</th>
                    <th rowSpan={2} className="border-r border-slate-700 px-2 py-3 text-center w-16 bg-amber-500 text-indigo-950 font-extrabold">SAS</th>
                    <th rowSpan={2} className="border-r border-slate-700 px-2 py-3 text-center w-16 bg-emerald-700 font-black text-sm">NA RAPOR</th>
                    <th rowSpan={2} className="border-r border-slate-700 px-2 py-3 text-center w-24 bg-indigo-800 font-extrabold">KETUNTASAN</th>
                    <th rowSpan={2} className="border-r border-slate-700 px-3 py-3 text-left">CAPAIAN KOMPETENSI (DESKRIPSI RAPOR)</th>
                    <th rowSpan={2} className="px-2 py-3 text-center w-10 no-print">AKSI</th>
                  </tr>
                  <tr className="bg-indigo-800 text-indigo-100 border-b-2 border-slate-800">
                    {Array.from({ length: getLmCount(rekapMatpelSubject) }).map((_, i) => (
                      <th key={i} className="border-r border-slate-700 px-1 py-1 text-center min-w-[48px]" title={`Lingkup Materi ${i + 1}`}>
                        LM {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r, idx) => {
                    const { s, lms, avgLM, na, status, level, deskripsi } = r;
                    const rowColor =
                      status === 'tuntas' ? 'bg-emerald-50/40'
                      : status === 'belum' ? 'bg-amber-50/50'
                      : 'bg-rose-50/60';
                    const badge =
                      status === 'tuntas' ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : status === 'belum' ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300';
                    const badgeLabel = status === 'tuntas' ? 'Tuntas' : status === 'belum' ? 'Belum Tuntas' : 'Perlu Remedial';
                    const levelColor =
                      level === 'Belum Muncul' ? 'text-rose-700'
                      : level === 'Sebagian Kecil' ? 'text-amber-700'
                      : level === 'Sebagian Besar' ? 'text-sky-700'
                      : 'text-emerald-700';

                    return (
                      <tr key={s.id || idx} className={`border-b border-slate-300 hover:bg-slate-50 ${rowColor}`}>
                        <td className="text-center font-bold px-1 py-2 border-r border-slate-300">{idx + 1}</td>
                        <td className="text-center px-1 py-2 border-r border-slate-300">
                          <input
                            type="text"
                            value={s.nisn}
                            onChange={(e) => updateRekapGrade(rekapMatpelSubject, s.id, 'nisn', e.target.value)}
                            className="w-full text-center text-slate-600 bg-transparent focus:bg-white focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-2 border-r border-slate-300">
                          <input
                            type="text"
                            value={s.nama}
                            onChange={(e) => updateRekapGrade(rekapMatpelSubject, s.id, 'nama', e.target.value)}
                            className="w-full font-bold text-slate-800 bg-transparent focus:bg-white focus:outline-none"
                          />
                        </td>
                        <td className="text-center px-2 py-2 border-r border-slate-300 font-bold text-slate-700">
                          {biodata.kelas}
                        </td>

                        {lms.map((val, lmIdx) => (
                          <td key={lmIdx} className="text-center px-1 py-2 border-r border-slate-300">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={val ?? ''}
                              placeholder=""
                              onChange={(e) => updateRekapGrade(rekapMatpelSubject, s.id, 'lm', e.target.value, lmIdx)}
                              className="w-full text-center bg-transparent focus:bg-white focus:outline-none font-semibold"
                            />
                          </td>
                        ))}

                        <td className="text-center px-1 py-2 border-r border-slate-300 font-bold bg-indigo-50 text-indigo-950">
                          {avgLM}
                        </td>
                        <td className="text-center px-1 py-2 border-r border-slate-300">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={s.sas ?? ''}
                            placeholder=""
                            onChange={(e) => updateRekapGrade(rekapMatpelSubject, s.id, 'sas', e.target.value)}
                            className="w-full text-center bg-amber-50 font-bold text-slate-900 focus:bg-white focus:outline-none"
                          />
                        </td>
                        <td className="text-center px-1 py-2 border-r border-slate-300 font-black text-sm bg-emerald-100 text-emerald-950">
                          {na}
                        </td>
                        <td className="text-center px-1 py-2 border-r border-slate-300">
                          <span className={`inline-block whitespace-nowrap px-2 py-1 rounded-full text-[10px] font-black border ${badge}`}>
                            {badgeLabel}
                          </span>
                        </td>
                        <td className="px-2 py-2 border-r border-slate-300 text-[11px] leading-snug text-slate-700">
                          <span className={`block text-[9px] font-black uppercase tracking-wide mb-0.5 ${levelColor}`}>
                            {level}
                          </span>
                          {deskripsi}
                        </td>
                        <td className="text-center px-1 py-2 no-print">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              deleteStudent(s.id, idx);
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Signature Block for Print */}
            <div className="hidden print:grid grid-cols-2 gap-8 text-xs font-bold text-slate-800 pt-6 print-avoid-break">
              <div className="text-center space-y-14">
                <p>Mengetahui,<br />Kepala Sekolah <span className="print-text-school">{biodata.namaSekolah}</span></p>
                <div>
                  <p className="underline font-extrabold print-text-kepsek">{biodata.namaKepsek}</p>
                  <p className="text-[10px] text-slate-500 font-semibold print-text-nip-kepsek">{biodata.nipKepsek}</p>
                </div>
              </div>
              <div className="text-center space-y-14">
                <p><span className="print-text-kota">{biodata.kota}</span>, <span className="border-b border-dashed border-slate-400 px-8 pb-0.5"></span> 2026<br />Guru Kelas <span className="print-text-fase font-semibold">{biodata.fase}</span></p>
                <div>
                  <p className="underline font-extrabold print-text-guru">{biodata.namaGuru}</p>
                  <p className="text-[10px] text-slate-500 font-semibold print-text-nip-guru">{biodata.nipGuru}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB VIEW 2: INPUT DATA SISWA */}
      {subTab === 'input-evaluasi' && (
        <div id="bn-subview-input-evaluasi" className="bn-subview space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 no-print space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center space-x-3 flex-1">
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Input Data Siswa</h2>
                  <p className="text-xs text-slate-500">Kelola data siswa kelas: Nomor, NISN/NIS, Nama Siswa, dan Jenis Kelamin.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                <label className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition shadow cursor-pointer">
                  <FileUp className="w-4 h-4" />
                  <span>Upload Data Siswa (Otomatis ke Semua Mapel)</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleUploadStudentsExcel}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={addStudentToBukuNilai}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition shadow cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Tambah Siswa</span>
                </button>
                <button
                  onClick={downloadStudentTemplate}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition shadow cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Templat Siswa</span>
                </button>
                <button
                  onClick={() => triggerPrint('bukunilai', 'input-evaluasi')}
                  className="bg-amber-500 hover:bg-amber-600 text-indigo-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition shadow cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Data Siswa</span>
                </button>
              </div>
            </div>

            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-[11px] text-sky-800 flex items-start space-x-2">
              <FileUp className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Upload Data Siswa:</strong> unduh templat lalu isi kolom <strong>No</strong>, <strong>Nama Siswa</strong>, <strong>NIS/NISN</strong>, dan <strong>Jenis Kelamin</strong>. Cukup upload satu kali — sistem otomatis memakai daftar siswa yang sama untuk semua mata pelajaran.
                Data akan menggantikan daftar siswa untuk mapel aktif dan otomatis tersinkron ke menu Absensi.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
              <div className="md:col-span-5">
                <label className="block text-xs font-bold text-slate-500 mb-1">Mata Pelajaran Buku Nilai</label>
                <select
                  value={bnMatpelSubject}
                  onChange={(e) => setBnMatpelSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PKN">Pendidikan Pancasila (PKN)</option>
                  <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                  <option value="Matematika">Matematika</option>
                  <option value="IPA">IPAS (Sains/IPA)</option>
                  <option value="TIK">TIK (Informatika / Komputer)</option>
                  <option value="Bahasa dan Sastra Banjar">Bahasa dan Sastra Banjar</option>
                  <option value="SBdP">SBdP (Seni Budaya & Prakarya)</option>
                  <option value="PJOK">PJOK</option>
                  <option value="Bahasa Inggris">Bahasa Inggris</option>
                  <option value="Pendidikan Agama Islam">Pendidikan Agama Islam (PAI)</option>
                  <option value="Baca Tulis Al-Quran">Baca Tulis Al-Quran (BTQ)</option>
                  <option value="Coding">Coding</option>
                </select>
              </div>

              <div className="md:col-span-7 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-500 text-indigo-950 rounded-lg">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider">Target KKTP Matpel Ini Terkunci</span>
                    <h4 className="text-sm font-black text-indigo-950">Ambang Batas Minimum: {currentBnTarget.toFixed(1)}</h4>
                  </div>
                </div>
                <span className="text-xs font-semibold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-md border border-amber-300">
                  🔒 Terkunci dari KKTP
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Siswa Kelas</p>
                <h4 className="text-xl font-bold text-slate-800">{evalList.length}</h4>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Laki-laki</p>
                <h4 className="text-xl font-bold text-sky-600">{evalList.filter(s => (s.jenisKelamin || '').toUpperCase() === 'L').length}</h4>
              </div>
              <div className="p-3 bg-sky-50 text-sky-600 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Perempuan</p>
                <h4 className="text-xl font-bold text-pink-600">{evalList.filter(s => (s.jenisKelamin || '').toUpperCase() === 'P').length}</h4>
              </div>
              <div className="p-3 bg-pink-50 text-pink-600 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 print-card space-y-4">
            <div className="flex items-center justify-between no-print border-b pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Daftar Siswa:</span>
              </div>
              <p className="text-[11px] text-slate-400 italic">* Data siswa sama untuk semua mata pelajaran & tersinkron ke Absensi.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-2 border-slate-800 text-xs sm:text-sm text-slate-900 font-medium">
                <thead>
                  <tr className="bg-indigo-900 text-white border-b-2 border-slate-800">
                    <th className="border-r border-slate-700 px-2 py-3 text-center w-10">NO</th>
                    <th className="border-r border-slate-700 px-3 py-3 text-left w-48">NAMA SISWA</th>
                    <th className="border-r border-slate-700 px-2 py-3 text-center w-28">NISN/NIS</th>
                    <th className="border-r border-slate-700 px-2 py-3 text-center w-28">JENIS KELAMIN</th>
                    <th className="px-2 py-3 text-center w-12 no-print">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {evalList.map((student, index) => (
                    <tr key={student.id || index} className="border-b border-slate-300 hover:bg-slate-50">
                      <td className="text-center font-bold px-2 py-2 border-r border-slate-300">{index + 1}</td>
                      <td className="px-2 py-2 border-r border-slate-300">
                        <input
                          type="text"
                          value={student.nama}
                          onChange={(e) => updateStudentGrade(bnMatpelSubject, student.id, 'nama', e.target.value)}
                          className="w-full font-bold text-slate-800 bg-transparent focus:bg-white focus:outline-none"
                        />
                      </td>
                      <td className="text-center px-2 py-2 border-r border-slate-300">
                        <input
                          type="text"
                          value={student.nisn}
                          onChange={(e) => updateStudentGrade(bnMatpelSubject, student.id, 'nisn', e.target.value)}
                          className="w-full text-center text-slate-600 bg-transparent focus:bg-white focus:outline-none"
                        />
                      </td>
                      <td className="text-center px-2 py-2 border-r border-slate-300">
                        <select
                          value={(student.jenisKelamin || '').toUpperCase()}
                          onChange={(e) => updateStudentGrade(bnMatpelSubject, student.id, 'jenisKelamin', e.target.value)}
                          className="w-full text-center font-semibold bg-slate-50 focus:bg-white focus:outline-none border border-slate-200 rounded-md py-1"
                        >
                          <option value="">-</option>
                          <option value="L">Laki-laki (L)</option>
                          <option value="P">Perempuan (P)</option>
                        </select>
                      </td>
                      <td className="text-center px-2 py-2 no-print">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteStudent(student.id, index);
                          }}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                          title="Hapus Siswa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB VIEW 3: REKAP KOLEKTIF SEMUA MATPEL */}
      {subTab === 'rekap-kolektif' && (
        <div id="bn-subview-rekap-kolektif" className="bn-subview space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 no-print flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Transkrip Kolektif Nilai Akhir Semua Mata Pelajaran</h2>
                <p className="text-xs text-slate-500">Ringkasan nilai Rapor siswa untuk seluruh mata pelajaran dalam satu lembar kelas.</p>
              </div>
            </div>
            <button
              onClick={exportRekapKolektifExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition shadow cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Kolektif Excel</span>
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 print-card space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-2 border-slate-800 text-xs text-slate-900 font-medium">
                <thead>
                  <tr className="bg-indigo-900 text-white border-b-2 border-slate-800">
                    <th className="border-r border-slate-700 px-2 py-3 text-center w-8">NO</th>
                    <th className="border-r border-slate-700 px-3 py-3 text-left w-44">NAMA PESERTA DIDIK</th>
                    <th className="border-r border-slate-700 px-1 py-3 text-center w-12">PKN</th>
                    <th className="border-r border-slate-700 px-1 py-3 text-center w-12">B. IND</th>
                    <th className="border-r border-slate-700 px-1 py-3 text-center w-12">MTK</th>
                    <th className="border-r border-slate-700 px-1 py-3 text-center w-12">IPAS</th>
                    <th className="border-r border-slate-700 px-1 py-3 text-center w-12">BANJAR</th>
                    <th className="border-r border-slate-700 px-1 py-3 text-center w-12">SBDP</th>
                    <th className="border-r border-slate-700 px-1 py-3 text-center w-12">PJOK</th>
                    <th className="border-r border-slate-700 px-1 py-3 text-center w-12">B. ING</th>
                    <th className="border-r border-slate-700 px-1 py-3 text-center w-12">PAI</th>
                    <th className="border-r border-slate-700 px-1 py-3 text-center w-12">BTQ</th>
                    <th className="border-r border-slate-700 px-1 py-3 text-center w-12">CODING</th>
                    <th className="border-r border-slate-700 px-2 py-3 text-center w-16 bg-amber-500 text-indigo-950 font-black">RATA-RATA</th>
                  </tr>
                </thead>
                <tbody>
                  {(subjectGradesDatabase["PKN"] || []).map((s, idx) => {
                    const matpels = Object.keys(lockedTargets);
                    let totalStudentScore = 0;
                    let matpelCount = 0;

                    const scores = matpels.map(m => {
                      const studentSubData = (subjectGradesDatabase[m] || []).find(sub => sub.id === s.id || sub.nama === s.nama);
                      let na = 0;
                      if (studentSubData) {
                        const count = getLmCount(m);
                        const lms = getStudentLMs(studentSubData, count);
                        const avgLM = Math.round(lms.reduce((a, b) => numOrZero(a) + numOrZero(b), 0) / Math.max(1, lms.length));
                        na = Math.round((avgLM + numOrZero(studentSubData.sas)) / 2);
                      }
                      totalStudentScore += na;
                      matpelCount++;
                      return na;
                    });

                    const avgRapor = matpelCount > 0 ? (totalStudentScore / matpelCount).toFixed(1) : "0.0";

                    return (
                      <tr key={s.id || idx} className="border-b border-slate-300 hover:bg-slate-50">
                        <td className="text-center font-bold px-1 py-2 border-r border-slate-300">{idx + 1}</td>
                        <td className="px-2 py-2 border-r border-slate-300 font-bold text-slate-800">{s.nama}</td>
                        {scores.map((score, sIdx) => (
                          <td key={sIdx} className="text-center px-1 py-2 border-r border-slate-300 font-semibold">{score}</td>
                        ))}
                        <td className="text-center px-1 py-2 border-r border-slate-300 font-black bg-amber-100 text-indigo-950">{avgRapor}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
