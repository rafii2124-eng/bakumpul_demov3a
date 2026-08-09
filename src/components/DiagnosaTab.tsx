import React, { useEffect, useRef } from 'react';
import { Biodata, DiagnosticData } from '../types';
import Chart from 'chart.js/auto';
import { BarChart3, Printer, Edit3, Lightbulb } from 'lucide-react';

interface DiagnosaTabProps {
  biodata: Biodata;
  subject: string;
  setSubject: (sub: string) => void;
  diagnosticDatabase: Record<string, DiagnosticData>;
  setDiagnosticDatabase: React.Dispatch<React.SetStateAction<Record<string, DiagnosticData>>>;
  setLockedTargets: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  triggerPrint: (mode: 'diagnosa' | 'kktp' | 'bukunilai') => void;
  showToast?: (msg: string) => void;
  isDemo?: boolean;
}

export const DiagnosaTab: React.FC<DiagnosaTabProps> = ({
  biodata,
  subject,
  setSubject,
  diagnosticDatabase,
  setDiagnosticDatabase,
  setLockedTargets,
  triggerPrint,
  showToast,
  isDemo
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  const currentData = diagnosticDatabase[subject] || { n90: 8, n80: 12, n70: 6, n60: 4 };

  const total = currentData.n90 + currentData.n80 + currentData.n70 + currentData.n60;
  const mean = total > 0 ? ((currentData.n90 * 95 + currentData.n80 * 85 + currentData.n70 * 75 + currentData.n60 * 65) / total).toFixed(1) : "0.0";

  // Update target in locked targets map
  useEffect(() => {
    const numMean = parseFloat(mean);
    setLockedTargets(prev => ({ ...prev, [subject]: numMean }));
  }, [subject, mean, setLockedTargets]);

  // Render Chart
  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      chartRef.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Perlu Pendampingan (60-69)', 'Cukup (70-79)', 'Mahir (80-89)', 'Sangat Mahir (90-100)'],
          datasets: [{
            label: 'Jumlah Siswa',
            data: [currentData.n60, currentData.n70, currentData.n80, currentData.n90],
            backgroundColor: ['#f43f5e', '#f59e0b', '#0ea5e9', '#10b981']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          }
        }
      });
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [subject, currentData]);

  const handleRangeChange = (key: keyof DiagnosticData, val: string) => {
    if (isDemo) {
      if (showToast) showToast("🔒 Mode Demo: Data diagnosa dikunci dalam mode lihat saja.");
      return;
    }
    const num = parseInt(val) || 0;
    setDiagnosticDatabase(prev => ({
      ...prev,
      [subject]: {
        ...prev[subject],
        [key]: num
      }
    }));
  };

  return (
    <div id="tab-diagnosa" className="tab-content space-y-6">
      {/* HEADER KHUSUS CETAK DIAGNOSA */}
      <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-6">
        <div className="flex items-center justify-center space-x-4 mb-3">
          {biodata.logo && <img src={biodata.logo} className="print-kop-logo max-h-16 object-contain" alt="Logo" />}
          <div className="text-center">
            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-950">LAPORAN HASIL ASESMEN DIAGNOSA KOGNITIF AWAL</h2>
            <h3 className="text-md font-bold uppercase text-indigo-950">MATA PELAJARAN: {subject}</h3>
            <p className="text-base font-extrabold text-slate-800 mt-0.5 print-text-school">{biodata.namaSekolah}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 print-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 no-print">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-100 text-indigo-800 rounded-xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Asesmen Diagnosa (Nilai Rapor Kelas Sebelumnya)</h2>
              <p className="text-xs text-slate-500">Analisis profil kompetensi awal siswa terintegrasi untuk masing-masing mata pelajaran</p>
            </div>
          </div>
          <button
            onClick={() => triggerPrint('diagnosa')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center justify-center space-x-2 transition shadow cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan Diagnosa</span>
          </button>
        </div>

        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-bold text-indigo-950">Mata Pelajaran:</span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block">
          <div className="lg:col-span-5 bg-slate-50 p-6 rounded-2xl border border-slate-200/60 space-y-5 print:hidden">
            <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2 border-b pb-2">
              <Edit3 className="w-4 h-4 text-indigo-600" />
              <span>Input Diagnosa: {subject}</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Fase</label>
                <input
                  type="text"
                  readOnly
                  value={biodata.fase}
                  title="Fase mengikuti pengaturan di menu Biodata Sekolah"
                  className="w-full bg-indigo-50 border border-indigo-200 rounded-xl px-2 py-2 text-xs font-semibold text-indigo-900 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Kelas</label>
                <input
                  type="text"
                  readOnly
                  value={biodata.kelas}
                  title="Kelas mengikuti inputan Kelas pada menu Biodata Sekolah"
                  className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-2 py-2 text-xs font-semibold text-emerald-900 cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400 mt-1 italic">Ikut inputan Kelas di Biodata</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Semester</label>
                <input
                  type="text"
                  readOnly
                  value={biodata.semester}
                  title="Semester mengikuti pengaturan di menu Biodata Sekolah"
                  className="w-full bg-indigo-50 border border-indigo-200 rounded-xl px-2 py-2 text-xs text-center font-bold text-indigo-900 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600">Sangat Mahir (Nilai 90 - 100)</label>
                <input
                  type="number"
                  min="0"
                  value={currentData.n90}
                  onChange={(e) => handleRangeChange('n90', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Mahir (Nilai 80 - 89)</label>
                <input
                  type="number"
                  min="0"
                  value={currentData.n80}
                  onChange={(e) => handleRangeChange('n80', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Cukup (Nilai 70 - 79)</label>
                <input
                  type="number"
                  min="0"
                  value={currentData.n70}
                  onChange={(e) => handleRangeChange('n70', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Perlu Pendampingan (Nilai 60 - 69)</label>
                <input
                  type="number"
                  min="0"
                  value={currentData.n60}
                  onChange={(e) => handleRangeChange('n60', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
              <div>
                <p className="text-xs text-slate-400 font-medium">Total Terhitung</p>
                <h4 className="text-xl font-bold text-slate-800">{total} Siswa</h4>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-medium">Rata-rata Kelas</p>
                <h4 className="text-xl font-bold text-indigo-700">{mean}</h4>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-between space-y-6 print:w-full">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col justify-center min-h-[300px]">
              <h4 className="text-sm font-bold text-slate-700 mb-3 text-center">Grafik Sebaran Nilai Rapor Kelas Sebelumnya</h4>
              <div className="relative flex-1 w-full flex items-center justify-center min-h-[220px]">
                <canvas ref={canvasRef} className="max-h-[250px] w-full"></canvas>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200/70 p-5 rounded-2xl space-y-3">
              <h4 className="text-sm font-bold text-amber-900 flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-amber-600" />
                <span>Rekomendasi Tindak Lanjut Diagnostik</span>
              </h4>
              <div className="text-xs text-amber-800 space-y-2 leading-relaxed">
                <p>• Rata-rata kelas: <strong>{mean}</strong>. Target KKTP dikunci pada angka <strong>{mean}</strong>.</p>
                <p>• Terdapat <strong>{currentData.n60}</strong> siswa perlu pendampingan khusus melalui program remedial sebelum KBM utama.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
