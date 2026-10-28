export type MaterialCategory =
  | 'Konektor & Jointing'
  | 'Sepatu Kabel'
  | 'Fuse Link'
  | 'NH Fuse & Holder'
  | 'Konstruksi & Isolasi'
  | 'Kabel & SR'
  | 'KWH & MCB';

export type TransactionType = 'Keluar' | 'Masuk' | 'Return';

export interface MaterialItem {
  id: string;
  code: string;
  name: string;
  category: MaterialCategory;
  unit: string;
  initialStock: number;
  totalIn: number;
  totalOut: number;
  totalReturn: number;
  currentStock: number;
  minSafetyStock: number;
  rackLocation: string;
  lastUpdated: string;
}

export interface MaterialQuantity {
  materialId: string;
  materialName: string;
  quantity: number;
  normalisasi?: string;
  unit?: string;
}

export type UserRole = 'MULP' | 'Admin Gudang' | 'Petugas Gudang';

export interface AppUser {
  id: string;
  name: string;
  username?: string;
  role: UserRole;
  title: string;
  nip: string;
  petugas?: string;
  password?: string;
  permissions?: string[];
  signatureUrl?: string;
}

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

export interface WarehouseTransaction {
  id: string;
  timestamp: string;
  tanggal: string;
  admMaterial: TransactionType;
  jabatan: string;
  namaPetugas: string;
  reguYandal: string;
  noGangguan: string; // APKT/PK Teknik/IDpel ggn/Keperluan
  items: MaterialQuantity[];
  petugasSecurity?: string; // Cell BN
  evidenUrl?: string; // Cell BO
  security?: string; // Cell BP (Keamanan untuk Surat Jalan)
  evidenKartuGantungUrl?: string; // Cell CI
  column1?: string; // Cell CJ
  petugasPelayananTeknik?: string; // Cell CK
  pemberiMaterial?: string; // Cell CL (Pemberi untuk Surat Jalan)
  keterangan?: string;
  status?: ApprovalStatus;
  approvedByAdmin?: string;
  approvedByMULP?: string;
  approvalNote?: string;
  approvedAt?: string;
  createdByRole?: UserRole;
}


export interface StockCardEntry {
  id: string;
  tanggal: string;
  noReferensi: string;
  keterangan: string;
  petugas: string;
  regu: string;
  type: TransactionType;
  masuk: number;
  keluar: number;
  saldo: number;
  evidenUrl?: string;
}

export interface SpreadsheetSyncConfig {
  webhookUrl: string;
  sheetName: string;
  dbMaterialSheetName?: string;
  autoSync: boolean;
  lastSyncTimestamp?: string;
  lastDbMaterialSyncTimestamp?: string;
}

export interface SyncResult {
  success: boolean;
  message: string;
  rowPreview?: (string | number)[];
}

export interface StockSummaryStats {
  totalMaterials: number;
  totalPhysicalItems: number;
  totalTransactions: number;
  criticalStockCount: number;
  warningStockCount: number;
  safeStockCount: number;
  totalKeluarToday: number;
  totalMasukToday: number;
}

export interface SuratJalanItem {
  no?: number;
  normalisasi?: string;
  namaBarang: string;
  keluar?: number;
  masuk?: number;
  pasangBaru: number;
  perubahanDaya: number;
  jumlah: number;
  satuan: string;
  isNonAsg?: boolean;
}

export interface SuratJalanData {
  id?: string;
  transactionId?: string;
  nomorSurat: string;
  tanggal: string; // e.g. "20 Oktober 2026"
  namaPetugas: string;
  namaVendor?: string;
  kendaraan: string;
  peruntukan: string;
  noSpk: string;
  itemsAsg: SuratJalanItem[];
  itemsNonAsg?: SuratJalanItem[];
  items?: SuratJalanItem[];
  penerima: string;
  keamanan: string;
  pemberi: string;
  approvedByAdmin?: string;
  approvedByMULP?: string;
}

