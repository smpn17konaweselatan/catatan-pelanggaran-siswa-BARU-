import rawStudentsCsv from '../format_data/siswa.csv?raw';
import rawTeachersCsv from '../format_data/guru.csv?raw';

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

export function detectCsvDelimiter(text: string): string {
  const sample = text.split(/\r?\n/).slice(0, 5).join('\n');
  const semicolons = (sample.match(/;/g) || []).length;
  const commas = (sample.match(/,/g) || []).length;
  const tabs = (sample.match(/\t/g) || []).length;
  if (semicolons >= commas && semicolons > 0) return ';';
  if (tabs > commas && tabs > 0) return '\t';
  return ',';
}

export function parseCsvLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
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

export function parseStudentsCsv(csvText: string): StudentMasterItem[] {
  const cleanText = (csvText || '').replace(/^\uFEFF/, '').trim();
  const delimiter = detectCsvDelimiter(cleanText);
  const lines = cleanText.split(/\r?\n/);
  if (lines.length <= 1) return [];

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

  const items: StudentMasterItem[] = [];
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
    if (!nama || nama.toLowerCase() === 'nama') continue;

    const jkRaw = (parts[actualJkIdx] || 'L').trim().toUpperCase();
    items.push({
      nis: (parts[actualNisIdx] || '').trim(),
      nisn: (parts[actualNisnIdx] || '').trim(),
      nama,
      jenisKelamin: (jkRaw.startsWith('P') ? 'P' : 'L') as 'L' | 'P',
      kelas: (parts[actualKelasIdx] || 'VII-A').trim()
    });
  }
  return items;
}

export function parseTeachersCsv(csvText: string): TeacherMasterItem[] {
  const cleanText = (csvText || '').replace(/^\uFEFF/, '').trim();
  const delimiter = detectCsvDelimiter(cleanText);
  const lines = cleanText.split(/\r?\n/);
  if (lines.length <= 1) return [];

  const headerParts = parseCsvLine(lines[0], delimiter).map(h => h.toLowerCase());
  const nipIdx = headerParts.findIndex(h => h.includes('nip'));
  const namaIdx = headerParts.findIndex(h => h.includes('nama') || h.includes('guru'));
  const jabatanIdx = headerParts.findIndex(h => h.includes('jabatan') || h.includes('mapel') || h.includes('tugas'));
  const peranIdx = headerParts.findIndex(h => h.includes('peran') || h.includes('status'));

  const actualNipIdx = nipIdx >= 0 ? nipIdx : 0;
  const actualNamaIdx = namaIdx >= 0 ? namaIdx : 1;
  const actualJabatanIdx = jabatanIdx >= 0 ? jabatanIdx : 2;
  const actualPeranIdx = peranIdx >= 0 ? peranIdx : 3;

  const items: TeacherMasterItem[] = [];
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

    items.push({
      nip: (parts[actualNipIdx] || '-').trim(),
      nama,
      jabatan: (parts[actualJabatanIdx] || 'Guru Mata Pelajaran').trim(),
      peran: (parts[actualPeranIdx] || 'Guru Pelapor').trim()
    });
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
