import React, { useState } from 'react';
import { MaterialItem, WarehouseTransaction, AppUser, SuratJalanData } from '../types/warehouse';
import { addWarehouseTransaction } from '../utils/inventoryStore';
import { sendTransactionToSpreadsheet } from '../utils/spreadsheetSync';
import { createSuratJalanFromTransaction, getNormalisasiCode } from '../utils/suratJalanHelper';
import { SuratJalanModal } from './SuratJalanModal';
import { MonitoringMaterialList } from './MonitoringMaterialList';
import { MaterialRowSearchSelector } from './MaterialSearchCombobox';
import { StaffSelectDropdown } from './StaffSelectDropdown';
import { DAFTAR_PEMBERI_MATERIAL, DAFTAR_PETUGAS_SECURITY } from '../data/warehouseStaff';
import {
  Camera,
  Upload,
  Plus,
  Trash2,
  Calendar,
  Check,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';

interface FormPenerimaanMaterialProps {
  currentUser: AppUser;
  materials: MaterialItem[];
  transactions: WarehouseTransaction[];
  onFinish?: () => void;
}

export const FormPenerimaanMaterial: React.FC<FormPenerimaanMaterialProps> = ({
  currentUser,
  materials,
  transactions,
  onFinish
}) => {
  // Nomor Surat Jalan UP3
  const [nomorSjUp3, setNomorSjUp3] = useState('');

  // Date state
  const [tanggalDate, setTanggalDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [isEditingDate, setIsEditingDate] = useState(false);

  // Form Fields matching MARVEL-WAREHOUSE spreadsheet columns
  const [jabatan, setJabatan] = useState('ADMIN GUDANG UP3');
  const [reguYandal, setReguYandal] = useState('LOGISTIK_UP3');
  const [namaPetugas, setNamaPetugas] = useState(() => (currentUser?.name ? currentUser.name.toUpperCase() : ''));
  const [pemberiMaterial, setPemberiMaterial] = useState<string>(DAFTAR_PEMBERI_MATERIAL[0]);
  const [petugasSecurity, setPetugasSecurity] = useState<string>(DAFTAR_PETUGAS_SECURITY[0]);
  const [evidenUrl, setEvidenUrl] = useState('');
  const [evidenceFileName, setEvidenceFileName] = useState('');

  // Items list
  const [itemRows, setItemRows] = useState<
    { materialId: string; quantity: number }[]
  >([{ materialId: materials[0]?.id || '', quantity: 10 }]);

  // Messages & Modals
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [highlightTxId, setHighlightTxId] = useState<string | null>(null);
  const [selectedSuratJalan, setSelectedSuratJalan] = useState<SuratJalanData | null>(null);
  const [isSuratJalanOpen, setIsSuratJalanOpen] = useState(false);

  const formatDateDisplay = (isoDate: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
  };

  const handleAddMaterialRow = () => {
    setItemRows(prev => [
      ...prev,
      { materialId: materials[0]?.id || '', quantity: 1 }
    ]);
  };

  const handleRemoveMaterialRow = (index: number) => {
    if (itemRows.length <= 1) return;
    setItemRows(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleMaterialChange = (index: number, materialId: string) => {
    setItemRows(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], materialId };
      return copy;
    });
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const validQty = isNaN(qty) ? 0 : Math.max(0, qty);
    setItemRows(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], quantity: validQty };
      return copy;
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEvidenceFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEvidenUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!nomorSjUp3.trim()) {
      setErrorMessage('Mohon masukkan nomor surat jalan dari UP3.');
      return;
    }

    if (!namaPetugas.trim()) {
      setErrorMessage('Mohon lengkapi nama petugas pengambil / penerima.');
      return;
    }

    for (const row of itemRows) {
      const mat = materials.find(m => m.id === row.materialId);
      if (!mat) {
        setErrorMessage('Pilih material yang valid.');
        return;
      }
      if (row.quantity <= 0) {
        setErrorMessage(`Jumlah penerimaan untuk ${mat.name} harus lebih dari 0.`);
        return;
      }
    }

    const formattedItems = itemRows.map(row => {
      const mat = materials.find(m => m.id === row.materialId)!;
      return {
        materialId: mat.id,
        materialName: mat.name,
        normalisasi: getNormalisasiCode(mat.name),
        quantity: row.quantity
      };
    });

    const d = new Date(tanggalDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const formattedTanggal = `${day}/${month}/${year}`;

    const newTx: WarehouseTransaction = {
      id: `TX-IN-${Date.now()}`,
      timestamp: new Date().toISOString(),
      tanggal: formattedTanggal,
      admMaterial: 'Masuk',
      jabatan: jabatan.trim() || 'Admin Gudang UP3',
      namaPetugas: namaPetugas.trim(),
      reguYandal: reguYandal.trim() || 'LOGISTIK_UP3',
      noGangguan: `Pengadaan UP3 (${nomorSjUp3})`,
      items: formattedItems,
      petugasSecurity: petugasSecurity.trim(),
      security: petugasSecurity.trim(),
      evidenUrl: evidenUrl || undefined,
      petugasPelayananTeknik: namaPetugas.trim(),
      pemberiMaterial: pemberiMaterial.trim() || 'GUDANG UP3 JEMBER',
      keterangan: `SJ UP3: ${nomorSjUp3}`,
      column1: nomorSjUp3, // Nomor SJ dari UP3
      status: 'Pending',
      createdByRole: currentUser.role
    };

    const savedTx = addWarehouseTransaction(newTx);
    setHighlightTxId(savedTx.id);

    // KETIKA SELESAI MENGENTRY DATA, JANGAN LANGSUNG MENAMPILKAN SURAT JALAN!
    setIsSuratJalanOpen(false);

    // KETIKAN KETERANGAN: "ENTRY BERHASIL SILAHKAN MENUNGGU APPROVAL"
    setSuccessMessage('ENTRY BERHASIL SILAHKAN MENUNGGU APPROVAL');

    // Reset item rows & inputs
    setItemRows([{ materialId: materials[0]?.id || '', quantity: 10 }]);
    setNomorSjUp3('');
    setEvidenceFileName('');
    setEvidenUrl('');
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb & Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-700 tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <span>TRANSAKSI MASUK</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#0f2852] tracking-tight">
          Penerimaan Material
        </h1>
        <p className="text-sm text-slate-700 font-medium">
          Lengkapi informasi surat jalan, petugas, dan material yang diterima.
        </p>
      </div>

      {/* Main Glass Form Card matching mockup */}
      <form
        onSubmit={handleSubmit}
        className="bg-white/95 backdrop-blur-xl rounded-[28px] border border-white/80 p-6 sm:p-9 shadow-xl space-y-6"
      >
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-50 border-2 border-emerald-500 text-emerald-950 rounded-2xl flex items-center justify-between gap-3 shadow-md animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-wide text-emerald-900">
                  {successMessage}
                </p>
                <p className="text-xs text-emerald-700 font-medium">
                  Pengajuan penerimaan material telah tersimpan dan diarahkan ke <strong>Menu Approval - Penerimaan Material</strong>. Stok fisik gudang dan Surat Jalan akan disahkan setelah disetujui Admin / MULP.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              className="p-1.5 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-200/50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Row 1: Nomor Surat Jalan UP3 & Tanggal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Nomor Surat Jalan UP3
            </label>
            <input
              type="text"
              value={nomorSjUp3}
              onChange={e => setNomorSjUp3(e.target.value.toUpperCase())}
              placeholder="MASUKKAN NOMOR SURAT JALAN DARI UP3"
              className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 font-mono font-bold uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Tanggal
            </label>
            <div className="relative flex items-center gap-2">
              {isEditingDate ? (
                <input
                  type="date"
                  value={tanggalDate}
                  onChange={e => {
                    setTanggalDate(e.target.value);
                    setIsEditingDate(false);
                  }}
                  className="w-full px-4 py-2.5 bg-white rounded-xl border border-blue-500 text-sm text-slate-800 font-mono"
                  autoFocus
                />
              ) : (
                <input
                  type="text"
                  readOnly
                  value={formatDateDisplay(tanggalDate)}
                  className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 font-mono select-none"
                />
              )}
              <button
                type="button"
                onClick={() => setIsEditingDate(!isEditingDate)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs hover:shadow-xs transition-all shrink-0"
              >
                {isEditingDate ? 'Tutup' : 'Edit'}
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Jabatan & Regu Pengirim/Penerima */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Jabatan
            </label>
            <input
              type="text"
              list="jabatanPenerimaanList"
              value={jabatan}
              onChange={e => setJabatan(e.target.value.toUpperCase())}
              placeholder="Contoh: ADMIN GUDANG UP3, PENGAWAS MUTASI"
              className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 font-semibold uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
            />
            <datalist id="jabatanPenerimaanList">
              <option value="ADMIN GUDANG UP3" />
              <option value="PETUGAS LOGISTIK UP3" />
              <option value="ADMIN GUDANG TANGGUL" />
              <option value="TL TEKNIK" />
              <option value="PENGAWAS LAPANGAN" />
            </datalist>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Regu
            </label>
            <input
              type="text"
              list="reguPenerimaanList"
              value={reguYandal}
              onChange={e => setReguYandal(e.target.value.toUpperCase())}
              placeholder="Contoh: LOGISTIK_UP3, UP3 JEMBER"
              className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 font-bold uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
            />
            <datalist id="reguPenerimaanList">
              <option value="LOGISTIK_UP3" />
              <option value="UP3 JEMBER" />
              <option value="PABRIKAN / VENDOR" />
              <option value="ULP TANGGUL" />
            </datalist>
          </div>
        </div>

        {/* Row 3: Pemberi Material & Petugas Penerima/Pengambil (Kolom Spreadsheet 84 & 5) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <StaffSelectDropdown
            label="Pemberi Material"
            badge="Kolom Spreadsheet"
            value={pemberiMaterial}
            onChange={val => setPemberiMaterial(val)}
            options={DAFTAR_PEMBERI_MATERIAL}
            placeholder="-- Pilih Pemberi Material --"
            helperText="*Pihak/petugas yang menyerahkan material masuk."
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Petugas Penerima (Nama Petugas)
            </label>
            <input
              type="text"
              value={namaPetugas}
              onChange={e => setNamaPetugas(e.target.value.toUpperCase())}
              placeholder="MASUKKAN NAMA PETUGAS PENERIMA GUDANG"
              className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 font-bold uppercase tracking-wide placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
              required
            />
          </div>
        </div>

        {/* Row 4: Petugas Security (Keamanan) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <StaffSelectDropdown
            label="Petugas Security (Keamanan)"
            badge="Kolom Spreadsheet"
            value={petugasSecurity}
            onChange={val => setPetugasSecurity(val)}
            options={DAFTAR_PETUGAS_SECURITY}
            placeholder="-- Pilih Petugas Security --"
            helperText="*Petugas keamanan yang memeriksa fisik material masuk."
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Foto Bukti / Eviden (Opsional)
            </label>
            <div className="relative">
              <input
                type="file"
                id="eviden-upload-penerimaan"
                accept="image/*,.pdf"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <label
                htmlFor="eviden-upload-penerimaan"
                className="flex items-center justify-between px-4 py-2.5 bg-white rounded-xl border border-dashed border-slate-300 hover:border-blue-500 cursor-pointer transition-colors text-xs text-slate-600 hover:bg-slate-50"
              >
                <div className="flex items-center gap-2 truncate">
                  <Upload className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate">
                    {evidenceFileName || 'Upload Surat Jalan UP3 / Nota Fisik'}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 shrink-0">
                  Pilih File
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Section: Material yang Diterima */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Material yang Diterima
              </h3>
              <p className="text-xs text-slate-500">
                Tambahkan satu atau lebih material beserta jumlahnya.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {itemRows.length} material
            </span>
          </div>

          {/* Dynamic Item Rows */}
          <div className="space-y-3">
            {itemRows.map((row, idx) => {
              const selectedMat = materials.find(m => m.id === row.materialId);
              const normCode = selectedMat ? (getNormalisasiCode(selectedMat.name) || selectedMat.code) : '';
              return (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    {/* Kolom 8 (NORMALISASI) & Kolom 9 (Nama Material) with Integrated Inline Search */}
                    <MaterialRowSearchSelector
                      materials={materials}
                      selectedMaterialId={row.materialId}
                      onSelectMaterial={mat => handleMaterialChange(idx, mat.id)}
                      normColSpan="sm:col-span-3"
                      nameColSpan="sm:col-span-6"
                      isIncoming={true}
                    />

                    {/* Kolom 10: Jumlah */}
                    <div className="sm:col-span-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Jumlah
                        </label>
                        <span className="text-[9.5px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          Kolom 10
                        </span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={e => handleQuantityChange(idx, parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 focus:border-blue-500 text-sm font-bold text-slate-800 text-right font-mono"
                      />
                    </div>

                    {/* Delete button */}
                    <div className="sm:col-span-1 flex items-end justify-center pt-4">
                      {itemRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterialRow(idx)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Hapus baris ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedMat && (
                    <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                      <span>Satuan: <strong className="text-slate-700">{selectedMat.unit}</strong></span>
                      <span>Stok siap saat ini: <strong className="text-emerald-700">{selectedMat.currentStock} {selectedMat.unit}</strong></span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 italic">
            Daftar material dan saldo siap diambil dari Data Master. Jumlah pengambilan dibatasi sesuai stok tersedia.
          </p>

          <button
            type="button"
            onClick={handleAddMaterialRow}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-bold text-blue-700 shadow-2xs hover:shadow-xs transition-all"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Tambah Material</span>
          </button>
        </div>

        {/* Section: Foto Evidence */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-purple-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Foto Evidence</h3>
              <p className="text-xs text-slate-500">
                Tambahkan foto sebagai bukti penerimaan material.
              </p>
            </div>
          </div>

          <label className="border-2 border-dashed border-slate-200 hover:border-purple-400 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer bg-slate-50/50 hover:bg-purple-50/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                  {evidenceFileName ? evidenceFileName : 'Pilih foto evidence'}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Format gambar - dapat memilih beberapa foto
                </span>
              </div>
            </div>

            <div className="px-4 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs shrink-0">
              Pilih Foto
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>

          {evidenUrl && (
            <div className="w-32 h-24 rounded-xl overflow-hidden border border-slate-200 relative shadow-2xs">
              <img
                src={evidenUrl}
                alt="Preview evidence"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Footer & Submit Action */}
        <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-400 max-w-sm text-center sm:text-left">
            Pastikan data surat jalan, petugas, dan material sudah benar sebelum menyelesaikan transaksi.
          </p>

          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Selesai</span>
          </button>
        </div>
      </form>

      {/* Monitoring Material List Section (Pending, Approved, Ditolak) */}
      <MonitoringMaterialList
        type="masuk"
        transactions={transactions}
        highlightTxId={highlightTxId}
        onPrintSuratJalan={tx => {
          const sj = createSuratJalanFromTransaction(tx, { allTransactions: transactions });
          setSelectedSuratJalan(sj);
          setIsSuratJalanOpen(true);
        }}
      />

      {/* Surat Jalan Modal */}
      {selectedSuratJalan && (
        <SuratJalanModal
          isOpen={isSuratJalanOpen}
          onClose={() => {
            setIsSuratJalanOpen(false);
          }}
          data={selectedSuratJalan}
        />
      )}
    </div>
  );
};
