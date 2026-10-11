import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  GitMerge, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  HardDrive,
  Users,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { inspectSqliteDbFile, DatabaseInspectionResult } from '../services/api';

interface DbImportMergeModalProps {
  isOpen: boolean;
  file: File | null;
  currentRecordsCount: number;
  onClose: () => void;
  onConfirm: (merge: boolean) => Promise<void>;
}

export const DbImportMergeModal: React.FC<DbImportMergeModalProps> = ({
  isOpen,
  file,
  currentRecordsCount,
  onClose,
  onConfirm
}) => {
  // Option: true = Setuju Merge DB Lokal, false = Tidak Setuju (Timpa Total)
  const [shouldMerge, setShouldMerge] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [inspectionData, setInspectionData] = useState<DatabaseInspectionResult | null>(null);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [showSamples, setShowSamples] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && file) {
      setShouldMerge(true); // Default to safe Merge
      setIsInspecting(true);
      setInspectError(null);
      setInspectionData(null);
      setShowSamples(false);

      inspectSqliteDbFile(file)
        .then((data) => {
          setInspectionData(data);
        })
        .catch((err) => {
          console.warn('Could not inspect .db file preview:', err);
          setInspectError(err.message || 'Tidak dapat membaca preview database.');
        })
        .finally(() => {
          setIsInspecting(false);
        });
    }
  }, [isOpen, file]);

  if (!isOpen || !file) return null;

  const fileSizeKb = (file.size / 1024).toFixed(1);
  const incomingViolationsCount = inspectionData?.violationsCount ?? 0;
  const estimatedMergedCount = shouldMerge 
    ? Math.max(currentRecordsCount, currentRecordsCount + incomingViolationsCount)
    : incomingViolationsCount;

  const handleExecute = async () => {
    setIsProcessing(true);
    try {
      await onConfirm(shouldMerge);
      onClose();
    } catch (e) {
      console.error('Error executing DB import/merge:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-linear-to-r from-slate-50 to-indigo-50/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                Opsi Impor & Penggabungan Database
              </h3>
              <p className="text-xs text-slate-500">
                Pilih apakah data baru digabungkan (merge) atau menimpa database lokal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* File Information Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-slate-800 text-xs truncate max-w-[280px]">
                  {file.name}
                </span>
              </div>
              <span className="font-mono text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium">
                {fileSizeKb} KB
              </span>
            </div>

            {/* Inspection Status */}
            {isInspecting ? (
              <div className="flex items-center gap-2 text-indigo-600 text-[11px] animate-pulse py-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Menganalisis isi file database SQLite...</span>
              </div>
            ) : inspectionData ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-200">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500">Data di Berkas:</div>
                  <div className="font-bold text-indigo-700 text-xs">
                    {inspectionData.violationsCount} Pelanggaran
                  </div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500">Data Siswa Terkait:</div>
                  <div className="font-bold text-slate-800 text-xs">
                    {inspectionData.studentsCount} Siswa
                  </div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-slate-500">Database Lokal Saat Ini:</div>
                  <div className="font-bold text-emerald-700 text-xs">
                    {currentRecordsCount} Catatan Aktif
                  </div>
                </div>
              </div>
            ) : inspectError ? (
              <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                Catatan: {inspectError} (File tetap dapat diproses).
              </div>
            ) : null}
          </div>

          {/* OPSI PILIHAN (SETUJU ATAU TIDAK SETUJU UNTUK MERGE) */}
          <div className="space-y-3">
            <label className="block font-bold text-slate-800 text-xs uppercase tracking-wider">
              Tentukan Tindakan Terhadap Database Lokal:
            </label>

            {/* OPSI 1: SETUJU GABUNGKAN (MERGE) */}
            <div
              onClick={() => setShouldMerge(true)}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                shouldMerge
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="mergeOption"
                  checked={shouldMerge}
                  onChange={() => setShouldMerge(true)}
                  className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 text-xs font-bold flex items-center gap-1.5">
                      <GitMerge className="w-4 h-4 text-emerald-600" />
                      Setuju Gabungkan dengan DB Lokal (Merge)
                    </strong>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Direkomendasikan
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Data dari file eksternal akan disatukan dengan database lokal saat ini. <strong>Riwayat catatan yang sudah ada TIDAK akan terhapus</strong>, dan data baru akan otomatis ditambahkan ke daftar.
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 font-medium pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Aman: Perlindungan riwayat lokal + integrasi catatan baru</span>
                  </div>
                </div>
              </div>
            </div>

            {/* OPSI 2: TIDAK SETUJU / TIMPA TOTAL (REPLACE) */}
            <div
              onClick={() => setShouldMerge(false)}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                !shouldMerge
                  ? 'border-rose-500 bg-rose-50/40 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="mergeOption"
                  checked={!shouldMerge}
                  onChange={() => setShouldMerge(false)}
                  className="mt-1 w-4 h-4 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 text-xs font-bold flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4 text-rose-600" />
                      Tidak Setuju (Timpa Total / Ganti Database Penuh)
                    </strong>
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Timpa Penuh
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Seluruh catatan pelanggaran dan pengaturan lokal saat ini akan <strong>digantikan penuh</strong> oleh isi file database eksternal ini.
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-rose-700 font-medium pt-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Peringatan: Seluruh data lokal saat ini akan ditimpa!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PREVIEW SAMPLE VIOLATIONS (IF AVAILABLE) */}
          {inspectionData && inspectionData.sampleViolations.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowSamples(!showSamples)}
                className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-left text-xs font-medium text-slate-700 flex items-center justify-between cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  Lihat Sampel Catatan dari Berkas ({inspectionData.sampleViolations.length} Data Teratas)
                </span>
                {showSamples ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showSamples && (
                <div className="divide-y divide-slate-100 p-2 bg-white max-h-48 overflow-y-auto">
                  {inspectionData.sampleViolations.map((v) => (
                    <div key={v.id} className="py-1.5 px-2 text-[11px] flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800">{v.namaSiswa}</span>{' '}
                        <span className="text-slate-500">({v.kelas})</span>
                        <div className="text-slate-600 text-[10px] line-clamp-1">
                          {v.jenisPelanggaran}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-rose-600 font-bold font-mono">-{v.poin} Poin</span>
                        <div className="text-[10px] text-slate-400">{v.tanggal}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleExecute}
            disabled={isProcessing}
            className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
              shouldMerge
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Memproses Database...</span>
              </>
            ) : shouldMerge ? (
              <>
                <GitMerge className="w-3.5 h-3.5" />
                <span>Setuju & Gabungkan (Merge DB)</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Timpa Penuh Database</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
