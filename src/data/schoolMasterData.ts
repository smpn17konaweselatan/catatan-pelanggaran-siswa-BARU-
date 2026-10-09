import rawStudentsCsv from '../db/siswa.csv?raw';
import rawTeachersCsv from '../db/guru.csv?raw';

export interface StudentMasterItem {
  nis: string;
  nisn: string;
  nama: string;
  jenisKelamin: 'L' | 'P';
  kelas: string;
}

export interface TeacherMasterItem {
  nip: string;
  nama: string;
  jabatan: string;
  peran: string;
}

/**
 * Raw CSV content imported dynamically from /src/db/siswa.csv and /src/db/guru.csv.
 * Updating either CSV file will automatically update student and teacher suggestions.
 */
export const RAW_STUDENTS_CSV = rawStudentsCsv;
export const RAW_TEACHERS_CSV = rawTeachersCsv;

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseStudentsCsv(csvText: string): StudentMasterItem[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length <= 1) return [];

  const items: StudentMasterItem[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = parseCsvLine(line);
    if (parts.length >= 5) {
      items.push({
        nis: parts[0]?.trim() || '',
        nisn: parts[1]?.trim() || '',
        nama: parts[2]?.trim() || '',
        jenisKelamin: (parts[3]?.trim().toUpperCase() === 'P' ? 'P' : 'L') as 'L' | 'P',
        kelas: parts[4]?.trim() || ''
      });
    }
  }
  return items;
}

export function parseTeachersCsv(csvText: string): TeacherMasterItem[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length <= 1) return [];

  const items: TeacherMasterItem[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = parseCsvLine(line);
    if (parts.length >= 4) {
      items.push({
        nip: parts[0]?.trim() || '',
        nama: parts[1]?.trim() || '',
        jabatan: parts[2]?.trim() || '',
        peran: parts[3]?.trim() || 'Guru'
      });
    }
  }
  return items;
}

// Master data lists parsed directly from /src/db/siswa.csv and /src/db/guru.csv
export const MASTER_STUDENTS: StudentMasterItem[] = parseStudentsCsv(RAW_STUDENTS_CSV);
export const MASTER_TEACHERS: TeacherMasterItem[] = parseTeachersCsv(RAW_TEACHERS_CSV);

export function searchStudents(query: string, limit = 10): StudentMasterItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return MASTER_STUDENTS.filter(s => 
    s.nama.toLowerCase().includes(q) ||
    s.nis.toLowerCase().includes(q) ||
    s.nisn.toLowerCase().includes(q) ||
    s.kelas.toLowerCase().includes(q)
  ).slice(0, limit);
}

export function searchTeachers(query: string, limit = 8): TeacherMasterItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return MASTER_TEACHERS.slice(0, limit);

  return MASTER_TEACHERS.filter(t =>
    t.nama.toLowerCase().includes(q) ||
    t.jabatan.toLowerCase().includes(q) ||
    t.peran.toLowerCase().includes(q)
  ).slice(0, limit);
}
