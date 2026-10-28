import * as XLSX from 'xlsx';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MaterialItem, WarehouseTransaction, MaterialCategory } from '../types/warehouse';
import { saveMaterials } from '../utils/inventoryStore';
import {
  exportDbMaterialToExcel,
  parseDbMaterialPasteOrRows,
} from '../utils/spreadsheetSync';
import { useModalScrollLock } from '../utils/modalScrollLock';
import {
  Upload,
  Download,
  Plus,
  Edit2,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  AlertTriangle,
  Layers,
  RefreshCw,
  ClipboardPaste,
  Database
} from 'lucide-react';

interface DataMaterialDanSaldoViewProps {
  materials: MaterialItem[];
  transactions: WarehouseTransaction[];
  onBackToHub: () => void;
  onMaterialsUpdated?: () => void;
}

export const DataMaterialDanSaldoView: React.FC<DataMaterialDanSaldoViewProps> = ({
  materials,
  transactions,
  onBackToHub,
  onMaterialsUpdated
}) => {
  // Local list
  const [materialList, setMaterialList] = useState<MaterialItem[]>(materials);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>({
    type: 'success',
    message: `${materials.length} data material aktif dalam sistem persediaan gudang.`
  });

  // Collective / Bulk Selection (Hapus Kolektif)
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Manual Add Form Visibility
  const [isManualFormOpen, setIsManualFormOpen] = useState(false);
  const [formNormalisasi, setFormNormalisasi] = useState('');
  const [formNamaMaterial, setFormNamaMaterial] = useState('');
  const [formSatuan, setFormSatuan] = useState('');
  const [formStokSiap, setFormStokSiap] = useState<number>(0);
  const [formKategori, setFormKategori] = useState<MaterialCategory>('KWH & MCB');
  const [formLokasiRak, setFormLokasiRak] = useState('Gudang Utama');

  // Edit Modal State
  const [editingMaterial, setEditingMaterial] = useState<MaterialItem | null>(null);
  const [editNormalisasi, setEditNormalisasi] = useState('');
  const [editNamaMaterial, setEditNamaMaterial] = useState('');
  const [editSatuan, setEditSatuan] = useState('');
  const [editStokSiap, setEditStokSiap] = useState<number>(0);
  const [editKategori, setEditKategori] = useState<MaterialCategory>('KWH & MCB');
  const [editLokasiRak, setEditLokasiRak] = useState('');

  // Delete Single Modal State
  const [deletingMaterial, setDeletingMaterial] = useState<MaterialItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');

  // Lock window scroll so popups appear directly without scroll up/down
  useModalScrollLock(Boolean(deletingMaterial || isBulkDeleteModalOpen || editingMaterial || isManualFormOpen || isPasteModalOpen));

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  // Pagination
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Keep synced with prop
  useEffect(() => {
    setMaterialList(materials);
  }, [materials]);

  // Filter & Search
  const filteredMaterials = useMemo(() => {
    if (!searchQuery.trim()) return materialList;
    const q = searchQuery.toLowerCase().trim();
    return materialList.filter(
      m =>
        m.code.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.unit.toLowerCase().includes(q) ||
        (m.category && m.category.toLowerCase().includes(q))
    );
  }, [materialList, searchQuery]);

  // Pagination slicing
  const isAll = pageSize <= 0;
  const totalItems = filteredMaterials.length;
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const displayedMaterials = useMemo(() => {
    if (isAll) return filteredMaterials;
    const start = (currentPage - 1) * pageSize;
    return filteredMaterials.slice(start, start + pageSize);
  }, [filteredMaterials, currentPage, pageSize, isAll]);

  // Collective Selection Helpers
  const isAllDisplayedSelected = useMemo(() => {
    if (displayedMaterials.length === 0) return false;
    return displayedMaterials.every(m => selectedMaterialIds.includes(m.id));
  }, [displayedMaterials, selectedMaterialIds]);

  const toggleSelectAllDisplayed = () => {
    if (isAllDisplayedSelected) {
      const displayedIds = new Set(displayedMaterials.map(m => m.id));
      setSelectedMaterialIds(prev => prev.filter(id => !displayedIds.has(id)));
    } else {
      const next = new Set(selectedMaterialIds);
      displayedMaterials.forEach(m => next.add(m.id));
      setSelectedMaterialIds(Array.from(next));
    }
  };

  const toggleSelectMaterial = (id: string) => {
    setSelectedMaterialIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    setSelectedMaterialIds(filteredMaterials.map(m => m.id));
  };

  const handleClearSelection = () => {
    setSelectedMaterialIds([]);
  };

  // Bulk Delete Execution
  const handleConfirmBulkDelete = () => {
    if (selectedMaterialIds.length === 0) return;
    setIsDeletingBulk(true);
    try {
      const toDeleteSet = new Set(selectedMaterialIds);
      const count = toDeleteSet.size;
      const updated = materialList.filter(m => !toDeleteSet.has(m.id));

      saveMaterials(updated);
      setMaterialList(updated);
      setSelectedMaterialIds([]);
      setIsBulkDeleteModalOpen(false);
      if (onMaterialsUpdated) onMaterialsUpdated();

      setFeedback({
        type: 'success',
        message: `${count} material berhasil dihapus secara kolektif.`
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Gagal menghapus kolektif: ${err?.message || 'Kesalahan sistem'}`
      });
    } finally {
      setIsDeletingBulk(false);
    }
  };

  // Handle Save Manual Material
  const handleSaveManualMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaMaterial.trim()) {
      setFeedback({ type: 'error', message: 'Harap isi Nama Material.' });
      return;
    }

    const newCode = formNormalisasi.trim() || `00000000000${Math.floor(10000000 + Math.random() * 90000000)}`;
    const newUnit = formSatuan.trim() || 'BH';
    const newQty = Number(formStokSiap) || 0;

    const newMat: MaterialItem = {
      id: `mat-${Date.now()}`,
      code: newCode,
      name: formNamaMaterial.trim(),
      category: formKategori || 'KWH & MCB',
      unit: newUnit,
      initialStock: newQty,
      totalIn: 0,
      totalOut: 0,
      totalReturn: 0,
      currentStock: newQty,
      minSafetyStock: Math.max(1, Math.floor(newQty * 0.1)),
      rackLocation: formLokasiRak.trim() || 'Gudang Utama',
      lastUpdated: new Date().toISOString()
    };

    const updated = [newMat, ...materialList];
    saveMaterials(updated);
    setMaterialList(updated);
    if (onMaterialsUpdated) onMaterialsUpdated();

    // Reset Form
    setFormNormalisasi('');
    setFormNamaMaterial('');
    setFormSatuan('');
    setFormStokSiap(0);
    setIsManualFormOpen(false);

    setFeedback({
      type: 'success',
      message: `Material "${newMat.name}" (NORMALISASI: ${newMat.code}) berhasil ditambahkan.`
    });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Open Edit Modal
  const handleOpenEdit = (mat: MaterialItem) => {
    setEditingMaterial(mat);
    setEditNormalisasi(mat.code);
    setEditNamaMaterial(mat.name);
    setEditSatuan(mat.unit);
    setEditStokSiap(mat.currentStock);
    setEditKategori(mat.category || 'KWH & MCB');
    setEditLokasiRak(mat.rackLocation || 'Gudang Utama');
  };

  // Save Edit Material
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;

    const diff = (Number(editStokSiap) || 0) - editingMaterial.currentStock;
    const updated = materialList.map(m => {
      if (m.id === editingMaterial.id) {
        return {
          ...m,
          code: editNormalisasi.trim() || m.code,
          name: editNamaMaterial.trim() || m.name,
          unit: editSatuan.trim() || m.unit,
          category: editKategori,
          rackLocation: editLokasiRak.trim() || m.rackLocation,
          initialStock: Math.max(0, m.initialStock + diff),
          currentStock: Math.max(0, Number(editStokSiap) || 0),
          lastUpdated: new Date().toISOString()
        };
      }
      return m;
    });

    saveMaterials(updated);
    setMaterialList(updated);
    if (onMaterialsUpdated) onMaterialsUpdated();

    setEditingMaterial(null);
    setFeedback({
      type: 'success',
      message: `Data material "${editNamaMaterial}" (NORMALISASI: ${editNormalisasi}) berhasil diperbarui.`
    });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Request Single Delete Material
  const handleRequestDelete = (mat: MaterialItem) => {
    setDeletingMaterial(mat);
  };

  // Confirm Single Delete Material
  const handleConfirmDelete = () => {
    if (!deletingMaterial) return;
    setIsDeleting(true);
    try {
      const updated = materialList.filter(m => m.id !== deletingMaterial.id);
      saveMaterials(updated);
      setMaterialList(updated);
      setSelectedMaterialIds(prev => prev.filter(id => id !== deletingMaterial.id));
      if (onMaterialsUpdated) onMaterialsUpdated();

      setFeedback({
        type: 'success',
        message: `Material "${deletingMaterial.name}" (NORMALISASI: ${deletingMaterial.code}) berhasil dihapus.`
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Gagal menghapus material: ${err?.message || 'Terjadi kesalahan sistem'}`
      });
      setTimeout(() => setFeedback(null), 5000);
    } finally {
      setIsDeleting(false);
      setDeletingMaterial(null);
    }
  };

  // Export Material to Excel (.xlsx) / CSV
  const handleExportExcel = () => {
    try {
      exportDbMaterialToExcel(materialList);
      setFeedback({
        type: 'success',
        message: `${materialList.length} data material berhasil diekspor ke Excel (.xlsx).`
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Gagal mengekspor data: ${err?.message || 'Kesalahan sistem'}`
      });
    }
  };

  // Upload Excel / CSV file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
    }
  };

  const handleUploadExcel = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setFeedback({
        type: 'error',
        message: 'Pilih file Excel (.xlsx / .xls) atau CSV terlebih dahulu.'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const wb = XLSX.read(arrayBuffer, { type: 'array' });
        const targetSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[targetSheetName];

        if (!ws) {
          throw new Error('Sheet dalam file Excel tidak terbaca.');
        }

        const csvData = XLSX.utils.sheet_to_csv(ws);
        const { items, updatedCount, createdCount } = parseDbMaterialPasteOrRows(
          csvData,
          materialList
        );

        saveMaterials(items);
        setMaterialList(items);
        if (onMaterialsUpdated) onMaterialsUpdated();

        setFeedback({
          type: 'success',
          message: `Berhasil memproses "${file.name}": ${updatedCount} material diperbarui, ${createdCount} material baru ditambahkan.`
        });
        setTimeout(() => setFeedback(null), 6000);
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: `Gagal membaca file: ${err?.message || 'Format tidak sesuai'}`
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };



  // 3. Terapkan data dari salin-tempel baris tabel / Excel
  const handleApplyPasteFromSheet = () => {
    if (!pasteText.trim()) {
      setFeedback({
        type: 'error',
        message: 'Teks tempel masih kosong. Salin baris data tabel lalu tempel di sini.'
      });
      return;
    }

    try {
      const { items, updatedCount, createdCount } = parseDbMaterialPasteOrRows(
        pasteText,
        materialList
      );
      saveMaterials(items);
      setMaterialList(items);
      if (onMaterialsUpdated) onMaterialsUpdated();
      setFeedback({
        type: 'success',
        message: `Berhasil memproses: ${updatedCount} saldo material diperbarui, ${createdCount} material baru ditambahkan.`
      });
      setIsPasteModalOpen(false);
      setPasteText('');
      setTimeout(() => setFeedback(null), 7000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Format tempel tidak sesuai: ${err?.message || 'Pastikan kolom sesuai'}`
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 max-w-[1400px] mx-auto">
      {/* 1. TOP HEADER - TULISAN "DAFTAR MATERIAL DAN SALDO" MENJADI BIRU TUA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-black text-cyan-500 tracking-wider uppercase drop-shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-300" />
            <span>• DATA MASTER · PERSEDIAAN GUDANG</span>
          </div>
          {/* TULISAN DAFTAR MATERIAL DAN SALDO BIRU TUA */}
          <h1 className="text-3xl sm:text-4xl font-black text-[#0B2545] tracking-tight drop-shadow-sm">
            Daftar Material dan Saldo
          </h1>
          <p className="text-sm text-slate-700 font-medium">
            Kelola master material, kode normalisasi PLN, dan saldo persediaan gudang secara akurat.
          </p>
        </div>

        {/* Back to Data Master Hub */}
        <button
          type="button"
          onClick={onBackToHub}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-800 bg-white/95 hover:bg-white active:scale-95 border border-white/80 rounded-full shadow-md transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Data Master</span>
        </button>
      </div>

      {/* 2. TOP ACTION CARD: UPLOAD EXCEL & EXPORT (ORIGINAL CLEAN GLASS STYLE) */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-xl border border-white/80 space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          {/* Left Icon & Text */}
          <div className="flex items-start gap-4 max-w-xl">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Upload className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-[#0B2545]">
                  Upload Excel Daftar Material dan Saldo
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  NORMALISASI
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                Gunakan format kolom <strong>NORMALISASI</strong>, <strong>Nama Material</strong>, <strong>Satuan</strong>, dan <strong>Stock Siap</strong> dari file Excel (.xlsx / .xls) atau CSV.
              </p>
            </div>
          </div>

          {/* Right Inputs & Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
            {/* File Input */}
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls,.csv,.tsv"
                onChange={handleFileChange}
                className="hidden"
                id="excel-material-upload"
              />
              <label
                htmlFor="excel-material-upload"
                className="px-3.5 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl cursor-pointer transition-colors inline-block max-w-[170px] truncate"
                title={selectedFileName || 'Pilih file Excel / CSV'}
              >
                {selectedFileName ? selectedFileName : 'Pilih File Excel'}
              </label>
            </div>

            {/* Button: Upload Excel */}
            <button
              type="button"
              onClick={handleUploadExcel}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Upload Excel
            </button>

            {/* Button: Export Material */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-4 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 active:scale-95 border border-slate-300 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Material</span>
            </button>

            {/* Button: Tempel Saldo */}
            <button
              type="button"
              onClick={() => setIsPasteModalOpen(true)}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 active:scale-95 border border-slate-300 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Tempel baris tabel yang disalin dari Excel"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-slate-500" />
              <span>Tempel Saldo</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert Pill inside card */}
        {feedback && (
          <div
            className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 border animate-in fade-in duration-200 ${
              feedback.type === 'success'
                ? 'text-emerald-900 bg-emerald-50 border-emerald-200'
                : 'text-rose-900 bg-rose-50 border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* 3. MAIN TABLE CARD: DAFTAR PERSEDIAAN (ORIGINAL CLEAN GLASS STYLE) */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-7 shadow-xl border border-white/80 space-y-4">
        {/* Header of Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-600 tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>• DAFTAR PERSEDIAAN</span>
            </div>
            {/* TULISAN DAFTAR MATERIAL DAN SALDO BIRU TUA */}
            <h2 className="text-xl sm:text-2xl font-black text-[#0B2545] mt-0.5">
              Daftar Material dan Saldo
            </h2>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
            {/* Counter badge: Total material */}
            <span className="text-xs font-bold font-mono text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              {materialList.length} Material
            </span>

            {/* Button: + Tambah Material Manual */}
            <button
              type="button"
              onClick={() => setIsManualFormOpen(!isManualFormOpen)}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Material Manual</span>
            </button>
          </div>
        </div>

        {/* 4. EXPANDABLE FORM: TAMBAH MATERIAL MANUAL (NORMALISASI) */}
        {isManualFormOpen && (
          <form
            onSubmit={handleSaveManualMaterial}
            className="bg-slate-50/90 border border-slate-200 rounded-2xl p-5 space-y-4 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Tambah Material Manual</span>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    NORMALISASI
                  </span>
                </h4>
                <p className="text-xs text-slate-500">
                  Isi kode normalisasi PLN, nama material, satuan, dan stok siap.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsManualFormOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* NORMALISASI */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    NORMALISASI
                  </label>
                  <span className="text-[10px] text-blue-700 font-mono font-bold">KODE PLN</span>
                </div>
                <input
                  type="text"
                  value={formNormalisasi}
                  onChange={e => setFormNormalisasi(e.target.value)}
                  placeholder="Contoh: 3200018 atau 2190222"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Nama Material */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Nama Material
                </label>
                <input
                  type="text"
                  required
                  value={formNamaMaterial}
                  onChange={e => setFormNamaMaterial(e.target.value)}
                  placeholder="Contoh: CUT OUT ACC;FUSE LINK 20kV 5A"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Satuan */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Satuan
                </label>
                <input
                  type="text"
                  value={formSatuan}
                  onChange={e => setFormSatuan(e.target.value)}
                  placeholder="Contoh: BH, MTR, SET"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Stok Siap */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Stok Siap
                </label>
                <input
                  type="number"
                  min="0"
                  value={formStokSiap}
                  onChange={e => setFormStokSiap(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-right"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsManualFormOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Simpan Material
              </button>
            </div>
          </form>
        )}

        {/* 5. SELECTION BAR UNTUK HAPUS KOLEKTIF */}
        {selectedMaterialIds.length > 0 && (
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-2xl p-3.5 sm:p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-mono font-black text-xs text-white">
                {selectedMaterialIds.length}
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black tracking-wide">
                  {selectedMaterialIds.length} Material Terpilih
                </div>
                <div className="text-[11px] text-blue-200 font-medium">
                  Siap untuk dihapus secara kolektif dari database persediaan
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="px-3 py-1.5 text-xs font-bold bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-xl transition-all cursor-pointer"
              >
                Pilih Semua ({filteredMaterials.length})
              </button>
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl transition-all cursor-pointer"
              >
                Batal Pilih
              </button>
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="px-4 py-1.5 text-xs font-bold bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Kolektif ({selectedMaterialIds.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* Search & Page Size Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari NORMALISASI atau nama material..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Page size toggle */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs font-bold text-slate-500">Tampilkan:</span>
            <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              {[10, 50, 100].map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    pageSize === size
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {size}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setPageSize(-1);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  pageSize <= 0
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
            </div>
          </div>
        </div>

        {/* 6. TABLE OF MATERIALS WITH NORMALISASI & COLLECTIVE CHECKBOXES */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-800 text-[11px] font-black uppercase tracking-wider">
                  {/* Bulk Select Checkbox */}
                  <th className="py-3.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllDisplayedSelected}
                      onChange={toggleSelectAllDisplayed}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      title={
                        isAllDisplayedSelected
                          ? 'Batal pilih semua halaman ini'
                          : 'Pilih semua material di halaman ini'
                      }
                    />
                  </th>
                  <th className="py-3.5 px-4 font-black min-w-[170px] text-blue-950 bg-blue-50/50">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span>NORMALISASI</span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4 font-black">Nama Material</th>
                  <th className="py-3.5 px-3 font-black w-24">Satuan</th>
                  <th className="py-3.5 px-3.5 font-black w-28 text-right">Stok Siap</th>
                  <th className="py-3.5 px-3.5 font-black w-36 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Tidak ada material yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  displayedMaterials.map((mat, idx) => {
                    const isSelected = selectedMaterialIds.includes(mat.id);
                    return (
                      <tr
                        key={mat.id}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-blue-50/90 border-l-4 border-l-blue-600'
                            : idx % 2 === 1
                            ? 'bg-slate-50/40 hover:bg-slate-100/70'
                            : 'bg-white hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3.5 px-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectMaterial(mat.id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        {/* NORMALISASI (Badge) */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap bg-blue-50/20">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200/80 font-black text-xs font-mono shadow-2xs">
                            {mat.code}
                          </span>
                        </td>

                        {/* Nama Material */}
                        <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-md">
                          {mat.name}
                        </td>

                        {/* Satuan */}
                        <td className="py-3.5 px-3 text-slate-600 font-medium uppercase font-mono">
                          {mat.unit}
                        </td>

                        {/* Stok Siap */}
                        <td className="py-3.5 px-3.5 text-right font-mono font-black text-slate-950 tabular-nums text-sm">
                          {mat.currentStock}
                        </td>

                        {/* Aksi: Edit & Hapus button */}
                        <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(mat)}
                              className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 active:scale-95 border border-slate-300 rounded-lg transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                              title="Edit material dan stok siap"
                            >
                              <Edit2 className="w-3 h-3 text-slate-500" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRequestDelete(mat)}
                              className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 active:scale-95 border border-rose-200 rounded-lg transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                              title="Hapus material dari daftar"
                            >
                              <Trash2 className="w-3 h-3 text-rose-600" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Bar */}
        {!isAll && totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 pt-2 text-xs text-slate-500 flex-wrap">
            <span>
              Menampilkan {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, totalItems)} dari {totalItems} material
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 cursor-pointer"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 font-bold cursor-pointer"
              >
                Prev
              </button>
              <span className="px-2 font-mono font-bold text-slate-800">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 font-bold cursor-pointer"
              >
                Next
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 cursor-pointer"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 7. MODAL KONFIRMASI HAPUS KOLEKTIF (CENTERED IN VIEWPORT - ZERO SCROLL) */}
      {isBulkDeleteModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4 m-auto">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">
                  Hapus Kolektif {selectedMaterialIds.length} Material?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Material terpilih akan dihapus permanen dari master material dan persediaan gudang.
                </p>
              </div>
            </div>

            {/* Compact Preview Box */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs">
              <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center justify-between pb-1 border-b border-slate-200">
                <span>Ringkasan Pilihan:</span>
                <span className="font-mono text-blue-700 font-bold">{selectedMaterialIds.length} Material</span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {selectedMaterialIds.slice(0, 4).map(id => {
                  const mat = materialList.find(m => m.id === id);
                  if (!mat) return null;
                  return (
                    <div key={id} className="flex items-center justify-between gap-2 py-0.5 border-b border-slate-100 last:border-none text-[11px]">
                      <span className="text-slate-800 font-medium truncate">
                        <strong className="font-mono text-blue-700 mr-1.5">{mat.code}</strong>
                        {mat.name}
                      </span>
                      <span className="text-slate-600 font-mono font-bold shrink-0">
                        {mat.currentStock} {mat.unit}
                      </span>
                    </div>
                  );
                })}
              </div>
              {selectedMaterialIds.length > 4 && (
                <div className="text-center text-[10.5px] text-slate-400 font-semibold pt-0.5">
                  + {selectedMaterialIds.length - 4} material lainnya terpilih
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                disabled={isDeletingBulk}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                disabled={isDeletingBulk}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingBulk ? 'Menghapus...' : `Ya, Hapus (${selectedMaterialIds.length})`}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 8. MODAL EDIT MATERIAL (WITH SCROLL DOWN) */}
      {editingMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Edit Data Material & Stok
                  </h3>
                  <p className="text-xs text-slate-500">
                    Perbarui NORMALISASI atau saldo stok siap di gudang.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMaterial(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-4 sm:p-5 space-y-3.5">
              {/* NORMALISASI */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  NORMALISASI
                </label>
                <input
                  type="text"
                  required
                  value={editNormalisasi}
                  onChange={e => setEditNormalisasi(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Nama Material */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Nama Material
                </label>
                <input
                  type="text"
                  required
                  value={editNamaMaterial}
                  onChange={e => setEditNamaMaterial(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Satuan */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Satuan
                  </label>
                  <input
                    type="text"
                    required
                    value={editSatuan}
                    onChange={e => setEditSatuan(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Stok Siap */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Stok Siap
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editStokSiap}
                    onChange={e => setEditStokSiap(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-right"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. MODAL KONFIRMASI HAPUS MATERIAL TUNGGAL (CENTERED IN VIEWPORT - ZERO SCROLL) */}
      {deletingMaterial && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4 m-auto">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">
                  Hapus Material Ini?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Material akan dihapus dari daftar master dan saldo persediaan gudang.
                </p>
              </div>
            </div>

            {/* Info Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-xs">
              <div className="font-bold text-slate-900 text-[13px]">
                {deletingMaterial.name}
              </div>
              <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px] pt-0.5">
                <span className="font-bold">NORMALISASI:</span>
                <span className="font-bold text-blue-700">{deletingMaterial.code}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                <span className="font-bold">Stok Siap:</span>
                <span className="font-mono font-bold text-slate-800">
                  {deletingMaterial.currentStock} {deletingMaterial.unit}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingMaterial(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Material'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL TEMPEL SALDO (PASTE DARI EXCEL / TABEL) */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                  <ClipboardPaste className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Tempel Data Saldo &amp; Material
                  </h3>
                  <p className="text-xs text-slate-500">
                    Salin baris data tabel dari Excel lalu tempel di sini untuk pembaruan saldo instan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasteModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Data Baris Tabel (Format: NORMALISASI, Nama Material, Satuan, Stock Siap)
              </label>
              <textarea
                rows={7}
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder="Contoh salinan sel:&#10;3200018	CUT OUT ACC;FUSE LINK 20kV 5A	pcs	85	Konektor & Jointing	Rak A-01&#10;3250048	MCB;230/400V;1P;4A;50Hz;	pcs	651	KWH & MCB	Rak H-02"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-500">
                *Dapat berupa salinan langsung dari Excel (tab-separated) atau file CSV (koma / titik koma).
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPasteModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyPasteFromSheet}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Terapkan Pembaruan Saldo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
