import React, { useMemo } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { ViolationRecord, SchoolProfile } from '../types/violation';
import { calculateStudentBalances, INITIAL_DISCIPLINE_BALANCE } from '../utils/balanceCalculator';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: ViolationRecord[];
  profile: SchoolProfile;
  filterTitle?: string;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  records,
  profile,
  filterTitle
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDateIndo = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long'
  }).format(new Date());

  const studentBalances = useMemo(() => {
    return calculateStudentBalances(records);
  }, [records]);

  const studentBalanceMap = useMemo(() => {
    const map = new Map<string, typeof studentBalances[0]>();
    for (const s of studentBalances) {
      map.set(s.namaSiswa.trim().toUpperCase(), s);
    }
    return map;
  }, [studentBalances]);

  const kritisCount = studentBalances.filter(s => s.levelInfo.level === 'Kritis').length;
  const peringatanCount = studentBalances.filter(s => s.levelInfo.level === 'Peringatan').length;
  const perhatianCount = studentBalances.filter(s => s.levelInfo.level === 'Perhatian').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">
              Pratinjau Format Cetak Dokumen Resmi Sekolah
            </h3>
            <p className="text-xs text-slate-500">
              Format buku rekapitulasi data pelanggaran siswa siap cetak (Kertas A4 / Folio)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Cetak / Simpan PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="p-8 overflow-y-auto flex-1 bg-white text-slate-900 font-sans print:p-0 print:overflow-visible print:m-0">
          {/* KOP SURAT SEKOLAH */}
          <div className="border-b-4 border-double border-slate-900 pb-3 mb-4 text-center">
            <h4 className="text-xs uppercase tracking-widest font-semibold text-slate-800">
              PEMERINTAH {profile.kabupatenKota.toUpperCase()}
            </h4>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-800">
              DINAS PENDIDIKAN DAN KEBUDAYAAN
            </h4>
            <h2 className="text-lg font-bold uppercase tracking-wider text-slate-950 mt-0.5">
              {profile.namaSekolah}
            </h2>
            <p className="text-[11px] text-slate-600">
              {profile.alamat}, {profile.kelurahanKecamatan}, {profile.kabupatenKota}, {profile.provinsi} {profile.kodePos ? `Kode Pos ${profile.kodePos}` : ''}
            </p>
            {profile.npsn && (
              <p className="text-[11px] text-slate-600 font-mono">
                NPSN: {profile.npsn}
              </p>
            )}
          </div>

          {/* DOKUMEN TITLE */}
          <div className="text-center my-4">
            <h3 className="text-sm font-bold uppercase underline tracking-wider text-slate-900">
              BUKU REKAPITULASI CATATAN PELANGGARAN TATA TERTIB SISWA
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              {filterTitle || 'Tahun Ajaran 2026/2027'} &bull; Dicetak per tanggal: {currentDateIndo}
            </p>
          </div>

          {/* TABLE OF VIOLATIONS */}
          <div className="overflow-x-auto my-4">
            <table className="w-full text-left text-[11px] border border-slate-800 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-800">
                  <th className="border border-slate-800 px-2 py-1.5 text-center w-8">No</th>
                  <th className="border border-slate-800 px-2 py-1.5 text-center w-20">Tanggal</th>
                  <th className="border border-slate-800 px-2 py-1.5 w-24">NISN / NIS</th>
                  <th className="border border-slate-800 px-2 py-1.5">Nama Siswa</th>
                  <th className="border border-slate-800 px-1 py-1.5 text-center w-8">L/P</th>
                  <th className="border border-slate-800 px-2 py-1.5 text-center w-12">Kelas</th>
                  <th className="border border-slate-800 px-2 py-1.5">Jenis Pelanggaran</th>
                  <th className="border border-slate-800 px-1 py-1.5 text-center w-10">Poin</th>
                  <th className="border border-slate-800 px-1 py-1.5 text-center w-14">Sisa Saldo</th>
                  <th className="border border-slate-800 px-2 py-1.5">Sanksi yang Diberikan</th>
                  <th className="border border-slate-800 px-2 py-1.5 w-24">Guru Pelapor</th>
                  <th className="border border-slate-800 px-2 py-1.5 text-center w-20">Status Sanksi</th>
                </tr>
              </thead>
              <tbody>
                {records.length > 0 ? (
                  records.map((item, index) => {
                    const balance = studentBalanceMap.get(item.namaSiswa.trim().toUpperCase());
                    const sisa = balance ? balance.sisaSaldo : INITIAL_DISCIPLINE_BALANCE;
                    const isKritis = sisa <= 50;
                    const isPeringatan = sisa > 50 && sisa <= 100;

                    return (
                      <tr key={item.id} className="border-b border-slate-800">
                        <td className="border border-slate-800 px-2 py-1 text-center font-medium">
                          {index + 1}
                        </td>
                        <td className="border border-slate-800 px-2 py-1 text-center whitespace-nowrap">
                          {item.tanggal}
                        </td>
                        <td className="border border-slate-800 px-2 py-1 font-mono text-[10px]">
                          {item.nisn}
                        </td>
                        <td className="border border-slate-800 px-2 py-1 font-semibold text-slate-900">
                          {item.namaSiswa}
                        </td>
                        <td className="border border-slate-800 px-1 py-1 text-center font-medium">
                          {item.jenisKelamin}
                        </td>
                        <td className="border border-slate-800 px-2 py-1 text-center font-bold">
                          {item.kelas}
                        </td>
                        <td className="border border-slate-800 px-2 py-1 leading-snug">
                          <span className="font-medium">{item.jenisPelanggaran}</span>
                          {item.kategori && (
                            <span className="text-[10px] text-slate-500 block">({item.kategori})</span>
                          )}
                        </td>
                        <td className="border border-slate-800 px-1 py-1 text-center font-bold text-rose-700">
                          -{item.poin}
                        </td>
                        <td className="border border-slate-800 px-1 py-1 text-center font-bold">
                          <span className={isKritis ? 'text-red-700 underline font-black' : isPeringatan ? 'text-amber-800 font-extrabold' : 'text-slate-800'}>
                            {sisa}
                          </span>
                        </td>
                        <td className="border border-slate-800 px-2 py-1 leading-snug">
                          {item.sanksi}
                        </td>
                        <td className="border border-slate-800 px-2 py-1 text-[10px]">
                          {item.guruPelapor}
                        </td>
                        <td className="border border-slate-800 px-2 py-1 text-center text-[10px] font-medium">
                          {item.statusSanksi}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={12} className="border border-slate-800 px-3 py-6 text-center text-slate-500">
                      Tidak ada data catatan pelanggaran yang tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* STATS SUMMARY RECAP */}
          <div className="my-3 text-[11px] text-slate-700 border border-slate-300 p-2.5 rounded bg-slate-50 print:bg-white print:border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center font-semibold">
              <div>
                Total Catatan: <strong>{records.length} kasus</strong> &bull; Total Poin Terpotong: <strong>-{records.reduce((acc, curr) => acc + (Number(curr.poin) || 0), 0)} Poin</strong>
              </div>
              <div>
                Ringan: <strong>{records.filter(r => r.kategori === 'Ringan').length}</strong> | 
                Sedang: <strong>{records.filter(r => r.kategori === 'Sedang').length}</strong> | 
                Berat: <strong>{records.filter(r => r.kategori === 'Berat').length}</strong>
              </div>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 pt-1 text-[10px]">
              <div>
                <strong>Sistem Saldo Disiplin (Modal Awal: {INITIAL_DISCIPLINE_BALANCE} Poin/Siswa):</strong>
              </div>
              <div className="space-x-3">
                <span>Kritis (≤50 Poin): <strong className="text-red-700">{kritisCount} siswa</strong></span>
                <span>Peringatan (51-100 Poin): <strong className="text-amber-700">{peringatanCount} siswa</strong></span>
                <span>Perhatian (101-150 Poin): <strong>{perhatianCount} siswa</strong></span>
              </div>
            </div>
          </div>

          {/* OFFICIAL SIGNATURES SECTION */}
          <div className="mt-8 pt-4 grid grid-cols-3 gap-6 text-center text-xs break-inside-avoid">
            <div>
              <p className="text-slate-600">Mengetahui,</p>
              <p className="font-semibold text-slate-900">Wakil Kepala Sekolah Bid. Kesiswaan</p>
              <div className="h-20"></div>
              <p className="font-bold underline text-slate-900">{profile.namaWakasekKesiswaan}</p>
              <p className="text-[11px] text-slate-600">NIP. {profile.nipWakasekKesiswaan || '-'}</p>
            </div>

            <div>
              <p className="text-slate-600">Penyusun Catatan,</p>
              <p className="font-semibold text-slate-900">Guru Bimbingan Konseling (BK)</p>
              <div className="h-20"></div>
              <p className="font-bold underline text-slate-900">{profile.namaGuruBK}</p>
              <p className="text-[11px] text-slate-600">NIP. {profile.nipGuruBK || '-'}</p>
            </div>

            <div>
              <p className="text-slate-600">
                {profile.kabupatenKota.replace('Kabupaten ', '')}, {currentDateIndo}
              </p>
              <p className="font-semibold text-slate-900">Kepala Sekolah</p>
              <div className="h-20"></div>
              <p className="font-bold underline text-slate-900">{profile.namaKepalaSekolah}</p>
              <p className="text-[11px] text-slate-600">NIP. {profile.nipKepalaSekolah || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
