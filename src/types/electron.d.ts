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

export interface ElectronAPI {
  isElectron: boolean;
  getMasterData: () => Promise<ElectronMasterDataResult>;
  reloadMasterData: () => Promise<ElectronMasterDataResult>;
  openFormatDataFolder: () => Promise<{ success: boolean; dir: string }>;
  onMasterDataUpdated: (callback: (data: ElectronMasterDataResult) => void) => () => void;
  onToastNotification?: (callback: (data: { type: string; message: string }) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
