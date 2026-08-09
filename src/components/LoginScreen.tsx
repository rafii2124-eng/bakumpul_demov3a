import React, { useState, useEffect } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  KeyRound,
  FileText,
  UserPlus,
  HelpCircle,
  CheckCircle2,
  Globe,
  Instagram,
  Facebook,
  Youtube,
  GraduationCap,
  Sparkles,
  X
} from 'lucide-react';
import { Biodata } from '../types';
import { markActiveGuruLogin } from '../utils/teacherStorage';
import { pushGuruLogin } from '../utils/schoolSync';

export interface UserAccount {
  npsn: string;
  namaSekolah: string;
  namaGuru: string;
  nipGuru: string;
  alamat?: string;
  kota?: string;
  fase?: string;
  kelas?: string;
  isDemo?: boolean;
}

interface LoginScreenProps {
  onLoginSuccess: (account: UserAccount, semester: string) => void;
  initialBiodata: Biodata;
}

const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    npsn: '30301234',
    namaSekolah: 'SD HARAPAN BANGSA',
    namaGuru: 'RAFI\'I HAMDI, M.PD.',
    nipGuru: '19850101 201001 1 001',
    alamat: 'Jl. Merdeka No. 45',
    kota: 'Banjarmasin',
    fase: 'Fase C',
    kelas: 'Kelas V B',
    isDemo: true
  },
];

export { DEFAULT_ACCOUNTS };

const cleanNipOf = (nip?: string): string => (nip || '').trim().replace(/\s+/g, '');

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, initialBiodata }) => {
  // Saved accounts state
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    try {
      const local = localStorage.getItem('bakumpul_accounts');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_ACCOUNTS;
  });

  // Form State
  // Ingat saya: simpan username & password di perangkat agar login berikutnya terisi otomatis
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  const [usernameInput, setUsernameInput] = useState<string>('30301234');
  const [passwordInput, setPasswordInput] = useState<string>('19850101 201001 1 001');
  const [selectedSchool, setSelectedSchool] = useState<string>('SD HARAPAN BANGSA');
  const [selectedSemester, setSelectedSemester] = useState<string>('Semester 1');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // Registration Form State
  const [regNpsn, setRegNpsn] = useState<string>('');
  const [regNamaSekolah, setRegNamaSekolah] = useState<string>('');
  const [regNamaGuru, setRegNamaGuru] = useState<string>('');
  const [regNipGuru, setRegNipGuru] = useState<string>('');
  const [regAlamat, setRegAlamat] = useState<string>('Jl. Pendidikan No. 12');
  const [regKota, setRegKota] = useState<string>('Batu Bahalang');
  const [regFase, setRegFase] = useState<string>('Fase B');
  const [regKelas, setRegKelas] = useState<string>('Kelas IV A');
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);

  // Simpan / hapus kredensial "Ingat Saya" sesuai centang pengguna
  const persistRememberedLogin = () => {
    try {
      if (rememberMe) {
        localStorage.setItem('bakumpul_remember_me', 'true');
        localStorage.setItem('bakumpul_saved_creds', JSON.stringify({
          username: usernameInput.trim(),
          password: passwordInput.trim()
        }));
      } else {
        localStorage.setItem('bakumpul_remember_me', 'false');
        localStorage.removeItem('bakumpul_saved_creds');
      }
    } catch {
      // fallback
    }
  };

  // Tandai login guru: simpan di localStorage (perangkat ini) + kirim ke server (lintas perangkat).
  const markOnline = (acc: UserAccount) => {
    if (!acc) return;
    markActiveGuruLogin(acc);
    pushGuruLogin(acc);
  };

  // Bersihkan semua data login yang tersimpan di perangkat saat membuka layar login
  useEffect(() => {
    try {
      localStorage.removeItem('bakumpul_accounts');
      localStorage.removeItem('bakumpul_saved_creds');
      localStorage.removeItem('bakumpul_remember_me');
      localStorage.removeItem('bakumpul_active_guru_logins');
      setAccounts(DEFAULT_ACCOUNTS);
    } catch {
      // fallback
    }
  }, []);

  // Pilih akun tersimpan -> pertahankan hak akses masing-masing akun
  const handleQuickLogin = (acc: UserAccount) => {
    setUsernameInput(acc.npsn);
    setPasswordInput(acc.nipGuru);
    setSelectedSchool(acc.namaSekolah);
    setErrorMessage(null);
    const roleDemo = acc.isDemo === true;
    markOnline(acc);
    persistRememberedLogin();
    onLoginSuccess({ ...acc, isDemo: roleDemo }, selectedSemester);
  };

  // Submit Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim().replace(/\s+/g, '');

    // Kunci autentik = NIP/NIK pada password (unik per guru).
    // NPSN hanya penanda sekolah (bisa sama untuk banyak guru),
    // sehingga akun ditentukan oleh NIP/NIK di kolom password.
    const matchedAccount = accounts.find(
      (a) => cleanPass !== '' && cleanNipOf(a.nipGuru) === cleanPass
    );

    if (matchedAccount) {
      // Username harus cocok dengan NPSN/sekolah akun tersebut
      const schoolOk =
        cleanUser === matchedAccount.npsn.trim().toLowerCase() ||
        cleanUser === matchedAccount.namaSekolah.trim().toLowerCase() ||
        matchedAccount.npsn.trim().toLowerCase() === cleanUser ||
        accounts.some(a => a.nipGuru === matchedAccount.nipGuru && a.npsn.trim().toLowerCase() === cleanUser);
      if (schoolOk) {
        const isDemoAcc = matchedAccount.isDemo ?? (DEFAULT_ACCOUNTS.some(d => d.npsn === matchedAccount.npsn));
        markOnline(matchedAccount);
        persistRememberedLogin();
        onLoginSuccess({ ...matchedAccount, isDemo: isDemoAcc }, selectedSemester);
        return;
      }
    }

    // Default fallback check if input matches initial initialBiodata
    if (cleanUser === '30301234' || cleanUser === 'admin' || cleanUser === initialBiodata.namaGuru.toLowerCase()) {
      markOnline(DEFAULT_ACCOUNTS[0]);
      persistRememberedLogin();
      onLoginSuccess({ ...DEFAULT_ACCOUNTS[0], isDemo: true }, selectedSemester);
      return;
    }

    setErrorMessage('Username (NPSN) atau Password (NIP/NIK) tidak sesuai! Silahkan periksa kembali atau lakukan Registrasi.');
  };

  // Registration Submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNpsn || !regNamaSekolah || !regNamaGuru || !regNipGuru) {
      alert('Mohon lengkapi semua bidang isian registrasi!');
      return;
    }

    const newAccount: UserAccount = {
      npsn: regNpsn.trim(),
      namaSekolah: regNamaSekolah.trim(),
      namaGuru: regNamaGuru.trim(),
      nipGuru: regNipGuru.trim(),
      alamat: regAlamat.trim(),
      kota: regKota.trim(),
      fase: regFase,
      kelas: regKelas,
      isDemo: false
    };

    const updated = [newAccount, ...accounts.filter(a => a.npsn !== newAccount.npsn)];
    setAccounts(updated);
    try {
      localStorage.setItem('bakumpul_accounts', JSON.stringify(updated));
    } catch {
      // fallback
    }

    // Otomatis aktifkan "Ingat Saya" agar akun baru langsung tersimpan & terisi di login berikutnya
    try {
      localStorage.setItem('bakumpul_remember_me', 'true');
      localStorage.setItem('bakumpul_saved_creds', JSON.stringify({
        username: newAccount.npsn,
        password: newAccount.nipGuru
      }));
    } catch {
      // fallback
    }
    setRememberMe(true);

    // Auto set to login form
    setUsernameInput(newAccount.npsn);
    setPasswordInput(newAccount.nipGuru);
    setSelectedSchool(newAccount.namaSekolah);
    setRegSuccessMsg(
      'Registrasi Berhasil! Akun telah disimpan & terisi otomatis. Anda sekarang bisa langsung Masuk.'
    );

    setTimeout(() => {
      setShowRegisterModal(false);
      setRegSuccessMsg(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-800 font-sans flex flex-col justify-between selection:bg-indigo-600 selection:text-white">
      
      {/* 1. TOP BLUE / INDIGO NAVIGATION BAR */}
      <header className="bg-indigo-900 text-white border-b border-indigo-800 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between shadow-lg z-20">
        <div className="flex items-center space-x-3">
          <div className="bg-white p-1 rounded-xl font-black flex items-center justify-center shadow-md w-9 h-9 sm:w-10 sm:h-10 shrink-0">
            <img
              src="/image/logo1.png"
              alt="Logo Tut Wuri Handayani"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-base sm:text-lg font-black tracking-wide text-white uppercase">BAKUMPUL SD</span>
              <span className="bg-amber-400 text-indigo-950 text-[10px] font-black px-1.5 py-0.5 rounded tracking-wider">ONLINE</span>
            </div>
            <p className="text-[10px] text-indigo-200 font-medium hidden sm:block">Aplikasi Administrasi & Pelaporan Guru Jenjang SD</p>
          </div>
        </div>

        {/* Right Nav Links */}
        <div className="flex items-center space-x-3 sm:space-x-5 text-xs font-bold text-indigo-100">
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hover:text-white flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-amber-300" />
            <span>Masuk</span>
          </button>

          <button
            onClick={() => setShowRegisterModal(true)}
            disabled
            title="Registrasi dinonaktifkan"
            className="hover:text-white flex items-center space-x-1.5 transition bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/15 opacity-50 cursor-not-allowed"
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-300" />
            <span>Registrasi Akun</span>
          </button>

          <button
            onClick={() => setShowGuideModal(true)}
            className="hover:text-white flex items-center space-x-1.5 transition hidden md:flex cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-amber-300" />
            <span>Panduan Aplikasi</span>
          </button>

          <button
            onClick={() => setShowResetModal(true)}
            className="hover:text-white flex items-center space-x-1.5 transition hidden sm:flex cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-300" />
            <span>Reset Password</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN MIDDLE HERO SPLIT SECTION */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-6 bg-white rounded-3xl shadow-2xl overflow-hidden border border-indigo-900/30">
          
          {/* LEFT GRAPHIC BANNER SECTION (7 COLS ON LARGE) */}
          <div className="lg:col-span-7 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden min-h-[480px]">
            
            {/* BAKUMPUL LANDMARK GERBANG WATERMARK BACKGROUND */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden select-none">
              <img
                src="/image/tanah bumbu.jpg"
                alt="Watermark Gerbang Bakumpul"
                className="w-full h-full object-cover filter contrast-125 brightness-110 mix-blend-overlay"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-950 via-indigo-950/70 to-indigo-900/60"></div>
            </div>

            {/* Logo Aplikasi - pojok kiri atas */}
            <img
              src="/image/logo1.png"
              alt="Logo Bakumpul SD Online"
              className="absolute top-4 left-4 z-20 w-14 h-14 object-contain drop-shadow-xl"
            />

            {/* Decorative Watermark Landmark Motif Accent */}
            <div className="absolute -bottom-10 -right-10 w-96 h-96 rounded-full border-[16px] border-amber-400/10 pointer-events-none z-0"></div>
            <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full border-[12px] border-blue-400/10 pointer-events-none z-0"></div>

            {/* Top Ministry Header */}
            <div className="flex items-start justify-between border-b border-white/15 pb-4 relative z-10 pl-20">
              <div className="flex items-center space-x-3">
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-wide text-white uppercase leading-tight">BAKUMPUL</h3>
                  <p className="text-[10px] sm:text-xs text-indigo-200 font-medium">PENGEMBANG TEKNOLOGI KABUPATEN TANAH BUMBU</p>
                  <p className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">DINAS PENDIDIKAN KABUPATEN TANAH BUMBU</p>
                </div>
              </div>

              <div className="hidden sm:flex flex-col items-end space-y-1">
                <span className="bg-amber-400/90 text-indigo-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  #PENDIDIKAN BERMUTU UNTUK SEMUA
                </span>
                <span className="bg-indigo-950/80 text-amber-200 border border-amber-400/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                  #KEMENDIKDASMEN RAMAH
                </span>
              </div>
            </div>

            {/* Center Graphic Frame - Nama Aplikasi */}
            <div className="my-4 flex flex-col items-center justify-center text-center relative z-10 space-y-4">
              <div className="pt-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider uppercase drop-shadow-md">
                  BAKUMPUL Versi 2026.1
                </h1>
                <p className="text-xs text-indigo-200 mt-1 max-w-md mx-auto">
                  Sistem Informasi Asesmen Diagnosa, KKTP, Buku Nilai, Absensi, dan Jurnal Harian Mengajar SD
                </p>
              </div>
            </div>

            {/* Bottom Social Media Bar */}
            <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-[10px] text-indigo-200 relative z-10">
              <a href="https://ditpsd.kemdikbud.go.id" target="_blank" rel="noreferrer" className="hover:text-amber-300 flex items-center space-x-1 font-medium">
                <Globe className="w-3 h-3 text-amber-400" />
                <span>TIM PENGEBANG "BAKUMPUL"RAFII HAMDI,M.Pd & FAUZI RAMADHANI,M.Pd</span>
              </a>
              <div className="flex items-center space-x-3">
                <span className="flex items-center space-x-1"><Instagram className="w-3 h-3 text-amber-400" /> @RAFI</span>
                <span className="flex items-center space-x-1"><Facebook className="w-3 h-3 text-amber-400" /> @FAUZI</span>
                <span className="flex items-center space-x-1"><Youtube className="w-3 h-3 text-amber-400" /> TRANDING COMUNITY</span>
              </div>
            </div>
          </div>

          {/* RIGHT LOGIN FORM CONTAINER (5 COLS ON LARGE) */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 flex flex-col justify-center">
            
            <>
            {/* Header Login Title */}
            <div className="text-center space-y-1 mb-6">
              <div className="inline-flex items-center space-x-2 text-indigo-900 font-black text-xl uppercase tracking-wider">
                <User className="w-6 h-6 text-indigo-900" />
                <h2>MASUK GURU</h2>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="h-[1px] bg-slate-200 w-12"></div>
                <p className="text-xs text-slate-500 font-semibold">Masukkan NPSN & NIP — guru terdaftar mendapat hak kelola penuh</p>
                <div className="h-[1px] bg-slate-200 w-12"></div>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-4 bg-red-50 border border-red-300 text-red-800 p-3 rounded-xl text-xs font-semibold flex items-start space-x-2 animate-in fade-in">
                <X className="w-4 h-4 text-red-600 shrink-0 mt-0.5 cursor-pointer" onClick={() => setErrorMessage(null)} />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* LOGIN FORM */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {/* Field 1: Username */}
              <div className="flex rounded-lg border border-slate-300 overflow-hidden shadow-xs focus-within:border-indigo-800 focus-within:ring-1 focus-within:ring-indigo-800 transition">
                <div className="bg-slate-100 text-slate-700 font-bold px-3 py-2.5 text-xs border-r border-slate-300 flex items-center min-w-[95px]">
                  Username
                </div>
                <input
                  type="text"
                  required
                  readOnly
                  value={usernameInput}
                  disabled
                  placeholder="Isi dengan NPSN sekolah"
                  className="w-full px-3 py-2.5 text-xs text-slate-900 font-medium focus:outline-none bg-slate-100 cursor-not-allowed"
                />
              </div>

              {/* Field 2: Password */}
              <div className="flex rounded-lg border border-slate-300 overflow-hidden shadow-xs focus-within:border-indigo-800 focus-within:ring-1 focus-within:ring-indigo-800 transition relative">
                <div className="bg-slate-100 text-slate-700 font-bold px-3 py-2.5 text-xs border-r border-slate-300 flex items-center min-w-[95px]">
                  Password
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  readOnly
                  value={passwordInput}
                  disabled
                  placeholder="Ketikkan Kata Sandi / NIP"
                  className="w-full px-3 py-2.5 pr-10 text-xs text-slate-900 font-medium focus:outline-none bg-slate-100 cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  title={showPassword ? "Sembunyikan Password" : "Tampilkan Password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Ingat Saya: simpan username & password */}
              <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setRememberMe(checked);
                    try {
                      localStorage.setItem('bakumpul_remember_me', checked ? 'true' : 'false');
                      if (!checked) localStorage.removeItem('bakumpul_saved_creds');
                    } catch {
                      // fallback
                    }
                  }}
                  className="w-4 h-4 accent-indigo-900 rounded cursor-pointer"
                />
                <span>Ingat Saya — simpan Username &amp; Password untuk login berikutnya</span>
              </label>

              {/* Links Row */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  disabled
                  title="Registrasi dinonaktifkan"
                  className="text-indigo-900 font-bold flex items-center space-x-1 cursor-not-allowed opacity-50"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Belum Memiliki Akun? Registrasi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="text-indigo-700 hover:underline font-semibold cursor-pointer"
                >
                  Lupa Password?
                </button>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                className="w-full bg-indigo-900 hover:bg-indigo-950 text-white font-extrabold text-sm py-3 rounded-xl shadow-lg transition transform active:scale-98 flex items-center justify-center space-x-2 cursor-pointer mt-2"
              >
                <Lock className="w-4 h-4 text-amber-300" />
                <span>Masuk Ke Aplikasi BAKUMPUL</span>
              </button>
            </form>

            {/* Akun Demo (klik cepat) */}
            <div className="mt-5 p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-indigo-950 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Akun Demo (Klik untuk Masuk)</span>
                </span>
                <span className="text-[10px] bg-blue-200 text-indigo-950 font-black px-1.5 py-0.5 rounded">Demo</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {accounts.filter(a => a.isDemo === true).map((acc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickLogin(acc)}
                    className="w-full text-left bg-white hover:bg-blue-100/80 p-2 rounded-lg border border-blue-200 transition flex items-center justify-between text-[11px] cursor-pointer group"
                  >
                    <div>
                      <p className="font-bold text-slate-800 group-hover:text-indigo-900">{acc.namaGuru}</p>
                      <p className="text-[10px] text-slate-500">{acc.namaSekolah} | NPSN: <span className="font-mono font-bold text-slate-700">{acc.npsn}</span></p>
                    </div>
                    <span className="text-[10px] font-extrabold bg-amber-400 text-indigo-950 px-2 py-1 rounded-md transition shrink-0 shadow-xs">
                      Demo
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 italic">Bagian ini hanya menampilkan akun demo. Guru terdaftar masuk lewat form NPSN &amp; NIP di atasnya.</p>
            </div>

            {/* Footer Divider Text */}
            <div className="text-center mt-4">
              <p className="text-[11px] text-slate-400 font-medium">— Isi User & Password dengan benar —</p>
            </div>
            </>
          </div>
        </div>
      </main>

      {/* 3. BOTTOM FOOTER BAR */}
      <footer className="bg-indigo-950 text-indigo-200 text-center py-3 text-xs font-semibold border-t border-indigo-900">
        <p>Aplikasi BAKUMPUL Administrasi & Pelaporan Guru SD | Versi 2026.1 @TIM PENGEMBANG TEKNOLOGI KABUPATEN TANAH BUMBU</p>
      </footer>

      {/* REGISTRATION MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-[300] animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative">
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 text-indigo-900">
              <div className="p-2.5 bg-blue-100 rounded-xl">
                <UserPlus className="w-6 h-6 text-indigo-900" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase">Registrasi Akun Baru</h3>
                <p className="text-xs text-slate-500">Daftarkan NPSN dan NIP/NIK untuk mengakses aplikasi BAKUMPUL</p>
              </div>
            </div>

            {regSuccessMsg ? (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-xl text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{regSuccessMsg}</span>
              </div>
            ) : (
              <>
              <form onSubmit={handleRegisterSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NPSN Sekolah <span className="text-indigo-800">* (Username Login)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regNpsn}
                    onChange={(e) => setRegNpsn(e.target.value)}
                    placeholder="Contoh: 69958210"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Sekolah <span className="text-indigo-800">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regNamaSekolah}
                    onChange={(e) => setRegNamaSekolah(e.target.value)}
                    placeholder="Contoh: SD NEGERI BAKUMPUL"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap Guru (dengan Gelar) <span className="text-indigo-800">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regNamaGuru}
                    onChange={(e) => setRegNamaGuru(e.target.value)}
                    placeholder="Contoh: AHMAD MUJAHID, S.PD."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIP / NIK Guru <span className="text-indigo-800">* (Password Login)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regNipGuru}
                    onChange={(e) => setRegNipGuru(e.target.value)}
                    placeholder="Contoh: 19900202 201502 1 002"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-800 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Sekolah</label>
                    <input
                      type="text"
                      value={regAlamat}
                      onChange={(e) => setRegAlamat(e.target.value)}
                      placeholder="Jl. Pendidikan No. 12"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kabupaten / Kota</label>
                    <input
                      type="text"
                      value={regKota}
                      onChange={(e) => setRegKota(e.target.value)}
                      placeholder="Batu Bahalang"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Fase</label>
                      <select
                        value={regFase}
                        onChange={(e) => setRegFase(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-800 focus:outline-none"
                      >
                        <option value="Fase A">Fase A</option>
                        <option value="Fase B">Fase B</option>
                        <option value="Fase C">Fase C</option>
                        <option value="Fase D">Fase D</option>
                        <option value="Fase E">Fase E</option>
                        <option value="Fase F">Fase F</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Kelas</label>
                      <input
                        type="text"
                        value={regKelas}
                        onChange={(e) => setRegKelas(e.target.value)}
                        placeholder="Kelas IV A"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-800 focus:outline-none"
                      />
                    </div>
                  </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-900 hover:bg-indigo-950 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    Simpan & Buat Akun
                  </button>
                </div>
              </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-[300] animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative">
            <button
              onClick={() => setShowResetModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 text-indigo-900">
              <div className="p-2.5 bg-blue-100 rounded-xl">
                <KeyRound className="w-6 h-6 text-indigo-900" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase">Lupa / Reset Password</h3>
                <p className="text-xs text-slate-500">Petunjuk Pemulihan Akun Guru BAKUMPUL</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-900">Ketentuan Password Standar:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li><strong className="text-slate-900">Username default:</strong> Nomor NPSN Sekolah Anda (contoh: 69958210).</li>
                <li><strong className="text-slate-900">Password default:</strong> Nomor NIP atau NIK Guru yang terdaftar (contoh: 19900202 201502 1 002).</li>
              </ul>
              <p className="text-[11px] text-slate-500 italic mt-2">
                Jika Anda tetap tidak bisa masuk, Anda dapat mendaftarkan ulang akun sekolah melalui menu <strong>Registrasi Akun</strong>.
              </p>
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-5 py-2 bg-indigo-900 text-white font-bold text-xs rounded-xl hover:bg-indigo-950 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PANDUAN MODAL */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-[300] animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 text-indigo-900">
              <div className="p-2.5 bg-blue-100 rounded-xl">
                <FileText className="w-6 h-6 text-indigo-900" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase">Panduan Penggunaan BAKUMPUL</h3>
                <p className="text-xs text-slate-500">Langkah-langkah penggunaan aplikasi untuk guru SD</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed max-h-80 overflow-y-auto pr-1">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <h4 className="font-bold text-amber-900 mb-1">1. Cara Login Guru:</h4>
                <p>Masukkan NPSN sekolah sebagai Username dan NIP/NIK guru sebagai Password, pilih Sekolah dan Semester aktif, lalu klik tombol <strong>Masuk</strong>.</p>
              </div>

              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-1">2. Fitur Utama Terintegrasi:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Biodata Sekolah & Guru:</strong> Pengaturan identitas dan logo sekolah.</li>
                  <li><strong>Asesmen Diagnosa:</strong> Pemetaan kelompok belajar peserta didik (90, 80, 70, 60).</li>
                  <li><strong>Hitung KKTP:</strong> Perhitungan Kriteria Ketercapaian Tujuan Pembelajaran otomatis.</li>
                  <li><strong>Buku Nilai & BAKUMPUL:</strong> Rekapitulasi nilai formatif & sumatif per mata pelajaran.</li>
                  <li><strong>Absensi & Jurnal Mengajar:</strong> Pencatatan kehadiran dan jurnal harian 1 lembar PDF.</li>
                </ul>
              </div>
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2 bg-indigo-900 text-white font-bold text-xs rounded-xl hover:bg-indigo-950 cursor-pointer"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
