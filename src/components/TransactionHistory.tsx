import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { WarehouseTransaction, SuratJalanData } from '../types/warehouse';
import {
  Search,
  ExternalLink,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Clock,
  ArrowUpDown,
  CheckCircle2,
  Upload,
  Calendar,
  X,
  Eye,
  FileText,
  CheckSquare,
  Square,
  Printer,
  Loader2,
  ChevronDown,
  ArrowDownToLine,
  ArrowUpFromLine,
  ShieldCheck,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowLeftRight,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import {
  createSuratJalanFromTransaction,
  buildMonthlySuratJalanNumberMap,
  getTransactionSuratJalanNumber,
  getNormalisasiCode
} from '../utils/suratJalanHelper';
import {
  downloadCollectiveSuratJalanPDF,
  printCollectiveSuratJalanViaIframe
} from '../utils/suratJalanPdfGenerator';
import {
  sortTransactionsByDateTime,
  parseDateToEpoch,
  exportTransactionsToExcel,
  exportTransactionsToSpreadsheetCSV,
  parseSpreadsheetPasteOrCsv,
  parseXlsxBuffer
} from '../utils/spreadsheetSync';
import { mergeSpreadsheetTransactions, deleteWarehouseTransactions } from '../utils/inventoryStore';
import { INITIAL_TRANSACTIONS } from '../data/initialTransactions';
import { SuratJalanModal } from './SuratJalanModal';
import { useModalScrollLock, forceUnlockScroll } from '../utils/modalScrollLock';

interface TransactionHistoryProps {
  transactions: WarehouseTransaction[];
  onViewStockCard: (materialId: string) => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  onViewStockCard
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Keluar' | 'Masuk' | 'Return'>('All');
  const [reguFilter, setReguFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Approved' | 'Pending'>('All');

  // Date Range Filter
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // 'desc' = terbaru, 'asc' = terlama

  // Pagination state (10 / 50 / 100 / Semua)
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Horizontal Table Scroll State & Ref
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0); // 0 to 100%
  const [maxScrollWidth, setMaxScrollWidth] = useState<number>(0);

  // Surat Jalan Modal State
  const [selectedSuratJalan, setSelectedSuratJalan] = useState<SuratJalanData | null>(null);
  const [isSuratJalanOpen, setIsSuratJalanOpen] = useState(false);

  // Collective Selection for Surat Jalan PDF/Print/Excel
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [isDownloadingCollective, setIsDownloadingCollective] = useState(false);
  const [isPrintingCollective, setIsPrintingCollective] = useState(false);
  const [collectiveFeedback, setCollectiveFeedback] = useState<string | null>(null);

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  // Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);


  // Delete Mutasi Modal & Collective State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [txsToDelete, setTxsToDelete] = useState<WarehouseTransaction[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useModalScrollLock(isDeleteModalOpen);



  // Monthly resetting Surat Jalan number map (Approved transactions only)
  const suratJalanMap = useMemo(() => {
    return buildMonthlySuratJalanNumberMap(transactions);
  }, [transactions]);

  const handleOpenSuratJalan = (tx: WarehouseTransaction) => {
    const sjNumber =
      suratJalanMap.get(tx.id) ||
      getTransactionSuratJalanNumber(tx, transactions);

    const sj = createSuratJalanFromTransaction(tx, {
      nomorSurat: sjNumber,
      allTransactions: transactions
    });
    setSelectedSuratJalan(sj);
    setIsSuratJalanOpen(true);
  };

  const reguList = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.reguYandal) set.add(t.reguYandal);
    });
    return Array.from(set);
  }, [transactions]);

  // Calculate start & end epoch for date range filter
  const dateRangeBounds = useMemo(() => {
    const startEpoch = startDate ? parseDateToEpoch(startDate) : null;
    const endEpoch = endDate ? parseDateToEpoch(endDate) + (24 * 60 * 60 * 1000 - 1) : null;
    return { startEpoch, endEpoch };
  }, [startDate, endDate]);

  // Filter and sort transactions
  const filteredAndSorted = useMemo(() => {
    const filtered = transactions.filter(t => {
      if (typeFilter !== 'All' && t.admMaterial !== typeFilter) return false;
      if (reguFilter !== 'All' && t.reguYandal !== reguFilter) return false;

      const isApproved = t.status === 'Approved' || (!t.status && t.createdByRole !== 'Petugas Gudang');
      if (statusFilter === 'Approved' && !isApproved) return false;
      if (statusFilter === 'Pending' && t.status !== 'Pending') return false;

      // Filter by Date Range (Cell B Tanggal: dari startDate s/d endDate)
      if (dateRangeBounds.startEpoch !== null || dateRangeBounds.endEpoch !== null) {
        const dateStr = t.tanggal || (t.timestamp ? t.timestamp.split(' ')[0] : '');
        const txEpoch = parseDateToEpoch(dateStr);
        if (dateRangeBounds.startEpoch !== null && txEpoch < dateRangeBounds.startEpoch) {
          return false;
        }
        if (dateRangeBounds.endEpoch !== null && txEpoch > dateRangeBounds.endEpoch) {
          return false;
        }
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const sjNum = (suratJalanMap.get(t.id) || t.column1 || '').toLowerCase();
        const matchSj = sjNum.includes(q);
        const matchTicket = (t.noGangguan || '').toLowerCase().includes(q);
        const matchOfficer = (t.namaPetugas || '').toLowerCase().includes(q);
        const matchSec = (t.security || t.petugasSecurity || '').toLowerCase().includes(q);
        const matchPemberi = (t.pemberiMaterial || '').toLowerCase().includes(q);
        const matchItem = t.items.some(i => i.materialName.toLowerCase().includes(q));
        const matchDate = (t.tanggal || '').toLowerCase().includes(q);
        if (!matchSj && !matchTicket && !matchOfficer && !matchSec && !matchPemberi && !matchItem && !matchDate) {
          return false;
        }
      }

      return true;
    });

    return sortTransactionsByDateTime(filtered, sortOrder);
  }, [transactions, search, typeFilter, reguFilter, statusFilter, dateRangeBounds, sortOrder, suratJalanMap]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, reguFilter, statusFilter, startDate, endDate, pageSize]);

  // Pagination calculation
  const totalItems = filteredAndSorted.length;
  const isAllPages = pageSize <= 0;
  const totalPages = isAllPages ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  
  const displayedRows = useMemo(() => {
    if (isAllPages) return filteredAndSorted;
    const startIdx = (currentPage - 1) * pageSize;
    return filteredAndSorted.slice(startIdx, startIdx + pageSize);
  }, [filteredAndSorted, currentPage, pageSize, isAllPages]);

  const startIndex = totalItems === 0 ? 0 : isAllPages ? 1 : (currentPage - 1) * pageSize + 1;
  const endIndex = isAllPages ? totalItems : Math.min(currentPage * pageSize, totalItems);

  // Synchronize horizontal table scroll tracking
  const updateScrollProgress = () => {
    if (!tableScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tableScrollRef.current;
    const max = scrollWidth - clientWidth;
    setMaxScrollWidth(max);
    if (max > 0) {
      setScrollProgress(Math.min(100, Math.max(0, Math.round((scrollLeft / max) * 100))));
    } else {
      setScrollProgress(0);
    }
  };

  useEffect(() => {
    updateScrollProgress();
    window.addEventListener('resize', updateScrollProgress);
    return () => window.removeEventListener('resize', updateScrollProgress);
  }, [displayedRows]);

  const scrollTable = (direction: 'left' | 'right' | 'start' | 'end' | 'down' | 'up') => {
    if (direction === 'down') {
      window.scrollBy({ top: 450, behavior: 'smooth' });
      return;
    }
    if (direction === 'up') {
      window.scrollBy({ top: -450, behavior: 'smooth' });
      return;
    }
    if (!tableScrollRef.current) return;
    const container = tableScrollRef.current;
    const step = 380;
    if (direction === 'left') {
      container.scrollBy({ left: -step, behavior: 'smooth' });
    } else if (direction === 'right') {
      container.scrollBy({ left: step, behavior: 'smooth' });
    } else if (direction === 'start') {
      container.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (direction === 'end') {
      container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
    }
  };

  const handleSliderScroll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = Number(e.target.value);
    setScrollProgress(percent);
    if (tableScrollRef.current) {
      const max = tableScrollRef.current.scrollWidth - tableScrollRef.current.clientWidth;
      tableScrollRef.current.scrollLeft = (percent / 100) * max;
    }
  };

  // Overall Statistics for Quick Cards
  const stats = useMemo(() => {
    let keluar = 0;
    let masuk = 0;
    let approved = 0;
    let pending = 0;

    transactions.forEach(t => {
      if (t.admMaterial === 'Keluar') keluar++;
      else if (t.admMaterial === 'Masuk' || t.admMaterial === 'Return') masuk++;

      if (t.status === 'Approved' || (!t.status && t.createdByRole !== 'Petugas Gudang')) {
        approved++;
      } else if (t.status === 'Pending') {
        pending++;
      }
    });

    return { total: transactions.length, keluar, masuk, approved, pending };
  }, [transactions]);

  // Checklist Helpers
  const toggleSelectTx = (id: string) => {
    setSelectedTxIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isAllVisibleSelected =
    displayedRows.length > 0 &&
    displayedRows.every(tx => selectedTxIds.has(tx.id));

  const toggleSelectAllVisible = () => {
    if (isAllVisibleSelected) {
      setSelectedTxIds(prev => {
        const next = new Set(prev);
        displayedRows.forEach(tx => next.delete(tx.id));
        return next;
      });
    } else {
      setSelectedTxIds(prev => {
        const next = new Set(prev);
        displayedRows.forEach(tx => next.add(tx.id));
        return next;
      });
    }
  };

  const clearSelection = () => {
    setSelectedTxIds(new Set());
  };

  // Build SuratJalanData array for all currently selected transactions
  const selectedSuratJalanList = useMemo(() => {
    const list: SuratJalanData[] = [];
    filteredAndSorted.forEach(tx => {
      if (selectedTxIds.has(tx.id)) {
        const sjNumber =
          suratJalanMap.get(tx.id) ||
          getTransactionSuratJalanNumber(tx, transactions);
        list.push(
          createSuratJalanFromTransaction(tx, {
            nomorSurat: sjNumber,
            allTransactions: transactions
          })
        );
      }
    });
    return list;
  }, [selectedTxIds, filteredAndSorted, suratJalanMap, transactions]);

  const handleDownloadCollective = async () => {
    if (selectedSuratJalanList.length === 0) return;
    setIsDownloadingCollective(true);
    setCollectiveFeedback(`Menyiapkan ${selectedSuratJalanList.length} Surat Jalan ke dalam 1 file PDF...`);
    try {
      await new Promise(r => setTimeout(r, 60));
      downloadCollectiveSuratJalanPDF(selectedSuratJalanList);
      setCollectiveFeedback(`Berhasil mengunduh ${selectedSuratJalanList.length} Surat Jalan dalam 1 PDF!`);
    } catch (err) {
      console.error('Error downloading collective PDF:', err);
      setCollectiveFeedback('Gagal membuat PDF kolektif. Silakan coba kembali.');
    } finally {
      setIsDownloadingCollective(false);
      setTimeout(() => setCollectiveFeedback(null), 4000);
    }
  };

  const handlePrintCollective = () => {
    if (selectedSuratJalanList.length === 0) return;
    setIsPrintingCollective(true);
    setCollectiveFeedback(`Membuka dialog cetak untuk ${selectedSuratJalanList.length} Surat Jalan...`);
    try {
      printCollectiveSuratJalanViaIframe(selectedSuratJalanList);
    } catch (err) {
      console.error('Error printing collective:', err);
      setCollectiveFeedback('Gagal membuka cetak.');
    } finally {
      setTimeout(() => {
        setIsPrintingCollective(false);
        setTimeout(() => setCollectiveFeedback(null), 3000);
      }, 1000);
    }
  };

  const handleExportCollectiveExcel = () => {
    const selectedTransactions = filteredAndSorted.filter(tx => selectedTxIds.has(tx.id));
    if (selectedTransactions.length === 0) return;
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    exportTransactionsToExcel(selectedTransactions, {
      filename: `PLN_Mutasi_Surat_Jalan_Kolektif_${selectedTransactions.length}_Baris_${dateStr}.xlsx`,
      allTransactionsForNumbering: transactions
    });
    setCollectiveFeedback(`Berhasil mengekspor ${selectedTransactions.length} mutasi ke Excel (.xlsx) dengan No. Surat Jalan di cell paling depan!`);
    setTimeout(() => setCollectiveFeedback(null), 4000);
  };

  const handleExportActiveToExcel = () => {
    const listToExport = filteredAndSorted.length > 0 ? filteredAndSorted : transactions;
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    exportTransactionsToExcel(listToExport, {
      filename: `PLN_Mutasi_Material_Surat_Jalan_${listToExport.length}_Baris_${dateStr}.xlsx`,
      allTransactionsForNumbering: transactions
    });
    setActionFeedback({
      message: `Berhasil mengekspor ${listToExport.length} baris mutasi ke file Excel (.xlsx) dengan No. Surat Jalan di Kolom A (Cell Depan)!`
    });
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleRequestDeleteSelected = () => {
    const list = transactions.filter(t => selectedTxIds.has(t.id));
    if (list.length === 0) return;
    setTxsToDelete(list);
    setIsDeleteModalOpen(true);
  };

  const handleRequestDeleteSingle = (tx: WarehouseTransaction) => {
    setTxsToDelete([tx]);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (txsToDelete.length === 0) return;
    setIsDeleting(true);
    try {
      const ids = txsToDelete.map(t => t.id);
      const res = deleteWarehouseTransactions(ids);
      if (res.success) {
        setSelectedTxIds(prev => {
          const next = new Set(prev);
          ids.forEach(id => next.delete(id));
          return next;
        });
        setActionFeedback({
          message: `Berhasil menghapus ${res.deletedCount} data mutasi! Stok material fisik telah diperbarui secara otomatis.`
        });
        setTimeout(() => setActionFeedback(null), 4500);
      }
    } catch (err: any) {
      console.error('Failed deleting transactions', err);
      setActionFeedback({
        message: `Gagal menghapus mutasi: ${err?.message || 'Terjadi kesalahan sistem'}`,
        isError: true
      });
      setTimeout(() => setActionFeedback(null), 4500);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setTxsToDelete([]);
    }
  };

  const handleExecuteImport = () => {
    if (!importText.trim()) {
      setImportFeedback('Tempelkan teks data tabel atau CSV terlebih dahulu.');
      return;
    }

    try {
      const parsed = parseSpreadsheetPasteOrCsv(importText);
      if (parsed.length === 0) {
        setImportFeedback('Tidak ada baris data mutasi yang valid ditemukan dalam teks.');
        return;
      }

      const { addedCount, totalCount } = mergeSpreadsheetTransactions(parsed);
      setImportFeedback(`Berhasil menyinkronkan ${parsed.length} baris! (${addedCount} mutasi baru, total sekarang: ${totalCount} baris).`);
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportText('');
        setImportFeedback(null);
      }, 2000);
    } catch (err: any) {
      setImportFeedback(`Gagal membaca format data: ${err?.message || 'Format tidak cocok'}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = event => {
        const buffer = event.target?.result as ArrayBuffer;
        if (buffer) {
          try {
            const parsed = parseXlsxBuffer(buffer);
            if (parsed.length > 0) {
              const { addedCount, totalCount } = mergeSpreadsheetTransactions(parsed);
              setImportFeedback(`Berhasil mengimpor file Excel "${file.name}": ${parsed.length} baris mutasi diproses (${addedCount} data baru ditambahkan, total sekarang: ${totalCount} baris).`);
              setTimeout(() => {
                setIsImportModalOpen(false);
                setImportText('');
                setImportFeedback(null);
              }, 2500);
            } else {
              setImportFeedback('Tidak ada baris data mutasi valid yang ditemukan dalam file Excel ini.');
            }
          } catch (err: any) {
            setImportFeedback(`Gagal membaca file Excel: ${err?.message || 'Format tidak valid'}`);
          }
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      if (text) {
        setImportText(text);
        try {
          const parsed = parseSpreadsheetPasteOrCsv(text);
          if (parsed.length > 0) {
            const { addedCount, totalCount } = mergeSpreadsheetTransactions(parsed);
            setImportFeedback(`Berhasil mengimpor file "${file.name}": ${parsed.length} baris mutasi diproses (${addedCount} data baru ditambahkan, total sekarang: ${totalCount} baris).`);
            setTimeout(() => {
              setIsImportModalOpen(false);
              setImportText('');
              setImportFeedback(null);
            }, 2000);
          } else {
            setImportFeedback('Tidak ada baris data mutasi valid yang ditemukan dalam file.');
          }
        } catch (err: any) {
          setImportFeedback(`Gagal membaca file: ${err?.message || 'Format tidak valid'}`);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreFullSheet1Data = () => {
    const { addedCount, totalCount } = mergeSpreadsheetTransactions(INITIAL_TRANSACTIONS);
    setImportFeedback(`Berhasil memuat seluruh ${INITIAL_TRANSACTIONS.length} baris data mutasi Sheet 1 (${addedCount} baris ditambahkan, total: ${totalCount}).`);
    setTimeout(() => {
      setIsImportModalOpen(false);
      setImportFeedback(null);
    }, 1800);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* 1. Page Header with Strong Contrast Typography */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-700 tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span>ULP TANGGUL · HISTORIS MUTASI</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0f2852] tracking-tight">
            Buku Mutasi Material
          </h1>
          <p className="text-sm text-slate-700 font-medium">
            Rekapitulasi mutasi material keluar, masuk, serta penerbitan Surat Jalan resmi.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Import Manual */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 active:scale-95 border border-white/80 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            title="Import manual file CSV atau salin data dari spreadsheet"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Import Manual</span>
          </button>

          {/* Export to Excel (.xlsx) */}
          <div className="relative inline-block">
            <div className="flex items-center shadow-md rounded-xl">
              <button
                onClick={handleExportActiveToExcel}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-l-xl transition-all flex items-center gap-1.5 cursor-pointer"
                title="Eksport mutasi ke Excel (.xlsx) dengan NO. SURAT JALAN di cell paling depan (Kolom A)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200 shrink-0" />
                <span>Eksport Excel (.xlsx)</span>
                {filteredAndSorted.length !== transactions.length && (
                  <span className="bg-emerald-800/80 text-[10px] px-1.5 py-0.5 rounded-md font-mono">
                    {filteredAndSorted.length} baris
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsExportMenuOpen(prev => !prev)}
                className="px-2 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-r-xl border-l border-emerald-600/70 cursor-pointer"
                title="Pilihan Format Ekspor"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 py-1 text-xs">
                <button
                  onClick={() => {
                    handleExportActiveToExcel();
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer text-slate-800"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold">Microsoft Excel (.xlsx)</div>
                    <div className="text-[10.5px] text-slate-400">No. Surat Jalan di Cell Depan (Kolom A)</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    exportTransactionsToSpreadsheetCSV(filteredAndSorted, transactions);
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer text-slate-800 border-t border-slate-100"
                >
                  <Download className="w-4 h-4 text-sky-600 shrink-0" />
                  <div>
                    <div className="font-bold">Format CSV (.csv)</div>
                    <div className="text-[10.5px] text-slate-400">Teks CSV UTF-8 dengan No. SJ di depan</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Alert Banner */}
      {actionFeedback && (
        <div
          className={`p-3 rounded-2xl text-xs flex items-center gap-2 shadow-md animate-in fade-in duration-200 ${
            actionFeedback.isError
              ? "bg-rose-50 border border-rose-200 text-rose-800"
              : "bg-emerald-50 border border-emerald-200 text-emerald-800"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-medium">{actionFeedback.message}</span>
        </div>
      )}

      {/* 2. Quick Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Total Mutasi */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
            <span>Total Mutasi</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1.5 font-mono">
            {stats.total}
          </div>
          <div className="text-[10.5px] text-slate-500 font-medium mt-0.5">
            Semua transaksi tercatat
          </div>
        </div>

        {/* Card 2: Mutasi Keluar */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
            <span>Material Keluar</span>
            <ArrowDownToLine className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1.5 font-mono">
            {stats.keluar}
          </div>
          <div className="text-[10.5px] text-rose-600 font-medium mt-0.5">
            Pemakaian lapangan
          </div>
        </div>

        {/* Card 3: Material Masuk */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
            <span>Material Masuk</span>
            <ArrowUpFromLine className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1.5 font-mono">
            {stats.masuk}
          </div>
          <div className="text-[10.5px] text-emerald-600 font-medium mt-0.5">
            Penerimaan & return
          </div>
        </div>

        {/* Card 4: Surat Jalan Terbit */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
            <span>Surat Jalan Terbit</span>
            <ShieldCheck className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-sky-700 mt-1.5 font-mono">
            {stats.approved}
          </div>
          <div className="text-[10.5px] text-sky-600 font-medium mt-0.5">
            Status Approved
          </div>
        </div>

        {/* Card 5: Menunggu Approval */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 p-4 shadow-lg col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
            <span>Menunggu Approval</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1.5 font-mono">
            {stats.pending}
          </div>
          <div className="text-[10.5px] text-amber-600 font-medium mt-0.5">
            Perlu persetujuan
          </div>
        </div>
      </div>

      {/* 3. Controls & Filter Bar */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 p-3.5 sm:p-4 shadow-lg space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="flex-1 min-w-[260px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari No. Surat Jalan, No. Gangguan, Tanggal, Petugas, Keamanan, Material..."
              className="w-full pl-10 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-medium text-slate-800"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Rentang Tanggal */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-xl text-xs shrink-0 shadow-2xs">
              <div className="flex items-center gap-1 pl-2">
                <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">Dari:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="py-1 px-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  title="Filter mulai dari tanggal ini"
                />
              </div>

              <span className="text-slate-400 font-bold px-0.5">s/d</span>

              <div className="flex items-center gap-1 pr-1">
                <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">Sampai:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="py-1 px-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  title="Filter sampai tanggal ini"
                />
              </div>

              {startDate || endDate ? (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors ml-0.5 cursor-pointer"
                  title="Hapus filter rentang tanggal"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="flex items-center gap-1 pl-1">
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                      setStartDate(today);
                      setEndDate(today);
                    }}
                    className="px-2 py-1 text-[10.5px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer"
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      const start = new Date(d.getFullYear(), d.getMonth(), 1);
                      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                      const fmt = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
                      setStartDate(fmt(start));
                      setEndDate(fmt(end));
                    }}
                    className="px-2 py-1 text-[10.5px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
                  >
                    Bulan Ini
                  </button>
                </div>
              )}
            </div>

            {/* Sort Order Selector */}
            <button
              onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
              className="px-2.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Ubah urutan tanggal mutasi"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {sortOrder === 'desc' ? 'Terbaru (Tanggal ↓)' : 'Terlama (Tanggal ↑)'}
              </span>
            </button>

            {/* Quick Bulk Select Button for Collective Surat Jalan */}
            <button
              type="button"
              onClick={toggleSelectAllVisible}
              className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                isAllVisibleSelected
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title={isAllVisibleSelected ? 'Batalkan pilihan semua mutasi' : 'Pilih semua mutasi untuk cetak/download kolektif'}
            >
              {isAllVisibleSelected ? (
                <CheckSquare className="w-3.5 h-3.5 text-white" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>
                {isAllVisibleSelected
                  ? `Batal Pilih (${displayedRows.length})`
                  : `Checklist Halaman Ini (${displayedRows.length})`}
              </span>
            </button>
          </div>
        </div>

        {/* Second Row: Filters for Type, Status, Regu */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100 text-xs">
          {/* Type Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
              Tipe:
            </span>
            {(['All', 'Keluar', 'Masuk', 'Return'] as const).map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  typeFilter === type
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {type === 'All' ? 'Semua' : type}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
              Status:
            </span>
            {(['All', 'Approved', 'Pending'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status === 'All'
                  ? 'Semua Status'
                  : status === 'Approved'
                  ? 'Approved (SJ Terbit)'
                  : 'Pending'}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Regu Filter */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Regu:
            </span>
            <select
              value={reguFilter}
              onChange={e => setReguFilter(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All">Semua Regu</option>
              {reguList.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Sticky Collective Action Bar (When 1+ items checked) */}
      {selectedTxIds.size > 0 && (
        <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3.5 sm:p-4 shadow-2xl border-2 border-blue-400 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 sticky top-2 z-40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md">
              {selectedTxIds.size}
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-2">
                <span>{selectedTxIds.size} Surat Jalan Dichecklist</span>
                <span className="text-[10px] font-bold bg-blue-800 text-blue-200 px-2 py-0.5 rounded-full border border-blue-600">
                  Siap Kolektif
                </span>
              </div>
              <div className="text-[11px] text-slate-300">
                Pilih aksi untuk mencetak, mengunduh 1 file PDF gabungan, atau ekspor Excel
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {collectiveFeedback && (
              <span className="text-xs text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{collectiveFeedback}</span>
              </span>
            )}

            {/* Button: Download Kolektif 1 PDF */}
            <button
              onClick={handleDownloadCollective}
              disabled={isDownloadingCollective}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Download semua Surat Jalan terpilih menjadi 1 file PDF kolektif"
            >
              {isDownloadingCollective ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Menggabungkan PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download 1 PDF Kolektif ({selectedTxIds.size})</span>
                </>
              )}
            </button>

            {/* Button: Cetak Kolektif */}
            <button
              onClick={handlePrintCollective}
              disabled={isPrintingCollective}
              className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Cetak langsung semua Surat Jalan terpilih"
            >
              {isPrintingCollective ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Membuka Cetak...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>Cetak Kolektif ({selectedTxIds.size})</span>
                </>
              )}
            </button>

            {/* Button: Eksport Kolektif ke Excel (.xlsx) */}
            <button
              onClick={handleExportCollectiveExcel}
              className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              title="Eksport Surat Jalan terpilih ke file Microsoft Excel (.xlsx) dengan NO. SURAT JALAN di cell paling depan"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Eksport Excel ({selectedTxIds.size})</span>
            </button>

            {/* Button: Hapus Kolektif */}
            <button
              type="button"
              onClick={handleRequestDeleteSelected}
              className="px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              title="Hapus seluruh data mutasi yang dichecklist secara permanen"
            >
              <Trash2 className="w-4 h-4 text-rose-100" />
              <span>Hapus Kolektif ({selectedTxIds.size})</span>
            </button>

            {/* Button: Batal / Reset Checklist */}
            <button
              onClick={clearSelection}
              className="px-2.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              title="Batalkan checklist"
            >
              <X className="w-4 h-4" />
              <span>Batal</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Main Modern Mutasi Table */}
      <div className="bg-white/95 backdrop-blur-xl rounded-[28px] border border-white/80 shadow-2xl overflow-hidden flex flex-col">
        {/* Table top info header */}
        <div className="bg-slate-50/90 border-b border-slate-200/90 px-5 py-3 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">
              Menampilkan {startIndex} - {endIndex} dari {totalItems} total data mutasi
            </span>
            {selectedTxIds.size > 0 && (
              <span className="bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-full text-[10.5px]">
                {selectedTxIds.size} dichecklist
              </span>
            )}
          </div>
          {/* Quick horizontal scroll buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-400 mr-1 hidden sm:inline">Geser Kolom:</span>
            <button
              type="button"
              onClick={() => scrollTable('left')}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-blue-600 transition-colors cursor-pointer shadow-2xs"
              title="Geser tabel ke kiri"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollTable('right')}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-blue-600 transition-colors cursor-pointer shadow-2xs"
              title="Geser tabel ke kanan"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable table container hooked to ref */}
        <div
          ref={tableScrollRef}
          onScroll={updateScrollProgress}
          className="overflow-x-auto scroll-smooth"
        >
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/95 border-b border-slate-300 text-slate-900 text-[11px] font-black uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    title={isAllVisibleSelected ? 'Batal pilih semua' : 'Pilih semua baris halaman ini'}
                  />
                </th>
                <th className="py-3 px-3.5 min-w-[160px] bg-blue-50/70 text-blue-950 font-black border-r border-blue-100 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>No. Surat Jalan</span>
                  </div>
                </th>
                <th className="py-3 px-3 min-w-[105px] border-r border-slate-200 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Tanggal</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-center min-w-[100px] border-r border-slate-200 whitespace-nowrap">
                  Adm Material
                </th>
                <th className="py-3 px-3 min-w-[110px] border-r border-slate-200 whitespace-nowrap">
                  Jabatan
                </th>
                <th className="py-3 px-3.5 min-w-[170px] border-r border-slate-200 whitespace-nowrap">
                  Nama Petugas
                </th>
                <th className="py-3 px-3 min-w-[110px] border-r border-slate-200 whitespace-nowrap">
                  Regu Yandal
                </th>
                <th className="py-3 px-3.5 min-w-[210px] border-r border-slate-200 whitespace-nowrap">
                  No GANGGUAN DAN PEMELIHARAAN (APKT/PK Teknik/IDpel ggn)
                </th>
                <th className="py-3 px-3 text-center min-w-[110px] bg-amber-50/90 text-amber-950 font-black border-r border-amber-200/90 whitespace-nowrap">
                  NORMALISASI
                </th>
                <th className="py-3 px-3.5 min-w-[230px] bg-amber-50/40 text-slate-900 font-black border-r border-slate-200 whitespace-nowrap">
                  Nama Material
                </th>
                <th className="py-3 px-3 text-center min-w-[75px] bg-amber-50/90 text-amber-950 font-black border-r border-amber-200/90 whitespace-nowrap">
                  Jumlah
                </th>
                <th className="py-3 px-3.5 min-w-[140px] border-r border-slate-200 whitespace-nowrap">
                  Pemberi Material
                </th>
                <th className="py-3 px-3.5 min-w-[140px] border-r border-slate-200 whitespace-nowrap">
                  Security
                </th>
                <th className="py-3 px-3 text-center whitespace-nowrap border-r border-slate-200">
                  Surat Jalan
                </th>
                <th className="py-3 px-2 text-center w-12">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-16 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <div className="font-bold text-slate-800 text-sm">
                        Tidak ada data mutasi yang cocok
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Coba sesuaikan kata kunci pencarian, filter tanggal, atau klik tombol di bawah ini untuk mereset seluruh filter.
                      </p>
                      <button
                        onClick={() => {
                          setSearch('');
                          setTypeFilter('All');
                          setStatusFilter('All');
                          setReguFilter('All');
                          setStartDate('');
                          setEndDate('');
                        }}
                        className="px-3.5 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                      >
                        Reset Semua Filter
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedRows.map((tx, idx) => {
                  const isKeluar = tx.admMaterial === 'Keluar';
                  const isMasuk = tx.admMaterial === 'Masuk';
                  const isPending = tx.status === 'Pending';
                  const isRejected = tx.status === 'Rejected';
                  const isApproved = tx.status === 'Approved' || (!tx.status && tx.createdByRole !== 'Petugas Gudang');
                  const isSelected = selectedTxIds.has(tx.id);

                  // Official Surat Jalan Number (Only if approved)
                  const sjNumber = isApproved
                    ? (suratJalanMap.get(tx.id) || tx.column1 || getTransactionSuratJalanNumber(tx, transactions))
                    : '';

                  const items = tx.items && tx.items.length > 0
                    ? tx.items
                    : [{ materialId: 'm-empty', materialName: '-', quantity: 0 }];
                  const rowCount = items.length;

                  return items.map((item, itemIdx) => {
                    const normCode = (item as any).normalisasi || getNormalisasiCode(item.materialName) || '-';
                    const isFirstItem = itemIdx === 0;

                    return (
                      <tr
                        key={`${tx.id}-${itemIdx}`}
                        className={`${
                          isSelected
                            ? 'bg-blue-50/90 font-medium'
                            : idx % 2 === 1
                            ? 'bg-slate-50/50 hover:bg-blue-50/50'
                            : 'hover:bg-blue-50/50'
                        } transition-colors ${!isFirstItem ? 'border-t border-slate-100/60' : ''}`}
                      >
                        {/* 1. Checkbox */}
                        {isFirstItem && (
                          <td rowSpan={rowCount} className="py-3 px-3 text-center align-top border-r border-slate-200/50">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectTx(tx.id)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer mt-1"
                              title="Pilih mutasi"
                            />
                          </td>
                        )}

                        {/* Kolom 1: No. Surat Jalan */}
                        {isFirstItem && (
                          <td rowSpan={rowCount} className="py-3 px-3.5 whitespace-nowrap bg-blue-50/30 border-r border-blue-100/70 align-top">
                            {isApproved ? (
                              <div>
                                <button
                                  onClick={() => handleOpenSuratJalan(tx)}
                                  className="inline-flex items-center gap-1.5 font-black font-mono text-xs text-blue-800 hover:text-blue-950 hover:underline cursor-pointer group"
                                  title="Klik untuk membuka / cetak Surat Jalan Barang Resmi PLN"
                                >
                                  <img
                                    src="/assets/aistudio/Logo_PLN_4161717a.png"
                                    alt="PLN"
                                    className="w-3.5 h-auto object-contain shrink-0 group-hover:scale-110 transition-transform"
                                  />
                                  <span>{sjNumber || tx.column1 || '-'}</span>
                                </button>
                                <div className="text-[10px] text-emerald-700 font-bold font-sans mt-0.5 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span>Resmi Terbit</span>
                                </div>
                              </div>
                            ) : isPending ? (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-black bg-amber-50 text-amber-900 border border-amber-300">
                                  <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                                  <span>Menunggu Approval</span>
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-black bg-rose-50 text-rose-800 border border-rose-300">
                                <span>Ditolak</span>
                              </span>
                            )}
                          </td>
                        )}

                        {/* Kolom 2: Tanggal */}
                        {isFirstItem && (
                          <td rowSpan={rowCount} className="py-3 px-3 font-mono text-xs whitespace-nowrap border-r border-slate-200 align-top">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>{tx.tanggal}</span>
                            </div>
                          </td>
                        )}

                        {/* Kolom 3: Adm Material */}
                        {isFirstItem && (
                          <td rowSpan={rowCount} className="py-3 px-3 text-center whitespace-nowrap border-r border-slate-200 align-top">
                            <span
                              className={`font-black text-[10.5px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                isKeluar
                                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                  : isMasuk
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : 'bg-sky-100 text-sky-900 border border-sky-300'
                              }`}
                            >
                              {isKeluar ? (
                                <ArrowDownToLine className="w-3 h-3 text-rose-700 stroke-[2.5]" />
                              ) : (
                                <ArrowUpFromLine className="w-3 h-3 text-emerald-700 stroke-[2.5]" />
                              )}
                              <span>{tx.admMaterial}</span>
                            </span>
                          </td>
                        )}

                        {/* Kolom 4: Jabatan */}
                        {isFirstItem && (
                          <td rowSpan={rowCount} className="py-3 px-3 whitespace-nowrap text-xs font-semibold text-slate-800 border-r border-slate-200 align-top">
                            {tx.jabatan || 'Yandal'}
                          </td>
                        )}

                        {/* Kolom 5: Nama Petugas */}
                        {isFirstItem && (
                          <td rowSpan={rowCount} className="py-3 px-3.5 whitespace-nowrap text-xs font-bold text-slate-900 border-r border-slate-200 align-top">
                            {tx.namaPetugas || tx.petugasPelayananTeknik || '-'}
                          </td>
                        )}

                        {/* Kolom 6: Regu Yandal */}
                        {isFirstItem && (
                          <td rowSpan={rowCount} className="py-3 px-3 whitespace-nowrap text-xs border-r border-slate-200 align-top">
                            <span className="px-2 py-0.5 bg-slate-200/80 rounded text-[10.5px] font-mono text-slate-800 font-bold">
                              {tx.reguYandal || 'ULC_A'}
                            </span>
                          </td>
                        )}

                        {/* Kolom 7: No GANGGUAN DAN PEMELIHARAAN (APKT/PK Teknik/IDpel ggn) */}
                        {isFirstItem && (
                          <td rowSpan={rowCount} className="py-3 px-3.5 text-xs font-mono font-bold text-slate-800 border-r border-slate-200 max-w-[220px] truncate align-top" title={tx.noGangguan}>
                            {tx.noGangguan || '-'}
                          </td>
                        )}

                        {/* Kolom 8: NORMALISASI */}
                        <td className="py-3 px-3 text-center whitespace-nowrap font-mono text-xs font-black text-amber-900 bg-amber-50/30 border-r border-amber-200/60">
                          {normCode !== '-' ? normCode : '-'}
                        </td>

                        {/* Kolom 9: Nama Material */}
                        <td className="py-3 px-3.5 text-xs font-semibold text-slate-900 border-r border-slate-200 max-w-[260px] truncate">
                          <span
                            onClick={() => onViewStockCard(item.materialId)}
                            className="hover:text-blue-700 hover:underline cursor-pointer"
                            title="Klik untuk lihat kartu gantung stok material"
                          >
                            {item.materialName}
                          </span>
                        </td>

                        {/* Kolom 10: Jumlah */}
                        <td className="py-3 px-3 text-center whitespace-nowrap font-mono font-black text-xs text-blue-900 bg-blue-50/40 border-r border-blue-200/60">
                          {item.quantity}
                        </td>

                        {/* Kolom 11: Pemberi Material */}
                        {isFirstItem && (
                          <td rowSpan={rowCount} className="py-3 px-3.5 whitespace-nowrap text-xs font-bold text-slate-900 border-r border-slate-200 align-top">
                            <div>{tx.pemberiMaterial || (tx.admMaterial === 'Masuk' ? 'GUDANG UP3 JEMBER' : 'Ahmad Zaenudin')}</div>
                          </td>
                        )}

                        {/* Kolom 12: Security */}
                        {isFirstItem && (
                          <td rowSpan={rowCount} className="py-3 px-3.5 whitespace-nowrap text-xs font-bold text-slate-900 border-r border-slate-200 align-top">
                            <div>{tx.security || tx.petugasSecurity || '-'}</div>
                          </td>
                        )}

                        {/* Surat Jalan / Cetak */}
                        {isFirstItem && (
                          <td rowSpan={rowCount} className="py-3 px-3 text-center whitespace-nowrap border-r border-slate-200 align-top">
                            {isApproved ? (
                              <button
                                onClick={() => handleOpenSuratJalan(tx)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer"
                                title="Buka / Cetak / Download Surat Jalan Barang Resmi PLN"
                              >
                                <img
                                  src="/assets/aistudio/Logo_PLN_4161717a.png"
                                  alt="PLN"
                                  className="w-3.5 h-auto object-contain shrink-0"
                                />
                                <span>Surat Jalan</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenSuratJalan(tx)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-200/90 hover:bg-slate-300 rounded-lg transition-colors cursor-pointer"
                                title="Preview Draft Surat Jalan (Nomor resmi terbit saat approval)"
                              >
                                <span>Draft SJ</span>
                              </button>
                            )}
                          </td>
                        )}

                        {/* Aksi Hapus */}
                        {isFirstItem && (
                          <td rowSpan={rowCount} className="py-3 px-2 text-center whitespace-nowrap align-top">
                            <button
                              type="button"
                              onClick={() => handleRequestDeleteSingle(tx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 rounded-lg transition-all cursor-pointer"
                              title="Hapus data mutasi ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  });
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Integrated Bottom Control Center - unified with web card template */}
        <div className="bg-slate-50/95 border-t border-slate-200/90 px-5 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          {/* Left: Tampilkan Data Controls */}
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <span className="font-bold text-slate-600 uppercase tracking-wider text-[11px]">
              Tampilkan:
            </span>
            <div className="flex items-center p-1 bg-white rounded-xl border border-slate-200 gap-1 shadow-2xs">
              {[10, 50, 100].map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPageSize(size)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    pageSize === size
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {size} Data
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPageSize(-1)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  pageSize <= 0
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Semua ({totalItems})
              </button>
            </div>
            <span className="text-xs text-slate-500 ml-2 hidden lg:inline">
              (Menampilkan {startIndex} - {endIndex} dari {totalItems} baris)
            </span>
          </div>

          {/* Center: Sleek Horizontal Scroll Controls without loud labels */}
          <div className="flex items-center gap-1.5 w-full md:w-auto justify-center bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => scrollTable('start')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Awal Kolom"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollTable('left')}
              className="p-1 rounded-md text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Geser Kiri"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Horizontal Scroll Track Slider */}
            <div className="flex items-center gap-2 px-1 w-24 sm:w-32">
              <input
                type="range"
                min={0}
                max={100}
                value={scrollProgress}
                onChange={handleSliderScroll}
                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                title={`Posisi Scroll: ${scrollProgress}%`}
              />
            </div>

            <button
              type="button"
              onClick={() => scrollTable('right')}
              className="p-1 rounded-md text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Geser Kanan"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollTable('end')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Ujung Kolom"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            {/* Quick Page Scroll Top / Bottom Buttons */}
            <button
              type="button"
              onClick={() => scrollTable('up')}
              className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Gulir ke Atas Halaman"
            >
              <ArrowUpFromLine className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollTable('down')}
              className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Gulir ke Bawah Halaman"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Clean Web Template Pagination Controls */}
          <div className="flex items-center gap-1.5 w-full md:w-auto justify-end flex-wrap">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1 || isAllPages}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
              title="Halaman Pertama"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isAllPages}
              className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>

            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 shadow-2xs font-mono">
              Halaman {currentPage} / {totalPages}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isAllPages}
              className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <span>Berikutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages || isAllPages}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
              title="Halaman Terakhir"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 7. Import Modal Data Mutasi */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Import & Sinkronisasi Mutasi Gudang
                  </h3>
                  <p className="text-xs text-slate-500">
                    Impor file Excel / CSV atau tempelkan baris data
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFeedback(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {importFeedback && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />
                  <span>{importFeedback}</span>
                </div>
              )}

              {/* Action 2: Upload Excel (.xlsx / .xls) or CSV File */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs block">
                    Unggah File Excel (.xlsx / .xls) atau CSV
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                    Paling Praktis
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Unggah file mutasi material (Excel .xlsx / .xls atau CSV) di sini:
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
              </div>

              {/* Action 3: Paste CSV/TSV Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Atau Tempelkan Baris Data Tabel / CSV di sini:
                </label>
                <textarea
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  placeholder="Tempelkan baris data mutasi dari Excel/CSV (Ctrl+V)..."
                  rows={3}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Action 4: Restore Default Seed Transactions & Process */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleRestoreFullSheet1Data}
                  className="text-xs text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
                >
                  Muat Ulang Data Standar (740 Baris)
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Proses Teks Impor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Surat Jalan Modal */}
      <SuratJalanModal
        isOpen={isSuratJalanOpen}
        onClose={() => {
          setIsSuratJalanOpen(false);
          setSelectedSuratJalan(null);
          forceUnlockScroll();
        }}
        data={selectedSuratJalan}
      />

      {/* 9. Konfirmasi Hapus Mutasi (Tunggal & Kolektif) Modal (CENTERED IN VIEWPORT - ZERO SCROLL) */}
      {isDeleteModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 overflow-hidden space-y-4 animate-in zoom-in-95 duration-200 m-auto">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  {txsToDelete.length > 1
                    ? `Hapus ${txsToDelete.length} Data Mutasi Terpilih?`
                    : 'Hapus Data Mutasi Ini?'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Data yang dihapus akan dikeluarkan dari buku mutasi dan saldo stok fisik material di gudang akan dihitung ulang secara otomatis.
                </p>
              </div>
            </div>

            {/* List preview of items to delete */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl max-h-48 overflow-y-auto space-y-1.5 text-xs text-slate-700">
              <div className="font-bold text-[10.5px] text-slate-500 uppercase tracking-wider mb-1">
                Rincian Mutasi yang akan Dihapus ({txsToDelete.length} item):
              </div>
              {txsToDelete.slice(0, 8).map((t, idx) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-1 border-b border-slate-100 last:border-b-0 gap-2"
                >
                  <span className="font-mono text-slate-800 font-bold truncate max-w-[220px]">
                    {idx + 1}. {t.column1 || t.noGangguan || t.tanggal}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium shrink-0">
                    {t.tanggal} ({t.admMaterial})
                  </span>
                </div>
              ))}
              {txsToDelete.length > 8 && (
                <div className="text-[11px] text-slate-500 italic pt-1 text-center font-medium">
                  ...dan {txsToDelete.length - 8} transaksi lainnya
                </div>
              )}
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Tindakan ini permanen dan tidak dapat dibatalkan.</span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setTxsToDelete([]);
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus {txsToDelete.length > 1 ? `${txsToDelete.length} Data` : 'Data Ini'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
