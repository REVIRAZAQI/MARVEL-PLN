import { MASTER_MATERIALS } from '../data/materialsMaster';
import { INITIAL_TRANSACTIONS } from '../data/initialTransactions';
import { MaterialItem, WarehouseTransaction, StockCardEntry, StockSummaryStats } from '../types/warehouse';
import { generateNextMonthlySuratJalan } from './suratJalanHelper';
import { sendTransactionToSpreadsheet } from './spreadsheetSync';

const MATERIALS_KEY = 'pln_warehouse_materials_v4';
const TRANSACTIONS_KEY = 'pln_warehouse_transactions_v4';

export const recalculateMaterialStock = (
  materials: MaterialItem[],
  transactions: WarehouseTransaction[]
): MaterialItem[] => {
  return materials.map(mat => {
    let inCount = 0;
    let outCount = 0;
    let returnCount = 0;

    for (const tx of transactions) {
      // Only approved transactions (or legacy undefined) mutate physical stock
      if (tx.status === 'Rejected' || tx.status === 'Pending') {
        continue;
      }

      for (const item of tx.items) {
        if (item.materialId === mat.id || item.materialName.toLowerCase() === mat.name.toLowerCase()) {
          const qty = Number(item.quantity) || 0;
          if (tx.admMaterial === 'Masuk') {
            inCount += qty;
          } else if (tx.admMaterial === 'Return') {
            returnCount += qty;
          } else {
            // Default or Keluar
            outCount += qty;
          }
        }
      }
    }

    const currentStock = Math.max(0, mat.initialStock + inCount + returnCount - outCount);

    return {
      ...mat,
      totalIn: inCount,
      totalOut: outCount,
      totalReturn: returnCount,
      currentStock,
      lastUpdated: new Date().toISOString()
    };
  });
};

export const getStoredMaterials = (): MaterialItem[] => {
  try {
    const raw = localStorage.getItem(MATERIALS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const txs = getStoredTransactions();
      return recalculateMaterialStock(parsed, txs);
    }
  } catch (err) {
    console.error('Failed reading materials from localStorage', err);
  }

  // Fallback to master
  const initialItems: MaterialItem[] = MASTER_MATERIALS.map(m => ({
    id: m.id,
    code: m.code,
    name: m.name,
    category: m.category,
    unit: m.unit,
    initialStock: m.initialStock,
    totalIn: 0,
    totalOut: 0,
    totalReturn: 0,
    currentStock: m.initialStock,
    minSafetyStock: m.minSafetyStock,
    rackLocation: m.rackLocation,
    lastUpdated: new Date().toISOString()
  }));

  const withTxs = recalculateMaterialStock(initialItems, INITIAL_TRANSACTIONS);
  saveMaterials(withTxs);
  return withTxs;
};

const MOCKUP_INCOMING_TX: WarehouseTransaction = {
  id: 'tx-in-mockup-189',
  timestamp: '19/10/2026 09:30:00',
  tanggal: '19/10/2026',
  admMaterial: 'Masuk',
  jabatan: 'Admin Gudang UP3',
  namaPetugas: 'RAMA',
  petugasSecurity: 'SEPTIAN DWI CAHYO',
  security: 'SEPTIAN DWI CAHYO',
  reguYandal: 'LOGISTIK_UP3',
  noGangguan: '189/X/AP/PERBK/JBK/2026',
  column1: '189/X/AP/PERBK/JBK/2026',
  keterangan: 'Penerimaan Material UP3 (BAPB 189/X/AP/PERBK/JBK/2026)',
  status: 'Approved',
  createdByRole: 'Admin Gudang',
  items: [
    {
      materialId: 'mat-kwh-epr',
      materialName: 'MTR;kWH E-PR;1P;230V;5-60A;1;;2W',
      quantity: 100
    },
    {
      materialId: 'mat-kwh-e',
      materialName: 'MTR;kWH E;;1P;230V;5-60A;1;;2W',
      quantity: 100
    }
  ]
};

export const getStoredTransactions = (): WarehouseTransaction[] => {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (raw) {
      const parsed: WarehouseTransaction[] = JSON.parse(raw);
      if (!parsed.some(t => t.noGangguan === '189/X/AP/PERBK/JBK/2026' || t.column1 === '189/X/AP/PERBK/JBK/2026')) {
        parsed.unshift(MOCKUP_INCOMING_TX);
        localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch (err) {
    console.error('Failed reading transactions from localStorage', err);
  }
  const defaultList = [MOCKUP_INCOMING_TX, ...INITIAL_TRANSACTIONS];
  saveTransactions(defaultList);
  return defaultList;
};

export const saveMaterials = (materials: MaterialItem[]) => {
  try {
    localStorage.setItem(MATERIALS_KEY, JSON.stringify(materials));
    window.dispatchEvent(new CustomEvent('pln-stock-updated'));
  } catch (err) {
    console.error('Failed to save materials', err);
  }
};

export const saveTransactions = (transactions: WarehouseTransaction[]) => {
  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    window.dispatchEvent(new CustomEvent('pln-stock-updated'));
  } catch (err) {
    console.error('Failed to save transactions', err);
  }
};

/**
 * Merges imported transactions from spreadsheet into local store,
 * avoiding duplicates by checking timestamp and noGangguan,
 * recalculates physical stock, and broadcasts update.
 */
export const mergeSpreadsheetTransactions = (
  importedTxs: WarehouseTransaction[]
): { addedCount: number; totalCount: number } => {
  const existing = getStoredTransactions();
  const materials = getStoredMaterials();

  const keyMap = new Set<string>();
  existing.forEach(t => {
    keyMap.add(`${t.timestamp}_${t.noGangguan}_${t.namaPetugas}`);
  });

  const newRecords: WarehouseTransaction[] = [];
  importedTxs.forEach(imp => {
    const key = `${imp.timestamp}_${imp.noGangguan}_${imp.namaPetugas}`;
    if (!keyMap.has(key)) {
      keyMap.add(key);
      newRecords.push(imp);
    }
  });

  if (newRecords.length > 0) {
    const merged = [...newRecords, ...existing];
    saveTransactions(merged);
    const updatedMaterials = recalculateMaterialStock(materials, merged);
    saveMaterials(updatedMaterials);
    return { addedCount: newRecords.length, totalCount: merged.length };
  }

  return { addedCount: 0, totalCount: existing.length };
};

export const addWarehouseTransaction = (tx: Omit<WarehouseTransaction, 'id' | 'timestamp'>) => {
  const transactions = getStoredTransactions();
  const materials = getStoredMaterials();

  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const newTx: WarehouseTransaction = {
    ...tx,
    id: `tx-${Date.now()}`,
    timestamp: `${dateStr} ${timeStr}`,
    tanggal: tx.tanggal || dateStr,
    status: tx.status || (tx.createdByRole === 'Petugas Gudang' ? 'Pending' : 'Approved')
  };

  const updatedTxs = [newTx, ...transactions];
  saveTransactions(updatedTxs);

  const updatedMaterials = recalculateMaterialStock(materials, updatedTxs);
  saveMaterials(updatedMaterials);

  return newTx;
};

export const approveTransaction = (
  transactionId: string,
  approverName: string,
  approverRole: 'MULP' | 'Admin Gudang',
  note?: string
): { updatedTx: WarehouseTransaction | null; officialSjNumber: string } => {
  const transactions = getStoredTransactions();
  const materials = getStoredMaterials();
  const now = new Date().toLocaleString('id-ID');
  let generatedSj = '';
  let resultTx: WarehouseTransaction | null = null;

  const updatedTxs = transactions.map(t => {
    if (t.id === transactionId) {
      // Generate official monthly Surat Jalan if not already present
      const officialSj =
        t.column1 && t.column1.includes('/SJ/')
          ? t.column1.trim()
          : generateNextMonthlySuratJalan(t, transactions);

      generatedSj = officialSj;

      const updated: WarehouseTransaction = {
        ...t,
        status: 'Approved' as const,
        column1: officialSj,
        approvedAt: now,
        approvalNote: note || t.approvalNote || '',
        approvedByAdmin: approverRole === 'Admin Gudang' ? approverName : t.approvedByAdmin || approverName,
        approvedByMULP: approverRole === 'MULP' ? approverName : t.approvedByMULP
      };

      resultTx = updated;
      return updated;
    }
    return t;
  });

  saveTransactions(updatedTxs);
  const updatedMaterials = recalculateMaterialStock(materials, updatedTxs);
  saveMaterials(updatedMaterials);

  if (resultTx) {
    sendTransactionToSpreadsheet(resultTx).catch(err => {
      console.warn('Auto spreadsheet sync on approval failed:', err);
    });
  }

  return { updatedTx: resultTx, officialSjNumber: generatedSj };
};

export const rejectTransaction = (
  transactionId: string,
  rejecterName: string,
  rejecterRole: 'MULP' | 'Admin Gudang',
  note: string
) => {
  const transactions = getStoredTransactions();
  const materials = getStoredMaterials();
  const now = new Date().toLocaleString('id-ID');

  const updatedTxs = transactions.map(t => {
    if (t.id === transactionId) {
      return {
        ...t,
        status: 'Rejected' as const,
        approvedAt: now,
        approvalNote: note || 'Ditolak',
        approvedByAdmin: rejecterRole === 'Admin Gudang' ? rejecterName : t.approvedByAdmin,
        approvedByMULP: rejecterRole === 'MULP' ? rejecterName : t.approvedByMULP
      };
    }
    return t;
  });

  saveTransactions(updatedTxs);
  const updatedMaterials = recalculateMaterialStock(materials, updatedTxs);
  saveMaterials(updatedMaterials);
};

export const updateMaterialConfig = (materialId: string, updates: Partial<MaterialItem>) => {
  const materials = getStoredMaterials();
  const updated = materials.map(m => (m.id === materialId ? { ...m, ...updates } : m));
  const txs = getStoredTransactions();
  const final = recalculateMaterialStock(updated, txs);
  saveMaterials(final);
  return final;
};

export const updateWarehouseTransaction = (
  transactionId: string,
  updates: Partial<WarehouseTransaction>
): WarehouseTransaction | null => {
  const transactions = getStoredTransactions();
  const materials = getStoredMaterials();

  let updatedTx: WarehouseTransaction | null = null;
  const updatedTxs = transactions.map(t => {
    if (t.id === transactionId) {
      updatedTx = { ...t, ...updates };
      return updatedTx;
    }
    return t;
  });

  if (!updatedTx) return null;

  saveTransactions(updatedTxs);
  const updatedMaterials = recalculateMaterialStock(materials, updatedTxs);
  saveMaterials(updatedMaterials);

  return updatedTx;
};

export const deleteWarehouseTransaction = (transactionId: string): boolean => {
  const transactions = getStoredTransactions();
  const materials = getStoredMaterials();

  const filtered = transactions.filter(t => t.id !== transactionId);
  if (filtered.length === transactions.length) return false;

  saveTransactions(filtered);
  const updatedMaterials = recalculateMaterialStock(materials, filtered);
  saveMaterials(updatedMaterials);

  return true;
};


export const resetWarehouseData = () => {
  localStorage.removeItem(MATERIALS_KEY);
  localStorage.removeItem(TRANSACTIONS_KEY);
  window.dispatchEvent(new CustomEvent('pln-stock-updated'));
};

export const getStockCardForMaterial = (materialId: string): StockCardEntry[] => {
  const materials = getStoredMaterials();
  const target = materials.find(m => m.id === materialId);
  if (!target) return [];

  const transactions = getStoredTransactions();

  // Sort ascending by timestamp to calculate running balance
  const sorted = [...transactions].reverse();

  let runningSaldo = target.initialStock;
  const entries: StockCardEntry[] = [
    {
      id: `init-${target.id}`,
      tanggal: '01/01/2023',
      noReferensi: 'SALDO-AWAL',
      keterangan: 'Saldo Awal Tahun Buku Gudang PLN',
      petugas: 'Logistik PLN',
      regu: 'Gudang ULP',
      type: 'Masuk',
      masuk: target.initialStock,
      keluar: 0,
      saldo: runningSaldo
    }
  ];

  for (const tx of sorted) {
    const item = tx.items.find(i => i.materialId === target.id || i.materialName.toLowerCase() === target.name.toLowerCase());
    if (item && item.quantity > 0) {
      let masuk = 0;
      let keluar = 0;

      if (tx.admMaterial === 'Masuk') {
        masuk = item.quantity;
        runningSaldo += masuk;
      } else if (tx.admMaterial === 'Return') {
        masuk = item.quantity;
        runningSaldo += masuk;
      } else {
        keluar = item.quantity;
        runningSaldo = Math.max(0, runningSaldo - keluar);
      }

      entries.push({
        id: `entry-${tx.id}`,
        tanggal: tx.tanggal,
        noReferensi: tx.noGangguan || '-',
        keterangan: `${tx.admMaterial}: ${tx.jabatan || 'Yandal'} (${tx.reguYandal || '-'})`,
        petugas: tx.namaPetugas || tx.petugasPelayananTeknik || '-',
        regu: tx.reguYandal || '-',
        type: tx.admMaterial,
        masuk,
        keluar,
        saldo: runningSaldo,
        evidenUrl: tx.evidenUrl || tx.evidenKartuGantungUrl
      });
    }
  }

  // Return descending for UI presentation (latest first)
  return entries.reverse();
};

export const calculateSummaryStats = (materials: MaterialItem[], transactions: WarehouseTransaction[]): StockSummaryStats => {
  const totalPhysicalItems = materials.reduce((acc, m) => acc + m.currentStock, 0);
  let critical = 0;
  let warning = 0;
  let safe = 0;

  for (const m of materials) {
    if (m.currentStock <= 0) {
      critical++;
    } else if (m.currentStock <= m.minSafetyStock) {
      warning++;
    } else {
      safe++;
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  let keluarToday = 0;
  let masukToday = 0;

  for (const tx of transactions) {
    if (tx.timestamp && tx.timestamp.includes(today)) {
      for (const item of tx.items) {
        if (tx.admMaterial === 'Keluar') keluarToday += item.quantity;
        if (tx.admMaterial === 'Masuk') masukToday += item.quantity;
      }
    }
  }

  return {
    totalMaterials: materials.length,
    totalPhysicalItems,
    totalTransactions: transactions.length,
    criticalStockCount: critical,
    warningStockCount: warning,
    safeStockCount: safe,
    totalKeluarToday: keluarToday,
    totalMasukToday: masukToday
  };
};

/**
 * Deletes transactions by their IDs (supports single or collective delete),
 * recalculates physical material stock, persists changes, and broadcasts update.
 */
export const deleteWarehouseTransactions = (
  transactionIds: string[]
): { success: boolean; deletedCount: number; remainingCount: number } => {
  if (!transactionIds || transactionIds.length === 0) {
    return { success: false, deletedCount: 0, remainingCount: 0 };
  }

  const idsSet = new Set(transactionIds);
  const currentTxs = getStoredTransactions();
  const remainingTxs = currentTxs.filter(tx => !idsSet.has(tx.id));
  const deletedCount = currentTxs.length - remainingTxs.length;

  saveTransactions(remainingTxs);

  // Recalculate material physical stock
  const materials = getStoredMaterials();
  const updatedMaterials = recalculateMaterialStock(materials, remainingTxs);
  saveMaterials(updatedMaterials);

  return {
    success: true,
    deletedCount,
    remainingCount: remainingTxs.length
  };
};
