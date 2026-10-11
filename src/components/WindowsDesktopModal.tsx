import React, { useState } from 'react';
import { 
  X, 
  Monitor, 
  Download, 
  CheckCircle2, 
  Terminal, 
  ExternalLink, 
  Laptop,
  Copy,
  Check,
  AlertTriangle,
  FolderArchive,
  FileCode
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { downloadProjectZip } from '../utils/projectZipDownloader';

interface WindowsDesktopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WindowsDesktopModal: React.FC<WindowsDesktopModalProps> = ({
  isOpen,
  onClose
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'pwa' | 'local' | 'exe'>('local');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const handleDownloadAllZip = async () => {
    setIsZipping(true);
    try {
      await downloadProjectZip();
    } catch (err) {
      console.error('Failed to download project zip', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadBatch = () => {
    const batchContent = `@echo off
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
    echo [PERINGATAN] Node.js belum terdeteksi pada sistem PATH Windows ini.
    echo Silakan unduh dan pasang Node.js LTS terlebih dahulu dari:
    echo https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v 2^>nul') do set NODE_VER=%%v
for /f "tokens=*" %%m in ('npm -v 2^>nul') do set NPM_VER=%%m
echo [OK] Node.js terdeteksi (%NODE_VER%) dengan npm (%NPM_VER%).
echo.

if not exist "node_modules\\" (
    echo [2/3] Menyiapkan paket dependensi aplikasi untuk pertama kali...
    call npm install
    if %errorlevel% neq 0 (
        color 4F
        echo [ERROR] Gagal memasang dependensi npm.
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
echo Untuk menutup server aplikasi, tekan tombol CTRL + C lalu ketik Y.
pause
`;
    const blob = new Blob([batchContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jalankan-aplikasi-windows.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-700 text-white flex items-center justify-center shadow-xs">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">
                Jalankan Aplikasi di Windows (Desktop Lokal)
              </h3>
              <p className="text-xs text-slate-500">
                Solusi menjalankan aplikasi di komputer / laptop sekolah secara offline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 flex items-center gap-4 bg-white text-xs font-semibold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('local')}
            className={`pb-3 transition-colors relative ${
              activeTab === 'local'
                ? 'text-indigo-700 border-b-2 border-indigo-700'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Metode 1: Paket Folder Proyek & Skrip .BAT (Offline Komputer)
          </button>
          <button
            onClick={() => setActiveTab('pwa')}
            className={`pb-3 transition-colors relative ${
              activeTab === 'pwa'
                ? 'text-indigo-700 border-b-2 border-indigo-700'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Metode 2: PWA Desktop (1-Klik Tanpa Node.js)
          </button>
          <button
            onClick={() => setActiveTab('exe')}
            className={`pb-3 transition-colors relative ${
              activeTab === 'exe'
                ? 'text-indigo-700 border-b-2 border-indigo-700'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Metode 3: Build Installer .EXE
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs text-slate-600">
          {activeTab === 'local' && (
            <div className="space-y-4">
              {/* PENJELASAN ERROR ENOENT C:\Windows\system32 */}
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <div className="flex items-start gap-2 text-rose-800 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>Penyebab Error: &quot;Could not read package.json in C:\Windows\system32&quot;</span>
                </div>
                <div className="text-slate-700 text-xs pl-6 space-y-1.5 leading-relaxed">
                  <p>
                    Jika Anda mendapatkan pesan error tersebut, ada 2 penyebab umum:
                  </p>
                  <p>
                    1. <strong>Hanya file .bat yang diunduh sendirian:</strong> File <code>jalankan-aplikasi-windows.bat</code> memerlukan berkas aplikasi lainnya (<code>package.json</code>, <code>index.html</code>, dan folder <code>src</code>). File .bat tidak bisa berjalan sendirian di luar folder proyek.
                  </p>
                  <p>
                    2. <strong>Dijalankan sebagai Administrator:</strong> Ketika diklik kanan &quot;Run as Administrator&quot;, Windows otomatis membuka di <code>C:\Windows\system32</code>. (Skrip terbaru sudah kami perbaiki dengan perintah <code>cd /d &quot;%~dp0&quot;</code> agar otomatis kembali ke folder proyek).
                  </p>
                </div>
              </div>

              {/* ACTION: UNDUH ZIP PROYEK */}
              <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                      Langkah 1: Unduh Seluruh Folder Proyek Lengkap (ZIP)
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-xs">
                    Unduh satu paket file ZIP berisi seluruh source code, berkas <code>package.json</code>, ikon, dan file <code>jalankan-aplikasi-windows.bat</code> yang sudah diperbaiki.
                  </p>
                </div>

                <button
                  onClick={handleDownloadAllZip}
                  disabled={isZipping}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <FolderArchive className="w-4 h-4" />
                  {isZipping ? 'Sedang Mengompres...' : 'Unduh Proyek Lengkap (ZIP)'}
                </button>
              </div>

              {/* PETUNJUK STEP BY STEP */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                <h4 className="font-bold text-slate-800 text-xs">
                  Cara Menjalankan di Komputer/Laptop Sekolah:
                </h4>
                <ol className="list-decimal list-inside space-y-2.5 text-slate-700 leading-relaxed">
                  <li>
                    Klik tombol <strong>&quot;Unduh Proyek Lengkap (ZIP)&quot;</strong> di atas.
                  </li>
                  <li>
                    Buka file ZIP yang terunduh, lalu <strong>Ekstrak Semua (Extract All)</strong> ke sebuah folder, misalnya di:
                    <div className="my-1.5 p-2 bg-slate-100 rounded text-slate-800 font-mono text-[11px]">
                      D:\Aplikasi_Pelanggaran_Siswa\
                    </div>
                  </li>
                  <li>
                    Pastikan di dalam folder tersebut terdapat file:
                    <span className="font-mono text-indigo-700 font-semibold ml-1">package.json</span>, 
                    <span className="font-mono text-indigo-700 font-semibold ml-1">index.html</span>, folder 
                    <span className="font-mono text-indigo-700 font-semibold ml-1">src</span>, dan 
                    <span className="font-mono text-indigo-700 font-semibold ml-1">jalankan-aplikasi-windows.bat</span>.
                  </li>
                  <li>
                    <strong>Klik dua kali (Double-click)</strong> pada file:
                    <div className="my-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 font-mono font-bold text-[11px] flex items-center justify-between">
                      <span>jalankan-aplikasi-windows.bat</span>
                      <button
                        onClick={handleDownloadBatch}
                        className="text-emerald-700 hover:text-emerald-900 font-sans font-normal text-[10px] underline flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Unduh ulang file .bat saja
                      </button>
                    </div>
                  </li>
                  <li>
                    Jendela aplikasi Windows akan otomatis terbuka di layar pada alamat <code>http://localhost:3000</code> dan siap digunakan!
                  </li>
                </ol>
              </div>

              {/* JALANKAN MANUAL LEWAT CMD */}
              <div className="bg-slate-900 text-slate-200 p-3.5 rounded-lg font-mono text-[11px] space-y-2">
                <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-1.5">
                  <span className="font-sans font-medium text-slate-300">Atau Buka Command Prompt di Folder Tersebut:</span>
                  <button
                    onClick={() => handleCopy('npm install && npm run dev', 'cmd1')}
                    className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-white"
                  >
                    {copiedCmd === 'cmd1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedCmd === 'cmd1' ? 'Tersalin' : 'Salin Perintah'}
                  </button>
                </div>
                <div className="text-slate-400 text-[10px]">
                  # Masuk ke folder aplikasi di CMD, lalu ketik:
                </div>
                <code className="text-emerald-400 block font-bold">npm install && npm run dev</code>
              </div>
            </div>
          )}

          {activeTab === 'pwa' && (
            <div className="space-y-4">
              <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                      Instalasi Resmi Windows 10 & 11
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Paling Praktis Tanpa Node.js
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-xs">
                    Jika Anda tidak ingin menginstal Node.js atau repot menjalankan file .bat, cukup instal langsung lewat browser Microsoft Edge atau Google Chrome. Aplikasi akan muncul di <strong>Desktop</strong>, <strong>Start Menu</strong>, dan bisa dipakai <strong>100% offline</strong>!
                  </p>
                </div>

                {isInstalled ? (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg whitespace-nowrap">
                    <CheckCircle2 className="w-4 h-4" />
                    Sudah Terpasang di Komputer
                  </div>
                ) : isInstallable ? (
                  <button
                    onClick={install}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    Pasang Aplikasi ke Windows
                  </button>
                ) : (
                  <div className="text-right text-[11px] text-slate-500 shrink-0">
                    Buka di Edge / Chrome untuk 1-Klik Pasang
                  </div>
                )}
              </div>

              <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                <h4 className="font-bold text-slate-800 text-xs">
                  Cara Pasang Manual lewat Microsoft Edge atau Google Chrome:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="block text-indigo-700 font-bold mb-1">Langkah 1</strong>
                    Buka tautan aplikasi ini di browser <strong>Microsoft Edge</strong> atau <strong>Google Chrome</strong> pada laptop/PC Windows Anda.
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="block text-indigo-700 font-bold mb-1">Langkah 2</strong>
                    Klik ikon <strong>&quot;Instal Aplikasi&quot;</strong> (simbol monitor/komputer kecil dengan tanda panah ke bawah) di sebelah kanan kolom URL browser.
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="block text-indigo-700 font-bold mb-1">Langkah 3</strong>
                    Klik tombol <strong>&quot;Instal&quot;</strong>. Aplikasi langsung terbuka sebagai jendela program Windows mandiri tanpa bilah tab browser!
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'exe' && (
            <div className="space-y-4">
              <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-indigo-700" />
                  <span className="font-bold text-slate-800 text-xs">
                    Rancangan & Konfigurasi Build Windows EXE (.exe) dengan Electron Builder
                  </span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Proyek ini telah dikonfigurasi penuh dengan berkas <code>electron-builder.json</code>, skrip utama <code>electron/main.cjs</code>, dan <code>build-windows-exe.bat</code>. Anda dapat menghasilkan file <strong>Setup Installer (.exe)</strong> maupun <strong>Portable (.exe)</strong> yang siap dibagikan via flashdisk.
                </p>
              </div>

              {/* METODE 1: 1-KLIK VIA BATCH */}
              <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded">Cara Termudah</span>
                    <strong className="text-slate-800 text-xs">Cara 1: Menggunakan Berkas Otomatis <code>build-windows-exe.bat</code></strong>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Di dalam file ZIP proyek yang Anda unduh, cukup klik dua kali (double-click) pada file <strong><code>build-windows-exe.bat</code></strong>. Skrip ini akan otomatis memeriksa Node.js, memasang dependensi, menjalankan Vite build, dan memicu <code>electron-builder</code> hingga membuka folder hasil build.
                </p>
              </div>

              {/* METODE 2: VIA CMD / TERMINAL */}
              <div className="space-y-3">
                <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
                  <strong className="text-slate-800 block font-semibold text-xs">
                    Cara 2: Melalui Terminal / Command Prompt
                  </strong>
                  <p className="text-[11px] text-slate-500">
                    Buka Command Prompt pada folder proyek, lalu gunakan perintah cepat berikut:
                  </p>
                </div>

                <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-700 text-xs">A. Pasang Paket Electron & Builder (hanya sekali):</strong>
                  </div>
                  <div className="bg-slate-900 text-slate-200 p-2.5 rounded font-mono text-[11px] flex justify-between items-center">
                    <code>npm install -D electron electron-builder</code>
                    <button
                      onClick={() => handleCopy('npm install -D electron electron-builder', 'inst-elec')}
                      className="text-slate-400 hover:text-white"
                      title="Salin perintah"
                    >
                      {copiedCmd === 'inst-elec' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-700 text-xs">B. Build Lengkap (Installer NSIS + Portable .exe):</strong>
                  </div>
                  <div className="bg-slate-900 text-slate-200 p-2.5 rounded font-mono text-[11px] flex justify-between items-center">
                    <code>npm run build:win</code>
                    <button
                      onClick={() => handleCopy('npm run build:win', 'build-all')}
                      className="text-slate-400 hover:text-white"
                      title="Salin perintah"
                    >
                      {copiedCmd === 'build-all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-700 text-xs">C. Hanya Build Versi Portable (Tanpa Install):</strong>
                  </div>
                  <div className="bg-slate-900 text-slate-200 p-2.5 rounded font-mono text-[11px] flex justify-between items-center">
                    <code>npm run build:win:portable</code>
                    <button
                      onClick={() => handleCopy('npm run build:win:portable', 'build-port')}
                      className="text-slate-400 hover:text-white"
                      title="Salin perintah"
                    >
                      {copiedCmd === 'build-port' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* HASIL KELUARAN */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs text-slate-600">
                  <strong className="text-slate-800 block font-semibold text-xs">
                    📁 Lokasi & Berkas Hasil Keluaran:
                  </strong>
                  <p>Semua file binary Windows akan tersimpan rapi di dalam folder <strong><code>dist-electron/</code></strong>:</p>
                  <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-700">
                    <li>
                      <strong><code>Buku Catatan Pelanggaran Siswa-1.0.0-x64.exe</code></strong>: Wizard instalasi Windows (NSIS) dengan opsi shortcut Desktop dan Start Menu.
                    </li>
                    <li>
                      <strong><code>Buku Catatan Pelanggaran Siswa-Portable-1.0.0.exe</code></strong>: Versi Portable tunggal, dapat langsung diklik dan dijalankan dari flashdisk tanpa perlu diinstal.
                    </li>
                  </ul>
                </div>

                {/* SINKRONISASI FORMAT DATA SISWA & GURU */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">Penting</span>
                    <strong className="text-slate-800 text-xs">
                      Mengubah Data Siswa & Guru di Komputer Windows (resources\format_data):
                    </strong>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    Setelah aplikasi terpasang di komputer Anda (misal di <code>D:\...\resources\format_data\</code>), aplikasi kini telah dilengkapi <strong>Sinkronisasi Dinamis & Real-time File Watcher</strong>:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-[11px] text-slate-700">
                    <li>
                      <strong>Nama & Ekstensi File:</strong> Berkas utama adalah <code>siswa.csv</code> dan <code>guru.csv</code>. Sistem juga mendukung toleransi nama berekstensi <code>.txt</code> maupun jika tak sengaja tersimpan sebagai <code>.svg</code>.
                    </li>
                    <li>
                      <strong>Otomatis Terbaca:</strong> Setiap kali Anda mengedit dan menyimpan file tersebut dengan Excel atau Notepad, aplikasi langsung membaca perubahannya secara otomatis saat jendela aplikasi diklik kembali.
                    </li>
                    <li>
                      <strong>Shortcut Keyboard:</strong> Di dalam aplikasi Windows, tekan <code>Ctrl + O</code> untuk membuka folder <code>resources\format_data</code> di Windows Explorer, atau tekan <code>F5</code> untuk menyegarkan data seketika.
                    </li>
                  </ul>
                </div>

                {/* EKSPOR & IMPOR DATABASE SQLITE (*.DB) DI MODE DESKTOP */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded">Fitur Database</span>
                    <strong className="text-slate-800 text-xs">
                      Ekspor & Impor Database SQLite (*.db) di Mode Aplikasi Terinstall:
                    </strong>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    Aplikasi desktop telah dilengkapi engine SQLite mandiri tanpa membutuhkan koneksi server web atau internet:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-[11px] text-slate-700">
                    <li>
                      <strong>Ekspor / Simpan Database (*.db):</strong> Klik tombol <em>"Unduh / Excel" &rarr; "Unduh Database SQLite (.db)"</em> atau tekan <code>Ctrl + S</code>. Jendela Windows "Simpan Sebagai" akan muncul untuk memilih lokasi penyimpanan (Desktop, Flashdisk, atau drive D:).
                    </li>
                    <li>
                      <strong>Impor / Gabungkan Database (*.db):</strong> Klik tombol <em>"Impor / Merge DB (*.db)"</em> di atas tabel pelanggaran atau tekan <code>Ctrl + I</code>. Sistem akan membaca berkas dan menampilkan dialog konfirmasi apakah Anda ingin <strong>Setuju Gabungkan (Merge)</strong> dengan data yang ada, atau <strong>Tidak Setuju (Timpa Total)</strong>.
                    </li>
                    <li>
                      <strong>Penyimpanan Fisik Otomatis:</strong> Setiap ada penambahan atau pengubahan data pelanggaran, aplikasi otomatis menyinkronkan file <code>buku_pelanggaran_sekolah.db</code> di komputer Anda.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            SMP Negeri 17 Konawe Selatan &bull; Aplikasi Desktop Mandiri & Offline
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
