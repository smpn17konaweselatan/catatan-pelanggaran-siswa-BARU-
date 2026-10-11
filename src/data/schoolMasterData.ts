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
 * Raw CSV content imported dynamically from /src/format_data/siswa.csv and /src/format_data/guru.csv.
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

// Master data lists parsed directly from /src/format_data/siswa.csv and /src/format_data/guru.csv
// These arrays are mutated in-place when updated from external files or SQLite backend
const initialStudentsCsv = (typeof window !== 'undefined' && localStorage.getItem('bk_cached_students_csv')) || RAW_STUDENTS_CSV;
const initialTeachersCsv = (typeof window !== 'undefined' && localStorage.getItem('bk_cached_teachers_csv')) || RAW_TEACHERS_CSV;

export const MASTER_STUDENTS: StudentMasterItem[] = parseStudentsCsv(initialStudentsCsv);
export const MASTER_TEACHERS: TeacherMasterItem[] = parseTeachersCsv(initialTeachersCsv);

export interface MasterSyncInfo {
  studentsCount: number;
  teachersCount: number;
  source: 'electron-external' | 'sqlite' | 'bundled-csv' | 'local-cache';
  sourceDir?: string;
  studentsFilePath?: string | null;
  teachersFilePath?: string | null;
  lastUpdated: number;
}

let currentSyncInfo: MasterSyncInfo = {
  studentsCount: MASTER_STUDENTS.length,
  teachersCount: MASTER_TEACHERS.length,
  source: typeof window !== 'undefined' && localStorage.getItem('bk_cached_students_csv') ? 'local-cache' : 'bundled-csv',
  lastUpdated: Date.now(),
};

type MasterDataListener = (info: MasterSyncInfo) => void;
const listeners = new Set<MasterDataListener>();

export function subscribeMasterData(listener: MasterDataListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  currentSyncInfo = {
    ...currentSyncInfo,
    studentsCount: MASTER_STUDENTS.length,
    teachersCount: MASTER_TEACHERS.length,
    lastUpdated: Date.now(),
  };
  listeners.forEach((fn) => {
    try {
      fn(currentSyncInfo);
    } catch (err) {
      console.error('[MasterData] Listener error:', err);
    }
  });
}

/**
 * Update the in-memory MASTER_STUDENTS and MASTER_TEACHERS arrays in-place
 */
export function updateMasterDataArrays(
  studentsCsv?: string | null,
  teachersCsv?: string | null,
  metadata?: Partial<MasterSyncInfo>
): boolean {
  let changed = false;

  if (studentsCsv && studentsCsv.trim().length > 0) {
    const parsedStudents = parseStudentsCsv(studentsCsv);
    if (parsedStudents.length > 0) {
      MASTER_STUDENTS.length = 0;
      MASTER_STUDENTS.push(...parsedStudents);
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('bk_cached_students_csv', studentsCsv); } catch (_) {}
      }
      changed = true;
    }
  }

  if (teachersCsv && teachersCsv.trim().length > 0) {
    const parsedTeachers = parseTeachersCsv(teachersCsv);
    if (parsedTeachers.length > 0) {
      MASTER_TEACHERS.length = 0;
      MASTER_TEACHERS.push(...parsedTeachers);
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('bk_cached_teachers_csv', teachersCsv); } catch (_) {}
      }
      changed = true;
    }
  }

  if (changed || metadata) {
    currentSyncInfo = {
      ...currentSyncInfo,
      ...metadata,
      studentsCount: MASTER_STUDENTS.length,
      teachersCount: MASTER_TEACHERS.length,
      lastUpdated: Date.now(),
    };
    notifyListeners();
  }

  return changed;
}

export function getMasterSyncInfo(): MasterSyncInfo {
  return { ...currentSyncInfo };
}

/**
 * Synchronize master data from external files (Electron resources/format_data) or backend
 */
export async function syncMasterDataFromSource(): Promise<MasterSyncInfo> {
  // 1. If running inside Electron desktop app, read directly from resources/format_data
  if (typeof window !== 'undefined' && window.electronAPI?.getMasterData) {
    try {
      const data = await window.electronAPI.getMasterData();
      if (data && (data.studentsCsv || data.teachersCsv)) {
        updateMasterDataArrays(data.studentsCsv, data.teachersCsv, {
          source: 'electron-external',
          sourceDir: data.formatDataDir,
          studentsFilePath: data.studentsFilePath,
          teachersFilePath: data.teachersFilePath,
        });
        return getMasterSyncInfo();
      }
    } catch (err) {
      console.warn('[MasterData] Failed to read from Electron format_data:', err);
    }
  }

  // 2. Fallback to API endpoint if running in web/server mode
  if (typeof window !== 'undefined' && !window.electronAPI?.isElectron) {
    try {
      const [stuRes, teaRes] = await Promise.allSettled([
        fetch('/api/master/download/siswa.csv').then(r => r.ok ? r.text() : null),
        fetch('/api/master/download/guru.csv').then(r => r.ok ? r.text() : null),
      ]);
      const stuCsv = stuRes.status === 'fulfilled' ? stuRes.value : null;
      const teaCsv = teaRes.status === 'fulfilled' ? teaRes.value : null;
      if (stuCsv || teaCsv) {
        updateMasterDataArrays(stuCsv, teaCsv, {
          source: 'sqlite',
        });
        return getMasterSyncInfo();
      }
    } catch (_) {}
  }

  return getMasterSyncInfo();
}

/**
 * Open format_data folder in Windows Explorer (Desktop Edition)
 */
export async function openFormatDataFolderInExplorer(): Promise<boolean> {
  if (typeof window !== 'undefined' && window.electronAPI?.openFormatDataFolder) {
    try {
      const result = await window.electronAPI.openFormatDataFolder();
      return result?.success ?? false;
    } catch (e) {
      console.warn('[MasterData] Could not open format_data in explorer:', e);
    }
  }
  return false;
}

// Auto-initialize Electron synchronization and file watcher subscription
if (typeof window !== 'undefined') {
  // Immediate sync on load
  setTimeout(() => {
    syncMasterDataFromSource();
  }, 100);

  // Subscribe to live file updates pushed by Electron main process
  if (window.electronAPI?.onMasterDataUpdated) {
    window.electronAPI.onMasterDataUpdated((data) => {
      if (data && (data.studentsCsv || data.teachersCsv)) {
        updateMasterDataArrays(data.studentsCsv, data.teachersCsv, {
          source: 'electron-external',
          sourceDir: data.formatDataDir,
          studentsFilePath: data.studentsFilePath,
          teachersFilePath: data.teachersFilePath,
        });
      }
    });
  }

  // Sync when window refocuses (e.g. user edited in Excel/Notepad and switched back)
  window.addEventListener('focus', () => {
    syncMasterDataFromSource();
  });
}

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

