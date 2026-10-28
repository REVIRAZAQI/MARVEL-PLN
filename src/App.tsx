import React, { useState, useEffect, useCallback } from 'react';
import { MarvelHeader } from './components/MarvelHeader';
import { MarvelDashboard } from './components/MarvelDashboard';
import { TransactionHub } from './components/TransactionHub';
import { FormPengambilanMaterial } from './components/FormPengambilanMaterial';
import { FormPenerimaanMaterial } from './components/FormPenerimaanMaterial';
import { FormPemakaianMaterial } from './components/FormPemakaianMaterial';
import { LogbookHub } from './components/LogbookHub';
import { StockTable } from './components/StockTable';
import { TransactionHistory } from './components/TransactionHistory';
import { TransaksiMaterialView } from './components/TransaksiMaterialView';
import { AnalyticsView } from './components/AnalyticsView';
import { AdminApprovalList } from './components/AdminApprovalList';
import { UserManagementView } from './components/UserManagementView';
import { DataMasterHub } from './components/DataMasterHub';
import { StockCardModal } from './components/StockCardModal';
import { TransactionModal } from './components/TransactionModal';
import { QuickRestockModal } from './components/QuickRestockModal';
import { ControlPanelModal } from './components/ControlPanelModal';
import { LoginPage } from './components/LoginPage';
import { CategoryUsageAnalyticsView, CategoryTarget } from './components/CategoryUsageAnalyticsView';
import { getStoredMaterials, getStoredTransactions, resetWarehouseData } from './utils/inventoryStore';
import { getSyncConfig } from './utils/spreadsheetSync';
import { getCurrentUser, setCurrentUser, logout, getUsers, PRESET_USERS } from './utils/authStore';
import { MaterialItem, WarehouseTransaction, TransactionType, SpreadsheetSyncConfig, AppUser } from './types/warehouse';
import { forceUnlockScroll } from './utils/modalScrollLock';

export default function App() {
  const [currentUser, setLocalCurrentUser] = useState<AppUser | null>(() => getCurrentUser());
  const [currentTab, setCurrentTab] = useState<
    | 'dashboard'
    | 'transaksi'
    | 'pengambilan'
    | 'penerimaan'
    | 'pemakaian'
    | 'logbook'
    | 'stock'
    | 'transactions'
    | 'transaksi_material'
    | 'approvals'
    | 'analytics'
    | 'users'
    | 'master'
    | 'category_analysis'
  >('dashboard');
  const [selectedCategoryAnalysis, setSelectedCategoryAnalysis] = useState<CategoryTarget>('KWH Meter');

  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [transactions, setTransactions] = useState<WarehouseTransaction[]>([]);
  const [syncConfig, setSyncConfig] = useState<SpreadsheetSyncConfig>(getSyncConfig);
  const [users, setUsers] = useState<AppUser[]>(() => getUsers());

  // Navigation filters passed from Dashboard to StockTable
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'safe' | 'warning' | 'critical'>('all');

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<TransactionType>('Keluar');
  const [activeStockCardId, setActiveStockCardId] = useState<string | null>(null);
  const [restockMaterial, setRestockMaterial] = useState<MaterialItem | null>(null);
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);

  const loadData = useCallback(() => {
    setMaterials(getStoredMaterials());
    setTransactions(getStoredTransactions());
    setSyncConfig(getSyncConfig());
    setLocalCurrentUser(getCurrentUser());
    setUsers(getUsers());
  }, []);

  useEffect(() => {
    loadData();

    const handleStockUpdate = () => loadData();
    const handleSyncUpdate = () => loadData();
    const handleAuthUpdate = () => loadData();

    window.addEventListener('pln-stock-updated', handleStockUpdate);
    window.addEventListener('pln-sync-config-updated', handleSyncUpdate);
    window.addEventListener('pln-auth-changed', handleAuthUpdate);
    window.addEventListener('pln-users-updated', handleAuthUpdate);

    return () => {
      window.removeEventListener('pln-stock-updated', handleStockUpdate);
      window.removeEventListener('pln-sync-config-updated', handleSyncUpdate);
      window.removeEventListener('pln-auth-changed', handleAuthUpdate);
      window.removeEventListener('pln-users-updated', handleAuthUpdate);
    };
  }, [loadData]);

  const handleLoginSuccess = (user: AppUser) => {
    setLocalCurrentUser(user);
    if (user.role === 'Petugas Gudang') {
      setCurrentTab('transaksi');
    } else if (user.role === 'Admin Gudang') {
      setCurrentTab('approvals');
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleLogout = () => {
    logout();
    setLocalCurrentUser(null);
  };

  const handleNavigate = (
    tab: string,
    filterCategory?: string,
    filterStatus?: 'all' | 'safe' | 'warning' | 'critical'
  ) => {
    forceUnlockScroll();
    if (filterCategory) {
      setSelectedCategory(filterCategory);
    }
    if (filterStatus) {
      setSelectedStatus(filterStatus);
    }
    if (tab === 'approvals') {
      window.dispatchEvent(new CustomEvent('pln-reset-approval-view'));
    }
    setCurrentTab(tab as any);
  };

  // Ensure scroll is completely unlocked whenever active tab changes
  useEffect(() => {
    forceUnlockScroll();
  }, [currentTab]);

  const activeMaterialForCard = materials.find(m => m.id === activeStockCardId) || null;
  const criticalCount = materials.filter(m => m.currentStock <= m.minSafetyStock).length;
  const pendingApprovalsCount = transactions.filter(t => t.status === 'Pending').length;

  // If user is not logged in, render MARVEL Login Page matching login_215fbb5c.JPG
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div
      className="min-h-screen text-slate-900 flex flex-col font-sans bg-cover bg-fixed bg-center relative"
      style={{
        backgroundImage: `url('/assets/aistudio/login-background_306ad1f5.png')`
      }}
    >

      {/* MARVEL Top Header matching mockups */}
      <MarvelHeader
        currentTab={currentTab}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchUser={user => {
          setCurrentUser(user);
          setLocalCurrentUser(user);
        }}
        users={users}
        materials={materials}
        transactions={transactions}
        onViewStockCard={id => setActiveStockCardId(id)}
      />

      {/* Main Container with smooth menu transition */}
      <main className="flex-1 max-w-[1520px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-10">
        <div key={currentTab} className="anim-zoom-menu">
          {/* 1. Dashboard View matching dashboard_ce691883.JPG */}
          {currentTab === 'dashboard' && (
            <MarvelDashboard
              materials={materials}
              transactions={transactions}
              onNavigate={handleNavigate}
              onSelectCategoryAnalysis={cat => {
                setSelectedCategoryAnalysis(cat);
                setCurrentTab('category_analysis');
              }}
            />
          )}

          {/* 1b. Analisis Pemakaian Material Kategori (KWH Meter, MCB, Kabel SR, Asesoris) */}
          {currentTab === 'category_analysis' && (
            <CategoryUsageAnalyticsView
              category={selectedCategoryAnalysis}
              materials={materials}
              transactions={transactions}
              onBack={() => setCurrentTab('dashboard')}
              onSelectCategory={cat => setSelectedCategoryAnalysis(cat)}
              onViewStockCard={id => setActiveStockCardId(id)}
            />
          )}

          {/* 2. Transaksi Hub matching transaksi_awal_94d9dce7.JPG */}
          {currentTab === 'transaksi' && (
            <TransactionHub
              onSelectAction={action => setCurrentTab(action)}
            />
          )}

          {/* 3. Form Pengambilan Material matching pengambilan_material_232f94a1.JPG */}
          {currentTab === 'pengambilan' && (
            <FormPengambilanMaterial
              currentUser={currentUser}
              materials={materials}
              transactions={transactions}
              onFinish={() => {
                loadData();
                setCurrentTab('transactions');
              }}
            />
          )}

          {/* 4. Form Penerimaan Material matching penerimaan_material_95541240.JPG */}
          {currentTab === 'penerimaan' && (
            <FormPenerimaanMaterial
              currentUser={currentUser}
              materials={materials}
              transactions={transactions}
              onFinish={() => {
                loadData();
                setCurrentTab('stock');
              }}
            />
          )}

          {/* 4b. Form Pemakaian Material (Inputan Menyusul) */}
          {currentTab === 'pemakaian' && (
            <FormPemakaianMaterial
              currentUser={currentUser}
              materials={materials}
              transactions={transactions}
              onBackToTransaksi={() => setCurrentTab('transaksi')}
              onFinish={() => {
                loadData();
                setCurrentTab('transaksi');
              }}
            />
          )}

          {/* 5. Logbook Hub matching tampilan_logbook_51e97756.JPG */}
          {currentTab === 'logbook' && (
            <LogbookHub
              onSelectAction={action => setCurrentTab(action)}
              onOpenControlPanel={() => setIsControlPanelOpen(true)}
            />
          )}

          {/* 6. E-Catalog / Master Data */}
          {currentTab === 'stock' && (
            <div className="space-y-4">
              <StockTable
                materials={materials}
                transactions={transactions}
                selectedCategory={selectedCategory}
                selectedStatus={selectedStatus}
                onViewStockCard={id => setActiveStockCardId(id)}
                onQuickRestock={mat => setRestockMaterial(mat)}
              />
            </div>
          )}

          {/* 7. Historis Mutasi (Buku Mutasi Transaksi) */}
          {currentTab === 'transactions' && (
            <TransactionHistory
              transactions={transactions}
              onViewStockCard={id => setActiveStockCardId(id)}
            />
          )}

          {/* 7b. Transaksi Material matching Gambar 1 */}
          {currentTab === 'transaksi_material' && (
            <TransaksiMaterialView
              materials={materials}
              transactions={transactions}
              onBackToLogbook={() => setCurrentTab('logbook')}
            />
          )}

          {/* 8. Persetujuan Mutasi (Admin Approval) */}
          {currentTab === 'approvals' && (
            <AdminApprovalList
              transactions={transactions}
              materials={materials}
              currentUser={currentUser}
              onViewStockCard={id => setActiveStockCardId(id)}
              onRefresh={loadData}
              initialMode="hub"
            />
          )}

          {/* 9. Statistik & Laporan */}
          {currentTab === 'analytics' && (
            <AnalyticsView materials={materials} transactions={transactions} />
          )}

          {/* 10. Manajemen Pengguna */}
          {currentTab === 'users' && (
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-7 shadow-xl border border-slate-200/80 space-y-4">
              <UserManagementView currentUser={currentUser} />
            </div>
          )}

          {/* 11. Data Master (Data Material & Saldo, Data User, Cadangan & Migrasi Data) */}
          {currentTab === 'master' && (
            <DataMasterHub
              materials={materials}
              transactions={transactions}
              users={users}
              currentUser={currentUser}
              onBackToDashboard={() => setCurrentTab('dashboard')}
              onMaterialsUpdated={loadData}
              onUsersUpdated={loadData}
            />
          )}
        </div>
      </main>

      {/* Watermark Bottom Left matching mockups */}
      <div className="relative z-10 px-6 sm:px-8 py-3 text-[11px] font-bold tracking-widest text-white/80 drop-shadow-sm uppercase select-none flex items-center justify-between">
        <span>MARVEL ULP TANGGUL</span>
        <span className="text-[10px] text-slate-400 font-normal">
          Material Akuntabel Resik Visible Cepat Lengkap · PT PLN (Persero)
        </span>
      </div>

      {/* Modals */}
      <StockCardModal
        material={activeMaterialForCard}
        onClose={() => {
          setActiveStockCardId(null);
          forceUnlockScroll();
        }}
      />

      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          forceUnlockScroll();
        }}
        materials={materials}
        defaultType={txModalType}
      />

      <QuickRestockModal
        material={restockMaterial}
        onClose={() => {
          setRestockMaterial(null);
          forceUnlockScroll();
        }}
      />

      <ControlPanelModal
        isOpen={isControlPanelOpen}
        onClose={() => {
          setIsControlPanelOpen(false);
          forceUnlockScroll();
        }}
        currentUser={currentUser}
        onOpenUserManagement={() => setCurrentTab('users')}
        onDataReset={loadData}
      />
    </div>
  );
}
