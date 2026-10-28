import React from 'react';
import { BookOpen, History, ArrowRight, SlidersHorizontal, Settings, ArrowLeftRight } from 'lucide-react';

interface LogbookHubProps {
  onSelectAction: (action: 'stock' | 'transactions' | 'transaksi_material') => void;
  onOpenControlPanel: () => void;
}

export const LogbookHub: React.FC<LogbookHubProps> = ({
  onSelectAction,
  onOpenControlPanel
}) => {
  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-12 space-y-8 animate-in fade-in duration-300 relative">
      {/* Title & Category Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-700 tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <span>LOGBOOK MATERIAL</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0f2852] tracking-tight">
          LOGBOOK
        </h1>
        <p className="text-sm sm:text-base text-slate-700 font-medium">
          Pilih menu logbook yang ingin dibuka.
        </p>
      </div>

      {/* 3 Action Cards matching PLN system */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 pt-2">
        {/* Card 01: E-Catalog */}
        <div
          onClick={() => onSelectAction('stock')}
          className="relative bg-white/90 backdrop-blur-xl rounded-[28px] border border-white/80 p-7 sm:p-8 shadow-xl hover:shadow-2xl transition-all cursor-pointer group flex flex-col justify-between overflow-hidden hover:-translate-y-1"
        >
          {/* Faded Watermark 01 */}
          <span className="absolute top-4 right-6 text-5xl sm:text-6xl font-black text-slate-200/60 select-none pointer-events-none transition-colors group-hover:text-blue-100/70">
            01
          </span>

          <div className="space-y-6 relative z-10">
            {/* Top Icon */}
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-blue-600 tracking-wider uppercase block">
                KATALOG MATERIAL
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                E-Catalog
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed pt-1">
                Lihat katalog material untuk membantu pencarian dan referensi barang.
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

        {/* Card 02: Historis Mutasi */}
        <div
          onClick={() => onSelectAction('transactions')}
          className="relative bg-white/90 backdrop-blur-xl rounded-[28px] border border-white/80 p-7 sm:p-8 shadow-xl hover:shadow-2xl transition-all cursor-pointer group flex flex-col justify-between overflow-hidden hover:-translate-y-1"
        >
          {/* Faded Watermark 02 */}
          <span className="absolute top-4 right-6 text-5xl sm:text-6xl font-black text-slate-200/60 select-none pointer-events-none transition-colors group-hover:text-purple-100/70">
            02
          </span>

          <div className="space-y-6 relative z-10">
            {/* Top Icon */}
            <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <History className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-purple-600 tracking-wider uppercase block">
                RIWAYAT PERSEDIAAN
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                Historis Mutasi
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed pt-1">
                Lihat riwayat perubahan stok material yang tercatat.
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

        {/* Card 03: Transaksi Material matching Gambar 1 */}
        <div
          onClick={() => onSelectAction('transaksi_material')}
          className="relative bg-white/90 backdrop-blur-xl rounded-[28px] border border-white/80 p-7 sm:p-8 shadow-xl hover:shadow-2xl transition-all cursor-pointer group flex flex-col justify-between overflow-hidden hover:-translate-y-1"
        >
          {/* Faded Watermark 03 */}
          <span className="absolute top-4 right-6 text-5xl sm:text-6xl font-black text-slate-200/60 select-none pointer-events-none transition-colors group-hover:text-teal-100/70">
            03
          </span>

          <div className="space-y-6 relative z-10">
            {/* Top Icon */}
            <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <ArrowLeftRight className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-teal-600 tracking-wider uppercase block">
                TRANSAKSI PER MATERIAL
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                Transaksi Material
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed pt-1">
                Rekap mutasi masuk, keluar, dan saldo berjalan per material sesuai tanggal.
              </p>
            </div>
          </div>

          {/* Bottom Action Link */}
          <div className="pt-8 flex items-center justify-between border-t border-slate-100/80 mt-6 relative z-10">
            <span className="text-xs sm:text-sm font-semibold text-slate-700 group-hover:text-teal-700 transition-colors">
              Buka Menu
            </span>
            <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center group-hover:translate-x-1 transition-all shadow-2xs">
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel Button matching bottom left of tampilan_logbook_51e97756.JPG */}
      <div className="pt-8">
        <button
          onClick={onOpenControlPanel}
          className="px-4 py-2 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs hover:shadow-xs transition-all flex items-center gap-2"
        >
          <Settings className="w-3.5 h-3.5 text-slate-500" />
          <span>Control Panel</span>
        </button>
      </div>
    </div>
  );
};
