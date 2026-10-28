import React, { useState, useMemo } from 'react';
import { WarehouseTransaction } from '../types/warehouse';
import { getSatuan, getTransactionSuratJalanNumber } from '../utils/suratJalanHelper';
import { 
  Printer, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Lock, 
  FileText, 
  ShieldCheck, 
  User, 
  Layers, 
  Calendar,
  X,
  Package,
  RotateCcw
} from 'lucide-react';

interface MonitoringMaterialListProps {
  type: 'keluar' | 'masuk';
  transactions: WarehouseTransaction[];
  onPrintSuratJalan?: (tx: WarehouseTransaction) => void;
  highlightTxId?: string | null;
}

export const MonitoringMaterialList: React.FC<MonitoringMaterialListProps> = ({
  type,
  transactions,
  onPrintSuratJalan,
  highlightTxId
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchCategory, setSearchCategory] = useState<'all' | 'sj' | 'petugas' | 'material'>('all');

  // Filter transactions by type: Keluar vs Masuk
  const categoryTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (type === 'masuk') {
        return t.admMaterial === 'Masuk';
      }
      return t.admMaterial === 'Keluar' || !t.admMaterial;
    });
  }, [transactions, type]);

  // Check if user has entered an active search query or picked a date
  const hasActiveSearch = searchTerm.trim().length > 0 || searchDate.trim().length > 0;

  // Filtered by Tab & Google-Style Search
  const displayList = useMemo(() => {
    if (!hasActiveSearch) return [];

    return categoryTransactions.filter(t => {
      // Tab filter
      if (activeTab === 'pending' && t.status !== 'Pending') return false;
      if (activeTab === 'approved' && t.status !== 'Approved' && t.status !== undefined) return false;
      if (activeTab === 'rejected' && t.status !== 'Rejected') return false;

      // Date filter
      if (searchDate) {
        // Date can be DD/MM/YYYY or YYYY-MM-DD or standard Indonesian date string
        const [year, month, day] = searchDate.split('-');
        const padDay = day?.padStart(2, '0');
        const padMonth = month?.padStart(2, '0');
        const patternSlash = `${padDay}/${padMonth}/${year}`;
        const patternShortYear = `${padDay}/${padMonth}/${year.slice(2)}`;
        
        const txDate = t.tanggal || (t.timestamp ? t.timestamp.split(' ')[0] : '');
        const matchDate = txDate.includes(searchDate) || 
                          txDate.includes(patternSlash) || 
                          txDate.includes(patternShortYear);

        if (!matchDate) return false;
      }

      // Text query filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const sjNumber = ((t.column1 || '') + ' ' + getTransactionSuratJalanNumber(t, transactions)).toLowerCase();
        const petugas = ((t.namaPetugas || '') + ' ' + (t.petugasPelayananTeknik || '')).toLowerCase();
        const peruntukan = (t.noGangguan || t.keterangan || '').toLowerCase();
        const materialNames = (t.items || []).map(i => (i.materialName || '').toLowerCase()).join(' ');
        const normalisasiCodes = (t.items || []).map(i => (i.normalisasi || '').toLowerCase()).join(' ');

        if (searchCategory === 'sj') {
          return sjNumber.includes(query);
        }
        if (searchCategory === 'petugas') {
          return petugas.includes(query);
        }
        if (searchCategory === 'material') {
          return materialNames.includes(query) || normalisasiCodes.includes(query);
        }

        // 'all' category searches all fields
        return sjNumber.includes(query) || 
               petugas.includes(query) || 
               materialNames.includes(query) || 
               normalisasiCodes.includes(query) || 
               peruntukan.includes(query);
      }

      return true;
    });
  }, [categoryTransactions, activeTab, searchTerm, searchDate, searchCategory, hasActiveSearch, transactions]);

  // Tab counts for active search results
  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    displayList.forEach(t => {
      if (t.status === 'Pending') pending++;
      else if (t.status === 'Rejected') rejected++;
      else approved++;
    });

    return {
      all: displayList.length,
      pending,
      approved,
      rejected
    };
  }, [displayList]);

  const handleResetSearch = () => {
    setSearchTerm('');
    setSearchDate('');
    setSearchCategory('all');
    setActiveTab('all');
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-[28px] border border-white/80 p-6 sm:p-9 shadow-xl space-y-6">
      {/* Header Section */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[11px] font-bold text-blue-700 uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>STATUS MUTASI REAL-TIME</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#0f2852] tracking-tight">
          MONITORING MATERIAL
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Gunakan kolom pencarian di bawah untuk memfilter data transaksi berdasarkan nomor surat jalan, petugas, material, atau tanggal.
        </p>
      </div>

      {/* Google-Style Search Engine Bar */}
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="relative flex items-center bg-white rounded-full border-2 border-slate-200 hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 shadow-sm hover:shadow-md transition-all px-4 py-2 sm:py-2.5">
          <Search className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={
              searchCategory === 'sj'
                ? 'Ketik No. Surat Jalan (contoh: 22/10/SJ...)'
                : searchCategory === 'petugas'
                ? 'Ketik Nama Petugas (contoh: DI-01472_DWI...)'
                : searchCategory === 'material'
                ? 'Ketik Nama Material atau Normalisasi...'
                : 'Cari No. Surat Jalan, Petugas, Material, atau Keterangan...'
            }
            className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
          />

          {/* Clear button if active */}
          {hasActiveSearch && (
            <button
              type="button"
              onClick={handleResetSearch}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors mr-1 cursor-pointer"
              title="Reset pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Inline Date Filter Toggle Button */}
          <div className="relative shrink-0 border-l border-slate-200 pl-2 ml-1 flex items-center">
            <input
              type="date"
              value={searchDate}
              onChange={e => setSearchDate(e.target.value)}
              className="text-xs text-slate-700 font-medium bg-transparent cursor-pointer focus:outline-none w-32"
              title="Cari berdasarkan tanggal"
            />
          </div>
        </div>

        {/* Filter Category Pills matching Google Search Model */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap text-xs">
          <span className="text-[11px] text-slate-400 font-semibold mr-1">Kategori Cari:</span>
          
          <button
            type="button"
            onClick={() => setSearchCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              searchCategory === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Data
          </button>

          <button
            type="button"
            onClick={() => setSearchCategory('sj')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              searchCategory === 'sj'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>No. Surat Jalan</span>
          </button>

          <button
            type="button"
            onClick={() => setSearchCategory('petugas')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              searchCategory === 'petugas'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <User className="w-3 h-3" />
            <span>Petugas</span>
          </button>

          <button
            type="button"
            onClick={() => setSearchCategory('material')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              searchCategory === 'material'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Package className="w-3 h-3" />
            <span>Material</span>
          </button>

          {searchDate && (
            <button
              type="button"
              onClick={() => setSearchDate('')}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 hover:bg-amber-200"
              title="Hapus filter tanggal"
            >
              <Calendar className="w-3 h-3" />
              <span>Tgl: {searchDate}</span>
              <X className="w-3 h-3 ml-0.5" />
            </button>
          )}
        </div>
      </div>

      {/* CASE 1: SEARCH IS EMPTY (CONTENT HIDDEN BY DEFAULT) */}
      {!hasActiveSearch && (
        <div className="py-12 sm:py-16 text-center max-w-md mx-auto space-y-4 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mx-auto shadow-sm">
            <Search className="w-8 h-8 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-800">
              Pencarian Data Monitoring Material
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 leading-relaxed">
              Ketikkan nomor surat jalan, nama petugas, material, atau pilih tanggal pada kolom pencarian di atas untuk menampilkan rincian data transaksi yang Anda butuhkan.
            </p>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] text-slate-400 font-semibold block w-full">Pencarian cepat:</span>
            <button
              type="button"
              onClick={() => setSearchTerm('SJ')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-[11px] font-medium text-slate-600 border border-slate-200 transition-colors"
            >
              Semua Surat Jalan
            </button>
            <button
              type="button"
              onClick={() => setSearchTerm('KWH')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-[11px] font-medium text-slate-600 border border-slate-200 transition-colors"
            >
              KWH Meter
            </button>
            <button
              type="button"
              onClick={() => setSearchTerm('Kabel')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-[11px] font-medium text-slate-600 border border-slate-200 transition-colors"
            >
              Kabel
            </button>
          </div>
        </div>
      )}

      {/* CASE 2: SEARCH IS ACTIVE -> SHOW RESULTS */}
      {hasActiveSearch && (
        <div className="space-y-4 animate-in fade-in duration-300 pt-2 border-t border-slate-100">
          {/* Search Result Summary & Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">
                Hasil Pencarian:
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono text-xs font-black">
                {displayList.length} Transaksi Ditemukan
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                Semua ({counts.all})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'pending'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-800 border border-amber-200/60 hover:bg-amber-100'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Pending ({counts.pending})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('approved')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'approved'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Disetujui ({counts.approved})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('rejected')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === 'rejected'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-rose-50 text-rose-800 border border-rose-200/60 hover:bg-rose-100'
                }`}
              >
                <XCircle className="w-3 h-3" />
                <span>Ditolak ({counts.rejected})</span>
              </button>

              <button
                type="button"
                onClick={handleResetSearch}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center gap-1 ml-1"
                title="Sembunyikan hasil"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Sembunyikan</span>
              </button>
            </div>
          </div>

          {/* Transaction Cards */}
          {displayList.length === 0 ? (
            <div className="py-12 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
              <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600">Tidak ada transaksi ditemukan</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Coba ganti kata kunci pencarian No. SJ, nama petugas, material, atau pilih tanggal yang lain.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayList.map((tx, idx) => {
                const isPending = tx.status === 'Pending';
                const isApproved = tx.status === 'Approved' || (!tx.status && !isPending);
                const isRejected = tx.status === 'Rejected';
                const isHighlighted = highlightTxId && tx.id === highlightTxId;
                const sjNumber = getTransactionSuratJalanNumber(tx, transactions);

                return (
                  <div
                    key={tx.id || idx}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      isHighlighted
                        ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/40 shadow-md animate-pulse'
                        : isPending
                        ? 'bg-amber-50/30 border-amber-200/70 hover:bg-amber-50/50'
                        : isApproved
                        ? 'bg-white border-slate-200/90 hover:border-blue-300 hover:shadow-md'
                        : 'bg-rose-50/30 border-rose-200/70'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left Column: Number, Date, Jenis Transaksi */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-400">
                            #{idx + 1}
                          </span>

                          {/* Surat Jalan Number Badge */}
                          {isApproved ? (
                            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-mono text-xs font-black flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              <span>{tx.column1 || sjNumber}</span>
                            </span>
                          ) : isPending ? (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-mono text-xs font-bold flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" />
                              <span>Menunggu Approval</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 border border-rose-300 font-mono text-xs font-bold flex items-center gap-1.5">
                              <XCircle className="w-3.5 h-3.5 text-rose-700" />
                              <span>Ditolak</span>
                            </span>
                          )}

                          {/* Date Badge */}
                          <span className="text-xs text-slate-500 font-medium">
                            {tx.tanggal || (tx.timestamp ? tx.timestamp.split(' ')[0] : '-')}
                          </span>

                          {/* Jenis Transaksi Badge */}
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                            {tx.noGangguan || tx.keterangan || (type === 'masuk' ? 'Penerimaan UP3' : 'Pengambilan')}
                          </span>
                        </div>

                        {/* Officer & Team Info */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                          <span className="flex items-center gap-1 font-medium">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            Petugas: <strong className="text-slate-800">{tx.namaPetugas || 'Petugas'}</strong>
                          </span>
                          {tx.reguYandal && (
                            <span className="text-slate-500">
                              Regu: <strong className="text-slate-700">{tx.reguYandal}</strong>
                            </span>
                          )}
                          {(tx.security || tx.petugasSecurity) && (
                            <span className="flex items-center gap-1 text-slate-500">
                              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                              Security: <strong className="text-slate-700">{tx.security || tx.petugasSecurity}</strong>
                            </span>
                          )}
                        </div>

                        {/* Material Items Details */}
                        <div className="pt-1 flex flex-wrap gap-1.5">
                          {tx.items && tx.items.length > 0 ? (
                            tx.items.map((item, iIdx) => (
                              <span
                                key={iIdx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100/90 text-slate-700 text-[11.5px] border border-slate-200/80 font-medium"
                              >
                                <span className="truncate max-w-[280px] sm:max-w-[360px] font-semibold text-slate-800">
                                  {item.materialName}
                                </span>
                                <span className="px-1.5 py-0.2 rounded bg-white text-blue-700 font-bold font-mono text-[11px] border border-slate-200">
                                  {item.quantity} {getSatuan(item.materialName)}
                                </span>
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">Tidak ada rincian material</span>
                          )}
                        </div>
                      </div>

                      {/* Right Column: Status & Cetak Action */}
                      <div className="flex sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                        {/* Status Note */}
                        <div className="text-left sm:text-right">
                          {isApproved && (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Telah Disetujui</span>
                              </span>
                              {tx.approvedByAdmin && (
                                <p className="text-[10px] text-slate-400">
                                  Oleh {tx.approvedByAdmin}
                                </p>
                              )}
                            </div>
                          )}

                          {isPending && (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                                <Clock className="w-3 h-3 animate-spin" />
                                <span>Menunggu Approval</span>
                              </span>
                              <p className="text-[10.5px] text-slate-500 max-w-[200px]">
                                Masuk ke Menu Approval untuk diverifikasi Admin / MULP
                              </p>
                            </div>
                          )}

                          {isRejected && (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                <XCircle className="w-3 h-3" />
                                <span>Pengajuan Ditolak</span>
                              </span>
                              {tx.approvalNote && (
                                <p className="text-[10px] text-rose-500 italic max-w-[200px]">
                                  {tx.approvalNote}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action Button: Print or Locked Notice */}
                        {isApproved ? (
                          <button
                            type="button"
                            onClick={() => onPrintSuratJalan && onPrintSuratJalan(tx)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                            <span>Cetak Surat Jalan</span>
                          </button>
                        ) : isPending ? (
                          <div
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold border border-slate-200 cursor-not-allowed select-none"
                            title="Surat Jalan hanya dapat dicetak setelah transaksi disetujui Admin/MULP"
                          >
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Cetak Dikunci</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-400 text-xs font-bold border border-rose-200 cursor-not-allowed select-none">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Tidak Dapat Dicetak</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
