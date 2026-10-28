import React from 'react';
import { AppUser } from '../types/warehouse';
import {
  X,
  RefreshCw,
  Database,
  RotateCcw,
  Users,
  ShieldCheck,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { resetWarehouseData } from '../utils/inventoryStore';
import { useModalScrollLock } from '../utils/modalScrollLock';

interface ControlPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  onOpenUserManagement: () => void;
  onDataReset: () => void;
}

export const ControlPanelModal: React.FC<ControlPanelModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenUserManagement,
  onDataReset
}) => {
  useModalScrollLock(isOpen);

  if (!isOpen) return null;

  const handleReset = () => {
    if (window.confirm('Apakah Anda yakin ingin me-reset seluruh data ke default awal PLN ULP Tanggul?')) {
      resetWarehouseData();
      onDataReset();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden p-5 sm:p-6 space-y-4 sm:space-y-5 m-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Control Panel Sistem MARVEL
            </h2>
            <p className="text-xs text-slate-500">
              Pengaturan utilitas dan manajemen logistik PLN ULP Tanggul
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options list */}
        <div className="space-y-2.5">

          {/* Option 2: Kelola Pengguna (Superuser / MULP) */}
          <button
            onClick={() => {
              onClose();
              onOpenUserManagement();
            }}
            className="w-full p-3 rounded-2xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 text-left transition-all flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 group-hover:text-purple-700">
                Manajemen Pengguna & Otoritas
              </div>
              <div className="text-[11px] text-slate-500">
                Kelola hak akses MULP, Admin Gudang, dan Petugas Yandal
              </div>
            </div>
          </button>

          {/* Option 3: Reset Database Demo */}
          <button
            onClick={handleReset}
            className="w-full p-3 rounded-2xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50/50 text-left transition-all flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-800 group-hover:text-rose-900">
                Reset Data ke Default Awal
              </div>
              <div className="text-[11px] text-rose-600/80">
                Kembalikan saldo stok dan mutasi ke kondisi file template
              </div>
            </div>
          </button>
        </div>

        {/* System info */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Unit:</span>
            <span className="font-semibold text-slate-800">PT PLN (Persero) ULP Tanggul</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Pengguna Aktif:</span>
            <span className="font-semibold text-slate-800">{currentUser?.name} ({currentUser?.role})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Versi UI:</span>
            <span className="font-semibold text-blue-600">MARVEL Tech Grid v2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
