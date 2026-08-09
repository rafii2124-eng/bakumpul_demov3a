import React, { useState } from 'react';
import { Biodata } from '../types';
import * as XLSX from 'xlsx';
import { Database, X, FileUp, Upload } from 'lucide-react';

interface ModalsProps {
  biodata: Biodata;
  subject: string;
  defaultSubjectData: Record<string, Record<string, string[]>>;
  setDefaultSubjectData: React.Dispatch<React.SetStateAction<Record<string, Record<string, string[]>>>>;
  showCPBankModal: boolean;
  closeCPBankModal: () => void;
  showUploadExcelModal: boolean;
  closeUploadExcelModal: () => void;
  showLightboxModal: boolean;
  lightboxImgSrc: string;
  closeLightboxModal: () => void;
  showToast: (msg: string) => void;
  loadSubjectData: () => void;
  isDemo?: boolean;
}

export const Modals: React.FC<ModalsProps> = ({
  biodata,
  subject,
  defaultSubjectData,
  setDefaultSubjectData,
  showCPBankModal,
  closeCPBankModal,
  showUploadExcelModal,
  closeUploadExcelModal,
  showLightboxModal,
  lightboxImgSrc,
  closeLightboxModal,
  showToast,
  loadSubjectData,
  isDemo
}) => {
  const [newCPText, setNewCPText] = useState("");
  const [tempCPList, setTempCPList] = useState<string[]>([]);

  // CP Bank handlers
  const currentCPs = (defaultSubjectData[biodata.fase] && defaultSubjectData[biodata.fase][subject]) || [];

  const handleCPTextChange = (index: number, val: string) => {
    if (isDemo) {
      showToast("🔒 Mode Demo: Pengeditan Bank CP dikunci.");
      return;
    }
    setDefaultSubjectData(prev => {
      const faseData = { ...(prev[biodata.fase] || {}) };
      const subData = [...(faseData[subject] || [])];
      subData[index] = val;
      faseData[subject] = subData;
      return { ...prev, [biodata.fase]: faseData };
    });
  };

  const addNewCPToBank = () => {
    if (isDemo) {
      showToast("🔒 Mode Demo: Penambahan CP dikunci.");
      return;
    }
    if (!newCPText.trim()) return;
    setDefaultSubjectData(prev => {
      const faseData = { ...(prev[biodata.fase] || {}) };
      const subData = [...(faseData[subject] || [])];
      subData.push(newCPText.trim());
      faseData[subject] = subData;
      return { ...prev, [biodata.fase]: faseData };
    });
    setNewCPText("");
    showToast("Capaian Pembelajaran baru ditambahkan.");
  };

  const applyCPBankChanges = () => {
    closeCPBankModal();
    loadSubjectData();
    showToast("Bank CP diperbarui & diterapkan ke tabel.");
  };

  // CP Excel Import handlers
  const downloadExcelTemplate = () => {
    const data = [
      { "Capaian Pembelajaran": "Peserta didik dapat memahami Pancasila sebagai pandangan hidup." },
      { "Capaian Pembelajaran": "Peserta didik dapat menceritakan penerapan norma di sekolah." }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Templat CP");
    XLSX.writeFile(wb, "Templat_Capaian_Pembelajaran.xlsx");
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheet];
      const json: any[] = XLSX.utils.sheet_to_json(worksheet);

      const parsedCPList = json
        .map(row => row["Capaian Pembelajaran"] || row["CP"] || Object.values(row)[0])
        .filter(Boolean) as string[];

      setTempCPList(parsedCPList);
    };
    reader.readAsArrayBuffer(file);
  };

  const applyExcelImport = () => {
    if (isDemo) {
      showToast("🔒 Mode Demo: Impor CP dari Excel dikunci.");
      return;
    }
    if (tempCPList.length > 0) {
      setDefaultSubjectData(prev => {
        const faseData = { ...(prev[biodata.fase] || {}) };
        faseData[subject] = tempCPList;
        return { ...prev, [biodata.fase]: faseData };
      });
      closeUploadExcelModal();
      loadSubjectData();
      showToast("Import CP dari Excel berhasil diterapkan!");
    }
  };

  return (
    <>
      {/* MODAL BANK CP */}
      {showCPBankModal && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 transition-all duration-300 no-print">
          <div className="bg-white max-w-4xl w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-indigo-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-850 text-amber-400 rounded-lg">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Pustaka Bank Data Capaian Pembelajaran (CP)</h3>
                  <p className="text-xs text-indigo-200">Kelola atau tambahkan data CP bawaan yang disimpan dalam aplikasi</p>
                </div>
              </div>
              <button onClick={closeCPBankModal} className="p-1.5 hover:bg-white/10 text-white rounded-lg transition cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50">
              <div className="space-y-3">
                {currentCPs.map((cp, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                    <span className="font-bold text-xs text-indigo-900">{idx + 1}.</span>
                    <input
                      type="text"
                      value={cp}
                      onChange={(e) => handleCPTextChange(idx, e.target.value)}
                      className="flex-1 text-xs font-medium text-slate-800 bg-transparent focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 border-t border-slate-200 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCPText}
                  onChange={(e) => setNewCPText(e.target.value)}
                  placeholder="Tuliskan Capaian Pembelajaran baru di sini..."
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={addNewCPToBank} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer">
                  <span>Simpan ke Bank Data</span>
                </button>
              </div>
              <div className="flex justify-end pt-1">
                <button onClick={applyCPBankChanges} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer">
                  <span>Selesai & Terapkan ke Tabel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IMPORT EXCEL FORMAT F_NILAI */}
      {/* MODAL EXCEL IMPORT CP */}
      {showUploadExcelModal && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 transition-all duration-300 no-print">
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-800 text-emerald-200 rounded-lg">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Import Capaian Pembelajaran dari Excel</h3>
                  <p className="text-xs text-emerald-100">Unggah berkas templat CP untuk memuatnya secara instan</p>
                </div>
              </div>
              <button onClick={closeUploadExcelModal} className="p-1.5 hover:bg-white/10 text-white rounded-lg transition cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50">
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-indigo-950 uppercase">Belum Memiliki Templat Excel?</h4>
                  <p className="text-[11px] text-indigo-800">Unduh draf file templat `.xlsx` kami yang siap diselaraskan.</p>
                </div>
                <button onClick={downloadExcelTemplate} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer">
                  <span>Unduh Templat</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white rounded-2xl p-6 transition text-center cursor-pointer relative flex flex-col items-center justify-center min-h-[160px]">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleExcelUpload}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                />
                <div className="space-y-2 flex flex-col items-center">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
                    <Upload className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">Pilih atau seret file Excel/CSV di sini</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-600 uppercase">
                  Tinjauan Data CP Terbaca ({tempCPList.length} CP)
                </h4>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {tempCPList.map((cp, i) => (
                    <div key={i} className="p-2 bg-white rounded-lg border text-xs text-slate-700">{i + 1}. {cp}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-5 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={closeUploadExcelModal} className="bg-slate-200 text-slate-800 font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer">Batal</button>
              <button
                disabled={tempCPList.length === 0}
                onClick={applyExcelImport}
                className="bg-emerald-600 disabled:bg-slate-300 text-white font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer"
              >
                Terapkan ke Tabel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {showLightboxModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 no-print" onClick={closeLightboxModal}>
          <button onClick={closeLightboxModal} className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full cursor-pointer">
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-6xl w-full max-h-[90vh] flex items-center justify-center relative" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImgSrc} className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" alt="Zoomed Infographic" />
          </div>
        </div>
      )}
    </>
  );
};
