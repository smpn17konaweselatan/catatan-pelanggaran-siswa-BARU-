import JSZip from 'jszip';

export async function downloadProjectZip() {
  const zip = new JSZip();

  // NPM config to avoid ERESOLVE peer dependency issues
  zip.file('.npmrc', 'legacy-peer-deps=true\n');

  // Root files
  zip.file('jalankan-aplikasi-windows.bat', `@echo off
setlocal enabledelayedexpansion
title Buku Catatan Pelanggaran Siswa - SMPN 17 Konawe Selatan
color 1F

:: PENTING: Pindahkan direktori kerja ke folder tempat file .bat ini berada
cd /d "%~dp0"

echo =========================================================================
echo       APLIKASI BUKU CATATAN PELANGGARAN SISWA ^& TATA TERTIB SEKOLAH
echo                    SMP NEGERI 17 KONAWE SELATAN
echo =========================================================================
echo Lokasi folder aplikasi: %CD%
echo.

if not exist "package.json" (
    color 4F
    echo [ERROR] Berkas 'package.json' tidak ditemukan di folder ini!
    echo.
    echo Pastikan file 'jalankan-aplikasi-windows.bat' berada SATU FOLDER dengan
    echo berkas 'package.json', 'index.html', dan folder 'src'.
    pause
    exit /b 1
)

echo [1/3] Memeriksa lingkungan Node.js pada Windows...
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 4F
    echo [PERINGATAN] Node.js belum terpasang. Unduh dari: https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v 2^>nul') do set NODE_VER=%%v
for /f "tokens=*" %%m in ('npm -v 2^>nul') do set NPM_VER=%%m
echo [OK] Node.js terdeteksi (%NODE_VER%) dengan npm (%NPM_VER%).
echo.

if not exist "node_modules\\" (
    echo [2/3] Menyiapkan paket dependensi aplikasi untuk pertama kali...
    echo (Proses ini hanya berjalan sekali, silakan tunggu sebentar...)
    echo.
    call npm install --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo [INFO] Mencoba kembali instalasi dependensi dengan opsi force...
        call npm install --force
    )
    if %errorlevel% neq 0 (
        color 4F
        echo [ERROR] Gagal memasang dependensi. Periksa koneksi internet.
        pause
        exit /b 1
    )
) else (
    echo [2/3] Dependensi aplikasi sudah siap.
)

echo.
echo [3/3] Menjalankan server aplikasi lokal...
echo Aplikasi akan terbuka otomatis di jendela browser desktop Anda...
echo.

start /B npm run dev
timeout /t 3 /nobreak >nul

if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
    start "" "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" --app=http://localhost:3000 --window-size=1280,820
) else if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" (
    start "" "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" --app=http://localhost:3000 --window-size=1280,820
) else if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
    start "" "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" --app=http://localhost:3000 --window-size=1280,820
) else (
    start http://localhost:3000
)

echo.
echo =========================================================================
echo APLIKASI TELAH BERJALAN PADA: http://localhost:3000
echo =========================================================================
echo Untuk menutup server aplikasi, tekan CTRL + C lalu ketik Y.
pause
`);

  zip.file('PETUNJUK_INSTALASI_WINDOWS.txt', `=========================================================================
PANDUAN MENJALANKAN APLIKASI BUKU PELANGGARAN SISWA DI WINDOWS SECARA LOKAL
SMP NEGERI 17 KONAWE SELATAN (DENGAN DATABASE SQLITE LOKAL)
=========================================================================

LOKASI DATABASE SISWA:
Semua data nama siswa, profil sekolah, dan catatan pelanggaran disimpan
langsung ke file database SQLite mandiri di komputer ini:
  -> "buku_pelanggaran_sekolah.db"
File ini 100% offline, tidak memerlukan internet atau server luar, dan dapat
disalin ke flashdisk kapan saja atau dibuka di aplikasi "DB Browser for SQLite".

PILIHAN 1: JALANKAN DENGAN 1-KLIK (FILE BATCH)
1. Pastikan komputer Anda sudah terpasang Node.js (https://nodejs.org).
2. Ekstrak seluruh isi file ZIP ini ke sebuah folder (misalnya di D:\\AplikasiBK).
3. Klik dua kali (double click) pada file:
   "jalankan-aplikasi-windows.bat"
4. Aplikasi akan otomatis membuka jendela desktop mandiri di http://localhost:3000.

PILIHAN 2: BUILD MENJADI FILE INSTALLER .EXE (MANDIRI)
1. Buka folder ini di Command Prompt / Terminal.
2. Jalankan perintah:
   npm install -D electron electron-builder
   npm run build && npx electron-builder --win
3. File instalasi Windows .exe akan otomatis tersimpan di folder "dist-electron".

PILIHAN 3: INSTALASI VIA BROWSER (PWA - 1 DETIK TANPA NODE.JS)
Buka aplikasi di Google Chrome atau Microsoft Edge, lalu klik ikon "Instal Aplikasi" 
di sebelah kanan kolom URL browser. Aplikasi langsung terpasang di Desktop & Start Menu.
`);

  // Try to fetch current files from the dev server or fallback to embedded
  const filesToFetch = [
    'package.json',
    'index.html',
    'server.ts',
    'vite.config.ts',
    'tsconfig.json',
    'electron-builder.json',
    'electron/main.cjs',
    'src/main.tsx',
    'src/App.tsx',
    'src/index.css',
    'src/types/violation.ts',
    'src/data/rulesCatalog.ts',
    'src/data/initialViolations.ts',
    'src/db/sqlite.ts',
    'src/format_data/siswa.csv',
    'src/format_data/guru.csv',
    'src/format_data/PETUNJUK_PENGISIAN.txt',
    'src/services/api.ts',
    'src/utils/csvExport.ts',
    'src/hooks/usePWAInstall.ts',
    'src/components/Header.tsx',
    'src/components/ViolationTable.tsx',
    'src/components/ViolationFormModal.tsx',
    'src/components/PrintReportModal.tsx',
    'src/components/PrintLetterModal.tsx',
    'src/components/RulesCatalogModal.tsx',
    'src/components/SchoolProfileModal.tsx',
    'src/components/StatsOverview.tsx',
    'src/components/FormatGuideCard.tsx',
    'src/components/WindowsDesktopModal.tsx',
    'public/icon.svg',
    'public/pwa-192x192.png',
    'public/pwa-512x512.png',
  ];

  for (const filePath of filesToFetch) {
    try {
      const response = await fetch('/' + filePath);
      if (response.ok) {
        if (filePath.endsWith('.png') || filePath.endsWith('.jpg')) {
          const blob = await response.blob();
          zip.file(filePath, blob);
        } else {
          const text = await response.text();
          zip.file(filePath, text);
        }
      }
    } catch (e) {
      console.warn(`Could not fetch ${filePath} for zip packaging`, e);
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Aplikasi_Buku_Pelanggaran_Siswa_Windows.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
