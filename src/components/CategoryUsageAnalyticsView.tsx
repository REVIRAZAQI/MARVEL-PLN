import React, { useState, useMemo } from 'react';
import { MaterialItem, WarehouseTransaction } from '../types/warehouse';
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  BarChart3,
  Search,
  Printer,
  Zap,
  ShieldCheck,
  Cable,
  Component,
  FileText,
  Clock,
  Activity,
  Layers,
  Sparkles,
  Download,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { SuratJalanModal } from './SuratJalanModal';
import { createSuratJalanFromTransaction, getTransactionSuratJalanNumber } from '../utils/suratJalanHelper';
import { parseDateToEpoch } from '../utils/spreadsheetSync';

export type CategoryTarget = 'KWH Meter' | 'MCB' | 'Kabel SR' | 'ASESORIS DAN MATERIAL JARINGAN';

interface CategoryUsageAnalyticsViewProps {
  category: CategoryTarget;
  materials: MaterialItem[];
  transactions: WarehouseTransaction[];
  onBack: () => void;
  onSelectCategory?: (cat: CategoryTarget) => void;
  onViewStockCard?: (materialId: string) => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];

export const CategoryUsageAnalyticsView: React.FC<CategoryUsageAnalyticsViewProps> = ({
  category,
  materials,
  transactions,
  onBack,
  onViewStockCard
}) => {
  // Period filter: only 'bulan' or 'tahun' (Per Minggu removed as requested)
  const [period, setPeriod] = useState<'bulan' | 'tahun'>('bulan');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedChartMaterial, setSelectedChartMaterial] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkuFilter, setSelectedSkuFilter] = useState<string>('all');
  const [selectedTxForSuratJalan, setSelectedTxForSuratJalan] = useState<WarehouseTransaction | null>(null);

  // Category Configuration matching PLN Brand Styling
  const categoryConfig = useMemo(() => {
    switch (category) {
      case 'KWH Meter':
        return {
          title: 'KWH METER',
          subtitle: 'Pemakaian & Analisis Material KWH Meter (1 Phasa, 3 Phasa, Prabayar & Pasca)',
          color: 'blue',
          bannerBg: 'from-[#031c4f] via-[#0b5cbe] to-[#0284c7]',
          accentText: 'text-blue-600',
          accentBg: 'bg-blue-600',
          badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: Zap,
          unitLabel: 'Pcs / Unit',
          image: '/assets/aistudio/card_kwh_meter.jpg'
        };
      case 'MCB':
        return {
          title: 'MCB (MINIATURE CIRCUIT BREAKER)',
          subtitle: 'Pemakaian & Analisis Material MCB 1 Phase & 3 Phase (2A s/d 50A)',
          color: 'emerald',
          bannerBg: 'from-[#063220] via-[#0e6f46] to-[#059669]',
          accentText: 'text-emerald-600',
          accentBg: 'bg-emerald-600',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: ShieldCheck,
          unitLabel: 'Pcs / Buah',
          image: '/assets/aistudio/card_mcb.jpg'
        };
      case 'Kabel SR':
        return {
          title: 'KABEL SR (SALURAN RUMAH)',
          subtitle: 'Pemakaian & Analisis Material Kabel Sambungan Rumah & Twisted Alumunium',
          color: 'amber',
          bannerBg: 'from-[#451a03] via-[#b34710] to-[#d97706]',
          accentText: 'text-amber-600',
          accentBg: 'bg-amber-600',
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Cable,
          unitLabel: 'Meter (m)',
          image: '/assets/aistudio/card_kabel_sr.jpg'
        };
      case 'ASESORIS DAN MATERIAL JARINGAN':
      default:
        return {
          title: 'ASESORIS DAN MATERIAL JARINGAN',
          subtitle: 'Pemakaian & Analisis Konektor, Sepatu Kabel, Fuse Link, NH Fuse, & Isolasi',
          color: 'purple',
          bannerBg: 'from-[#2e1065] via-[#5b1f8b] to-[#7c3aed]',
          accentText: 'text-purple-600',
          accentBg: 'bg-purple-600',
          badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: Component,
          unitLabel: 'Pcs / Set',
          image: '/assets/aistudio/card_asesoris.jpg'
        };
    }
  }, [category]);

  // Helper matcher to test if a material or item belongs to this category
  const matchesCategory = useMemo(() => {
    return (name: string, matCategory?: string) => {
      const n = (name || '').toLowerCase();
      const c = (matCategory || '').toLowerCase();

      if (category === 'KWH Meter') {
        return n.includes('kwh') || (c.includes('kwh') && !n.includes('mcb'));
      }
      if (category === 'MCB') {
        return n.includes('mcb') || (c.includes('mcb') && !n.includes('kwh'));
      }
      if (category === 'Kabel SR') {
        return (
          c.includes('kabel') ||
          n.includes('kabel') ||
          n.includes('twisted') ||
          n.includes('sr') ||
          n.includes('nfa2x') ||
          n.includes('tic')
        );
      }
      // ASESORIS DAN MATERIAL JARINGAN
      const isKwh = n.includes('kwh');
      const isMcb = n.includes('mcb');
      const isKabel = c.includes('kabel') || n.includes('kabel') || n.includes('twisted');
      return !isKwh && !isMcb && !isKabel;
    };
  }, [category]);

  // All transactions that include items from this category with admMaterial 'Keluar' (Pemakaian)
  const categoryUsageTx = useMemo(() => {
    const list: Array<{
      tx: WarehouseTransaction;
      categoryItems: Array<{
        name: string;
        quantity: number;
        unit: string;
        materialId: string;
      }>;
      totalQty: number;
      parsedDate: Date | null;
      formattedDate: string;
      year: number;
      month: number;
      day: number;
    }> = [];

    transactions.forEach(tx => {
      const isKeluar = !tx.admMaterial || tx.admMaterial === 'Keluar';
      if (!isKeluar) return;

      const matchedItems: Array<{
        name: string;
        quantity: number;
        unit: string;
        materialId: string;
      }> = [];

      let sumQty = 0;

      (tx.items || []).forEach(item => {
        const mat = materials.find(
          m => m.id === item.materialId || m.name.toLowerCase() === item.materialName.toLowerCase()
        );
        if (matchesCategory(item.materialName, mat?.category)) {
          const qty = Number(item.quantity) || 0;
          sumQty += qty;
          matchedItems.push({
            name: item.materialName,
            quantity: qty,
            unit: item.unit || mat?.unit || 'pcs',
            materialId: item.materialId || mat?.id || ''
          });
        }
      });

      if (matchedItems.length > 0 && sumQty > 0) {
        const dateStr = tx.tanggal || (tx.timestamp ? tx.timestamp.split(' ')[0] : '');
        const epoch = parseDateToEpoch(dateStr);
        let parsedDate: Date | null = null;
        let formattedDate = dateStr || '-';
        let year = 2026;
        let month = 9; // October default
        let day = 15;

        if (epoch > 0) {
          parsedDate = new Date(epoch);
          year = parsedDate.getFullYear();
          month = parsedDate.getMonth();
          day = parsedDate.getDate();
          formattedDate = `${day} ${MONTH_NAMES[month]} ${year}`;
        }

        list.push({
          tx,
          categoryItems: matchedItems,
          totalQty: sumQty,
          parsedDate,
          formattedDate,
          year,
          month,
          day
        });
      }
    });

    return list.sort((a, b) => {
      const epochA = a.parsedDate ? a.parsedDate.getTime() : 0;
      const epochB = b.parsedDate ? b.parsedDate.getTime() : 0;
      return epochB - epochA;
    });
  }, [transactions, materials, matchesCategory]);

  // Extract distinct available years from transactions
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(2026);
    yearsSet.add(2025);
    yearsSet.add(2024);

    categoryUsageTx.forEach(row => {
      if (row.year && row.year > 2000) {
        yearsSet.add(row.year);
      }
    });

    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [categoryUsageTx]);

  // Aggregate SKU breakdown & list of unique material names in this category
  const skuBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; count: number; unit: string }>();

    categoryUsageTx.forEach(row => {
      row.categoryItems.forEach(it => {
        const key = it.name.trim();
        const existing = map.get(key) || { name: key, qty: 0, count: 0, unit: it.unit };
        existing.qty += it.quantity;
        existing.count += 1;
        map.set(key, existing);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
  }, [categoryUsageTx]);

  const topMaterial = skuBreakdown[0] || null;

  // Aggregate metrics
  const totalVolumePemakaian = useMemo(() => {
    return categoryUsageTx.reduce((acc, curr) => acc + curr.totalQty, 0);
  }, [categoryUsageTx]);

  const totalFrekuensi = categoryUsageTx.length;

  // -------------------------------------------------------------
  // MONTHLY ANALYSIS (JANUARI SAMPE DESEMBER) - FILTERED BY SELECTED YEAR & MATERIAL
  // -------------------------------------------------------------
  const monthlyAnalysis = useMemo(() => {
    const months = MONTH_NAMES.map((m, idx) => ({
      key: `M${idx + 1}`,
      label: m,
      shortLabel: MONTH_SHORT[idx],
      monthIdx: idx,
      qty: 0,
      txCount: 0,
      percentage: 0
    }));

    categoryUsageTx.forEach(row => {
      // Filter by selected year
      if (row.year === selectedYear) {
        const mIdx = row.month;
        if (mIdx >= 0 && mIdx < 12) {
          // If a specific material is selected for the chart, count only that material's qty
          if (selectedChartMaterial !== 'all') {
            const matchedItem = row.categoryItems.find(it => it.name === selectedChartMaterial);
            if (matchedItem) {
              months[mIdx].qty += matchedItem.quantity;
              months[mIdx].txCount += 1;
            }
          } else {
            months[mIdx].qty += row.totalQty;
            months[mIdx].txCount += 1;
          }
        }
      }
    });

    const maxMonthly = Math.max(...months.map(m => m.qty), 1);
    months.forEach(m => {
      m.percentage = Math.round((m.qty / maxMonthly) * 100);
    });

    const yearTotal = months.reduce((acc, m) => acc + m.qty, 0);
    const activeMonths = months.filter(m => m.qty > 0).length || 1;
    const avgMonthly = Math.round(yearTotal / activeMonths);
    const peakMonth = [...months].sort((a, b) => b.qty - a.qty)[0];

    return {
      bars: months,
      total: yearTotal,
      avg: avgMonthly,
      peak: peakMonth
    };
  }, [categoryUsageTx, selectedYear, selectedChartMaterial]);

  // -------------------------------------------------------------
  // YEARLY ANALYSIS (ANNUAL COMPARISON)
  // -------------------------------------------------------------
  const yearlyAnalysis = useMemo(() => {
    const yearsMap = new Map<number, { key: string; label: string; qty: number; txCount: number; percentage: number }>();

    availableYears.forEach(y => {
      yearsMap.set(y, {
        key: `Y${y}`,
        label: `Tahun ${y}`,
        qty: 0,
        txCount: 0,
        percentage: 0
      });
    });

    categoryUsageTx.forEach(row => {
      const y = row.year || 2026;
      if (yearsMap.has(y)) {
        const entry = yearsMap.get(y)!;
        if (selectedChartMaterial !== 'all') {
          const matchedItem = row.categoryItems.find(it => it.name === selectedChartMaterial);
          if (matchedItem) {
            entry.qty += matchedItem.quantity;
            entry.txCount += 1;
          }
        } else {
          entry.qty += row.totalQty;
          entry.txCount += 1;
        }
      }
    });

    const years = Array.from(yearsMap.values()).sort((a, b) => {
      const ya = parseInt(a.label.replace(/\D/g, ''), 10);
      const yb = parseInt(b.label.replace(/\D/g, ''), 10);
      return ya - yb;
    });

    const maxYearly = Math.max(...years.map(y => y.qty), 1);
    years.forEach(y => {
      y.percentage = Math.round((y.qty / maxYearly) * 100);
    });

    const allYearsTotal = years.reduce((acc, y) => acc + y.qty, 0);
    const activeYears = years.filter(y => y.qty > 0).length || 1;
    const avgYearly = Math.round(allYearsTotal / activeYears);
    const peakYear = [...years].sort((a, b) => b.qty - a.qty)[0];

    return {
      bars: years,
      total: allYearsTotal,
      avg: avgYearly,
      peak: peakYear
    };
  }, [categoryUsageTx, availableYears, selectedChartMaterial]);

  const activeAnalysis = period === 'tahun' ? yearlyAnalysis : monthlyAnalysis;

  // Filtered transactions for the Table
  const filteredTableData = useMemo(() => {
    return categoryUsageTx.filter(row => {
      // 1. Year filter when in Per Bulan mode
      if (period === 'bulan' && row.year !== selectedYear) {
        return false;
      }

      // 2. SKU filter
      if (selectedSkuFilter !== 'all') {
        const hasSku = row.categoryItems.some(it => it.name === selectedSkuFilter);
        if (!hasSku) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchApkt = (row.tx.noGangguan || '').toLowerCase().includes(q);
        const matchPetugas = (row.tx.namaPetugas || '').toLowerCase().includes(q);
        const matchRegu = (row.tx.reguYandal || '').toLowerCase().includes(q);
        const matchKet = (row.tx.keterangan || '').toLowerCase().includes(q);
        const matchItems = row.categoryItems.some(it => it.name.toLowerCase().includes(q));

        if (!matchApkt && !matchPetugas && !matchRegu && !matchKet && !matchItems) {
          return false;
        }
      }

      return true;
    });
  }, [categoryUsageTx, period, selectedYear, selectedSkuFilter, searchQuery]);

  const IconComponent = categoryConfig.icon;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['No', 'Tanggal', 'No Transaksi / APKT', 'Petugas', 'Regu Yandal', 'Detail Material', 'Jumlah', 'Satuan', 'Keterangan'];
    const rows = filteredTableData.map((row, idx) => {
      const itemDetails = row.categoryItems.map(i => `${i.name} (${i.quantity} ${i.unit})`).join('; ');
      return [
        idx + 1,
        `"${row.formattedDate}"`,
        `"${row.tx.noGangguan || row.tx.id}"`,
        `"${row.tx.namaPetugas}"`,
        `"${row.tx.reguYandal || '-'}"`,
        `"${itemDetails}"`,
        row.totalQty,
        `"${categoryConfig.unitLabel}"`,
        `"${(row.tx.keterangan || '-').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Pemakaian_${category.replace(/\s+/g, '_')}_${period === 'bulan' ? selectedYear : 'Tahunan'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-14 anim-zoom-menu">
      {/* 1. Header Banner matching Template PLN Website (Clean, elegant, with Action Controls) */}
      <div className="relative w-full rounded-3xl overflow-hidden shadow-xl border-0 anim-fade-in-up">
        <div className={`w-full min-h-[170px] sm:min-h-[190px] bg-gradient-to-r ${categoryConfig.bannerBg} relative flex flex-col justify-between p-6 sm:p-8 text-white`}>
          {/* Subtle grid and decorative lighting overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/15 via-transparent to-black/30 pointer-events-none" />

          {/* Top Bar inside Banner: Report Actions */}
          <div className="relative z-10 flex items-center justify-end gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs border border-white/25"
              title="Unduh Data CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs border border-white/25"
              title="Cetak Laporan"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>
          </div>

          {/* Banner Title & Description */}
          <div className="relative z-10 mt-4 flex items-start gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-md">
              <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-sky-200 uppercase tracking-widest">
                  MONITORING LOGISTIK &amp; PEMAKAIAN
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight leading-tight drop-shadow-sm">
                {categoryConfig.title}
              </h1>
              <p className="text-xs sm:text-sm text-sky-100/90 mt-1 max-w-2xl font-medium">
                {categoryConfig.subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 4 Key Performance Indicator (KPI) Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 anim-fade-in-up">
        {/* KPI 1: Total Volume Pemakaian */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-tight">
                Total Pemakaian {period === 'bulan' ? `(${selectedYear})` : '(Semua Tahun)'}
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mt-1">
                {activeAnalysis.total.toLocaleString('id-ID')}
              </h3>
            </div>
            <div className={`p-2.5 rounded-xl ${categoryConfig.badgeBg} shrink-0`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            Satuan: <strong>{categoryConfig.unitLabel}</strong>
          </p>
        </div>

        {/* KPI 2: Frekuensi Pengeluaran / Transaksi */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-tight">
                Frekuensi Pengambilan
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mt-1">
                {totalFrekuensi} <span className="text-xs sm:text-sm font-semibold text-slate-500">Kali</span>
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            Transaksi mutasi pengeluaran barang
          </p>
        </div>

        {/* KPI 3: Rata-Rata Pemakaian */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-tight">
                Rata-Rata {period === 'tahun' ? 'Per Tahun' : 'Per Bulan'}
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mt-1">
                {activeAnalysis.avg.toLocaleString('id-ID')}{' '}
                <span className="text-xs sm:text-sm font-semibold text-slate-500">
                  {category === 'Kabel SR' ? 'meter' : 'unit'}
                </span>
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            Puncak: <strong>{activeAnalysis.peak?.label || '-'}</strong> ({activeAnalysis.peak?.qty || 0})
          </p>
        </div>

        {/* KPI 4: Material Paling Banyak Dipakai */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-tight">
                Material Terpopuler
              </p>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 mt-1 line-clamp-2 leading-tight" title={topMaterial?.name || '-'}>
                {topMaterial?.name || 'Tidak ada data'}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-purple-700 font-bold mt-2 truncate">
            {topMaterial ? `${topMaterial.qty} ${topMaterial.unit} (${topMaterial.count}x)` : '-'}
          </p>
        </div>
      </div>

      {/* 3. ANALISIS GRAFIK PEMAKAIAN MATERIAL DARI JANUARI SAMPAI DESEMBER */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-7 shadow-lg border border-slate-200/80 space-y-6 anim-fade-in-up">
        {/* Section Header with Period Selector & Year Dropdown */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 tracking-wider uppercase">
              <BarChart3 className="w-4 h-4" />
              <span>DISTRIBUSI PEMAKAIAN BULANAN (JANUARI - DESEMBER)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              Grafik Pemakaian Material: {categoryConfig.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {period === 'bulan'
                ? `Menampilkan jumlah pemakaian tiap bulan sepanjang Tahun ${selectedYear}`
                : 'Menampilkan tren pemakaian tahunan'}
            </p>
          </div>

          {/* Controls: [Per Bulan] [Per Tahun] & Year Dropdown when Per Bulan is active */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            {/* Filter by Specific Material SKU */}
            {skuBreakdown.length > 1 && (
              <div className="relative">
                <select
                  value={selectedChartMaterial}
                  onChange={e => setSelectedChartMaterial(e.target.value)}
                  className="bg-white border border-slate-200/90 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs pr-8 max-w-[220px] truncate"
                  title="Pilih material yang ingin dilihat grafiknya"
                >
                  <option value="all">Grafik: Semua Material</option>
                  {skuBreakdown.map((sku, i) => (
                    <option key={i} value={sku.name}>
                      {sku.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Dropdown Pilihan Tahun (Muncul Khusus Saat Memilih 'Per Bulan') */}
            {period === 'bulan' && (
              <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200/90 rounded-2xl px-3 py-1.5 shadow-2xs transition-all animate-in fade-in zoom-in-95">
                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-[11px] font-bold text-blue-900">Tahun:</span>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent border-none text-xs font-extrabold text-blue-700 focus:outline-hidden cursor-pointer pl-1 pr-2"
                >
                  {availableYears.map(yr => (
                    <option key={yr} value={yr} className="text-slate-800">
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Period Toggle Buttons: [ Per Bulan ] [ Per Tahun ] (Per Minggu removed) */}
            <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 border border-slate-200/90 shadow-2xs">
              <button
                onClick={() => setPeriod('bulan')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  period === 'bulan'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Per Bulan
              </button>
              <button
                onClick={() => setPeriod('tahun')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  period === 'tahun'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Per Tahun
              </button>
            </div>
          </div>
        </div>

        {/* RAPIKAN GRAFIK: BAR CHART 12 BULAN (JANUARI S/D DESEMBER) DENGAN PROPORSI PAS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span>
              {period === 'bulan'
                ? `Grafik Konsumsi Bulanan Januari – Desember ${selectedYear}${selectedChartMaterial !== 'all' ? ` (${selectedChartMaterial})` : ''}`
                : `Grafik Konsumsi Tahunan`}
            </span>
            <span>Satuan: {categoryConfig.unitLabel}</span>
          </div>

          {/* Bar Chart Container */}
          <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-6 border border-slate-200/80">
            {/* The 12-Month or Annual Bars Grid */}
            <div className={`h-56 sm:h-64 flex items-end justify-between ${period === 'bulan' ? 'gap-1 sm:gap-2 md:gap-3' : 'gap-4 sm:gap-8 justify-center'} pt-6 px-1`}>
              {activeAnalysis.bars.map((bar, idx) => {
                const heightPercent = Math.max(bar.percentage, bar.qty > 0 ? 12 : 4);
                const isPeak = bar.key === activeAnalysis.peak?.key && bar.qty > 0;

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center h-full justify-end group min-w-0"
                  >
                    {/* Hover Floating Details Tooltip */}
                    <div className="text-[10px] sm:text-[11px] font-bold text-slate-800 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-0.5 rounded-lg shadow-md border border-slate-200 whitespace-nowrap pointer-events-none z-20">
                      {bar.label} {period === 'bulan' ? selectedYear : ''}: {bar.qty} {categoryConfig.unitLabel} ({bar.txCount} tx)
                    </div>

                    {/* Value Badge on top of Bar (visible on peak or when qty > 0) */}
                    <div className="mb-1 text-center">
                      <span className={`text-[9px] sm:text-[10px] font-black ${isPeak ? 'text-blue-700 bg-blue-100/90 px-1.5 py-0.5 rounded-full' : 'text-slate-500'}`}>
                        {bar.qty > 0 ? bar.qty : ''}
                      </span>
                    </div>

                    {/* The Bar Pillar */}
                    <div className="w-full max-w-[34px] sm:max-w-[46px] bg-slate-200/70 rounded-t-xl overflow-hidden flex flex-col justify-end h-full">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-xl transition-all duration-500 ${
                          isPeak
                            ? 'bg-gradient-to-t from-blue-700 via-blue-600 to-sky-400 shadow-md ring-1 ring-blue-400/50'
                            : bar.qty > 0
                            ? 'bg-gradient-to-t from-slate-600 via-blue-500 to-sky-400 group-hover:from-blue-600 group-hover:to-sky-400'
                            : 'bg-slate-300/60'
                        }`}
                      />
                    </div>

                    {/* Month Label (Jan, Feb, ..., Des) */}
                    <div className="mt-2.5 text-center w-full">
                      <p className={`text-[10px] sm:text-xs font-black uppercase tracking-tight truncate ${isPeak ? 'text-blue-700 font-extrabold' : 'text-slate-600'}`}>
                        {'shortLabel' in bar ? (bar as any).shortLabel : bar.label.replace('Tahun ', '')}
                      </p>
                      <p className="text-[9px] text-slate-400 font-semibold hidden sm:block">
                        {bar.qty > 0 ? `${bar.qty}` : '0'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Operational Insight & SKU Breakdown Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* Top SKUs Breakdown */}
          <div className="bg-slate-50/70 rounded-2xl p-4 sm:p-5 border border-slate-200/80">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Rincian Material Terbanyak Dipakai</span>
            </h3>

            <div className="space-y-3">
              {skuBreakdown.slice(0, 5).map((item, idx) => {
                const percentOfTotal = totalVolumePemakaian > 0 ? Math.round((item.qty / totalVolumePemakaian) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-800 font-semibold truncate max-w-[70%]" title={item.name}>
                        {idx + 1}. {item.name}
                      </span>
                      <span className="text-slate-700 font-bold">
                        {item.qty} {item.unit} ({percentOfTotal}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${percentOfTotal}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {skuBreakdown.length === 0 && (
                <p className="text-xs text-slate-400 italic">Belum ada data pemakaian untuk kategori ini.</p>
              )}
            </div>
          </div>

          {/* Operational Insight Card */}
          <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/90 rounded-2xl p-4 sm:p-5 border border-blue-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-800 uppercase tracking-tight mb-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Analisis Operasional Logistik</span>
              </div>
              <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-normal">
                Berdasarkan rekapitulasi <strong>{categoryConfig.title}</strong> {period === 'bulan' ? `Tahun ${selectedYear}` : 'Tahunan'}, tercatat total konsumsi sebanyak <strong>{activeAnalysis.total.toLocaleString('id-ID')} {categoryConfig.unitLabel}</strong> melalui <strong>{totalFrekuensi}</strong> transaksi pengambilan oleh tim pelayanan teknik &amp; gangguan.
              </p>
              <div className="mt-3 bg-white/80 backdrop-blur-xs rounded-xl p-3 border border-blue-200/60 text-xs text-slate-700 space-y-1">
                <p className="font-semibold text-blue-900">
                  Rekomendasi Petugas Gudang ULP Tanggul:
                </p>
                <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                  <li>Bulan dengan konsumsi tertinggi adalah <strong>{activeAnalysis.peak?.label}</strong> ({activeAnalysis.peak?.qty || 0} unit).</li>
                  <li>Pertahankan stok aman (safety stock) untuk <strong>{topMaterial?.name || 'material utama'}</strong> guna mengantisipasi lonjakan pekerjaan.</li>
                  <li>Lakukan pencocokan nomor Surat Jalan secara rutin untuk memastikan akuntabilitas MIMS.</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-blue-200/50 flex items-center justify-between text-[11px] text-blue-700 font-semibold">
              <span>Status: Akuntabel &amp; Terverifikasi</span>
              <span>MARVEL PLN ULP Tanggul</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. TABEL SELURUH PEMAKAIAN MATERIAL (KWH METER / MCB / KABEL SR / ASESORIS) */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-7 shadow-lg border border-slate-200/80 space-y-5 anim-fade-in-up">
        {/* Table Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Daftar Seluruh Pemakaian Material: {categoryConfig.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Rincian seluruh mutasi pengeluaran barang dari gudang ke lapangan {period === 'bulan' ? `(Tahun ${selectedYear})` : ''}
            </p>
          </div>

          {/* Search Input & SKU Filter */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Specific SKU in Category */}
            {skuBreakdown.length > 1 && (
              <div className="relative">
                <select
                  value={selectedSkuFilter}
                  onChange={e => setSelectedSkuFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs pr-8"
                >
                  <option value="all">Semua Jenis ({skuBreakdown.length} Item)</option>
                  {skuBreakdown.map((sku, i) => (
                    <option key={i} value={sku.name}>
                      {sku.name.length > 32 ? sku.name.substring(0, 32) + '...' : sku.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Live Search Input */}
            <div className="relative min-w-[220px] sm:min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari No APKT, Petugas, Regu..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/90 shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3 w-32">Tanggal</th>
                <th className="py-3 px-3 w-44">No. APKT / Transaksi</th>
                <th className="py-3 px-3 w-40">Petugas / Regu</th>
                <th className="py-3 px-4">Rincian Material Terpakai</th>
                <th className="py-3 px-3 w-28 text-center">Jumlah</th>
                <th className="py-3 px-3 w-28 text-center">Surat Jalan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTableData.map((row, idx) => {
                const sjNumber = getTransactionSuratJalanNumber(row.tx);

                return (
                  <tr key={row.tx.id || idx} className="hover:bg-blue-50/30 transition-colors">
                    {/* 1. Index */}
                    <td className="py-3 px-3 text-center text-slate-500 font-medium">
                      {idx + 1}
                    </td>

                    {/* 2. Tanggal */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">
                        {row.formattedDate}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {row.tx.timestamp ? row.tx.timestamp.split(' ')[1] || '08:00' : '08:00'} WIB
                      </div>
                    </td>

                    {/* 3. No APKT / Transaksi */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 truncate max-w-[170px]" title={row.tx.noGangguan || row.tx.id}>
                        {row.tx.noGangguan || row.tx.id}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        ID: {row.tx.id.substring(0, 10)}...
                      </div>
                    </td>

                    {/* 4. Petugas & Regu */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">
                        {row.tx.namaPetugas || 'Petugas Yandal'}
                      </div>
                      <div className="text-[11px] text-blue-600 font-medium">
                        Regu {row.tx.reguYandal || 'Tanggul'}
                      </div>
                    </td>

                    {/* 5. Detail Material & Quantity */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {row.categoryItems.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            <span className="font-semibold text-slate-800">
                              {item.name}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* 6. Total Qty in Category */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-xs">
                        {row.totalQty} {categoryConfig.unitLabel.split('/')[0].trim()}
                      </span>
                    </td>

                    {/* 7. Surat Jalan Button */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setSelectedTxForSuratJalan(row.tx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[11px] transition-colors cursor-pointer"
                        title={`Surat Jalan: ${sjNumber}`}
                      >
                        <FileText className="w-3 h-3" />
                        <span>Lihat SJ</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredTableData.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <p className="text-sm font-semibold">Tidak ada transaksi pemakaian yang sesuai kriteria.</p>
                    <p className="text-xs mt-1">Coba sesuaikan tahun, kata kunci pencarian, atau filter jenis material.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
          <span>
            Menampilkan <strong>{filteredTableData.length}</strong> dari <strong>{categoryUsageTx.length}</strong> transaksi pemakaian material
          </span>
          <span className="font-semibold text-slate-600">
            Data Terhubung Real-Time ke Gudang Logistik PLN ULP Tanggul
          </span>
        </div>
      </div>

      {/* Surat Jalan Modal Pop-up */}
      {selectedTxForSuratJalan && (
        <SuratJalanModal
          isOpen={!!selectedTxForSuratJalan}
          onClose={() => setSelectedTxForSuratJalan(null)}
          data={createSuratJalanFromTransaction(selectedTxForSuratJalan, { allTransactions: transactions })}
        />
      )}
    </div>
  );
};
