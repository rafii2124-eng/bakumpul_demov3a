import React from 'react';
import { Biodata } from '../types';
import { Building2, School, Users, Image, UploadCloud, X, Lock } from 'lucide-react';

interface BiodataTabProps {
  biodata: Biodata;
  setBiodata: React.Dispatch<React.SetStateAction<Biodata>>;
  showToast: (msg: string) => void;
  isDemo?: boolean;
}

export const BiodataTab: React.FC<BiodataTabProps> = ({ biodata, setBiodata, showToast, isDemo }) => {
  const handleChange = (field: keyof Biodata, value: string) => {
    if (isDemo) {
      showToast("🔒 Mode Demo: Anda hanya dapat melihat tampilan biodata tanpa mengedit.");
      return;
    }
    setBiodata(prev => {
      const updated = { ...prev, [field]: value };
      return updated;
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDemo) {
      showToast("🔒 Mode Demo: Pengunggahan logo dikunci.");
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        setBiodata(prev => ({ ...prev, logo: result }));
        showToast("Logo sekolah berhasil diunggah.");
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDemo) {
      showToast("🔒 Mode Demo: Pengeditan logo dikunci.");
      return;
    }
    setBiodata(prev => ({ ...prev, logo: null }));
    showToast("Logo sekolah dihapus.");
  };

  return (
    <div id="tab-biodata" className="tab-content space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-indigo-100 text-indigo-800 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Biodata Satuan Pendidikan & Guru</h2>
            <p className="text-xs text-slate-500">Isi data dasar sekolah dan guru untuk disinkronkan langsung ke lembar laporan, KKTP & Buku Nilai.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Profil Sekolah */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 space-y-4">
            <h3 className="text-sm font-bold text-indigo-900 flex items-center space-x-2 border-b border-slate-200 pb-2">
              <School className="w-4 h-4" />
              <span>Profil Sekolah</span>
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Nama Sekolah</label>
              <input
                type="text"
                value={biodata.namaSekolah}
                onChange={(e) => handleChange('namaSekolah', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">NPSN Sekolah</label>
              <input
                type="text"
                value={biodata.npsn || ''}
                onChange={(e) => handleChange('npsn', e.target.value)}
                placeholder="Contoh: 69958210"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Alamat Sekolah</label>
              <textarea
                rows={2}
                value={biodata.alamat}
                onChange={(e) => handleChange('alamat', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Kabupaten / Kota Tanda Tangan</label>
              <input
                type="text"
                value={biodata.kota}
                onChange={(e) => handleChange('kota', e.target.value)}
                placeholder="Contoh: Kota Banjarmasin"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Desa</label>
              <input
                type="text"
                value={biodata.desa || ''}
                onChange={(e) => handleChange('desa', e.target.value)}
                placeholder="Contoh: Batu Bahalang"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Kecamatan</label>
              <input
                type="text"
                value={biodata.kecamatan || ''}
                onChange={(e) => handleChange('kecamatan', e.target.value)}
                placeholder="Contoh: Labuhan Amas Selatan"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Fase, Kelas & Semester</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <select
                    value={biodata.fase}
                    onChange={(e) => handleChange('fase', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700"
                  >
                    <option value="Fase A">Fase A</option>
                    <option value="Fase B">Fase B</option>
                    <option value="Fase C">Fase C</option>
                  </select>
                </div>
                <div>
                  <input
                    type="text"
                    value={biodata.kelas}
                    onChange={(e) => handleChange('kelas', e.target.value)}
                    placeholder="Kelas"
                    className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 text-xs text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={biodata.semester}
                    onChange={(e) => handleChange('semester', e.target.value)}
                    placeholder="Smt"
                    className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 text-xs text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Personalia */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 space-y-4">
            <h3 className="text-sm font-bold text-indigo-900 flex items-center space-x-2 border-b border-slate-200 pb-2">
              <Users className="w-4 h-4" />
              <span>Pimpinan & Tenaga Pendidik</span>
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Nama Kepala Sekolah</label>
              <input
                type="text"
                value={biodata.namaKepsek}
                onChange={(e) => handleChange('namaKepsek', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">NIP Kepala Sekolah</label>
              <input
                type="text"
                value={biodata.nipKepsek}
                onChange={(e) => handleChange('nipKepsek', e.target.value)}
                placeholder="NIP. ..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="border-t border-slate-200 pt-3">
              <label className="block text-xs font-bold text-slate-500 mb-1">Nama Guru Kelas</label>
              <input
                type="text"
                value={biodata.namaGuru}
                onChange={(e) => handleChange('namaGuru', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">NIP Guru Kelas</label>
              <input
                type="text"
                value={biodata.nipGuru}
                onChange={(e) => handleChange('nipGuru', e.target.value)}
                placeholder="NIP. ..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Upload Logo */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-indigo-900 flex items-center space-x-2 border-b border-slate-200 pb-2">
                <Image className="w-4 h-4" />
                <span>Logo / Lambang Sekolah</span>
              </h3>
              <p className="text-[11px] text-slate-500">Unggah berkas PNG/JPG logo sekolah Anda untuk dicantumkan di kop laporan.</p>

              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-white rounded-xl p-4 transition text-center cursor-pointer relative group flex flex-col items-center justify-center min-h-[140px]">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                />
                {!biodata.logo ? (
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-full group-hover:bg-indigo-100 transition">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold text-slate-600">Klik atau seret file logo</span>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-white p-2 flex items-center justify-center rounded-xl">
                    <img src={biodata.logo} className="max-h-[120px] object-contain" alt="Lambang Sekolah" />
                    <button
                      onClick={removeLogo}
                      className="absolute top-2 right-2 p-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-full shadow-md z-20 cursor-pointer"
                      title="Hapus Logo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-indigo-900 text-white rounded-xl p-4 space-y-1.5 shadow-md">
              <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Status Sinkronisasi</h4>
              <p className="text-xs font-medium leading-relaxed">Nama Guru dan Lambang Sekolah siap dihubungkan otomatis ke tanda tangan KKTP & Buku Nilai.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
