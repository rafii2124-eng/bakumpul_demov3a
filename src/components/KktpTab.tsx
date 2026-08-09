import React from 'react';
import { Biodata, KKTPRow } from '../types';
import { Settings, FileUp, Database, Printer, Lightbulb, RefreshCw, PlusCircle, RotateCcw, Trash2 } from 'lucide-react';

interface KktpTabProps {
  biodata: Biodata;
  subject: string;
  setSubject: (sub: string) => void;
  lockedTargets: Record<string, number>;
  setLockedTargets: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  activeKKTPROws: KKTPRow[];
  setActiveKKTPROws: React.Dispatch<React.SetStateAction<KKTPRow[]>>;
  defaultSubjectData?: Record<string, Record<string, string[]>>;
  setDefaultSubjectData?: React.Dispatch<React.SetStateAction<Record<string, Record<string, string[]>>>>;
  openCPBankModal: () => void;
  openUploadExcelModal: () => void;
  triggerPrint: (mode: 'diagnosa' | 'kktp' | 'bukunilai') => void;
  resetToDefaultData: () => void;
  showToast: (msg: string) => void;
  isDemo?: boolean;
}

export const KktpTab: React.FC<KktpTabProps> = ({
  biodata,
  subject,
  setSubject,
  lockedTargets,
  setLockedTargets,
  activeKKTPROws,
  setActiveKKTPROws,
  defaultSubjectData,
  setDefaultSubjectData,
  openCPBankModal,
  openUploadExcelModal,
  triggerPrint,
  resetToDefaultData,
  showToast,
  isDemo
}) => {
  const currentTarget = lockedTargets[subject] || 75.0;

  const totalWeight = activeKKTPROws.reduce((acc, row) => acc + row.score, 0);
  const avgScoreNum = activeKKTPROws.length > 0 ? (totalWeight / (activeKKTPROws.length * 4)) * 100 : 0;
  const avgScoreStr = avgScoreNum.toFixed(2);
  const isTuntas = avgScoreNum >= currentTarget;

  const updateRowScore = (index: number, score: number) => {
    if (isDemo) {
      showToast("🔒 Mode Demo: Pengeditan bobot KKTP dikunci dalam mode lihat saja.");
      return;
    }
    setActiveKKTPROws(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], score };
      return updated;
    });
  };

  const updateRowCP = (index: number, newCp: string) => {
    if (isDemo) {
      showToast("🔒 Mode Demo: Pengeditan Tujuan Pembelajaran dikunci.");
      return;
    }
    setActiveKKTPROws(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], cp: newCp };
      
      if (setDefaultSubjectData) {
        setDefaultSubjectData(dPrev => {
          const faseData = { ...(dPrev[biodata.fase] || {}) };
          faseData[subject] = updated.map(r => r.cp);
          return { ...dPrev, [biodata.fase]: faseData };
        });
      }

      return updated;
    });
  };

  const deleteRow = (index: number) => {
    if (isDemo) {
      showToast("🔒 Mode Demo: Penghapusan baris TP dikunci.");
      return;
    }
    setActiveKKTPROws(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (setDefaultSubjectData) {
        setDefaultSubjectData(dPrev => {
          const faseData = { ...(dPrev[biodata.fase] || {}) };
          faseData[subject] = updated.map(r => r.cp);
          return { ...dPrev, [biodata.fase]: faseData };
        });
      }
      return updated;
    });
    showToast("Baris Tujuan Pembelajaran dihapus.");
  };

  const addNewRow = () => {
    if (isDemo) {
      showToast("🔒 Mode Demo: Penambahan baris TP dikunci.");
      return;
    }
    const newCpText = `Tujuan Pembelajaran baru matpel ${subject}...`;
    setActiveKKTPROws(prev => {
      const updated = [
        ...prev,
        {
          id: Date.now(),
          subject,
          cp: newCpText,
          score: 3
        }
      ];

      if (setDefaultSubjectData) {
        setDefaultSubjectData(dPrev => {
          const faseData = { ...(dPrev[biodata.fase] || {}) };
          faseData[subject] = updated.map(r => r.cp);
          return { ...dPrev, [biodata.fase]: faseData };
        });
      }

      return updated;
    });
    showToast("Tujuan Pembelajaran baru ditambahkan & terhubung ke Jurnal Mengajar.");
  };

  const applyDiagnosticRecommendation = () => {
    showToast(`Target ketuntasan ${subject} diselaraskan ke ${currentTarget.toFixed(1)}`);
  };

  return (
    <div id="tab-kktp" className="tab-content space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 no-print space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 flex-1">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Evaluasi Pembelajaran & Ambang Batas Ketuntasan</h2>
              <p className="text-xs text-slate-500">Perhatikan rujukan sebaran diagnosa, dan isi kriteria rubrik.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={openUploadExcelModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <FileUp className="w-4 h-4" />
              <span>Import Excel</span>
            </button>
            <button
              onClick={openCPBankModal}
              className="bg-amber-500 hover:bg-amber-600 text-indigo-950 font-bold px-4 py-2.5 rounded-xl text-sm flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <Database className="w-4 h-4" />
              <span>Kelola Bank CP</span>
            </button>
            <button
              onClick={() => triggerPrint('kktp')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Dokumen KKTP</span>
            </button>
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-indigo-600 text-white rounded-lg mt-0.5">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">Referensi Batas Ketuntasan dari Diagnosa</h4>
              <p className="text-xs text-indigo-800 mt-0.5 font-medium">
                Target ketuntasan terhubung untuk matpel {subject} dikunci pada nilai {currentTarget.toFixed(1)}.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <span className="text-xs font-bold text-indigo-900 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
              <span>Rata-rata Diagnosa:</span>
              <strong className="text-indigo-950 text-sm font-black">{currentTarget.toFixed(1)}</strong>
            </span>
            <button
              onClick={applyDiagnosticRecommendation}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Terapkan Target</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Mata Pelajaran</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700"
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
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Fase, Kelas & Semester</label>
            <div className="grid grid-cols-3 gap-1">
              <input type="text" readOnly value={biodata.fase} className="w-full bg-indigo-50 border border-indigo-200 rounded-xl px-1.5 py-2 text-xs text-center font-bold text-indigo-900" />
              <input type="text" readOnly value={biodata.kelas} className="w-full bg-indigo-50 border border-indigo-200 rounded-xl px-1.5 py-2 text-xs text-center font-bold text-indigo-900" />
              <input type="text" readOnly value={biodata.semester} className="w-full bg-indigo-50 border border-indigo-200 rounded-xl px-1.5 py-2 text-xs text-center font-bold text-indigo-900" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Ambang Batas Ketuntasan Target</label>
            <input
              type="number"
              readOnly
              value={currentTarget}
              className="w-full bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2 text-sm font-black text-center text-rose-600"
            />
          </div>
        </div>
      </div>

      {/* DOCUMENT KKTP VIEW */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-lg border border-slate-200 print-card">
        <div className="flex justify-between items-start mb-8 relative border-b-2 border-slate-800 pb-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center space-x-4 mb-4">
              {biodata.logo && <img src={biodata.logo} className="print-kop-logo max-h-16 object-contain" alt="Logo" />}
              <div>
                <h2 className="text-lg font-bold tracking-wider text-slate-900 uppercase underline text-left leading-tight">
                  KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-1.5 text-xs font-semibold text-slate-800 pt-2">
              <div className="flex"><span className="w-32">Nama Sekolah</span><span className="mr-2">:</span><span className="border-b border-dashed border-slate-400 pb-0.5 flex-1 print-text-school">{biodata.namaSekolah}</span></div>
              <div className="flex"><span className="w-32">Mata Pelajaran</span><span className="mr-2">:</span><span className="border-b border-dashed border-slate-400 pb-0.5 flex-1 font-bold">{subject}</span></div>
              <div className="flex"><span className="w-32">Fase / Kelas</span><span className="mr-2">:</span><span className="border-b border-dashed border-slate-400 pb-0.5 flex-1 print-text-fase font-bold">{biodata.fase} / {biodata.kelas}</span></div>
              <div className="flex text-rose-700"><span className="w-32">Target Minimum</span><span className="mr-2">:</span><span className="border-b border-dashed border-rose-300 pb-0.5 flex-1 font-extrabold">{currentTarget.toFixed(1)}</span></div>
            </div>
          </div>

          <div id="target-badge-container" className="flex items-center border-4 border-emerald-600 rounded-xl overflow-hidden shadow-md shrink-0 bg-white scale-90 sm:scale-100 ml-4">
            <div className="bg-emerald-50 text-emerald-900 font-extrabold px-4 py-3 text-sm tracking-wider uppercase border-r-2 border-emerald-600">
              KKTP CAPAIAN
            </div>
            <div className="bg-white text-emerald-950 font-black px-6 py-2 text-2xl">
              {avgScoreStr}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-2 border-slate-800 text-xs sm:text-sm text-slate-900 font-medium">
            <thead>
              <tr className="bg-[#B5D3E7] text-slate-900 border-b-2 border-slate-800">
                <th className="border-r-2 border-slate-800 px-3 py-4 text-center w-12 font-extrabold">NO</th>
                <th className="border-r-2 border-slate-800 px-3 py-4 text-center w-28 font-extrabold">MATPEL</th>
                <th className="border-r-2 border-slate-800 px-4 py-4 text-left font-extrabold">CAPAIAN PEMBELAJARAN (CP)</th>
                <th colSpan={4} className="px-2 py-2 text-center font-extrabold border-slate-800">DESKRIPSI KRITERIA</th>
              </tr>
              <tr className="bg-[#B5D3E7] text-slate-900 border-b-2 border-slate-800 text-xs">
                <th colSpan={3} className="border-r-2 border-slate-800"></th>
                <th className="border-r border-slate-800 px-2 py-2 text-center w-20">Belum Muncul</th>
                <th className="border-r border-slate-800 px-2 py-2 text-center w-24">Sebagian Kecil</th>
                <th className="border-r border-slate-800 px-2 py-2 text-center w-24">Sebagian Besar</th>
                <th className="px-2 py-2 text-center w-24">Keseluruhan</th>
              </tr>
              <tr className="bg-[#FFCC99] text-slate-950 font-bold border-b-2 border-slate-800">
                <td colSpan={3} className="border-r-2 border-slate-800 px-4 py-2 text-right tracking-widest font-extrabold">BOBOT</td>
                <td className="border-r border-slate-800 text-center py-2 font-black">1</td>
                <td className="border-r border-slate-800 text-center py-2 font-black">2</td>
                <td className="border-r border-slate-800 text-center py-2 font-black">3</td>
                <td className="text-center py-2 font-black">4</td>
              </tr>
            </thead>
            <tbody>
              {activeKKTPROws.map((row, index) => (
                <tr key={row.id || index} className="border-b border-slate-700 hover:bg-slate-50">
                  <td className="text-center font-bold px-2 py-3 border-r border-slate-800">{index + 1}</td>
                  <td className="text-center font-semibold px-2 py-3 border-r border-slate-800">{row.subject}</td>
                  <td className="px-3 py-2 border-r border-slate-800 text-xs relative group">
                    <div className="flex items-start space-x-2">
                      <textarea
                        rows={2}
                        value={row.cp}
                        onChange={(e) => updateRowCP(index, e.target.value)}
                        className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-lg p-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-400/50 transition resize-y no-print"
                        placeholder="Tuliskan Capaian / Tujuan Pembelajaran..."
                      />
                      <button
                        type="button"
                        onClick={() => deleteRow(index)}
                        className="no-print p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0 cursor-pointer"
                        title="Hapus Tujuan Pembelajaran ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="hidden print:inline">{row.cp}</span>
                  </td>
                  <td className="text-center border-r border-slate-800">
                    <input
                      type="radio"
                      name={`rubrik-${index}`}
                      checked={row.score === 1}
                      onChange={() => updateRowScore(index, 1)}
                    />
                  </td>
                  <td className="text-center border-r border-slate-800">
                    <input
                      type="radio"
                      name={`rubrik-${index}`}
                      checked={row.score === 2}
                      onChange={() => updateRowScore(index, 2)}
                    />
                  </td>
                  <td className="text-center border-r border-slate-800">
                    <input
                      type="radio"
                      name={`rubrik-${index}`}
                      checked={row.score === 3}
                      onChange={() => updateRowScore(index, 3)}
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="radio"
                      name={`rubrik-${index}`}
                      checked={row.score === 4}
                      onChange={() => updateRowScore(index, 4)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-800 font-bold">
                <td colSpan={3} className="border-r-2 border-slate-800 px-4 py-4 text-right text-sm">NILAI RATA-RATA EVALUASI KKTP:</td>
                <td colSpan={4} className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center space-x-3">
                    <span className="text-xl font-extrabold text-slate-900">{avgScoreStr}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      isTuntas ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {isTuntas ? 'TUNTAS KKTP' : 'BELUM TUNTAS'}
                    </span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-6 mb-6 p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-wrap gap-3 no-print justify-between items-center">
          <button
            onClick={addNewRow}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition border border-indigo-200 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah Baris Baru</span>
          </button>
          <button
            onClick={resetToDefaultData}
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition border border-rose-200 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Atur Ulang Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
