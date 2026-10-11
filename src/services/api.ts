import { ViolationRecord, SchoolProfile } from '../types/violation.ts';
import { 
  MASTER_STUDENTS, 
  MASTER_TEACHERS, 
  StudentMasterItem, 
  TeacherMasterItem,
  syncMasterDataFromSource
} from '../data/schoolMasterData.ts';
import { DEFAULT_SCHOOL_PROFILE } from '../data/rulesCatalog.ts';
import { 
  generateSqliteDbBuffer, 
  parseSqliteDbBuffer, 
  inspectSqliteDbBuffer, 
  generateSqlDumpText 
} from '../utils/sqliteClient.ts';

const STORAGE_KEY_RECORDS = 'buku_pelanggaran_records_v1';
const STORAGE_KEY_PROFILE = 'buku_pelanggaran_profile_v1';

export async function fetchViolationsFromSql(): Promise<ViolationRecord[]> {
  // If in Electron, check if there is an active SQLite file on disk
  if (typeof window !== 'undefined' && window.electronAPI?.getActiveSqliteDb) {
    try {
      const activeDb = await window.electronAPI.getActiveSqliteDb();
      if (activeDb?.exists && activeDb.buffer) {
        const parsed = await parseSqliteDbBuffer(activeDb.buffer);
        if (parsed.violations && parsed.violations.length > 0) {
          return parsed.violations;
        }
      }
    } catch (err) {
      console.warn('[Electron] Could not read active sqlite db:', err);
    }
  }

  try {
    const res = await fetch('/api/violations');
    if (res.ok) {
      return await res.json();
    }
  } catch (_) {}

  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
  }

  return [];
}

export async function fetchStudentsFromSql(): Promise<StudentMasterItem[]> {
  if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
    await syncMasterDataFromSource();
    return [...MASTER_STUDENTS];
  }
  try {
    const res = await fetch('/api/students');
    if (!res.ok) {
      await syncMasterDataFromSource();
      return [...MASTER_STUDENTS];
    }
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : [...MASTER_STUDENTS];
  } catch (e) {
    await syncMasterDataFromSource();
    return [...MASTER_STUDENTS];
  }
}

export async function fetchTeachersFromSql(): Promise<TeacherMasterItem[]> {
  if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
    await syncMasterDataFromSource();
    return [...MASTER_TEACHERS];
  }
  try {
    const res = await fetch('/api/teachers');
    if (!res.ok) {
      await syncMasterDataFromSource();
      return [...MASTER_TEACHERS];
    }
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : [...MASTER_TEACHERS];
  } catch (e) {
    await syncMasterDataFromSource();
    return [...MASTER_TEACHERS];
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

export async function clearAllViolationsFromSql(): Promise<{ count: number; message: string }> {
  const res = await fetch('/api/violations', {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Gagal mengosongkan seluruh data pelanggaran dari database SQLite.');
  }
  return await res.json();
}

export async function fetchSchoolProfileFromSql(): Promise<SchoolProfile | null> {
  // If in Electron, check active SQLite file
  if (typeof window !== 'undefined' && window.electronAPI?.getActiveSqliteDb) {
    try {
      const activeDb = await window.electronAPI.getActiveSqliteDb();
      if (activeDb?.exists && activeDb.buffer) {
        const parsed = await parseSqliteDbBuffer(activeDb.buffer);
        if (parsed.profile) {
          return parsed.profile;
        }
      }
    } catch (_) {}
  }

  try {
    const res = await fetch('/api/school-profile');
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Could not fetch school profile from SQLite API:', e);
  }

  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
  }

  return null;
}

export async function updateSchoolProfileInSql(profile: SchoolProfile): Promise<void> {
  // Save to localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    } catch (_) {}
  }

  try {
    const res = await fetch('/api/school-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.warn('Server SQLite profile update warning:', data.error);
    }
  } catch (_) {}
}

export interface DownloadDbResult {
  success: boolean;
  canceled?: boolean;
  filePath?: string;
  error?: string;
}

// Download real physical SQLite database binary file (.db)
export async function downloadSqliteDbFile(
  records?: ViolationRecord[],
  profile?: SchoolProfile
): Promise<DownloadDbResult> {
  let recordsToExport = records;
  let profileToExport = profile;

  if (!recordsToExport && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (saved) recordsToExport = JSON.parse(saved);
    } catch (_) {}
  }
  if (!recordsToExport) recordsToExport = [];

  if (!profileToExport && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (saved) profileToExport = JSON.parse(saved);
    } catch (_) {}
  }
  if (!profileToExport) profileToExport = DEFAULT_SCHOOL_PROFILE;

  // Generate binary SQLite 3 .db
  const dbBuffer = await generateSqliteDbBuffer(
    recordsToExport,
    profileToExport,
    MASTER_STUDENTS,
    MASTER_TEACHERS
  );

  const cleanSchoolName = (profileToExport.namaSekolah || 'SMPN17_KONSEL')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const defaultFileName = `buku_pelanggaran_${cleanSchoolName}_${dateStr}.db`;

  // 1. If in Electron, save via native Windows Save File Dialog
  if (typeof window !== 'undefined' && window.electronAPI?.isElectron && window.electronAPI?.saveSqliteDb) {
    try {
      const res = await window.electronAPI.saveSqliteDb(dbBuffer, defaultFileName);
      if (res.canceled) {
        return { success: false, canceled: true };
      }
      if (res.success) {
        return { success: true, filePath: res.filePath };
      }
    } catch (err: any) {
      console.warn('[Electron] Save DB dialog error, falling back to blob download:', err);
    }
  }

  // 2. Browser Blob download fallback
  try {
    const blob = new Blob([dbBuffer as any], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export interface MergeDbResult {
  success: boolean;
  mode: 'merged' | 'replaced';
  totalViolations: number;
  newViolationsCount: number;
  existingViolationsCount: number;
  studentsCount: number;
  teachersCount: number;
  message?: string;
  importedViolations?: ViolationRecord[];
  importedProfile?: SchoolProfile | null;
}

export interface DatabaseInspectionResult {
  valid: boolean;
  violationsCount: number;
  studentsCount: number;
  teachersCount: number;
  schoolName: string;
  sampleViolations: Array<{
    id: string;
    namaSiswa: string;
    jenisPelanggaran: string;
    tanggal: string;
    poin: number;
    kategori: string;
    kelas: string;
  }>;
}

// Inspect physical SQLite database file (.db) to preview before merge/replace
export async function inspectSqliteDbFile(file: File): Promise<DatabaseInspectionResult> {
  const buffer = await file.arrayBuffer();

  // If in Electron, inspect directly via client-side SQLite engine
  if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
    return await inspectSqliteDbBuffer(buffer);
  }

  // If in browser, try server API first, fallback to client-side inspect
  try {
    const res = await fetch('/api/database/inspect-sqlite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-sqlite3' },
      body: buffer,
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Server inspect endpoint unavailable, using in-browser inspection:', err);
  }

  return await inspectSqliteDbBuffer(buffer);
}

// Upload and restore/merge physical SQLite database file (.db)
export async function uploadSqliteDbFile(
  file: File, 
  merge: boolean = true,
  currentRecords: ViolationRecord[] = [],
  currentProfile: SchoolProfile | null = null
): Promise<MergeDbResult> {
  const buffer = await file.arrayBuffer();

  const runClientMerge = async (): Promise<MergeDbResult> => {
    const { violations: incomingViolations, profile: incomingProfile, studentsCount, teachersCount } = 
      await parseSqliteDbBuffer(buffer);

    let finalViolations: ViolationRecord[] = [];
    let newViolationsCount = 0;
    let existingViolationsCount = currentRecords.length;

    if (merge) {
      finalViolations = [...currentRecords];
      const existingIds = new Set(currentRecords.map(r => r.id));
      const existingKeySet = new Set(
        currentRecords.map(r => `${(r.namaSiswa || '').trim().toLowerCase()}_${r.tanggal}_${(r.jenisPelanggaran || '').trim().toLowerCase()}`)
      );

      for (const inv of incomingViolations) {
        const key = `${(inv.namaSiswa || '').trim().toLowerCase()}_${inv.tanggal}_${(inv.jenisPelanggaran || '').trim().toLowerCase()}`;
        if (!existingIds.has(inv.id) && !existingKeySet.has(key)) {
          finalViolations.push(inv);
          existingIds.add(inv.id);
          existingKeySet.add(key);
          newViolationsCount++;
        }
      }
    } else {
      finalViolations = [...incomingViolations];
      newViolationsCount = incomingViolations.length;
      existingViolationsCount = 0;
    }

    finalViolations.sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));

    let finalProfile = currentProfile;
    if (incomingProfile && (!merge || !currentProfile || currentProfile.namaSekolah === DEFAULT_SCHOOL_PROFILE.namaSekolah)) {
      finalProfile = { ...(currentProfile || DEFAULT_SCHOOL_PROFILE), ...incomingProfile };
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(finalViolations));
        if (finalProfile) {
          localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(finalProfile));
        }
      } catch (e) {
        console.warn('Could not save to localStorage:', e);
      }

      if (window.electronAPI?.saveActiveSqliteDb) {
        try {
          const binaryDb = await generateSqliteDbBuffer(
            finalViolations, 
            finalProfile || DEFAULT_SCHOOL_PROFILE, 
            MASTER_STUDENTS, 
            MASTER_TEACHERS
          );
          await window.electronAPI.saveActiveSqliteDb(binaryDb);
        } catch (e) {
          console.warn('[Electron] Could not save active sqlite db to disk:', e);
        }
      }
    }

    return {
      success: true,
      mode: merge ? 'merged' : 'replaced',
      totalViolations: finalViolations.length,
      newViolationsCount,
      existingViolationsCount,
      studentsCount,
      teachersCount,
      importedViolations: finalViolations,
      importedProfile: finalProfile,
      message: merge 
        ? `Database berhasil digabungkan: +${newViolationsCount} data baru ditambahkan ke database (Total: ${finalViolations.length} data)`
        : `Database berhasil dipulihkan & ditimpa (${finalViolations.length} data pelanggaran)`
    };
  };

  if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
    return await runClientMerge();
  }

  try {
    const res = await fetch(`/api/database/upload-sqlite?merge=${merge}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-sqlite3' },
      body: buffer,
    });
    if (res.ok) {
      const serverResult = await res.json();
      return serverResult;
    }
  } catch (err) {
    console.warn('Server upload endpoint unreachable, falling back to client merge:', err);
  }

  return await runClientMerge();
}

// Download SQL text script (.sql)
export async function downloadSqlDatabaseFile(
  records?: ViolationRecord[],
  profile?: SchoolProfile
): Promise<void> {
  let recordsToExport = records;
  let profileToExport = profile;

  if (!recordsToExport && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (saved) recordsToExport = JSON.parse(saved);
    } catch (_) {}
  }
  if (!recordsToExport) recordsToExport = [];

  if (!profileToExport && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (saved) profileToExport = JSON.parse(saved);
    } catch (_) {}
  }
  if (!profileToExport) profileToExport = DEFAULT_SCHOOL_PROFILE;

  const sqlDump = generateSqlDumpText(
    recordsToExport,
    profileToExport,
    MASTER_STUDENTS,
    MASTER_TEACHERS
  );

  const cleanSchoolName = (profileToExport.namaSekolah || 'SMPN17_KONSEL')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `database_pelanggaran_${cleanSchoolName}_${dateStr}.sql`;

  const blob = new Blob([sqlDump], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

// Download Master Guru CSV (.csv)
export function downloadMasterTeachersCsv() {
  const a = document.createElement('a');
  a.href = '/api/master/download/guru.csv';
  a.download = 'guru.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
export const downloadMasterTeachersExcel = downloadMasterTeachersCsv;

// Download Master Siswa CSV (.csv)
export function downloadMasterStudentsCsv() {
  const a = document.createElement('a');
  a.href = '/api/master/download/siswa.csv';
  a.download = 'siswa.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
export const downloadMasterStudentsExcel = downloadMasterStudentsCsv;

// Upload & replace Master Guru (.csv)
export async function uploadMasterTeachersFile(file: File): Promise<{ count: number; message: string }> {
  const buffer = await file.arrayBuffer();
  const res = await fetch('/api/master/upload/guru', {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: buffer,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Gagal mengunggah file data master guru.');
  }
  return await res.json();
}

// Upload & replace Master Siswa (.csv)
export async function uploadMasterStudentsFile(file: File): Promise<{ count: number; message: string }> {
  const buffer = await file.arrayBuffer();
  const res = await fetch('/api/master/upload/siswa', {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: buffer,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Gagal mengunggah file data master siswa.');
  }
  return await res.json();
}

// Force refresh master data from files into SQLite
export async function refreshMasterDataFromDisk(): Promise<{ teachersCount: number; studentsCount: number; message: string }> {
  const res = await fetch('/api/master/refresh', { method: 'POST' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Gagal menyinkronkan data dari file.');
  }
  return await res.json();
}
