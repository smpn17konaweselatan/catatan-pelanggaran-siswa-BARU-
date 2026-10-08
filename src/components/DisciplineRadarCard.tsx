import React, { useState, useMemo } from 'react';
import { ViolationRecord } from '../types/violation';
import { calculateStudentBalances, INITIAL_DISCIPLINE_BALANCE, DisciplineLevel } from '../utils/balanceCalculator';
import { 
  AlertTriangle, 
  ShieldAlert, 
  UserX, 
  ChevronRight, 
  FileText, 
  Search, 
  Activity,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface DisciplineRadarCardProps {
  records: ViolationRecord[];
  onGenerateLetter: (record: ViolationRecord) => void;
  onFilterStudentInTable?: (studentName: string) => void;
}

export const DisciplineRadarCard: React.FC<DisciplineRadarCardProps> = ({
  records,
  onGenerateLetter,
  onFilterStudentInTable
}) => {
  const [selectedFilter, setSelectedFilter] = useState<DisciplineLevel | 'Semua' | 'KritisDanPeringatan'>('KritisDanPeringatan');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate balances only for students who have violation records
  const studentProfiles = useMemo(() => {
    return calculateStudentBalances(records);
  }, [records]);

  // Counts by discipline level
  const stats = useMemo(() => {
    const kritis = studentProfiles.filter(p => p.levelInfo.level === 'Kritis').length;
    const peringatan = studentProfiles.filter(p => p.levelInfo.level === 'Peringatan').length;
    const perhatian = studentProfiles.filter(p => p.levelInfo.level === 'Perhatian').length;
    const aman = studentProfiles.filter(p => p.levelInfo.level === 'Aman').length;
    return { kritis, peringatan, perhatian, aman, totalBermasalah: studentProfiles.length };
  }, [studentProfiles]);

  // Filtered list
  const filteredProfiles = useMemo(() => {
    return studentProfiles.filter(p => {
      // Filter tab
      if (selectedFilter === 'KritisDanPeringatan') {
        if (p.levelInfo.level !== 'Kritis' && p.levelInfo.level !== 'Peringatan') return false;
      } else if (selectedFilter !== 'Semua') {
        if (p.levelInfo.level !== selectedFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.namaSiswa.toLowerCase().includes(q) ||
          p.kelas.toLowerCase().includes(q) ||
          p.nisn.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [studentProfiles, selectedFilter, searchQuery]);

  return (
    <div className="bg-white border-2 border-indigo-100 rounded-2xl shadow-sm overflow-hidden mb-6 transition-all">
      {/* Header Bar */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/80 text-white px-2 py-0.5 rounded-full">
                Sistem Saldo 200 Poin
              </span>
              <span className="text-xs text-indigo-300">&bull;</span>
              <span className="text-xs text-indigo-200">Pengawasan Prioritas Siswa</span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Radar Kedisiplinan: Siswa Kekurangan Saldo Poin
            </h3>
          </div>
        </div>

        {/* Quick summary badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>{stats.kritis} Kritis (≤50)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-200 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
            <span>{stats.peringatan} Peringatan (51-100)</span>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-slate-300 hover:text-white underline cursor-pointer ml-1"
          >
            {isExpanded ? 'Sembunyikan' : 'Tampilkan Panel'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 space-y-4">
          {/* System explanation banner */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Mekanisme Saldo Disiplin:</span> Setiap siswa dibekali kuota modal <strong>{INITIAL_DISCIPLINE_BALANCE} Poin</strong> di awal tahun ajaran.
                Poin pelanggaran langsung mengurangi saldo. Siswa dengan sisa saldo terendah wajib menjadi <strong>pusat perhatian pembinaan bimbingan konseling (BK)</strong> dan pemanggilan orang tua.
              </div>
            </div>
          </div>

          {/* Controls: Search & Category Filter Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setSelectedFilter('KritisDanPeringatan')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedFilter === 'KritisDanPeringatan'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Prioritas Utama ({stats.kritis + stats.peringatan})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFilter('Kritis')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedFilter === 'Kritis'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Kritis ≤50 ({stats.kritis})
              </button>

              <button
                type="button"
                onClick={() => setSelectedFilter('Peringatan')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedFilter === 'Peringatan'
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                }`}
              >
                Peringatan 51–100 ({stats.peringatan})
              </button>

              <button
                type="button"
                onClick={() => setSelectedFilter('Perhatian')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedFilter === 'Perhatian'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Perhatian 101–150 ({stats.perhatian})
              </button>

              <button
                type="button"
                onClick={() => setSelectedFilter('Semua')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedFilter === 'Semua'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Siswa Terpotong ({stats.totalBermasalah})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama atau kelas siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>

          {/* Cards Grid of Critical Students */}
          {filteredProfiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredProfiles.map((p) => {
                const isCritical = p.levelInfo.level === 'Kritis';
                const isWarning = p.levelInfo.level === 'Peringatan';

                return (
                  <div
                    key={`${p.namaSiswa}-${p.kelas}`}
                    className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                      isCritical
                        ? 'border-rose-300 bg-rose-50/40 hover:border-rose-400'
                        : isWarning
                        ? 'border-orange-300 bg-orange-50/30 hover:border-orange-400'
                        : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      {/* Top Info */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="text-sm font-bold text-slate-900 leading-tight">
                            {p.namaSiswa}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="font-semibold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              Kelas {p.kelas}
                            </span>
                            <span>&bull;</span>
                            <span>NIS: {p.nisn || '-'}</span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${p.levelInfo.badgeBg} ${p.levelInfo.badgeText} ${p.levelInfo.badgeBorder}`}>
                          {p.levelInfo.statusLabel}
                        </span>
                      </div>

                      {/* Remaining Balance Display */}
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200/80 mb-2.5">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-500 font-medium">Sisa Saldo Poin:</span>
                          <span className="font-extrabold text-sm">
                            <span className={isCritical ? 'text-rose-600' : isWarning ? 'text-orange-600' : 'text-slate-900'}>
                              {p.sisaSaldo}
                            </span>
                            <span className="text-slate-400 font-normal text-xs"> / {INITIAL_DISCIPLINE_BALANCE} Poin</span>
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${p.levelInfo.barColor}`}
                            style={{ width: `${Math.max(4, p.persentaseSisa)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                          <span>Terpotong: <strong className="text-rose-600">-{p.totalPoinTerpotong} Poin</strong></span>
                          <span>{p.jumlahPelanggaran} Kasus Tercatat</span>
                        </div>
                      </div>

                      {/* Rekomendasi Tindakan */}
                      <div className="text-[11px] text-slate-600 mb-3 bg-white/70 p-2 rounded-md border border-slate-100">
                        <span className="font-semibold text-slate-700">Tindakan BK: </span>
                        {p.levelInfo.rekomendasiTindakan}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => onFilterStudentInTable?.(p.namaSiswa)}
                        className="text-indigo-700 hover:text-indigo-900 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <span>Lihat Kasus</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {p.pelanggaranTerakhir && (
                        <button
                          type="button"
                          onClick={() => onGenerateLetter(p.pelanggaranTerakhir!)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-md text-slate-700 font-medium flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Panggil Ortu</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-800">
                Tidak ada siswa dalam kategori ini
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Semua siswa yang terfilter saat ini berada di atas batas saldo tersebut.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
