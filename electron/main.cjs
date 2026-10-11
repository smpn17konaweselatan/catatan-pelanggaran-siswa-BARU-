const { app, BrowserWindow, Menu, shell, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let fileWatcher = null;
let watchDebounceTimer = null;

function resolveAppIcon() {
  const possiblePaths = [
    path.join(__dirname, '../public/pwa-512x512.png'),
    path.join(__dirname, '../dist/pwa-512x512.png'),
    path.join(__dirname, 'icon.png'),
    path.join(process.resourcesPath, 'app.asar.unpacked/public/pwa-512x512.png'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

/**
 * Locate the actual format_data directory across packaged / portable / dev modes
 */
function resolveFormatDataDir() {
  const candidates = [
    // 1. Packaged NSIS / Portable: resources/format_data (from extraResources)
    path.join(process.resourcesPath, 'format_data'),
    path.join(process.resourcesPath, '../resources/format_data'),
    // 2. Beside executable directory
    path.join(path.dirname(process.execPath), 'resources/format_data'),
    path.join(path.dirname(process.execPath), 'format_data'),
    // 3. appPath
    path.join(app.getAppPath(), 'format_data'),
    path.join(app.getAppPath(), 'src/format_data'),
    // 4. Current working directory
    path.join(process.cwd(), 'resources/format_data'),
    path.join(process.cwd(), 'src/format_data'),
    // 5. Development relative to main.cjs
    path.join(__dirname, '../src/format_data'),
    path.join(__dirname, '../resources/format_data'),
  ];

  for (const dir of candidates) {
    try {
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        return dir;
      }
    } catch (_) {}
  }

  // Default to standard Electron extraResources path
  return path.join(process.resourcesPath || __dirname, 'format_data');
}

/**
 * Find master file supporting .csv, .txt, .svg (in case user renamed/saved as svg), etc.
 */
function findMasterFile(dir, baseName) {
  if (!fs.existsSync(dir)) return null;

  // Exact checks with common extensions (case variations)
  const candidateNames = [
    `${baseName}.csv`,
    `${baseName}.CSV`,
    `${baseName}.txt`,
    `${baseName}.TXT`,
    `${baseName}.svg`, // Support in case file was saved/named as .svg as reported
    `${baseName}.SVG`,
    `${baseName}.tsv`,
    `${baseName}.TSV`,
  ];

  for (const name of candidateNames) {
    const fullPath = path.join(dir, name);
    if (fs.existsSync(fullPath)) return fullPath;
  }

  // Fuzzy scan: find any file whose name starts with or contains baseName
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const lower = file.toLowerCase();
      if (lower.startsWith(baseName.toLowerCase()) || lower.includes(baseName.toLowerCase())) {
        return path.join(dir, file);
      }
    }
  } catch (_) {}

  return null;
}

/**
 * Read student and teacher data directly from format_data folder
 */
function readMasterData() {
  const dir = resolveFormatDataDir();
  let studentsCsv = null;
  let teachersCsv = null;
  let studentsFilePath = null;
  let teachersFilePath = null;

  try {
    studentsFilePath = findMasterFile(dir, 'siswa');
    if (studentsFilePath && fs.existsSync(studentsFilePath)) {
      studentsCsv = fs.readFileSync(studentsFilePath, 'utf8');
    }
  } catch (err) {
    console.error('[Electron] Error reading siswa file:', err);
  }

  try {
    teachersFilePath = findMasterFile(dir, 'guru');
    if (teachersFilePath && fs.existsSync(teachersFilePath)) {
      teachersCsv = fs.readFileSync(teachersFilePath, 'utf8');
    }
  } catch (err) {
    console.error('[Electron] Error reading guru file:', err);
  }

  return {
    formatDataDir: dir,
    studentsFilePath,
    teachersFilePath,
    studentsCsv,
    teachersCsv,
    hasStudentsFile: !!studentsCsv,
    hasTeachersFile: !!teachersCsv,
    timestamp: Date.now(),
  };
}

/**
 * Watch format_data directory for live edits from Windows Explorer / Excel
 */
function setupDirectoryWatcher(win) {
  const dir = resolveFormatDataDir();
  if (!fs.existsSync(dir)) return;

  try {
    if (fileWatcher) {
      fileWatcher.close();
      fileWatcher = null;
    }

    fileWatcher = fs.watch(dir, () => {
      if (watchDebounceTimer) clearTimeout(watchDebounceTimer);
      watchDebounceTimer = setTimeout(() => {
        if (win && !win.isDestroyed()) {
          const data = readMasterData();
          win.webContents.send('master-data-updated', data);
        }
      }, 300);
    });
  } catch (err) {
    console.warn('[Electron] Could not watch format_data directory:', err);
  }
}

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.cjs');

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'Buku Catatan Pelanggaran Siswa & Tata Tertib Sekolah - SMPN 17 Konawe Selatan',
    icon: resolveAppIcon(),
    backgroundColor: '#f8fafc',
    autoHideMenuBar: true,
    show: false, // Show once ready-to-show to prevent flicker
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: preloadPath,
      spellcheck: false,
    },
  });

  // Native application menu with useful keyboard shortcuts
  const template = [
    {
      label: 'Berkas',
      submenu: [
        {
          label: 'Buka Folder Master Data (resources/format_data)',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const dir = resolveFormatDataDir();
            if (!fs.existsSync(dir)) {
              try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
            }
            await shell.openPath(dir);
          },
        },
        {
          label: 'Sinkronkan Data Siswa & Guru Sekarang',
          accelerator: 'F5',
          click: () => {
            if (mainWindow) {
              const data = readMasterData();
              mainWindow.webContents.send('master-data-updated', data);
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Muat Ulang Tampilan (Reload)',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow && mainWindow.reload(),
        },
        {
          label: 'Muat Ulang Penuh (Hard Reload)',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => mainWindow && mainWindow.webContents.reloadIgnoringCache(),
        },
        { type: 'separator' },
        {
          label: 'Cetak Dokumen',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow && mainWindow.webContents.print(),
        },
        { type: 'separator' },
        {
          label: 'Keluar',
          accelerator: 'Alt+F4',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'Tampilan',
      submenu: [
        {
          label: 'Perbesar (Zoom In)',
          accelerator: 'CmdOrCtrl+Plus',
          role: 'zoomIn',
        },
        {
          label: 'Perkecil (Zoom Out)',
          accelerator: 'CmdOrCtrl+-',
          role: 'zoomOut',
        },
        {
          label: 'Ukuran Normal (Reset Zoom)',
          accelerator: 'CmdOrCtrl+0',
          role: 'resetZoom',
        },
        { type: 'separator' },
        {
          label: 'Layar Penuh (Full Screen)',
          accelerator: 'F11',
          role: 'togglefullscreen',
        },
        {
          label: 'Alat Pengembang (Developer Tools)',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => mainWindow && mainWindow.webContents.toggleDevTools(),
        },
      ],
    },
    {
      label: 'Bantuan',
      submenu: [
        {
          label: 'Tentang Aplikasi',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Tentang Aplikasi',
              message: 'Buku Catatan Pelanggaran Siswa & Tata Tertib Sekolah',
              detail: 'SMP Negeri 17 Konawe Selatan\nVersi 1.0.0 (Desktop Edition)\nDibangun menggunakan Electron & React\n\nFolder Master Data:\n' + resolveFormatDataDir(),
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Prevent opening links inside electron; open external browser instead
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('mailto:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Whenever window gains focus (e.g. user finished editing CSV in Excel/Notepad and clicks back into app)
  mainWindow.on('focus', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const data = readMasterData();
      mainWindow.webContents.send('master-data-updated', data);
    }
  });

  // Start watching format_data directory
  setupDirectoryWatcher(mainWindow);

  // Determine whether to load dev server or local production build
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const distIndexPath = path.join(__dirname, '../dist/index.html');

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL).catch(() => {
      mainWindow.loadFile(distIndexPath);
    });
  } else if (isDev && !fs.existsSync(distIndexPath)) {
    mainWindow.loadURL('http://localhost:3000').catch(() => {
      mainWindow.loadFile(distIndexPath);
    });
  } else {
    mainWindow.loadFile(distIndexPath);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Send initial master data immediately after window opens
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        const data = readMasterData();
        mainWindow.webContents.send('master-data-updated', data);
      }
    }, 500);
  });

  mainWindow.on('closed', () => {
    if (fileWatcher) {
      fileWatcher.close();
      fileWatcher = null;
    }
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('get-master-data', () => {
  return readMasterData();
});

ipcMain.handle('reload-master-data', () => {
  return readMasterData();
});

ipcMain.handle('open-format-data-folder', async () => {
  const dir = resolveFormatDataDir();
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (_) {}
  }
  await shell.openPath(dir);
  return { success: true, dir };
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
