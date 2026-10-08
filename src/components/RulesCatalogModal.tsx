import React, { useState } from 'react';
import { X, BookOpen, AlertTriangle, ShieldCheck, Search, Filter } from 'lucide-react';
import { STANDARD_RULES_CATALOG, POINT_THRESHOLD_GUIDELINES } from '../data/rulesCatalog';
import { ViolationSeverity } from '../types/violation';

interface RulesCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRule?: (rule: typeof STANDARD_RULES_CATALOG[0]) => void;
}

export const RulesCatalogModal: React.FC<RulesCatalogModalProps> = ({
  isOpen,
  onClose,
  onSelectRule
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<'Semua' | ViolationSeverity>('Semua');
  const [activeTab, setActiveTab] = useState<'katalog' | 'akumulasi'>('katalog');

  if (!isOpen) return null;

  const filteredRules = STANDARD_RULES_CATALOG.filter((item) => {
    const matchSearch =
      item.jenisPelanggaran.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rekomendasiSanksi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.deskripsi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterSeverity === 'Semua' || item.kategori === filterSeverity;
    return matchSearch && matchCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">
                Katalog Panduan Tata Tertib & Bobot Poin Sanksi
              </h3>
              <p className="text-xs text-slate-500">
                Pedoman baku klasifikasi pelanggaran siswa, sistem poin, dan sanksi pembinaan edukatif
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 flex items-center gap-4 bg-white">
          <button
            onClick={() => setActiveTab('katalog')}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors relative ${
              activeTab === 'katalog'
                ? 'text-indigo-700 border-b-2 border-indigo-700'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Daftar Jenis Pelanggaran ({STANDARD_RULES_CATALOG.length})
          </button>
          <button
            onClick={() => setActiveTab('akumulasi')}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors relative ${
              activeTab === 'akumulasi'
                ? 'text-indigo-700 border-b-2 border-indigo-700'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Tahapan Akumulasi Poin & Sanksi
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'katalog' ? (
            <>
              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari jenis pelanggaran atau sanksi..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                  />
                </div>

                <div className="flex items-center gap-1 self-start sm:self-auto">
                  <span className="text-xs text-slate-500 mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Tingkat:
                  </span>
                  {(['Semua', 'Ringan', 'Sedang', 'Berat'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterSeverity(cat)}
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                        filterSeverity === cat
                          ? 'bg-indigo-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 w-16">Kode</th>
                      <th className="py-2.5 px-3 w-24">Kategori</th>
                      <th className="py-2.5 px-3">Jenis Pelanggaran & Deskripsi</th>
                      <th className="py-2.5 px-3 w-16 text-center">Poin</th>
                      <th className="py-2.5 px-3">Rekomendasi Sanksi Edukatif</th>
                      {onSelectRule && <th className="py-2.5 px-3 w-20 text-center">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRules.length > 0 ? (
                      filteredRules.map((rule) => {
                        const badgeColor =
                          rule.kategori === 'Berat'
                            ? 'text-rose-700 bg-rose-50 border border-rose-200'
                            : rule.kategori === 'Sedang'
                            ? 'text-amber-700 bg-amber-50 border border-amber-200'
                            : 'text-emerald-700 bg-emerald-50 border border-emerald-200';

                        return (
                          <tr key={rule.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-500">
                              {rule.id}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${badgeColor}`}>
                                {rule.kategori}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <p className="font-semibold text-slate-800">{rule.jenisPelanggaran}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">{rule.deskripsi}</p>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="font-bold text-slate-800">{rule.poinDefault}</span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              {rule.rekomendasiSanksi}
                            </td>
                            {onSelectRule && (
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelectRule(rule);
                                    onClose();
                                  }}
                                  className="px-2.5 py-1 text-[11px] font-medium text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
                                >
                                  Pilih
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={onSelectRule ? 6 : 5} className="py-8 text-center text-slate-400">
                          Tidak ditemukan jenis pelanggaran yang sesuai dengan pencarian.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <p className="font-semibold">Ketentuan Akumulasi Poin Pelanggaran</p>
                  <p>
                    Setiap pelanggaran yang dilakukan siswa akan diakumulasikan selama satu tahun ajaran berjalan.
                    Pencatatan dilakukan secara kolaboratif oleh Guru Piket, Wali Kelas, Tim Kesiswaan, dan Guru Bimbingan Konseling (BK).
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4 w-32">Rentang Poin</th>
                      <th className="py-3 px-4 w-64">Tindakan / Sanksi Sekolah</th>
                      <th className="py-3 px-4">Keterangan & Prosedur Tindak Lanjut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {POINT_THRESHOLD_GUIDELINES.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {item.rentangPoin}
                        </td>
                        <td className="py-3 px-4 font-semibold text-indigo-950">
                          {item.tindakan}
                        </td>
                        <td className="py-3 px-4 text-slate-600 leading-relaxed">
                          {item.keterangan}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 text-xs text-slate-600 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Prinsip Sanksi Edukatif dan Restoratif
                </div>
                <p>
                  1. Sanksi yang diberikan mengedepankan pembinaan karakter, tanggung jawab moral, dan perbaikan perilaku (restorative justice).
                </p>
                <p>
                  2. Dilarang keras memberikan sanksi fisik yang mencederai kesehatan atau merendahkan martabat kemanusiaan siswa.
                </p>
                <p>
                  3. Setiap sanksi dan konseling wajib dibuktikan dengan tanda tangan siswa, guru BK, dan wali kelas dalam Buku Catatan Pelanggaran Siswa.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
