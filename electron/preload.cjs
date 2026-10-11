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

  // Listen to file change updates (real-time file watching on Windows)
  onMasterDataUpdated: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('master-data-updated', handler);
    return () => ipcRenderer.removeListener('master-data-updated', handler);
  },

  // Listen to toast notifications from native menu
  onToastNotification: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('toast-notification', handler);
    return () => ipcRenderer.removeListener('toast-notification', handler);
  },
});
