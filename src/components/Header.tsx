import React from 'react';
import { Package, RefreshCw, BarChart3, Clock, ClipboardCheck, Smartphone, UserCircle2, ArrowRightLeft, LogOut, Users } from 'lucide-react';
import { AppUser } from '../types/warehouse';

interface HeaderProps {
  currentTab: 'dashboard' | 'stock' | 'transactions' | 'analytics' | 'petugas-entry' | 'approvals' | 'users';
  onSelectTab: (tab: 'dashboard' | 'stock' | 'transactions' | 'analytics' | 'petugas-entry' | 'approvals' | 'users') => void;
  onOpenNewTransaction?: () => void;
  onOpenSyncModal: () => void;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  criticalCount: number;
  isSynced: boolean;
  currentUser: AppUser | null;
  pendingApprovalsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenSyncModal,
  onOpenLoginModal,
  onLogout,
  criticalCount,
  isSynced,
  currentUser,
  pendingApprovalsCount
}) => {
  const isPetugas = currentUser?.role === 'Petugas Gudang';
  const isMULP = currentUser?.role === 'MULP';

  const shortName = currentUser?.name
    ? currentUser.name.split(' ')[0]
    : 'Petugas';

  return (
    <header className="sticky top-0 z-40 bg-[#0A2540] border-b border-[#16385C] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 gap-2 sm:gap-4">
          {/* Zone 1: Brand & Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Official PLN Logo Badge */}
            <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shadow-xs shrink-0">
              <img
                src="/assets/aistudio/Logo_PLN_4161717a.png"
                alt="PLN"
                className="w-full h-full object-contain"
              />
            </div>

            <div>
              <div className="text-sm font-extrabold text-white tracking-tight leading-none whitespace-nowrap flex items-center gap-1.5">
                <span>PLN GUDANG</span>
              </div>
              <div className="text-[10px] text-sky-300 font-medium mt-0.5 flex items-center gap-1 whitespace-nowrap">
                <span>ULP Tanggul</span>
                <span className="text-slate-500">·</span>
                <span className="font-semibold text-amber-300">{currentUser?.role || 'Sistem Monitoring'}</span>
              </div>
            </div>
          </div>

          {/* Zone 2: Navigation Links in a Clean Segmented Capsule (Desktop) */}
          <nav className="hidden lg:flex items-center bg-[#071B2F] p-1 rounded-xl border border-[#16385C] shadow-inner gap-1">
            {isPetugas ? (
              <>
                <button
                  onClick={() => onSelectTab('petugas-entry')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    currentTab === 'petugas-entry'
                      ? 'bg-sky-600 text-white font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Catat Transaksi</span>
                </button>

                <button
                  onClick={() => onSelectTab('stock')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    currentTab === 'stock'
                      ? 'bg-sky-600 text-white font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                  <span>Katalog & Stok</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onSelectTab('dashboard')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    currentTab === 'dashboard'
                      ? 'bg-sky-600 text-white font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-sky-400" />
                  <span>Ringkasan</span>
                </button>

                <button
                  onClick={() => onSelectTab('approvals')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    currentTab === 'approvals'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ClipboardCheck className={`w-3.5 h-3.5 ${currentTab === 'approvals' ? 'text-slate-950' : 'text-amber-400'}`} />
                  <span>Persetujuan</span>
                  {pendingApprovalsCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-mono font-black bg-amber-400 text-slate-950 rounded-full shadow-xs">
                      {pendingApprovalsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => onSelectTab('stock')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    currentTab === 'stock'
                      ? 'bg-sky-600 text-white font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Stok Real-Time</span>
                  {criticalCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-mono font-bold bg-rose-500 text-white rounded shadow-xs">
                      {criticalCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => onSelectTab('transactions')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    currentTab === 'transactions'
                      ? 'bg-sky-600 text-white font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Mutasi</span>
                </button>

                <button
                  onClick={() => onSelectTab('analytics')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    currentTab === 'analytics'
                      ? 'bg-sky-600 text-white font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Laporan</span>
                </button>

                {isMULP && (
                  <button
                    onClick={() => onSelectTab('users')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      currentTab === 'users'
                        ? 'bg-teal-600 text-white font-bold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-teal-400" />
                    <span>Admin User</span>
                  </button>
                )}
              </>
            )}
          </nav>

          {/* Zone 3: Profile & System Controls Capsule */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Spreadsheet Status */}
            <button
              onClick={onOpenSyncModal}
              title="Status Sinkronisasi Google Spreadsheet"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#071B2F] hover:bg-[#102C4A] border border-[#16385C] text-slate-300 transition-colors"
            >
              <span className={`w-2 h-2 rounded-full ${isSynced ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="hidden sm:inline text-[11px]">Spreadsheet</span>
            </button>

            {/* User Profile Capsule */}
            <button
              onClick={onOpenLoginModal}
              title="Ganti Peran / Akun"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#071B2F] hover:bg-[#102C4A] border border-[#16385C] text-xs text-white transition-colors"
            >
              <UserCircle2 className="w-4 h-4 text-sky-400" />
              <div className="text-left hidden md:block">
                <div className="font-bold text-xs leading-none text-slate-100 max-w-[100px] truncate">
                  {shortName}
                </div>
                <div className="text-[10px] text-amber-300 font-semibold leading-none mt-0.5">
                  {currentUser?.role || 'Login'}
                </div>
              </div>
              <ArrowRightLeft className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              title="Keluar ke Menu Login"
              className="p-1.5 rounded-lg bg-[#071B2F] hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-800/60 border border-[#16385C] text-slate-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Navigation Bar for Tablet & Mobile (Sleek horizontal segment) */}
      <div className="lg:hidden border-t border-[#16385C] bg-[#071B2F] px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto text-xs">
        {isPetugas ? (
          <>
            <button
              onClick={() => onSelectTab('petugas-entry')}
              className={`px-3 py-1.5 font-bold rounded-lg shrink-0 flex items-center gap-1.5 transition-colors ${
                currentTab === 'petugas-entry'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-[#0A2540] text-slate-300 border border-[#16385C] hover:bg-[#102C4A]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Catat Transaksi</span>
            </button>
            <button
              onClick={() => onSelectTab('stock')}
              className={`px-3 py-1.5 font-bold rounded-lg shrink-0 flex items-center gap-1.5 transition-colors ${
                currentTab === 'stock'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-[#0A2540] text-slate-300 border border-[#16385C] hover:bg-[#102C4A]'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
              <span>Katalog & Stok</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`px-2.5 py-1 font-bold rounded-lg shrink-0 flex items-center gap-1 transition-colors ${
                currentTab === 'dashboard'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-[#0A2540] text-slate-300 border border-[#16385C] hover:bg-[#102C4A]'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-sky-400" />
              <span>Ringkasan</span>
            </button>
            <button
              onClick={() => onSelectTab('approvals')}
              className={`px-2.5 py-1 font-bold rounded-lg shrink-0 flex items-center gap-1 transition-colors ${
                currentTab === 'approvals'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                  : 'bg-[#0A2540] text-slate-300 border border-[#16385C] hover:bg-[#102C4A]'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Persetujuan</span>
              {pendingApprovalsCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-mono font-black bg-amber-400 text-slate-950 rounded-full">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => onSelectTab('stock')}
              className={`px-2.5 py-1 font-bold rounded-lg shrink-0 flex items-center gap-1 transition-colors ${
                currentTab === 'stock'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-[#0A2540] text-slate-300 border border-[#16385C] hover:bg-[#102C4A]'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Stok</span>
              {criticalCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-mono font-bold bg-rose-500 text-white rounded">
                  {criticalCount}
                </span>
              )}
            </button>
            <button
              onClick={() => onSelectTab('transactions')}
              className={`px-2.5 py-1 font-bold rounded-lg shrink-0 flex items-center gap-1 transition-colors ${
                currentTab === 'transactions'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-[#0A2540] text-slate-300 border border-[#16385C] hover:bg-[#102C4A]'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Mutasi</span>
            </button>
            <button
              onClick={() => onSelectTab('analytics')}
              className={`px-2.5 py-1 font-bold rounded-lg shrink-0 flex items-center gap-1 transition-colors ${
                currentTab === 'analytics'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-[#0A2540] text-slate-300 border border-[#16385C] hover:bg-[#102C4A]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Laporan</span>
            </button>
            {isMULP && (
              <button
                onClick={() => onSelectTab('users')}
                className={`px-2.5 py-1 font-bold rounded-lg shrink-0 flex items-center gap-1 transition-colors ${
                  currentTab === 'users'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-[#0A2540] text-slate-300 border border-[#16385C] hover:bg-[#102C4A]'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-teal-400" />
                <span>Admin User</span>
              </button>
            )}
          </>
        )}
      </div>
    </header>
  );
};
