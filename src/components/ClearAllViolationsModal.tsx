import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  AlertTriangle, 
  ShieldAlert, 
  Download, 
  RefreshCw,
  Database
} from 'lucide-react';

interface ClearAllViolationsModalProps {
  isOpen: boolean;
  recordsCount: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  onDownloadBackup: () => void;
}

export const ClearAllViolationsModal: React.FC<ClearAllViolationsModalProps> = ({
  isOpen,
  recordsCount,
  onClose,
  onConfirm,
  onDownloadBackup
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [hasConfirmedCheckbox, setHasConfirmedCheckbox] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExecute = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      console.error('Error clearing all violations:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-rose-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Kosongkan Seluruh List Data
              </h3>
              <p className="text-xs text-rose-700 font-medium">
                Penghapusan permanen catatan pelanggaran lokal
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
        <div className="p-6 space-y-4 text-xs text-slate-700">
          {/* Warning Alert Box */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-rose-800 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Peringatan Tindakan Permanen!</span>
            </div>
            <p className="text-[11px] text-rose-900 leading-relaxed">
              Tindakan ini akan <strong>menghapus dan mengosongkan seluruh {recordsCount} catatan pelanggaran siswa</strong> yang saat ini tampil di tabel dan tersimpan di database SQLite lokal komputer Anda.
            </p>
          </div>

          {/* Backup Recommendation */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="text-[11px] text-slate-600 flex items-center justify-between">
              <span>Rekomendasi Cadangan (Backup):</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-medium">
                {recordsCount} data saat ini
              </span>
            </div>
            <button
              type="button"
              onClick={onDownloadBackup}
              className="w-full py-2 px-3 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              <span>Unduh Cadangan Database (.db) Dulu</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              File cadangan dapat diimpor kembali sewaktu-waktu jika diperlukan.
            </p>
          </div>

          {/* Checkbox Confirmation for extra safety */}
          {recordsCount > 0 && (
            <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200">
              <input
                type="checkbox"
                checked={hasConfirmedCheckbox}
                onChange={(e) => setHasConfirmedCheckbox(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
              />
              <span className="text-[11px] text-slate-700 select-none">
                Saya memahami konsekuensi ini dan setuju untuk mengosongkan seluruh list pelanggaran siswa dari database lokal.
              </span>
            </label>
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
            disabled={isProcessing || (recordsCount > 0 && !hasConfirmedCheckbox)}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Mengosongkan Data...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Kosongkan Seluruh Data</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
