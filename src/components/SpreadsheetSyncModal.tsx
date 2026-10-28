import React, { useState } from 'react';
import {
  getSyncConfig,
  saveSyncConfig,
  getSpreadsheetAppsScriptSnippet,
  exportTransactionsToSpreadsheetCSV,
  sendTransactionToSpreadsheet,
  syncMaterialsToDbMaterialSheet,
  fetchMaterialsFromDbMaterialSheet,
  exportDbMaterialToExcel,
  parseDbMaterialPasteOrRows,
  syncAllTransactionsToSpreadsheet
} from '../utils/spreadsheetSync';
import { saveMaterials } from '../utils/inventoryStore';
import { useModalScrollLock } from '../utils/modalScrollLock';
import { WarehouseTransaction, MaterialItem } from '../types/warehouse';
import {
  X,
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  Send,
  ShieldCheck,
  HelpCircle,
  Database,
  RefreshCw,
  Layers,
  ClipboardPaste,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface SpreadsheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: WarehouseTransaction[];
  materials?: MaterialItem[];
  onMaterialsUpdated?: () => void;
  initialTab?: 'sheet1' | 'db_material';
}

export const SpreadsheetSyncModal: React.FC<SpreadsheetSyncModalProps> = ({
  isOpen,
  onClose,
  transactions,
  materials = [],
  onMaterialsUpdated,
  initialTab = 'sheet1'
}) => {
  const [activeTab, setActiveTab] = useState<'sheet1' | 'db_material'>(initialTab);
  const [config, setConfig] = useState(getSyncConfig);
  const [copied, setCopied] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // DB_MATERIAL Sync state
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [isPullingDb, setIsPullingDb] = useState(false);
  const [dbFeedback, setDbFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Paste DB_MATERIAL modal inside
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const [pasteContent, setPasteContent] = useState('');

  // Lock window scroll so modal appears directly without scroll up/down
  useModalScrollLock(isOpen);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSyncConfig(config);
    setTestStatus('Pengaturan konfigurasi Google Spreadsheet berhasil disimpan.');
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(getSpreadsheetAppsScriptSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Sheet 1: Test connection ping
  const handleTestPing = async () => {
    if (!config.webhookUrl) {
      setTestStatus('Harap masukkan URL Webhook Apps Script terlebih dahulu.');
      return;
    }

    setIsTesting(true);
    setTestStatus(null);

    const dummyTx: WarehouseTransaction = {
      id: `test-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      tanggal: new Date().toLocaleDateString('id-ID'),
      admMaterial: 'Keluar',
      status: 'Approved',
      jabatan: 'Staff Teknik',
      namaPetugas: 'Uji Koneksi Webhook',
      reguYandal: 'PLN',
      noGangguan: 'TEST KONEKSI SINKRONISASI WEB',
      items: [{ materialId: 'mat-01', materialName: 'Conn Press Al 150/150 mm Type H', quantity: 1 }],
      petugasSecurity: 'Security ULP'
    };

    saveSyncConfig(config);
    const res = await sendTransactionToSpreadsheet(dummyTx);
    setIsTesting(false);
    setTestStatus(res.message);
  };

  // Sheet 2: Sync materials & ready stock balances to Google Sheets Sheet "DB_MATERIAL"
  const handleSyncDbMaterialToSheet = async () => {
    if (!config.webhookUrl) {
      setDbFeedback({
        type: 'error',
        message: 'Masukkan URL Webhook Google Apps Script terlebih dahulu sebelum melakukan sinkronisasi.'
      });
      return;
    }

    setIsSyncingDb(true);
    setDbFeedback(null);
    try {
      saveSyncConfig(config);
      const res = await syncMaterialsToDbMaterialSheet(materials);
      if (res.success) {
        setDbFeedback({
          type: 'success',
          message: res.message
        });
        setConfig(getSyncConfig());
      } else {
        setDbFeedback({
          type: 'error',
          message: res.message
        });
      }
    } catch (err: any) {
      setDbFeedback({
        type: 'error',
        message: `Gagal menyinkronkan: ${err?.message || 'Koneksi gagal'}`
      });
    } finally {
      setIsSyncingDb(false);
    }
  };

  // Sheet 2: Pull latest material catalog and stock balances from Sheet "DB_MATERIAL"
  const handlePullDbMaterialFromSheet = async () => {
    if (!config.webhookUrl) {
      setDbFeedback({
        type: 'error',
        message: 'Masukkan URL Webhook Google Apps Script terlebih dahulu.'
      });
      return;
    }

    setIsPullingDb(true);
    setDbFeedback(null);
    try {
      saveSyncConfig(config);
      const res = await fetchMaterialsFromDbMaterialSheet();
      if (res.success && res.data && res.data.length > 0) {
        saveMaterials(res.data);
        if (onMaterialsUpdated) onMaterialsUpdated();
        setDbFeedback({
          type: 'success',
          message: res.message
        });
      } else {
        setDbFeedback({
          type: 'error',
          message: res.message
        });
      }
    } catch (err: any) {
      setDbFeedback({
        type: 'error',
        message: `Gagal menarik data: ${err?.message || 'Koneksi gagal'}`
      });
    } finally {
      setIsPullingDb(false);
    }
  };

  // Sheet 2: Process pasted cells from Google Sheets
  const handleApplyPastedRows = () => {
    if (!pasteContent.trim()) {
      setDbFeedback({
        type: 'error',
        message: 'Kolom tempel masih kosong. Salin baris dari Google Sheet DB_MATERIAL lalu tempel di sini.'
      });
      return;
    }

    try {
      const { items, updatedCount, createdCount } = parseDbMaterialPasteOrRows(pasteContent, materials);
      saveMaterials(items);
      if (onMaterialsUpdated) onMaterialsUpdated();

      setDbFeedback({
        type: 'success',
        message: `Berhasil memproses data: ${updatedCount} material diperbarui saldonya, ${createdCount} material baru ditambahkan.`
      });
      setIsPasteOpen(false);
      setPasteContent('');
    } catch (err: any) {
      setDbFeedback({
        type: 'error',
        message: `Gagal membaca format: ${err?.message || 'Format tidak sesuai'}`
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden m-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl shadow-xs">
              <FileSpreadsheet className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                Integrasi & Sinkronisasi Google Spreadsheet
              </h3>
              <p className="text-xs text-slate-500">
                Sinkronkan Sheet 1 (Mutasi Transaksi) dan Sheet 2 (DB_MATERIAL Daftar & Saldo)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-3 bg-slate-50/50 border-b border-slate-200 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('sheet1')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sheet1'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sheet 1: Mutasi Material</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('db_material')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'db_material'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Sheet 2: DB_MATERIAL (Daftar & Saldo)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* Status banner */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              config.webhookUrl
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-700" />
              <div>
                <div className="font-bold text-xs sm:text-sm">
                  {config.webhookUrl
                    ? 'Sinkronisasi Otomatis Google Sheets Terhubung'
                    : 'Belum Terhubung ke Webhook Google Sheets'}
                </div>
                <div className="text-[11px] opacity-90 mt-0.5">
                  {config.webhookUrl
                    ? activeTab === 'sheet1'
                      ? `Terakhir sinkron Mutasi: ${config.lastSyncTimestamp || 'Belum ada transaksi baru'}`
                      : `Terakhir sinkron DB_MATERIAL: ${config.lastDbMaterialSyncTimestamp || 'Belum disinkronkan hari ini'}`
                    : 'Data tersimpan di database lokal web. Pasang Webhook Apps Script untuk sinkronisasi cloud real-time.'}
                </div>
              </div>
            </div>
          </div>

          {/* Webhook URL Input (Shared) */}
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Google Apps Script Web App URL *
              </label>
              <input
                type="url"
                value={config.webhookUrl}
                onChange={e => setConfig({ ...config, webhookUrl: e.target.value })}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-xs text-slate-800"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Satu Web App URL ini otomatis melayani kedua sheet (Sheet Mutasi dan Sheet DB_MATERIAL).
              </p>
            </div>

            {/* TAB 1: SHEET 1 (Mutasi Transaksi) */}
            {activeTab === 'sheet1' && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Nama Tab Sheet Mutasi (Sheet 1)
                    </label>
                    <input
                      type="text"
                      value={config.sheetName}
                      onChange={e => setConfig({ ...config, sheetName: e.target.value })}
                      placeholder="Sheet1 atau Form Responses 1"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-xs"
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 px-3 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all cursor-pointer shadow-xs"
                    >
                      Simpan Konfigurasi
                    </button>
                    <button
                      type="button"
                      onClick={handleTestPing}
                      disabled={isTesting}
                      className="py-2 px-3 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isTesting ? 'Menguji...' : 'Kirim Uji'}</span>
                    </button>
                  </div>
                </div>

                {testStatus && (
                  <div className="p-3 rounded-xl bg-slate-100 text-slate-800 font-medium text-[11px] border border-slate-200">
                    {testStatus}
                  </div>
                )}

                {/* CSV Download for Sheet 1 */}
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">
                      Export Data Mutasi Transaksi (.CSV)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Berisi data 12 kolom standar MARVEL-WAREHOUSE lengkap dengan nomor surat jalan.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => exportTransactionsToSpreadsheetCSV(transactions)}
                    className="px-3.5 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Download CSV Mutasi</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: SHEET 2 (DB_MATERIAL Daftar Material & Saldo) */}
            {activeTab === 'db_material' && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Nama Tab Sheet 2 (Database Material & Saldo)
                    </label>
                    <input
                      type="text"
                      value={config.dbMaterialSheetName || 'DB_MATERIAL'}
                      onChange={e => setConfig({ ...config, dbMaterialSheetName: e.target.value })}
                      placeholder="DB_MATERIAL"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                    />
                    <p className="text-[10.5px] text-slate-500 mt-1">
                      Standar: <strong>DB_MATERIAL</strong> (Sheet 2)
                    </p>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 px-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer shadow-xs"
                    >
                      Simpan Nama Sheet
                    </button>
                  </div>
                </div>

                {/* Direct Action Buttons for DB_MATERIAL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Push / Send to Google Sheets */}
                  <button
                    type="button"
                    onClick={handleSyncDbMaterialToSheet}
                    disabled={isSyncingDb}
                    className="p-3.5 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-left transition-all cursor-pointer group flex items-start gap-3"
                  >
                    <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 group-hover:scale-105 transition-transform">
                      <RefreshCw className={`w-4 h-4 ${isSyncingDb ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-blue-950">
                        {isSyncingDb ? 'Menyinkronkan...' : 'Kirim Saldo ke DB_MATERIAL'}
                      </div>
                      <div className="text-[10.5px] text-blue-700 mt-0.5">
                        Kirim seluruh {materials.length} material & saldo siap saat ini ke Sheet 2 spreadsheet.
                      </div>
                    </div>
                  </button>

                  {/* Pull / Fetch from Google Sheets */}
                  <button
                    type="button"
                    onClick={handlePullDbMaterialFromSheet}
                    disabled={isPullingDb}
                    className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-left transition-all cursor-pointer group flex items-start gap-3"
                  >
                    <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 group-hover:scale-105 transition-transform">
                      <Download className={`w-4 h-4 ${isPullingDb ? 'animate-bounce' : ''}`} />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-emerald-950">
                        {isPullingDb ? 'Menarik Data...' : 'Tarik Data dari DB_MATERIAL'}
                      </div>
                      <div className="text-[10.5px] text-emerald-700 mt-0.5">
                        Ambil pembaharuan daftar material & saldo dari Sheet 2 Google Sheets ke aplikasi.
                      </div>
                    </div>
                  </button>
                </div>

                {/* Feedback for DB_MATERIAL */}
                {dbFeedback && (
                  <div
                    className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
                      dbFeedback.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    {dbFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{dbFeedback.message}</span>
                  </div>
                )}

                {/* Secondary tools: Export Excel & Paste from Clipboard */}
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        Download Excel Master DB_MATERIAL (.xlsx)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Ekspor file Excel lengkap dengan format 6 kolom standar Sheet 2.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => exportDbMaterialToExcel(materials)}
                      className="px-3.5 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      <span>Download .XLSX</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        Tempel Langsung Data dari Google Sheet DB_MATERIAL
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Salin sel dari Google Sheet DB_MATERIAL dan tempel untuk update instan tanpa webhook.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPasteOpen(true)}
                      className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      <span>Tempel Data Saldo</span>
                    </button>
                  </div>
                </div>

                {/* Quick Paste Modal / Box */}
                {isPasteOpen && (
                  <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-blue-950 flex items-center gap-1.5">
                        <ClipboardPaste className="w-4 h-4 text-blue-600" />
                        Tempel Kolom dari Sheet DB_MATERIAL
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsPasteOpen(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={pasteContent}
                      onChange={e => setPasteContent(e.target.value)}
                      placeholder="Salin baris dari Google Sheet (NORMALISASI, Nama Material, Satuan, Stock Siap...) lalu tempel di sini..."
                      className="w-full p-2.5 bg-white border border-blue-200 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPasteOpen(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyPastedRows}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                      >
                        Terapkan ke Database
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>

          {/* Tutorial Apps Script */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <HelpCircle className="w-4 h-4 text-sky-600" />
              <span>Kode Google Apps Script Lengkap (Mendukung Sheet 1 & Sheet 2)</span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Kode Apps Script di bawah ini secara otomatis mengenali request untuk <strong>Sheet 1 (Mutasi Transaksi)</strong> dan <strong>Sheet 2 (DB_MATERIAL)</strong>. Cukup pasang satu script ini di Google Sheets Anda:
            </p>

            {/* Script Box */}
            <div className="relative mt-2">
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[10px] font-mono overflow-x-auto max-h-36">
                {getSpreadsheetAppsScriptSnippet()}
              </pre>
              <button
                type="button"
                onClick={handleCopyScript}
                className="absolute top-2 right-2 px-2.5 py-1 text-[11px] font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Tersalin!' : 'Salin Kode Script'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-medium">
            MARVEL Warehouse · Sinkronisasi Dua Arah Terstandarisasi
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
