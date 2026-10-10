import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Check, BookOpen, AlertCircle, User, GraduationCap, CheckCircle2, ChevronDown, RotateCcw } from 'lucide-react';
import { ViolationRecord, ViolationSeverity, SanctionStatus } from '../types/violation';
import { STANDARD_RULES_CATALOG } from '../data/rulesCatalog';
import { MASTER_STUDENTS, MASTER_TEACHERS, StudentMasterItem, TeacherMasterItem } from '../data/schoolMasterData';
import { fetchStudentsFromSql, fetchTeachersFromSql } from '../services/api';
import { INITIAL_DISCIPLINE_BALANCE, getDisciplineLevelInfo } from '../utils/balanceCalculator';

interface ViolationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: ViolationRecord) => void;
  initialData?: ViolationRecord | null;
  defaultGuruBK: string;
  records?: ViolationRecord[];
}

export const ViolationFormModal: React.FC<ViolationFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultGuruBK,
  records = []
}) => {
  const [formData, setFormData] = useState<Partial<ViolationRecord>>({
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '07:15',
    nisn: '',
    namaSiswa: '',
    jenisKelamin: 'L',
    kelas: 'VII-A',
    kategori: 'Ringan',
    jenisPelanggaran: '',
    poin: 5,
    sanksi: '',
    tempatKejadian: 'Lingkungan Sekolah',
    guruPelapor: '',
    guruBK: defaultGuruBK,
    statusSanksi: 'Belum Ditindaklanjuti',
    catatanPembinaan: '',
    tenggatSanksi: ''
  });

  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('');
  
  // Master data lists for autocompletion
  const [studentsList, setStudentsList] = useState<StudentMasterItem[]>(MASTER_STUDENTS);
  const [teachersList, setTeachersList] = useState<TeacherMasterItem[]>(MASTER_TEACHERS);
  
  // Autocomplete UI states
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [autoFilledNotice, setAutoFilledNotice] = useState<string | null>(null);

  const studentInputRef = useRef<HTMLInputElement>(null);
  const studentDropdownRef = useRef<HTMLDivElement>(null);
  const teacherInputRef = useRef<HTMLInputElement>(null);
  const teacherDropdownRef = useRef<HTMLDivElement>(null);

  const [isRefreshingMaster, setIsRefreshingMaster] = useState(false);

  // Load students & teachers from SQLite backend whenever modal opens
  const loadMasterData = async () => {
    setIsRefreshingMaster(true);
    try {
      const [stu, tea] = await Promise.all([
        fetchStudentsFromSql(),
        fetchTeachersFromSql()
      ]);
      if (stu && stu.length > 0) setStudentsList(stu);
      if (tea && tea.length > 0) setTeachersList(tea);
    } catch (e) {
      console.warn('Gagal menyinkronkan master data guru & siswa:', e);
    } finally {
      setIsRefreshingMaster(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMasterData();
    }
  }, [isOpen]);

  // Handle outside clicks to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        studentDropdownRef.current && 
        !studentDropdownRef.current.contains(event.target as Node) &&
        studentInputRef.current &&
        !studentInputRef.current.contains(event.target as Node)
      ) {
        setShowStudentDropdown(false);
      }

      if (
        teacherDropdownRef.current && 
        !teacherDropdownRef.current.contains(event.target as Node) &&
        teacherInputRef.current &&
        !teacherInputRef.current.contains(event.target as Node)
      ) {
        setShowTeacherDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      const found = STANDARD_RULES_CATALOG.find(
        r => r.jenisPelanggaran.toLowerCase() === initialData.jenisPelanggaran.toLowerCase()
      );
      if (found) setSelectedCatalogId(found.id);
    } else {
      setFormData({
        tanggal: new Date().toISOString().split('T')[0],
        waktu: '07:15',
        nisn: '',
        namaSiswa: '',
        jenisKelamin: 'L',
        kelas: 'VII-A',
        kategori: 'Ringan',
        jenisPelanggaran: '',
        poin: 5,
        sanksi: '',
        tempatKejadian: 'Lingkungan Sekolah',
        guruPelapor: '',
        guruBK: defaultGuruBK,
        statusSanksi: 'Belum Ditindaklanjuti',
        catatanPembinaan: '',
        tenggatSanksi: ''
      });
      setSelectedCatalogId('');
      setAutoFilledNotice(null);
    }
  }, [initialData, isOpen, defaultGuruBK]);

  // Filter students based on typed name or NIS
  const filteredStudents = useMemo(() => {
    const query = (formData.namaSiswa || '').trim().toLowerCase();
    if (!query) return [];
    
    return studentsList.filter(s => 
      s.nama.toLowerCase().includes(query) ||
      (s.nis && s.nis.toLowerCase().includes(query)) ||
      (s.nisn && s.nisn.toLowerCase().includes(query)) ||
      (s.kelas && s.kelas.toLowerCase().includes(query))
    ).slice(0, 8);
  }, [formData.namaSiswa, studentsList]);

  // Filter teachers based on typed name
  const filteredTeachers = useMemo(() => {
    const query = (formData.guruPelapor || '').trim().toLowerCase();
    if (!query) return teachersList.slice(0, 6);
    
    return teachersList.filter(t =>
      t.nama.toLowerCase().includes(query) ||
      (t.jabatan && t.jabatan.toLowerCase().includes(query)) ||
      (t.peran && t.peran.toLowerCase().includes(query))
    ).slice(0, 8);
  }, [formData.guruPelapor, teachersList]);

  // Real-time balance calculations for chosen student
  const studentBalanceInfo = useMemo(() => {
    const studentName = (formData.namaSiswa || '').trim().toUpperCase();
    if (!studentName) return null;

    const pastRecords = records.filter(r => 
      r.namaSiswa.trim().toUpperCase() === studentName && 
      r.id !== initialData?.id
    );

    const pastDeducted = pastRecords.reduce((sum, r) => sum + (Number(r.poin) || 0), 0);
    const currentBalance = Math.max(0, INITIAL_DISCIPLINE_BALANCE - pastDeducted);

    const thisViolationPoints = Number(formData.poin) || 0;
    const projectedBalance = Math.max(0, currentBalance - thisViolationPoints);
    const projectedLevel = getDisciplineLevelInfo(projectedBalance);

    return {
      pastDeducted,
      currentBalance,
      thisViolationPoints,
      projectedBalance,
      projectedLevel,
      pastCount: pastRecords.length
    };
  }, [formData.namaSiswa, formData.poin, records, initialData]);

  if (!isOpen) return null;

  // When a student is selected from autocomplete suggestions:
  const handleSelectStudent = (student: StudentMasterItem) => {
    // Standardize class format e.g. "IX A" -> "IX-A"
    const normalizedClass = student.kelas.includes('-') 
      ? student.kelas 
      : student.kelas.replace(/\s+/g, '-');

    // Valuenya ganti dengan NISN nama siswa yang dipilih
    const selectedNisn = student.nisn || student.nis || '';

    setFormData(prev => ({
      ...prev,
      namaSiswa: student.nama,
      kelas: normalizedClass,
      nisn: selectedNisn,
      jenisKelamin: student.jenisKelamin || 'L'
    }));

    setShowStudentDropdown(false);
    setAutoFilledNotice(
      `Data siswa otomatis terisi: Kelas ${normalizedClass}, ${student.jenisKelamin === 'P' ? 'Perempuan' : 'Laki-laki'}, NISN: ${selectedNisn || '-'}`
    );
  };

  // When a teacher is selected from autocomplete suggestions:
  const handleSelectTeacher = (teacher: TeacherMasterItem) => {
    const formatted = teacher.jabatan && !teacher.nama.includes('(')
      ? `${teacher.nama} (${teacher.jabatan.split('/')[0].trim()})`
      : teacher.nama;

    setFormData(prev => ({
      ...prev,
      guruPelapor: formatted
    }));
    setShowTeacherDropdown(false);
  };

  const handleSelectCatalog = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const catalogId = e.target.value;
    setSelectedCatalogId(catalogId);
    if (!catalogId) return;

    const item = STANDARD_RULES_CATALOG.find(r => r.id === catalogId);
    if (item) {
      setFormData(prev => ({
        ...prev,
        jenisPelanggaran: item.jenisPelanggaran,
        kategori: item.kategori,
        poin: item.poinDefault,
        sanksi: item.rekomendasiSanksi
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaSiswa || !formData.jenisPelanggaran || !formData.tanggal || !formData.sanksi) {
      return;
    }

    const recordToSave: ViolationRecord = {
      id: initialData?.id || `VIO-${Date.now()}`,
      tanggal: formData.tanggal || new Date().toISOString().split('T')[0],
      waktu: formData.waktu || '07:15',
      nisn: formData.nisn || '-',
      namaSiswa: formData.namaSiswa.trim(),
      jenisKelamin: (formData.jenisKelamin as 'L' | 'P') || 'L',
      kelas: formData.kelas || 'VII-A',
      kategori: (formData.kategori as ViolationSeverity) || 'Ringan',
      jenisPelanggaran: formData.jenisPelanggaran.trim(),
      poin: Number(formData.poin) || 0,
      sanksi: formData.sanksi.trim(),
      tempatKejadian: formData.tempatKejadian?.trim() || 'Lingkungan Sekolah',
      guruPelapor: formData.guruPelapor?.trim() || 'Guru Piket',
      guruBK: formData.guruBK?.trim() || defaultGuruBK,
      statusSanksi: (formData.statusSanksi as SanctionStatus) || 'Belum Ditindaklanjuti',
      catatanPembinaan: formData.catatanPembinaan?.trim() || '',
      tenggatSanksi: formData.tenggatSanksi || ''
    };

    onSave(recordToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-semibold text-slate-800 text-base">
              {initialData ? 'Ubah Data Catatan Pelanggaran' : 'Input Catatan Pelanggaran Siswa Baru'}
            </h3>
            <p className="text-xs text-slate-500">
              Format isian lengkap data kedisiplinan siswa sesuai pedoman tata tertib sekolah
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-slate-800 flex-1">
          {/* Quick Select from Standard Rules Catalog */}
          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-700" />
                Pilih Cepat dari Pedoman Tata Tertib & Sanksi Resmi:
              </label>
              <span className="text-[11px] text-indigo-600">Otomatis isi kategori, poin & sanksi</span>
            </div>
            <select
              value={selectedCatalogId}
              onChange={handleSelectCatalog}
              className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
            >
              <option value="">-- Pilih Jenis Pelanggaran dari Buku Pedoman Tata Tertib --</option>
              {STANDARD_RULES_CATALOG.map((item) => (
                <option key={item.id} value={item.id}>
                  [{item.kategori}] {item.jenisPelanggaran} ({item.poinDefault} Poin)
                </option>
              ))}
            </select>
          </div>

          {/* Section 1: Identitas Siswa */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                1. Identitas Siswa
              </h4>
              <span className="text-[11px] text-slate-500">
                Ketik nama siswa untuk rekomendasi otomatis dari database sekolah
              </span>
            </div>

            {/* Auto-filled notification alert */}
            {autoFilledNotice && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 text-xs font-medium animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{autoFilledNotice}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Nama Lengkap Siswa with Autocomplete */}
              <div className="sm:col-span-2 relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Nama Lengkap Siswa <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={loadMasterData}
                    title="Segarkan data siswa dari src/format_data/siswa.csv"
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <RotateCcw className={`w-2.5 h-2.5 ${isRefreshingMaster ? 'animate-spin' : ''}`} />
                    <span>{studentsList.length} siswa</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    ref={studentInputRef}
                    type="text"
                    required
                    value={formData.namaSiswa || ''}
                    onFocus={() => {
                      if ((formData.namaSiswa || '').trim().length > 0) {
                        setShowStudentDropdown(true);
                      }
                    }}
                    onChange={(e) => {
                      setFormData({ ...formData, namaSiswa: e.target.value });
                      setShowStudentDropdown(true);
                    }}
                    placeholder="Ketik nama siswa (misal: Achmad, Aisyah, Bayu, Cakra)..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                    autoComplete="off"
                  />
                  {formData.namaSiswa && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, namaSiswa: '', nisn: '' }));
                        setShowStudentDropdown(false);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      &times;
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown List for Students */}
                {showStudentDropdown && filteredStudents.length > 0 && (
                  <div
                    ref={studentDropdownRef}
                    className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100"
                  >
                    <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Pilih Siswa Terdaftar (Klik untuk auto-fill):</span>
                      <span>{filteredStudents.length} ditemukan</span>
                    </div>
                    {filteredStudents.map((s) => (
                      <button
                        type="button"
                        key={`${s.nisn}-${s.nama}`}
                        onClick={() => handleSelectStudent(s)}
                        className="w-full text-left px-3.5 py-2 hover:bg-indigo-50/80 transition-colors flex items-center justify-between cursor-pointer group"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">
                            {s.nama}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>NISN: <strong className="font-mono text-indigo-700 font-semibold">{s.nisn || '-'}</strong></span>
                            <span>&bull;</span>
                            <span>NIS: <strong className="font-mono text-slate-600">{s.nis || '-'}</strong></span>
                            <span>&bull;</span>
                            <span>{s.jenisKelamin === 'P' ? 'Perempuan (P)' : 'Laki-laki (L)'}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800">
                            Kelas {s.kelas}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* NISN / NIS */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">
                    NIS / NISN
                  </label>
                  <span className="text-[10px] text-indigo-600 font-medium">Otomatis NISN</span>
                </div>
                <input
                  type="text"
                  value={formData.nisn || ''}
                  onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                  placeholder="NISN siswa otomatis terisi"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 font-mono"
                />
              </div>

              {/* Kelas / Rombel */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Kelas / Rombel <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.kelas || 'VII-A'}
                  onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 bg-white"
                >
                  <option value="VII-A">VII-A</option>
                  <option value="VII-B">VII-B</option>
                  <option value="VII-C">VII-C</option>
                  <option value="VIII-A">VIII-A</option>
                  <option value="VIII-B">VIII-B</option>
                  <option value="VIII-C">VIII-C</option>
                  <option value="VIII-D">VIII-D</option>
                  <option value="IX-A">IX-A</option>
                  <option value="IX-B">IX-B</option>
                  <option value="IX-C">IX-C</option>
                </select>
              </div>

              {/* Jenis Kelamin */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Jenis Kelamin
                </label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="jk"
                      value="L"
                      checked={formData.jenisKelamin === 'L'}
                      onChange={() => setFormData({ ...formData, jenisKelamin: 'L' })}
                    />
                    Laki-laki
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="jk"
                      value="P"
                      checked={formData.jenisKelamin === 'P'}
                      onChange={() => setFormData({ ...formData, jenisKelamin: 'P' })}
                    />
                    Perempuan
                  </label>
                </div>
              </div>
            </div>

            {/* Real-time Discipline Balance Impact Preview */}
            {studentBalanceInfo && formData.namaSiswa && (
              <div className={`p-3.5 rounded-xl border transition-all mt-3 ${
                studentBalanceInfo.projectedBalance <= 50
                  ? 'bg-rose-50/80 border-rose-300 text-rose-900 shadow-2xs'
                  : studentBalanceInfo.projectedBalance <= 100
                  ? 'bg-orange-50/80 border-orange-300 text-orange-900 shadow-2xs'
                  : 'bg-indigo-50/70 border-indigo-200 text-indigo-950 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                    <span>Simulasi Saldo Kedisiplinan Siswa (Modal Awal: {INITIAL_DISCIPLINE_BALANCE} Poin):</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${studentBalanceInfo.projectedLevel.badgeBg} ${studentBalanceInfo.projectedLevel.badgeText} border ${studentBalanceInfo.projectedLevel.badgeBorder}`}>
                    Status: {studentBalanceInfo.projectedLevel.statusLabel}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] bg-white/90 p-2.5 rounded-lg border border-slate-200/80 mb-2">
                  <div>
                    <span className="text-slate-500 block">Saldo Sebelumnya:</span>
                    <strong className="text-slate-900 text-xs font-bold">{studentBalanceInfo.currentBalance} Poin</strong>
                    <span className="text-[10px] text-slate-400 block">({studentBalanceInfo.pastCount} kasus lalu)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Potongan Pelanggaran Ini:</span>
                    <strong className="text-rose-600 text-xs font-bold">-{studentBalanceInfo.thisViolationPoints} Poin</strong>
                    <span className="text-[10px] text-slate-400 block">(Kategori {formData.kategori || 'Ringan'})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Sisa Saldo Setelahnya:</span>
                    <strong className={`font-black text-sm ${studentBalanceInfo.projectedBalance <= 50 ? 'text-rose-600' : studentBalanceInfo.projectedBalance <= 100 ? 'text-orange-600' : 'text-emerald-700'}`}>
                      {studentBalanceInfo.projectedBalance} / {INITIAL_DISCIPLINE_BALANCE}
                    </strong>
                    <span className="text-[10px] text-slate-400 block">({Math.round((studentBalanceInfo.projectedBalance / INITIAL_DISCIPLINE_BALANCE) * 100)}% kuota tersisa)</span>
                  </div>
                </div>

                {/* Balance Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-1.5">
                  <div 
                    className={`h-full ${studentBalanceInfo.projectedLevel.barColor} transition-all duration-300`} 
                    style={{ width: `${Math.max(4, Math.round((studentBalanceInfo.projectedBalance / INITIAL_DISCIPLINE_BALANCE) * 100))}%` }}
                  />
                </div>

                {studentBalanceInfo.projectedBalance <= 100 && (
                  <div className="text-[11px] font-semibold text-rose-800 flex items-start gap-1.5 mt-1 bg-white/80 p-1.5 rounded border border-rose-200">
                    <span className="font-bold text-rose-600">⚠️ PENTING:</span>
                    <span>
                      {studentBalanceInfo.projectedBalance <= 50
                        ? 'Saldo siswa mencapai batas KRITIS (≤50 Poin)! Sesuai pedoman, kasus ini wajib ditindaklanjuti dengan Sidang Pleno / SP 3 / Skorsing.'
                        : 'Saldo siswa mencapai batas PERINGATAN (≤100 Poin)! Wajib diterbitkan Surat Peringatan II dan Pemanggilan Resmi Orang Tua.'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Waktu & Pelanggaran */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              2. Detail Kejadian & Jenis Pelanggaran
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tanggal Pelanggaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.tanggal || ''}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Waktu / Jam Kejadian <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.waktu || '07:15'}
                  onChange={(e) => setFormData({ ...formData, waktu: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tempat / Lokasi Kejadian
                </label>
                <input
                  type="text"
                  value={formData.tempatKejadian || ''}
                  onChange={(e) => setFormData({ ...formData, tempatKejadian: e.target.value })}
                  placeholder="Contoh: Gerbang sekolah, Ruang Kelas, Kantin"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Jenis Pelanggaran yang Dilakukan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.jenisPelanggaran || ''}
                  onChange={(e) => setFormData({ ...formData, jenisPelanggaran: e.target.value })}
                  placeholder="Tuliskan pelanggaran secara spesifik (atau pilih cepat di bagian atas)"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Kategori Pelanggaran
                </label>
                <select
                  value={formData.kategori || 'Ringan'}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value as ViolationSeverity })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 bg-white"
                >
                  <option value="Ringan">Ringan</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Berat">Berat</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Bobot Poin Pelanggaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={formData.poin || 5}
                  onChange={(e) => setFormData({ ...formData, poin: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                />
              </div>

              {/* Guru / Petugas Pelapor with Autocomplete */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Guru / Petugas Pelapor
                  </label>
                  <button
                    type="button"
                    onClick={loadMasterData}
                    title="Segarkan data guru dari src/format_data/guru.csv"
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <RotateCcw className={`w-2.5 h-2.5 ${isRefreshingMaster ? 'animate-spin' : ''}`} />
                    <span>{teachersList.length} guru</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    ref={teacherInputRef}
                    type="text"
                    value={formData.guruPelapor || ''}
                    onFocus={() => setShowTeacherDropdown(true)}
                    onChange={(e) => {
                      setFormData({ ...formData, guruPelapor: e.target.value });
                      setShowTeacherDropdown(true);
                    }}
                    placeholder="Ketik nama Guru atau pilih..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                    autoComplete="off"
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Autocomplete Dropdown List for Teachers */}
                {showTeacherDropdown && filteredTeachers.length > 0 && (
                  <div
                    ref={teacherDropdownRef}
                    className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto divide-y divide-slate-100"
                  >
                    <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Daftar Guru / Petugas Terdaftar:
                    </div>
                    {filteredTeachers.map((t, idx) => (
                      <button
                        type="button"
                        key={`${t.nama}-${idx}`}
                        onClick={() => handleSelectTeacher(t)}
                        className="w-full text-left px-3 py-2 hover:bg-indigo-50/80 transition-colors text-xs flex items-center justify-between cursor-pointer"
                      >
                        <div className="font-semibold text-slate-800">
                          {t.nama}
                        </div>
                        <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {t.jabatan ? t.jabatan.split('/')[0].trim() : t.peran}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Sanksi yang Diberikan & Tindak Lanjut */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1">
              3. Sanksi yang Diberikan & Tindak Lanjut Pembinaan
            </h4>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Sanksi yang Diberikan <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={formData.sanksi || ''}
                onChange={(e) => setFormData({ ...formData, sanksi: e.target.value })}
                placeholder="Tuliskan sanksi edukatif yang diberikan (misal: Teguran lisan, membersihkan perpustakaan, SP 1, skorsing, pemanggilan orang tua)..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Status Pelaksanaan Sanksi
                </label>
                <select
                  value={formData.statusSanksi || 'Belum Ditindaklanjuti'}
                  onChange={(e) => setFormData({ ...formData, statusSanksi: e.target.value as SanctionStatus })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 bg-white font-medium"
                >
                  <option value="Belum Ditindaklanjuti">Belum Ditindaklanjuti</option>
                  <option value="Sedang Berjalan">Sedang Berjalan</option>
                  <option value="Menunggu Pemanggilan Ortu">Menunggu Pemanggilan Ortu</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Batas Waktu / Tenggat Sanksi
                </label>
                <input
                  type="date"
                  value={formData.tenggatSanksi || ''}
                  onChange={(e) => setFormData({ ...formData, tenggatSanksi: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Guru BK / Konselor Pendamping
                </label>
                <input
                  type="text"
                  value={formData.guruBK || defaultGuruBK}
                  onChange={(e) => setFormData({ ...formData, guruBK: e.target.value })}
                  placeholder="Nama Guru BK"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Catatan Khusus Pembinaan Siswa
              </label>
              <textarea
                rows={2}
                value={formData.catatanPembinaan || ''}
                onChange={(e) => setFormData({ ...formData, catatanPembinaan: e.target.value })}
                placeholder="Catatan hasil konseling, respon siswa, atau perjanjian tertulis yang dibuat bersama..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{initialData ? 'Simpan Perubahan' : 'Simpan Catatan Pelanggaran'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
