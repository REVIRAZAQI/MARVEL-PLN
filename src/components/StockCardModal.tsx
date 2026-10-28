import React, { useMemo } from 'react';
import { MaterialItem } from '../types/warehouse';
import { getStockCardForMaterial } from '../utils/inventoryStore';
import { X, Printer, ExternalLink, Calendar, MapPin, ShieldCheck, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useModalScrollLock } from '../utils/modalScrollLock';

interface StockCardModalProps {
  material: MaterialItem | null;
  onClose: () => void;
}

export const StockCardModal: React.FC<StockCardModalProps> = ({ material, onClose }) => {
  useModalScrollLock(Boolean(material));

  const stockEntries = useMemo(() => {
    if (!material) return [];
    return getStockCardForMaterial(material.id);
  }, [material]);

  if (!material) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden m-auto">
        {/* Modal Top Action Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2.5 py-1 rounded">
              KARTU GANTUNG GUDANG PLN
            </span>
            <span className="text-xs text-slate-500 font-mono">Kode: {material.code}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Kartu</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Card Container */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Card Header */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs font-bold tracking-wider text-slate-600 uppercase">
                  PT PLN (PERSERO) · DISTRIBUSI JAWA TIMUR
                </div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  ULP TANGGUL - KARTU GUDANG MATERIAL
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <span>Lokasi: {material.rackLocation}</span>
                  <span aria-hidden="true">·</span>
                  <span>Kategori: {material.category}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Saldo Fisik Saat Ini</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-sky-700">
                  {material.currentStock} <span className="text-sm font-normal text-slate-500">{material.unit}</span>
                </div>
                <div className="text-[11px] text-slate-400">Min Buffer: {material.minSafetyStock} {material.unit}</div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Nama Barang:</span>{' '}
                <span className="font-bold text-slate-900">{material.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-500">Total Masuk:</span>{' '}
                  <span className="font-mono font-semibold text-emerald-700">+{material.totalIn + material.totalReturn}</span>
                </div>
                <div>
                  <span className="text-slate-500">Total Keluar:</span>{' '}
                  <span className="font-mono font-semibold text-rose-700">-{material.totalOut}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mutation Table */}
          <div>
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Buku Mutasi & Riwayat Kartu Gantung
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-[11px] font-semibold">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">No Tiket / APKT</th>
                    <th className="py-2.5 px-3">Uraian / Keperluan</th>
                    <th className="py-2.5 px-3">Petugas / Regu</th>
                    <th className="py-2.5 px-2 text-right text-emerald-700">Masuk</th>
                    <th className="py-2.5 px-2 text-right text-rose-700">Keluar</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-900">Saldo</th>
                    <th className="py-2.5 px-3 text-center print:hidden">Eviden</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        Belum ada mutasi tercatat untuk material ini.
                      </td>
                    </tr>
                  ) : (
                    stockEntries.map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {entry.tanggal}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-800 font-medium">
                          {entry.noReferensi}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate">
                          {entry.keterangan}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          {entry.petugas} ({entry.regu})
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono tabular-nums text-emerald-700 font-medium">
                          {entry.masuk > 0 ? `+${entry.masuk}` : '-'}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono tabular-nums text-rose-700 font-medium">
                          {entry.keluar > 0 ? `-${entry.keluar}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                          {entry.saldo}
                        </td>
                        <td className="py-2.5 px-3 text-center print:hidden whitespace-nowrap">
                          {entry.evidenUrl ? (
                            <a
                              href={entry.evidenUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sky-600 hover:text-sky-800 inline-flex items-center gap-1 font-medium text-[11px]"
                            >
                              <span>Lihat</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Official Signatures for Printing */}
          <div className="hidden print:grid grid-cols-3 gap-6 pt-8 text-center text-xs text-slate-800">
            <div>
              <p>Petugas Pelayanan Teknik</p>
              <div className="h-16"></div>
              <p className="font-semibold">( .................................... )</p>
            </div>
            <div>
              <p>Petugas Keamanan / Security</p>
              <div className="h-16"></div>
              <p className="font-semibold">( .................................... )</p>
            </div>
            <div>
              <p>Supervisor / Adm Material</p>
              <div className="h-16"></div>
              <p className="font-semibold">( .................................... )</p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>Dicetak dari Sistem Monitoring Gudang PLN ULP Tanggul</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
