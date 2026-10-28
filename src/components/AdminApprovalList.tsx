import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { WarehouseTransaction, MaterialItem, AppUser, SuratJalanData } from '../types/warehouse';
import { 
  approveTransaction, 
  rejectTransaction, 
  updateWarehouseTransaction, 
  deleteWarehouseTransaction 
} from '../utils/inventoryStore';
import { sendTransactionToSpreadsheet } from '../utils/spreadsheetSync';
import { createSuratJalanFromTransaction, getTransactionSuratJalanNumber, getSatuan } from '../utils/suratJalanHelper';
import { SuratJalanModal } from './SuratJalanModal';
import { StaffSelectDropdown } from './StaffSelectDropdown';
import { DAFTAR_PEMBERI_MATERIAL, DAFTAR_PETUGAS_SECURITY } from '../data/warehouseStaff';
import { useModalScrollLock, forceUnlockScroll } from '../utils/modalScrollLock';
import { 
  RotateCcw, 
  Check, 
  Printer, 
  X, 
  Pencil, 
  Trash2, 
  Calendar, 
  ChevronDown, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Clock,
  Save,
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRight
} from 'lucide-react';

interface AdminApprovalListProps {
  transactions: WarehouseTransaction[];
  materials: MaterialItem[];
  currentUser: AppUser;
  onViewStockCard?: (materialId: string) => void;
  onRefresh?: () => void;
  initialMode?: 'hub' | 'keluar' | 'masuk';
}

export const AdminApprovalList: React.FC<AdminApprovalListProps> = ({
  transactions,
  materials,
  currentUser,
  onViewStockCard,
  onRefresh,
  initialMode = 'hub'
}) => {
  // Navigation inside Approval: 'hub' | 'keluar' | 'masuk'
  const [approvalView, setApprovalView] = useState<'hub' | 'keluar' | 'masuk'>(initialMode);

  // Always reset to Hub when user re-selects Approval menu
  React.useEffect(() => {
    const handleResetApproval = () => {
      setApprovalView('hub');
      setFilterDate('');
      setFilterMaterial('');
    };
    window.addEventListener('pln-reset-approval-view', handleResetApproval);
    return () => window.removeEventListener('pln-reset-approval-view', handleResetApproval);
  }, []);

  // Filter states
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterMaterial, setFilterMaterial] = useState<string>('');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modal states
  const [selectedSuratJalan, setSelectedSuratJalan] = useState<SuratJalanData | null>(null);
  const [isSuratJalanOpen, setIsSuratJalanOpen] = useState(false);

  // Edit Modal State
  const [editingTx, setEditingTx] = useState<WarehouseTransaction | null>(null);
  const [editFormData, setEditFormData] = useState<{
    namaPetugas: string;
    pemberiMaterial: string;
    security: string;
    jenisTransaksi: string;
    reguYandal: string;
    tanggal: string;
    items: { materialId: string; materialName: string; quantity: number }[];
  } | null>(null);

  // Reject Modal State
  const [rejectingTx, setRejectingTx] = useState<WarehouseTransaction | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Perlu penyesuaian data fisik di lapangan');

  // Delete Confirm Modal State
  const [deletingTx, setDeletingTx] = useState<WarehouseTransaction | null>(null);

  // Lock window and background scroll so pop-up appears directly without scroll up/down
  useModalScrollLock(Boolean(deletingTx || rejectingTx || editingTx || isSuratJalanOpen));

  const showFeedback = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Filter transactions by Outgoing (Keluar) vs Incoming (Masuk)
  const outgoingTransactions = useMemo(() => {
    return transactions.filter(t => t.admMaterial === 'Keluar' || !t.admMaterial);
  }, [transactions]);

  const incomingTransactions = useMemo(() => {
    return transactions.filter(t => t.admMaterial === 'Masuk');
  }, [transactions]);

  // Current active pool based on selected tab
  const currentPoolTransactions = useMemo(() => {
    return approvalView === 'masuk' ? incomingTransactions : outgoingTransactions;
  }, [approvalView, incomingTransactions, outgoingTransactions]);

  // Unique materials list for filter dropdown
  const uniqueMaterialOptions = useMemo(() => {
    const set = new Set<string>();
    currentPoolTransactions.forEach(t => {
      t.items?.forEach(i => {
        if (i.materialName) set.add(i.materialName);
      });
    });
    // Also include materials from catalog if empty
    if (set.size === 0) {
      materials.forEach(m => set.add(m.name));
    }
    return Array.from(set).sort();
  }, [currentPoolTransactions, materials]);

  // Apply filters
  const filteredTransactions = useMemo(() => {
    return currentPoolTransactions.filter(t => {
      // Date filter
      if (filterDate) {
        const [year, month, day] = filterDate.split('-');
        const dmyFormat = `${day}/${month}/${year}`;
        const dmyFormatSingle = `${parseInt(day, 10)}/${parseInt(month, 10)}/${year}`;
        const txDate = t.tanggal || (t.timestamp ? t.timestamp.split(' ')[0] : '');
        
        const match = 
          txDate.includes(filterDate) || 
          txDate.includes(dmyFormat) || 
          txDate.includes(dmyFormatSingle) ||
          txDate.startsWith(`${day}/${month}`) ||
          txDate.startsWith(`${parseInt(day, 10)}/${parseInt(month, 10)}`);

        if (!match) return false;
      }

      // Material filter
      if (filterMaterial) {
        const hasMat = t.items?.some(i => 
          i.materialName.toLowerCase().includes(filterMaterial.toLowerCase()) ||
          i.materialId === filterMaterial
        );
        if (!hasMat) return false;
      }

      return true;
    });
  }, [currentPoolTransactions, filterDate, filterMaterial]);

  // Total lines / baris material count
  const totalBarisMaterial = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + (t.items ? t.items.length : 1), 0);
  }, [filteredTransactions]);

  // Pending counts
  const pendingOutgoingCount = useMemo(() => {
    return outgoingTransactions.filter(t => t.status === 'Pending').length;
  }, [outgoingTransactions]);

  const pendingIncomingCount = useMemo(() => {
    return incomingTransactions.filter(t => t.status === 'Pending').length;
  }, [incomingTransactions]);

  // Clear Filter handler
  const handleClearFilter = () => {
    setFilterDate('');
    setFilterMaterial('');
  };

  // Muat Ulang handler
  const handleReload = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.dispatchEvent(new CustomEvent('pln-stock-updated'));
    }
    showFeedback(
      `Data transaksi ${approvalView === 'masuk' ? 'penerimaan material masuk' : 'material keluar'} berhasil dimuat ulang.`,
      'info'
    );
  };

  // Approve action
  const handleApprove = async (tx: WarehouseTransaction) => {
    try {
      const res = approveTransaction(
        tx.id,
        currentUser.name,
        currentUser.role as any,
        `Disetujui oleh ${currentUser.name} (${currentUser.role})`
      );

      if (res.updatedTx) {
        sendTransactionToSpreadsheet(res.updatedTx).catch(err => {
          console.warn('Sync to spreadsheet on approve failed:', err);
        });
      }

      if (tx.admMaterial === 'Masuk') {
        showFeedback(`Transaksi penerimaan material disetujui! Stok gudang telah diperbarui.`, 'success');
      } else {
        showFeedback(`Transaksi disetujui! Nomor Surat Jalan otomatis: ${res.officialSjNumber}`, 'success');
      }
    } catch (err) {
      console.error(err);
      showFeedback('Gagal menyetujui transaksi.', 'error');
    }
  };

  // Cetak Surat Jalan action (only for outgoing material)
  const handlePrint = (tx: WarehouseTransaction) => {
    const sj = createSuratJalanFromTransaction(tx, { allTransactions: transactions });
    setSelectedSuratJalan(sj);
    setIsSuratJalanOpen(true);
  };

  // Open Reject Modal
  const handleOpenReject = (tx: WarehouseTransaction) => {
    setRejectingTx(tx);
    setRejectReason(
      tx.admMaterial === 'Masuk'
        ? 'Perlu verifikasi fisik material yang diterima dari UP3'
        : 'Perlu verifikasi fisik material di gudang ULP'
    );
  };

  // Confirm Reject
  const handleConfirmReject = () => {
    if (!rejectingTx) return;
    try {
      rejectTransaction(
        rejectingTx.id,
        currentUser.name,
        currentUser.role as any,
        rejectReason
      );
      showFeedback(
        `Transaksi ${rejectingTx.admMaterial === 'Masuk' ? 'penerimaan material' : 'material keluar'} telah ditolak.`,
        'info'
      );
      setRejectingTx(null);
    } catch (err) {
      console.error(err);
      showFeedback('Gagal menolak transaksi.', 'error');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (tx: WarehouseTransaction) => {
    setEditingTx(tx);
    setEditFormData({
      namaPetugas: tx.namaPetugas || '',
      pemberiMaterial: tx.pemberiMaterial || (tx.admMaterial === 'Masuk' ? 'GUDANG UP3 JEMBER' : 'Ahmad Zaenudin'),
      security: tx.security || tx.petugasSecurity || '',
      jenisTransaksi: tx.noGangguan || tx.keterangan || (tx.admMaterial === 'Masuk' ? 'Pengadaan / Restock UP3' : 'Gangguan dan Pemeliharaan'),
      reguYandal: tx.reguYandal || (tx.admMaterial === 'Masuk' ? 'LOGISTIK_UP3' : 'Kendaraan Yantek'),
      tanggal: tx.tanggal || '',
      items: tx.items ? tx.items.map(i => ({ ...i })) : []
    });
  };

  // Save Edit
  const handleSaveEdit = () => {
    if (!editingTx || !editFormData) return;
    try {
      updateWarehouseTransaction(editingTx.id, {
        namaPetugas: editFormData.namaPetugas,
        pemberiMaterial: editFormData.pemberiMaterial,
        security: editFormData.security,
        petugasSecurity: editFormData.security,
        noGangguan: editFormData.jenisTransaksi,
        reguYandal: editFormData.reguYandal,
        tanggal: editFormData.tanggal,
        items: editFormData.items
      });
      showFeedback('Perubahan data transaksi berhasil disimpan.', 'success');
      setEditingTx(null);
      setEditFormData(null);
    } catch (err) {
      console.error(err);
      showFeedback('Gagal menyimpan perubahan transaksi.', 'error');
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (tx: WarehouseTransaction) => {
    setDeletingTx(tx);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingTx) return;
    try {
      deleteWarehouseTransaction(deletingTx.id);
      showFeedback('Transaksi berhasil dihapus dari sistem.', 'info');
      setDeletingTx(null);
    } catch (err) {
      console.error(err);
      showFeedback('Gagal menghapus transaksi.', 'error');
    }
  };

  // ==========================================
  // VIEW 1: APPROVAL HUB (Pilihan Menu Approval)
  // ==========================================
  if (approvalView === 'hub') {
    return (
      <div className="max-w-5xl mx-auto py-6 sm:py-12 space-y-8 animate-in fade-in duration-300">
        {/* Header with Dark Blue Contrast Title */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-700 tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span>SISTEM APPROVAL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0f2852] tracking-tight">
            APPROVAL TRANSAKSI
          </h1>
          <p className="text-sm sm:text-base text-slate-700 font-medium">
            Daftar transaksi yang perlu diperiksa, disetujui, atau dicetak Surat Jalannya.
          </p>
        </div>

        {/* 2 Big Action Cards matching Template Gambar 1 & Gambar 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-2">
          {/* Card 01: Approval Material Keluar (Gambar 1) */}
          <div
            onClick={() => setApprovalView('keluar')}
            className="relative bg-white/95 backdrop-blur-xl rounded-[28px] border border-white/80 p-7 sm:p-8 shadow-xl hover:shadow-2xl transition-all cursor-pointer group flex flex-col justify-between overflow-hidden hover:-translate-y-1"
          >
            <span className="absolute top-4 right-6 text-5xl sm:text-6xl font-black text-slate-200/60 select-none pointer-events-none transition-colors group-hover:text-blue-100/70">
              01
            </span>

            <div className="space-y-6 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <ArrowDownToLine className="w-7 h-7 stroke-[2.2]" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-600 tracking-wider uppercase block">
                    TRANSAKSI KELUAR
                  </span>
                  {pendingOutgoingCount > 0 && (
                    <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                      {pendingOutgoingCount} pending
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  Material Keluar
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed pt-1">
                  Daftar transaksi yang tercatat melalui Menu Pengambilan Material. Dilengkapi tombol Approval, Cetak Surat Jalan, Reject, Edit, dan Hapus.
                </p>
              </div>
            </div>

            <div className="pt-8 flex items-center justify-between border-t border-slate-100/80 mt-6 relative z-10">
              <span className="text-xs font-bold text-slate-500">
                {outgoingTransactions.length} Total Transaksi
              </span>
              <span className="text-xs sm:text-sm font-bold text-blue-600 flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                <span>Buka Menu</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Card 02: Approval Penerimaan Material (Gambar 2) */}
          <div
            onClick={() => setApprovalView('masuk')}
            className="relative bg-white/95 backdrop-blur-xl rounded-[28px] border border-white/80 p-7 sm:p-8 shadow-xl hover:shadow-2xl transition-all cursor-pointer group flex flex-col justify-between overflow-hidden hover:-translate-y-1"
          >
            <span className="absolute top-4 right-6 text-5xl sm:text-6xl font-black text-slate-200/60 select-none pointer-events-none transition-colors group-hover:text-cyan-100/70">
              02
            </span>

            <div className="space-y-6 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <ArrowUpFromLine className="w-7 h-7 stroke-[2.2]" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-cyan-600 tracking-wider uppercase block">
                    TRANSAKSI MASUK
                  </span>
                  {pendingIncomingCount > 0 && (
                    <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                      {pendingIncomingCount} pending
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                  Penerimaan Material
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed pt-1">
                  Daftar transaksi yang tercatat melalui Menu Penerimaan Material. Dilengkapi tombol Approval, Reject, Edit, dan Hapus.
                </p>
              </div>
            </div>

            <div className="pt-8 flex items-center justify-between border-t border-slate-100/80 mt-6 relative z-10">
              <span className="text-xs font-bold text-slate-500">
                {incomingTransactions.length} Total Transaksi
              </span>
              <span className="text-xs sm:text-sm font-bold text-cyan-600 flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                <span>Buka Menu</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: MATERIAL KELUAR (Gambar 1) & PENERIMAAN MATERIAL (Gambar 2)
  // =========================================================================
  const isMasuk = approvalView === 'masuk';

  return (
    <div className="w-full space-y-5 font-sans menu-transition-enter pb-12">
      {/* 1. Header with Dark Blue Contrast Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {/* Breadcrumb Tag with Cyan Dot */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />
            <span className="text-[11px] font-extrabold tracking-wider text-sky-700 uppercase">
              {isMasuk ? 'APPROVAL · TRANSAKSI MASUK' : 'APPROVAL · TRANSAKSI KELUAR'}
            </span>
          </div>

          {/* Large Title in Dark Blue for high contrast on light background */}
          <h1 className="text-2xl sm:text-3xl font-black text-[#0f2852] tracking-tight">
            {isMasuk ? 'Penerimaan Material' : 'Material Keluar'}
          </h1>

          {/* Subtitle in high contrast slate */}
          <p className="text-xs sm:text-[13px] text-slate-600 font-medium mt-0.5">
            {isMasuk
              ? 'Daftar transaksi yang tercatat melalui Menu Penerimaan Material.'
              : 'Daftar transaksi yang tercatat melalui Menu Pengambilan Material.'}
          </p>
        </div>

        {/* Top Right Action Buttons: Muat Ulang & Kembali ke Approval */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-center">
          {/* Muat Ulang Button */}
          <button
            onClick={handleReload}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs hover:shadow-xs text-xs font-bold text-slate-700 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
            <span>Muat Ulang</span>
          </button>

          {/* Kembali ke Approval Hub Button matching Gambar 2 top right */}
          <button
            onClick={() => setApprovalView('hub')}
            className="px-4 py-2 rounded-xl bg-white/95 hover:bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs text-xs font-bold text-slate-800 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
            <span>Kembali ke Approval</span>
          </button>
        </div>
      </div>

      {/* Floating Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-medium flex items-center justify-between shadow-md transition-all animate-in fade-in slide-in-from-top-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : feedback.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Notification Banner (shown on Material Keluar matching Gambar 1) */}
      {!isMasuk && (
        <div className="w-full bg-[#ecfdf5] border border-[#a7f3d0] rounded-2xl px-5 py-3.5 text-[#065f46] text-xs font-medium shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
            <span>
              Ekspor selesai: {totalBarisMaterial} baris material dari {filteredTransactions.length} transaksi.
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#047857] bg-[#d1fae5] px-2.5 py-0.5 rounded-full hidden sm:inline-block">
            ULP Tanggul
          </span>
        </div>
      )}

      {/* 3. Filter Card matching Gambar 1 & Gambar 2 */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 shadow-sm p-5 space-y-4">
        {/* Top Header of Filter Card */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-800">Daftar Transaksi</h2>
          <span className="text-xs font-bold text-blue-600 bg-blue-50/90 border border-blue-100 px-3 py-1 rounded-full">
            {filteredTransactions.length} transaksi
          </span>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
          {/* Tanggal Transaksi Input */}
          <div className="sm:col-span-4 space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Tanggal Transaksi
            </label>
            <div className="relative flex items-center">
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                placeholder="dd/mm/tttt"
                className="w-full pl-3 pr-8 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
          </div>

          {/* Material Select Dropdown */}
          <div className="sm:col-span-5 space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Material
            </label>
            <div className="relative">
              <select
                value={filterMaterial}
                onChange={e => setFilterMaterial(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all truncate"
              >
                <option value="">Semua Material</option>
                {uniqueMaterialOptions.map((mat, idx) => (
                  <option key={idx} value={mat}>
                    {mat}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Bersihkan Filter Button */}
          <div className="sm:col-span-3">
            <button
              onClick={handleClearFilter}
              className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-bold text-slate-600 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Bersihkan Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Transactions Card List matching Gambar 1 (Material Keluar) & Gambar 2 (Penerimaan Material) */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white/95 rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Tidak ada transaksi ditemukan</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tidak ada data transaksi {isMasuk ? 'penerimaan material masuk' : 'material keluar'} yang sesuai dengan kriteria filter saat ini.
            </p>
            <button
              onClick={handleClearFilter}
              className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          filteredTransactions.map((tx, txIdx) => {
            const isApproved = tx.status === 'Approved';
            const isPending = tx.status === 'Pending';
            const isRejected = tx.status === 'Rejected';

            // Document / Transaction Number:
            // For Outgoing: SJ Number
            // For Incoming: BAPB / SJ UP3 / Column1
            const documentNumber = isMasuk
              ? (tx.column1 || tx.noGangguan || tx.keterangan || '189/X/AP/PERBK/JBK/2026')
              : (getTransactionSuratJalanNumber(tx, transactions) || `${txIdx + 1}/10/SJ/ULP-TGL/2026`);

            const displayPetugas = tx.namaPetugas || tx.petugasPelayananTeknik || (isMasuk ? 'RAMA' : 'david');
            const displayPemberi = tx.pemberiMaterial || (isMasuk ? 'GUDANG UP3 JEMBER' : 'Ahmad Zaenudin');
            const displaySecurity = tx.security || tx.petugasSecurity || (isMasuk ? 'SEPTIAN DWI CAHYO' : 'Idham');
            const displayJenis = tx.noGangguan || tx.keterangan || 'Gangguan dan Pemeliharaan';
            const displayKendaraan = tx.reguYandal || 'yandal';
            const displayTanggal = tx.tanggal || (tx.timestamp ? tx.timestamp.split(' ')[0] : '22/10/2026');

            // Items list
            const itemsList = tx.items && tx.items.length > 0
              ? tx.items
              : isMasuk
              ? [
                  { materialId: 'mat-kwh-1', materialName: 'MTR;kWH E-PR;1P;230V;5-60A;1;;2W', quantity: 100 },
                  { materialId: 'mat-kwh-2', materialName: 'MTR;kWH E;;1P;230V;5-60A;1;;2W', quantity: 100 }
                ]
              : [{ materialId: 'm-default', materialName: 'CUT OUT ACC;FUSE LINK 20kV 12A', quantity: 2 }];

            return (
              <div
                key={tx.id || txIdx}
                className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-md p-5 sm:p-6 transition-all hover:shadow-lg space-y-4 animate-in fade-in duration-200"
              >
                {/* Card Header: Surat Jalan / Document Number + Badge + Date */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      {documentNumber}
                    </h3>
                    <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                      Tanggal transaksi · {displayTanggal}
                    </div>
                  </div>

                  {/* Badge: Material Masuk vs Material Keluar */}
                  <span
                    className={`self-start sm:self-center text-xs font-bold px-3 py-1 rounded-full border ${
                      isMasuk
                        ? 'text-cyan-700 bg-cyan-50 border-cyan-200'
                        : 'text-sky-600 bg-sky-50 border-sky-100'
                    }`}
                  >
                    {isMasuk ? 'Material Masuk' : 'Material Keluar'}
                  </span>
                </div>

                {/* Card Body: 2 Columns Layout matching Gambar 1 & Gambar 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left Column: Transaction Details (Metadata) */}
                  <div className="lg:col-span-5 space-y-2 text-xs">
                    <div className="flex items-baseline">
                      <span className="w-36 text-slate-400 font-medium shrink-0">Pemberi Material</span>
                      <span className="text-slate-800 font-bold break-words text-blue-700">{displayPemberi}</span>
                    </div>
                    <div className="flex items-baseline">
                      <span className="w-36 text-slate-400 font-medium shrink-0">Petugas Pengambil</span>
                      <span className="text-slate-800 font-bold break-words">{displayPetugas}</span>
                    </div>
                    <div className="flex items-baseline">
                      <span className="w-36 text-slate-400 font-medium shrink-0">Petugas Security</span>
                      <span className="text-slate-800 font-bold break-words">{displaySecurity}</span>
                    </div>

                    {/* Outgoing specific metadata matching Gambar 1 */}
                    {!isMasuk && (
                      <>
                        <div className="flex items-baseline">
                          <span className="w-36 text-slate-400 font-medium shrink-0">Jenis Transaksi</span>
                          <span className="text-slate-800 font-bold break-words">{displayJenis}</span>
                        </div>
                        <div className="flex items-baseline">
                          <span className="w-36 text-slate-400 font-medium shrink-0">Kendaraan</span>
                          <span className="text-slate-800 font-bold break-words">{displayKendaraan}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right Column: Material dan Jumlah List */}
                  <div className="lg:col-span-7">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Material dan Jumlah
                    </span>

                    <div className="space-y-1.5">
                      {itemsList.map((item, iIdx) => {
                        const sat = getSatuan(item.materialName).toLowerCase() || 'unit';
                        return (
                          <div
                            key={iIdx}
                            className="bg-slate-50/90 border border-slate-200/60 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs transition-colors hover:bg-slate-50"
                          >
                            <span className="font-semibold text-slate-700 truncate pr-3 uppercase">
                              {item.materialName}
                            </span>
                            <span className="font-extrabold text-blue-600 bg-blue-50/80 border border-blue-100/90 px-2.5 py-0.5 rounded-lg text-xs shrink-0 whitespace-nowrap">
                              {item.quantity} {sat === 'm' ? 'meter' : sat}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Status on Left + Action Buttons on Right */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-slate-100 gap-3">
                  {/* Status Badge on Left */}
                  <div>
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Disetujui
                      </span>
                    ) : isPending ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Menunggu Approval
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Ditolak
                      </span>
                    )}
                  </div>

                  {/* Action Buttons Row on Right */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* 1. Approval Button */}
                    <button
                      type="button"
                      onClick={() => handleApprove(tx)}
                      disabled={isApproved}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer ${
                        isApproved
                          ? 'bg-emerald-500/80 text-white cursor-default'
                          : 'bg-[#10b981] hover:bg-[#059669] text-white'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approval</span>
                    </button>

                    {/* 2. Cetak Button (ONLY on Outgoing Material Keluar matching Gambar 1; NOT on Gambar 2) */}
                    {!isMasuk && (
                      <button
                        type="button"
                        onClick={() => handlePrint(tx)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0ea5e9] hover:bg-[#0284c7] text-white flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak</span>
                      </button>
                    )}

                    {/* 3. Reject Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenReject(tx)}
                      disabled={isRejected}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer ${
                        isRejected
                          ? 'bg-rose-400/80 text-white cursor-default'
                          : 'bg-[#fb7185] hover:bg-[#f43f5e] text-white'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    {/* 4. Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(tx)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#eff6ff] hover:bg-[#dbeafe] text-[#2563eb] border border-[#bfdbfe] flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* 5. Hapus Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenDelete(tx)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#fff1f2] hover:bg-[#ffe4e6] text-[#e11d48] border border-[#fecdd3] flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Surat Jalan Modal (Outgoing only) */}
      {selectedSuratJalan && (
        <SuratJalanModal
          isOpen={isSuratJalanOpen}
          onClose={() => {
            setIsSuratJalanOpen(false);
            forceUnlockScroll();
          }}
          data={selectedSuratJalan}
        />
      )}

      {/* Edit Transaction Modal */}
      {editingTx && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs modal-backdrop-animate overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden modal-content-animate max-h-[92vh] flex flex-col m-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Edit Data Transaksi {editingTx.admMaterial === 'Masuk' ? 'Penerimaan' : 'Pengambilan'}
                </h3>
                <p className="text-xs text-slate-500">
                  Perbarui rincian data petugas dan kuantiti material.
                </p>
              </div>
              <button
                onClick={() => setEditingTx(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div>
                <label className="font-bold text-slate-600 mb-1 block">
                  {editingTx.admMaterial === 'Masuk' ? 'Petugas Penerima' : 'Petugas Pengambil'}
                </label>
                <input
                  type="text"
                  value={editFormData.namaPetugas}
                  onChange={e => setEditFormData({ ...editFormData, namaPetugas: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <StaffSelectDropdown
                  label="Pemberi Material (Kolom Spreadsheet)"
                  badge="Spreadsheet"
                  value={editFormData.pemberiMaterial}
                  onChange={val => setEditFormData({ ...editFormData, pemberiMaterial: val })}
                  options={DAFTAR_PEMBERI_MATERIAL}
                  placeholder="-- Pilih Pemberi Material --"
                  required
                />
              </div>

              <div>
                <StaffSelectDropdown
                  label="Petugas Security (Keamanan)"
                  badge="Spreadsheet"
                  value={editFormData.security}
                  onChange={val => setEditFormData({ ...editFormData, security: val })}
                  options={DAFTAR_PETUGAS_SECURITY}
                  placeholder="-- Pilih Petugas Security --"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 mb-1 block">
                  {editingTx.admMaterial === 'Masuk' ? 'Nomor BAPB / Dokumen' : 'Jenis Transaksi'}
                </label>
                {editingTx.admMaterial === 'Masuk' ? (
                  <input
                    type="text"
                    value={editFormData.jenisTransaksi}
                    onChange={e => setEditFormData({ ...editFormData, jenisTransaksi: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                ) : (
                  <select
                    value={editFormData.jenisTransaksi}
                    onChange={e => setEditFormData({ ...editFormData, jenisTransaksi: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="PASANG BARU">PASANG BARU</option>
                    <option value="PERUBAHAN DAYA DAN MIGRASI">PERUBAHAN DAYA DAN MIGRASI</option>
                    <option value="GANGGUAN DAN PEMELIHARAAN">GANGGUAN DAN PEMELIHARAAN</option>
                    <option value="GANTI METER">GANTI METER</option>
                    <option value="P2TL">P2TL</option>
                  </select>
                )}
              </div>

              {editingTx.admMaterial !== 'Masuk' && (
                <div>
                  <label className="font-bold text-slate-600 mb-1 block">Kendaraan / Regu</label>
                  <input
                    type="text"
                    value={editFormData.reguYandal}
                    onChange={e => setEditFormData({ ...editFormData, reguYandal: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-600 mb-1 block">Tanggal Transaksi</label>
                <input
                  type="text"
                  value={editFormData.tanggal}
                  onChange={e => setEditFormData({ ...editFormData, tanggal: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Material Items Quantities */}
              <div className="pt-2">
                <label className="font-bold text-slate-700 uppercase tracking-wider mb-2 block text-[11px]">
                  Daftar Material & Jumlah
                </label>
                <div className="space-y-2">
                  {editFormData.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                      <span className="font-medium text-slate-800 truncate flex-1">
                        {item.materialName}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={e => {
                            const newQty = parseInt(e.target.value, 10) || 0;
                            const updatedItems = [...editFormData.items];
                            updatedItems[idx].quantity = newQty;
                            setEditFormData({ ...editFormData, items: updatedItems });
                          }}
                          className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg text-right font-bold text-blue-600"
                        />
                        <span className="text-slate-400 font-semibold">{getSatuan(item.materialName)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs modal-backdrop-animate overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden modal-content-animate m-auto">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Tolak Transaksi {rejectingTx.admMaterial === 'Masuk' ? 'Penerimaan Material' : 'Pengambilan Material'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Masukkan alasan penolakan transaksi ini. Status akan diubah menjadi Ditolak dan tercatat di audit trail.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Alasan Penolakan
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Misal: Stok fisik di rak berbeda, atau identitas petugas belum valid..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRejectingTx(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Konfirmasi Tolak</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (CENTERED IN VIEWPORT - ZERO SCROLL) */}
      {deletingTx && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs modal-backdrop-animate">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden modal-content-animate m-auto">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Hapus Transaksi Material?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tindakan ini akan menghapus data transaksi dari sistem dan menyesuaikan kembali saldo fisik gudang.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800">
                  {deletingTx.admMaterial === 'Masuk'
                    ? (deletingTx.column1 || deletingTx.noGangguan || 'Transaksi Penerimaan')
                    : getTransactionSuratJalanNumber(deletingTx, transactions)}
                </div>
                <div className="text-slate-500">
                  Petugas: {deletingTx.namaPetugas || deletingTx.petugasPelayananTeknik || '-'} · {deletingTx.tanggal}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingTx(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Transaksi</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
