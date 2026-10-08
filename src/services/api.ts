import { ViolationRecord, SchoolProfile } from '../types/violation.ts';
import { MASTER_STUDENTS, MASTER_TEACHERS, StudentMasterItem, TeacherMasterItem } from '../data/schoolMasterData.ts';

export async function fetchViolationsFromSql(): Promise<ViolationRecord[]> {
  const res = await fetch('/api/violations');
  if (!res.ok) {
    throw new Error('Gagal mengambil data dari database SQLite.');
  }
  return await res.json();
}

export async function fetchStudentsFromSql(): Promise<StudentMasterItem[]> {
  try {
    const res = await fetch('/api/students');
    if (!res.ok) return MASTER_STUDENTS;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : MASTER_STUDENTS;
  } catch (e) {
    console.warn('Could not fetch students from API, using master student list:', e);
    return MASTER_STUDENTS;
  }
}

export async function fetchTeachersFromSql(): Promise<TeacherMasterItem[]> {
  try {
    const res = await fetch('/api/teachers');
    if (!res.ok) return MASTER_TEACHERS;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : MASTER_TEACHERS;
  } catch (e) {
    console.warn('Could not fetch teachers from API, using master teacher list:', e);
    return MASTER_TEACHERS;
  }
}

export async function saveViolationToSql(record: ViolationRecord): Promise<void> {
  const res = await fetch('/api/violations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Gagal menyimpan ke database SQLite.');
  }
}

export async function updateViolationInSql(id: string, record: Partial<ViolationRecord>): Promise<void> {
  const res = await fetch(`/api/violations/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Gagal memperbarui data di database SQLite.');
  }
}

export async function deleteViolationFromSql(id: string): Promise<void> {
  const res = await fetch(`/api/violations/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Gagal menghapus data dari database SQLite.');
  }
}

export async function fetchSchoolProfileFromSql(): Promise<SchoolProfile | null> {
  try {
    const res = await fetch('/api/school-profile');
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('Could not fetch school profile from SQLite:', e);
    return null;
  }
}

export async function updateSchoolProfileInSql(profile: SchoolProfile): Promise<void> {
  const res = await fetch('/api/school-profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Gagal memperbarui profil sekolah di database SQLite.');
  }
}

// Download real physical SQLite database file (.db)
export function downloadSqliteDbFile() {
  const a = document.createElement('a');
  a.href = '/api/database/download-sqlite';
  a.download = 'buku_pelanggaran_sekolah.db';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Upload and restore physical SQLite database file (.db)
export async function uploadSqliteDbFile(file: File): Promise<void> {
  const buffer = await file.arrayBuffer();
  const res = await fetch('/api/database/upload-sqlite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-sqlite3' },
    body: buffer,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Gagal mengunggah file database SQLite.');
  }
}

// Download SQL text script (.sql)
export function downloadSqlDatabaseFile() {
  const a = document.createElement('a');
  a.href = '/api/sql-dump';
  a.download = 'database_buku_pelanggaran_siswa.sql';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
