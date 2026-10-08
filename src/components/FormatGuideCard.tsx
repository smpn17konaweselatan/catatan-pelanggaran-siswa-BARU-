import React, { useState } from 'react';
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Scale, 
  BookMarked,
  Activity,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { INITIAL_DISCIPLINE_BALANCE } from '../utils/balanceCalculator';

export const FormatGuideCard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden mb-6">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
            <BookMarked className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Pedoman Sistem Saldo 200 Poin & Mekanisme Pengurangan Poin Disiplin
              </h3>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                Standar BK & Kesiswaan
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Penjelasan struktur modal saldo disiplin 200 poin, batas ambang kritis (SP 1, SP 2, SP 3), dan fokus perhatian pembinaan siswa
            </p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600 p-1">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-4">
          {/* Mekanisme Saldo Poin 200 */}
          <div>
            <h4 className="font-semibold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              1. Mekanisme Kuota Saldo Disiplin ({INITIAL_DISCIPLINE_BALANCE} Poin Awal Siswa):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Tingkat Aman */}
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between font-bold text-emerald-800 mb-1">
                  <span>1. Kategori Aman</span>
                  <span className="text-[11px] bg-emerald-100 px-1.5 py-0.5 rounded">&gt; 150 Poin</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Siswa berdisiplin baik (terpotong &lt; 50 poin). Pembinaan berupa apresiasi, motivasi, atau teguran lisan ringan oleh wali kelas.
                </p>
              </div>

              {/* Tingkat Perhatian */}
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between font-bold text-amber-800 mb-1">
                  <span>2. Perhatian (SP 1)</span>
                  <span className="text-[11px] bg-amber-100 px-1.5 py-0.5 rounded">101 – 150 Poin</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Siswa terpotong 50–99 poin. Diberikan Surat Peringatan I (SP 1), konseling individual di Ruang BK, dan surat komitmen tertulis.
                </p>
              </div>

              {/* Tingkat Peringatan Keras */}
              <div className="p-3 bg-orange-50/70 rounded-xl border border-orange-200">
                <div className="flex items-center justify-between font-bold text-orange-800 mb-1">
                  <span>3. Peringatan (SP 2)</span>
                  <span className="text-[11px] bg-orange-100 px-1.5 py-0.5 rounded">51 – 100 Poin</span>
                </div>
                <p className="text-[11px] text-orange-700 leading-relaxed">
                  Siswa terpotong 100–149 poin. Diterbitkan Surat Peringatan II (SP 2) dan <strong>wajib pemanggilan resmi orang tua/wali</strong> ke sekolah.
                </p>
              </div>

              {/* Tingkat Kritis */}
              <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200">
                <div className="flex items-center justify-between font-bold text-rose-800 mb-1">
                  <span>4. Kritis (SP 3)</span>
                  <span className="text-[11px] bg-rose-100 px-1.5 py-0.5 rounded">≤ 50 Poin</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  Siswa terpotong ≥ 150 poin. Dilakukan Sidang Pleno Dewan Guru, Skorsing sementara belajar di rumah, atau SP Terakhir.
                </p>
              </div>
            </div>
          </div>

          {/* Kolom Data Wajib */}
          <div>
            <h4 className="font-semibold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              2. Kolom Data Wajib dalam Buku Catatan Pelanggaran Siswa:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">A. Identitas Waktu & Kejadian</span>
                <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-600">
                  <li><strong>Tanggal Pelanggaran:</strong> Hari, tanggal, bulan, tahun terjadinya pelanggaran.</li>
                  <li><strong>Waktu Kejadian:</strong> Jam pelaksanaan saat pelanggaran terjadi (KBM/Piket).</li>
                  <li><strong>Tempat Kejadian:</strong> Ruang kelas, gerbang, kantin, lab, atau luar pagar.</li>
                </ul>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">B. Identitas Siswa & Pelanggaran</span>
                <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-600">
                  <li><strong>Nama Lengkap & NIS:</strong> Identitas resmi siswa pada data master sekolah.</li>
                  <li><strong>Kelas & Rombel:</strong> Tingkat kelas dan rombongan belajar (VII, VIII, IX).</li>
                  <li><strong>Jenis Pelanggaran:</strong> Aturan spesifik yang dilanggar (Ringan, Sedang, Berat).</li>
                  <li><strong>Bobot Poin:</strong> Angka pengurangan saldo kedisiplinan siswa (5 - 100 poin).</li>
                </ul>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">C. Sanksi & Pembinaan Edukatif</span>
                <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-600">
                  <li><strong>Sanksi yang Diberikan:</strong> Tindakan edukatif terukur yang harus dijalankan.</li>
                  <li><strong>Guru Pelapor & Guru BK:</strong> Petugas pencatat dan konselor pendamping.</li>
                  <li><strong>Status & Catatan Konseling:</strong> Monitoring ketuntasan pembinaan sikap.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Pedoman Sanksi Edukatif */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-lg flex items-start gap-3">
            <Scale className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-slate-700">
              <span className="font-bold text-slate-900 block mb-0.5">Prinsip Sanksi Edukatif & Ramah Anak (Permendikbudristek No. 46 Tahun 2023):</span>
              Sanksi kedisiplinan bertujuan membina dan mendidik karakter, bukan hukuman fisik atau mempermalukan siswa. Sanksi diarahkan pada kegiatan konstruktif seperti tugas literasi di perpustakaan, konseling motivasi BK, bakti sosial lingkungan sekolah, dan kesepakatan damai bermaterai bersama orang tua.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
