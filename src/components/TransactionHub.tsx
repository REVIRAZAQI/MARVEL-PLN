import React from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Wrench, ArrowRight, Sparkles } from 'lucide-react';

interface TransactionHubProps {
  onSelectAction: (action: 'pengambilan' | 'penerimaan' | 'pemakaian') => void;
}

export const TransactionHub: React.FC<TransactionHubProps> = ({ onSelectAction }) => {
  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-10 space-y-8 animate-in fade-in duration-300">
      {/* Title & Category Header (Tanpa tulisan ULP TANGGUL di atas judul) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-700 tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <span>MANAJEMEN MATERIAL</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0f2852] tracking-tight">
          TRANSAKSI
        </h1>
        <p className="text-sm sm:text-base text-slate-700 font-medium">
          Pilih sub menu transaksi material yang ingin dilakukan.
        </p>
      </div>

      {/* 3 Action Cards matching MARVEL System */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {/* Card 01: Menu Pengambilan Material */}
        <div
          onClick={() => onSelectAction('pengambilan')}
          className="relative bg-white/90 backdrop-blur-xl rounded-[28px] border border-white/80 p-7 shadow-xl hover:shadow-2xl transition-all cursor-pointer group flex flex-col justify-between overflow-hidden hover:-translate-y-1"
        >
          {/* Faded Watermark 01 */}
          <span className="absolute top-4 right-6 text-5xl sm:text-6xl font-black text-slate-200/60 select-none pointer-events-none transition-colors group-hover:text-blue-100/70">
            01
          </span>

          <div className="space-y-6 relative z-10">
            {/* Top Icon */}
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <ArrowDownToLine className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-blue-600 tracking-wider uppercase block">
                TRANSAKSI KELUAR
              </span>
              <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                Menu Pengambilan Material
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed pt-1">
                Kelola pencatatan material yang keluar dari gudang operasional.
              </p>
            </div>
          </div>

          {/* Bottom Action Link */}
          <div className="pt-8 flex items-center justify-between border-t border-slate-100/80 mt-6 relative z-10">
            <span className="text-xs sm:text-sm font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">
              Buka Menu
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center group-hover:translate-x-1 transition-all shadow-2xs">
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Card 02: Menu Penerimaan Material */}
        <div
          onClick={() => onSelectAction('penerimaan')}
          className="relative bg-white/90 backdrop-blur-xl rounded-[28px] border border-white/80 p-7 shadow-xl hover:shadow-2xl transition-all cursor-pointer group flex flex-col justify-between overflow-hidden hover:-translate-y-1"
        >
          {/* Faded Watermark 02 */}
          <span className="absolute top-4 right-6 text-5xl sm:text-6xl font-black text-slate-200/60 select-none pointer-events-none transition-colors group-hover:text-purple-100/70">
            02
          </span>

          <div className="space-y-6 relative z-10">
            {/* Top Icon */}
            <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <ArrowUpFromLine className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-purple-600 tracking-wider uppercase block">
                TRANSAKSI MASUK
              </span>
              <h2 className="text-xl font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                Menu Penerimaan Material
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed pt-1">
                Kelola pencatatan material yang masuk ke persediaan gudang.
              </p>
            </div>
          </div>

          {/* Bottom Action Link */}
          <div className="pt-8 flex items-center justify-between border-t border-slate-100/80 mt-6 relative z-10">
            <span className="text-xs sm:text-sm font-semibold text-slate-700 group-hover:text-purple-700 transition-colors">
              Buka Menu
            </span>
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center group-hover:translate-x-1 transition-all shadow-2xs">
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Card 03: Menu Pemakaian Material (Inputan Menyusul) */}
        <div
          onClick={() => onSelectAction('pemakaian')}
          className="relative bg-white/90 backdrop-blur-xl rounded-[28px] border border-white/80 p-7 shadow-xl hover:shadow-2xl transition-all cursor-pointer group flex flex-col justify-between overflow-hidden hover:-translate-y-1"
        >
          {/* Faded Watermark 03 */}
          <span className="absolute top-4 right-6 text-5xl sm:text-6xl font-black text-slate-200/60 select-none pointer-events-none transition-colors group-hover:text-amber-100/70">
            03
          </span>

          <div className="space-y-6 relative z-10">
            {/* Top Icon */}
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Wrench className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-600 tracking-wider uppercase block">
                  TRANSAKSI PEMAKAIAN
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-800 uppercase tracking-tight">
                  Menyusul
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                Menu Pemakaian Material
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed pt-1">
                Pencatatan dan pelaporan pemakaian material di lapangan (Inputan menyusul).
              </p>
            </div>
          </div>

          {/* Bottom Action Link */}
          <div className="pt-8 flex items-center justify-between border-t border-slate-100/80 mt-6 relative z-10">
            <span className="text-xs sm:text-sm font-semibold text-slate-700 group-hover:text-amber-700 transition-colors">
              Buka Menu
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center group-hover:translate-x-1 transition-all shadow-2xs">
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
