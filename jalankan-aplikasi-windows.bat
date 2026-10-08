@echo off
setlocal enabledelayedexpansion
title Buku Catatan Pelanggaran Siswa - SMPN 17 Konawe Selatan
color 1F

:: PENTING: Pindahkan direktori kerja ke folder tempat file .bat ini berada
:: Ini mengatasi masalah jika dijalankan sebagai Administrator (C:\Windows\system32)
cd /d "%~dp0"

echo =========================================================================
echo       APLIKASI BUKU CATATAN PELANGGARAN SISWA ^& TATA TERTIB SEKOLAH
echo                    SMP NEGERI 17 KONAWE SELATAN
echo =========================================================================
echo Lokasi folder aplikasi: %CD%
echo.

:: 1. Verifikasi keberadaan file package.json
if not exist "package.json" (
    color 4F
    echo [ERROR] Berkas 'package.json' tidak ditemukan di folder ini!
    echo.
    echo Kemungkinan penyebab:
    echo 1. Anda menjalankan file .bat ini dari folder terpisah (misalnya di Downloads).
    echo 2. Berkas proyek belum diekstrak sepenuhnya dari ZIP.
    echo.
    echo Solusi:
    echo - Pastikan file 'jalankan-aplikasi-windows.bat' berada SATU FOLDER dengan
    echo   berkas 'package.json', 'index.html', dan folder 'src'.
    echo - Ekstrak seluruh isi file ZIP ke sebuah folder (misal: D:\AplikasiSekolah)
    echo   lalu jalankan file ini dari dalam folder tersebut.
    echo.
    echo =========================================================================
    pause
    exit /b 1
)

:: 2. Memeriksa lingkungan Node.js
echo [1/3] Memeriksa lingkungan Node.js pada Windows...
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 4F
    echo.
    echo [PERINGATAN] Node.js belum terdeteksi pada sistem PATH Windows ini.
    echo Silakan unduh dan pasang Node.js LTS terlebih dahulu dari:
    echo https://nodejs.org
    echo.
    echo Tips: Saat menginstal Node.js, pastikan centang opsi "Add to PATH".
    echo Setelah selesai menginstal, buka kembali file ini.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v 2^>nul') do set NODE_VER=%%v
for /f "tokens=*" %%m in ('npm -v 2^>nul') do set NPM_VER=%%m
echo [OK] Node.js terdeteksi (%NODE_VER%) dengan npm (%NPM_VER%).
echo.

:: 3. Menyiapkan paket dependensi
if not exist "node_modules\" (
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
        echo.
        echo [ERROR] Gagal memasang dependensi npm.
        echo Pastikan komputer terhubung ke internet untuk download paket pertama kali.
        echo.
        pause
        exit /b 1
    )
) else (
    echo [2/3] Dependensi aplikasi sudah siap.
)

echo.
echo [3/3] Menjalankan server aplikasi lokal...
echo Aplikasi akan terbuka otomatis di jendela browser desktop Anda...
echo (Catatan: Jangan tutup jendela hitam ini selama menggunakan aplikasi)
echo.

:: Jalankan Vite server di background
start /B npm run dev

:: Tunggu 3 detik agar server Vite aktif
timeout /t 3 /nobreak >nul

:: Buka jendela aplikasi desktop menggunakan Microsoft Edge atau Chrome (Mode App Standalone tanpa address bar)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000 --window-size=1280,820
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000 --window-size=1280,820
) else if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000 --window-size=1280,820
) else (
    start http://localhost:3000
)

echo.
echo =========================================================================
echo APLIKASI TELAH BERJALAN PADA: http://localhost:3000
echo =========================================================================
echo Untuk menutup server aplikasi, tekan tombol CTRL + C lalu ketik Y.
echo.
pause
