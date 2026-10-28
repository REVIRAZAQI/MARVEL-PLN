import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AppUser, MaterialItem, WarehouseTransaction } from '../types/warehouse';
import {
  Bell,
  ChevronDown,
  LogOut,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Clock,
  PackageX,
  ExternalLink,
  CheckCircle2,
  X,
  Layers
} from 'lucide-react';

interface MarvelHeaderProps {
  currentTab: string;
  onNavigate: (tab: string, filterCategory?: string, filterStatus?: 'all' | 'safe' | 'warning' | 'critical') => void;
  currentUser: AppUser | null;
  onLogout: () => void;
  onSwitchUser: (user: AppUser) => void;
  users: AppUser[];
  materials?: MaterialItem[];
  transactions?: WarehouseTransaction[];
  onViewStockCard?: (materialId: string) => void;
}

type NotificationTab = 'all' | 'approval' | 'empty' | 'low';

export const MarvelHeader: React.FC<MarvelHeaderProps> = ({
  currentTab,
  onNavigate,
  currentUser,
  onLogout,
  onSwitchUser,
  users,
  materials = [],
  transactions = [],
  onViewStockCard
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [activeNotifTab, setActiveNotifTab] = useState<NotificationTab>('all');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setShowNotificationPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Material yang belum diapprove (transaksi status === 'Pending')
  const pendingApprovals = useMemo(() => {
    return transactions.filter(t => t.status === 'Pending');
  }, [transactions]);

  // 2. Material habis (stok 0 atau <= 0)
  const outOfStockMaterials = useMemo(() => {
    return materials.filter(m => m.currentStock <= 0);
  }, [materials]);

  // 3. Stok material menipis (kuantiti kurang dari 10 dan > 0)
  const lowStockMaterials = useMemo(() => {
    return materials.filter(m => m.currentStock > 0 && m.currentStock < 10);
  }, [materials]);

  const pendingApprovalsCount = pendingApprovals.length;
  const outOfStockCount = outOfStockMaterials.length;
  const lowStockCount = lowStockMaterials.length;
  const totalAlertsCount = pendingApprovalsCount + outOfStockCount + lowStockCount;
  const hasNotifications = totalAlertsCount > 0;

  // Determine back button label and target
  let backButton: { label: string; target: string } | null = null;
  if (
    currentTab === 'transaksi' ||
    currentTab === 'logbook' ||
    currentTab === 'approvals' ||
    currentTab === 'analytics' ||
    currentTab === 'users' ||
    currentTab === 'master' ||
    currentTab === 'category_analysis'
  ) {
    backButton = { label: 'Kembali ke Dashboard', target: 'dashboard' };
  } else if (currentTab === 'pengambilan' || currentTab === 'penerimaan' || currentTab === 'pemakaian') {
    backButton = { label: 'Kembali ke Transaksi', target: 'transaksi' };
  } else if (currentTab === 'stock' || currentTab === 'transactions' || currentTab === 'transaksi_material') {
    backButton = { label: 'Kembali ke Logbook', target: 'logbook' };
  }

  const isMULP = currentUser?.role === 'MULP';
  const roleDisplay = isMULP ? 'Superuser' : currentUser?.role || 'Pengguna';
  const titleDisplay = isMULP ? 'Administrator' : currentUser?.name || 'Staff PLN';

  const handleOpenStockCard = (materialId: string) => {
    setShowNotificationPopup(false);
    if (onViewStockCard) {
      onViewStockCard(materialId);
    } else {
      onNavigate('stock');
    }
  };

  const handleOpenStockFiltered = (status: 'critical' | 'warning') => {
    setShowNotificationPopup(false);
    onNavigate('stock', undefined, status);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-[1520px] mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Brand Area */}
          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none shrink-0"
          >
            <img
              src="/assets/aistudio/marvel_header_brand.png"
              alt="MARVEL - Material Akuntabel Resik Visible Cepat Lengkap"
              className="h-8 sm:h-10 object-contain drop-shadow-2xs"
            />
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Back Navigation Pill if in sub-screen */}
            {backButton && (
              <button
                onClick={() => onNavigate(backButton!.target)}
                className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-300 hover:border-slate-400 shadow-2xs hover:shadow-xs transition-all active:scale-95 group back-btn-animate cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft className="w-3 sm:w-3.5 h-3 sm:h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5 text-slate-500 group-hover:text-blue-600" />
                <span className="hidden sm:inline">{backButton.label}</span>
                <span className="inline sm:hidden">Kembali</span>
              </button>
            )}

            {/* Notifications Bell matching exact user requirements */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotificationPopup(!showNotificationPopup)}
                className={`relative p-2 rounded-full transition-all cursor-pointer ${
                  hasNotifications
                    ? 'text-rose-600 bg-rose-50/80 hover:bg-rose-100 hover:text-rose-700 ring-1 ring-rose-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={
                  hasNotifications
                    ? `${totalAlertsCount} Notifikasi Penting: ${pendingApprovalsCount} Approval, ${outOfStockCount} Stok Habis, ${lowStockCount} Stok Menipis`
                    : 'Tidak ada notifikasi'
                }
                aria-label="Pemberitahuan Sistem"
              >
                <Bell className="w-5 h-5" />

                {/* Tanda notifikasi lonceng muncul ketika ada material yang belum diapprove, stok material menipis (<10), dan material habis (0) */}
                {hasNotifications && (
                  <>
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white ring-2 ring-white shadow-xs">
                      {totalAlertsCount > 99 ? '99+' : totalAlertsCount}
                    </span>
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 opacity-60 animate-ping pointer-events-none" />
                  </>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotificationPopup && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 text-xs text-slate-700">
                  {/* Header */}
                  <div className="p-3.5 px-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-sky-400">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-sm leading-tight flex items-center gap-2">
                          <span>Pemberitahuan Sistem</span>
                          {hasNotifications && (
                            <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                              {totalAlertsCount}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-300 leading-tight">
                          ULP Tanggul · Monitoring Real-Time
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowNotificationPopup(false)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Filter Pills */}
                  {hasNotifications && (
                    <div className="p-2 px-3 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold shrink-0">
                      <button
                        onClick={() => setActiveNotifTab('all')}
                        className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                          activeNotifTab === 'all'
                            ? 'bg-slate-800 text-white shadow-2xs'
                            : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                        }`}
                      >
                        Semua ({totalAlertsCount})
                      </button>

                      {pendingApprovalsCount > 0 && (
                        <button
                          onClick={() => setActiveNotifTab('approval')}
                          className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                            activeNotifTab === 'approval'
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
                          }`}
                        >
                          Approval ({pendingApprovalsCount})
                        </button>
                      )}

                      {outOfStockCount > 0 && (
                        <button
                          onClick={() => setActiveNotifTab('empty')}
                          className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                            activeNotifTab === 'empty'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
                          }`}
                        >
                          Habis [0] ({outOfStockCount})
                        </button>
                      )}

                      {lowStockCount > 0 && (
                        <button
                          onClick={() => setActiveNotifTab('low')}
                          className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                            activeNotifTab === 'low'
                              ? 'bg-orange-600 text-white shadow-2xs'
                              : 'bg-white text-orange-700 hover:bg-orange-50 border border-orange-200'
                          }`}
                        >
                          Menipis [&lt;10] ({lowStockCount})
                        </button>
                      )}
                    </div>
                  )}

                  {/* Notification List Body */}
                  <div className="p-3 space-y-3 overflow-y-auto max-h-[60vh]">
                    {!hasNotifications ? (
                      <div className="py-8 text-center px-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">Semua Terkendali</h4>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                          Tidak ada transaksi yang menunggu persetujuan, dan semua stok material di atas 10 unit.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* 1. SECTION: MATERIAL YANG BELUM DIAPPROVE */}
                        {(activeNotifTab === 'all' || activeNotifTab === 'approval') &&
                          pendingApprovalsCount > 0 && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 space-y-2">
                              <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/80">
                                <div className="flex items-center gap-1.5 font-black text-amber-900 text-xs">
                                  <Clock className="w-4 h-4 text-amber-600" />
                                  <span>{pendingApprovalsCount} Mutasi Perlu Approval</span>
                                </div>
                                <button
                                  onClick={() => {
                                    setShowNotificationPopup(false);
                                    onNavigate('approvals');
                                  }}
                                  className="text-[10px] font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-0.5 cursor-pointer"
                                >
                                  <span>Buka Semua</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="space-y-1.5 pt-0.5">
                                {pendingApprovals.slice(0, 4).map(tx => (
                                  <div
                                    key={tx.id}
                                    onClick={() => {
                                      setShowNotificationPopup(false);
                                      onNavigate('approvals');
                                    }}
                                    className="p-2 bg-white rounded-lg border border-amber-100 hover:border-amber-300 hover:shadow-2xs transition-all cursor-pointer"
                                  >
                                    <div className="flex items-center justify-between font-bold text-slate-800 text-[11px]">
                                      <span className="truncate max-w-[170px]">
                                        {tx.noGangguan || 'Pengambilan Material'}
                                      </span>
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                        Pending
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
                                      <span className="truncate">
                                        Petugas: {tx.namaPetugas} ({tx.reguYandal || 'Yantek'})
                                      </span>
                                      <span className="font-mono text-slate-400">{tx.tanggal}</span>
                                    </div>
                                  </div>
                                ))}
                                {pendingApprovalsCount > 4 && (
                                  <div className="text-[10px] text-center text-amber-800 font-semibold pt-1">
                                    + {pendingApprovalsCount - 4} transaksi pending lainnya
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                        {/* 2. SECTION: MATERIAL HABIS (STOK 0) */}
                        {(activeNotifTab === 'all' || activeNotifTab === 'empty') &&
                          outOfStockCount > 0 && (
                            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 space-y-2">
                              <div className="flex items-center justify-between pb-1.5 border-b border-rose-200/80">
                                <div className="flex items-center gap-1.5 font-black text-rose-900 text-xs">
                                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                                  <span>{outOfStockCount} Material Habis (Stok 0)</span>
                                </div>
                                <button
                                  onClick={() => handleOpenStockFiltered('critical')}
                                  className="text-[10px] font-bold text-rose-800 hover:text-rose-950 underline flex items-center gap-0.5 cursor-pointer"
                                >
                                  <span>Lihat di Katalog</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="space-y-1.5 pt-0.5">
                                {outOfStockMaterials.slice(0, 5).map(mat => (
                                  <div
                                    key={mat.id}
                                    onClick={() => handleOpenStockCard(mat.id)}
                                    className="p-2 bg-white rounded-lg border border-rose-100 hover:border-rose-300 hover:shadow-2xs transition-all cursor-pointer flex items-center justify-between gap-2"
                                  >
                                    <div className="min-w-0">
                                      <div className="font-bold text-slate-800 text-[11px] truncate">
                                        {mat.name}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono">
                                        {mat.code || mat.id} · {mat.category}
                                      </div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                      <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-mono font-black text-[10px]">
                                        0 {mat.unit}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                                {outOfStockCount > 5 && (
                                  <div className="text-[10px] text-center text-rose-800 font-semibold pt-1">
                                    + {outOfStockCount - 5} material kosong lainnya
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                        {/* 3. SECTION: STOK MENIPIS (KUANTITI KURANG DARI 10) */}
                        {(activeNotifTab === 'all' || activeNotifTab === 'low') &&
                          lowStockCount > 0 && (
                            <div className="rounded-xl border border-orange-200 bg-orange-50/70 p-3 space-y-2">
                              <div className="flex items-center justify-between pb-1.5 border-b border-orange-200/80">
                                <div className="flex items-center gap-1.5 font-black text-orange-900 text-xs">
                                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                                  <span>{lowStockCount} Material Menipis (&lt; 10 Unit)</span>
                                </div>
                                <button
                                  onClick={() => handleOpenStockFiltered('warning')}
                                  className="text-[10px] font-bold text-orange-800 hover:text-orange-950 underline flex items-center gap-0.5 cursor-pointer"
                                >
                                  <span>Lihat di Katalog</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="space-y-1.5 pt-0.5">
                                {lowStockMaterials.slice(0, 5).map(mat => (
                                  <div
                                    key={mat.id}
                                    onClick={() => handleOpenStockCard(mat.id)}
                                    className="p-2 bg-white rounded-lg border border-orange-100 hover:border-orange-300 hover:shadow-2xs transition-all cursor-pointer flex items-center justify-between gap-2"
                                  >
                                    <div className="min-w-0">
                                      <div className="font-bold text-slate-800 text-[11px] truncate">
                                        {mat.name}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono">
                                        {mat.code || mat.id} · {mat.category}
                                      </div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                      <span className="inline-block px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-mono font-bold text-[10px]">
                                        Sisa: {mat.currentStock} {mat.unit}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                                {lowStockCount > 5 && (
                                  <div className="text-[10px] text-center text-orange-800 font-semibold pt-1">
                                    + {lowStockCount - 5} material menipis lainnya
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                      </>
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className="p-2.5 px-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                    <button
                      onClick={() => {
                        setShowNotificationPopup(false);
                        onNavigate('stock');
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Buka E-Katalog Gudang</span>
                    </button>
                    {pendingApprovalsCount > 0 && (
                      <button
                        onClick={() => {
                          setShowNotificationPopup(false);
                          onNavigate('approvals');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                      >
                        Proses Approval
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill matching mockup */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-all select-none group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                  {currentUser?.name?.charAt(0) || '8'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {roleDisplay}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    {titleDisplay}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform" />
              </button>

              {/* User Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-900">{currentUser?.name}</div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {currentUser?.role} · NIP: {currentUser?.nip}
                    </div>
                  </div>

                  <div className="p-1 space-y-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2.5 font-semibold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>Keluar Akun (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      {/* Spacer to lock content spacing below the fixed header */}
      <div className="h-14 sm:h-16 shrink-0 pointer-events-none no-print" aria-hidden="true" />
    </>
  );
};
