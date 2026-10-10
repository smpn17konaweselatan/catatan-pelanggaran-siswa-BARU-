import { ViolationRecord } from '../types/violation';
import { StudentMasterItem } from '../data/schoolMasterData';

export const INITIAL_DISCIPLINE_BALANCE = 200;

export type DisciplineLevel = 'Aman' | 'Perhatian' | 'Peringatan' | 'Kritis';

export interface DisciplineLevelInfo {
  level: DisciplineLevel;
  statusLabel: string;
  rekomendasiTindakan: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  barColor: string;
}

export function getDisciplineLevelInfo(sisaSaldo: number): DisciplineLevelInfo {
  if (sisaSaldo <= 50) {
    return {
      level: 'Kritis',
      statusLabel: 'Kritis (SP 3 / Skorsing)',
      rekomendasiTindakan: 'Sidang Pleno Dewan Guru, Pemanggilan Mendesak Orang Tua, & Skorsing',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700',
      badgeBorder: 'border-rose-200',
      barColor: 'bg-rose-600'
    };
  }
  if (sisaSaldo <= 100) {
    return {
      level: 'Peringatan',
      statusLabel: 'Peringatan Keras (SP 2)',
      rekomendasiTindakan: 'Surat Peringatan II (SP 2) & Pemanggilan Resmi Orang Tua ke Ruang BK',
      badgeBg: 'bg-orange-50',
      badgeText: 'text-orange-700',
      badgeBorder: 'border-orange-200',
      barColor: 'bg-orange-500'
    };
  }
  if (sisaSaldo <= 150) {
    return {
      level: 'Perhatian',
      statusLabel: 'Perhatian Khusus (SP 1)',
      rekomendasiTindakan: 'Bimbingan Konseling Khusus BK, Surat Peringatan I, & Perjanjian Tertulis',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-700',
      badgeBorder: 'border-amber-200',
      barColor: 'bg-amber-500'
    };
  }
  return {
    level: 'Aman',
    statusLabel: 'Aman / Terkendali',
    rekomendasiTindakan: 'Pembinaan Rutin Tata Tertib oleh Wali Kelas & Guru Piket',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    barColor: 'bg-emerald-500'
  };
}

export interface StudentDisciplineProfile {
  namaSiswa: string;
  kelas: string;
  nisn: string;
  jenisKelamin: 'L' | 'P';
  saldoAwal: number;
  totalPoinTerpotong: number;
  sisaSaldo: number;
  persentaseSisa: number;
  jumlahPelanggaran: number;
  levelInfo: DisciplineLevelInfo;
  pelanggaranTerakhir?: ViolationRecord;
  records: ViolationRecord[];
}

export function calculateStudentBalances(
  records: ViolationRecord[],
  allMasterStudents?: StudentMasterItem[]
): StudentDisciplineProfile[] {
  const map = new Map<string, StudentDisciplineProfile>();

  // If master students provided, optionally seed them with 200 points
  if (allMasterStudents) {
    for (const ms of allMasterStudents) {
      const key = ms.nama.trim().toUpperCase();
      map.set(key, {
        namaSiswa: ms.nama,
        kelas: ms.kelas,
        nisn: ms.nisn || ms.nis,
        jenisKelamin: ms.jenisKelamin,
        saldoAwal: INITIAL_DISCIPLINE_BALANCE,
        totalPoinTerpotong: 0,
        sisaSaldo: INITIAL_DISCIPLINE_BALANCE,
        persentaseSisa: 100,
        jumlahPelanggaran: 0,
        levelInfo: getDisciplineLevelInfo(INITIAL_DISCIPLINE_BALANCE),
        records: []
      });
    }
  }

  // Deduct violation points
  for (const r of records) {
    const key = r.namaSiswa.trim().toUpperCase();
    let current = map.get(key);

    if (!current) {
      current = {
        namaSiswa: r.namaSiswa,
        kelas: r.kelas,
        nisn: r.nisn,
        jenisKelamin: r.jenisKelamin,
        saldoAwal: INITIAL_DISCIPLINE_BALANCE,
        totalPoinTerpotong: 0,
        sisaSaldo: INITIAL_DISCIPLINE_BALANCE,
        persentaseSisa: 100,
        jumlahPelanggaran: 0,
        levelInfo: getDisciplineLevelInfo(INITIAL_DISCIPLINE_BALANCE),
        records: []
      };
      map.set(key, current);
    }

    current.totalPoinTerpotong += Number(r.poin) || 0;
    current.jumlahPelanggaran += 1;
    current.records.push(r);
    if (!current.pelanggaranTerakhir) {
      current.pelanggaranTerakhir = r;
    }
  }

  // Calculate remaining balance and levels
  const list: StudentDisciplineProfile[] = [];
  for (const profile of map.values()) {
    const remaining = Math.max(0, INITIAL_DISCIPLINE_BALANCE - profile.totalPoinTerpotong);
    profile.sisaSaldo = remaining;
    profile.persentaseSisa = Math.round((remaining / INITIAL_DISCIPLINE_BALANCE) * 100);
    profile.levelInfo = getDisciplineLevelInfo(remaining);
    list.push(profile);
  }

  // Sort: lowest balance first (pupils requiring most attention at the top!)
  return list.sort((a, b) => a.sisaSaldo - b.sisaSaldo);
}

export function getStudentBalance(namaSiswa: string, records: ViolationRecord[]): StudentDisciplineProfile {
  const target = namaSiswa.trim().toUpperCase();
  const studentRecords = records.filter(r => r.namaSiswa.trim().toUpperCase() === target);
  
  const totalTerpotong = studentRecords.reduce((sum, r) => sum + (Number(r.poin) || 0), 0);
  const sisa = Math.max(0, INITIAL_DISCIPLINE_BALANCE - totalTerpotong);
  const sample = studentRecords[0];

  return {
    namaSiswa,
    kelas: sample ? sample.kelas : '',
    nisn: sample ? sample.nisn : '',
    jenisKelamin: sample ? sample.jenisKelamin : 'L',
    saldoAwal: INITIAL_DISCIPLINE_BALANCE,
    totalPoinTerpotong: totalTerpotong,
    sisaSaldo: sisa,
    persentaseSisa: Math.round((sisa / INITIAL_DISCIPLINE_BALANCE) * 100),
    jumlahPelanggaran: studentRecords.length,
    levelInfo: getDisciplineLevelInfo(sisa),
    pelanggaranTerakhir: sample,
    records: studentRecords
  };
}
