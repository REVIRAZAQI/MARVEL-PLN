import React, { useState } from 'react';
import { MaterialItem, TransactionType } from '../types/warehouse';
import { addWarehouseTransaction } from '../utils/inventoryStore';
import { sendTransactionToSpreadsheet } from '../utils/spreadsheetSync';
import { useModalScrollLock } from '../utils/modalScrollLock';
import { MaterialSearchInput } from './MaterialSearchCombobox';
import { X, Plus, Trash2, AlertCircle, CheckCircle2, Link2 } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: MaterialItem[];
  defaultType?: TransactionType;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  materials,
  defaultType = 'Keluar'
}) => {
  const [admMaterial, setAdmMaterial] = useState<TransactionType>(defaultType);
  const [dateValue, setDateValue] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [jabatan, setJabatan] = useState('Yandal');
  const [namaPetugas, setNamaPetugas] = useState('');
  const [reguYandal, setReguYandal] = useState('ULC_A');
  const [petugasSecurity, setPetugasSecurity] = useState('Hari Sujoko');
  const [petugasPelayananTeknik, setPetugasPelayananTeknik] = useState('');
  const [evidenUrl, setEvidenUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Selected items list
  const [selectedItems, setSelectedItems] = useState<
    { materialId: string; materialName: string; quantity: number }[]
  >([{ materialId: materials[0]?.id || '', materialName: materials[0]?.name || '', quantity: 1 }]);

  if (!isOpen) return null;

  const handleAddItemRow = () => {
    setSelectedItems(prev => [
      ...prev,
      { materialId: materials[0]?.id || '', materialName: materials[0]?.name || '', quantity: 1 }
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (selectedItems.length <= 1) return;
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleMaterialChange = (index: number, matId: string) => {
    const found = materials.find(m => m.id === matId);
    if (!found) return;
    setSelectedItems(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        materialId: found.id,
        materialName: found.name
      };
      return copy;
    });
  };

  const handleQuantityChange = (index: number, val: number) => {
    const qty = Math.max(1, isNaN(val) ? 1 : val);
    setSelectedItems(prev => {
      const copy = [...prev];
      copy[index].quantity = qty;
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!namaPetugas.trim()) {
      setErrorMsg('Harap isi Nama Petugas Pelaksana');
      return;
    }

    // Validate stock availability if Keluar
    if (admMaterial === 'Keluar') {
      for (const item of selectedItems) {
        const mat = materials.find(m => m.id === item.materialId);
        if (mat && item.quantity > mat.currentStock) {
          setErrorMsg(
            `Kuantitas keluar untuk "${mat.name}" (${item.quantity} ${mat.unit}) melebihi sisa stok gudang (${mat.currentStock} ${mat.unit})!`
          );
          return;
        }
      }
    }

    const autoRef = admMaterial === 'Keluar'
      ? `Pengambilan ${reguYandal}`
      : admMaterial === 'Masuk'
      ? 'Penerimaan Dropping'
      : 'Return Material';

    // Convert ISO date (YYYY-MM-DD) into Indonesian standard DD/MM/YYYY
    const parts = dateValue.split('-');
    const formattedTanggal = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateValue;

    addWarehouseTransaction({
      tanggal: formattedTanggal,
      admMaterial,
      jabatan,
      namaPetugas,
      reguYandal,
      noGangguan: autoRef,
      items: selectedItems,
      petugasSecurity,
      evidenUrl,
      petugasPelayananTeknik: petugasPelayananTeknik || namaPetugas,
      status: 'Pending'
    });

    // NOTE: Sesuai instruksi, spreadsheet HANYA di-update ketika transaksi sudah disetujui (Approved)!

    onClose();
  };


  // Lock window scroll so modal appears directly without scroll up/down
  useModalScrollLock(isOpen);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden m-auto">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Form Mutasi Material Gudang PLN
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Catat pergerakan material masuk & keluar untuk diajukan ke persetujuan
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Type Selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Jenis Administrasi Material
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAdmMaterial('Keluar')}
                className={`py-2 px-3 rounded-lg font-semibold border transition-all text-center ${
                  admMaterial === 'Keluar'
                    ? 'bg-rose-50 border-rose-500 text-rose-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Material Keluar (Pengambilan)
              </button>
              <button
                type="button"
                onClick={() => setAdmMaterial('Masuk')}
                className={`py-2 px-3 rounded-lg font-semibold border transition-all text-center ${
                  admMaterial === 'Masuk'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Material Masuk (Dropping)
              </button>
              <button
                type="button"
                onClick={() => setAdmMaterial('Return')}
                className={`py-2 px-3 rounded-lg font-semibold border transition-all text-center ${
                  admMaterial === 'Return'
                    ? 'bg-sky-50 border-sky-500 text-sky-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Return Sisa Material
              </button>
            </div>
          </div>

          {/* Date Row (Native Date Picker) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-medium text-slate-700">
                Tanggal Transaksi
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    setDateValue(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                  }}
                  className="text-[11px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded border border-sky-200 transition-colors cursor-pointer"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 1);
                    setDateValue(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                  }}
                  className="text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                >
                  Kemarin
                </button>
              </div>
            </div>
            <input
              type="date"
              value={dateValue}
              onChange={e => setDateValue(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-mono text-sm text-slate-800 font-bold cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Format tersimpan: <span className="font-semibold text-slate-700 font-mono">{dateValue ? `${dateValue.split('-')[2]}/${dateValue.split('-')[1]}/${dateValue.split('-')[0]}` : '-'}</span>
            </p>
          </div>


          {/* Officer & Team */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Jabatan Petugas
              </label>
              <select
                value={jabatan}
                onChange={e => setJabatan(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              >
                <option value="Yandal">Yandal</option>
                <option value="Preventif">Preventif</option>
                <option value="Spv K3L Pelayanan Teknik">Spv K3L Pelayanan Teknik</option>
                <option value="Staff Teknik">Staff Teknik</option>
                <option value="TL Teknik">TL Teknik</option>
                <option value="Inspeksi">Inspeksi</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Nama Petugas Pelaksana *
              </label>
              <input
                type="text"
                value={namaPetugas}
                onChange={e => setNamaPetugas(e.target.value)}
                placeholder="Contoh: DI-01496_SYAIFUDIN ZUHRI"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Regu Yandal
              </label>
              <select
                value={reguYandal}
                onChange={e => setReguYandal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              >
                <option value="ULC_A">ULC_A</option>
                <option value="ULC_B">ULC_B</option>
                <option value="ULC_C">ULC_C</option>
                <option value="ULC_D">ULC_D</option>
                <option value="MS1_A">MS1_A</option>
                <option value="MS1_B">MS1_B</option>
                <option value="MS1_C">MS1_C</option>
                <option value="MS1_D">MS1_D</option>
                <option value="Preventif 1">Preventif 1</option>
                <option value="Preventif 2">Preventif 2</option>
                <option value="PLN">PLN Kantor</option>
              </select>
            </div>
          </div>

          {/* Security & Eviden */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Petugas Security / Saksi Gudang
              </label>
              <input
                type="text"
                value={petugasSecurity}
                onChange={e => setPetugasSecurity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Link Eviden Foto / Dokumen (Google Drive)
              </label>
              <div className="relative">
                <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={evidenUrl}
                  onChange={e => setEvidenUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-800">
                Daftar Material yang Dikeluarkan / Dimasukkan
              </label>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>
            </div>

            <div className="space-y-2">
              {selectedItems.map((item, index) => {
                const currentMat = materials.find(m => m.id === item.materialId);
                return (
                  <div
                    key={index}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                  >
                    <div className="flex-1">
                      <MaterialSearchInput
                        materials={materials}
                        selectedMaterialId={item.materialId}
                        onSelectMaterial={m => handleMaterialChange(index, m.id)}
                        placeholder="Ketik normalisasi atau nama material..."
                      />
                    </div>

                    <div className="w-28 flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => handleQuantityChange(index, parseInt(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 text-right font-mono"
                      />
                      <span className="text-slate-500 font-mono text-[11px] shrink-0">
                        {currentMat?.unit || 'pcs'}
                      </span>
                    </div>

                    {selectedItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(index)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors shrink-0 self-end sm:self-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan & Ajukan Persetujuan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
