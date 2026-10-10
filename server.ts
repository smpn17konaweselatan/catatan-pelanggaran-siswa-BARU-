import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { 
  getSqliteViolations, 
  createSqliteViolation, 
  updateSqliteViolation, 
  deleteSqliteViolation, 
  getSqliteStudents,
  getSqliteTeachers,
  getSqliteSchoolProfile, 
  updateSqliteSchoolProfile,
  getDatabaseFileBuffer,
  restoreDatabaseFromFile
} from './src/db/sqlite.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const PORT = isProduction ? (Number(process.env.PORT) || 8080) : 3000;

app.use(express.json());
app.use(express.raw({ 
  type: [
    'application/octet-stream', 
    'application/x-sqlite3', 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'text/plain'
  ], 
  limit: '50mb' 
}));

// Health check endpoint for Cloud Run
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// API: Get all violations from SQLite database
app.get('/api/violations', async (req, res) => {
  try {
    const list = await getSqliteViolations();
    res.json(list);
  } catch (error: any) {
    console.error('[SQLite] Error fetching violations:', error);
    res.status(500).json({ error: error.message || 'Gagal mengambil data dari database SQLite.' });
  }
});

// API: Create new violation in SQLite
app.post('/api/violations', async (req, res) => {
  try {
    const record = req.body;
    if (!record || !record.namaSiswa || !record.jenisPelanggaran) {
      return res.status(400).json({ error: 'Data pelanggaran tidak lengkap.' });
    }
    await createSqliteViolation(record);
    res.json({ success: true, message: 'Data pelanggaran berhasil disimpan ke database SQLite.' });
  } catch (error: any) {
    console.error('[SQLite] Error creating violation:', error);
    res.status(500).json({ error: error.message || 'Gagal menyimpan ke database SQLite.' });
  }
});

// API: Update violation in SQLite
app.put('/api/violations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await updateSqliteViolation(id, req.body);
    res.json({ success: true, message: 'Data pelanggaran berhasil diperbarui di database SQLite.' });
  } catch (error: any) {
    console.error('[SQLite] Error updating violation:', error);
    res.status(500).json({ error: error.message || 'Gagal memperbarui di database SQLite.' });
  }
});

// API: Delete violation from SQLite
app.delete('/api/violations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteSqliteViolation(id);
    res.json({ success: true, message: 'Data pelanggaran berhasil dihapus dari database SQLite.' });
  } catch (error: any) {
    console.error('[SQLite] Error deleting violation:', error);
    res.status(500).json({ error: error.message || 'Gagal menghapus dari database SQLite.' });
  }
});

// API: Get master students list from SQLite
app.get('/api/students', async (req, res) => {
  try {
    const list = await getSqliteStudents();
    res.json(list);
  } catch (error: any) {
    console.error('[SQLite] Error fetching students:', error);
    res.status(500).json({ error: error.message || 'Gagal mengambil data siswa dari database SQLite.' });
  }
});

// API: Get master teachers list from SQLite
app.get('/api/teachers', async (req, res) => {
  try {
    const list = await getSqliteTeachers();
    res.json(list);
  } catch (error: any) {
    console.error('[SQLite] Error fetching teachers:', error);
    res.status(500).json({ error: error.message || 'Gagal mengambil data guru dari database SQLite.' });
  }
});

// API: Download master guru.csv file (and legacy guru.xlsx alias)
app.get(['/api/master/download/guru.csv', '/api/master/download/guru.xlsx'], (req, res) => {
  const csvPath = path.resolve(process.cwd(), 'src/format_data/guru.csv');
  const fallbackPath = path.resolve(process.cwd(), 'src/db/guru.csv');
  const target = fs.existsSync(csvPath) ? csvPath : (fs.existsSync(fallbackPath) ? fallbackPath : null);
  if (target) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="guru.csv"');
    return res.sendFile(target);
  }
  res.status(404).json({ error: 'File guru.csv tidak ditemukan di src/format_data/' });
});

// API: Download master siswa.csv file (and legacy siswa.xlsx alias)
app.get(['/api/master/download/siswa.csv', '/api/master/download/siswa.xlsx'], (req, res) => {
  const csvPath = path.resolve(process.cwd(), 'src/format_data/siswa.csv');
  const fallbackPath = path.resolve(process.cwd(), 'src/db/siswa.csv');
  const target = fs.existsSync(csvPath) ? csvPath : (fs.existsSync(fallbackPath) ? fallbackPath : null);
  if (target) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="siswa.csv"');
    return res.sendFile(target);
  }
  res.status(404).json({ error: 'File siswa.csv tidak ditemukan di src/format_data/' });
});

// API: Upload / replace master teachers file (.csv only)
app.post('/api/master/upload/guru', async (req, res) => {
  try {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: 'File master guru tidak valid atau kosong.' });
    }
    const isZipOrXlsx = req.body[0] === 0x50 && req.body[1] === 0x4B; // 'PK' magic bytes of zip/xlsx
    if (isZipOrXlsx) {
      return res.status(400).json({
        error: 'Format .xlsx tidak lagi didukung karena kendala kompatibilitas berbagai versi Excel. Silakan simpan file dari Excel sebagai CSV UTF-8 (.csv) dan unggah kembali.'
      });
    }

    const dest = path.resolve(process.cwd(), 'src/format_data/guru.csv');
    fs.writeFileSync(dest, req.body);

    const refreshed = await getSqliteTeachers();
    res.json({ success: true, count: refreshed.length, message: `Berhasil memuat ${refreshed.length} data guru / petugas pelapor dari guru.csv!` });
  } catch (error: any) {
    console.error('[Master] Error uploading guru:', error);
    res.status(500).json({ error: error.message || 'Gagal menyimpan file master guru.' });
  }
});

// API: Upload / replace master students file (.csv only)
app.post('/api/master/upload/siswa', async (req, res) => {
  try {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: 'File master siswa tidak valid atau kosong.' });
    }
    const isZipOrXlsx = req.body[0] === 0x50 && req.body[1] === 0x4B;
    if (isZipOrXlsx) {
      return res.status(400).json({
        error: 'Format .xlsx tidak lagi didukung karena kendala kompatibilitas berbagai versi Excel. Silakan simpan file dari Excel sebagai CSV UTF-8 (.csv) dan unggah kembali.'
      });
    }

    const dest = path.resolve(process.cwd(), 'src/format_data/siswa.csv');
    fs.writeFileSync(dest, req.body);

    const refreshed = await getSqliteStudents();
    res.json({ success: true, count: refreshed.length, message: `Berhasil memuat ${refreshed.length} data siswa dari siswa.csv!` });
  } catch (error: any) {
    console.error('[Master] Error uploading siswa:', error);
    res.status(500).json({ error: error.message || 'Gagal menyimpan file master siswa.' });
  }
});

// API: Trigger master data sync / refresh from disk
app.post('/api/master/refresh', async (req, res) => {
  try {
    const teachers = await getSqliteTeachers();
    const students = await getSqliteStudents();
    res.json({
      success: true,
      teachersCount: teachers.length,
      studentsCount: students.length,
      message: `Master data disinkronkan: ${teachers.length} guru dan ${students.length} siswa.`
    });
  } catch (error: any) {
    console.error('[Master] Error refreshing master data:', error);
    res.status(500).json({ error: error.message || 'Gagal menyinkronkan master data.' });
  }
});

// API: Get school profile from SQLite
app.get('/api/school-profile', async (req, res) => {
  try {
    const profile = await getSqliteSchoolProfile();
    res.json(profile);
  } catch (error: any) {
    console.error('[SQLite] Error fetching school profile:', error);
    res.status(500).json({ error: error.message || 'Gagal mengambil profil sekolah dari database SQLite.' });
  }
});

// API: Update school profile in SQLite
app.put('/api/school-profile', async (req, res) => {
  try {
    await updateSqliteSchoolProfile(req.body);
    res.json({ success: true, message: 'Profil sekolah berhasil diperbarui di database SQLite.' });
  } catch (error: any) {
    console.error('[SQLite] Error updating school profile:', error);
    res.status(500).json({ error: error.message || 'Gagal memperbarui profil sekolah di database SQLite.' });
  }
});

// API: Download physical SQLite database file (.db)
app.get('/api/database/download-sqlite', async (req, res) => {
  try {
    const buffer = await getDatabaseFileBuffer();
    res.setHeader('Content-Type', 'application/x-sqlite3');
    res.setHeader('Content-Disposition', 'attachment; filename="buku_pelanggaran_sekolah.db"');
    res.send(buffer);
  } catch (error: any) {
    console.error('[SQLite] Error downloading .db file:', error);
    res.status(500).json({ error: 'Gagal mengunduh file database SQLite.' });
  }
});

// API: Restore SQLite database from uploaded .db file
app.post('/api/database/upload-sqlite', async (req, res) => {
  try {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: 'File binary database SQLite tidak valid atau kosong.' });
    }
    await restoreDatabaseFromFile(req.body);
    res.json({ success: true, message: 'File database SQLite berhasil dipulihkan.' });
  } catch (error: any) {
    console.error('[SQLite] Error restoring .db file:', error);
    res.status(500).json({ error: error.message || 'Gagal memulihkan database SQLite.' });
  }
});

// API: Export standard SQL text dump (.sql)
app.get('/api/sql-dump', async (req, res) => {
  try {
    const violationsList = await getSqliteViolations();
    const studentsList = await getSqliteStudents();
    const profile = await getSqliteSchoolProfile();

    let sql = `-- =========================================================================
-- DATABASE CATATAN PELANGGARAN SISWA & TATA TERTIB SEKOLAH (SQLITE DUMP)
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

-- DATA INSERTION
`;

    if (profile) {
      sql += `INSERT OR REPLACE INTO school_profile (id, nama_sekolah, npsn, alamat, kelurahan_kecamatan, kabupaten_kota, provinsi, kode_pos, nama_kepala_sekolah, nip_kepala_sekolah, nama_guru_bk, nip_guru_bk, nama_wakasek_kesiswaan, nip_wakasek_kesiswaan)
VALUES (1, '${profile.namaSekolah.replace(/'/g, "''")}', '${profile.npsn}', '${profile.alamat.replace(/'/g, "''")}', '${profile.kelurahanKecamatan.replace(/'/g, "''")}', '${profile.kabupatenKota.replace(/'/g, "''")}', '${profile.provinsi.replace(/'/g, "''")}', '${profile.kodePos}', '${profile.namaKepalaSekolah.replace(/'/g, "''")}', '${profile.nipKepalaSekolah}', '${profile.namaGuruBK.replace(/'/g, "''")}', '${profile.nipGuruBK}', '${profile.namaWakasekKesiswaan.replace(/'/g, "''")}', '${profile.nipWakasekKesiswaan}');\n\n`;
    }

    if (studentsList.length > 0) {
      sql += `-- INSERT DATA SISWA\n`;
      studentsList.forEach(s => {
        const student = s as any;
        sql += `INSERT OR IGNORE INTO students (nisn, nama, jenis_kelamin, kelas, alamat, nama_orang_tua, kontak_orang_tua) VALUES ('${student.nisn}', '${student.nama.replace(/'/g, "''")}', '${student.jenisKelamin}', '${student.kelas}', '${(student.alamat || '').replace(/'/g, "''")}', '${(student.namaOrangTua || '').replace(/'/g, "''")}', '${student.kontakOrangTua || ''}');\n`;
      });
      sql += `\n`;
    }

    if (violationsList.length > 0) {
      sql += `-- INSERT CATATAN PELANGGARAN\n`;
      violationsList.forEach(v => {
        sql += `INSERT OR REPLACE INTO violations (id, tanggal, waktu, student_nisn, nama_siswa, jenis_kelamin, kelas, kategori, jenis_pelanggaran, poin, sanksi, tempat_kejadian, guru_pelapor, guru_bk, status_sanksi, catatan_pembinaan, tenggat_sanksi) VALUES ('${v.id}', '${v.tanggal}', '${v.waktu}', '${v.nisn}', '${v.namaSiswa.replace(/'/g, "''")}', '${v.jenisKelamin}', '${v.kelas}', '${v.kategori}', '${v.jenisPelanggaran.replace(/'/g, "''")}', ${v.poin}, '${v.sanksi.replace(/'/g, "''")}', '${(v.tempatKejadian || '').replace(/'/g, "''")}', '${v.guruPelapor.replace(/'/g, "''")}', '${v.guruBK.replace(/'/g, "''")}', '${v.statusSanksi}', '${(v.catatanPembinaan || '').replace(/'/g, "''")}', ${v.tenggatSanksi ? `'${v.tenggatSanksi}'` : 'NULL'});\n`;
      });
    }

    res.setHeader('Content-Type', 'application/sql; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="database_buku_pelanggaran_siswa.sql"');
    res.send(sql);
  } catch (error: any) {
    console.error('[SQLite] Error generating SQL dump:', error);
    res.status(500).json({ error: 'Gagal membuat file dump SQL.' });
  }
});

// Setup Vite middleware for development or serve dist for production
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));

  if (isProduction && hasDist) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        let html = fs.readFileSync(indexPath, 'utf-8');
        html = await vite.transformIndexHtml(url, html);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e: any) {
        if (vite.ssrFixStacktrace) {
          vite.ssrFixStacktrace(e);
        }
        next(e);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server database SQLite & aplikasi berjalan pada port ${PORT}`);
  });
}

startServer();
