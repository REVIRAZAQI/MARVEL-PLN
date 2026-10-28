import React, { useState } from 'react';
import { MaterialItem } from '../types/warehouse';
import { addWarehouseTransaction, updateMaterialConfig } from '../utils/inventoryStore';
import { X, CheckCircle2, Plus, Shield } from 'lucide-react';
import { useModalScrollLock } from '../utils/modalScrollLock';

interface QuickRestockModalProps {
  material: MaterialItem | null;
  onClose: () => void;
}

export const QuickRestockModal: React.FC<QuickRestockModalProps> = ({ material, onClose }) => {
  useModalScrollLock(Boolean(material));
  const [addQty, setAddQty] = useState<number>(50);
  const [minStock, setMinStock] = useState<number>(material?.minSafetyStock || 15);
  const [suratJalan, setSuratJalan] = useState('Dropping UP3 / Logistik');
  const [petugas, setPetugas] = useState('Petugas Logistik PLN');

  if (!material) return null;

  const handleRestock = (e: React.FormEvent) => {
    e.preventDefault();

    if (addQty > 0) {
      addWarehouseTransaction({
        tanggal: new Date().toLocaleDateString('id-ID'),
        admMaterial: 'Masuk',
        jabatan: 'Staff Teknik',
        namaPetugas: petugas,
        reguYandal: 'PLN',
        noGangguan: suratJalan,
        items: [{ materialId: material.id, materialName: material.name, quantity: addQty }],
        petugasSecurity: 'Security Gudang'
      });
    }

    if (minStock !== material.minSafetyStock) {
      updateMaterialConfig(material.id, { minSafetyStock: minStock });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden m-auto">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Restock & Pengaturan Buffer Stok
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{material.code}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleRestock} className="p-5 space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-semibold text-slate-900">{material.name}</div>
            <div className="text-slate-500 mt-1 flex items-center justify-between">
              <span>Sisa Stok Sekarang:</span>
              <span className="font-mono tabular-nums font-bold text-sky-700 text-sm">
                {material.currentStock} {material.unit}
              </span>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Jumlah Tambahan Dropping Masuk ({material.unit})
            </label>
            <input
              type="number"
              min="0"
              value={addQty}
              onChange={e => setAddQty(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-mono text-sm"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Batas Minimum Safety Stock Buffer ({material.unit})
            </label>
            <input
              type="number"
              min="1"
              value={minStock}
              onChange={e => setMinStock(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              No Surat Jalan / Sumber Dropping
            </label>
            <input
              type="text"
              value={suratJalan}
              onChange={e => setSuratJalan(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              placeholder="Contoh: DO-PLN-UP3-2026/04"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
