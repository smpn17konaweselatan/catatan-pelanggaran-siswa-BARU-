import React, { useState } from 'react';
import { 
  Plus, 
  Printer, 
  Download, 
  FileSpreadsheet, 
  BookOpen, 
  Building2, 
  Upload, 
  RotateCcw,
  GraduationCap,
  Monitor,
  Database
} from 'lucide-react';
import { SchoolProfile } from '../types/violation';
import { downloadMasterTeachersExcel, downloadMasterStudentsExcel } from '../services/api';

interface HeaderProps {
  profile: SchoolProfile;
  onOpenAddModal: () => void;
  onOpenPrintReport: () => void;
  onOpenRulesCatalog: () => void;
  onOpenSchoolProfile: () => void;
  onOpenWindowsDesktop: () => void;
  onExportCSV: () => void;
  onDownloadBlankTemplate: () => void;
  onDownloadSqlDump: () => void;
  onDownloadSqliteDb: () => void;
  onUploadSqliteDb: (file: File) => void;
  onResetDemoData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  onOpenAddModal,
  onOpenPrintReport,
  onOpenRulesCatalog,
  onOpenSchoolProfile,
  onOpenWindowsDesktop,
  onExportCSV,
  onDownloadBlankTemplate,
  onDownloadSqlDump,
  onDownloadSqliteDb,
  onUploadSqliteDb,
  onResetDemoData
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadSqliteDb(file);
      e.target.value = '';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* School Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  Format Resmi Kesiswaan & BK
                </span>
                <span className="text-xs text-slate-400">&bull;</span>
                <span className="text-xs text-slate-500 font-mono">Tahun Ajaran 2026/2027</span>
                <span className="text-xs text-slate-400">&bull;</span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded shadow-2xs">
                  <Database className="w-3 h-3 text-emerald-600" />
                  Database: SQLite Offline (.db)
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                Buku Catatan Pelanggaran Siswa & Sanksi Tata Tertib
              </h1>
              <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                <span className="font-semibold text-slate-800">{profile.namaSekolah}</span>
                <span>&bull;</span>
                <span>{profile.kabupatenKota}</span>
                <button
                  type="button"
                  onClick={onOpenSchoolProfile}
                  className="text-indigo-600 hover:text-indigo-800 underline text-[11px] ml-1 cursor-pointer"
                >
                  (Ubah Profil & Kop Dokumen)
                </button>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Action: Tambah Pelanggaran */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Input Pelanggaran Baru</span>
            </button>

            {/* Cetak Format Buku Induk */}
            <button
              onClick={onOpenPrintReport}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak Rekapitulasi</span>
            </button>

            {/* Katalog Tata Tertib & Poin */}
            <button
              onClick={onOpenRulesCatalog}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
            >
              <BookOpen className="w-4 h-4 text-slate-600" />
              <span>Katalog Poin & Aturan</span>
            </button>

            {/* Aplikasi Windows (Desktop / Offline) - disembunyikan/dijauhkan dari UI */}
            <button
              onClick={onOpenWindowsDesktop}
              className="hidden items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              <Monitor className="w-4 h-4 text-indigo-600" />
              <span>Jalankan di Windows (Desktop)</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".db,.sqlite,.sqlite3" 
                className="hidden" 
              />
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Unduh / Excel</span>
              </button>

              {showExportMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowExportMenu(false)} 
                  />
                  <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 text-xs">
                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        onExportCSV();
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div className="font-medium">Ekspor Data Lengkap (CSV/Excel)</div>
                        <div className="text-[10px] text-slate-400">Semua catatan pelanggaran aktif</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        downloadMasterTeachersExcel();
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-medium text-emerald-900">Unduh Format Guru (guru.csv)</div>
                        <div className="text-[10px] text-slate-400">File format CSV master guru & pelapor</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        downloadMasterStudentsExcel();
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <div className="font-medium text-indigo-900">Unduh Format Siswa (siswa.csv)</div>
                        <div className="text-[10px] text-slate-400">File format CSV master siswa & rombel</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        onDownloadBlankTemplate();
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"
                    >
                      <Download className="w-4 h-4 text-indigo-600" />
                      <div>
                        <div className="font-medium">Unduh Template CSV Kosong</div>
                        <div className="text-[10px] text-slate-400">Format kolom untuk diisi offline</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        onDownloadSqliteDb();
                      }}
                      className="w-full text-left px-3 py-2 text-emerald-800 hover:bg-emerald-50/70 flex items-center gap-2 border-t border-slate-100 font-semibold"
                    >
                      <Database className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div>Unduh Database SQLite (.db)</div>
                        <div className="text-[10px] text-slate-500 font-normal">File buku_pelanggaran_sekolah.db fisik</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        fileInputRef.current?.click();
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"
                    >
                      <Upload className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <div className="font-medium">Impor / Buka File SQLite (.db)</div>
                        <div className="text-[10px] text-slate-400">Muat database dari komputer / flashdisk</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        onDownloadSqlDump();
                      }}
                      className="w-full text-left px-3 py-2 text-indigo-700 hover:bg-indigo-50/50 flex items-center gap-2 border-t border-slate-100"
                    >
                      <Database className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <div className="font-medium">Unduh Skrip SQL (.sql)</div>
                        <div className="text-[10px] text-slate-400">Script tabel & data SQLite / MySQL</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        if (window.confirm('Reset data catatan pelanggaran kembali ke contoh data awal?')) {
                          onResetDemoData();
                        }
                      }}
                      className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100"
                    >
                      <RotateCcw className="w-4 h-4 text-rose-500" />
                      <div>
                        <div className="font-medium">Reset Data Contoh Bawaan</div>
                        <div className="text-[10px] text-slate-400">Kembalikan data percontohan</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
