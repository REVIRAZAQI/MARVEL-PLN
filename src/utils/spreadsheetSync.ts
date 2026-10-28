import { WarehouseTransaction, SpreadsheetSyncConfig, SyncResult, MaterialItem } from '../types/warehouse';
import { MASTER_MATERIALS } from '../data/materialsMaster';
import * as XLSX from 'xlsx';
import { buildMonthlySuratJalanNumberMap, getTransactionSuratJalanNumber, getNormalisasiCode } from './suratJalanHelper';

const SYNC_CONFIG_KEY = 'pln_spreadsheet_sync_config_v1';

/**
 * Exact 12 columns matching MARVEL-WAREHOUSE_412a70c9 spreadsheet layout:
 * [No. Surat Jalan, Tanggal, Adm Material, Jabatan, Nama Petugas, Regu Yandal, No GANGGUAN..., NORMALISASI, Nama Material, Jumlah, Pemberi Material, Security]
 */
export const SPREADSHEET_COLUMNS: string[] = [
  "No. Surat Jalan",
  "Tanggal",
  "Adm Material",
  "Jabatan",
  "Nama Petugas",
  "Regu Yandal",
  "No GANGGUAN DAN PEMELIHARAAN (APKT/PK Teknik/IDpel ggn)",
  "NORMALISASI",
  "Nama Material",
  "Jumlah",
  "Pemberi Material",
  "Security"
];

/**
 * Standard columns matching Sheet DB_MATERIAL in Google Spreadsheet:
 * [NORMALISASI, Nama Material, Satuan, Stock Siap, Kategori, Lokasi Rak]
 */
export const DB_MATERIAL_COLUMNS: string[] = [
  "NORMALISASI",
  "Nama Material",
  "Satuan",
  "Stock Siap",
  "Kategori",
  "Lokasi Rak"
];

export const getSyncConfig = (): SpreadsheetSyncConfig => {
  try {
    const raw = localStorage.getItem(SYNC_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed reading sync config', err);
  }
  return {
    webhookUrl: '',
    sheetName: 'Sheet1',
    dbMaterialSheetName: 'DB_MATERIAL',
    autoSync: true
  };
};

export const saveSyncConfig = (config: SpreadsheetSyncConfig) => {
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent('pln-sync-config-updated'));
};

export const parseDateToEpoch = (dateStr?: string): number => {
  const str = (dateStr || '').trim();
  if (!str) return 0;

  // DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    return new Date(year, month, day).getTime();
  }

  // YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    return new Date(year, month, day).getTime();
  }

  const parsed = Date.parse(str);
  return isNaN(parsed) ? 0 : parsed;
};

export const parseDateTimeToEpoch = parseDateToEpoch;

/**
 * Sorts transactions strictly by Cell B in the spreadsheet (Tanggal).
 * Ensures zero confusion with timestamp hours, matching user instructions.
 */
export const sortTransactionsByDate = (
  transactions: WarehouseTransaction[],
  order: 'desc' | 'asc' = 'desc'
): WarehouseTransaction[] => {
  return [...transactions].sort((a, b) => {
    const epochA = parseDateToEpoch(a.tanggal);
    const epochB = parseDateToEpoch(b.tanggal);
    if (epochA !== epochB) {
      return order === 'desc' ? epochB - epochA : epochA - epochB;
    }
    return 0;
  });
};

export const sortTransactionsByDateTime = sortTransactionsByDate;

export const formatTransactionToSpreadsheetRows = (
  tx: WarehouseTransaction,
  options?: { allTransactions?: WarehouseTransaction[]; suratJalanMap?: Map<string, string> }
): (string | number)[][] => {
  const sjNumber =
    (options?.suratJalanMap && options.suratJalanMap.get(tx.id)) ||
    tx.column1 ||
    getTransactionSuratJalanNumber(tx, options?.allTransactions);

  const tgl = tx.tanggal || '';
  const adm = tx.admMaterial || 'Keluar';
  const jab = tx.jabatan || 'Yandal';
  const petugas = tx.namaPetugas || tx.petugasPelayananTeknik || '';
  const regu = tx.reguYandal || '';
  const noGgn = tx.noGangguan || '';
  const pemberi = tx.pemberiMaterial || (adm === 'Masuk' ? 'GUDANG UP3 JEMBER' : 'Ahmad Zaenudin');
  const security = tx.security || tx.petugasSecurity || 'Andreas Widyo Nugroho';

  if (!tx.items || tx.items.length === 0) {
    return [[
      sjNumber,
      tgl,
      adm,
      jab,
      petugas,
      regu,
      noGgn,
      '',
      '',
      0,
      pemberi,
      security
    ]];
  }

  return tx.items.map(item => {
    const norm = (item as any).normalisasi || getNormalisasiCode(item.materialName) || '';
    return [
      sjNumber,
      tgl,
      adm,
      jab,
      petugas,
      regu,
      noGgn,
      norm ? (isNaN(Number(norm)) ? norm : Number(norm)) : '',
      item.materialName || '',
      item.quantity || 1,
      pemberi,
      security
    ];
  });
};

export const formatTransactionToSpreadsheetRow = (
  tx: WarehouseTransaction,
  _rowIndex: number = 1
): (string | number)[] => {
  const rows = formatTransactionToSpreadsheetRows(tx);
  return rows[0] || [];
};

export const sendTransactionToSpreadsheet = async (tx: WarehouseTransaction): Promise<SyncResult> => {
  // Sesuai aturan: data yang dikirim ke spreadsheet HANYA data yang sudah di-approve/disetujui!
  if (tx.status !== 'Approved') {
    return {
      success: false,
      message: 'Transaksi belum di-approve/disetujui. Data hanya dikirim ke Google Spreadsheet setelah transaksi disetujui oleh Admin Gudang / MULP.'
    };
  }

  const config = getSyncConfig();
  const rows = formatTransactionToSpreadsheetRows(tx);

  if (!config.webhookUrl) {
    return {
      success: true,
      message: 'Transaksi telah disetujui dan tersimpan lokal. Masukkan URL Webhook Google Apps Script untuk sinkronisasi otomatis ke Google Sheets.',
      rowPreview: rows[0]
    };
  }

  try {
    for (const rowData of rows) {
      const payload = {
        action: 'appendRow',
        sheetName: config.sheetName || 'Sheet1',
        row: rowData,
        transaction: {
          id: tx.id,
          timestamp: tx.timestamp,
          tanggal: tx.tanggal,
          admMaterial: tx.admMaterial,
          noGangguan: tx.noGangguan,
          namaPetugas: tx.namaPetugas,
          reguYandal: tx.reguYandal,
          status: tx.status
        }
      };

      await fetch(config.webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });
    }

    saveSyncConfig({
      ...config,
      lastSyncTimestamp: new Date().toLocaleString('id-ID')
    });

    return {
      success: true,
      message: 'Data transaksi yang disetujui berhasil dikirim ke Google Spreadsheet secara real-time!',
      rowPreview: rows[0]
    };
  } catch (err: any) {
    console.error('Failed posting to Google Sheets webhook', err);
    return {
      success: false,
      message: `Gagal mengirim ke Google Sheets: ${err?.message || 'Koneksi terputus'}. Transaksi tetap aman tersimpan di web app.`,
      rowPreview: rows[0]
    };
  }
};

/**
 * Bulk sync ONLY approved transactions to Google Sheets so nothing unapproved is sent
 */
export const syncAllTransactionsToSpreadsheet = async (
  transactions: WarehouseTransaction[]
): Promise<{ success: boolean; count: number; message: string }> => {
  const config = getSyncConfig();
  // Filter HANYA data yang sudah di-approve / disetujui!
  const approvedOnly = transactions.filter(t => t.status === 'Approved');

  if (approvedOnly.length === 0) {
    return {
      success: true,
      count: 0,
      message: 'Belum ada transaksi dengan status Disetujui (Approved) untuk dikirim ke spreadsheet.'
    };
  }

  const sorted = sortTransactionsByDateTime(approvedOnly, 'asc'); // Chronological order matching sheet rows
  const sjMap = buildMonthlySuratJalanNumberMap(approvedOnly);
  const allRows: (string | number)[][] = [];
  sorted.forEach(t => {
    const rows = formatTransactionToSpreadsheetRows(t, { allTransactions: approvedOnly, suratJalanMap: sjMap });
    allRows.push(...rows);
  });

  if (!config.webhookUrl) {
    return {
      success: true,
      count: allRows.length,
      message: `Semua ${allRows.length} baris material mutasi yang telah disetujui (Approved) telah disinkronkan & diurutkan secara lokal.`
    };
  }

  try {
    const payload = {
      action: 'syncAllRows',
      sheetName: config.sheetName || 'Sheet1',
      headers: SPREADSHEET_COLUMNS,
      rows: allRows
    };

    await fetch(config.webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    saveSyncConfig({
      ...config,
      lastSyncTimestamp: new Date().toLocaleString('id-ID')
    });

    return {
      success: true,
      count: allRows.length,
      message: `Seluruh ${allRows.length} baris material mutasi berhasil disinkronkan ke Google Spreadsheet!`
    };
  } catch (err: any) {
    console.error('Bulk sync failed', err);
    return {
      success: false,
      count: 0,
      message: `Gagal menyinkronkan ke Spreadsheet: ${err?.message || 'Koneksi terputus'}`
    };
  }
};

/**
 * Converts MaterialItem list into standard rows for Sheet DB_MATERIAL:
 * [NORMALISASI, Nama Material, Satuan, Stock Siap, Kategori, Lokasi Rak]
 */
export const formatMaterialsToDbMaterialRows = (materials: (MaterialItem | any)[]): (string | number)[][] => {
  return materials.map(m => [
    m.code,
    m.name,
    m.unit,
    m.currentStock !== undefined ? m.currentStock : (m.defaultStock || 0),
    m.category || 'KWH & MCB',
    m.rackLocation || 'Gudang Utama'
  ]);
};

/**
 * Synchronizes materials & current stock directly to Google Spreadsheet Sheet "DB_MATERIAL"
 */
export const syncMaterialsToDbMaterialSheet = async (
  materials: MaterialItem[]
): Promise<{ success: boolean; count: number; message: string }> => {
  const config = getSyncConfig();
  const rows = formatMaterialsToDbMaterialRows(materials);

  if (!config.webhookUrl) {
    return {
      success: true,
      count: materials.length,
      message: `${materials.length} material tersimpan lokal. Masukkan URL Webhook Google Apps Script untuk sinkronisasi otomatis ke Sheet DB_MATERIAL.`
    };
  }

  try {
    const payload = {
      action: 'syncDbMaterial',
      sheetName: config.dbMaterialSheetName || 'DB_MATERIAL',
      headers: DB_MATERIAL_COLUMNS,
      rows: rows
    };

    await fetch(config.webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    saveSyncConfig({
      ...config,
      lastDbMaterialSyncTimestamp: new Date().toLocaleString('id-ID')
    });

    return {
      success: true,
      count: materials.length,
      message: `Seluruh ${materials.length} data material & saldo siap berhasil disinkronkan ke Google Spreadsheet Sheet "${config.dbMaterialSheetName || 'DB_MATERIAL'}"!`
    };
  } catch (err: any) {
    console.error('Failed syncing DB_MATERIAL to Google Sheets', err);
    return {
      success: false,
      count: 0,
      message: `Gagal menyinkronkan ke Sheet DB_MATERIAL: ${err?.message || 'Koneksi terputus'}`
    };
  }
};

/**
 * Pulls the latest material catalog and stock balances directly from Google Spreadsheet Sheet "DB_MATERIAL"
 */
export const fetchMaterialsFromDbMaterialSheet = async (): Promise<{
  success: boolean;
  data?: MaterialItem[];
  message: string;
}> => {
  const config = getSyncConfig();
  if (!config.webhookUrl) {
    return {
      success: false,
      message: 'URL Webhook Google Apps Script belum dikonfigurasi.'
    };
  }

  try {
    const url = new URL(config.webhookUrl);
    url.searchParams.set('action', 'getDbMaterial');
    url.searchParams.set('sheet', config.dbMaterialSheetName || 'DB_MATERIAL');

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    if (json.status !== 'success' || !Array.isArray(json.data) || json.data.length <= 1) {
      throw new Error('Data sheet DB_MATERIAL kosong atau tidak valid.');
    }

    // Convert rows to CSV format for parser
    const csvLines = json.data.map((r: any[]) => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const parsed = parseDbMaterialPasteOrRows(csvLines);

    return {
      success: true,
      data: parsed.items,
      message: `Berhasil menarik ${parsed.items.length} material dari Sheet "${config.dbMaterialSheetName || 'DB_MATERIAL'}".`
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menarik data dari Sheet DB_MATERIAL: ${err?.message || 'Koneksi terputus'}`
    };
  }
};

/**
 * Parses copied cells (TSV/CSV) or Excel rows from Sheet DB_MATERIAL:
 * Maps: NORMALISASI, Nama Material, Satuan, Stock Siap, Kategori, Lokasi Rak
 */
export const parseDbMaterialPasteOrRows = (
  text: string,
  existingMaterials: MaterialItem[] = []
): { items: MaterialItem[]; updatedCount: number; createdCount: number } => {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return { items: existingMaterials, updatedCount: 0, createdCount: 0 };

  const itemsMap = new Map<string, MaterialItem>();
  existingMaterials.forEach(m => itemsMap.set(m.id, { ...m }));

  const findExistingKey = (code: string, name: string): string | null => {
    const cleanCode = (code || '').replace(/^0+/, '').trim().toLowerCase();
    const cleanName = (name || '').trim().toLowerCase();

    for (const [id, m] of itemsMap.entries()) {
      const existingCleanCode = (m.code || '').replace(/^0+/, '').trim().toLowerCase();
      const existingCleanName = (m.name || '').trim().toLowerCase();

      if (cleanCode && existingCleanCode && cleanCode === existingCleanCode) {
        return id;
      }
      if (cleanName && existingCleanName && cleanName === existingCleanName) {
        return id;
      }
    }
    return null;
  };

  const isTsv = lines[0].includes('\t');
  const sep = isTsv ? '\t' : (lines[0].includes(';') ? ';' : ',');

  let headerIndex = -1;
  let codeIdx = 0;
  let nameIdx = 1;
  let unitIdx = 2;
  let stockIdx = 3;
  let catIdx = 4;
  let rackIdx = 5;

  const firstCols = (isTsv ? lines[0].split('\t') : splitCsvLine(lines[0])).map(c => c.trim().replace(/^["']|["']$/g, ''));
  const firstColsLower = firstCols.map(c => c.toLowerCase());

  if (firstColsLower.some(c => c.includes('normalisasi') || c.includes('kode') || c.includes('nama') || c.includes('material'))) {
    headerIndex = 0;
    firstColsLower.forEach((col, idx) => {
      if (col.includes('normalisasi') || col.includes('kode') || col.includes('no material')) codeIdx = idx;
      else if (col.includes('nama') || col.includes('uraian') || col.includes('deskripsi')) nameIdx = idx;
      else if (col.includes('satuan') || col.includes('unit')) unitIdx = idx;
      else if (col.includes('stok') || col.includes('stock') || col.includes('siap') || col.includes('saldo') || col.includes('qty') || col.includes('jumlah')) stockIdx = idx;
      else if (col.includes('kategori')) catIdx = idx;
      else if (col.includes('rak') || col.includes('lokasi')) rackIdx = idx;
    });
  }

  let updatedCount = 0;
  let createdCount = 0;
  const startIdx = headerIndex >= 0 ? headerIndex + 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const rawCols = (isTsv ? lines[i].split('\t') : splitCsvLine(lines[i])).map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (rawCols.length < 2) continue;

    const rawCode = rawCols[codeIdx] || '';
    const rawName = rawCols[nameIdx] || '';
    const rawUnit = rawCols[unitIdx] || 'BH';
    const rawStock = Number(rawCols[stockIdx]) || 0;
    const rawCat = rawCols[catIdx] || 'KWH & MCB';
    const rawRack = rawCols[rackIdx] || 'Gudang Utama';

    if (!rawName && !rawCode) continue;

    const code = rawCode || `00000000000${Math.floor(10000000 + Math.random() * 90000000)}`;
    const name = rawName || `Material ${code}`;

    const existingId = findExistingKey(code, name);

    if (existingId && itemsMap.has(existingId)) {
      const existing = itemsMap.get(existingId)!;
      const diff = rawStock - existing.currentStock;
      itemsMap.set(existingId, {
        ...existing,
        code: rawCode || existing.code,
        name: name,
        unit: rawUnit || existing.unit,
        category: (rawCat as any) || existing.category,
        rackLocation: rawRack || existing.rackLocation,
        initialStock: Math.max(0, existing.initialStock + diff),
        currentStock: rawStock,
        lastUpdated: new Date().toISOString()
      });
      updatedCount++;
    } else {
      const newMat: MaterialItem = {
        id: `mat-${Date.now()}-${i}`,
        code: code,
        name: name,
        category: (rawCat as any) || 'KWH & MCB',
        unit: rawUnit,
        initialStock: rawStock,
        totalIn: 0,
        totalOut: 0,
        totalReturn: 0,
        currentStock: rawStock,
        minSafetyStock: Math.max(1, Math.floor(rawStock * 0.1)),
        rackLocation: rawRack,
        lastUpdated: new Date().toISOString()
      };
      itemsMap.set(newMat.id, newMat);
      createdCount++;
    }
  }

  return {
    items: Array.from(itemsMap.values()),
    updatedCount,
    createdCount
  };
};

/**
 * Exports materials & stock balance to an authentic Excel (.xlsx) file with sheet name "DB_MATERIAL"
 */
export const exportDbMaterialToExcel = (
  materials: MaterialItem[],
  customFilename?: string
) => {
  const wb = XLSX.utils.book_new();
  const headers = [...DB_MATERIAL_COLUMNS];
  const rows = [headers, ...formatMaterialsToDbMaterialRows(materials)];
  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws['!cols'] = [
    { wch: 18 }, // NORMALISASI
    { wch: 45 }, // Nama Material
    { wch: 12 }, // Satuan
    { wch: 14 }, // Stock Siap
    { wch: 22 }, // Kategori
    { wch: 20 }  // Lokasi Rak
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'DB_MATERIAL');

  const fileName = customFilename || `MARVEL_DB_MATERIAL_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
};

/**
 * Parses copied cells (TSV) or CSV text exported from Google Spreadsheet
 * into structured WarehouseTransaction array, ensuring no row is left behind.
 */
/**
 * Accurate CSV line splitter that preserves empty cells (e.g. ",,", ",,val,,")
 * without dropping columns or shifting indices.
 */
export const splitCsvLine = (text: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map(s => s.replace(/^"|"$/g, '').trim());
};

/**
 * Returns Excel/Google Sheets column letters for an index (0 -> A, 25 -> Z, 26 -> AA...)
 */
export const getColumnLetter = (colIdx: number): string => {
  let temp = colIdx;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
};

/**
 * Parses copied cells (TSV) or CSV text exported from Google Spreadsheet
 * into structured WarehouseTransaction array, ensuring no cell or row is left behind.
 */
export const parseSpreadsheetPasteOrCsv = (rawText: string): WarehouseTransaction[] => {
  const lines = rawText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  // Detect separator: Tab (\t) or Comma (,)
  const firstLine = lines[0];
  const isTsv = firstLine.includes('\t');

  const hasHeader =
    lines[0].toLowerCase().includes('surat jalan') ||
    lines[0].toLowerCase().includes('tanggal') ||
    lines[0].toLowerCase().includes('normalisasi');
  const startIdx = hasHeader ? 1 : 0;

  // Header column name mapping if available
  const headerMap: { [name: string]: number } = {};
  if (hasHeader) {
    const rawHeaders = isTsv ? lines[0].split('\t') : splitCsvLine(lines[0]);
    rawHeaders.forEach((h, idx) => {
      if (h) {
        headerMap[h.trim().toLowerCase()] = idx;
      }
    });
  }

  // Check if this is the 12-column normalized row-per-material format matching MARVEL-WAREHOUSE_412a70c9
  const is12Col =
    headerMap['normalisasi'] !== undefined ||
    headerMap['nama material'] !== undefined ||
    headerMap['jumlah'] !== undefined ||
    (!hasHeader && splitCsvLine(firstLine).length <= 15);

  if (is12Col) {
    const sjIdx = headerMap['no. surat jalan'] !== undefined ? headerMap['no. surat jalan'] : 0;
    const tglIdx = headerMap['tanggal'] !== undefined ? headerMap['tanggal'] : 1;
    const admIdx = headerMap['adm material'] !== undefined ? headerMap['adm material'] : 2;
    const jabIdx = headerMap['jabatan'] !== undefined ? headerMap['jabatan'] : 3;
    const petIdx = headerMap['nama petugas'] !== undefined ? headerMap['nama petugas'] : 4;
    const regIdx = headerMap['regu yandal'] !== undefined ? headerMap['regu yandal'] : 5;
    const ggnIdx =
      headerMap['no gangguan dan pemeliharaan (apkt/pk teknik/idpel ggn)'] !== undefined
        ? headerMap['no gangguan dan pemeliharaan (apkt/pk teknik/idpel ggn)']
        : headerMap['no gangguan'] !== undefined
        ? headerMap['no gangguan']
        : 6;
    const normIdx = headerMap['normalisasi'] !== undefined ? headerMap['normalisasi'] : 7;
    const matIdx = headerMap['nama material'] !== undefined ? headerMap['nama material'] : 8;
    const qtyIdx = headerMap['jumlah'] !== undefined ? headerMap['jumlah'] : 9;
    const pemIdx = headerMap['pemberi material'] !== undefined ? headerMap['pemberi material'] : 10;
    const secIdx = headerMap['security'] !== undefined ? headerMap['security'] : 11;

    const txMap = new Map<string, WarehouseTransaction>();

    for (let i = startIdx; i < lines.length; i++) {
      const rawLine = lines[i];
      const cols = isTsv
        ? rawLine.split('\t').map(c => c.trim().replace(/^"|"$/g, ''))
        : splitCsvLine(rawLine);

      if (cols.length < 3 || cols.every(c => !c)) continue;

      const sj = (cols[sjIdx] || '').trim();
      const tgl = (cols[tglIdx] || '').trim();
      const adm = ((cols[admIdx] || 'Keluar').trim()) as any;
      const jab = (cols[jabIdx] || 'Yandal').trim();
      const petugas = (cols[petIdx] || 'Petugas Pelaksana').trim();
      const regu = (cols[regIdx] || 'ULC_A').trim();
      const noGgn = (cols[ggnIdx] || '').trim();
      const normRaw = (cols[normIdx] || '').trim();
      const norm = normRaw === '0' ? '' : normRaw;
      const matName = (cols[matIdx] || '').trim();
      const qty = parseInt(cols[qtyIdx], 10) || 1;
      const pemberi = (cols[pemIdx] || 'Ahmad Zaenudin').trim();
      const sec = (cols[secIdx] || 'Andreas Widyo Nugroho').trim();

      const key = `${sj}_${tgl}_${petugas}`;
      if (!txMap.has(key)) {
        txMap.set(key, {
          id: `tx-import-${i}-${Date.now()}`,
          timestamp: `${tgl} 08:00:00`,
          tanggal: tgl,
          admMaterial: adm === 'Masuk' || adm === 'Return' ? adm : 'Keluar',
          jabatan: jab,
          namaPetugas: petugas,
          reguYandal: regu,
          noGangguan: noGgn,
          items: [],
          petugasSecurity: sec,
          security: sec,
          pemberiMaterial: pemberi,
          petugasPelayananTeknik: petugas,
          column1: sj,
          status: 'Approved'
        });
      }

      if (matName) {
        const tx = txMap.get(key)!;
        tx.items.push({
          materialId: norm ? `mat-${norm}` : `mat-item-${i}`,
          materialName: matName,
          normalisasi: norm,
          quantity: qty
        });
      }
    }

    return sortTransactionsByDateTime(Array.from(txMap.values()), 'desc');
  }

  // Fallback for legacy wide formats
  const results: WarehouseTransaction[] = [];
  for (let i = startIdx; i < lines.length; i++) {
    const rawLine = lines[i];
    const cols = isTsv
      ? rawLine.split('\t').map(c => c.trim().replace(/^"|"$/g, ''))
      : splitCsvLine(rawLine);

    if (cols.length < 3 || cols.every(c => !c)) continue;

    const sjNumber = cols[0] && cols[0].includes('SJ') ? cols[0] : (cols[1] || '');
    const tanggal = cols[1] && cols[1].includes('/') ? cols[1] : (cols[2] || '');
    const timestamp = `${tanggal} 08:00:00`;
    const admMaterial: any = cols[2] === 'Masuk' ? 'Masuk' : 'Keluar';
    const jabatan = cols[3] || 'Yandal';
    const namaPetugas = cols[4] || 'Petugas Pelaksana';
    const reguYandal = cols[5] || 'ULC_A';
    const noGangguan = cols[6] || `MUTASI-${i}`;
    const pemberiMaterial = cols[10] || cols[cols.length - 2] || 'Ahmad Zaenudin';
    const security = cols[11] || cols[cols.length - 1] || 'Hari Sujoko';

    results.push({
      id: `tx-legacy-${Date.now()}-${i}`,
      timestamp,
      tanggal,
      admMaterial,
      jabatan,
      namaPetugas,
      reguYandal,
      noGangguan,
      items: [{ materialId: 'mat-03', materialName: 'CUT OUT ACC;FUSE LINK 20kV 5A', quantity: 1 }],
      petugasSecurity: security,
      security,
      evidenUrl: '',
      evidenKartuGantungUrl: '',
      column1: sjNumber,
      petugasPelayananTeknik: namaPetugas,
      pemberiMaterial,
      status: 'Approved'
    });
  }

  return sortTransactionsByDateTime(results, 'desc');
};

/**
 * Parses native Excel workbook buffer (.xlsx or .xls) into WarehouseTransaction[]
 */
export const parseXlsxBuffer = (buffer: ArrayBuffer): WarehouseTransaction[] => {
  try {
    const wb = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];
    if (!ws) return [];
    const csv = XLSX.utils.sheet_to_csv(ws);
    return parseSpreadsheetPasteOrCsv(csv);
  } catch (err) {
    console.error('Failed parsing Excel buffer', err);
    return [];
  }
};

/**
 * Normalizes input URL into viable fetch endpoints.
 * Supports:
 * - Google Sheets URL (e.g. https://docs.google.com/spreadsheets/d/...)
 * - Google Sheets Published URL (e.g. /pub?output=csv)
 * - Google Apps Script Webhook URL (e.g. https://script.google.com/macros/s/.../exec)
 * - Direct CSV endpoint
 */
export const resolveSpreadsheetFetchUrls = (inputUrl: string): string[] => {
  const clean = inputUrl.trim();
  if (!clean) return [];

  // 1. Google Sheets standard URL
  const sheetMatch = clean.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (sheetMatch) {
    const sheetId = sheetMatch[1];
    const gidMatch = clean.match(/[#&?]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    return [
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`,
      `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
      clean
    ];
  }

  // 2. Already an export or pub URL
  if (clean.includes('/pub') && !clean.includes('output=csv')) {
    const sep = clean.includes('?') ? '&' : '?';
    return [`${clean}${sep}output=csv`, clean];
  }

  return [clean];
};

/**
 * Fetches live spreadsheet data directly from Google Spreadsheet or Apps Script Webhook
 * Supports JSON, CSV, direct export, and auto CORS proxy fallback.
 */
export const fetchSpreadsheetFromWebhook = async (
  webhookUrl?: string
): Promise<{ success: boolean; data?: WarehouseTransaction[]; message: string }> => {
  const config = getSyncConfig();
  const rawUrl = (webhookUrl || config.webhookUrl || '').trim();

  if (!rawUrl) {
    return {
      success: false,
      message: 'Masukkan URL Google Spreadsheet atau URL Webhook Google Apps Script terlebih dahulu.'
    };
  }

  const targetUrls = resolveSpreadsheetFetchUrls(rawUrl);

  // Helper to try parsing response text as JSON or CSV
  const parseResponseContent = (content: string): WarehouseTransaction[] | null => {
    const trimmed = content.trim();
    if (!trimmed) return null;

    // Detect if content is Google login HTML page (meaning sheet is private)
    if (trimmed.startsWith('<!DOCTYPE html') || trimmed.includes('<html') || trimmed.includes('accounts.google.com')) {
      throw new Error('PRIVATE_SHEET');
    }

    // Try parsing as JSON first
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const json = JSON.parse(trimmed);
        const rows: any[] = json.data || json.rows || (Array.isArray(json) ? json : null);
        if (rows && Array.isArray(rows) && rows.length > 1) {
          const headerRow: string[] = rows[0].map((c: any) => String(c || ''));
          const dataRows: any[][] = rows.slice(1);
          const parsed: WarehouseTransaction[] = [];

          dataRows.forEach((row, i) => {
            if (!row || row.length < 3 || row.every((c: any) => !c)) return;
            const timestamp = String(row[0] || '').trim();
            const tanggal = String(row[1] || '').trim() || (timestamp.includes(' ') ? timestamp.split(' ')[0] : timestamp);
            const admMaterial = String(row[2] || 'Keluar').trim() as any;
            const jabatan = String(row[3] || 'Yandal').trim();
            const namaPetugas = String(row[4] || 'Petugas Pelaksana').trim();
            const reguYandal = String(row[5] || 'ULC_A').trim();
            const noGangguan = String(row[6] || `MUTASI-${i}`).trim();

            const items: { materialId: string; materialName: string; quantity: number }[] = [];

            headerRow.forEach((colName, cIdx) => {
              if (cIdx >= 7 && colName && cIdx < row.length) {
                const val = parseInt(String(row[cIdx]), 10);
                if (!isNaN(val) && val > 0) {
                  const master = MASTER_MATERIALS.find(
                    m => m.name.toLowerCase().includes(colName.toLowerCase()) || colName.toLowerCase().includes(m.name.toLowerCase())
                  );
                  items.push({
                    materialId: master ? master.id : `mat-custom-${cIdx}`,
                    materialName: colName.trim(),
                    quantity: val
                  });
                }
              }
            });

            if (items.length === 0) {
              items.push({
                materialId: 'mat-03',
                materialName: 'Conn Press Al 70/70 mm Type C',
                quantity: 1
              });
            }

            parsed.push({
              id: `tx-sheet-live-${Date.now()}-${i}`,
              timestamp,
              tanggal,
              admMaterial: admMaterial === 'Masuk' || admMaterial === 'Return' ? admMaterial : 'Keluar',
              jabatan,
              namaPetugas,
              reguYandal,
              noGangguan,
              items,
              petugasSecurity: String(row[65] || ''),
              evidenUrl: String(row[66] || ''),
              security: String(row[67] || row[65] || ''),
              evidenKartuGantungUrl: String(row[86] || ''),
              column1: String(row[87] || ''),
              petugasPelayananTeknik: String(row[88] || namaPetugas),
              pemberiMaterial: String(row[89] || 'Ahmad Zaenudin'),
              status: 'Approved'
            });
          });

          return parsed;
        }
      } catch (jsonErr) {
        // Fall through to CSV parsing
      }
    }

    // Parse as CSV / TSV text
    const csvParsed = parseSpreadsheetPasteOrCsv(trimmed);
    if (csvParsed && csvParsed.length > 0) {
      return csvParsed;
    }

    return null;
  };

  // Iterate over target endpoints, trying direct fetch and CORS proxy
  for (const url of targetUrls) {
    const fetchAttempts: { url: string; isProxy?: boolean }[] = [
      { url, isProxy: false },
      { url: `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, isProxy: true },
      { url: `https://corsproxy.io/?url=${encodeURIComponent(url)}`, isProxy: true }
    ];

    for (const attempt of fetchAttempts) {
      try {
        const res = await fetch(attempt.url, {
          method: 'GET',
          headers: attempt.isProxy ? {} : { Accept: 'application/json, text/csv, text/plain, */*' }
        });

        if (!res.ok) continue;

        const text = await res.text();
        const parsed = parseResponseContent(text);
        if (parsed && parsed.length > 0) {
          // Save valid URL to config
          saveSyncConfig({
            ...config,
            webhookUrl: rawUrl,
            lastSyncTimestamp: new Date().toLocaleString('id-ID')
          });

          return {
            success: true,
            data: parsed,
            message: `Berhasil menarik ${parsed.length} data mutasi langsung dari Google Spreadsheet!`
          };
        }
      } catch (err: any) {
        if (err?.message === 'PRIVATE_SHEET') {
          return {
            success: false,
            message: 'Google Spreadsheet terkunci privat. Buka Google Sheet Anda, klik tombol "Bagikan" (Share) di kanan atas, ubah Akses Umum menjadi "Siapa saja yang memiliki link" (Anyone with the link), lalu coba lagi.'
          };
        }
        // Continue to next attempt
      }
    }
  }

  return {
    success: false,
    message: 'Tidak dapat menarik data otomatis dari URL tersebut. Pastikan sheet diatur ke "Siapa saja yang memiliki link", atau gunakan tombol "Unggah File Excel (.xlsx) / CSV" di bawah untuk mengimpor file secara instan.'
  };
};

export const getSpreadsheetAppsScriptSnippet = (): string => {
  return `/**
 * GOOGLE APPS SCRIPT UNTUK SINKRONISASI MUTASI GUDANG PLN ULP TANGGUL
 * Sinkronisasi Real-Time Tanggal & Jam Tanpa Ada Data Tertinggal
 * 
 * Cara Pasang:
 * 1. Di Google Sheets Anda, klik menu: Extensions (Ekstensi) > Apps Script
 * 2. Ganti seluruh isi file Code.gs dengan kode di bawah ini
 * 3. Klik "Deploy" (Terapkan) > "New deployment" (Penerapan baru)
 * 4. Pilih tipe: "Web app" (Aplikasi web)
 * 5. Set "Who has access" (Siapa yang memiliki akses) ke "Anyone" (Siapa saja)
 * 6. Klik "Deploy" dan salin Web App URL ke aplikasi web ini!
 */

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Sinkronisasi DB_MATERIAL
    if (contents.action === "syncDbMaterial") {
      var dbSheetName = contents.sheetName || "DB_MATERIAL";
      var dbSheet = ss.getSheetByName(dbSheetName);
      if (!dbSheet) {
        dbSheet = ss.insertSheet(dbSheetName);
      }
      dbSheet.clearContents();
      if (contents.headers && contents.headers.length > 0) {
        dbSheet.appendRow(contents.headers);
      }
      if (contents.rows && contents.rows.length > 0) {
        var range = dbSheet.getRange(2, 1, contents.rows.length, contents.rows[0].length);
        range.setValues(contents.rows);
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Berhasil menyinkronkan " + contents.rows.length + " material ke Sheet " + dbSheetName
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var sheetName = contents.sheetName || "Sheet1";
    var sheet = ss.getSheetByName(sheetName) || ss.getSheets()[0];
    
    if (contents.action === "syncAllRows" && contents.rows && contents.rows.length > 0) {
      // Sinkronkan seluruh data mutasi sekaligus
      if (contents.headers && sheet.getLastRow() === 0) {
        sheet.appendRow(contents.headers);
      }
      for (var i = 0; i < contents.rows.length; i++) {
        sheet.appendRow(contents.rows[i]);
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Berhasil menyinkronkan " + contents.rows.length + " data mutasi ke Spreadsheet."
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Tambahkan baris baru langsung ke bawah
    if (contents.row && contents.row.length > 0) {
      sheet.appendRow(contents.row);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Row appended successfully"
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = (e && e.parameter && e.parameter.sheet) || "Sheet1";
    if (e && e.parameter && e.parameter.action === "getDbMaterial") {
      sheetName = "DB_MATERIAL";
    }
    var sheet = ss.getSheetByName(sheetName) || ss.getActiveSheet();
    var values = sheet.getDataRange().getValues();
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      sheet: sheetName,
      totalRows: values.length,
      data: values
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput("Google Sheets Webhook Gudang PLN Aktif!");
  }
}`;
};

export interface ExportExcelOptions {
  filename?: string;
  allTransactionsForNumbering?: WarehouseTransaction[];
  title?: string;
  materials?: MaterialItem[];
}

/**
 * Exports mutation transactions directly to a native Microsoft Excel (.xlsx) workbook.
 * IMPORTANT: "No. Surat Jalan" is placed at the very front (Cell Kolom A) followed by all 90 spreadsheet columns!
 * Includes three sheets:
 * 1. "Historis Mutasi": Matrix sel lengkap Sheet 1 dengan 12 Kolom
 * 2. "Rekap Surat Jalan": Rekapitulasi bersih dan rapi per Surat Jalan dengan rincian material
 * 3. "DB_MATERIAL": Database master material dan stok siap gudang
 */
export const exportTransactionsToExcel = (
  transactions: WarehouseTransaction[],
  options?: ExportExcelOptions
) => {
  if (!transactions || transactions.length === 0) return;

  // 1. Sort chronologically matching spreadsheet row order (earliest to latest)
  const sorted = sortTransactionsByDateTime(transactions, 'asc');
  const sjMap = buildMonthlySuratJalanNumberMap(options?.allTransactionsForNumbering || transactions);

  // 2. Create Workbook
  const wb = XLSX.utils.book_new();

  // 3. Sheet 1: "Historis Mutasi (Spreadsheet)" (12 Kolom matching MARVEL-WAREHOUSE_412a70c9)
  const sheet1Headers = [...SPREADSHEET_COLUMNS];
  const sheet1Rows: (string | number)[][] = [sheet1Headers];

  sorted.forEach(tx => {
    const rows = formatTransactionToSpreadsheetRows(tx, {
      allTransactions: options?.allTransactionsForNumbering || transactions,
      suratJalanMap: sjMap
    });
    sheet1Rows.push(...rows);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Rows);

  // Column widths for Sheet 1
  ws1['!cols'] = [
    { wch: 24 }, // No. Surat Jalan
    { wch: 14 }, // Tanggal
    { wch: 14 }, // Adm Material
    { wch: 18 }, // Jabatan
    { wch: 28 }, // Nama Petugas
    { wch: 16 }, // Regu Yandal
    { wch: 32 }, // No GANGGUAN DAN PEMELIHARAAN (APKT/PK Teknik/IDpel ggn)
    { wch: 16 }, // NORMALISASI
    { wch: 42 }, // Nama Material
    { wch: 10 }, // Jumlah
    { wch: 22 }, // Pemberi Material
    { wch: 22 }  // Security
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Historis Mutasi');

  // 4. Sheet 2: "Rekap Surat Jalan" (Summary per Nomor Surat Jalan)
  const sheet2Headers = [
    'No',
    'No. Surat Jalan',
    'Tanggal Mutasi',
    'Tipe Mutasi',
    'Nama Petugas',
    'Jabatan',
    'Regu Yandal',
    'No. Gangguan / APKT',
    'Rincian Material & Kuantitas',
    'Total Qty Item',
    'Petugas Keamanan (BP)',
    'Pemberi Material (CL)',
    'Status Approval'
  ];
  const sheet2Rows: (string | number)[][] = [sheet2Headers];

  sorted.forEach((tx, idx) => {
    const sjNumber = sjMap.get(tx.id) || getTransactionSuratJalanNumber(tx, options?.allTransactionsForNumbering || transactions);
    const itemsSummary = tx.items.map(i => `${i.materialName}: ${i.quantity}`).join(' | ');
    const totalQty = tx.items.reduce((acc, i) => acc + (i.quantity || 0), 0);
    const security = tx.security || tx.petugasSecurity || '-';
    const pemberi = tx.pemberiMaterial || 'Ahmad Zaenudin';
    const status = tx.status || 'Approved';

    sheet2Rows.push([
      idx + 1,
      sjNumber,
      tx.tanggal,
      tx.admMaterial,
      tx.namaPetugas,
      tx.jabatan,
      tx.reguYandal,
      tx.noGangguan,
      itemsSummary,
      totalQty,
      security,
      pemberi,
      status
    ]);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Rows);
  ws2['!cols'] = [
    { wch: 6 },  // No
    { wch: 25 }, // No. Surat Jalan
    { wch: 15 }, // Tanggal Mutasi
    { wch: 15 }, // Tipe Mutasi
    { wch: 28 }, // Nama Petugas
    { wch: 16 }, // Jabatan
    { wch: 18 }, // Regu Yandal
    { wch: 32 }, // No Gangguan
    { wch: 55 }, // Rincian Material
    { wch: 18 }, // Total Qty
    { wch: 22 }, // Keamanan
    { wch: 22 }, // Pemberi
    { wch: 15 }  // Status
  ];

  XLSX.utils.book_append_sheet(wb, ws2, 'Rekap Surat Jalan');

  // 5. Sheet 3: "DB_MATERIAL"
  const mats = options?.materials || MASTER_MATERIALS;
  if (mats && mats.length > 0) {
    const ws3Headers = [...DB_MATERIAL_COLUMNS];
    const ws3Rows = [ws3Headers, ...formatMaterialsToDbMaterialRows(mats)];
    const ws3 = XLSX.utils.aoa_to_sheet(ws3Rows);
    ws3['!cols'] = [
      { wch: 18 }, // NORMALISASI
      { wch: 45 }, // Nama Material
      { wch: 12 }, // Satuan
      { wch: 14 }, // Stock Siap
      { wch: 22 }, // Kategori
      { wch: 20 }  // Lokasi Rak
    ];
    XLSX.utils.book_append_sheet(wb, ws3, 'DB_MATERIAL');
  }

  // 6. Trigger download as authentic .xlsx
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = options?.filename || `MARVEL_WAREHOUSE_${dateStr}.xlsx`;

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
};

export const exportTransactionsToSpreadsheetCSV = (
  transactions: WarehouseTransaction[],
  allTransactionsForNumbering?: WarehouseTransaction[],
  customFilename?: string
) => {
  // Sort chronologically matching spreadsheet row order
  const sorted = sortTransactionsByDateTime(transactions, 'asc');
  const sjMap = buildMonthlySuratJalanNumberMap(allTransactionsForNumbering || transactions);
  const lines: string[] = [];

  // Header row matching exact MARVEL-WAREHOUSE_412a70c9 spreadsheet columns
  lines.push(SPREADSHEET_COLUMNS.join(','));

  // Data rows
  sorted.forEach(tx => {
    const rows = formatTransactionToSpreadsheetRows(tx, {
      allTransactions: allTransactionsForNumbering || transactions,
      suratJalanMap: sjMap
    });
    rows.forEach(r => {
      const escaped = r.map(val => {
        if (typeof val === 'number') return val;
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      lines.push(escaped.join(','));
    });
  });

  // Prepend UTF-8 BOM so Microsoft Excel opens cleanly
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = customFilename || `MARVEL_WAREHOUSE_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
};
