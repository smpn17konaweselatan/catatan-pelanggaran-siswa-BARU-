@echo off
setlocal enabledelayedexpansion
title Build Windows EXE (.exe) - Buku Catatan Pelanggaran Siswa
color 1F

:: Pastikan bekerja di folder script ini berada (mencegah error system32)
cd /d "%~dp0"

echo =========================================================================
echo       BUILD WINDOWS INSTALLER (.EXE) MENGGUNAKAN ELECTRON-BUILDER
echo           Buku Catatan Pelanggaran Siswa - SMPN 17 Konawe Selatan
echo =========================================================================
echo Direktori Proyek: %CD%
echo.

:: 1. Verifikasi berkas proyek
if not exist "package.json" (
    color 4F
    echo [ERROR] Berkas 'package.json' tidak ditemukan di folder ini!
    echo Pastikan file batch ini berada di folder utama proyek aplikasi.
    pause
    exit /b 1
)

:: 2. Verifikasi Node.js
echo [1/4] Memeriksa lingkungan Node.js di komputer ini...
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 4F
    echo [ERROR] Node.js belum terpasang atau belum masuk ke PATH sistem.
    echo Silakan unduh dan pasang Node.js LTS terlebih dahulu dari:
    echo https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v 2^>nul') do set NODE_VER=%%v
for /f "tokens=*" %%m in ('npm -v 2^>nul') do set NPM_VER=%%m
echo [OK] Node.js %NODE_VER% dan npm %NPM_VER% terdeteksi.
echo.

:: 3. Memasang dependensi proyek & electron-builder
if not exist "node_modules\" (
    echo [2/4] Mengunduh dependensi aplikasi (npm install)...
    call npm install
    if %errorlevel% neq 0 (
        color 4F
        echo [ERROR] Gagal memasang dependensi dasar.
        pause
        exit /b 1
    )
)

echo [2/4] Memastikan paket electron dan electron-builder terpasang...
call npx electron-builder --version >nul 2>nul
if %errorlevel% neq 0 (
    echo Menginstal electron & electron-builder ke devDependencies...
    call npm install -D electron electron-builder
    if %errorlevel% neq 0 (
        color 4F
        echo [ERROR] Gagal menginstal electron-builder.
        pause
        exit /b 1
    )
)
echo [OK] Electron Builder siap digunakan.
echo.

:: 4. Build Vite frontend
echo [3/4] Melakukan build frontend React dengan Vite (npm run build)...
call npm run build
if %errorlevel% neq 0 (
    color 4F
    echo [ERROR] Build Vite gagal! Periksa error di atas.
    pause
    exit /b 1
)
echo [OK] Build frontend selesai (folder 'dist' siap).
echo.

:: 5. Packaging dengan electron-builder
echo [4/4] Mengemas aplikasi menjadi file Windows .EXE dengan electron-builder...
echo.
echo Pilih jenis output yang diinginkan:
echo   [1] Installer Setup Lengkap (NSIS Setup .exe) + Portable .exe (Default)
echo   [2] Hanya Portable .exe (Langsung klik tanpa install)
echo   [3] Hanya NSIS Setup Wizard .exe
echo.
set /p PILIHAN="Masukkan pilihan (1/2/3, tekan Enter untuk 1): "

if "%PILIHAN%"=="2" (
    echo Menjalankan build Portable...
    call npx electron-builder --win portable
) else if "%PILIHAN%"=="3" (
    echo Menjalankan build NSIS Installer...
    call npx electron-builder --win nsis
) else (
    echo Menjalankan build Lengkap (NSIS + Portable)...
    call npx electron-builder --win
)

if %errorlevel% neq 0 (
    color 4F
    echo [ERROR] Terjadi kesalahan saat pengemasan dengan electron-builder.
    pause
    exit /b 1
)

color 2F
echo.
echo =========================================================================
echo [SUKSES!] File installer Windows .EXE berhasil dibuat!
echo =========================================================================
echo Lokasi hasil build ada di dalam folder:
echo %CD%\dist-electron
echo.

if exist "dist-electron" (
    echo Membuka folder hasil build di Windows Explorer...
    start "" "dist-electron"
)

echo Tekan sembarang tombol untuk keluar.
pause >nul
exit /b 0
