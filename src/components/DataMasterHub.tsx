import React, { useState, useRef } from 'react';
import { MaterialItem, WarehouseTransaction, AppUser } from '../types/warehouse';
import { getStoredMaterials, getStoredTransactions, saveMaterials, saveTransactions } from '../utils/inventoryStore';
import { getUsers, saveUsers } from '../utils/authStore';
import {
  Database,
  Users,
  Box,
  ArrowRight,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Shield,
  FileSpreadsheet,
  ArrowLeft
} from 'lucide-react';
import { DataMaterialDanSaldoView } from './DataMaterialDanSaldoView';
import { DataUserView } from './DataUserView';

interface DataMasterHubProps {
  materials: MaterialItem[];
  transactions: WarehouseTransaction[];
  users: AppUser[];
  currentUser: AppUser | null;
  onBackToDashboard: () => void;
  onMaterialsUpdated?: () => void;
  onUsersUpdated?: () => void;
}

export const DataMasterHub: React.FC<DataMasterHubProps> = ({
  materials,
  transactions,
  users,
  currentUser,
  onBackToDashboard,
  onMaterialsUpdated,
  onUsersUpdated
}) => {
  // Navigation inside Data Master: 'hub' | 'material-saldo' | 'user'
  const [subView, setSubView] = useState<'hub' | 'material-saldo' | 'user'>('hub');

  // Backup & Migration states
  const [backupFeedback, setBackupFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Download full backup JSON
  const handleDownloadBackup = () => {
    try {
      const backupData = {
        appName: 'MARVEL ULP TANGGUL',
        exportedAt: new Date().toISOString(),
        version: '2.0.0',
        materials: getStoredMaterials(),
        transactions: getStoredTransactions(),
        users: getUsers(),
        syncConfig: localStorage.getItem('pln_sync_config_v1') || null
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `MARVEL_CADANGAN_DATA_ULP_TANGGUL_${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setBackupFeedback({
        type: 'success',
        message: 'Cadangan data berhasil diunduh. Simpan file ini di media penyimpanan yang aman.'
      });
      setTimeout(() => setBackupFeedback(null), 5000);
    } catch (err: any) {
      setBackupFeedback({
        type: 'error',
        message: `Gagal mengunduh cadangan data: ${err?.message || 'Kesalahan sistem'}`
      });
    }
  };

  // 2. Restore backup JSON
  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed.materials && !parsed.transactions && !parsed.users) {
          throw new Error('Format file cadangan tidak valid atau rusak.');
        }

        if (Array.isArray(parsed.materials)) {
          saveMaterials(parsed.materials);
        }
        if (Array.isArray(parsed.transactions)) {
          saveTransactions(parsed.transactions);
        }
        if (Array.isArray(parsed.users)) {
          saveUsers(parsed.users);
        }
        if (parsed.syncConfig) {
          localStorage.setItem('pln_sync_config_v1', typeof parsed.syncConfig === 'string' ? parsed.syncConfig : JSON.stringify(parsed.syncConfig));
        }

        if (onMaterialsUpdated) onMaterialsUpdated();
        if (onUsersUpdated) onUsersUpdated();

        setBackupFeedback({
          type: 'success',
          message: `Pemulihan berhasil! Seluruh data material, transaksi, dan user telah dipulihkan.`
        });
        setTimeout(() => setBackupFeedback(null), 5000);
      } catch (err: any) {
        setBackupFeedback({
          type: 'error',
          message: `Gagal memulihkan cadangan: ${err?.message || 'Format tidak sesuai'}`
        });
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  // Sub-view: Data Material dan Saldo
  if (subView === 'material-saldo') {
    return (
      <div key="material-saldo" className="anim-zoom-menu">
        <DataMaterialDanSaldoView
          materials={materials}
          transactions={transactions}
          onBackToHub={() => setSubView('hub')}
          onMaterialsUpdated={onMaterialsUpdated}
        />
      </div>
    );
  }

  // Sub-view: Data User
  if (subView === 'user') {
    return (
      <div key="user" className="anim-zoom-menu">
        <DataUserView
          users={users}
          currentUser={currentUser}
          onBackToHub={() => setSubView('hub')}
          onUsersUpdated={onUsersUpdated}
        />
      </div>
    );
  }

  // Main DATA MASTER Hub View matching data_master_f1dd9b2f.JPG
  return (
    <div key="hub" className="space-y-6 anim-zoom-menu pb-12 max-w-[1400px] mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-700 tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span>• ULP TANGGUL · PENGELOLAAN MASTER</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0f2852] tracking-tight">
            DATA MASTER
          </h1>
          <p className="text-sm text-slate-700 font-medium">
            Pilih data master yang ingin dibuka.
          </p>
        </div>

        {/* Kembali ke Dashboard Button */}
        <button
          type="button"
          onClick={onBackToDashboard}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-800 bg-white/95 hover:bg-white active:scale-95 border border-white/80 rounded-full shadow-md transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Dashboard</span>
        </button>
      </div>

      {/* 2 Main Action Cards Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 01: Data Material dan Saldo */}
        <div
          onClick={() => setSubView('material-saldo')}
          className="relative bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-7 shadow-xl border border-white/80 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between min-h-[220px] overflow-hidden"
        >
          {/* Watermark 01 */}
          <div className="absolute right-5 top-3 text-7xl font-black text-blue-100/70 select-none pointer-events-none font-mono">
            01
          </div>

          <div>
            {/* Top Icon */}
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md mb-5 group-hover:scale-105 transition-transform">
              <Box className="w-6 h-6 stroke-[2.2]" />
            </div>

            {/* Small tag */}
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              DATA STOK MATERIAL
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-black text-[#0B2545] tracking-tight">
              Data Material dan Saldo
            </h2>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              Kelola daftar material dan saldo stok gudang.
            </p>
          </div>

          {/* Action Row */}
          <div className="pt-6 flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 group-hover:text-blue-800 transition-colors">
              Buka Menu
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Card 02: Data User */}
        <div
          onClick={() => setSubView('user')}
          className="relative bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-7 shadow-xl border border-white/80 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between min-h-[220px] overflow-hidden"
        >
          {/* Watermark 02 */}
          <div className="absolute right-5 top-3 text-7xl font-black text-purple-100/70 select-none pointer-events-none font-mono">
            02
          </div>

          <div>
            {/* Top Icon */}
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md mb-5 group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6 stroke-[2.2]" />
            </div>

            {/* Small tag */}
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              AKUN PENGGUNA
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-black text-[#0B2545] tracking-tight">
              Data User
            </h2>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              Kelola data pengguna aplikasi MARVEL.
            </p>
          </div>

          {/* Action Row */}
          <div className="pt-6 flex items-center justify-between">
            <span className="text-xs font-bold text-purple-600 group-hover:text-purple-800 transition-colors">
              Buka Menu
            </span>
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Cadangan dan Migrasi Data */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-7 shadow-xl border border-white/80 space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-600 tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>• PINDAH PERANGKAT / HOSTING</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-[#0B2545]">
              Cadangan dan Migrasi Data
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Ekspor seluruh material, saldo, transaksi, akun, tanda tangan, dan foto evidence untuk dipindahkan ke browser pada aplikasi yang baru.
            </p>
            <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-1.5 inline-block font-medium">
              File cadangan berisi data sensitif. Simpan dan kirim hanya melalui tempat yang aman.
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap shrink-0 w-full lg:w-auto justify-start lg:justify-end">
            {/* Button: Unduh Cadangan Data */}
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="px-4 py-2.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              title="Unduh file cadangan data lengkap (JSON)"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Unduh Cadangan Data</span>
            </button>

            {/* Button: Pilih Cadangan untuk Dipulihkan */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              title="Pilih file cadangan JSON untuk dipulihkan ke aplikasi ini"
            >
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Pilih Cadangan untuk Dipulihkan</span>
            </button>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleRestoreBackup}
              className="hidden"
            />
          </div>
        </div>

        {/* Feedback Alert */}
        {backupFeedback && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in duration-200 ${
              backupFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            {backupFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{backupFeedback.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};
