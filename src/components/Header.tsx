import React, { useState } from 'react';
import { MainTab, Biodata } from '../types';
import { UserAccount } from './LoginScreen';
import {
  GraduationCap,
  Building2,
  BarChart3,
  FileSpreadsheet,
  BookMarked,
  CalendarCheck,
  NotebookPen,
  ChevronDown,
  X,
  LogOut,
  UserCheck,
  Lock
} from 'lucide-react';

interface HeaderProps {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  biodata: Biodata;
  onLogout?: () => void;
  currentUser?: UserAccount | null;
  activeSemester?: string;
  isDemo?: boolean;
}

const NAV_ITEMS: { id: MainTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'biodata', label: 'Biodata Sekolah', icon: Building2 },
  { id: 'diagnosa', label: 'Asesmen Diagnosa', icon: BarChart3 },
  { id: 'kktp', label: 'Hitung KKTP', icon: FileSpreadsheet },
  { id: 'bukunilai', label: 'Buku Nilai', icon: BookMarked },
  { id: 'absensi', label: 'Absensi', icon: CalendarCheck },
  { id: 'rpm', label: 'RPM', icon: FileSpreadsheet },
  { id: 'jurnal', label: 'Jurnal Mengajar', icon: NotebookPen },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  biodata,
  onLogout,
  currentUser,
  activeSemester,
  isDemo
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeItem = NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];
  const ActiveIcon = activeItem.icon;

  const handleSelectTab = (tab: MainTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-indigo-900 text-white shadow-md no-print sticky top-0 z-50">
      {/* DEMO MODE BANNER */}
      {isDemo && (
        <div className="bg-amber-400 text-indigo-950 px-3 py-1.5 text-xs font-bold shadow-md border-b border-amber-500 z-50">
          <div className="max-w-7xl mx-auto w-full flex flex-wrap items-center justify-between gap-1">
            <div className="flex items-center space-x-2">
              <span className="bg-indigo-950 text-amber-300 text-[10px] uppercase font-black px-2 py-0.5 rounded tracking-wide shrink-0">
                MODE DEMO INSTAN
              </span>
              <span className="font-semibold text-slate-900 text-[11px] sm:text-xs">
                Anda dapat melihat seluruh tampilan & menu aplikasi. Pengeditan dan penyimpanan data dikunci.
              </span>
            </div>
            <span className="text-[10px] font-black text-indigo-950 bg-amber-200/90 px-2 py-0.5 rounded border border-amber-600/40 flex items-center space-x-1 shrink-0">
              <Lock className="w-3 h-3 text-indigo-950" />
              <span>Hanya Lihat (Read-Only)</span>
            </span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div id="nav-logo-container" className="bg-white p-1 rounded-xl font-bold w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shadow-md overflow-hidden shrink-0 border border-indigo-200">
              {biodata.logo ? (
                <img src={biodata.logo} className="w-full h-full object-contain" alt="Logo" />
              ) : (
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_Tut_Wuri_Handayani.png/800px-Logo_Tut_Wuri_Handayani.png" className="w-full h-full object-contain" alt="Logo Tut Wuri Handayani" />
              )}
            </div>
            <div>
              <h1 id="header-web-title" className="text-sm sm:text-lg font-extrabold tracking-wider text-white uppercase leading-tight">
                BAKUMPUL
              </h1>
              <p className="text-[9px] sm:text-xs text-indigo-200 font-medium line-clamp-1">
                Buku Asesmen, Kurikulum (KKTP), Penilaian & Ulangan
              </p>
            </div>
          </div>

          {/* Desktop Navigation (lg screens and up) */}
          <nav className="hidden lg:flex items-center space-x-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center space-x-1.5 cursor-pointer ${
                    isActive ? 'bg-indigo-800 text-white font-bold shadow-xs' : 'text-indigo-100 hover:bg-indigo-800/80 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-amber-300" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Teacher User Profile Badge & Logout */}
          <div className="flex items-center space-x-2">
            {currentUser && (
              <div className="hidden sm:flex flex-col items-end text-right mr-1 text-[11px]">
                <div className="font-extrabold text-amber-300 flex items-center space-x-1">
                  <UserCheck className="w-3 h-3 text-amber-400" />
                  <span>{currentUser.namaGuru}</span>
                </div>
                <div className="text-[10px] text-indigo-200 font-medium">
                  {currentUser.namaSekolah} {activeSemester ? `(${activeSemester})` : ''}
                </div>
              </div>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                title="Keluar / Logout Aplikasi"
                className="bg-red-800/90 hover:bg-red-700 text-white border border-red-700/80 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-sm cursor-pointer active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden md:inline">Keluar</span>
              </button>
            )}

            {/* Mobile Dropdown Toggle Button (below lg screens) */}
            <div className="lg:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="bg-indigo-800 hover:bg-indigo-700 border border-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center space-x-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                aria-label="Pilih Menu"
              >
                <ActiveIcon className="w-4 h-4 text-amber-400" />
                <span className="max-w-[100px] sm:max-w-none truncate text-amber-200">{activeItem.label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 text-slate-300 ${mobileMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Panel */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-indigo-950 border-t border-indigo-800/80 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="max-w-7xl mx-auto px-3 py-3 space-y-1">
            <div className="px-3 py-1 text-[10px] font-black uppercase text-indigo-400 tracking-wider flex justify-between items-center">
              <span>Pilih Menu Utama</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-between transition-all ${
                    isActive ? 'bg-indigo-800 text-white' : 'text-indigo-100 hover:bg-indigo-900/90 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 text-indigo-300" />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

