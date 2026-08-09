import { useState, useEffect, useCallback } from 'react';
import {
  Biodata,
  DiagnosticData,
  SubjectStudentGrade,
  StudentEvaluationGrade,
  KKTPRow,
  MainTab,
  BukuNilaiSubTab,
  BNFilter
} from './types';
import {
  initialBiodata,
  initialLockedTargets,
  initialDiagnosticDatabase,
  initialDefaultSubjectData,
  generateSampleSubjectGrades,
  generateSampleEvaluationGrades
} from './data/initialData';
import { Header } from './components/Header';
import { LoginScreen, UserAccount } from './components/LoginScreen';
import { BiodataTab } from './components/BiodataTab';
import { DiagnosaTab } from './components/DiagnosaTab';
import { KktpTab } from './components/KktpTab';
import { BukuNilaiTab } from './components/BukuNilaiTab';
import { AbsensiTab } from './components/AbsensiTab';
import { JurnalMengajarTab } from './components/JurnalMengajarTab';
import { RpmTab } from './components/RpmTab';
import { Modals } from './components/Modals';
import { clearActiveGuruLogin } from './utils/teacherStorage';
import { pushGuruLogout } from './utils/schoolSync';
import { CheckCircle2 } from 'lucide-react';

const cleanNipOf = (nip?: string): string => (nip || '').trim().replace(/\s+/g, '');

const biodataStorageKey = (nip?: string): string => `bakumpul_biodata_${cleanNipOf(nip)}`;

function loadSavedBiodata(nip?: string): Biodata | null {
  try {
    const saved = localStorage.getItem(biodataStorageKey(nip));
    if (saved) return { ...initialBiodata, ...JSON.parse(saved) };
  } catch {
    // fallback
  }
  return null;
}

export default function App() {
  // Authentication & Session State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('bakumpul_logged_in') === 'true';
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = sessionStorage.getItem('bakumpul_current_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return null;
  });

  const [activeSemester, setActiveSemester] = useState<string>(() => {
    try {
      return sessionStorage.getItem('bakumpul_semester') || 'Semester 1';
    } catch {
      return 'Semester 1';
    }
  });

  const [activeTab, setActiveTab] = useState<MainTab>('biodata');
  const [activeBukuNilaiSubTab, setActiveBukuNilaiSubTab] = useState<BukuNilaiSubTab>('rekap-matpel');
  const [bnFilter, setBnFilter] = useState<BNFilter>('all');

  const [biodata, setBiodata] = useState<Biodata>(() => {
    try {
      const savedUser = sessionStorage.getItem('bakumpul_current_user');
      if (savedUser) {
        const acc = JSON.parse(savedUser) as UserAccount;
        const saved = loadSavedBiodata(acc.nipGuru);
        if (saved) return saved;
      }
    } catch {
      // fallback
    }
    return initialBiodata;
  });
  const [lockedTargets, setLockedTargets] = useState<Record<string, number>>(initialLockedTargets);
  const [diagnosticDatabase, setDiagnosticDatabase] = useState<Record<string, DiagnosticData>>(initialDiagnosticDatabase);
  const [defaultSubjectData, setDefaultSubjectData] = useState<Record<string, Record<string, string[]>>>(initialDefaultSubjectData);

  const [subjectGradesDatabase, setSubjectGradesDatabase] = useState<Record<string, SubjectStudentGrade[]>>(generateSampleSubjectGrades);
  const [gradesDatabase, setGradesDatabase] = useState<Record<string, StudentEvaluationGrade[]>>(generateSampleEvaluationGrades);

  // Active Subject Selectors
  const [diagnosaSubject, setDiagnosaSubject] = useState<string>('PKN');
  const [kktpSubject, setKktpSubject] = useState<string>('PKN');
  const [rekapMatpelSubject, setRekapMatpelSubject] = useState<string>('PKN');
  const [bnMatpelSubject, setBnMatpelSubject] = useState<string>('PKN');

  // Active KKTP Rows
  const [activeKKTPROws, setActiveKKTPROws] = useState<KKTPRow[]>([]);

  // Nilai "KKTP CAPAIAN" per mapel (dari Hitung KKTP) agar mengikuti Buku Nilai
  const [kktpCapaian, setKktpCapaian] = useState<Record<string, number>>({});

  // Modals state
  const [showCPBankModal, setShowCPBankModal] = useState<boolean>(false);
  const [showUploadExcelModal, setShowUploadExcelModal] = useState<boolean>(false);
  const [showLightboxModal, setShowLightboxModal] = useState<boolean>(false);
  const [lightboxImgSrc, setLightboxImgSrc] = useState<string>("");

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // Handle Login Success
  const handleLoginSuccess = (account: UserAccount, semester: string) => {
    setIsLoggedIn(true);
    setCurrentUser(account);
    setActiveSemester(semester);

    // Sync user details to Biodata state (pertahankan data tersimpan per akun)
    const saved = loadSavedBiodata(account.nipGuru);
    const merged = { ...initialBiodata, ...(saved || {}) };
    setBiodata({
      ...merged,
      namaSekolah: account.namaSekolah || merged.namaSekolah,
      npsn: account.npsn || merged.npsn,
      namaGuru: account.namaGuru || merged.namaGuru,
      nipGuru: account.nipGuru || merged.nipGuru,
      alamat: account.alamat || merged.alamat,
      kota: account.kota || merged.kota,
      fase: account.fase || merged.fase,
      kelas: account.kelas || merged.kelas,
      semester: semester.includes('1') ? '1' : '2'
    });

    try {
      sessionStorage.setItem('bakumpul_logged_in', 'true');
      sessionStorage.setItem('bakumpul_current_user', JSON.stringify(account));
      sessionStorage.setItem('bakumpul_semester', semester);
    } catch {
      // fallback
    }

    showToast(`Selamat datang, ${account.namaGuru}! Berhasil masuk ke BAKUMPUL.`);
  };

  // Handle Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    if (currentUser) {
      clearActiveGuruLogin(currentUser.nipGuru);
      pushGuruLogout(currentUser.nipGuru);
    }
    setCurrentUser(null);
    try {
      sessionStorage.removeItem('bakumpul_logged_in');
      sessionStorage.removeItem('bakumpul_current_user');
    } catch {
      // fallback
    }
    showToast("Anda telah keluar dari aplikasi.");
  };

  // Load active KKTP subject CP rows
  const loadKKTPSubjectData = useCallback(() => {
    const fase = biodata.fase;
    const cps = (defaultSubjectData[fase] && defaultSubjectData[fase][kktpSubject]) ?
      defaultSubjectData[fase][kktpSubject] :
      [`Siswa mampu memahami kompetensi dasar mata pelajaran ${kktpSubject}.`];

    const rows: KKTPRow[] = cps.map((cp, idx) => ({
      id: idx + 1,
      subject: kktpSubject,
      cp,
      score: 3
    }));

    setActiveKKTPROws(rows);
  }, [biodata.fase, kktpSubject, defaultSubjectData]);

  useEffect(() => {
    loadKKTPSubjectData();
  }, [loadKKTPSubjectData]);

  // Sinkronkan nilai "KKTP CAPAIAN" per mapel setiap baris/bobot KKTP berubah
  useEffect(() => {
    const subj = activeKKTPROws[0]?.subject || kktpSubject;
    const capaian = activeKKTPROws.length > 0
      ? (activeKKTPROws.reduce((acc, row) => acc + row.score, 0) / (activeKKTPROws.length * 4)) * 100
      : 0;
    setKktpCapaian(prev => ({ ...prev, [subj]: capaian }));
  }, [activeKKTPROws, kktpSubject]);

  // Simpan biodata per akun (NIP) agar tidak ter-reset saat reload / logout
  useEffect(() => {
    if (!currentUser) return;
    try {
      localStorage.setItem(biodataStorageKey(currentUser.nipGuru), JSON.stringify(biodata));
    } catch {
      // fallback
    }
  }, [biodata, currentUser]);

  const resetToDefaultData = () => {
    loadKKTPSubjectData();
    showToast("Data KKTP berhasil diatur ulang.");
  };

  const triggerPrint = (mode: 'diagnosa' | 'kktp' | 'bukunilai' | 'absensi', _viewTitle?: string) => {
    document.body.classList.add(`print-${mode}`);
    window.print();
    setTimeout(() => {
      document.body.classList.remove('print-diagnosa', 'print-kktp', 'print-bukunilai', 'print-absensi');
    }, 500);
  };

  const openLightboxModal = (src: string) => {
    setLightboxImgSrc(src);
    setShowLightboxModal(true);
  };

  const isDemo = currentUser?.isDemo === true;

  // IF NOT LOGGED IN -> SHOW LOGIN SCREEN FIRST AS PRIVACY PROTECTOR
  if (!isLoggedIn) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        initialBiodata={biodata}
      />
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col text-slate-800 font-medium">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-indigo-900 text-white border border-indigo-700 px-4 py-3 rounded-xl shadow-xl z-[200] text-sm font-semibold flex items-center space-x-2 transition-all duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        biodata={biodata}
        onLogout={handleLogout}
        currentUser={currentUser}
        activeSemester={activeSemester}
        isDemo={isDemo}
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'biodata' && (
          <BiodataTab
            biodata={biodata}
            setBiodata={setBiodata}
            showToast={showToast}
            isDemo={isDemo}
          />
        )}

        {activeTab === 'diagnosa' && (
          <DiagnosaTab
            biodata={biodata}
            subject={diagnosaSubject}
            setSubject={setDiagnosaSubject}
            diagnosticDatabase={diagnosticDatabase}
            setDiagnosticDatabase={setDiagnosticDatabase}
            setLockedTargets={setLockedTargets}
            triggerPrint={triggerPrint}
            showToast={showToast}
            isDemo={isDemo}
          />
        )}

        {activeTab === 'kktp' && (
          <KktpTab
            biodata={biodata}
            subject={kktpSubject}
            setSubject={setKktpSubject}
            lockedTargets={lockedTargets}
            setLockedTargets={setLockedTargets}
            activeKKTPROws={activeKKTPROws}
            setActiveKKTPROws={setActiveKKTPROws}
            defaultSubjectData={defaultSubjectData}
            setDefaultSubjectData={setDefaultSubjectData}
            openCPBankModal={() => setShowCPBankModal(true)}
            openUploadExcelModal={() => setShowUploadExcelModal(true)}
            triggerPrint={triggerPrint}
            resetToDefaultData={resetToDefaultData}
            showToast={showToast}
            isDemo={isDemo}
          />
        )}

        {activeTab === 'bukunilai' && (
          <BukuNilaiTab
            biodata={biodata}
            subTab={activeBukuNilaiSubTab}
            setSubTab={setActiveBukuNilaiSubTab}
            rekapMatpelSubject={rekapMatpelSubject}
            setRekapMatpelSubject={setRekapMatpelSubject}
            bnMatpelSubject={bnMatpelSubject}
            setBnMatpelSubject={setBnMatpelSubject}
            bnFilter={bnFilter}
            setBnFilter={setBnFilter}
            lockedTargets={lockedTargets}
            kktpCapaian={kktpCapaian}
            subjectGradesDatabase={subjectGradesDatabase}
            setSubjectGradesDatabase={setSubjectGradesDatabase}
            gradesDatabase={gradesDatabase}
            setGradesDatabase={setGradesDatabase}
            defaultSubjectData={defaultSubjectData}
            triggerPrint={triggerPrint}
            showToast={showToast}
            isDemo={isDemo}
          />
        )}

        {activeTab === 'absensi' && (
          <AbsensiTab
            biodata={biodata}
            subjectGradesDatabase={subjectGradesDatabase}
            gradesDatabase={gradesDatabase}
            showToast={showToast}
            triggerPrint={triggerPrint}
            isDemo={isDemo}
          />
        )}

        {activeTab === 'jurnal' && (
          <JurnalMengajarTab
            biodata={biodata}
            defaultSubjectData={defaultSubjectData}
            subjectGradesDatabase={subjectGradesDatabase}
            gradesDatabase={gradesDatabase}
            showToast={showToast}
            triggerPrint={triggerPrint}
            isDemo={isDemo}
            schoolNpsn={currentUser?.npsn}
          />
        )}

        {activeTab === 'rpm' && (
          <RpmTab
            biodata={biodata}
            diagnosticDatabase={diagnosticDatabase}
            defaultSubjectData={defaultSubjectData}
            subjectGradesDatabase={subjectGradesDatabase}
            gradesDatabase={gradesDatabase}
            showToast={showToast}
            isDemo={isDemo}
          />
        )}
      </main>

      {/* ALL MODALS */}
      <Modals
        biodata={biodata}
        subject={kktpSubject}
        defaultSubjectData={defaultSubjectData}
        setDefaultSubjectData={setDefaultSubjectData}
        showCPBankModal={showCPBankModal}
        closeCPBankModal={() => setShowCPBankModal(false)}
        showUploadExcelModal={showUploadExcelModal}
        closeUploadExcelModal={() => setShowUploadExcelModal(false)}
showLightboxModal={showLightboxModal}
        lightboxImgSrc={lightboxImgSrc}
        closeLightboxModal={() => setShowLightboxModal(false)}
        showToast={showToast}
        loadSubjectData={loadKKTPSubjectData}
        isDemo={isDemo}
      />

      {/* FOOTER */}
      <footer className="bg-indigo-950 text-white border-t border-indigo-900 py-6 text-center text-xs font-medium no-print">
        <p>&copy; 2026 BAKUMPUL. Portal Kurikulum Merdeka Terintegrasi.</p>
        <p className="text-indigo-400 mt-1">Dibuat dengan dedikasi untuk mendukung administrasi mengajar yang lebih cepat dan efisien. Creative by @Rafii Hamdi, M.Pd.</p>
      </footer>
    </div>
  );
}
