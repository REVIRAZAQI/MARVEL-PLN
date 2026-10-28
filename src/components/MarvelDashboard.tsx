import React from 'react';
import { MaterialItem, WarehouseTransaction } from '../types/warehouse';
import {
  ListFilter,
  ShieldCheck,
  BookOpen,
  BarChart3,
  Database,
  ArrowRight,
  FileText,
  Zap,
  Cable,
  Component,
  AlertTriangle,
  PieChart,
  TrendingUp,
  ChevronRight
} from 'lucide-react';

interface MarvelDashboardProps {
  materials: MaterialItem[];
  transactions: WarehouseTransaction[];
  onNavigate: (tab: string, filterCategory?: string) => void;
  onSelectCategoryAnalysis?: (category: 'KWH Meter' | 'MCB' | 'Kabel SR' | 'ASESORIS DAN MATERIAL JARINGAN') => void;
}

export const MarvelDashboard: React.FC<MarvelDashboardProps> = ({
  materials,
  transactions,
  onNavigate,
  onSelectCategoryAnalysis
}) => {
  // Compute key metrics
  const totalMaterials = materials.length;
  const pendingApprovals = transactions.filter(t => t.status === 'Pending').length;
  const unmanagedMims = transactions.filter(t => !t.column1 || t.column1 === '').length;
  const gangguanCount = transactions.filter(t =>
    (t.noGangguan && t.noGangguan.toLowerCase().includes('gangguan')) ||
    (t.keterangan && t.keterangan.toLowerCase().includes('gangguan'))
  ).length;

  // Category counts
  const kwhCount = materials.filter(m => m.category === 'KWH & MCB' && m.name.toLowerCase().includes('kwh')).length;
  const mcbCount = materials.filter(m => m.category === 'KWH & MCB' && m.name.toLowerCase().includes('mcb')).length;
  const kabelCount = materials.filter(m => m.category === 'Kabel & SR').length;
  const asesorisCount = materials.filter(m => m.category !== 'KWH & MCB' && m.category !== 'Kabel & SR').length;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Hero Banner matching dashboard_ce691883.JPG */}
      <div className="relative w-full rounded-3xl overflow-hidden shadow-xl border-0">
        <div
          className="w-full h-44 sm:h-52 bg-cover bg-right sm:bg-center relative flex items-center px-6 sm:px-12"
          style={{
            backgroundImage: `url('/assets/aistudio/dashboard_hero.jpg')`
          }}
        >
          {/* Subtle dark gradient overlay to guarantee text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#031c4f] via-[#031c4f]/80 to-transparent pointer-events-none" />

          {/* Banner Typography */}
          <div className="relative z-10 max-w-xl text-white">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight uppercase leading-none drop-shadow-md">
              DASHBOARD
            </h1>
            <p className="text-xs sm:text-sm md:text-base font-normal text-sky-100/90 mt-2 sm:mt-3 tracking-wide">
              Material Akuntabel Resik Visible Cepat Lengkap
            </p>
          </div>
        </div>
      </div>

      {/* 2. Quick Navigation Bar (5 Pills) matching dashboard_ce691883.JPG */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2 sm:p-3 shadow-lg border border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
        {/* Pill 1: TRANSAKSI */}
        <button
          onClick={() => onNavigate('transaksi')}
          className="flex items-center justify-between px-2.5 sm:px-3.5 py-2.5 sm:py-3 rounded-xl bg-white hover:bg-blue-50/50 border border-slate-200/90 hover:border-blue-300 shadow-2xs hover:shadow-xs transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <ListFilter className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-800 tracking-tight sm:tracking-wide truncate">
              TRANSAKSI
            </span>
          </div>
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-500 text-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform shrink-0 ml-1">
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 stroke-[2.5]" />
          </div>
        </button>

        {/* Pill 2: APPROVAL */}
        <button
          onClick={() => onNavigate('approvals')}
          className="flex items-center justify-between px-2.5 sm:px-3.5 py-2.5 sm:py-3 rounded-xl bg-white hover:bg-emerald-50/50 border border-slate-200/90 hover:border-emerald-300 shadow-2xs hover:shadow-xs transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-800 tracking-tight sm:tracking-wide truncate">
              APPROVAL
            </span>
          </div>
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform shrink-0 ml-1">
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 stroke-[2.5]" />
          </div>
        </button>

        {/* Pill 3: LOGBOOK */}
        <button
          onClick={() => onNavigate('logbook')}
          className="flex items-center justify-between px-2.5 sm:px-3.5 py-2.5 sm:py-3 rounded-xl bg-white hover:bg-amber-50/50 border border-slate-200/90 hover:border-amber-300 shadow-2xs hover:shadow-xs transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-800 tracking-tight sm:tracking-wide truncate">
              LOGBOOK
            </span>
          </div>
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-500 text-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform shrink-0 ml-1">
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 stroke-[2.5]" />
          </div>
        </button>

        {/* Pill 4: STATISTIK */}
        <button
          onClick={() => onNavigate('analytics')}
          className="flex items-center justify-between px-2.5 sm:px-3.5 py-2.5 sm:py-3 rounded-xl bg-white hover:bg-purple-50/50 border border-slate-200/90 hover:border-purple-300 shadow-2xs hover:shadow-xs transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-800 tracking-tight sm:tracking-wide truncate">
              STATISTIK
            </span>
          </div>
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-600 text-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform shrink-0 ml-1">
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 stroke-[2.5]" />
          </div>
        </button>

        {/* Pill 5: DATA MASTER */}
        <button
          onClick={() => onNavigate('master')}
          className="flex items-center justify-between px-2.5 sm:px-3.5 py-2.5 sm:py-3 rounded-xl bg-white hover:bg-sky-50/50 border border-slate-200/90 hover:border-sky-300 shadow-2xs hover:shadow-xs transition-all group col-span-2 sm:col-span-1 cursor-pointer"
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Database className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-800 tracking-tight sm:tracking-wide truncate">
              DATA MASTER
            </span>
          </div>
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-sky-500 text-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform shrink-0 ml-1">
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 stroke-[2.5]" />
          </div>
        </button>
      </div>

      {/* 3. 4 Category Cards matching dashboard_ce691883.JPG */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: KWH METER */}
        <div
          onClick={() => {
            if (onSelectCategoryAnalysis) onSelectCategoryAnalysis('KWH Meter');
            else onNavigate('category_analysis', 'KWH Meter');
          }}
          className="rounded-3xl overflow-hidden shadow-lg border-0 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col"
        >
          <div className="h-56 w-full overflow-hidden relative bg-slate-900">
            <img
              src="/assets/aistudio/card_kwh_meter.jpg"
              alt="KWH Meter"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="bg-[#0b5cbe] text-white p-3.5 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wide leading-tight">
                  KWH METER
                </div>
                <div className="text-[10px] text-blue-100 font-medium leading-tight">
                  Analisis Pemakaian ({kwhCount > 0 ? `${kwhCount} SKU` : 'Tersedia'})
                </div>
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-white text-[#0b5cbe] flex items-center justify-center group-hover:translate-x-0.5 transition-transform shrink-0">
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Card 2: MCB */}
        <div
          onClick={() => {
            if (onSelectCategoryAnalysis) onSelectCategoryAnalysis('MCB');
            else onNavigate('category_analysis', 'MCB');
          }}
          className="rounded-3xl overflow-hidden shadow-lg border-0 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col"
        >
          <div className="h-56 w-full overflow-hidden relative bg-slate-900">
            <img
              src="/assets/aistudio/card_mcb.jpg"
              alt="MCB"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="bg-[#0e6f46] text-white p-3.5 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wide leading-tight">
                  MCB
                </div>
                <div className="text-[10px] text-emerald-100 font-medium leading-tight">
                  Analisis Pemakaian ({mcbCount > 0 ? `${mcbCount} SKU` : 'Tersedia'})
                </div>
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-white text-[#0e6f46] flex items-center justify-center group-hover:translate-x-0.5 transition-transform shrink-0">
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Card 3: KABEL SR */}
        <div
          onClick={() => {
            if (onSelectCategoryAnalysis) onSelectCategoryAnalysis('Kabel SR');
            else onNavigate('category_analysis', 'Kabel SR');
          }}
          className="rounded-3xl overflow-hidden shadow-lg border-0 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col"
        >
          <div className="h-56 w-full overflow-hidden relative bg-slate-900">
            <img
              src="/assets/aistudio/card_kabel_sr.jpg"
              alt="Kabel SR"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="bg-[#b34710] text-white p-3.5 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <Cable className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wide leading-tight">
                  KABEL SR
                </div>
                <div className="text-[10px] text-amber-100 font-medium leading-tight">
                  Analisis Pemakaian ({kabelCount > 0 ? `${kabelCount} SKU` : 'Tersedia'})
                </div>
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-white text-[#b34710] flex items-center justify-center group-hover:translate-x-0.5 transition-transform shrink-0">
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Card 4: ASESORIS JARINGAN */}
        <div
          onClick={() => {
            if (onSelectCategoryAnalysis) onSelectCategoryAnalysis('ASESORIS DAN MATERIAL JARINGAN');
            else onNavigate('category_analysis', 'ASESORIS DAN MATERIAL JARINGAN');
          }}
          className="rounded-3xl overflow-hidden shadow-lg border-0 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col"
        >
          <div className="h-56 w-full overflow-hidden relative bg-slate-900">
            <img
              src="/assets/aistudio/card_asesoris.jpg"
              alt="Asesoris Jaringan"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="bg-[#5b1f8b] text-white p-3.5 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <Component className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wide leading-tight">
                  ASESORIS JARINGAN
                </div>
                <div className="text-[10px] text-purple-100 font-medium leading-tight">
                  Analisis Pemakaian ({asesorisCount > 0 ? `${asesorisCount} SKU` : 'Tersedia'})
                </div>
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-white text-[#5b1f8b] flex items-center justify-center group-hover:translate-x-0.5 transition-transform shrink-0">
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. 3 Bottom Stats Widgets matching dashboard_ce691883.JPG */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Widget 1: STATISTIK PENGAMBILAN TERBANYAK */}
        <div
          onClick={() => onNavigate('analytics')}
          className="bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-md border border-slate-200/80 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  STATISTIK PENGAMBILAN TERBANYAK
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Menggunakan Diagram Bar
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-end justify-between">
            {/* Visual 3D style bar graph */}
            <div className="flex items-end gap-2 h-16 pt-2">
              <div className="w-4 bg-blue-300 rounded-t-sm h-7" />
              <div className="w-4 bg-blue-400 rounded-t-sm h-10" />
              <div className="w-4 bg-blue-500 rounded-t-sm h-14" />
              <div className="w-4 bg-blue-600 rounded-t-sm h-16" />
            </div>
            <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Widget 2: STATISTIK TRANSAKSI YANG BELUM DI PROSES MIMS */}
        <div
          onClick={() => onNavigate('approvals')}
          className="bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-md border border-slate-200/80 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <PieChart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  STATISTIK TRANSAKSI YANG BELUM DI PROSES MIMS
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {pendingApprovals} Pending Approval · {unmanagedMims} Antrian MIMS
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-end justify-between">
            {/* Visual Pie Graphic */}
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="3.8"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.8"
                  strokeDasharray="75, 100"
                  strokeDashoffset="0"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="3.8"
                  strokeDasharray="25, 100"
                  strokeDashoffset="-75"
                />
              </svg>
            </div>
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Widget 3: STATISTIK GANGGUAN */}
        <div
          onClick={() => onNavigate('transactions')}
          className="bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-md border border-slate-200/80 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  STATISTIK GANGGUAN
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {gangguanCount} Penanganan Gangguan Tercatat
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-end justify-between">
            {/* Visual Red Cluster / Bar Graphic */}
            <div className="flex items-end gap-1.5 h-16 pt-2">
              <div className="w-3.5 bg-rose-400 rounded-t-sm h-12" />
              <div className="w-3.5 bg-rose-500 rounded-t-sm h-16" />
              <div className="w-3.5 bg-rose-300 rounded-t-sm h-8" />
              <div className="w-3.5 bg-rose-600 rounded-t-sm h-4" />
            </div>
            <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
