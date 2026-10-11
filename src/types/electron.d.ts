export interface ElectronMasterDataResult {
  formatDataDir: string;
  studentsFilePath: string | null;
  teachersFilePath: string | null;
  studentsCsv: string | null;
  teachersCsv: string | null;
  hasStudentsFile: boolean;
  hasTeachersFile: boolean;
  timestamp: number;
}

export interface ElectronSaveDbResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  canceled?: boolean;
  error?: string;
}

export interface ElectronOpenDbResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  buffer?: ArrayBuffer;
  canceled?: boolean;
  error?: string;
}

export interface ElectronActiveDbResult {
  exists: boolean;
  path?: string;
  fileSize?: number;
  buffer?: ArrayBuffer;
  error?: string;
}

export interface ElectronAPI {
  isElectron: boolean;
  getMasterData: () => Promise<ElectronMasterDataResult>;
  reloadMasterData: () => Promise<ElectronMasterDataResult>;
  openFormatDataFolder: () => Promise<{ success: boolean; dir: string }>;
  openUserDataFolder?: () => Promise<{ success: boolean; dir: string }>;
  onMasterDataUpdated: (callback: (data: ElectronMasterDataResult) => void) => () => void;
  onToastNotification?: (callback: (data: { type: string; message: string }) => void) => () => void;
  
  // SQLite Database Native File Operations
  saveSqliteDb?: (buffer: Uint8Array | ArrayBuffer, defaultName?: string) => Promise<ElectronSaveDbResult>;
  openSqliteDbDialog?: () => Promise<ElectronOpenDbResult>;
  saveActiveSqliteDb?: (buffer: Uint8Array | ArrayBuffer) => Promise<{ success: boolean; path?: string; error?: string }>;
  getActiveSqliteDb?: () => Promise<ElectronActiveDbResult>;
  
  // Menu trigger listeners
  onMenuImportDb?: (callback: () => void) => () => void;
  onMenuExportDb?: (callback: () => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
