import React from 'react';
import { MaterialItem, WarehouseTransaction } from '../types/warehouse';
import { Package, AlertCircle, ArrowUpRight, ArrowDownLeft, RotateCcw, ShieldAlert, CheckCircle2, ChevronRight, Layers, MapPin } from 'lucide-react';

interface DashboardOverviewProps {
  materials: MaterialItem[];
  transactions: WarehouseTransaction[];
  onNavigateToStock: (categoryFilter?: string, statusFilter?: 'all' | 'safe' | 'warning' | 'critical') => void;
  onOpenNewTransaction: (type?: 'Keluar' | 'Masuk' | 'Return') => void;
  onViewStockCard: (materialId: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  materials,
  transactions,
  onNavigateToStock,
  onOpenNewTransaction,
  onViewStockCard
}) => {
  const totalMaterials = materials.length;
  const totalPhysicalItems = materials.reduce((acc, m) => acc + m.currentStock, 0);

  const criticalItems = materials.filter(m => m.currentStock <= 0);
  const warningItems = materials.filter(m => m.currentStock > 0 && m.currentStock <= m.minSafetyStock);
  const safeItems = materials.filter(m => m.currentStock > m.minSafetyStock);

  // Group by category
  const categories = Array.from(new Set(materials.map(m => m.category)));
  const categoryStats = categories.map(cat => {
    const items = materials.filter(m => m.category === cat);
    const stockSum = items.reduce((acc, i) => acc + i.currentStock, 0);
    const lowCount = items.filter(i => i.currentStock <= i.minSafetyStock).length;
    return {
      category: cat,
      itemCount: items.length,
      stockSum,
      lowCount
    };
  });

  const recentTransactions = transactions.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Critical Stock Alert Banner if any */}
      {(criticalItems.length > 0 || warningItems.length > 0) && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Peringatan Stok Minimum Gudang PLN
              </div>
              <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-2">
                <span>{criticalItems.length} material habis (kritis)</span>
                <span aria-hidden="true">·</span>
                <span>{warningItems.length} material mendekati batas minimum buffer</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateToStock(undefined, 'warning')}
            className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-200/70 hover:bg-amber-200 rounded-lg transition-colors whitespace-nowrap"
          >
            Tinjau Item Menipis
          </button>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total SKU */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Katalog Material</span>
            <Package className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {totalMaterials}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span>7 Kategori Distribusi</span>
            <span aria-hidden="true">·</span>
            <span>Standar PLN</span>
          </div>
        </div>

        {/* Card 2: Total Fisik */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Fisik di Gudang</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {totalPhysicalItems.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span>Termasuk Kabel SR & Fuse</span>
            <span aria-hidden="true">·</span>
            <span>Real-time</span>
          </div>
        </div>

        {/* Card 3: Kondisi Stok */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Kondisi Stok</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {safeItems.length}
            </span>
            <span className="text-xs text-emerald-700 font-medium">Aman</span>
            <span className="text-xs text-slate-300">/</span>
            <span className="text-sm font-semibold font-mono tabular-nums text-amber-700">
              {warningItems.length + criticalItems.length}
            </span>
            <span className="text-xs text-amber-700 font-medium">Perhatian</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span>Berdasarkan safety stock</span>
          </div>
        </div>

        {/* Card 4: Total Mutasi */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Mutasi Transaksi</span>
            <ArrowUpRight className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {transactions.length}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span>Log APKT & Pemeliharaan</span>
          </div>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold tracking-tight text-white">
            Pengelolaan Operasional Gudang ULP
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Catat pengeluaran material pelayanan teknik, dropping logistik, atau pengembalian sisa pekerjaan.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenNewTransaction('Keluar')}
            className="px-3.5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Pengambilan Yantek</span>
          </button>
          <button
            onClick={() => onOpenNewTransaction('Masuk')}
            className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Dropping Masuk</span>
          </button>
          <button
            onClick={() => onOpenNewTransaction('Return')}
            className="px-3.5 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Return Sisa</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Categories & Recent Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Category Status (2 cols wide) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Monitoring per Kategori Material
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Status ketersediaan stok fisik per kelompok material teknik
              </p>
            </div>
            <button
              onClick={() => onNavigateToStock()}
              className="text-xs font-semibold text-sky-700 hover:text-sky-800 flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categoryStats.map(stat => (
              <div
                key={stat.category}
                onClick={() => onNavigateToStock(stat.category)}
                className="p-3.5 rounded-lg border border-slate-200 hover:border-sky-300 hover:bg-sky-50/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-semibold text-slate-900 group-hover:text-sky-800 transition-colors">
                    {stat.category}
                  </span>
                  {stat.lowCount > 0 ? (
                    <span className="text-[11px] font-mono text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                      {stat.lowCount} Perhatian
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Aman</span>
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-baseline justify-between text-xs text-slate-500">
                  <span>{stat.itemCount} jenis material</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900">
                    {stat.stockSum.toLocaleString('id-ID')} unit
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Recent Transactions (1 col wide) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Mutasi Terbaru
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aktivitas keluar/masuk material
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {recentTransactions.map(tx => {
                const totalQty = tx.items.reduce((acc, i) => acc + i.quantity, 0);
                const isKeluar = tx.admMaterial === 'Keluar';
                const isMasuk = tx.admMaterial === 'Masuk';

                return (
                  <div
                    key={tx.id}
                    className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-semibold ${
                            isKeluar
                              ? 'text-rose-700'
                              : isMasuk
                              ? 'text-emerald-700'
                              : 'text-sky-700'
                          }`}
                        >
                          {tx.admMaterial}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="font-mono text-slate-500">{tx.tanggal}</span>
                      </div>
                      <span className="font-mono tabular-nums font-semibold text-slate-900">
                        {totalQty} item
                      </span>
                    </div>

                    <div className="text-slate-800 font-medium truncate">
                      {tx.noGangguan || 'Keperluan Yantek'}
                    </div>

                    <div className="text-slate-500 text-[11px] mt-0.5 flex items-center justify-between">
                      <span className="truncate">
                        {tx.namaPetugas || tx.reguYandal || '-'} ({tx.reguYandal || 'Yantek'})
                      </span>
                      {tx.items[0] && (
                        <button
                          onClick={() => onViewStockCard(tx.items[0].materialId)}
                          className="text-sky-700 hover:underline shrink-0 font-medium ml-2"
                        >
                          Kartu Stok
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
