import { RuleCatalogItem, SchoolProfile } from '../types/violation';

export const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  namaSekolah: 'SMP NEGERI 17 KONAWE SELATAN',
  npsn: '40403819',
  alamat: 'Jl. Poros Pendidikan No. 17',
  kelurahanKecamatan: 'Kec. Buke',
  kabupatenKota: 'Kabupaten Konawe Selatan',
  provinsi: 'Sulawesi Tenggara',
  kodePos: '93385',
  namaKepalaSekolah: 'Drs. H. Mulyadi, M.Pd.',
  nipKepalaSekolah: '19740512 199903 1 004',
  namaGuruBK: 'Siti Rahmawati, S.Pd., Kons.',
  nipGuruBK: '19820815 200801 2 011',
  namaWakasekKesiswaan: 'Ahmad Faisal, S.Pd.',
  nipWakasekKesiswaan: '19800310 200501 1 008',
};

export const STANDARD_RULES_CATALOG: RuleCatalogItem[] = [
  // Pelanggaran Ringan (5 - 15 Poin)
  {
    id: 'R-01',
    kategori: 'Ringan',
    jenisPelanggaran: 'Terlambat Masuk Sekolah (<15 menit)',
    poinDefault: 5,
    rekomendasiSanksi: 'Teguran lisan & pencatatan di buku piket harian',
    deskripsi: 'Siswa tiba di sekolah setelah bel masuk berbunyi (07.15).'
  },
  {
    id: 'R-02',
    kategori: 'Ringan',
    jenisPelanggaran: 'Atribut Seragam Tidak Lengkap (Dasi/Topi/Kaos Kaki/Sabuk)',
    poinDefault: 5,
    rekomendasiSanksi: 'Teguran lisan & pembinaan kedisiplinan oleh wali kelas',
    deskripsi: 'Tidak mengenakan seragam sesuai hari atau kelengkapan atribut upacara/harian.'
  },
  {
    id: 'R-03',
    kategori: 'Ringan',
    jenisPelanggaran: 'Rambut Tidak Rapi / Tidak Sesuai Ketentuan Sekolah',
    poinDefault: 10,
    rekomendasiSanksi: 'Pemberian batas waktu 2 hari untuk potong rambut rapi (3-2-1 cm)',
    deskripsi: 'Bagi siswa putra rambut gondrong, diberi warna/cat, atau potongan tidak rapi.'
  },
  {
    id: 'R-04',
    kategori: 'Ringan',
    jenisPelanggaran: 'Membuang Sampah Sembarangan di Lingkungan Sekolah',
    poinDefault: 5,
    rekomendasiSanksi: 'Tugas edukatif membersihkan area koridor/halaman selama 15 menit',
    deskripsi: 'Membuang bungkus makanan atau minuman tidak pada tempat sampah.'
  },
  {
    id: 'R-05',
    kategori: 'Ringan',
    jenisPelanggaran: 'Tidak Mengerjakan Tugas / PR Sekolah Tanpa Alasan Sah',
    poinDefault: 10,
    rekomendasiSanksi: 'Mengerjakan tugas rangkap saat jam istirahat di bawah bimbingan guru mapel',
    deskripsi: 'Tidak mengumpulkan tugas pelajaran secara berulang.'
  },
  {
    id: 'R-06',
    kategori: 'Ringan',
    jenisPelanggaran: 'Makan / Minum di Ruang Kelas Saat KBM Berlangsung',
    poinDefault: 5,
    rekomendasiSanksi: 'Teguran lisan dan merapikan ruang kelas setelah pembelajaran selesai',
    deskripsi: 'Makan camilan atau minum tanpa izin guru pengajar saat jam pelajaran.'
  },

  // Pelanggaran Sedang (15 - 35 Poin)
  {
    id: 'S-01',
    kategori: 'Sedang',
    jenisPelanggaran: 'Membolos Jam Pelajaran Tertentu Tanpa Izin Guru',
    poinDefault: 20,
    rekomendasiSanksi: 'Tugas pembinaan edukatif, konseling BK, dan pemberitahuan wali kelas',
    deskripsi: 'Berada di kantin, toilet, atau luar kelas saat jam pelajaran tanpa surat izin.'
  },
  {
    id: 'S-02',
    kategori: 'Sedang',
    jenisPelanggaran: 'Menggunakan Handphone saat KBM Tanpa Izin Guru',
    poinDefault: 15,
    rekomendasiSanksi: 'HP diamankan di ruang BK selama 3 hari & diambil oleh orang tua',
    deskripsi: 'Bermain game, media sosial, atau menonton video di kelas saat pembelajaran.'
  },
  {
    id: 'S-03',
    kategori: 'Sedang',
    jenisPelanggaran: 'Keluar Lingkungan Sekolah Tanpa Izin (Lompat Pagar/Kabur)',
    poinDefault: 25,
    rekomendasiSanksi: 'Surat Peringatan I (SP 1) & Pemanggilan Orang Tua ke Ruang BK',
    deskripsi: 'Meninggalkan sekolah sebelum bel pulang tanpa izin petugas piket/guru BK.'
  },
  {
    id: 'S-04',
    kategori: 'Sedang',
    jenisPelanggaran: 'Berkata Kotor / Tidak Sopan kepada Teman atau Guru',
    poinDefault: 20,
    rekomendasiSanksi: 'Bimbingan perilaku intensif oleh Guru BK & membuat surat pernyataan maaf',
    deskripsi: 'Mengucapkan kata-kata kasar, mencela, atau bersikap tidak santun.'
  },
  {
    id: 'S-05',
    kategori: 'Sedang',
    jenisPelanggaran: 'Merusak Sarana & Prasarana Sekolah (Meja, Kursi, Dinding)',
    poinDefault: 30,
    rekomendasiSanksi: 'Mengganti/memperbaiki kerusakan & sanksi sosial membersihkan fasilitas',
    deskripsi: 'Mencoret-coret meja/tembok, memecahkan kaca, atau merusak alat peraga.'
  },
  {
    id: 'S-06',
    kategori: 'Sedang',
    jenisPelanggaran: 'Perundungan / Bullying Verbal (Mengejek, Mengintimidasi Teman)',
    poinDefault: 35,
    rekomendasiSanksi: 'Pemanggilan Orang Tua, Konseling Khusus BK, & Penandatanganan Komitmen Damai',
    deskripsi: 'Melakukan intimidasi verbal, body shaming, atau pengucilan terhadap siswa lain.'
  },

  // Pelanggaran Berat (50 - 100 Poin)
  {
    id: 'B-01',
    kategori: 'Berat',
    jenisPelanggaran: 'Membawa / Menghisap Rokok atau Vape di Lingkungan Sekolah',
    poinDefault: 50,
    rekomendasiSanksi: 'Surat Peringatan II (SP 2), Pemanggilan Orang Tua, & Skorsing 3 Hari',
    deskripsi: 'Kedapatan membawa rokok/rokok elektrik, korek, atau merokok di dalam/sekitar sekolah.'
  },
  {
    id: 'B-02',
    kategori: 'Berat',
    jenisPelanggaran: 'Berkelahi / Terlibat Tawuran Antar Pelajar',
    poinDefault: 75,
    rekomendasiSanksi: 'Surat Peringatan Keras (SP 2/3), Pemanggilan Orang Tua, & Skorsing 5 Hari',
    deskripsi: 'Melakukan kontak fisik kekerasan atau tawuran baik di dalam maupun di luar sekolah.'
  },
  {
    id: 'B-03',
    kategori: 'Berat',
    jenisPelanggaran: 'Membawa Senjata Tajam / Benda Berbahaya Tanpa Izin Kegiatan',
    poinDefault: 80,
    rekomendasiSanksi: 'Penyitaan benda berbahaya, pemanggilan orang tua segera, & penanganan kasus',
    deskripsi: 'Membawa pisau, gir, badik, ketapel berbahaya, atau senjata tajam lainnya.'
  },
  {
    id: 'B-04',
    kategori: 'Berat',
    jenisPelanggaran: 'Membawa / Mengonsumsi Minuman Keras atau Narkoba',
    poinDefault: 100,
    rekomendasiSanksi: 'Rapat Dewan Guru & Dikembalikan kepada Orang Tua / Pihak Berwajib',
    deskripsi: 'Kedapatan memiliki, membawa, mengedarkan, atau mengonsumsi zat terlarang.'
  },
  {
    id: 'B-05',
    kategori: 'Berat',
    jenisPelanggaran: 'Melakukan Tindak Pencurian Barang Milik Teman / Sekolah',
    poinDefault: 60,
    rekomendasiSanksi: 'Mengembalikan barang curian, Surat Peringatan II, & Pemanggilan Orang Tua',
    deskripsi: 'Mengambil barang milik orang lain atau sarana sekolah tanpa hak.'
  },
  {
    id: 'B-06',
    kategori: 'Berat',
    jenisPelanggaran: 'Menyebarkan Konten Asusila / Pornografi di Media Sosial/HP',
    poinDefault: 75,
    rekomendasiSanksi: 'Pemanggilan Orang Tua, Konseling Mendalam, & Perjanjian Khusus Terakhir',
    deskripsi: 'Menyimpan, mendistribusikan gambar/video tidak senonoh atau pencemaran nama baik.'
  }
];

export const POINT_THRESHOLD_GUIDELINES = [
  {
    rentangPoin: '10 - 25 Poin',
    tindakan: 'Peringatan Lisan & Pembinaan oleh Wali Kelas',
    keterangan: 'Pemberitahuan kepada wali kelas dan pembinaan disiplin ringan.'
  },
  {
    rentangPoin: '26 - 45 Poin',
    tindakan: 'Surat Peringatan I (SP 1) & Konseling BK',
    keterangan: 'Konseling terjadwal dengan Guru Bimbingan Konseling dan tugas edukatif.'
  },
  {
    rentangPoin: '46 - 70 Poin',
    tindakan: 'Surat Peringatan II (SP 2) & Pemanggilan Orang Tua I',
    keterangan: 'Orang tua/wali diundang ke sekolah untuk menandatangani berita acara pembinaan.'
  },
  {
    rentangPoin: '71 - 90 Poin',
    tindakan: 'Surat Peringatan Terakhir (SP 3) & Skorsing Edukatif',
    keterangan: 'Siswa dibina di rumah selama 3-5 hari kalender dengan tugas mandiri.'
  },
  {
    rentangPoin: '≥ 100 Poin',
    tindakan: 'Rapat Pleno Dewan Guru & Dikembalikan ke Orang Tua',
    keterangan: 'Siswa diserahkan kembali pembinaannya kepada orang tua / wali murid.'
  }
];
