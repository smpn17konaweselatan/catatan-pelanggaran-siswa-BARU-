import React, { useState } from 'react';
import { X, Printer, FileText } from 'lucide-react';
import { ViolationRecord, SchoolProfile } from '../types/violation';
import { getStudentBalance, INITIAL_DISCIPLINE_BALANCE } from '../utils/balanceCalculator';

interface PrintLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ViolationRecord | null;
  profile: SchoolProfile;
  records?: ViolationRecord[];
}

export const PrintLetterModal: React.FC<PrintLetterModalProps> = ({
  isOpen,
  onClose,
  record,
  profile,
  records = []
}) => {
  const [letterType, setLetterType] = useState<'panggilan' | 'peringatan'>('panggilan');
  const [meetingDate, setMeetingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [meetingTime, setMeetingTime] = useState('08:30');
  const [meetingRoom, setMeetingRoom] = useState('Ruang Bimbingan Konseling (BK)');
  const [letterNumber, setLetterNumber] = useState('421.3 / 114 / BK / 2026');

  if (!isOpen || !record) return null;

  const balance = getStudentBalance(record.namaSiswa, records.length > 0 ? records : [record]);

  const handlePrint = () => {
    window.print();
  };

  const currentDateIndo = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long'
  }).format(new Date());

  const formattedMeetingDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(meetingDate));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Controls Bar */}
        <div className="px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 print:hidden">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700 uppercase">Jenis Surat:</span>
            <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setLetterType('panggilan')}
                className={`px-3 py-1 font-medium rounded-md transition-colors ${
                  letterType === 'panggilan'
                    ? 'bg-white text-indigo-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Surat Panggilan Orang Tua
              </button>
              <button
                onClick={() => setLetterType('peringatan')}
                className={`px-3 py-1 font-medium rounded-md transition-colors ${
                  letterType === 'peringatan'
                    ? 'bg-white text-indigo-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Surat Pernyataan / Peringatan (SP)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Cetak Surat Resmi
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Input Parameters for Letter */}
        <div className="px-6 py-2 bg-indigo-50/50 border-b border-indigo-100 flex flex-wrap gap-4 text-xs print:hidden">
          <div className="flex items-center gap-1.5">
            <label className="text-slate-600 font-medium">No. Surat:</label>
            <input
              type="text"
              value={letterNumber}
              onChange={(e) => setLetterNumber(e.target.value)}
              className="border border-slate-300 rounded px-2 py-0.5 text-xs bg-white w-44"
            />
          </div>
          {letterType === 'panggilan' && (
            <>
              <div className="flex items-center gap-1.5">
                <label className="text-slate-600 font-medium">Tanggal Pertemuan:</label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-0.5 text-xs bg-white"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-slate-600 font-medium">Waktu:</label>
                <input
                  type="text"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-0.5 text-xs bg-white w-24"
                  placeholder="08:30 WITA"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-slate-600 font-medium">Tempat:</label>
                <input
                  type="text"
                  value={meetingRoom}
                  onChange={(e) => setMeetingRoom(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-0.5 text-xs bg-white w-48"
                />
              </div>
            </>
          )}
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto flex-1 bg-white text-slate-900 font-serif leading-relaxed text-sm print:p-0 print:overflow-visible print:text-[12pt]">
          {/* KOP RESMI */}
          <div className="border-b-4 border-double border-slate-900 pb-3 mb-6 text-center font-sans">
            <h4 className="text-xs uppercase tracking-widest font-semibold text-slate-800">
              PEMERINTAH {profile.kabupatenKota.toUpperCase()}
            </h4>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-800">
              DINAS PENDIDIKAN DAN KEBUDAYAAN
            </h4>
            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-950 mt-0.5">
              {profile.namaSekolah}
            </h2>
            <p className="text-[11px] text-slate-600 font-serif italic">
              {profile.alamat}, {profile.kelurahanKecamatan}, {profile.kabupatenKota}, {profile.provinsi}
            </p>
          </div>

          {letterType === 'panggilan' ? (
            /* SURAT PANGGILAN ORANG TUA */
            <div className="space-y-4 font-serif">
              <div className="flex justify-between items-start text-xs font-sans">
                <div>
                  <p>Nomor : {letterNumber}</p>
                  <p>Lampiran : -</p>
                  <p>Hal : <strong>Surat Panggilan Orang Tua / Wali Siswa</strong></p>
                </div>
                <div className="text-right">
                  <p>{profile.kabupatenKota.replace('Kabupaten ', '')}, {currentDateIndo}</p>
                  <p className="mt-2 text-slate-700">Kepada Yth.</p>
                  <p className="font-bold">Bapak / Ibu Orang Tua / Wali dari:</p>
                  <p className="font-semibold underline">{record.namaSiswa} (Kelas {record.kelas})</p>
                  <p>di Tempat</p>
                </div>
              </div>

              <div className="pt-2">
                <p>Dengan hormat,</p>
                <p className="mt-2 text-justify indent-8">
                  Sehubungan dengan adanya catatan pelanggaran tata tertib dan kedisiplinan sekolah yang dilakukan oleh putra/putri Bapak/Ibu, yakni:
                </p>

                <div className="my-3 pl-8 text-xs font-sans space-y-1 bg-slate-50 p-3 border border-slate-200 rounded">
                  <p><strong>Nama Siswa:</strong> {record.namaSiswa}</p>
                  <p><strong>NIS / Kelas:</strong> {record.nisn} / Kelas {record.kelas} ({record.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'})</p>
                  <p><strong>Tanggal Kejadian:</strong> {record.tanggal} (Pukul {record.waktu})</p>
                  <p><strong>Jenis Pelanggaran:</strong> {record.jenisPelanggaran} (Tingkat {record.kategori})</p>
                  <p><strong>Potongan Poin Kasus Ini:</strong> -{record.poin} Poin</p>
                  <p><strong>Sisa Saldo Poin Disiplin Siswa:</strong> <strong className="text-slate-950 underline">{balance.sisaSaldo} / {INITIAL_DISCIPLINE_BALANCE} Poin</strong> ({balance.levelInfo.statusLabel})</p>
                  <p><strong>Sanksi / Tindak Lanjut:</strong> {record.sanksi}</p>
                </div>

                <p className="text-justify indent-8">
                  Maka demi kebaikan pembinaan perkembangan karakter serta kelancaran proses belajar siswa yang bersangkutan, kami mengharapkan kehadiran Bapak/Ibu Orang Tua/Wali pada:
                </p>

                <div className="my-3 pl-8 text-xs font-sans space-y-1">
                  <p><strong>Hari, Tanggal:</strong> {formattedMeetingDate}</p>
                  <p><strong>Waktu:</strong> Pukul {meetingTime}</p>
                  <p><strong>Tempat:</strong> {meetingRoom}</p>
                  <p><strong>Bertemu dengan:</strong> Guru Bimbingan Konseling ({profile.namaGuruBK}) & Wali Kelas {record.kelas}</p>
                </div>

                <p className="mt-3 text-justify indent-8">
                  Mengingat pentingnya pembinaan ini bagi kelangsungan pendidikan putra/putri Bapak/Ibu, kami sangat mengharapkan kehadiran tepat pada waktunya tanpa diwakilkan. Atas perhatian dan kerja sama yang baik, kami ucapkan terima kasih.
                </p>
              </div>

              {/* Signatures */}
              <div className="mt-10 pt-4 grid grid-cols-2 gap-8 text-center text-xs font-sans break-inside-avoid">
                <div>
                  <p className="text-slate-600">Guru Bimbingan Konseling,</p>
                  <div className="h-20"></div>
                  <p className="font-bold underline text-slate-900">{profile.namaGuruBK}</p>
                  <p className="text-[11px] text-slate-600">NIP. {profile.nipGuruBK || '-'}</p>
                </div>

                <div>
                  <p className="text-slate-600">Mengetahui,</p>
                  <p className="font-semibold text-slate-900">Kepala Sekolah</p>
                  <div className="h-20"></div>
                  <p className="font-bold underline text-slate-900">{profile.namaKepalaSekolah}</p>
                  <p className="text-[11px] text-slate-600">NIP. {profile.nipKepalaSekolah || '-'}</p>
                </div>
              </div>
            </div>
          ) : (
            /* SURAT PERNYATAAN / PERINGATAN SISWA */
            <div className="space-y-4 font-serif">
              <div className="text-center mb-6">
                <h3 className="text-base font-bold uppercase underline tracking-wider font-sans">
                  SURAT PERNYATAAN & PERJANJIAN KEDISIPLINAN SISWA
                </h3>
                <p className="text-xs text-slate-600 font-sans mt-0.5">
                  Nomor: {letterNumber}
                </p>
              </div>

              <p>Yang bertanda tangan di bawah ini:</p>

              <div className="pl-6 space-y-1 text-xs font-sans">
                <p><strong>Nama Lengkap:</strong> {record.namaSiswa}</p>
                <p><strong>Nomor Induk Siswa (NISN):</strong> {record.nisn}</p>
                <p><strong>Kelas / Jurusan:</strong> {record.kelas}</p>
                <p><strong>Sekolah:</strong> {profile.namaSekolah}</p>
              </div>

              <p className="mt-3 text-justify indent-8">
                Dengan ini menyatakan dengan sesungguhnya bahwa saya telah melakukan pelanggaran terhadap tata tertib sekolah, yaitu:
              </p>

              <div className="p-3 my-2 bg-slate-50 border border-slate-200 text-xs font-sans rounded">
                <p><strong>Tanggal Kejadian:</strong> {record.tanggal} (Pukul {record.waktu})</p>
                <p><strong>Jenis Pelanggaran:</strong> {record.jenisPelanggaran} ({record.kategori} - {record.poin} Poin)</p>
                <p><strong>Sanksi yang Diterima:</strong> {record.sanksi}</p>
              </div>

              <p className="text-justify indent-8">
                Saya mengakui kesalahan tersebut, bersedia menjalankan sanksi edukatif yang ditetapkan sekolah dengan penuh tanggung jawab, serta berjanji tidak akan mengulangi perbuatan tersebut maupun perbuatan yang melanggar tata tertib sekolah lainnya.
              </p>

              <p className="text-justify indent-8">
                Apabila di kemudian hari saya mengulangi pelanggaran atau melakukan pelanggaran tata tertib lainnya, maka saya bersedia menerima sanksi yang lebih berat sesuai dengan ketentuan peraturan tata tertib sekolah yang berlaku, hingga sanksi dikembalikan kepada orang tua/wali saya.
              </p>

              <p className="mt-2 text-justify">
                Demikian surat pernyataan ini saya buat dengan sebenarnya dalam keadaan sadar dan tanpa paksaan dari pihak manapun.
              </p>

              {/* 3-Party Signatures */}
              <div className="mt-8 pt-4 grid grid-cols-3 gap-4 text-center text-xs font-sans break-inside-avoid">
                <div>
                  <p className="text-slate-600">Orang Tua / Wali Siswa,</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline text-slate-900">( ........................................ )</p>
                </div>

                <div>
                  <p className="text-slate-600">
                    {profile.kabupatenKota.replace('Kabupaten ', '')}, {currentDateIndo}
                  </p>
                  <p className="text-slate-600">Siswa yang Menyatakan,</p>
                  <div className="h-16 flex items-center justify-center text-[10px] text-slate-400">
                    (Tanda Tangan)
                  </div>
                  <p className="font-bold underline text-slate-900">{record.namaSiswa}</p>
                </div>

                <div>
                  <p className="text-slate-600">Guru Bimbingan Konseling,</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline text-slate-900">{profile.namaGuruBK}</p>
                  <p className="text-[11px] text-slate-600">NIP. {profile.nipGuruBK || '-'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
