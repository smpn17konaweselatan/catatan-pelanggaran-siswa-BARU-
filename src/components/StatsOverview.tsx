import React from 'react';
import { ViolationRecord } from '../types/violation';
import { INITIAL_DISCIPLINE_BALANCE, calculateStudentBalances } from '../utils/balanceCalculator';
import { ShieldAlert, AlertTriangle, Clock, Award, Users, Activity, TrendingDown } from 'lucide-react';

interface StatsOverviewProps {
  records: ViolationRecord[];
  onSelectFilterCategory?: (category: string) => void;
  onSelectFilterStatus?: (status: string) => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  records,
  onSelectFilterCategory,
  onSelectFilterStatus
}) => {
  const totalCount = records.length;
  const totalPoinTerpotong = records.reduce((sum, r) => sum + (Number(r.poin) || 0), 0);
  const pendingOrtuCount = records.filter(r => r.statusSanksi === 'Menunggu Pemanggilan Ortu').length;
  const selesaiCount = records.filter(r => r.statusSanksi === 'Selesai').length;

  const studentBalances = calculateStudentBalances(records);
  const kritisCount = studentBalances.filter(s => s.levelInfo.level === 'Kritis').length;
  const peringatanCount = studentBalances.filter(s => s.levelInfo.level === 'Peringatan').length;
  const lowestBalanceStudent = studentBalances[0];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* 1. Modal Kuota Saldo Awal */}
      <div className="bg-linear-to-br from-indigo-900 to-indigo-950 text-white rounded-xl p-3.5 shadow-xs border border-indigo-800">
        <div className="flex items-center justify-between text-indigo-300 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider">Modal Saldo Siswa</span>
          <Activity className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="text-2xl font-black text-white tracking-tight">
          {INITIAL_DISCIPLINE_BALANCE}
          <span className="text-xs font-normal text-indigo-300 ml-1">Poin</span>
        </div>
        <div className="text-[11px] text-indigo-200 mt-1">
          Diberikan di awal tahun ajaran
        </div>
      </div>

      {/* 2. Total Kasus & Penyelesaian */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider">Total Kasus</span>
          <Users className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-2xl font-bold text-slate-900">{totalCount}</div>
        <div className="text-[11px] text-slate-500 mt-1">
          {selesaiCount} kasus tuntas dibina
        </div>
      </div>

      {/* 3. Total Poin Pelanggaran Terpotong */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider text-rose-700">Total Terpotong</span>
          <TrendingDown className="w-4 h-4 text-rose-500" />
        </div>
        <div className="text-2xl font-bold text-rose-600">
          -{totalPoinTerpotong}
          <span className="text-xs font-normal text-slate-500 ml-1">Poin</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          Dari seluruh catatan aktif
        </div>
      </div>

      {/* 4. Siswa Saldo Kritis (<= 50) */}
      <div className="bg-white border border-rose-200 rounded-xl p-3.5 shadow-2xs bg-rose-50/20">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Saldo Kritis (≤50)</span>
          <ShieldAlert className="w-4 h-4 text-rose-500" />
        </div>
        <div className="text-2xl font-extrabold text-rose-600">
          {kritisCount}
          <span className="text-xs font-normal text-slate-500 ml-1">Siswa</span>
        </div>
        <div className="text-[11px] text-rose-600/90 font-medium mt-1">
          Wajib SP 3 / Skorsing
        </div>
      </div>

      {/* 5. Siswa Saldo Peringatan (51 - 100) */}
      <div className="bg-white border border-orange-200 rounded-xl p-3.5 shadow-2xs bg-orange-50/20">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-700">Peringatan (51-100)</span>
          <AlertTriangle className="w-4 h-4 text-orange-500" />
        </div>
        <div className="text-2xl font-extrabold text-orange-600">
          {peringatanCount}
          <span className="text-xs font-normal text-slate-500 ml-1">Siswa</span>
        </div>
        <div className="text-[11px] text-orange-600/90 font-medium mt-1">
          Wajib SP 2 & Panggil Ortu
        </div>
      </div>

      {/* 6. Siswa Saldo Terendah Saat Ini */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-600">Saldo Terendah</span>
          <Award className="w-4 h-4 text-amber-500" />
        </div>
        {lowestBalanceStudent ? (
          <div>
            <div className="text-sm font-bold text-slate-900 truncate" title={lowestBalanceStudent.namaSiswa}>
              {lowestBalanceStudent.namaSiswa}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1">
              <span>Kelas {lowestBalanceStudent.kelas}</span>
              <span className="font-extrabold text-rose-600">
                Sisa {lowestBalanceStudent.sisaSaldo} Poin
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 mt-2">Semua saldo utuh 200</div>
        )}
      </div>
    </div>
  );
};
