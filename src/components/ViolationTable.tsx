import React, { useState, useMemo } from 'react';
import { 
  ViolationRecord, 
  ViolationSeverity, 
  SanctionStatus 
} from '../types/violation';
import { 
  calculateStudentBalances, 
  INITIAL_DISCIPLINE_BALANCE, 
  DisciplineLevel 
} from '../utils/balanceCalculator';
import { MASTER_STUDENTS } from '../data/schoolMasterData';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Trash2, 
  Mail, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  AlertTriangle,
  Info,
  Calendar,
  User,
  ShieldAlert,
  Activity,
  TrendingDown
} from 'lucide-react';

interface ViolationTableProps {
  records: ViolationRecord[];
  onEdit: (record: ViolationRecord) => void;
  onDelete: (id: string) => void;
  onGenerateLetter: (record: ViolationRecord) => void;
  onToggleStatus: (id: string, newStatus: SanctionStatus) => void;
  externalSearchFilter?: string;
  onClearExternalFilter?: () => void;
}

export const ViolationTable: React.FC<ViolationTableProps> = ({
  records,
  onEdit,
  onDelete,
  onGenerateLetter,
  onToggleStatus,
  externalSearchFilter,
  onClearExternalFilter
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('Semua');
  const [filterClass, setFilterClass] = useState<string>('Semua');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [filterBalance, setFilterBalance] = useState<string>('Semua');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Sync external search filter if passed (e.g. from DisciplineRadarCard "Lihat Kasus")
  React.useEffect(() => {
    if (externalSearchFilter !== undefined) {
      setSearchTerm(externalSearchFilter);
    }
  }, [externalSearchFilter]);

  // Pre-calculate balances map for all students
  const studentBalancesMap = useMemo(() => {
    const list = calculateStudentBalances(records);
    const map = new Map<string, typeof list[0]>();
    for (const s of list) {
      map.set(s.namaSiswa.trim().toUpperCase(), s);
    }
    return map;
  }, [records]);

  // Lookup map for student NISN from master data
  const studentNisnMap = useMemo(() => {
    const map = new Map<string, string>();
    MASTER_STUDENTS.forEach(s => {
      if (s.nama && s.nisn) {
        map.set(s.nama.trim().toUpperCase(), s.nisn);
      }
    });
    return map;
  }, []);

  // Extract unique classes for filter
  const classList = useMemo(() => {
    return Array.from(new Set(records.map(r => r.kelas))).sort();
  }, [records]);

  // Filter records
  const filteredRecords = records.filter(r => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearch =
      r.namaSiswa.toLowerCase().includes(searchLower) ||
      r.nisn.toLowerCase().includes(searchLower) ||
      r.jenisPelanggaran.toLowerCase().includes(searchLower) ||
      r.sanksi.toLowerCase().includes(searchLower) ||
      r.guruPelapor.toLowerCase().includes(searchLower) ||
      r.tempatKejadian.toLowerCase().includes(searchLower);

    const matchSeverity = filterSeverity === 'Semua' || r.kategori === filterSeverity;
    const matchClass = filterClass === 'Semua' || r.kelas === filterClass;
    const matchStatus = filterStatus === 'Semua' || r.statusSanksi === filterStatus;

    // Filter based on student remaining balance
    const balance = studentBalancesMap.get(r.namaSiswa.trim().toUpperCase());
    let matchBalance = true;
    if (filterBalance !== 'Semua' && balance) {
      if (filterBalance === 'Kritis') matchBalance = balance.levelInfo.level === 'Kritis';
      else if (filterBalance === 'Peringatan') matchBalance = balance.levelInfo.level === 'Peringatan';
      else if (filterBalance === 'Perhatian') matchBalance = balance.levelInfo.level === 'Perhatian';
      else if (filterBalance === 'Aman') matchBalance = balance.levelInfo.level === 'Aman';
    }

    return matchSearch && matchSeverity && matchClass && matchStatus && matchBalance;
  });

  const toggleExpand = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* Control & Filter Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama siswa, NISN, jenis pelanggaran, sanksi..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Filter Sisa Saldo Siswa */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-medium">Saldo:</span>
              <select
                value={filterBalance}
                onChange={(e) => setFilterBalance(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
              >
                <option value="Semua">Semua Saldo</option>
                <option value="Kritis">Kritis (≤50 Poin)</option>
                <option value="Peringatan">Peringatan (51-100 Poin)</option>
                <option value="Perhatian">Perhatian (101-150 Poin)</option>
                <option value="Aman">Aman (&gt;150 Poin)</option>
              </select>
            </div>

            {/* Filter Kategori */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-medium">Tingkat:</span>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
              >
                <option value="Semua">Semua Tingkat</option>
                <option value="Ringan">Ringan (5-10 Poin)</option>
                <option value="Sedang">Sedang (15-35 Poin)</option>
                <option value="Berat">Berat (≥50 Poin)</option>
              </select>
            </div>

            {/* Filter Kelas */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-medium">Kelas:</span>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
              >
                <option value="Semua">Semua Kelas</option>
                {classList.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            {/* Filter Status Sanksi */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-medium">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
              >
                <option value="Semua">Semua Status</option>
                <option value="Belum Ditindaklanjuti">Belum Ditindaklanjuti</option>
                <option value="Sedang Berjalan">Sedang Berjalan</option>
                <option value="Menunggu Pemanggilan Ortu">Menunggu Panggilan Ortu</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Indicators */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-2">
            <span>
              Menampilkan <strong>{filteredRecords.length}</strong> dari <strong>{records.length}</strong> data pelanggaran
            </span>
            {(searchTerm || filterSeverity !== 'Semua' || filterClass !== 'Semua' || filterStatus !== 'Semua' || filterBalance !== 'Semua') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterSeverity('Semua');
                  setFilterClass('Semua');
                  setFilterStatus('Semua');
                  setFilterBalance('Semua');
                  if (onClearExternalFilter) onClearExternalFilter();
                }}
                className="text-indigo-600 hover:text-indigo-800 underline font-medium cursor-pointer"
              >
                Reset Semua Filter
              </button>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            Klik baris untuk rincian sisa saldo disiplin & pembinaan BK
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 uppercase font-semibold">
            <tr>
              <th className="py-3 px-3 w-12 text-center">No</th>
              <th className="py-3 px-3 w-28">Tanggal & Waktu</th>
              <th className="py-3 px-3 w-48">Nama Siswa & Saldo</th>
              <th className="py-3 px-2.5 w-20 min-w-[76px] text-center whitespace-nowrap">Kelas</th>
              <th className="py-3 px-3">Jenis Pelanggaran</th>
              <th className="py-3 px-3 w-28 text-center">Poin & Sisa Saldo</th>
              <th className="py-3 px-3">Sanksi yang Diberikan</th>
              <th className="py-3 px-3 w-36">Guru Pelapor</th>
              <th className="py-3 px-3 w-36 text-center">Status Sanksi</th>
              <th className="py-3 px-3 w-28 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((item, index) => {
                const isExpanded = expandedRowId === item.id;
                const balance = studentBalancesMap.get(item.namaSiswa.trim().toUpperCase());
                const isCritical = balance && balance.levelInfo.level === 'Kritis';
                const isWarning = balance && balance.levelInfo.level === 'Peringatan';

                // Color accent for severity or balance criticality
                const severityColor = isCritical
                  ? 'border-l-4 border-l-rose-600 bg-rose-50/15'
                  : isWarning
                  ? 'border-l-4 border-l-orange-500 bg-orange-50/10'
                  : item.kategori === 'Berat'
                  ? 'border-l-4 border-l-rose-500'
                  : item.kategori === 'Sedang'
                  ? 'border-l-4 border-l-amber-500'
                  : 'border-l-4 border-l-emerald-500';

                // Status styling
                const statusBadge =
                  item.statusSanksi === 'Selesai'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : item.statusSanksi === 'Menunggu Pemanggilan Ortu'
                    ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                    : item.statusSanksi === 'Sedang Berjalan'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200';

                return (
                  <React.Fragment key={item.id}>
                    <tr
                      onClick={() => toggleExpand(item.id)}
                      className={`hover:bg-slate-50/90 transition-colors cursor-pointer ${severityColor} ${
                        isExpanded ? 'bg-indigo-50/20' : ''
                      }`}
                    >
                      {/* No */}
                      <td className="py-3 px-3 text-center text-slate-500 font-mono">
                        {index + 1}
                      </td>

                      {/* Tanggal & Waktu */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{item.tanggal}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {item.waktu}
                        </div>
                      </td>

                      {/* Nama Siswa & Saldo */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {item.namaSiswa}
                          <span className="text-[10px] text-slate-500 font-normal">
                            ({item.jenisKelamin === 'L' ? 'L' : 'P'})
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          NISN: {item.nisn || studentNisnMap.get(item.namaSiswa.trim().toUpperCase()) || '-'}
                        </div>
                        {balance && (
                          <div className="w-24 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div 
                              className={`h-full ${balance.levelInfo.barColor}`} 
                              style={{ width: `${Math.max(5, balance.persentaseSisa)}%` }}
                            />
                          </div>
                        )}
                      </td>

                      {/* Kelas */}
                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded text-[11px] whitespace-nowrap inline-block">
                          {item.kelas}
                        </span>
                      </td>

                      {/* Jenis Pelanggaran */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 leading-tight">
                          {item.jenisPelanggaran}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span
                            className={
                              item.kategori === 'Berat'
                                ? 'text-rose-700 font-medium'
                                : item.kategori === 'Sedang'
                                ? 'text-amber-700 font-medium'
                                : 'text-emerald-700 font-medium'
                            }
                          >
                            Tingkat {item.kategori}
                          </span>
                          <span>&bull;</span>
                          <span className="truncate max-w-[180px]">{item.tempatKejadian}</span>
                        </div>
                      </td>

                      {/* Poin & Sisa Saldo */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-extrabold text-xs text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                            -{item.poin} Poin
                          </span>
                          {balance && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 border ${balance.levelInfo.badgeBg} ${balance.levelInfo.badgeText} ${balance.levelInfo.badgeBorder}`}>
                              Sisa {balance.sisaSaldo}/{INITIAL_DISCIPLINE_BALANCE}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Sanksi yang Diberikan */}
                      <td className="py-3 px-3">
                        <div className="text-slate-800 font-medium leading-snug">
                          {item.sanksi}
                        </div>
                        {item.tenggatSanksi && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Batas: {item.tenggatSanksi}
                          </div>
                        )}
                      </td>

                      {/* Guru Pelapor */}
                      <td className="py-3 px-3 text-slate-600">
                        <div className="text-[11px] font-medium text-slate-800">{item.guruPelapor}</div>
                        <div className="text-[10px] text-slate-500">BK: {item.guruBK}</div>
                      </td>

                      {/* Status Sanksi */}
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={item.statusSanksi}
                          onChange={(e) => onToggleStatus(item.id, e.target.value as SanctionStatus)}
                          className={`text-[11px] font-medium px-2 py-1 rounded-md focus:outline-hidden cursor-pointer ${statusBadge}`}
                        >
                          <option value="Belum Ditindaklanjuti">Belum Ditindaklanjuti</option>
                          <option value="Sedang Berjalan">Sedang Berjalan</option>
                          <option value="Menunggu Pemanggilan Ortu">Panggilan Ortu</option>
                          <option value="Selesai">Selesai</option>
                        </select>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          {/* Surat Panggilan / SP */}
                          <button
                            title="Buat Surat Panggilan Orang Tua / SP"
                            onClick={() => onGenerateLetter(item)}
                            className="p-1.5 text-indigo-700 hover:bg-indigo-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            title="Edit Catatan Pelanggaran"
                            onClick={() => onEdit(item)}
                            className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            title="Hapus Catatan"
                            onClick={() => {
                              if (window.confirm(`Hapus catatan pelanggaran untuk ${item.namaSiswa}?`)) {
                                onDelete(item.id);
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Expand arrow */}
                          <button
                            onClick={() => toggleExpand(item.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* EXPANDED DETAIL ROW */}
                    {isExpanded && (
                      <tr className="bg-slate-50/90 border-b border-slate-200">
                        <td colSpan={10} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                            {/* Card 1: Waktu & Lokasi */}
                            <div className="space-y-1">
                              <span className="font-semibold text-slate-700 block uppercase tracking-wider text-[10px]">
                                Lokasi & Waktu Kejadian
                              </span>
                              <p className="text-slate-800">
                                <strong>Tempat:</strong> {item.tempatKejadian}
                              </p>
                              <p className="text-slate-800">
                                <strong>Waktu:</strong> {item.tanggal} ({item.waktu})
                              </p>
                              <p className="text-slate-800">
                                <strong>Pencatat:</strong> {item.guruPelapor}
                              </p>
                            </div>

                            {/* Card 2: Sanksi & Tenggat */}
                            <div className="space-y-1">
                              <span className="font-semibold text-slate-700 block uppercase tracking-wider text-[10px]">
                                Rincian Sanksi & Konseling
                              </span>
                              <p className="text-slate-800">
                                <strong>Sanksi:</strong> {item.sanksi}
                              </p>
                              <p className="text-slate-800">
                                <strong>Guru BK:</strong> {item.guruBK}
                              </p>
                              <p className="text-slate-800">
                                <strong>Tenggat:</strong> {item.tenggatSanksi || 'Tidak ditentukan'}
                              </p>
                            </div>

                            {/* Card 3: Status Saldo Siswa (200 Poin System) */}
                            <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                              <span className="font-bold text-slate-900 block uppercase tracking-wider text-[10px] flex items-center justify-between">
                                <span>Saldo Poin Disiplin</span>
                                {balance && (
                                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${balance.levelInfo.badgeBg} ${balance.levelInfo.badgeText}`}>
                                    {balance.levelInfo.level}
                                  </span>
                                )}
                              </span>
                              {balance ? (
                                <>
                                  <div className="flex items-baseline justify-between mt-1">
                                    <span className="text-slate-500 text-[11px]">Sisa Saldo:</span>
                                    <span className="font-extrabold text-sm text-slate-900">
                                      {balance.sisaSaldo} / {INITIAL_DISCIPLINE_BALANCE} Poin
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden my-1">
                                    <div 
                                      className={`h-full ${balance.levelInfo.barColor}`} 
                                      style={{ width: `${Math.max(5, balance.persentaseSisa)}%` }}
                                    />
                                  </div>
                                  <p className="text-[11px] text-slate-600">
                                    Total terpotong: <strong className="text-rose-600">-{balance.totalPoinTerpotong} Poin</strong> ({balance.jumlahPelanggaran} kasus)
                                  </p>
                                  <p className="text-[10px] text-slate-500 border-t border-slate-100 pt-1 mt-1">
                                    {balance.levelInfo.rekomendasiTindakan}
                                  </p>
                                </>
                              ) : (
                                <p className="text-slate-500">Saldo utuh 200 Poin</p>
                              )}
                            </div>

                            {/* Card 4: Catatan Pembinaan & Panggilan */}
                            <div className="space-y-1">
                              <span className="font-semibold text-slate-700 block uppercase tracking-wider text-[10px]">
                                Catatan Pembinaan Guru BK
                              </span>
                              <div className="p-2.5 bg-white border border-slate-200 rounded-md text-slate-700 italic text-[11px]">
                                {item.catatanPembinaan || 'Belum ada catatan khusus pembinaan konseling.'}
                              </div>
                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={() => onGenerateLetter(item)}
                                  className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5" /> Cetak Surat Panggilan Ortu / SP
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-500">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <div className="font-medium text-slate-700">Tidak ada data catatan pelanggaran yang sesuai</div>
                  <div className="text-xs text-slate-400 mt-0.5">Coba ubah kata kunci pencarian atau sesuaikan pilihan filter saldo/kelas</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
