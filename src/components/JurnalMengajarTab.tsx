import React, { useState, useEffect } from 'react';
import { Biodata, ScheduleItem, JournalEntry, SubjectStudentGrade, StudentEvaluationGrade } from '../types';
import { initialScheduleItems, initialJournalEntries } from '../data/initialData';
import {
  loadTeacherJournals,
  saveTeacherJournals,
  loadTeacherAbsensi
} from '../utils/teacherStorage';
import { loadRpmSource, buildRangkumanSingkat, RpmJournalSource } from '../utils/rpmStorage';
import {
  NotebookPen,
  Calendar,
  Clock,
  BookOpen,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Plus,
  Trash2,
  Edit3,
  Search,
  Image as ImageIcon,
  Check,
  X,
  Sparkles,
  ArrowRight,
  UserCheck,
  Filter,
  RefreshCw,
  HelpCircle,
  AlertTriangle,
  Eye,
  Lock
} from 'lucide-react';

interface JurnalMengajarTabProps {
  biodata: Biodata;
  defaultSubjectData: Record<string, Record<string, string[]>>;
  subjectGradesDatabase?: Record<string, SubjectStudentGrade[]>;
  gradesDatabase?: Record<string, StudentEvaluationGrade[]>;
  showToast: (msg: string) => void;
  triggerPrint: (mode: 'diagnosa' | 'kktp' | 'bukunilai', title?: string) => void;
  isDemo?: boolean;
  schoolNpsn?: string;
}

export const JurnalMengajarTab: React.FC<JurnalMengajarTabProps> = ({
  biodata,
  defaultSubjectData,
  subjectGradesDatabase,
  gradesDatabase,
  showToast,
  triggerPrint,
  isDemo,
  schoolNpsn
}) => {
  // Schedules state
  const [scheduleItems] = useState<ScheduleItem[]>(initialScheduleItems);
  const [selectedDayTab, setSelectedDayTab] = useState<string>('Senin');

  // Journal entries state
  const [journals, setJournals] = useState<JournalEntry[]>(() => {
    const saved = loadTeacherJournals<JournalEntry>(biodata.nipGuru);
    if (saved && saved.length > 0) return saved;
    return isDemo ? initialJournalEntries : [];
  });

  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Form State
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);

  // Helper to parse date string into Month Name and Day number for Absensi database lookup
  const parseDateToMonthAndDay = (tanggalStr: string): { monthName: string; day: number } | null => {
    if (!tanggalStr) return null;
    const monthsList = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const strLower = tanggalStr.toLowerCase();

    // 1. Check if string contains any month name (e.g. "Rabu, 05 Agustus 2026")
    for (let mIdx = 0; mIdx < monthsList.length; mIdx++) {
      const mName = monthsList[mIdx];
      if (strLower.includes(mName.toLowerCase())) {
        const numberMatches = tanggalStr.match(/\d+/g);
        if (numberMatches && numberMatches.length > 0) {
          const dayNum = numberMatches.map(n => parseInt(n, 10)).find(n => n >= 1 && n <= 31);
          if (dayNum !== undefined) {
            return { monthName: mName, day: dayNum };
          }
        }
      }
    }

    // 2. ISO format YYYY-MM-DD or YYYY/MM/DD (already day/month correct)
    const iso = tanggalStr.match(/^\s*(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (iso) {
      const mIdx = parseInt(iso[2], 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        return { monthName: monthsList[mIdx], day: parseInt(iso[3], 10) };
      }
    }

    // 3. Indonesian format DD/MM/YYYY, DD-MM-YYYY, DD MM YYYY (day first!)
    const dmy = tanggalStr.match(/^\s*(\d{1,2})[-\/.\s]+(\d{1,2})[-\/.\s]+(\d{2,4})/);
    if (dmy) {
      const day = parseInt(dmy[1], 10);
      const mIdx = parseInt(dmy[2], 10) - 1;
      if (day >= 1 && day <= 31 && mIdx >= 0 && mIdx < 12) {
        return { monthName: monthsList[mIdx], day };
      }
    }

    // 4. Fallback: standard JS date string
    const dObj = new Date(tanggalStr);
    if (!isNaN(dObj.getTime())) {
      return { monthName: monthsList[dObj.getMonth()], day: dObj.getDate() };
    }

    return null;
  };

  // Helper to get student list from subjectGradesDatabase / gradesDatabase or fallback
  const getStudentsList = () => {
    const map = new Map<number, { id: number; nama: string }>();

    if (subjectGradesDatabase) {
      Object.keys(subjectGradesDatabase).forEach(sub => {
        (subjectGradesDatabase[sub] || []).forEach(s => {
          if (s && s.id && s.nama) {
            if (!map.has(s.id)) {
              map.set(s.id, { id: s.id, nama: s.nama });
            }
          }
        });
      });
    }

    if (gradesDatabase) {
      Object.keys(gradesDatabase).forEach(sub => {
        (gradesDatabase[sub] || []).forEach(s => {
          if (s && s.id && s.nama) {
            if (!map.has(s.id)) {
              map.set(s.id, { id: s.id, nama: s.nama });
            }
          }
        });
      });
    }

    const sorted = Array.from(map.values()).sort((a, b) => a.id - b.id);
    if (sorted.length > 0) return sorted;

    // Fallback default 28 students
    return Array.from({ length: 28 }, (_, i) => ({
      id: i + 1,
      nama: `Siswa ${i + 1}`
    }));
  };

  // Sync attendance data from Absensi database for a given date
  const getAttendanceFromAbsensi = (tanggalStr: string) => {
    const dateInfo = parseDateToMonthAndDay(tanggalStr);
    if (!dateInfo) return null;

    const { monthName, day } = dateInfo;

    let attendanceData: Record<string, string> = {};
    try {
      attendanceData = loadTeacherAbsensi(biodata.nipGuru);
    } catch {
      attendanceData = {};
    }

    const students = getStudentsList();
    let hadirCount = 0;
    let sakitCount = 0;
    let izinCount = 0;
    let alpaCount = 0;
    let totalRecorded = 0;
    const absentNotes: string[] = [];

    students.forEach(st => {
      const key = `${monthName}_${st.id}_${day}`;
      const status = attendanceData[key];
      if (status) {
        totalRecorded++;
        if (status === 'H') {
          hadirCount++;
        } else if (status === 'S') {
          sakitCount++;
          absentNotes.push(`${st.nama} (Sakit)`);
        } else if (status === 'I') {
          izinCount++;
          absentNotes.push(`${st.nama} (Izin)`);
        } else if (status === 'A') {
          alpaCount++;
          absentNotes.push(`${st.nama} (Alpa)`);
        }
      }
    });

    if (totalRecorded === 0) {
      // Tidak ada catatan absensi untuk tanggal ini -> default semua hadir
      return {
        hadir: students.length,
        sakit: 0,
        izin: 0,
        alpa: 0,
        keteranganSiswa: 'Hadir Semua',
        hasAnyRecords: false,
        monthName,
        day
      };
    } else {
      // Jumlah persis sama dengan tabel Absensi: hanya sel yang diisi H/S/I/A yang dihitung
      return {
        hadir: hadirCount,
        sakit: sakitCount,
        izin: izinCount,
        alpa: alpaCount,
        keteranganSiswa: absentNotes.length > 0 ? absentNotes.join(', ') : 'Hadir Semua',
        hasAnyRecords: true,
        monthName,
        day
      };
    }
  };

  
  // Get formatted today's date
  const getTodayFormatted = () => {
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const dayName = days[now.getDay()];
    const dateNum = now.getDate();
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();
    return `${dayName}, ${dateNum < 10 ? '0' + dateNum : dateNum} ${monthName} ${year}`;
  };

  const getTodayDayName = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date().getDay()];
  };

  // Helper to resolve class name from Biodata Sekolah (hanya kolom "Kelas" di menu Biodata)
  const getBiodataKelasName = (bio: Biodata) => {
    const k = bio.kelas?.trim();
    if (k && k.toLowerCase().startsWith('kelas')) return k;
    if (k) return `Kelas ${k}`;
    return 'Kelas IV A';
  };

  const currentBioKelas = getBiodataKelasName(biodata);

  // Data RPM untuk pengisian otomatis Jurnal (berita rangkuman kegiatan di kelas)
  const rpmSource = React.useMemo<RpmJournalSource | null>(() => loadRpmSource(biodata.nipGuru), []);

  const [formData, setFormData] = useState<{
    tanggal: string;
    hari: string;
    jamPelajaran: string;
    kelas: string;
    matpel: string;
    materi: string;
    tujuanPembelajaran: string;
    metodePembelajaran: string;
    hadir: number;
    sakit: number;
    izin: number;
    alpa: number;
    keteranganSiswa: string;
    keteranganPelaksanaan: string;
    catatanRefleksi: string;
    lampiran: string | null;
  }>(() => {
    const today = getTodayFormatted();
    const att = getAttendanceFromAbsensi(today);
    return {
      tanggal: today,
      hari: getTodayDayName() === 'Minggu' ? 'Senin' : getTodayDayName(),
      jamPelajaran: rpmSource?.jp ? `Alokasi ${rpmSource.jp} (${(parseInt(rpmSource.jp) || 1) * 35} menit)` : 'Jam 1 - 2 (07:30 - 08:50)',
      kelas: rpmSource?.kelas || currentBioKelas,
      matpel: rpmSource?.mapel || 'Pendidikan Pancasila (PKN)',
      materi: rpmSource?.materi || rpmSource?.bab || 'Makna Lambang dan Simbol Garuda Pancasila',
      tujuanPembelajaran: rpmSource?.tps?.[0] || 'Peserta didik mampu memahami sejarah singkat dan makna lambang Garuda Pancasila.',
      metodePembelajaran: rpmSource?.pendekatan || 'Problem Based Learning (PBL)',
      hadir: att ? att.hadir : 28,
      sakit: att ? att.sakit : 0,
      izin: att ? att.izin : 0,
      alpa: att ? att.alpa : 0,
      keteranganSiswa: att ? att.keteranganSiswa : 'Hadir Semua',
      keteranganPelaksanaan: 'Terlaksana Sepenuhnya',
      catatanRefleksi: rpmSource ? buildRangkumanSingkat(rpmSource) : 'Pembelajaran berlangsung aktif dan interaktif.',
      lampiran: null
    };
  });

  // Automatically update default kelas in form when Biodata Sekolah is updated (if not editing an existing journal)
  React.useEffect(() => {
    if (!editingJournalId) {
      setFormData(prev => ({
        ...prev,
        kelas: getBiodataKelasName(biodata)
      }));
    }
  }, [biodata.kelas, biodata.kelasLanjutan, editingJournalId]);

  // Auto-sync attendance whenever tanggal changes or component mounts (if not editing an existing journal)
  useEffect(() => {
    if (!editingJournalId && formData.tanggal) {
      const att = getAttendanceFromAbsensi(formData.tanggal);
      if (att) {
        setFormData(prev => ({
          ...prev,
          hadir: att.hadir,
          sakit: att.sakit,
          izin: att.izin,
          alpa: att.alpa,
          keteranganSiswa: att.keteranganSiswa
        }));
      }
    }
  }, [formData.tanggal, editingJournalId]);

  // Terapkan data RPM ke formulir Jurnal (berita rangkuman kegiatan di kelas)
  const applyRpmToForm = () => {
    const rpm = loadRpmSource(biodata.nipGuru);
    if (!rpm) {
      showToast("Belum ada data RPM. Buat & simpan terlebih dahulu di menu RPM.");
      return;
    }
    setFormData(prev => ({
      ...prev,
      jamPelajaran: rpm.jp ? `Alokasi ${rpm.jp} (${(parseInt(rpm.jp) || 1) * 35} menit)` : prev.jamPelajaran,
      kelas: rpm.kelas || prev.kelas,
      matpel: rpm.mapel || prev.matpel,
      materi: rpm.materi || rpm.bab || prev.materi,
      tujuanPembelajaran: rpm.tps?.[0] || prev.tujuanPembelajaran,
      metodePembelajaran: rpm.pendekatan || prev.metodePembelajaran,
      catatanRefleksi: buildRangkumanSingkat(rpm)
    }));
    setEditingJournalId(null);
    showToast("Form Jurnal terisi otomatis dari data RPM.");
  };

  // Manual trigger for sync button
  const handleManualSyncAbsensi = () => {
    const att = getAttendanceFromAbsensi(formData.tanggal);
    if (att) {
      setFormData(prev => ({
        ...prev,
        hadir: att.hadir,
        sakit: att.sakit,
        izin: att.izin,
        alpa: att.alpa,
        keteranganSiswa: att.keteranganSiswa
      }));
      showToast(`Kehadiran berhasil disinkronkan dari Data Absensi! (Hadir: ${att.hadir}, Sakit: ${att.sakit}, Izin: ${att.izin}, Alpa: ${att.alpa})`);
    } else {
      showToast("Gagal membaca tanggal untuk sinkronisasi Absensi.");
    }
  };

  // Selected Journal for Detail/Print Modal
  const [selectedJournalPrint, setSelectedJournalPrint] = useState<JournalEntry | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Selected Journal for Delete Confirmation Modal
const [journalToDelete, setJournalToDelete] = useState<JournalEntry | null>(null);

  // Save journals to localStorage
  const saveJournalsToStorage = (updated: JournalEntry[]) => {
    setJournals(updated);
    saveTeacherJournals(biodata.nipGuru, updated);
  };

  // Populate form from selected schedule item
  const handleSelectSchedule = (item: ScheduleItem) => {
    setEditingJournalId(null);
    const kktpTps = getSubjectTPOptions(item.matpel);
    const chosenTp = kktpTps.length > 0 ? kktpTps[0] : item.tpDefault;

    const todayStr = getTodayFormatted();
    const att = getAttendanceFromAbsensi(todayStr);

    setFormData({
      tanggal: todayStr,
      hari: item.hari,
      jamPelajaran: `${item.jamKe} (${item.waktu})`,
      kelas: getBiodataKelasName(biodata),
      matpel: item.matpel,
      materi: item.materiDefault,
      tujuanPembelajaran: chosenTp,
      metodePembelajaran: item.metodeDefault,
      hadir: att ? att.hadir : 28,
      sakit: att ? att.sakit : 0,
      izin: att ? att.izin : 0,
      alpa: att ? att.alpa : 0,
      keteranganSiswa: att ? att.keteranganSiswa : 'Hadir Semua',
      keteranganPelaksanaan: 'Terlaksana Sepenuhnya',
      catatanRefleksi: 'Siswa dapat mengikuti instruksi pembelajaran dengan baik.',
      lampiran: null
    });

    showToast(`Jadwal ${item.matpel} dipilih ke Form Jurnal (TP dari Hitung KKTP disinkronkan).`);
    
    // Smooth scroll to form
    const formElement = document.getElementById('form-jurnal-mengajar');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle Form Submit (Save / Edit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isDemo) {
      showToast("🔒 Mode Demo: Pengisian dan penyimpanan jurnal dikunci.");
      return;
    }

    if (!formData.materi.trim()) {
      alert("Mohon isi Materi yang Diajarkan!");
      return;
    }

    const newEntry: JournalEntry = {
      id: editingJournalId || `jrn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tanggal: formData.tanggal,
      hari: formData.hari,
      jamPelajaran: formData.jamPelajaran,
      kelas: formData.kelas,
      matpel: formData.matpel,
      materi: formData.materi,
      tujuanPembelajaran: formData.tujuanPembelajaran,
      metodePembelajaran: formData.metodePembelajaran,
      kehadiranSiswa: {
        hadir: formData.hadir,
        sakit: formData.sakit,
        izin: formData.izin,
        alpa: formData.alpa,
        keterangan: formData.keteranganSiswa
      },
      keteranganPelaksanaan: formData.keteranganPelaksanaan,
      catatanRefleksi: formData.catatanRefleksi,
      lampiran: formData.lampiran,
      createdAt: new Date().toISOString(),
      guruNama: biodata.namaGuru || '',
      sekolahNama: biodata.namaSekolah || '',
      sekolahNpsn: schoolNpsn || biodata.namaSekolah || ''
    };

    if (editingJournalId) {
      const updated = journals.map(j => j.id === editingJournalId ? newEntry : j);
      saveJournalsToStorage(updated);
      showToast("Jurnal mengajar berhasil diperbarui!");
      setEditingJournalId(null);
    } else {
      const updated = [newEntry, ...journals];
      saveJournalsToStorage(updated);
      showToast("Jurnal mengajar baru berhasil disimpan!");
    }

    // Scroll to history list
    const historyElement = document.getElementById('riwayat-jurnal-mengajar');
    if (historyElement) {
      historyElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Start editing entry
  const handleEdit = (entry: JournalEntry) => {
    setEditingJournalId(entry.id);
    setFormData({
      tanggal: entry.tanggal,
      hari: entry.hari,
      jamPelajaran: entry.jamPelajaran,
      kelas: entry.kelas,
      matpel: entry.matpel,
      materi: entry.materi,
      tujuanPembelajaran: entry.tujuanPembelajaran,
      metodePembelajaran: entry.metodePembelajaran,
      hadir: entry.kehadiranSiswa.hadir,
      sakit: entry.kehadiranSiswa.sakit,
      izin: entry.kehadiranSiswa.izin,
      alpa: entry.kehadiranSiswa.alpa,
      keteranganSiswa: entry.kehadiranSiswa.keterangan || '',
      keteranganPelaksanaan: entry.keteranganPelaksanaan,
      catatanRefleksi: entry.catatanRefleksi || '',
      lampiran: entry.lampiran || null
    });

    const formElement = document.getElementById('form-jurnal-mengajar');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
    showToast("Data jurnal dimuat ke form untuk diedit.");
  };

  // Delete entry action
  const confirmDeleteJournal = (id: string) => {
    if (isDemo) {
      showToast("🔒 Mode Demo: Penghapusan jurnal dikunci.");
      setJournalToDelete(null);
      return;
    }
    const updated = journals.filter(j => j.id !== id);
    saveJournalsToStorage(updated);
    showToast("Catatan jurnal berhasil dihapus.");
    setJournalToDelete(null);
  };

  // Image Upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDemo) {
      showToast("🔒 Mode Demo: Pengungahan foto dikunci.");
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setFormData(prev => ({ ...prev, lampiran: evt.target?.result as string }));
        showToast("Lampiran foto kegiatan berhasil diunggah.");
      };
      reader.readAsDataURL(file);
    }
  };

  // Quick TP suggestion from default subject CP data (Hitung KKTP)
  const getSubjectTPOptions = (matpelName: string): string[] => {
    const fase = biodata.fase || 'Fase B';
    const faseData = defaultSubjectData[fase] || {};

    if (!matpelName) return [];

    // 1. Direct match
    if (faseData[matpelName] && faseData[matpelName].length > 0) {
      return faseData[matpelName];
    }

    // 2. Fuzzy / alias matching (e.g., "Pendidikan Pancasila (PKN)" <-> "PKN", "IPA" <-> "IPAS")
    const keys = Object.keys(faseData);
    const mLower = matpelName.toLowerCase();

    const matchedKey = keys.find(k => {
      const kLower = k.toLowerCase();
      if (mLower === kLower) return true;
      if (mLower.includes(kLower) || kLower.includes(mLower)) return true;
      if ((mLower.includes('pkn') || mLower.includes('pancasila')) && (kLower.includes('pkn') || kLower.includes('pancasila'))) return true;
      if (mLower.includes('ipa') && (kLower.includes('ipa') || kLower.includes('sains'))) return true;
      if (mLower.includes('agama') && kLower.includes('agama')) return true;
      if (mLower.includes('banjar') && kLower.includes('banjar')) return true;
      if (mLower.includes('sbdp') && kLower.includes('sbdp')) return true;
      if (mLower.includes('pjok') && kLower.includes('pjok')) return true;
      if (mLower.includes('inggris') && kLower.includes('inggris')) return true;
      if ((mLower.includes('quran') || mLower.includes('btq')) && (kLower.includes('quran') || kLower.includes('btq'))) return true;
      if ((mLower.includes('tik') || mLower.includes('komputer') || mLower.includes('informatika')) && (kLower.includes('tik') || kLower.includes('komputer') || kLower.includes('informatika'))) return true;
      return false;
    });

    if (matchedKey && faseData[matchedKey] && faseData[matchedKey].length > 0) {
      return faseData[matchedKey];
    }

    return [
      `Peserta didik mampu memahami konsep dasar materi ${matpelName}`,
      `Peserta didik mampu mengaplikasikan pemahaman ${matpelName} dalam kehidupan sehari-hari`
    ];
  };

  // Filtered Journals List
  const filteredJournals = journals.filter(j => {
    const matchQuery =
      j.materi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.matpel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.kelas.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.tanggal.toLowerCase().includes(searchQuery.toLowerCase());

    const matchSubject = subjectFilter === 'all' || j.matpel === subjectFilter;
    return matchQuery && matchSubject;
  });

  const uniqueSubjects = Array.from(new Set(scheduleItems.map(s => s.matpel)));

  // Active journal data to render in print view / preview
  const activeJournalToPrint: JournalEntry = selectedJournalPrint || (journals.length > 0 ? journals[0] : {
    id: 'current-form',
    tanggal: formData.tanggal,
    hari: formData.hari,
    jamPelajaran: formData.jamPelajaran,
    kelas: formData.kelas,
    matpel: formData.matpel,
    materi: formData.materi || 'Makna Lambang dan Simbol Garuda Pancasila',
    tujuanPembelajaran: formData.tujuanPembelajaran || 'Memprakarsai dan memaksimalkan diri berkolaborasi',
    metodePembelajaran: formData.metodePembelajaran || 'Problem Based Learning (PBL)',
    kehadiranSiswa: {
      hadir: formData.hadir,
      sakit: formData.sakit,
      izin: formData.izin,
      alpa: formData.alpa,
      keterangan: formData.keteranganSiswa
    },
    keteranganPelaksanaan: formData.keteranganPelaksanaan,
    catatanRefleksi: formData.catatanRefleksi || 'Siswa dapat mengikuti instruksi pembelajaran dengan baik.',
    lampiran: formData.lampiran,
    createdAt: new Date().toISOString()
  });

  // Print Single Journal
  const handlePrintSingleJournal = (journal: JournalEntry) => {
    setSelectedJournalPrint(journal);
    setShowPrintModal(true);
  };

  // Print All / Active Journal
  const handlePrintAllJournals = () => {
    setSelectedJournalPrint(null);
    setShowPrintModal(true);
  };

  const triggerActualPrint = () => {
    document.body.classList.add('print-jurnal');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('print-jurnal');
    }, 500);
  };

  return (
    <div>
      {/* ON-SCREEN UI WRAPPER (HIDDEN WHEN PRINTING) */}
      <div className="no-print space-y-8 animate-in fade-in duration-300">
        
        {/* HEADER BANNER */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-850 to-indigo-950 text-white p-6 sm:p-8 rounded-2xl shadow-xl relative overflow-hidden border border-indigo-800">
          <div className="absolute right-0 top-0 opacity-10 translate-x-8 -translate-y-8 pointer-events-none">
            <NotebookPen className="w-72 h-72" />
          </div>
          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center space-x-2 bg-amber-400 text-indigo-950 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider w-fit shadow-xs mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Administrasi Guru Terintegrasi</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Jurnal Mengajar Guru</h2>
            <p className="text-indigo-200 text-xs sm:text-sm mt-1.5 font-medium leading-relaxed">
              Pencatatan real-time pelaksanaan pembelajaran, ketercapaian materi, tujuan pembelajaran (TP), model pembelajaran, rekapan kehadiran siswa, serta refleksi pengajaran harian.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  const el = document.getElementById('form-jurnal-mengajar');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-amber-500 hover:bg-amber-400 text-indigo-950 font-extrabold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 transition shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Isi Form Jurnal Harian</span>
              </button>

              <button
                onClick={handlePrintAllJournals}
                className="bg-indigo-800 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 transition border border-indigo-700 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-amber-300" />
                <span>Cetak / Simpan PDF Jurnal (1 Halaman)</span>
              </button>
            </div>
          </div>
        </div>

      {/* STEP 1 & 2: LIHAT JADWAL MENGAJAR HARI INI & PILIH MATA PELAJARAN / KELAS */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-900 rounded-xl shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Lihat Jadwal Mengajar Hari Ini</h3>
              <p className="text-xs text-slate-500">Pilih mata pelajaran & kelas dari jadwal untuk otomatis mengisi Form Jurnal</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-900">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Hari Ini: {getTodayFormatted()}</span>
          </div>
        </div>

        {/* Day Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none">
          {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Semua Hari'].map((day) => {
            const isActive = selectedDayTab === day;
            const isToday = day === getTodayDayName();

            return (
              <button
                key={day}
                onClick={() => setSelectedDayTab(day)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-900'
                }`}
              >
                <span>{day}</span>
                {isToday && (
                  <span className="bg-amber-400 text-indigo-950 text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase">
                    Hari Ini
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Schedule Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scheduleItems
            .filter(item => selectedDayTab === 'Semua Hari' || item.hari === selectedDayTab)
            .map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between group space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="bg-indigo-100 text-indigo-900 text-[10px] font-black px-2.5 py-0.5 rounded-lg border border-indigo-200">
                      {item.jamKe} ({item.waktu})
                    </span>
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-lg border border-amber-200">
                      {currentBioKelas}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 group-hover:text-indigo-950 transition">
                      {item.matpel}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                      <strong>Materi:</strong> {item.materiDefault}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      <strong>Model:</strong> {item.metodeDefault}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectSchedule(item)}
                  className="w-full bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-xs group-hover:bg-amber-500 group-hover:text-indigo-950"
                >
                  <span>Pilih & Isi Jurnal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* STEP 3: FORM JURNAL MENGAJAR */}
      {rpmSource && (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm"><Sparkles className="w-4 h-4" /></div>
            <div>
              <p className="text-xs font-extrabold text-emerald-800">Terisi otomatis dari RPM</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">{rpmSource.mapel} — {rpmSource.materi || rpmSource.bab} · Alokasi {rpmSource.jp} ({rpmSource.tps?.length || 0} TP)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={applyRpmToForm}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-sm shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Isi Form dari RPM</span>
          </button>
        </div>
      )}

      <div id="form-jurnal-mengajar" className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500 text-indigo-950 rounded-xl shadow-xs">
              <NotebookPen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">
                {editingJournalId ? 'Edit Jurnal Mengajar' : 'Form Jurnal Mengajar'}
              </h3>
              <p className="text-xs text-slate-500">Lengkapi data pelaksanaan pengajaran harian Anda</p>
            </div>
          </div>

          {editingJournalId && (
            <button
              type="button"
              onClick={() => {
                setEditingJournalId(null);
                showToast("Batal mengedit jurnal.");
              }}
              className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 transition"
            >
              Batal Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Hari & Tanggal, Jam Pelajaran, Kelas, Mata Pelajaran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Hari & Tanggal (otomatis)</label>
              <input
                type="text"
                value={formData.tanggal}
                onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Jam Pelajaran (otomatis)</label>
              <input
                type="text"
                value={formData.jamPelajaran}
                onChange={(e) => setFormData(prev => ({ ...prev, jamPelajaran: e.target.value }))}
                placeholder="misal: Jam 1 - 2 (07:30 - 08:50)"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-extrabold text-slate-700">Kelas</label>
                <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-indigo-500" />
                  Otomatis dari Biodata
                </span>
              </div>
              <input
                type="text"
                readOnly
                value={formData.kelas}
                title="Kelas mengikuti pengaturan di menu Biodata Sekolah"
                className="w-full bg-indigo-50 border border-indigo-200 rounded-xl p-2.5 text-xs font-bold text-indigo-900 cursor-not-allowed"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">Kelas mengikuti Fase / Kelas / Semester pada menu Biodata Sekolah.</p>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Mata Pelajaran</label>
              <select
                value={formData.matpel}
                onChange={(e) => {
                  const selectedMatpel = e.target.value;
                  const tps = getSubjectTPOptions(selectedMatpel);
                  setFormData(prev => ({
                    ...prev,
                    matpel: selectedMatpel,
                    tujuanPembelajaran: tps.length > 0 ? tps[0] : prev.tujuanPembelajaran
                  }));
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Pendidikan Pancasila (PKN)">Pendidikan Pancasila (PKN)</option>
                <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                <option value="Matematika">Matematika</option>
                <option value="IPA">IPA (IPAS)</option>
                <option value="TIK">TIK (Informatika / Komputer)</option>
                <option value="Bahasa dan Sastra Banjar">Bahasa dan Sastra Banjar</option>
                <option value="SBdP">SBdP</option>
                <option value="PJOK">PJOK</option>
                <option value="Bahasa Inggris">Bahasa Inggris</option>
                <option value="Pendidikan Agama Islam">Pendidikan Agama Islam (PAI)</option>
                <option value="Baca Tulis Al-Quran">Baca Tulis Al-Quran (BTQ)</option>
                <option value="Coding">Coding</option>
              </select>
            </div>
          </div>

          {/* Row 2: Materi & Tujuan Pembelajaran */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Materi yang Diajarkan</label>
              <textarea
                rows={3}
                value={formData.materi}
                onChange={(e) => setFormData(prev => ({ ...prev, materi: e.target.value }))}
                placeholder="Tuliskan bab / lingkup materi yang diajarkan..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <span>Tujuan Pembelajaran (TP)</span>
                </label>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Hitung KKTP: {getSubjectTPOptions(formData.matpel).length} TP
                </span>
              </div>

              {/* Select Dropdown from Hitung KKTP */}
              {getSubjectTPOptions(formData.matpel).length > 0 && (
                <div className="mb-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        setFormData(prev => ({ ...prev, tujuanPembelajaran: e.target.value }));
                      }
                    }}
                    value={getSubjectTPOptions(formData.matpel).includes(formData.tujuanPembelajaran) ? formData.tujuanPembelajaran : ''}
                    className="w-full bg-indigo-50/80 border border-indigo-200 rounded-lg p-2 text-xs font-bold text-indigo-950 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="" disabled>-- Pilih TP dari Hitung KKTP ({formData.matpel}) --</option>
                    {getSubjectTPOptions(formData.matpel).map((tp, i) => (
                      <option key={i} value={tp}>
                        TP {i + 1}: {tp}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <textarea
                rows={3}
                value={formData.tujuanPembelajaran}
                onChange={(e) => setFormData(prev => ({ ...prev, tujuanPembelajaran: e.target.value }))}
                placeholder="Tuliskan tujuan pembelajaran yang ingin dicapai..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                required
              />

              {/* Quick TP Chips from Hitung KKTP */}
              <div className="mt-1.5 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold block">Pilih cepat TP dari KKTP:</span>
                <div className="flex flex-wrap gap-1">
                  {getSubjectTPOptions(formData.matpel).map((tpText, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, tujuanPembelajaran: tpText }))}
                      className={`text-[10px] px-2 py-1 rounded-lg border transition text-left cursor-pointer flex items-center gap-1 ${
                        formData.tujuanPembelajaran === tpText
                          ? 'bg-indigo-600 text-white font-bold border-indigo-700 shadow-xs'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-950 font-semibold border-indigo-200'
                      }`}
                      title={tpText}
                    >
                      <span className="font-extrabold shrink-0">TP {idx + 1}:</span>
                      <span className="truncate max-w-[200px]">{tpText}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Metode/Model Pembelajaran */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Metode / Model Pembelajaran</label>
            <input
              type="text"
              value={formData.metodePembelajaran}
              onChange={(e) => setFormData(prev => ({ ...prev, metodePembelajaran: e.target.value }))}
              placeholder="misal: Problem Based Learning (PBL), Diskusi Kelompok, Eksperimen"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              required
            />
            {/* Quick Model Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                'Problem Based Learning (PBL)',
                'Project Based Learning (PjBL)',
                'Discovery Learning',
                'Cooperative Learning',
                'Ceramah & Diskusi',
                'Eksperimen & Praktik',
                'Drill & Practice'
              ].map((model) => (
                <button
                  key={model}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, metodePembelajaran: model }))}
                  className="text-[11px] bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-900 font-semibold px-2.5 py-1 rounded-lg border border-slate-200 transition cursor-pointer"
                >
                  {model}
                </button>
              ))}
            </div>
          </div>

          {/* Row 4: Kehadiran Siswa & Keterangan Pelaksanaan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* Kehadiran Siswa Block */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 border-slate-200 gap-2">
                <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                  <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-black text-slate-800">Kehadiran Siswa</span>
                  <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    Tersinkron dengan Menu Absensi
                  </span>
                </div>

                <div className="flex items-center gap-2">
<button
                    type="button"
                    onClick={handleManualSyncAbsensi}
                    className="text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-900 px-2 py-1 rounded-lg border border-indigo-200 transition flex items-center gap-1 cursor-pointer"
                    title="Ambil data kehadiran terbaru dari Tab Absensi"
                  >
                    <RefreshCw className="w-3 h-3 text-indigo-600" />
                    <span>Sinkronkan Absensi</span>
                  </button>

                  <span className="text-[11px] font-black bg-indigo-900 text-white px-2.5 py-0.5 rounded-full shrink-0">
                    Total: {formData.hadir + formData.sakit + formData.izin + formData.alpa} Siswa
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl">
                  <span className="block text-[10px] font-extrabold text-emerald-800 uppercase">Hadir</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.hadir}
                    onChange={(e) => setFormData(prev => ({ ...prev, hadir: parseInt(e.target.value) || 0 }))}
                    className="w-full text-center font-black text-emerald-900 bg-transparent text-sm focus:outline-none"
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 p-2 rounded-xl">
                  <span className="block text-[10px] font-extrabold text-amber-800 uppercase">Sakit</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.sakit}
                    onChange={(e) => setFormData(prev => ({ ...prev, sakit: parseInt(e.target.value) || 0 }))}
                    className="w-full text-center font-black text-amber-900 bg-transparent text-sm focus:outline-none"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 p-2 rounded-xl">
                  <span className="block text-[10px] font-extrabold text-blue-800 uppercase">Izin</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.izin}
                    onChange={(e) => setFormData(prev => ({ ...prev, izin: parseInt(e.target.value) || 0 }))}
                    className="w-full text-center font-black text-blue-900 bg-transparent text-sm focus:outline-none"
                  />
                </div>

                <div className="bg-rose-50 border border-rose-200 p-2 rounded-xl">
                  <span className="block text-[10px] font-extrabold text-rose-800 uppercase">Alpa</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.alpa}
                    onChange={(e) => setFormData(prev => ({ ...prev, alpa: parseInt(e.target.value) || 0 }))}
                    className="w-full text-center font-black text-rose-900 bg-transparent text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                  Daftar Siswa Tidak Hadir / Catatan (Otomatis Terisi dari Absensi)
                </label>
                <input
                  type="text"
                  value={formData.keteranganSiswa}
                  onChange={(e) => setFormData(prev => ({ ...prev, keteranganSiswa: e.target.value }))}
                  placeholder="misal: Budi Santoso (Sakit), Ani (Izin)"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Keterangan Pelaksanaan & Refleksi */}
            <div className="space-y-3">
              <span className="text-xs font-black text-slate-800 block border-b pb-2 border-slate-200">
                Keterangan Pelaksanaan & Refleksi
              </span>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Status Pelaksanaan</label>
                <select
                  value={formData.keteranganPelaksanaan}
                  onChange={(e) => setFormData(prev => ({ ...prev, keteranganPelaksanaan: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Terlaksana Sepenuhnya">Terlaksana Sepenuhnya</option>
                  <option value="Terlaksana Sebagian">Terlaksana Sebagian</option>
                  <option value="Terhambat / Diganti Hari Lain">Terhambat / Diganti Hari Lain</option>
                  <option value="Penugasan Mandiri / Daring">Penugasan Mandiri / Daring</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Catatan Refleksi Guru / Kendala</label>
                <textarea
                  rows={2}
                  value={formData.catatanRefleksi}
                  onChange={(e) => setFormData(prev => ({ ...prev, catatanRefleksi: e.target.value }))}
                  placeholder="Tuliskan catatan refleksi atau respon peserta didik..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Lampiran (opsional) */}
          <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <label className="text-xs font-extrabold text-indigo-950 flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span>Lampiran Foto Kegiatan Pembelajaran (Opsional)</span>
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">Unggah foto bukti dokumentasi suasana kelas saat pembelajaran berlangsung</p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              {formData.lampiran ? (
                <div className="flex items-center space-x-2">
                  <img src={formData.lampiran} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-indigo-300 shadow-xs" />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, lampiran: null }))}
                    className="p-1.5 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition text-xs font-bold"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="bg-white hover:bg-indigo-100 border border-indigo-300 text-indigo-900 font-bold px-3 py-2 rounded-xl text-xs cursor-pointer transition flex items-center space-x-1.5 shadow-xs">
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                  <span>Pilih Foto</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-6 py-3 rounded-xl text-sm flex items-center space-x-2 shadow-lg transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{editingJournalId ? 'Update Jurnal Mengajar' : 'Simpan Jurnal Mengajar'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* STEP 4: RIWAYAT JURNAL MENGAJAR & ACTION BUTTONS */}
      <div id="riwayat-jurnal-mengajar" className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-900 text-white rounded-xl shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Riwayat Jurnal Mengajar</h3>
              <p className="text-xs text-slate-500">
                Total tersimpan: <strong>{journals.length} catatan jurnal</strong>
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari materi, kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700"
            >
              <option value="all">Semua Mata Pelajaran</option>
              {uniqueSubjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>

        {/* History Cards List */}
        {filteredJournals.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <NotebookPen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600">Belum ada riwayat jurnal mengajar</p>
            <p className="text-xs text-slate-400 mt-0.5">Silakan pilih jadwal di atas dan simpan jurnal mengajar Anda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJournals.map((journal) => (
              <div
                key={journal.id}
                className="bg-slate-50 hover:bg-indigo-50/30 border border-slate-200 rounded-2xl p-5 transition-all space-y-3"
              >
                {/* Journal Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-indigo-900 text-white font-extrabold text-[11px] px-3 py-1 rounded-xl">
                      {journal.tanggal}
                    </span>
                    <span className="bg-amber-400 text-indigo-950 font-black text-[11px] px-2.5 py-1 rounded-xl uppercase">
                      {journal.kelas}
                    </span>
                    <span className="bg-indigo-100 text-indigo-900 font-bold text-[11px] px-2.5 py-1 rounded-xl">
                      {journal.jamPelajaran}
                    </span>
                  </div>

                  <span className={`text-[11px] font-black px-3 py-1 rounded-xl w-fit ${
                    journal.keteranganPelaksanaan === 'Terlaksana Sepenuhnya'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {journal.keteranganPelaksanaan}
                  </span>
                </div>

                {/* Body Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="md:col-span-2 space-y-1.5">
                    <h4 className="font-extrabold text-sm text-indigo-950">
                      {journal.matpel}
                    </h4>
                    <p className="text-slate-700">
                      <strong>Materi:</strong> {journal.materi}
                    </p>
                    <p className="text-slate-600">
                      <strong>Tujuan Pembelajaran:</strong> {journal.tujuanPembelajaran}
                    </p>
                    <p className="text-slate-600">
                      <strong>Model Pembelajaran:</strong> {journal.metodePembelajaran}
                    </p>
                    {journal.catatanRefleksi && (
                      <p className="text-slate-500 italic bg-white p-2 rounded-lg border border-slate-200 mt-2">
                        &quot;Refleksi: {journal.catatanRefleksi}&quot;
                      </p>
                    )}
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="font-black text-slate-800 text-[11px] block border-b pb-1 mb-1.5">Kehadiran Siswa</span>
                      <div className="grid grid-cols-2 gap-1 text-[11px] font-bold text-slate-700">
                        <span className="text-emerald-700">Hadir: {journal.kehadiranSiswa.hadir}</span>
                        <span className="text-amber-700">Sakit: {journal.kehadiranSiswa.sakit}</span>
                        <span className="text-blue-700">Izin: {journal.kehadiranSiswa.izin}</span>
                        <span className="text-rose-700">Alpa: {journal.kehadiranSiswa.alpa}</span>
                      </div>
                      {journal.kehadiranSiswa.keterangan && (
                        <p className="text-[10px] text-slate-500 mt-1.5 truncate" title={journal.kehadiranSiswa.keterangan}>
                          Ket: {journal.kehadiranSiswa.keterangan}
                        </p>
                      )}
                    </div>

                    {journal.lampiran && (
                      <div className="flex items-center space-x-2 pt-1 border-t border-slate-100">
                        <img src={journal.lampiran} alt="Foto Kegiatan" className="w-10 h-10 object-cover rounded-lg border" />
                        <span className="text-[10px] text-indigo-700 font-bold">Dokumentasi Terlampir</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons: Edit & Cetak/Export PDF */}
                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 no-print">
                  <button
                    type="button"
                    onClick={() => handleEdit(journal)}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-xs px-3 py-1.5 rounded-xl border border-indigo-200 flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Jurnal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrintSingleJournal(journal)}
                    className="bg-amber-500 hover:bg-amber-400 text-indigo-950 font-black text-xs px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Jurnal (PDF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setJournalToDelete(journal)}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-1.5 rounded-xl border border-rose-200 transition cursor-pointer ml-2"
                    title="Hapus Jurnal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL POP-UP: KONFIRMASI HAPUS JURNAL */}
      {journalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Konfirmasi Hapus Jurnal</h3>
                <p className="text-xs text-slate-500">Apakah Anda yakin ingin menghapus catatan jurnal ini?</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
              <p><strong>Mata Pelajaran:</strong> {journalToDelete.matpel}</p>
              <p><strong>Kelas:</strong> {journalToDelete.kelas}</p>
              <p><strong>Tanggal:</strong> {journalToDelete.tanggal}</p>
              <p><strong>Materi:</strong> {journalToDelete.materi}</p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setJournalToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => confirmDeleteJournal(journalToDelete.id)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl text-xs flex items-center space-x-1.5 shadow-md transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Jurnal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL POP-UP: PRATINJAU & CETAK JURNAL (PDF) */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-500 text-indigo-950 rounded-xl shadow-xs">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Pratinjau Cetak Jurnal Mengajar (PDF)</h3>
                  <p className="text-xs text-slate-500">
                    {selectedJournalPrint ? `Jurnal Tanggal: ${selectedJournalPrint.tanggal} (${selectedJournalPrint.matpel})` : 'Rekap Semua Jurnal Mengajar'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={triggerActualPrint}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-md transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Sekarang (Print / PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Preview Screen */}
            <div className="bg-slate-100 p-4 sm:p-6 rounded-xl border border-slate-300 shadow-inner">
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4 text-slate-900 text-xs font-sans">
                {/* Header Info */}
                <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-black uppercase tracking-wide text-slate-900">{biodata.namaSekolah || "SD NEGERI BAKUMPUL"}</h2>
                    <p className="text-xs font-semibold text-slate-600">{biodata.alamat}, {biodata.kota}</p>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mt-1">JURNAL HARIAN MENGAJAR GURU</h3>
                  </div>
                  <div className="text-right text-xs font-bold text-slate-900 space-y-0.5">
                    <p>Fase / Kelas: {biodata.fase} / {currentBioKelas.replace(/^Kelas\s*/i, '')}</p>
                    <p>Semester: {biodata.semester}</p>
                  </div>
                </div>

                {/* Card Container Box */}
                <div className="border border-slate-300 rounded-xl p-4 bg-white space-y-3">
                  {/* Top Meta Gray Box */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 grid grid-cols-2 gap-y-2 text-xs font-bold text-slate-900">
                    <div>Hari & Tanggal: <span className="text-indigo-900 font-extrabold ml-1">{activeJournalToPrint.tanggal}</span></div>
                    <div>Jam Pelajaran: <span className="font-semibold text-slate-800 ml-1">{activeJournalToPrint.jamPelajaran}</span></div>
                    <div>Mata Pelajaran: <span className="font-bold text-slate-900 ml-1">{activeJournalToPrint.matpel}</span></div>
                    <div>Kelas: <span className="font-semibold text-slate-800 ml-1">{activeJournalToPrint.kelas}</span></div>
                  </div>

                  {/* Table 2-Column */}
                  <table className="w-full border-collapse border border-slate-800 text-xs text-slate-900">
                    <tbody>
                      <tr>
                        <td className="border border-slate-800 font-bold p-2.5 bg-slate-50/80 w-1/3 text-slate-900">Materi yang Diajarkan</td>
                        <td className="border border-slate-800 p-2.5 font-medium text-slate-900">{activeJournalToPrint.materi}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-800 font-bold p-2.5 bg-slate-50/80 text-slate-900">Tujuan Pembelajaran (TP)</td>
                        <td className="border border-slate-800 p-2.5 font-medium text-slate-900">{activeJournalToPrint.tujuanPembelajaran}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-800 font-bold p-2.5 bg-slate-50/80 text-slate-900">Metode/Model Pembelajaran</td>
                        <td className="border border-slate-800 p-2.5 font-medium text-slate-900">{activeJournalToPrint.metodePembelajaran}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-800 font-bold p-2.5 bg-slate-50/80 text-slate-900">Kehadiran Siswa</td>
                        <td className="border border-slate-800 p-2.5 font-medium text-slate-900">
                          Hadir: {activeJournalToPrint.kehadiranSiswa.hadir}, Sakit: {activeJournalToPrint.kehadiranSiswa.sakit}, Izin: {activeJournalToPrint.kehadiranSiswa.izin}, Alpa: {activeJournalToPrint.kehadiranSiswa.alpa}
                          {activeJournalToPrint.kehadiranSiswa.keterangan ? ` (${activeJournalToPrint.kehadiranSiswa.keterangan})` : ''}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-800 font-bold p-2.5 bg-slate-50/80 text-slate-900">Keterangan Pelaksanaan</td>
                        <td className="border border-slate-800 p-2.5 font-extrabold text-emerald-800">{activeJournalToPrint.keteranganPelaksanaan}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-800 font-bold p-2.5 bg-slate-50/80 text-slate-900">Refleksi Guru</td>
                        <td className="border border-slate-800 p-2.5 font-medium text-slate-900">{activeJournalToPrint.catatanRefleksi || 'Siswa dapat mengikuti instruksi pembelajaran dengan baik.'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-900 pt-6">
                  <div className="text-center space-y-12">
                    <p className="font-bold leading-tight">Mengetahui,<br />Kepala Sekolah</p>
                    <div>
                      <p className="font-black underline uppercase text-sm tracking-tight">{biodata.namaKepsek || "RAFI'I HAMDI,M.PD."}</p>
                      <p className="text-[11px] font-normal text-slate-600">NIP. {biodata.nipKepsek || "19850101 201001 1 001"}</p>
                    </div>
                  </div>

                  <div className="text-center space-y-12">
                    <p className="font-bold leading-tight">{biodata.kota || "Batu Bahalang"}, {activeJournalToPrint.tanggal || getTodayFormatted()}<br />Guru Kelas / Mata Pelajaran</p>
                    <div>
                      <p className="font-black underline uppercase text-sm tracking-tight">{biodata.namaGuru || "AHMAD MUJAHID, S.PD."}</p>
                      <p className="text-[11px] font-normal text-slate-600">NIP. {biodata.nipGuru || "19900202 201502 1 002"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Tutup Pratinjau
              </button>
              <button
                type="button"
                onClick={triggerActualPrint}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-indigo-950 font-black rounded-xl text-xs flex items-center space-x-2 shadow-md transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div> {/* END OF ON-SCREEN NO-PRINT WRAPPER */}

      {/* PRINT LAYOUT FOR SINGLE SHEET A4 PRINTING - MATCHING USER SCREENSHOT EXACTLY */}
      <div className="hidden print:block print-jurnal-sheet text-slate-900 font-sans p-2 max-w-3xl mx-auto">
        <style>{`
          @media print {
            @page {
              size: A4 portrait !important;
              margin: 8mm 10mm !important;
            }
            body {
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        `}</style>

        {/* Outer Card Container matching screenshot */}
        <div className="border border-slate-300 rounded-2xl p-6 bg-white space-y-4">
          {/* Top Kop Header */}
          <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
            <div>
              <h2 className="text-base font-black uppercase tracking-wide text-slate-900">{biodata.namaSekolah || "SD NEGERI BAKUMPUL"}</h2>
              <p className="text-xs font-semibold text-slate-600">{biodata.alamat || "Jl. Pendidikan No. 12"}, {biodata.kota || "Batu Bahalang"}</p>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mt-1">JURNAL HARIAN MENGAJAR GURU</h3>
            </div>

            <div className="text-right text-xs font-bold text-slate-900 space-y-0.5">
              <p>Fase / Kelas: {biodata.fase || "Fase B"} / {currentBioKelas.replace(/^Kelas\s*/i, '') || "IV"}</p>
              <p>Semester: {biodata.semester || "1"}</p>
            </div>
          </div>

          {/* Inner Card Box */}
          <div className="border border-slate-300 rounded-xl p-4 bg-white space-y-3.5">
            {/* Top Meta Gray Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 grid grid-cols-2 gap-y-2 text-xs font-bold text-slate-900">
              <div>Hari & Tanggal: <span className="text-indigo-900 font-extrabold ml-1.5">{activeJournalToPrint.tanggal}</span></div>
              <div>Jam Pelajaran: <span className="font-semibold text-slate-800 ml-1.5">{activeJournalToPrint.jamPelajaran}</span></div>
              <div>Mata Pelajaran: <span className="font-bold text-slate-900 ml-1.5">{activeJournalToPrint.matpel}</span></div>
              <div>Kelas: <span className="font-semibold text-slate-800 ml-1.5">{activeJournalToPrint.kelas}</span></div>
            </div>

            {/* Table 2-Column */}
            <table className="w-full border-collapse border border-slate-800 text-xs text-slate-900">
              <tbody>
                <tr>
                  <td className="w-[32%] border border-slate-800 font-bold p-2.5 bg-slate-50/80 text-slate-900 align-top">Materi yang Diajarkan</td>
                  <td className="border border-slate-800 p-2.5 font-medium text-slate-900 align-top">{activeJournalToPrint.materi}</td>
                </tr>
                <tr>
                  <td className="border border-slate-800 font-bold p-2.5 bg-slate-50/80 text-slate-900 align-top">Tujuan Pembelajaran (TP)</td>
                  <td className="border border-slate-800 p-2.5 font-medium text-slate-900 align-top">{activeJournalToPrint.tujuanPembelajaran}</td>
                </tr>
                <tr>
                  <td className="border border-slate-800 font-bold p-2.5 bg-slate-50/80 text-slate-900 align-top">Metode/Model Pembelajaran</td>
                  <td className="border border-slate-800 p-2.5 font-medium text-slate-900 align-top">{activeJournalToPrint.metodePembelajaran}</td>
                </tr>
                <tr>
                  <td className="border border-slate-800 font-bold p-2.5 bg-slate-50/80 text-slate-900 align-top">Kehadiran Siswa</td>
                  <td className="border border-slate-800 p-2.5 font-medium text-slate-900 align-top">
                    Hadir: {activeJournalToPrint.kehadiranSiswa.hadir}, Sakit: {activeJournalToPrint.kehadiranSiswa.sakit}, Izin: {activeJournalToPrint.kehadiranSiswa.izin}, Alpa: {activeJournalToPrint.kehadiranSiswa.alpa}
                    {activeJournalToPrint.kehadiranSiswa.keterangan ? ` (${activeJournalToPrint.kehadiranSiswa.keterangan})` : ''}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-800 font-bold p-2.5 bg-slate-50/80 text-slate-900 align-top">Keterangan Pelaksanaan</td>
                  <td className="border border-slate-800 p-2.5 font-extrabold text-emerald-800 align-top">{activeJournalToPrint.keteranganPelaksanaan}</td>
                </tr>
                <tr>
                  <td className="border border-slate-800 font-bold p-2.5 bg-slate-50/80 text-slate-900 align-top">Refleksi Guru</td>
                  <td className="border border-slate-800 p-2.5 font-medium text-slate-900 align-top">{activeJournalToPrint.catatanRefleksi || 'Pembelajaran berjalan interaktif dan lancar.'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signatures inside the outer card */}
          <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-900 pt-6">
            <div className="text-center space-y-12">
              <p className="font-bold leading-tight">Mengetahui,<br />Kepala Sekolah</p>
              <div>
                <p className="font-black underline uppercase text-sm tracking-tight">{biodata.namaKepsek || "RAFI'I HAMDI,M.PD."}</p>
                <p className="text-[11px] font-normal text-slate-600">NIP. {biodata.nipKepsek || "19850101 201001 1 001"}</p>
              </div>
            </div>

            <div className="text-center space-y-12">
              <p className="font-bold leading-tight">{biodata.kota || "Batu Bahalang"}, {activeJournalToPrint.tanggal || getTodayFormatted()}<br />Guru Kelas / Mata Pelajaran</p>
              <div>
                <p className="font-black underline uppercase text-sm tracking-tight">{biodata.namaGuru || "AHMAD MUJAHID, S.PD."}</p>
                <p className="text-[11px] font-normal text-slate-600">NIP. {biodata.nipGuru || "19900202 201502 1 002"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
