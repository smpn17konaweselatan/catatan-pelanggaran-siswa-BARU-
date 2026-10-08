import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table linked with Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('guru'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Students master data table (Data Induk Siswa)
export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  nisn: text('nisn').notNull().unique(),
  nama: text('nama').notNull(),
  jenisKelamin: text('jenis_kelamin').notNull(), // 'L' or 'P'
  kelas: text('kelas').notNull(), // e.g. 'VII-A', 'VIII-B', 'IX-C'
  alamat: text('alamat'),
  namaOrangTua: text('nama_orang_tua'),
  kontakOrangTua: text('kontak_orang_tua'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Violation records table (Buku Catatan Pelanggaran Siswa)
export const violations = pgTable('violations', {
  id: text('id').primaryKey(), // e.g. 'VIO-2026-001'
  tanggal: text('tanggal').notNull(), // YYYY-MM-DD
  waktu: text('waktu').notNull(), // HH:mm
  studentNisn: text('student_nisn').references(() => students.nisn, { onDelete: 'cascade' }),
  namaSiswa: text('nama_siswa').notNull(),
  jenisKelamin: text('jenis_kelamin').notNull(), // 'L' | 'P'
  kelas: text('kelas').notNull(),
  kategori: text('kategori').notNull(), // 'Ringan' | 'Sedang' | 'Berat'
  jenisPelanggaran: text('jenis_pelanggaran').notNull(),
  poin: integer('poin').notNull().default(5),
  sanksi: text('sanksi').notNull(),
  tempatKejadian: text('tempat_kejadian').default('Lingkungan Sekolah'),
  guruPelapor: text('guru_pelapor').notNull(),
  guruBk: text('guru_bk').notNull(),
  statusSanksi: text('status_sanksi').notNull().default('Belum Ditindaklanjuti'),
  catatanPembinaan: text('catatan_pembinaan'),
  tenggatSanksi: text('tenggat_sanksi'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// School profile & official letterhead configuration
export const schoolProfile = pgTable('school_profile', {
  id: serial('id').primaryKey(),
  namaSekolah: text('nama_sekolah').notNull(),
  npsn: text('npsn'),
  alamat: text('alamat').notNull(),
  kelurahanKecamatan: text('kelurahan_kecamatan'),
  kabupatenKota: text('kabupaten_kota').notNull(),
  provinsi: text('provinsi'),
  kodePos: text('kode_pos'),
  namaKepalaSekolah: text('nama_kepala_sekolah').notNull(),
  nipKepalaSekolah: text('nip_kepala_sekolah'),
  namaGuruBk: text('nama_guru_bk').notNull(),
  nipGuruBk: text('nip_guru_bk'),
  namaWakasekKesiswaan: text('nama_wakasek_kesiswaan'),
  nipWakasekKesiswaan: text('nip_wakasek_kesiswaan'),
  updatedAt: timestamp('updated_at').defaultNow(),
});
