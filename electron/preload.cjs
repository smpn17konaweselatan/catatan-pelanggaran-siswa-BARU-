const { contextBridge, ipcRenderer } = require('electron');

// Expose safe, typed Electron API to renderer (React)
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  // Fetch current master data from resources/format_data
  getMasterData: () => ipcRenderer.invoke('get-master-data'),

  // Force re-read master data files
  reloadMasterData: () => ipcRenderer.invoke('reload-master-data'),

  // Open the resources/format_data folder directly in Windows Explorer
  openFormatDataFolder: () => ipcRenderer.invoke('open-format-data-folder'),

  // Open application user data folder
  openUserDataFolder: () => ipcRenderer.invoke('open-user-data-folder'),

  // Listen to file change updates (real-time file watching on Windows)
  onMasterDataUpdated: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('master-data-updated', handler);
    return () => ipcRenderer.removeListener('master-data-updated', handler);
  },

  // Save SQLite .db binary file to user-chosen path (native Windows Save Dialog)
  saveSqliteDb: (buffer, defaultName) => ipcRenderer.invoke('save-sqlite-db', { buffer, defaultName }),

  // Pick SQLite .db file from disk (native Windows Open Dialog)
  openSqliteDbDialog: () => ipcRenderer.invoke('open-sqlite-db-dialog'),

  // Save active database to application data directory on disk
  saveActiveSqliteDb: (buffer) => ipcRenderer.invoke('save-active-sqlite-db', { buffer }),

  // Read active database from disk if available
  getActiveSqliteDb: () => ipcRenderer.invoke('get-active-sqlite-db'),

  // Listen to toast notifications from native menu
  onToastNotification: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('toast-notification', handler);
    return () => ipcRenderer.removeListener('toast-notification', handler);
  },

  // Listen to native menu actions
  onMenuImportDb: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('menu-import-db', handler);
    return () => ipcRenderer.removeListener('menu-import-db', handler);
  },

  onMenuExportDb: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('menu-export-db', handler);
    return () => ipcRenderer.removeListener('menu-export-db', handler);
  },
});
