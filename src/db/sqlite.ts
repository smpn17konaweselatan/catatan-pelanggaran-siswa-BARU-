import initSqlJs from 'sql.js';
import type { Database, SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';
import type { ViolationRecord, SchoolProfile, SanctionStatus, ViolationSeverity, StudentMasterItem, TeacherMasterItem } from '../types/violation.ts';

const DB_FILE_PATH = path.resolve(process.cwd(), 'buku_pelanggaran_sekolah.db');

/**
 * Detect delimiter for CSV file: checks whether semicolon ';', comma ',', or tab '\t' is dominant.
 */
export function detectCsvDelimiter(text: string): string {
  const lines = text.split(/\r?\n/).slice(0, 5).filter(l => l.trim().length > 0);
  let semicolonCount = 0;
  let commaCount = 0;
  let tabCount = 0;

  for (const line of lines) {
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') inQuotes = !inQuotes;
      else if (!inQuotes) {
        if (c === ';') semicolonCount++;
        else if (c === ',') commaCount++;
        else if (c === '\t') tabCount++;
      }
    }
  }

  if (semicolonCount >= commaCount && semicolonCount > 0) return ';';
  if (tabCount > commaCount && tabCount > 0) return '\t';
  return ',';
}

/**
 * Robust CSV line parser supporting custom delimiter, quotes, and escaped quotes.
 */
export function parseCsvLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function getMasterCsvPath(baseName: string): string | null {
  const primary = path.resolve(process.cwd(), `src/format_data/${baseName}.csv`);
  if (fs.existsSync(primary)) return primary;
  const fallback = path.resolve(process.cwd(), `src/db/${baseName}.csv`);
  if (fs.existsSync(fallback)) return fallback;
  return null;
}

/**
 * Reads master students strictly from CSV (/src/format_data/siswa.csv).
 * Format .xlsx is no longer supported to eliminate version sync and delimiter incompatibilities.
 */
export function loadMasterStudents(): StudentMasterItem[] {
  try {
    const csvPath = getMasterCsvPath('siswa');
    if (!csvPath) return [];

    let content = fs.readFileSync(csvPath, 'utf-8');
    content = content.replace(/^\uFEFF/, '');
    const delimiter = detectCsvDelimiter(content);
    const lines = content.trim().split(/\r?\n/);

    if (lines.length > 1) {
      const headerParts = parseCsvLine(lines[0], delimiter).map(h => h.toLowerCase());
      const nisIdx = headerParts.findIndex(h => h === 'nis');
      const nisnIdx = headerParts.findIndex(h => h.includes('nisn'));
      const namaIdx = headerParts.findIndex(h => h.includes('nama'));
      const jkIdx = headerParts.findIndex(h => h.includes('kelamin') || h === 'jk' || h === 'l/p');
      const kelasIdx = headerParts.findIndex(h => h.includes('kelas') || h.includes('rombel'));

      const actualNisIdx = nisIdx >= 0 ? nisIdx : 0;
      const actualNisnIdx = nisnIdx >= 0 ? nisnIdx : 1;
      const actualNamaIdx = namaIdx >= 0 ? namaIdx : 2;
      const actualJkIdx = jkIdx >= 0 ? jkIdx : 3;
      const actualKelasIdx = kelasIdx >= 0 ? kelasIdx : 4;

      const list: StudentMasterItem[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        let parts = parseCsvLine(line, delimiter);
        if (parts.length < 5 && delimiter !== ';') {
          const semi = parseCsvLine(line, ';');
          if (semi.length >= 5) parts = semi;
        } else if (parts.length < 5 && delimiter !== ',') {
          const comm = parseCsvLine(line, ',');
          if (comm.length >= 5) parts = comm;
        }
        const nama = (parts[actualNamaIdx] || '').trim();
        if (!nama || nama.toLowerCase() === 'nama' || nama.toLowerCase() === 'nama siswa') continue;

        const jkRaw = (parts[actualJkIdx] || 'L').trim().toUpperCase();
        list.push({
          nis: (parts[actualNisIdx] || '').trim(),
          nisn: (parts[actualNisnIdx] || '').trim(),
          nama,
          jenisKelamin: (jkRaw.startsWith('P') ? 'P' : 'L') as 'L' | 'P',
          kelas: (parts[actualKelasIdx] || 'VII-A').trim()
        });
      }
      return list;
    }
  } catch (err) {
    console.error('[SQLite] Gagal membaca master siswa (.csv):', err);
  }
  return [];
}

/**
 * Reads master teachers strictly from CSV (/src/format_data/guru.csv).
 * Format .xlsx is no longer supported to eliminate version sync and delimiter incompatibilities.
 */
export function loadMasterTeachers(): TeacherMasterItem[] {
  try {
    const csvPath = getMasterCsvPath('guru');
    if (!csvPath) return [];

    let content = fs.readFileSync(csvPath, 'utf-8');
    content = content.replace(/^\uFEFF/, ''); // Remove BOM if present
    const delimiter = detectCsvDelimiter(content);
    const lines = content.trim().split(/\r?\n/);

    if (lines.length > 1) {
      const headerParts = parseCsvLine(lines[0], delimiter).map(h => h.toLowerCase());
      const nipIdx = headerParts.findIndex(h => h.includes('nip'));
      const namaIdx = headerParts.findIndex(h => h.includes('nama') || h.includes('guru'));
      const jabatanIdx = headerParts.findIndex(h => h.includes('jabatan') || h.includes('mapel') || h.includes('tugas'));
      const peranIdx = headerParts.findIndex(h => h.includes('peran') || h.includes('status'));

      const actualNipIdx = nipIdx >= 0 ? nipIdx : 0;
      const actualNamaIdx = namaIdx >= 0 ? namaIdx : 1;
      const actualJabatanIdx = jabatanIdx >= 0 ? jabatanIdx : 2;
      const actualPeranIdx = peranIdx >= 0 ? peranIdx : 3;

      const list: TeacherMasterItem[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        let parts = parseCsvLine(line, delimiter);
        if (parts.length < 4 && delimiter !== ';') {
          const semi = parseCsvLine(line, ';');
          if (semi.length >= 4) parts = semi;
        } else if (parts.length < 4 && delimiter !== ',') {
          const comm = parseCsvLine(line, ',');
          if (comm.length >= 4) parts = comm;
        }
        const nama = (parts[actualNamaIdx] || '').trim();
        if (!nama || nama.toLowerCase() === 'nama' || nama.toLowerCase() === 'nama guru') continue;

        list.push({
          nip: (parts[actualNipIdx] || '-').trim(),
          nama,
          jabatan: (parts[actualJabatanIdx] || 'Guru Mata Pelajaran').trim(),
          peran: (parts[actualPeranIdx] || 'Guru Pelapor').trim()
        });
      }
      return list;
    }
  } catch (err) {
    console.error('[SQLite] Gagal membaca master guru (.csv):', err);
  }
  return [];
}

// Aliases for backward compatibility
export const loadMasterStudentsFromCsv = loadMasterStudents;
export const loadMasterTeachersFromCsv = loadMasterTeachers;

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

// Initialize or open existing SQLite file on disk
export async function getSqliteDb(): Promise<Database> {
  if (db) return db;

  if (!SQL) {
    SQL = await initSqlJs();
  }

  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE_PATH);
      db = new SQL.Database(fileBuffer);
      console.log(`[SQLite] Database dimuat dari file lokal: ${DB_FILE_PATH}`);
    } catch (e) {
      console.error('[SQLite] Gagal membaca file database yang ada, membuat database baru...', e);
      db = new SQL.Database();
    }
  } else {
    console.log(`[SQLite] Membuat file database baru di: ${DB_FILE_PATH}`);
    db = new SQL.Database();
  }

  // Ensure tables exist
  ensureTables(db);
  saveDatabaseToDisk(db);
  return db;
}

// Write the SQLite database in-memory state to physical .db file
export function saveDatabaseToDisk(database: Database): void {
  try {
    const data = database.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE_PATH, buffer);
  } catch (err) {
    console.error('[SQLite] Gagal menyimpan database ke disk:', err);
  }
}

// Get raw DB buffer for download
export async function getDatabaseFileBuffer(): Promise<Buffer> {
  const database = await getSqliteDb();
  saveDatabaseToDisk(database);
  return fs.readFileSync(DB_FILE_PATH);
}

// Restore database from uploaded buffer
export async function restoreDatabaseFromFile(buffer: Buffer): Promise<void> {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  db = new SQL.Database(buffer);
  ensureTables(db);
  saveDatabaseToDisk(db);
  console.log('[SQLite] Database berhasil dipulihkan dari file .db');
}

// Ensure database schema and initial seed
function ensureTables(database: Database): void {
  database.run(`
    CREATE TABLE IF NOT EXISTS school_profile (
      id INTEGER PRIMARY KEY,
      nama_sekolah TEXT NOT NULL,
      npsn TEXT,
      alamat TEXT NOT NULL,
      kelurahan_kecamatan TEXT,
      kabupaten_kota TEXT NOT NULL,
      provinsi TEXT,
      kode_pos TEXT,
      nama_kepala_sekolah TEXT NOT NULL,
      nip_kepala_sekolah TEXT,
      nama_guru_bk TEXT NOT NULL,
      nip_guru_bk TEXT,
      nama_wakasek_kesiswaan TEXT,
      nip_wakasek_kesiswaan TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nis TEXT,
      nisn TEXT NOT NULL UNIQUE,
      nama TEXT NOT NULL,
      jenis_kelamin TEXT NOT NULL,
      kelas TEXT NOT NULL,
      alamat TEXT,
      nama_orang_tua TEXT,
      kontak_orang_tua TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nip TEXT,
      nama TEXT NOT NULL,
      jabatan TEXT,
      peran TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS violations (
      id TEXT PRIMARY KEY,
      tanggal TEXT NOT NULL,
      waktu TEXT NOT NULL,
      student_nisn TEXT,
      nama_siswa TEXT NOT NULL,
      jenis_kelamin TEXT NOT NULL,
      kelas TEXT NOT NULL,
      kategori TEXT NOT NULL,
      jenis_pelanggaran TEXT NOT NULL,
      poin INTEGER NOT NULL DEFAULT 5,
      sanksi TEXT NOT NULL,
      tempat_kejadian TEXT DEFAULT 'Lingkungan Sekolah',
      guru_pelapor TEXT NOT NULL,
      guru_bk TEXT NOT NULL,
      status_sanksi TEXT NOT NULL DEFAULT 'Belum Ditindaklanjuti',
      catatan_pembinaan TEXT,
      tenggat_sanksi TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_nisn) REFERENCES students(nisn) ON DELETE CASCADE
    );
  `);

  // Seed default school profile if empty
  const profileCount = database.exec('SELECT COUNT(*) as count FROM school_profile;');
  if (!profileCount[0] || !profileCount[0].values[0] || Number(profileCount[0].values[0][0]) === 0) {
    database.run(`
      INSERT INTO school_profile (
        id, nama_sekolah, npsn, alamat, kelurahan_kecamatan, kabupaten_kota, provinsi, kode_pos,
        nama_kepala_sekolah, nip_kepala_sekolah, nama_guru_bk, nip_guru_bk, nama_wakasek_kesiswaan, nip_wakasek_kesiswaan
      ) VALUES (
        1, 'SMP NEGERI 17 KONAWE SELATAN', '40403819', 'Jl. Poros Pendidikan No. 17', 'Kec. Buke',
        'Kabupaten Konawe Selatan', 'Sulawesi Tenggara', '93385', 'Drs. H. Mulyadi, M.Pd.',
        '19740512 199903 1 004', 'Siti Rahmawati, S.Pd., Kons.', '19820815 200801 2 011',
        'Ahmad Faisal, S.Pd.', '19800310 200501 1 008'
      );
    `);
  }

  // Seed students from master data if count is low
  const studentsCount = database.exec('SELECT COUNT(*) as count FROM students;');
  if (!studentsCount[0] || !studentsCount[0].values[0] || Number(studentsCount[0].values[0][0]) < 20) {
    const masterStudents = loadMasterStudentsFromCsv();
    const insertStudent = database.prepare(`
      INSERT OR REPLACE INTO students (nis, nisn, nama, jenis_kelamin, kelas)
      VALUES ($nis, $nisn, $nama, $jenis_kelamin, $kelas);
    `);
    for (const s of masterStudents) {
      insertStudent.run({
        $nis: s.nis,
        $nisn: s.nisn,
        $nama: s.nama,
        $jenis_kelamin: s.jenisKelamin,
        $kelas: s.kelas
      });
    }
    insertStudent.free();
  }

  // Seed teachers from master data if empty
  const teachersCount = database.exec('SELECT COUNT(*) as count FROM teachers;');
  if (!teachersCount[0] || !teachersCount[0].values[0] || Number(teachersCount[0].values[0][0]) === 0) {
    const masterTeachers = loadMasterTeachersFromCsv();
    const insertTeacher = database.prepare(`
      INSERT OR REPLACE INTO teachers (nip, nama, jabatan, peran)
      VALUES ($nip, $nama, $jabatan, $peran);
    `);
    for (const t of masterTeachers) {
      insertTeacher.run({
        $nip: t.nip,
        $nama: t.nama,
        $jabatan: t.jabatan,
        $peran: t.peran
      });
    }
    insertTeacher.free();
  }

  // Seed default sample violations if empty
  const violationsCount = database.exec('SELECT COUNT(*) as count FROM violations;');
  if (!violationsCount[0] || !violationsCount[0].values[0] || Number(violationsCount[0].values[0][0]) === 0) {
    database.run(`
      INSERT OR IGNORE INTO violations (id, tanggal, waktu, student_nisn, nama_siswa, jenis_kelamin, kelas, kategori, jenis_pelanggaran, poin, sanksi, tempat_kejadian, guru_pelapor, guru_bk, status_sanksi, catatan_pembinaan, tenggat_sanksi) VALUES
      ('VIO-2026-001', '2026-09-28', '07:25', '0098721455', 'Rian Pratama', 'L', 'VIII-A', 'Ringan', 'Terlambat Masuk Sekolah (<15 menit)', 5, 'Teguran lisan & menyiram tanaman taman depan kantor', 'Gerbang Depan Sekolah', 'Drs. Supardi (Guru Piket)', 'Siti Rahmawati, S.Pd., Kons.', 'Selesai', 'Siswa berjanji bangun lebih awal dan mempersiapkan seragam malam sebelumnya.', '2026-09-28'),
      ('VIO-2026-002', '2026-09-28', '10:15', '0104523981', 'Bayu Saputra', 'L', 'IX-B', 'Sedang', 'Menggunakan Handphone saat KBM Tanpa Izin Guru', 15, 'HP diamankan di Ruang BK selama 3 hari & diambil oleh orang tua', 'Ruang Kelas IX-B', 'Nurhasanah, S.Pd. (Guru Matematika)', 'Siti Rahmawati, S.Pd., Kons.', 'Menunggu Pemanggilan Ortu', 'Siswa asyik main game Mobile Legends saat penjelasan materi rumus segitiga.', '2026-10-02'),
      ('VIO-2026-003', '2026-09-29', '08:45', '0112349082', 'Dimas Anggara', 'L', 'IX-A', 'Sedang', 'Membolos Jam Pelajaran Tertentu Tanpa Izin Guru', 20, 'Tugas pembinaan edukatif, konseling BK, dan membuat resume buku di perpustakaan', 'Kantin Belakang Sekolah', 'Herman, S.Pd. (Guru Piket)', 'Siti Rahmawati, S.Pd., Kons.', 'Sedang Berjalan', 'Ditemukan sedang duduk nongkrong di warung belakang sekolah saat jam IPA berlangsung.', '2026-10-03'),
      ('VIO-2026-004', '2026-09-29', '07:10', '0129847120', 'Aulia Rahmawati', 'P', 'VII-C', 'Ringan', 'Atribut Seragam Tidak Lengkap (Dasi/Topi/Kaos Kaki/Sabuk)', 5, 'Teguran lisan & pembinaan tata tertib oleh Wali Kelas', 'Halaman Upacara', 'Ahmad Faisal, S.Pd. (Kesiswaan)', 'Siti Rahmawati, S.Pd., Kons.', 'Selesai', 'Lupa membawa dasi dan mengenakan kaos kaki pendek tidak sesuai standar warna.', '2026-09-29'),
      ('VIO-2026-005', '2026-09-30', '11:30', '0097412856', 'Fajar Nugraha', 'L', 'IX-C', 'Berat', 'Membawa / Menghisap Rokok atau Vape di Lingkungan Sekolah', 50, 'Surat Peringatan II (SP 2), Pemanggilan Orang Tua Resmi, & Skorsing 3 Hari Belajar di Rumah', 'Area Belakang Laboratorium IPA', 'Wahyudi, S.Pd. (Guru Penjaskes)', 'Siti Rahmawati, S.Pd., Kons.', 'Menunggu Pemanggilan Ortu', 'Barang bukti pod vape disita kesiswaan. Orang tua diundang hadir ke sekolah.', '2026-10-02'),
      ('VIO-2026-006', '2026-09-30', '09:15', '0108374621', 'Rendi Kurniawan', 'L', 'VIII-B', 'Sedang', 'Perundungan / Bullying Verbal (Mengejek, Mengintimidasi Teman)', 35, 'Pemanggilan Orang Tua, Konseling Khusus BK, & Penandatanganan Komitmen Damai Bermaterai', 'Koridor Kelas VIII', 'Dra. Hj. Rosdiana (Guru BK)', 'Siti Rahmawati, S.Pd., Kons.', 'Sedang Berjalan', 'Melakukan olokan nama orang tua dan menyebarkan rumor yang menekan psikologis teman sekelas.', '2026-10-04'),
      ('VIO-2026-10-01', '2026-10-01', '07:20', '0119284752', 'Alif Kurnia', 'L', 'VII-A', 'Ringan', 'Rambut Tidak Rapi / Tidak Sesuai Ketentuan Sekolah', 10, 'Pemberian batas waktu 2 hari untuk potong rambut rapi ukuran 3-2-1 cm', 'Pemeriksaan Rutin Pagi Gerbang', 'Ahmad Faisal, S.Pd. (Kesiswaan)', 'Siti Rahmawati, S.Pd., Kons.', 'Belum Ditindaklanjuti', 'Rambut bagian samping dan belakang sudah menyentuh kerah baju seragam.', '2026-10-03');
    `);
  }
}

// -----------------------------------------------------------------------------
// VIOLATION RECORDS CRUD
// -----------------------------------------------------------------------------

export async function getSqliteViolations(): Promise<ViolationRecord[]> {
  const database = await getSqliteDb();
  const res = database.exec(`
    SELECT id, tanggal, waktu, student_nisn, nama_siswa, jenis_kelamin, kelas,
           kategori, jenis_pelanggaran, poin, sanksi, tempat_kejadian, guru_pelapor,
           guru_bk, status_sanksi, catatan_pembinaan, tenggat_sanksi
    FROM violations
    ORDER BY tanggal DESC, waktu DESC;
  `);

  if (!res[0] || !res[0].values) return [];

  const cols = res[0].columns;
  return res[0].values.map(row => {
    const obj: any = {};
    cols.forEach((col, idx) => {
      obj[col] = row[idx];
    });

    return {
      id: String(obj.id),
      tanggal: String(obj.tanggal),
      waktu: String(obj.waktu),
      nisn: obj.student_nisn ? String(obj.student_nisn) : '',
      namaSiswa: String(obj.nama_siswa),
      jenisKelamin: obj.jenis_kelamin as 'L' | 'P',
      kelas: String(obj.kelas),
      kategori: obj.kategori as ViolationSeverity,
      jenisPelanggaran: String(obj.jenis_pelanggaran),
      poin: Number(obj.poin),
      sanksi: String(obj.sanksi),
      tempatKejadian: obj.tempat_kejadian ? String(obj.tempat_kejadian) : 'Lingkungan Sekolah',
      guruPelapor: String(obj.guru_pelapor),
      guruBK: String(obj.guru_bk),
      statusSanksi: obj.status_sanksi as SanctionStatus,
      catatanPembinaan: obj.catatan_pembinaan ? String(obj.catatan_pembinaan) : '',
      tenggatSanksi: obj.tenggat_sanksi ? String(obj.tenggat_sanksi) : ''
    };
  });
}

export async function createSqliteViolation(v: ViolationRecord): Promise<void> {
  const database = await getSqliteDb();

  // If NISN is provided, automatically ensure student exists in students table
  if (v.nisn && v.nisn !== '-') {
    const stmtStudent = database.prepare(`
      INSERT INTO students (nisn, nama, jenis_kelamin, kelas, updated_at)
      VALUES ($nisn, $nama, $jenis_kelamin, $kelas, CURRENT_TIMESTAMP)
      ON CONFLICT(nisn) DO UPDATE SET
        nama = excluded.nama,
        jenis_kelamin = excluded.jenis_kelamin,
        kelas = excluded.kelas,
        updated_at = CURRENT_TIMESTAMP;
    `);
    stmtStudent.run({
      $nisn: v.nisn,
      $nama: v.namaSiswa,
      $jenis_kelamin: v.jenisKelamin,
      $kelas: v.kelas
    });
    stmtStudent.free();
  }

  const stmt = database.prepare(`
    INSERT OR REPLACE INTO violations (
      id, tanggal, waktu, student_nisn, nama_siswa, jenis_kelamin, kelas,
      kategori, jenis_pelanggaran, poin, sanksi, tempat_kejadian,
      guru_pelapor, guru_bk, status_sanksi, catatan_pembinaan, tenggat_sanksi, updated_at
    ) VALUES (
      $id, $tanggal, $waktu, $student_nisn, $nama_siswa, $jenis_kelamin, $kelas,
      $kategori, $jenis_pelanggaran, $poin, $sanksi, $tempat_kejadian,
      $guru_pelapor, $guru_bk, $status_sanksi, $catatan_pembinaan, $tenggat_sanksi, CURRENT_TIMESTAMP
    );
  `);

  stmt.run({
    $id: v.id,
    $tanggal: v.tanggal,
    $waktu: v.waktu,
    $student_nisn: (v.nisn && v.nisn !== '-') ? v.nisn : null,
    $nama_siswa: v.namaSiswa,
    $jenis_kelamin: v.jenisKelamin,
    $kelas: v.kelas,
    $kategori: v.kategori,
    $jenis_pelanggaran: v.jenisPelanggaran,
    $poin: v.poin,
    $sanksi: v.sanksi,
    $tempat_kejadian: v.tempatKejadian || 'Lingkungan Sekolah',
    $guru_pelapor: v.guruPelapor,
    $guru_bk: v.guruBK,
    $status_sanksi: v.statusSanksi,
    $catatan_pembinaan: v.catatanPembinaan || '',
    $tenggat_sanksi: v.tenggatSanksi || ''
  });
  stmt.free();

  saveDatabaseToDisk(database);
}

export async function updateSqliteViolation(id: string, partial: Partial<ViolationRecord>): Promise<void> {
  const database = await getSqliteDb();
  const current = (await getSqliteViolations()).find(item => item.id === id);
  if (!current) throw new Error(`Catatan pelanggaran dengan ID ${id} tidak ditemukan.`);

  const merged: ViolationRecord = { ...current, ...partial };
  await createSqliteViolation(merged);
}

export async function deleteSqliteViolation(id: string): Promise<void> {
  const database = await getSqliteDb();
  const stmt = database.prepare('DELETE FROM violations WHERE id = $id;');
  stmt.run({ $id: id });
  stmt.free();
  saveDatabaseToDisk(database);
}

// -----------------------------------------------------------------------------
// STUDENTS MASTER DATA
// -----------------------------------------------------------------------------

export async function getSqliteStudents(): Promise<StudentMasterItem[]> {
  const database = await getSqliteDb();
  const fileStudents = loadMasterStudents();

  if (fileStudents.length > 0) {
    try {
      const insertStudent = database.prepare(`
        INSERT OR REPLACE INTO students (nis, nisn, nama, jenis_kelamin, kelas)
        VALUES ($nis, $nisn, $nama, $jenis_kelamin, $kelas);
      `);
      for (const s of fileStudents) {
        insertStudent.run({
          $nis: s.nis || '',
          $nisn: s.nisn || '',
          $nama: s.nama,
          $jenis_kelamin: s.jenisKelamin,
          $kelas: s.kelas
        });
      }
      insertStudent.free();
      saveDatabaseToDisk(database);
      return fileStudents;
    } catch (e) {
      console.warn('[SQLite] Gagal memperbarui tabel students di SQLite, mengembalikan data file:', e);
      return fileStudents;
    }
  }

  const res = database.exec(`
    SELECT nis, nisn, nama, jenis_kelamin, kelas
    FROM students
    ORDER BY kelas ASC, nama ASC;
  `);

  if (!res[0] || !res[0].values) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => {
    const obj: any = {};
    cols.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return {
      nis: String(obj.nis || ''),
      nisn: String(obj.nisn || ''),
      nama: String(obj.nama || ''),
      jenisKelamin: (String(obj.jenis_kelamin).toUpperCase() === 'P' ? 'P' : 'L') as 'L' | 'P',
      kelas: String(obj.kelas || 'VII-A')
    };
  });
}

export async function getSqliteTeachers(): Promise<TeacherMasterItem[]> {
  const database = await getSqliteDb();
  const fileTeachers = loadMasterTeachers();

  if (fileTeachers.length > 0) {
    try {
      // Refresh SQLite teachers table with latest records from disk (.csv)
      database.run('DELETE FROM teachers;');
      const insertTeacher = database.prepare(`
        INSERT INTO teachers (nip, nama, jabatan, peran)
        VALUES ($nip, $nama, $jabatan, $peran);
      `);
      for (const t of fileTeachers) {
        insertTeacher.run({
          $nip: t.nip || '-',
          $nama: t.nama,
          $jabatan: t.jabatan || 'Guru Mata Pelajaran',
          $peran: t.peran || 'Guru Pelapor'
        });
      }
      insertTeacher.free();
      saveDatabaseToDisk(database);
      return fileTeachers;
    } catch (e) {
      console.warn('[SQLite] Gagal memperbarui tabel teachers di SQLite, mengembalikan data file:', e);
      return fileTeachers;
    }
  }

  const res = database.exec(`
    SELECT nip, nama, jabatan, peran
    FROM teachers
    ORDER BY id ASC;
  `);

  if (!res[0] || !res[0].values) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => {
    const obj: any = {};
    cols.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return {
      nip: String(obj.nip || '-'),
      nama: String(obj.nama || ''),
      jabatan: String(obj.jabatan || 'Guru Mata Pelajaran'),
      peran: String(obj.peran || 'Guru Pelapor')
    };
  });
}

// -----------------------------------------------------------------------------
// SCHOOL PROFILE
// -----------------------------------------------------------------------------

export async function getSqliteSchoolProfile(): Promise<SchoolProfile | null> {
  const database = await getSqliteDb();
  const res = database.exec(`
    SELECT nama_sekolah, npsn, alamat, kelurahan_kecamatan, kabupaten_kota, provinsi, kode_pos,
           nama_kepala_sekolah, nip_kepala_sekolah, nama_guru_bk, nip_guru_bk,
           nama_wakasek_kesiswaan, nip_wakasek_kesiswaan
    FROM school_profile
    WHERE id = 1
    LIMIT 1;
  `);

  if (!res[0] || !res[0].values || res[0].values.length === 0) return null;
  const cols = res[0].columns;
  const obj: any = {};
  cols.forEach((col, idx) => {
    obj[col] = res[0].values[0][idx];
  });

  return {
    namaSekolah: String(obj.nama_sekolah || ''),
    npsn: String(obj.npsn || ''),
    alamat: String(obj.alamat || ''),
    kelurahanKecamatan: String(obj.kelurahan_kecamatan || ''),
    kabupatenKota: String(obj.kabupaten_kota || ''),
    provinsi: String(obj.provinsi || ''),
    kodePos: String(obj.kode_pos || ''),
    namaKepalaSekolah: String(obj.nama_kepala_sekolah || ''),
    nipKepalaSekolah: String(obj.nip_kepala_sekolah || ''),
    namaGuruBK: String(obj.nama_guru_bk || ''),
    nipGuruBK: String(obj.nip_guru_bk || ''),
    namaWakasekKesiswaan: String(obj.nama_wakasek_kesiswaan || ''),
    nipWakasekKesiswaan: String(obj.nip_wakasek_kesiswaan || '')
  };
}

export async function updateSqliteSchoolProfile(p: SchoolProfile): Promise<void> {
  const database = await getSqliteDb();
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO school_profile (
      id, nama_sekolah, npsn, alamat, kelurahan_kecamatan, kabupaten_kota, provinsi, kode_pos,
      nama_kepala_sekolah, nip_kepala_sekolah, nama_guru_bk, nip_guru_bk,
      nama_wakasek_kesiswaan, nip_wakasek_kesiswaan, updated_at
    ) VALUES (
      1, $nama_sekolah, $npsn, $alamat, $kelurahan_kecamatan, $kabupaten_kota, $provinsi, $kode_pos,
      $nama_kepala_sekolah, $nip_kepala_sekolah, $nama_guru_bk, $nip_guru_bk,
      $nama_wakasek_kesiswaan, $nip_wakasek_kesiswaan, CURRENT_TIMESTAMP
    );
  `);

  stmt.run({
    $nama_sekolah: p.namaSekolah,
    $npsn: p.npsn,
    $alamat: p.alamat,
    $kelurahan_kecamatan: p.kelurahanKecamatan,
    $kabupaten_kota: p.kabupatenKota,
    $provinsi: p.provinsi,
    $kode_pos: p.kodePos,
    $nama_kepala_sekolah: p.namaKepalaSekolah,
    $nip_kepala_sekolah: p.nipKepalaSekolah,
    $nama_guru_bk: p.namaGuruBK,
    $nip_guru_bk: p.nipGuruBK,
    $nama_wakasek_kesiswaan: p.namaWakasekKesiswaan,
    $nip_wakasek_kesiswaan: p.nipWakasekKesiswaan
  });
  stmt.free();

  saveDatabaseToDisk(database);
}
