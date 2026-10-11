// @ts-ignore
import initSqlJs from 'sql.js/dist/sql-asm.js';
import type { Database, SqlJsStatic } from 'sql.js';
import { ViolationRecord, SchoolProfile, ViolationSeverity, SanctionStatus } from '../types/violation';
import { StudentMasterItem, TeacherMasterItem } from '../data/schoolMasterData';
import { DatabaseInspectionResult } from '../services/api';

let cachedSQL: SqlJsStatic | null = null;

export async function getClientSql(): Promise<SqlJsStatic> {
  if (!cachedSQL) {
    cachedSQL = await (initSqlJs as any)();
  }
  return cachedSQL!;
}

/**
 * Generate a complete standalone SQLite 3 binary database (.db) file
 * containing school profile, master students, teachers, and violation records.
 */
export async function generateSqliteDbBuffer(
  records: ViolationRecord[],
  profile: SchoolProfile,
  students: StudentMasterItem[] = [],
  teachers: TeacherMasterItem[] = []
): Promise<Uint8Array> {
  const SQL = await getClientSql();
  const db: Database = new SQL.Database();

  // Create standard schema
  db.run(`
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
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Insert school profile
  const stmtProfile = db.prepare(`
    INSERT INTO school_profile (
      id, nama_sekolah, npsn, alamat, kelurahan_kecamatan, kabupaten_kota, provinsi, kode_pos,
      nama_kepala_sekolah, nip_kepala_sekolah, nama_guru_bk, nip_guru_bk, nama_wakasek_kesiswaan, nip_wakasek_kesiswaan
    ) VALUES (
      1, $nama_sekolah, $npsn, $alamat, $kelurahan_kecamatan, $kabupaten_kota, $provinsi, $kode_pos,
      $nama_kepala_sekolah, $nip_kepala_sekolah, $nama_guru_bk, $nip_guru_bk, $nama_wakasek_kesiswaan, $nip_wakasek_kesiswaan
    );
  `);
  stmtProfile.run({
    $nama_sekolah: profile.namaSekolah || 'SMP NEGERI 17 KONAWE SELATAN',
    $npsn: profile.npsn || '40403819',
    $alamat: profile.alamat || 'Jl. Poros Pendidikan No. 17',
    $kelurahan_kecamatan: profile.kelurahanKecamatan || 'Kec. Buke',
    $kabupaten_kota: profile.kabupatenKota || 'Kabupaten Konawe Selatan',
    $provinsi: profile.provinsi || 'Sulawesi Tenggara',
    $kode_pos: profile.kodePos || '93385',
    $nama_kepala_sekolah: profile.namaKepalaSekolah || 'Drs. H. Mulyadi, M.Pd.',
    $nip_kepala_sekolah: profile.nipKepalaSekolah || '',
    $nama_guru_bk: profile.namaGuruBK || 'Siti Rahmawati, S.Pd., Kons.',
    $nip_guru_bk: profile.nipGuruBK || '',
    $nama_wakasek_kesiswaan: profile.namaWakasekKesiswaan || 'Ahmad Faisal, S.Pd.',
    $nip_wakasek_kesiswaan: profile.nipWakasekKesiswaan || ''
  });
  stmtProfile.free();

  // Insert students
  if (students && students.length > 0) {
    const stmtStudent = db.prepare(`
      INSERT OR IGNORE INTO students (nis, nisn, nama, jenis_kelamin, kelas)
      VALUES ($nis, $nisn, $nama, $jenis_kelamin, $kelas);
    `);
    for (const s of students) {
      if (s.nama && (s.nisn || s.nis)) {
        stmtStudent.run({
          $nis: s.nis || '',
          $nisn: s.nisn || s.nis,
          $nama: s.nama,
          $jenis_kelamin: s.jenisKelamin || 'L',
          $kelas: s.kelas || 'VII-A'
        });
      }
    }
    stmtStudent.free();
  }

  // Insert teachers
  if (teachers && teachers.length > 0) {
    const stmtTeacher = db.prepare(`
      INSERT OR IGNORE INTO teachers (nip, nama, jabatan, peran)
      VALUES ($nip, $nama, $jabatan, $peran);
    `);
    for (const t of teachers) {
      if (t.nama) {
        stmtTeacher.run({
          $nip: t.nip || '-',
          $nama: t.nama,
          $jabatan: t.jabatan || 'Guru Mata Pelajaran',
          $peran: t.peran || 'Guru Pelapor'
        });
      }
    }
    stmtTeacher.free();
  }

  // Insert violations
  const stmtViolation = db.prepare(`
    INSERT INTO violations (
      id, tanggal, waktu, student_nisn, nama_siswa, jenis_kelamin, kelas,
      kategori, jenis_pelanggaran, poin, sanksi, tempat_kejadian, guru_pelapor,
      guru_bk, status_sanksi, catatan_pembinaan, tenggat_sanksi
    ) VALUES (
      $id, $tanggal, $waktu, $student_nisn, $nama_siswa, $jenis_kelamin, $kelas,
      $kategori, $jenis_pelanggaran, $poin, $sanksi, $tempat_kejadian, $guru_pelapor,
      $guru_bk, $status_sanksi, $catatan_pembinaan, $tenggat_sanksi
    );
  `);

  for (const v of records) {
    stmtViolation.run({
      $id: v.id,
      $tanggal: v.tanggal,
      $waktu: v.waktu || '07:15',
      $student_nisn: (v.nisn && v.nisn !== '-') ? v.nisn : null,
      $nama_siswa: v.namaSiswa,
      $jenis_kelamin: v.jenisKelamin || 'L',
      $kelas: v.kelas || 'VII-A',
      $kategori: v.kategori || 'Ringan',
      $jenis_pelanggaran: v.jenisPelanggaran,
      $poin: Number(v.poin) || 0,
      $sanksi: v.sanksi,
      $tempat_kejadian: v.tempatKejadian || 'Lingkungan Sekolah',
      $guru_pelapor: v.guruPelapor,
      $guru_bk: v.guruBK,
      $status_sanksi: v.statusSanksi || 'Belum Ditindaklanjuti',
      $catatan_pembinaan: v.catatanPembinaan || '',
      $tenggat_sanksi: v.tenggatSanksi || ''
    });
  }
  stmtViolation.free();

  const binaryOutput = db.export();
  db.close();
  return binaryOutput;
}

/**
 * Parse an incoming SQLite database buffer (.db) and extract violation records and school profile
 */
export async function parseSqliteDbBuffer(buffer: ArrayBuffer | Uint8Array): Promise<{
  violations: ViolationRecord[];
  profile: SchoolProfile | null;
  studentsCount: number;
  teachersCount: number;
}> {
  const SQL = await getClientSql();
  const db: Database = new SQL.Database(new Uint8Array(buffer));

  const violations: ViolationRecord[] = [];
  let profile: SchoolProfile | null = null;
  let studentsCount = 0;
  let teachersCount = 0;

  try {
    // Detect existing tables in the SQLite database
    const tablesQuery = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
    const tableNames: string[] = [];
    if (tablesQuery[0]?.values) {
      for (const row of tablesQuery[0].values) {
        if (row[0]) tableNames.push(String(row[0]).toLowerCase());
      }
    }

    // 1. Violations table
    const vTable = tableNames.find(t => ['violations', 'pelanggaran', 'catatan_pelanggaran', 'buku_pelanggaran'].includes(t)) || 
      (tableNames.includes('violations') ? 'violations' : null);

    if (vTable) {
      const vRes = db.exec(`SELECT * FROM ${vTable};`);
      if (vRes[0] && vRes[0].values) {
        const cols = vRes[0].columns.map(c => c.toLowerCase());
        for (const row of vRes[0].values) {
          const obj: Record<string, any> = {};
          cols.forEach((col, idx) => {
            obj[col] = row[idx];
          });

          const namaSiswa = String(obj.nama_siswa || obj.nama || obj.name || '').trim();
          if (!namaSiswa) continue; // Skip empty rows

          const rawKategori = String(obj.kategori || obj.category || 'Ringan');
          let cleanKategori: ViolationSeverity = 'Ringan';
          if (rawKategori.toLowerCase().includes('berat')) cleanKategori = 'Berat';
          else if (rawKategori.toLowerCase().includes('sedang')) cleanKategori = 'Sedang';

          const rawStatus = String(obj.status_sanksi || obj.status || 'Belum Ditindaklanjuti');
          let cleanStatus: SanctionStatus = 'Belum Ditindaklanjuti';
          if (rawStatus.toLowerCase().includes('selesai')) cleanStatus = 'Selesai';
          else if (rawStatus.toLowerCase().includes('proses') || rawStatus.toLowerCase().includes('sedang')) cleanStatus = 'Sedang Berjalan';

          violations.push({
            id: String(obj.id || obj.id_pelanggaran || `VIO-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
            tanggal: String(obj.tanggal || obj.tgl || obj.date || new Date().toISOString().split('T')[0]),
            waktu: String(obj.waktu || obj.jam || obj.time || '07:15'),
            nisn: obj.student_nisn || obj.nisn || obj.nis ? String(obj.student_nisn || obj.nisn || obj.nis) : '-',
            namaSiswa,
            jenisKelamin: (String(obj.jenis_kelamin || obj.jk || obj.gender || 'L').toUpperCase().startsWith('P') ? 'P' : 'L'),
            kelas: String(obj.kelas || obj.class || 'VII-A'),
            kategori: cleanKategori,
            jenisPelanggaran: String(obj.jenis_pelanggaran || obj.pelanggaran || obj.violation || 'Pelanggaran Tata Tertib'),
            poin: Number(obj.poin || obj.point || obj.points || 5) || 5,
            sanksi: String(obj.sanksi || obj.sanction || 'Teguran lisan & pembinaan'),
            tempatKejadian: String(obj.tempat_kejadian || obj.tempat || obj.lokasi || 'Lingkungan Sekolah'),
            guruPelapor: String(obj.guru_pelapor || obj.pelapor || 'Guru Piket'),
            guruBK: String(obj.guru_bk || obj.bk || 'Siti Rahmawati, S.Pd., Kons.'),
            statusSanksi: cleanStatus,
            catatanPembinaan: String(obj.catatan_pembinaan || obj.catatan || ''),
            tenggatSanksi: String(obj.tenggat_sanksi || obj.tenggat || '')
          });
        }
      }
    }
  } catch (err) {
    console.warn('[SQLite Client] Warning reading violations:', err);
  }

  // 2. School Profile
  try {
    const pTable = ['school_profile', 'profile', 'profil_sekolah', 'sekolah'].find(t => {
      const q = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${t}';`);
      return q[0]?.values?.length;
    });

    if (pTable) {
      const pRes = db.exec(`SELECT * FROM ${pTable} LIMIT 1;`);
      if (pRes[0] && pRes[0].values && pRes[0].values[0]) {
        const cols = pRes[0].columns.map(c => c.toLowerCase());
        const obj: Record<string, any> = {};
        cols.forEach((c, i) => { obj[c] = pRes[0].values[0][i]; });
        profile = {
          namaSekolah: obj.nama_sekolah || obj.nama || '',
          npsn: obj.npsn || '',
          alamat: obj.alamat || '',
          kelurahanKecamatan: obj.kelurahan_kecamatan || obj.kecamatan || '',
          kabupatenKota: obj.kabupaten_kota || obj.kota || '',
          provinsi: obj.provinsi || '',
          kodePos: obj.kode_pos || '',
          namaKepalaSekolah: obj.nama_kepala_sekolah || obj.kepala_sekolah || '',
          nipKepalaSekolah: obj.nip_kepala_sekolah || '',
          namaGuruBK: obj.nama_guru_bk || obj.guru_bk || '',
          nipGuruBK: obj.nip_guru_bk || '',
          namaWakasekKesiswaan: obj.nama_wakasek_kesiswaan || obj.wakasek || '',
          nipWakasekKesiswaan: obj.nip_wakasek_kesiswaan || ''
        };
      }
    }
  } catch (_) {}

  // 3. Students count
  try {
    const sTable = ['students', 'siswa', 'data_siswa'].find(t => {
      const q = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${t}';`);
      return q[0]?.values?.length;
    });
    if (sTable) {
      const sRes = db.exec(`SELECT COUNT(*) FROM ${sTable};`);
      if (sRes[0]?.values?.[0]) {
        studentsCount = Number(sRes[0].values[0][0]) || 0;
      }
    }
  } catch (_) {}

  // 4. Teachers count
  try {
    const tTable = ['teachers', 'guru', 'data_guru'].find(t => {
      const q = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${t}';`);
      return q[0]?.values?.length;
    });
    if (tTable) {
      const tRes = db.exec(`SELECT COUNT(*) FROM ${tTable};`);
      if (tRes[0]?.values?.[0]) {
        teachersCount = Number(tRes[0].values[0][0]) || 0;
      }
    }
  } catch (_) {}

  db.close();

  return {
    violations,
    profile,
    studentsCount,
    teachersCount
  };
}

/**
 * Inspect SQLite database buffer directly in browser / Electron without network request
 */
export async function inspectSqliteDbBuffer(buffer: ArrayBuffer | Uint8Array): Promise<DatabaseInspectionResult> {
  const { violations, profile, studentsCount, teachersCount } = await parseSqliteDbBuffer(buffer);

  const sampleViolations = violations.slice(0, 4).map(v => ({
    id: v.id,
    namaSiswa: v.namaSiswa,
    jenisPelanggaran: v.jenisPelanggaran,
    tanggal: v.tanggal,
    poin: v.poin,
    kategori: v.kategori,
    kelas: v.kelas
  }));

  return {
    valid: true,
    violationsCount: violations.length,
    studentsCount,
    teachersCount,
    schoolName: profile?.namaSekolah || 'SMP NEGERI 17 KONAWE SELATAN',
    sampleViolations
  };
}

/**
 * Generate human-readable SQL dump script string (.sql) directly in client
 */
export function generateSqlDumpText(
  records: ViolationRecord[],
  profile: SchoolProfile,
  students: StudentMasterItem[] = [],
  teachers: TeacherMasterItem[] = []
): string {
  const esc = (val: any) => {
    if (val === null || val === undefined) return "''";
    return "'" + String(val).replace(/'/g, "''") + "'";
  };

  let sql = `-- =========================================================================
-- DATABASE CATATAN PELANGGARAN SISWA & TATA TERTIB SEKOLAH (SQL DUMP)
-- SEKOLAH: ${profile?.namaSekolah || 'SMP NEGERI 17 KONAWE SELATAN'}
-- GENERATED AT: ${new Date().toISOString()}
-- COMPATIBLE WITH: SQLite, PostgreSQL, MySQL, DBeaver, DB Browser for SQLite
-- =========================================================================

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
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
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
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Profil Sekolah
INSERT INTO school_profile (id, nama_sekolah, npsn, alamat, kelurahan_kecamatan, kabupaten_kota, provinsi, kode_pos, nama_kepala_sekolah, nip_kepala_sekolah, nama_guru_bk, nip_guru_bk, nama_wakasek_kesiswaan, nip_wakasek_kesiswaan)
VALUES (
    1,
    ${esc(profile.namaSekolah || 'SMP NEGERI 17 KONAWE SELATAN')},
    ${esc(profile.npsn || '40403819')},
    ${esc(profile.alamat || 'Jl. Poros Pendidikan No. 17')},
    ${esc(profile.kelurahanKecamatan || 'Kec. Buke')},
    ${esc(profile.kabupatenKota || 'Kabupaten Konawe Selatan')},
    ${esc(profile.provinsi || 'Sulawesi Tenggara')},
    ${esc(profile.kodePos || '93385')},
    ${esc(profile.namaKepalaSekolah || 'Drs. H. Mulyadi, M.Pd.')},
    ${esc(profile.nipKepalaSekolah || '')},
    ${esc(profile.namaGuruBK || 'Siti Rahmawati, S.Pd., Kons.')},
    ${esc(profile.nipGuruBK || '')},
    ${esc(profile.namaWakasekKesiswaan || 'Ahmad Faisal, S.Pd.')},
    ${esc(profile.nipWakasekKesiswaan || '')}
);
\n`;

  // Master Siswa
  if (students && students.length > 0) {
    sql += `-- Data Master Siswa (${students.length} Siswa)\n`;
    for (const s of students) {
      if (s.nama && (s.nisn || s.nis)) {
        sql += `INSERT INTO students (nis, nisn, nama, jenis_kelamin, kelas) VALUES (${esc(s.nis || '')}, ${esc(s.nisn || s.nis)}, ${esc(s.nama)}, ${esc(s.jenisKelamin || 'L')}, ${esc(s.kelas || 'VII-A')});\n`;
      }
    }
    sql += `\n`;
  }

  // Master Guru
  if (teachers && teachers.length > 0) {
    sql += `-- Data Master Guru (${teachers.length} Guru)\n`;
    for (const t of teachers) {
      if (t.nama) {
        sql += `INSERT INTO teachers (nip, nama, jabatan, peran) VALUES (${esc(t.nip || '-')}, ${esc(t.nama)}, ${esc(t.jabatan || 'Guru')}, ${esc(t.peran || 'Guru Pelapor')});\n`;
      }
    }
    sql += `\n`;
  }

  // Catatan Pelanggaran
  if (records && records.length > 0) {
    sql += `-- Catatan Pelanggaran Siswa (${records.length} Catatan)\n`;
    for (const r of records) {
      sql += `INSERT INTO violations (id, tanggal, waktu, student_nisn, nama_siswa, jenis_kelamin, kelas, kategori, jenis_pelanggaran, poin, sanksi, tempat_kejadian, guru_pelapor, guru_bk, status_sanksi, catatan_pembinaan, tenggat_sanksi)
VALUES (
    ${esc(r.id)},
    ${esc(r.tanggal)},
    ${esc(r.waktu || '07:15')},
    ${esc(r.nisn && r.nisn !== '-' ? r.nisn : '')},
    ${esc(r.namaSiswa)},
    ${esc(r.jenisKelamin || 'L')},
    ${esc(r.kelas || 'VII-A')},
    ${esc(r.kategori || 'Ringan')},
    ${esc(r.jenisPelanggaran)},
    ${Number(r.poin) || 0},
    ${esc(r.sanksi)},
    ${esc(r.tempatKejadian || 'Lingkungan Sekolah')},
    ${esc(r.guruPelapor)},
    ${esc(r.guruBK)},
    ${esc(r.statusSanksi || 'Belum Ditindaklanjuti')},
    ${esc(r.catatanPembinaan || '')},
    ${esc(r.tenggatSanksi || '')}
);\n`;
    }
  }

  return sql;
}

