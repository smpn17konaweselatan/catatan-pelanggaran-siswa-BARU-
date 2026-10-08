export type ViolationSeverity = 'Ringan' | 'Sedang' | 'Berat';

export type SanctionStatus = 
  | 'Selesai' 
  | 'Sedang Berjalan' 
  | 'Menunggu Pemanggilan Ortu' 
  | 'Belum Ditindaklanjuti';

export interface ViolationRecord {
  id: string;
  tanggal: string; // YYYY-MM-DD
  waktu: string; // HH:mm
  nisn: string;
  namaSiswa: string;
  jenisKelamin: 'L' | 'P';
  kelas: string; // e.g., 'VII-A', 'VIII-B', 'IX-C'
  kategori: ViolationSeverity;
  jenisPelanggaran: string;
  poin: number;
  sanksi: string;
  tempatKejadian: string;
  guruPelapor: string;
  guruBK: string;
  statusSanksi: SanctionStatus;
  catatanPembinaan?: string;
  tenggatSanksi?: string;
}

export interface RuleCatalogItem {
  id: string;
  kategori: ViolationSeverity;
  jenisPelanggaran: string;
  poinDefault: number;
  rekomendasiSanksi: string;
  deskripsi: string;
}

export interface SchoolProfile {
  namaSekolah: string;
  npsn: string;
  alamat: string;
  kelurahanKecamatan: string;
  kabupatenKota: string;
  provinsi: string;
  kodePos: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  namaGuruBK: string;
  nipGuruBK: string;
  namaWakasekKesiswaan: string;
  nipWakasekKesiswaan: string;
}
