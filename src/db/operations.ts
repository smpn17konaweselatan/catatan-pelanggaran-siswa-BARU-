import { db } from './index.ts';
import { violations, students, schoolProfile } from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import type { ViolationRecord, SchoolProfile } from '../types/violation.ts';

// Fetch all violation records from SQL database
export async function getAllViolations(): Promise<ViolationRecord[]> {
  try {
    const rows = await db.select().from(violations).orderBy(desc(violations.tanggal));
    return rows.map(r => ({
      id: r.id,
      tanggal: r.tanggal,
      waktu: r.waktu,
      nisn: r.studentNisn || '',
      namaSiswa: r.namaSiswa,
      jenisKelamin: r.jenisKelamin as 'L' | 'P',
      kelas: r.kelas,
      kategori: r.kategori as 'Ringan' | 'Sedang' | 'Berat',
      jenisPelanggaran: r.jenisPelanggaran,
      poin: r.poin,
      sanksi: r.sanksi,
      tempatKejadian: r.tempatKejadian || 'Lingkungan Sekolah',
      guruPelapor: r.guruPelapor,
      guruBK: r.guruBk,
      statusSanksi: r.statusSanksi as any,
      catatanPembinaan: r.catatanPembinaan || '',
      tenggatSanksi: r.tenggatSanksi || ''
    }));
  } catch (error) {
    console.error('Database query getAllViolations failed:', error);
    throw new Error('Gagal mengambil data pelanggaran dari database SQL.', { cause: error });
  }
}

// Create new violation record
export async function createViolation(record: ViolationRecord): Promise<void> {
  try {
    // If student NISN is provided, ensure student exists in students table
    if (record.nisn && record.nisn !== '-') {
      await db.insert(students)
        .values({
          nisn: record.nisn,
          nama: record.namaSiswa,
          jenisKelamin: record.jenisKelamin,
          kelas: record.kelas
        })
        .onConflictDoUpdate({
          target: students.nisn,
          set: {
            nama: record.namaSiswa,
            kelas: record.kelas,
            jenisKelamin: record.jenisKelamin,
            updatedAt: new Date()
          }
        });
    }

    await db.insert(violations)
      .values({
        id: record.id,
        tanggal: record.tanggal,
        waktu: record.waktu,
        studentNisn: (record.nisn && record.nisn !== '-') ? record.nisn : null,
        namaSiswa: record.namaSiswa,
        jenisKelamin: record.jenisKelamin,
        kelas: record.kelas,
        kategori: record.kategori,
        jenisPelanggaran: record.jenisPelanggaran,
        poin: record.poin,
        sanksi: record.sanksi,
        tempatKejadian: record.tempatKejadian,
        guruPelapor: record.guruPelapor,
        guruBk: record.guruBK,
        statusSanksi: record.statusSanksi,
        catatanPembinaan: record.catatanPembinaan,
        tenggatSanksi: record.tenggatSanksi,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: violations.id,
        set: {
          tanggal: record.tanggal,
          waktu: record.waktu,
          studentNisn: (record.nisn && record.nisn !== '-') ? record.nisn : null,
          namaSiswa: record.namaSiswa,
          jenisKelamin: record.jenisKelamin,
          kelas: record.kelas,
          kategori: record.kategori,
          jenisPelanggaran: record.jenisPelanggaran,
          poin: record.poin,
          sanksi: record.sanksi,
          tempatKejadian: record.tempatKejadian,
          guruPelapor: record.guruPelapor,
          guruBk: record.guruBK,
          statusSanksi: record.statusSanksi,
          catatanPembinaan: record.catatanPembinaan,
          tenggatSanksi: record.tenggatSanksi,
          updatedAt: new Date()
        }
      });
  } catch (error) {
    console.error('Database query createViolation failed:', error);
    throw new Error('Gagal menyimpan catatan pelanggaran ke database SQL.', { cause: error });
  }
}

// Update existing violation record
export async function updateViolation(id: string, record: Partial<ViolationRecord>): Promise<void> {
  try {
    const updateData: any = { updatedAt: new Date() };
    if (record.tanggal) updateData.tanggal = record.tanggal;
    if (record.waktu) updateData.waktu = record.waktu;
    if (record.namaSiswa) updateData.namaSiswa = record.namaSiswa;
    if (record.jenisKelamin) updateData.jenisKelamin = record.jenisKelamin;
    if (record.kelas) updateData.kelas = record.kelas;
    if (record.kategori) updateData.kategori = record.kategori;
    if (record.jenisPelanggaran) updateData.jenisPelanggaran = record.jenisPelanggaran;
    if (record.poin !== undefined) updateData.poin = record.poin;
    if (record.sanksi) updateData.sanksi = record.sanksi;
    if (record.tempatKejadian) updateData.tempatKejadian = record.tempatKejadian;
    if (record.guruPelapor) updateData.guruPelapor = record.guruPelapor;
    if (record.guruBK) updateData.guruBk = record.guruBK;
    if (record.statusSanksi) updateData.statusSanksi = record.statusSanksi;
    if (record.catatanPembinaan !== undefined) updateData.catatanPembinaan = record.catatanPembinaan;
    if (record.tenggatSanksi !== undefined) updateData.tenggatSanksi = record.tenggatSanksi;

    await db.update(violations).set(updateData).where(eq(violations.id, id));
  } catch (error) {
    console.error('Database query updateViolation failed:', error);
    throw new Error('Gagal memperbarui catatan pelanggaran di database SQL.', { cause: error });
  }
}

// Delete violation record
export async function deleteViolation(id: string): Promise<void> {
  try {
    await db.delete(violations).where(eq(violations.id, id));
  } catch (error) {
    console.error('Database query deleteViolation failed:', error);
    throw new Error('Gagal menghapus catatan pelanggaran dari database SQL.', { cause: error });
  }
}

// Fetch all students master data
export async function getAllStudents() {
  try {
    return await db.select().from(students).orderBy(students.kelas, students.nama);
  } catch (error) {
    console.error('Database query getAllStudents failed:', error);
    throw new Error('Gagal mengambil data siswa dari database SQL.', { cause: error });
  }
}

// Fetch School Profile
export async function getDbSchoolProfile(): Promise<SchoolProfile | null> {
  try {
    const rows = await db.select().from(schoolProfile).limit(1);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      namaSekolah: r.namaSekolah,
      npsn: r.npsn || '',
      alamat: r.alamat,
      kelurahanKecamatan: r.kelurahanKecamatan || '',
      kabupatenKota: r.kabupatenKota,
      provinsi: r.provinsi || '',
      kodePos: r.kodePos || '',
      namaKepalaSekolah: r.namaKepalaSekolah,
      nipKepalaSekolah: r.nipKepalaSekolah || '',
      namaGuruBK: r.namaGuruBk,
      nipGuruBK: r.nipGuruBk || '',
      namaWakasekKesiswaan: r.namaWakasekKesiswaan || '',
      nipWakasekKesiswaan: r.nipWakasekKesiswaan || ''
    };
  } catch (error) {
    console.error('Database query getDbSchoolProfile failed:', error);
    return null;
  }
}

// Update School Profile
export async function updateDbSchoolProfile(profile: SchoolProfile): Promise<void> {
  try {
    await db.insert(schoolProfile)
      .values({
        id: 1,
        namaSekolah: profile.namaSekolah,
        npsn: profile.npsn,
        alamat: profile.alamat,
        kelurahanKecamatan: profile.kelurahanKecamatan,
        kabupatenKota: profile.kabupatenKota,
        provinsi: profile.provinsi,
        kodePos: profile.kodePos,
        namaKepalaSekolah: profile.namaKepalaSekolah,
        nipKepalaSekolah: profile.nipKepalaSekolah,
        namaGuruBk: profile.namaGuruBK,
        nipGuruBk: profile.nipGuruBK,
        namaWakasekKesiswaan: profile.namaWakasekKesiswaan,
        nipWakasekKesiswaan: profile.nipWakasekKesiswaan,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: schoolProfile.id,
        set: {
          namaSekolah: profile.namaSekolah,
          npsn: profile.npsn,
          alamat: profile.alamat,
          kelurahanKecamatan: profile.kelurahanKecamatan,
          kabupatenKota: profile.kabupatenKota,
          provinsi: profile.provinsi,
          kodePos: profile.kodePos,
          namaKepalaSekolah: profile.namaKepalaSekolah,
          nipKepalaSekolah: profile.nipKepalaSekolah,
          namaGuruBk: profile.namaGuruBK,
          nipGuruBk: profile.nipGuruBK,
          namaWakasekKesiswaan: profile.namaWakasekKesiswaan,
          nipWakasekKesiswaan: profile.nipWakasekKesiswaan,
          updatedAt: new Date()
        }
      });
  } catch (error) {
    console.error('Database query updateDbSchoolProfile failed:', error);
    throw new Error('Gagal memperbarui profil sekolah di database SQL.', { cause: error });
  }
}
