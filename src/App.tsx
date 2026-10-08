import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { DisciplineRadarCard } from './components/DisciplineRadarCard';
import { FormatGuideCard } from './components/FormatGuideCard';
import { ViolationTable } from './components/ViolationTable';
import { ViolationFormModal } from './components/ViolationFormModal';
import { PrintReportModal } from './components/PrintReportModal';
import { PrintLetterModal } from './components/PrintLetterModal';
import { RulesCatalogModal } from './components/RulesCatalogModal';
import { SchoolProfileModal } from './components/SchoolProfileModal';
import { WindowsDesktopModal } from './components/WindowsDesktopModal';
import { ViolationRecord, SchoolProfile, SanctionStatus } from './types/violation';
import { INITIAL_VIOLATIONS } from './data/initialViolations';
import { DEFAULT_SCHOOL_PROFILE } from './data/rulesCatalog';
import { exportViolationsToCSV, downloadBlankTemplateCSV } from './utils/csvExport';
import { 
  fetchViolationsFromSql, 
  saveViolationToSql, 
  updateViolationInSql, 
  deleteViolationFromSql, 
  fetchSchoolProfileFromSql, 
  updateSchoolProfileInSql,
  downloadSqlDatabaseFile,
  downloadSqliteDbFile,
  uploadSqliteDbFile
} from './services/api.ts';
import { CheckCircle2, Database } from 'lucide-react';

const STORAGE_KEY_RECORDS = 'buku_pelanggaran_records_v1';
const STORAGE_KEY_PROFILE = 'buku_pelanggaran_profile_v1';

export default function App() {
  // Load saved records or initial sample
  const [records, setRecords] = useState<ViolationRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved records', e);
      }
    }
    return INITIAL_VIOLATIONS;
  });

  // Load school profile
  const [profile, setProfile] = useState<SchoolProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved profile', e);
      }
    }
    return DEFAULT_SCHOOL_PROFILE;
  });

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ViolationRecord | null>(null);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);
  const [isPrintLetterOpen, setIsPrintLetterOpen] = useState(false);
  const [selectedRecordForLetter, setSelectedRecordForLetter] = useState<ViolationRecord | null>(null);
  const [isRulesCatalogOpen, setIsRulesCatalogOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isWindowsDesktopModalOpen, setIsWindowsDesktopModalOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [tableFilterStudent, setTableFilterStudent] = useState<string>('');

  // Fetch live data from Cloud SQL Database on startup
  useEffect(() => {
    async function loadFromSql() {
      try {
        const sqlViolations = await fetchViolationsFromSql();
        if (sqlViolations && sqlViolations.length > 0) {
          setRecords(sqlViolations);
        }
      } catch (e) {
        console.warn('Running with local cache fallback', e);
      }

      try {
        const sqlProfile = await fetchSchoolProfileFromSql();
        if (sqlProfile) {
          setProfile(sqlProfile);
        }
      } catch (e) {
        console.warn('Using local profile', e);
      }
    }
    loadFromSql();
  }, []);

  // Auto-sync with localStorage as offline redundancy
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
  }, [profile]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Handlers
  const handleSaveRecord = async (record: ViolationRecord) => {
    if (editingRecord) {
      setRecords(prev => prev.map(item => item.id === record.id ? record : item));
      showToast(`Data pelanggaran ${record.namaSiswa} berhasil diperbarui di database SQL.`);
      try {
        await updateViolationInSql(record.id, record);
      } catch (e) {
        console.warn('Updated locally, SQL sync error', e);
      }
    } else {
      setRecords(prev => [record, ...prev]);
      showToast(`Catatan pelanggaran ${record.namaSiswa} berhasil disimpan ke database SQL.`);
      try {
        await saveViolationToSql(record);
      } catch (e) {
        console.warn('Saved locally, SQL sync error', e);
      }
    }
    setEditingRecord(null);
  };

  const handleEditRecord = (record: ViolationRecord) => {
    setEditingRecord(record);
    setIsFormModalOpen(true);
  };

  const handleDeleteRecord = async (id: string) => {
    const record = records.find(r => r.id === id);
    setRecords(prev => prev.filter(item => item.id !== id));
    showToast(`Catatan pelanggaran ${record ? record.namaSiswa : ''} telah dihapus dari database.`);
    try {
      await deleteViolationFromSql(id);
    } catch (e) {
      console.warn('Deleted locally, SQL sync error', e);
    }
  };

  const handleToggleStatus = async (id: string, newStatus: SanctionStatus) => {
    setRecords(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, statusSanksi: newStatus };
      }
      return item;
    }));
    showToast(`Status sanksi diubah menjadi "${newStatus}" di database SQL.`);
    try {
      await updateViolationInSql(id, { statusSanksi: newStatus });
    } catch (e) {
      console.warn('Updated locally, SQL sync error', e);
    }
  };

  const handleGenerateLetter = (record: ViolationRecord) => {
    setSelectedRecordForLetter(record);
    setIsPrintLetterOpen(true);
  };

  const handleResetDemoData = () => {
    setRecords(INITIAL_VIOLATIONS);
    setProfile(DEFAULT_SCHOOL_PROFILE);
    localStorage.removeItem(STORAGE_KEY_RECORDS);
    localStorage.removeItem(STORAGE_KEY_PROFILE);
    showToast('Data catatan pelanggaran dikembalikan ke percontohan awal.');
  };

  const handleExportCSV = () => {
    const filename = `Buku_Pelanggaran_${profile.namaSekolah.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    exportViolationsToCSV(records, filename);
    showToast('Data buku pelanggaran berhasil diunduh dalam format CSV / Excel.');
  };

  const handleDownloadBlankTemplate = () => {
    downloadBlankTemplateCSV();
    showToast('Template tabel kosong berhasil diunduh.');
  };

  const handleDownloadSqlDump = () => {
    downloadSqlDatabaseFile();
    showToast('Script database SQL (.sql) berhasil diunduh.');
  };

  const handleDownloadSqliteDb = () => {
    downloadSqliteDbFile();
    showToast('File database SQLite (buku_pelanggaran_sekolah.db) berhasil diunduh.');
  };

  const handleUploadSqliteDb = async (file: File) => {
    try {
      showToast('Sedang memuat file database SQLite...');
      await uploadSqliteDbFile(file);
      // Reload violations and profile
      const [newViolations, newProfile] = await Promise.all([
        fetchViolationsFromSql(),
        fetchSchoolProfileFromSql()
      ]);
      if (newViolations) setRecords(newViolations);
      if (newProfile) setProfile(newProfile);
      showToast('Database SQLite berhasil dipulihkan dari file komputer!');
    } catch (err: any) {
      showToast(`Gagal memuat database: ${err.message || 'File tidak valid'}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Header */}
      <Header
        profile={profile}
        onOpenAddModal={() => {
          setEditingRecord(null);
          setIsFormModalOpen(true);
        }}
        onOpenPrintReport={() => setIsPrintReportOpen(true)}
        onOpenRulesCatalog={() => setIsRulesCatalogOpen(true)}
        onOpenSchoolProfile={() => setIsProfileModalOpen(true)}
        onOpenWindowsDesktop={() => setIsWindowsDesktopModalOpen(true)}
        onExportCSV={handleExportCSV}
        onDownloadBlankTemplate={handleDownloadBlankTemplate}
        onDownloadSqlDump={handleDownloadSqlDump}
        onDownloadSqliteDb={handleDownloadSqliteDb}
        onUploadSqliteDb={handleUploadSqliteDb}
        onResetDemoData={handleResetDemoData}
      />

      {/* Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* Statistical Summary Cards */}
        <StatsOverview
          records={records}
        />

        {/* Radar Kedisiplinan Siswa: Pusat Perhatian Siswa Kekurangan Saldo (Sistem Saldo 200 Poin) */}
        <DisciplineRadarCard
          records={records}
          onGenerateLetter={handleGenerateLetter}
          onFilterStudentInTable={(studentName) => {
            setTableFilterStudent(studentName);
            const tableElement = document.getElementById('violation-table-section');
            if (tableElement) {
              tableElement.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        />

        {/* Pedagogical & Format Specification Guide */}
        <FormatGuideCard />

        {/* Core Violation Table with All Requested Columns */}
        <div id="violation-table-section">
          <ViolationTable
            records={records}
            onEdit={handleEditRecord}
            onDelete={handleDeleteRecord}
            onGenerateLetter={handleGenerateLetter}
            onToggleStatus={handleToggleStatus}
            externalSearchFilter={tableFilterStudent}
            onClearExternalFilter={() => setTableFilterStudent('')}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            &copy; {new Date().getFullYear()} {profile.namaSekolah} &bull; Sistem Buku Catatan Kedisiplinan & Tata Tertib Siswa
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Standar Administrasi Kesiswaan & Bimbingan Konseling (BK)</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Add / Edit Violation Record Modal */}
      <ViolationFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSaveRecord}
        initialData={editingRecord}
        defaultGuruBK={profile.namaGuruBK}
        records={records}
      />

      {/* 2. Official School Ledger Print Report Modal */}
      <PrintReportModal
        isOpen={isPrintReportOpen}
        onClose={() => setIsPrintReportOpen(false)}
        records={records}
        profile={profile}
      />

      {/* 3. Official Summons / Disciplinary Agreement Letter Modal */}
      <PrintLetterModal
        isOpen={isPrintLetterOpen}
        onClose={() => {
          setIsPrintLetterOpen(false);
          setSelectedRecordForLetter(null);
        }}
        record={selectedRecordForLetter}
        profile={profile}
        records={records}
      />

      {/* 4. Rules & Sanction Catalog Guide Modal */}
      <RulesCatalogModal
        isOpen={isRulesCatalogOpen}
        onClose={() => setIsRulesCatalogOpen(false)}
        onSelectRule={(rule) => {
          setEditingRecord(null);
          setIsRulesCatalogOpen(false);
          setIsFormModalOpen(true);
        }}
      />

      {/* 5. School Profile & Letterhead Settings Modal */}
      <SchoolProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onSave={async (updated) => {
          setProfile(updated);
          showToast('Profil sekolah dan kop surat berhasil diperbarui di database SQL.');
          try {
            await updateSchoolProfileInSql(updated);
          } catch (e) {
            console.warn('Profile updated locally, SQL sync error', e);
          }
        }}
      />

      {/* 6. Windows Desktop App & Offline Local Guide Modal */}
      <WindowsDesktopModal
        isOpen={isWindowsDesktopModalOpen}
        onClose={() => setIsWindowsDesktopModalOpen(false)}
      />
    </div>
  );
}
