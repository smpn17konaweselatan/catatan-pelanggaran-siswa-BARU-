import { ViolationRecord } from '../types/violation';

export function exportViolationsToCSV(records: ViolationRecord[], filename = 'Buku_Catatan_Pelanggaran_Siswa.csv') {
  const headers = [
    'No',
    'Tanggal Pelanggaran',
    'Waktu',
    'NISN',
    'Nama Siswa',
    'L/P',
    'Kelas',
    'Kategori',
    'Jenis Pelanggaran',
    'Poin',
    'Sanksi yang Diberikan',
    'Tempat Kejadian',
    'Guru Pelapor',
    'Guru BK',
    'Status Sanksi',
    'Catatan Pembinaan'
  ];

  const escapeCSV = (val: string | number | undefined) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = records.map((r, index) => [
    index + 1,
    escapeCSV(r.tanggal),
    escapeCSV(r.waktu),
    escapeCSV(r.nisn),
    escapeCSV(r.namaSiswa),
    escapeCSV(r.jenisKelamin),
    escapeCSV(r.kelas),
    escapeCSV(r.kategori),
    escapeCSV(r.jenisPelanggaran),
    r.poin,
    escapeCSV(r.sanksi),
    escapeCSV(r.tempatKejadian),
    escapeCSV(r.guruPelapor),
    escapeCSV(r.guruBK),
    escapeCSV(r.statusSanksi),
    escapeCSV(r.catatanPembinaan || '')
  ].join(','));

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadBlankTemplateCSV() {
  const headers = [
    'No',
    'Tanggal Pelanggaran (YYYY-MM-DD)',
    'Waktu (HH:MM)',
    'NISN',
    'Nama Siswa',
    'L/P',
    'Kelas',
    'Kategori (Ringan/Sedang/Berat)',
    'Jenis Pelanggaran',
    'Poin',
    'Sanksi yang Diberikan',
    'Tempat Kejadian',
    'Guru Pelapor',
    'Guru BK',
    'Status Sanksi (Selesai/Sedang Berjalan/Menunggu Pemanggilan Ortu/Belum Ditindaklanjuti)',
    'Catatan Pembinaan'
  ];

  const sampleRow = [
    '1',
    '2026-10-01',
    '07:30',
    '0098765432',
    'Contoh Nama Siswa',
    'L',
    'VIII-A',
    'Ringan',
    'Terlambat Masuk Sekolah',
    '5',
    'Teguran lisan dan menyiram tanaman',
    'Gerbang Sekolah',
    'Nama Guru Piket',
    'Nama Guru BK',
    'Selesai',
    'Komitmen datang lebih awal'
  ].map(v => `"${v}"`).join(',');

  const csvContent = '\uFEFF' + [headers.join(','), sampleRow].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Template_Format_Data_Pelanggaran_Siswa.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
