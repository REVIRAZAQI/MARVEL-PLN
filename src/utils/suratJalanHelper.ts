import { WarehouseTransaction, SuratJalanData, SuratJalanItem, MaterialItem } from '../types/warehouse';

export const NORMALISASI_MAP: Record<string, string> = {
  // Standard PLN Material mappings from MARVEL-WAREHOUSE
  'CUT OUT ACC;FUSE LINK 20kV 5A': '3200018',
  'CUT OUT ACC;FUSE LINK 20kV 6A': '3200015',
  'MCB;230/400V;1P;4A;50Hz;': '3250048',
  'CUT OUT ACC;FUSE LINK 20kV 10A': '3200002',
  'MCB;230/400V;1P;2A;50Hz;': '3250046',
  'MCB;230/400V;1P;6A;50Hz;': '3250050',
  'MTR;kWH ECOM;;1P;230V;5-40A MINMCB;1;;': '2190222',
  'CABLE PWR;NFA2X;2X10mm2;0.6/1kV;OH': '3110025',
  'FUSE;380/220V;125A;SQUARE;1': '2240029',
  'MTR;kWH E-PR;;1P;230V;5-60A;1;;2W': '2190224',
  'CUT OUT ACC;FUSE LINK 20kV 8A': '3200017',
  'COND ACC;NON TENSION JOINT AL 150mm2': '3060132',
  'FUSE;380/220V;160A;SQUARE;1': '2240035',
  'CABLE PWR ACC;CABLE SHOE CU ID 1H 150mm2': '3120231',
  'FUSE;380/220V;80A;SQUARE;1': '2240072',
  'CUT OUT ACC;FUSE LINK 20kV 3A': '3200010',
  'CABLE PWR ACC;DEAD END ASSY FIXED 70mm': '3120038',
  'FUSE;380/220V;100A;SQUARE;1': '2240024',
  'CABLE PWR ACC;LARGE ANGLE ASSY 70mm': '3120058',
  'Cover CO': '',
  'COND ACC;JOINT SLEEVE AL 150mm2': '3060145',
  'COND ACC;JOINT SLEEVE AL 70mm2': '3060143',
  'COND ACC;NON TENSION JOINT AL 70mm2': '3060130',
  'CABLE PWR ACC;CABLE SHOE AL-CU 1H 70mm2': '3120156',
  'CLAMP;G;AL;70-150/70-150mm2;PRS': '2230127',
  'FUSE;380/220V;200A;SQUARE;1': '2240038',
  'FUSE;380/220V;224A;SQUARE;1': '2240040',
  'MCB;230/400V;1P;10A;50Hz;': '3250052',
  'CUT OUT ACC;FUSE LINK 20kV 15A': '3200004',
  'CUT OUT ACC;FUSE LINK 20kV 20A': '3200005',
  'CUT OUT ACC;FUSE LINK 20kV 2A': '3200008',
  'CONN;20kV;CCO;AL;70-150mm2;PRS': '3280384',
  'FUSE;380/220V;250A;SQUARE;1': '2240044',
  'FUSE;380/220V;300A;SQUARE;2': '2240048',
  'CUT OUT ACC;HOLDER FUSE 20kV 100A': '3200022',
  'LVSB ACC;FUSE HOLDER 400A': '3270029',
  'CUT OUT ACC;FUSE LINK 20kV 25A': '3200007',
  'CABLE PWR ACC;STAINLEES STEEL STRIP SSS': '3120077',
  'Cover LA': '',
  'CABLE PWR ACC;SW CLAMP 2X6-25/4x6-25': '3120325',
  'CABLE PWR ACC;SUSPENSION ASSY 70mm': '3120092',
  'MCB;230/400V;1P;25A;50Hz;': '3250058',
  'CLAMP;G;AL;50-70/50-70mm2;PRS': '2230125',
  'CLAMP;G;AL;16-35/10-16mm2;PRS': '2230121',
  'CUT OUT ACC;FUSE LINK 20kV 30A': '3200009',
  'FUSE;380/220V;63A;SQUARE;1': '2240067',
  'CLAMP;G;AL;16-35/16-35mm2;PRS': '2230122',
  'CUT OUT ACC;FUSE LINK 20kV 40A': '3200011',
  'CABLE PWR ACC;CABLE SHOE CU ID 1H 70mm2': '3120228',
  'UNIV ACC;GROUND ROD CU 3/4"X2750mm': '4190262',

  // Common aliases & Indonesian names
  'Pasca Bayar': '2190222',
  'PASCA BAYAR': '2190222',
  'Pra Bayar': '2190224',
  'PRA BAYAR': '2190224',
  'KWH Pasca Bayar 1 Phasa': '2190222',
  'KWH Pra Bayar 1 Phasa': '2190224',
  'KWH Pasca Bayar 3 Phasa': '2190223',
  'KWH Pra Bayar 3 Phasa': '2190225',
  'MCB 1 Phasa 2A': '3250046',
  'MCB 1 Phasa 4A': '3250048',
  'MCB 1 Phasa 6A': '3250050',
  'MCB 1 Phasa 10A': '3250052',
  'MCB 1 Phasa 16A': '3250055',
  'MCB 1 Phasa 20A': '3250057',
  'MCB 1 Phasa 25A': '3250058',
  'MCB 1 Phasa 35A': '3250131',
  'MCB 2A': '3250046',
  'MCB 4A': '3250048',
  'MCB 6A': '3250050',
  'MCB 10A': '3250052',
  'MCB 16A': '3250055',
  'MCB 20A': '3250057',
  'MCB 25A': '3250058',
  'MCB 35A': '3250131',
  'SWC': '3120325',
  'Linetap 25-35/10-16mm': '2230121',
  'LINETAP 25-35/10-16mm': '2230121',
  'Linetap 25-35/25-35mm': '2230122',
  'ISOLASI': '3190001',
  'Estimasi SR 2 x 10m': '3110025',
  'ESTIMASI SR 2 x 10m': '3110025',
  'Kabel TIC 2x10 mm': '3110025',
  'Kabel TIC 2x16 mm': '3110026',
  'Kabel TIC 4x16 mm': '3110040',
  'Kabel TIC 4x25 mm': '3110042',
  'Kabel TIC 4x70 mm': '3110048',
  'COVER': '3190010',
  'SEGEL PLASTIK PUTAR': '3190020'
};

const INDO_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const formatToIndonesianDate = (dateInput?: string): string => {
  if (!dateInput) {
    const d = new Date();
    return `${d.getDate()} ${INDO_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }

  // Check if DD/MM/YYYY
  if (dateInput.includes('/')) {
    const parts = dateInput.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && monthIdx >= 0 && monthIdx < 12 && !isNaN(year)) {
        return `${day} ${INDO_MONTHS[monthIdx]} ${year}`;
      }
    }
  }

  // Check if YYYY-MM-DD
  if (dateInput.includes('-')) {
    const parts = dateInput.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(day) && monthIdx >= 0 && monthIdx < 12 && !isNaN(year)) {
        return `${day} ${INDO_MONTHS[monthIdx]} ${year}`;
      }
    }
  }

  return dateInput;
};

export const getNormalisasiCode = (materialName: string): string => {
  if (NORMALISASI_MAP[materialName]) {
    return NORMALISASI_MAP[materialName];
  }

  const upper = materialName.toUpperCase();
  for (const [key, code] of Object.entries(NORMALISASI_MAP)) {
    if (code && upper.includes(key.toUpperCase())) {
      return code;
    }
  }

  return '';
};

export const getSatuan = (materialName: string): string => {
  const upper = materialName.toUpperCase();
  if (upper.includes('TIC') || upper.includes('KABEL') || upper.includes('SR')) return 'MTR';
  if (upper.includes('ISOLASI')) return 'ROLL';
  if (upper.includes('SET') || upper.includes('TRAFO')) return 'SET';
  if (upper.includes('TIANG')) return 'BTG';
  return 'BH';
};

// Check whether item is Material AGO or NON AGO
export const isNonAgoMaterial = (materialName: string): boolean => {
  const upper = materialName.toUpperCase();
  return (
    upper.includes('SEGEL') ||
    upper.includes('ISOLASI') ||
    upper.includes('FUSE') ||
    upper.includes('SEPATU KABEL') ||
    upper.includes('NON AGO')
  );
};

export interface MonthYearInfo {
  day: number;
  month: number;
  year: number;
  epoch: number;
}

/**
 * Extracts month (1-12) and year from transaction tanggal (Cell B) or timestamp
 */
export const extractTransactionMonthYear = (tx: WarehouseTransaction): MonthYearInfo => {
  const dateStr = (tx.tanggal || '').trim();
  const timeStr = (tx.timestamp || '').trim();

  // Try parsing DD/MM/YYYY
  const dmyMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);
    return {
      day,
      month,
      year,
      epoch: new Date(year, month - 1, day).getTime()
    };
  }

  // Try parsing YYYY-MM-DD
  const ymdMatch = dateStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    return {
      day,
      month,
      year,
      epoch: new Date(year, month - 1, day).getTime()
    };
  }

  // Fallback to timestamp if dateStr didn't match
  const tsDmyMatch = timeStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (tsDmyMatch) {
    const day = parseInt(tsDmyMatch[1], 10);
    const month = parseInt(tsDmyMatch[2], 10);
    const year = parseInt(tsDmyMatch[3], 10);
    return {
      day,
      month,
      year,
      epoch: new Date(year, month - 1, day).getTime()
    };
  }

  // Fallback to current date
  const d = new Date();
  return {
    day: d.getDate(),
    month: d.getMonth() + 1,
    year: d.getFullYear(),
    epoch: d.getTime()
  };
};

/**
/**
 * Calculates the next sequential monthly Surat Jalan number when a transaction is approved.
 * Format: "nomor urut transaksi yang akan reset setiap berganti bulan"/"Bulan transaksi dalam bentuk angka"/SJ/ULP-TGL/"tahun transaksi"
 * Example: "1/10/SJ/ULP-TGL/2026", "2/10/SJ/ULP-TGL/2026"
 */
export const generateNextMonthlySuratJalan = (
  targetTx: WarehouseTransaction,
  existingTxs: WarehouseTransaction[]
): string => {
  const info = extractTransactionMonthYear(targetTx);
  const targetMonth = info.month;
  const targetYear = info.year;

  // Scan all existing approved transactions in this target month/year
  let maxSeq = 0;
  existingTxs.forEach(t => {
    // Only consider approved transactions (or those with established official number)
    const isApproved = t.status === 'Approved' || (!t.status && t.id !== targetTx.id);
    if (!isApproved) return;

    const tInfo = extractTransactionMonthYear(t);
    if (tInfo.month === targetMonth && tInfo.year === targetYear) {
      if (t.column1 && t.column1.includes('/SJ/')) {
        const match = t.column1.match(/^(\d+)\//);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      } else {
        // Fallback increment for approved without stamped column1
        maxSeq = Math.max(maxSeq, 1);
      }
    }
  });

  const nextSeq = maxSeq + 1;
  const month2Digit = String(targetMonth).padStart(2, '0');
  return `${nextSeq}/${month2Digit}/SJ/ULP-TGL/${targetYear}`;
};

/**
 * Generates sequential monthly Surat Jalan number mapping for a list of transactions.
 * Transactions with status === 'Approved' are assigned sequential numbers starting from 1
 * that reset every month.
 * Transactions with status === 'Pending' map to 'Menunggu Approval'.
 * Transactions with status === 'Rejected' map to 'Ditolak'.
 */
export const buildMonthlySuratJalanNumberMap = (
  transactions: WarehouseTransaction[]
): Map<string, string> => {
  const map = new Map<string, string>();
  if (!transactions || transactions.length === 0) return map;

  // Group approved transactions by YYYY-MM
  const monthlyGroups: Record<string, { tx: WarehouseTransaction; index: number; info: MonthYearInfo }[]> = {};

  transactions.forEach((tx, idx) => {
    // Handle Pending & Rejected state immediately
    if (tx.status === 'Pending') {
      map.set(tx.id, 'Menunggu Approval');
      return;
    }
    if (tx.status === 'Rejected') {
      map.set(tx.id, 'Ditolak');
      return;
    }

    // If tx already has a stamped official Surat Jalan number in column1, preserve it directly
    if (tx.column1 && tx.column1.includes('/SJ/')) {
      map.set(tx.id, tx.column1.trim());
      return;
    }

    const info = extractTransactionMonthYear(tx);
    const key = `${info.year}-${String(info.month).padStart(2, '0')}`;
    if (!monthlyGroups[key]) {
      monthlyGroups[key] = [];
    }
    monthlyGroups[key].push({ tx, index: idx, info });
  });

  // For each month group without fixed column1, sort chronologically ascending (earliest to latest)
  Object.keys(monthlyGroups).forEach(key => {
    const list = monthlyGroups[key];
    list.sort((a, b) => {
      if (a.info.epoch !== b.info.epoch) {
        return a.info.epoch - b.info.epoch;
      }
      return a.index - b.index;
    });

    list.forEach((item, seqIdx) => {
      const nomorUrut = seqIdx + 1;
      const month2Digit = String(item.info.month).padStart(2, '0');
      const sjNumber = `${nomorUrut}/${month2Digit}/SJ/ULP-TGL/${item.info.year}`;
      map.set(item.tx.id, sjNumber);
    });
  });

  return map;
};

/**
 * Gets or calculates Surat Jalan number for a transaction
 */
export const getTransactionSuratJalanNumber = (
  tx: WarehouseTransaction,
  allTransactions?: WarehouseTransaction[]
): string => {
  if (tx.status === 'Pending') {
    return 'Menunggu Approval';
  }
  if (tx.status === 'Rejected') {
    return 'Ditolak';
  }
  if (tx.column1 && tx.column1.includes('/SJ/')) {
    return tx.column1.trim();
  }

  if (allTransactions && allTransactions.length > 0) {
    const map = buildMonthlySuratJalanNumberMap(allTransactions);
    const found = map.get(tx.id);
    if (found) return found;
  }

  const info = extractTransactionMonthYear(tx);
  const month2Digit = String(info.month).padStart(2, '0');
  return `1/${month2Digit}/SJ/ULP-TGL/${info.year}`;
};

export const createSuratJalanFromTransaction = (
  tx: WarehouseTransaction,
  options?: Partial<SuratJalanData> & { allTransactions?: WarehouseTransaction[] }
): SuratJalanData => {
  const info = extractTransactionMonthYear(tx);
  const defaultNoSurat =
    options?.nomorSurat ||
    (tx.status === 'Pending'
      ? 'DRAFT (Menunggu Approval)'
      : getTransactionSuratJalanNumber(tx, options?.allTransactions));

  const isMasuk =
    tx.admMaterial === 'Masuk' ||
    tx.admMaterial === 'Return' ||
    (tx.noGangguan && tx.noGangguan.toUpperCase().includes('PERUBAHAN DAYA')) ||
    (tx.keterangan && tx.keterangan.toUpperCase().includes('PERUBAHAN DAYA'));

  const allItemsList: SuratJalanItem[] = [];

  // Populate EXACT materials inputted in the transaction into 1 unified table
  // Matching template columns: NO | NORMALISASI | NAMA BARANG | KELUAR | MASUK | JUMLAH | SAT
  tx.items.forEach((item, idx) => {
    const qty = Number(item.quantity) || 1;
    const norm = getNormalisasiCode(item.materialName);
    const sat = getSatuan(item.materialName);
    const keluarQty = isMasuk ? 0 : qty;
    const masukQty = isMasuk ? qty : 0;

    const sjItem: SuratJalanItem = {
      no: idx + 1,
      normalisasi: norm,
      namaBarang: item.materialName.toUpperCase(),
      keluar: keluarQty,
      masuk: masukQty,
      pasangBaru: keluarQty, // backward-compatibility alias
      perubahanDaya: masukQty, // backward-compatibility alias
      jumlah: qty,
      satuan: sat
    };

    allItemsList.push(sjItem);
  });

  const dateIndo = formatToIndonesianDate(tx.tanggal);

  return {
    id: `sj-${tx.id}`,
    transactionId: tx.id,
    nomorSurat: defaultNoSurat,
    tanggal: dateIndo,
    namaPetugas: tx.namaPetugas || 'Petugas Pelaksana',
    namaVendor: tx.reguYandal ? `PT RAJASA (${tx.reguYandal})` : 'PT RAJASA',
    kendaraan: 'Kendaraan Yantek',
    peruntukan: tx.noGangguan || 'Material ULP Tanggul',
    noSpk: '', // Dikosongkan agar diisi manual
    itemsAsg: allItemsList,
    itemsNonAsg: [],
    items: allItemsList,
    penerima: tx.namaPetugas || 'Petugas Pelaksana',
    keamanan: tx.security || tx.petugasSecurity || '', // Diisi dari Cell BP Sheet 1 Spreadsheet
    pemberi: tx.pemberiMaterial || 'Ahmad Zaenudin', // Diisi dari Cell CL Sheet 1 Spreadsheet
    approvedByAdmin: tx.approvedByAdmin || 'David Basyhul Hafi (Admin)',
    approvedByMULP: tx.approvedByMULP || 'Ir. H. Bambang Hermanto (MULP)',
    ...options
  };
};

export const createSuratJalanFromMaterials = (
  selectedMaterials: { material: MaterialItem; quantity: number }[],
  options?: Partial<SuratJalanData>
): SuratJalanData => {
  const d = new Date();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const defaultNoSurat = `1/${month}/SJ/ULP-TGL/${year}`;

  const allItemsList: SuratJalanItem[] = [];

  selectedMaterials.forEach(({ material, quantity }, idx) => {
    const norm = material.code || getNormalisasiCode(material.name);

    const sjItem: SuratJalanItem = {
      no: idx + 1,
      normalisasi: norm,
      namaBarang: material.name.toUpperCase(),
      keluar: quantity,
      masuk: 0,
      pasangBaru: quantity,
      perubahanDaya: 0,
      jumlah: quantity,
      satuan: material.unit || getSatuan(material.name)
    };

    allItemsList.push(sjItem);
  });

  return {
    id: `sj-gen-${Date.now()}`,
    nomorSurat: defaultNoSurat,
    tanggal: formatToIndonesianDate(),
    namaPetugas: 'Ahmad Yandri (Yandal)',
    namaVendor: 'PT RAJASA (ULC_A)',
    kendaraan: 'Kendaraan Yantek',
    peruntukan: 'Material ULP Tanggul',
    noSpk: '', // Dikosongkan agar diisi manual
    itemsAsg: allItemsList,
    itemsNonAsg: [],
    items: allItemsList,
    penerima: 'Ahmad Yandri',
    keamanan: '',
    pemberi: 'EMMA AGUSTINA',
    approvedByAdmin: 'David Basyhul Hafi (Admin)',
    approvedByMULP: 'Ir. H. Bambang Hermanto (MULP)',
    ...options
  };
};
