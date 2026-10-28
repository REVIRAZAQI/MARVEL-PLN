import React, { useState, useMemo } from 'react';
import { MaterialItem, WarehouseTransaction } from '../types/warehouse';
import { createSuratJalanFromTransaction, getTransactionSuratJalanNumber, NORMALISASI_MAP } from '../utils/suratJalanHelper';
import { SuratJalanModal } from './SuratJalanModal';
import { Calendar, Search, ArrowLeft, RotateCcw, ExternalLink, ShieldCheck, FileText } from 'lucide-react';

interface TransaksiMaterialViewProps {
  materials: MaterialItem[];
  transactions: WarehouseTransaction[];
  onBackToLogbook?: () => void;
}

interface MutationRecord {
  txId: string;
  waktu: string;
  rawDate: string;
  noTransaksi: string;
  jenisTransaksi: string;
  jenisMutasi: 'Material Masuk' | 'Material Keluar';
  isMasuk: boolean;
  masukDisplay: string | number;
  keluarDisplay: string | number;
  masukNum: number;
  keluarNum: number;
  saldoSetelahMutasi: number;
  transaction: WarehouseTransaction;
}

interface MaterialMutationGroup {
  material: MaterialItem;
  materialCode18: string;
  unitDisplay: string;
  mutations: MutationRecord[];
  totalMasuk: number;
  totalKeluar: number;
  saldoAkhir: number;
}

const parseDateToComparable = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(n => parseInt(n, 10));
    return new Date(y, m - 1, d);
  }
  // DD/MM/YYYY
  const parts = trimmed.split(/[\/\s-]/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
};

const formatWaktu = (dateStr: string): string => {
  const d = parseDateToComparable(dateStr);
  if (!d) return dateStr || '-';
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  const month = months[d.getMonth()] || 'Jan';
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

const getTodayFormatted = (): string => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const formatNoMaterial18 = (mat: MaterialItem): string => {
  // Check exact match in NORMALISASI_MAP
  if (NORMALISASI_MAP[mat.name]) {
    return NORMALISASI_MAP[mat.name].padStart(18, '0');
  }
  const foundKey = Object.keys(NORMALISASI_MAP).find(
    k => k.toLowerCase() === mat.name.toLowerCase() || mat.name.toLowerCase().includes(k.toLowerCase())
  );
  if (foundKey && NORMALISASI_MAP[foundKey]) {
    return NORMALISASI_MAP[foundKey].padStart(18, '0');
  }

  // Check if material code has digits
  const numOnly = mat.code.replace(/\D/g, '') || mat.id.replace(/\D/g, '');
  if (numOnly && numOnly.length >= 4) {
    return numOnly.padStart(18, '0');
  }
  // Stable 18-digit SAP code for PLN standard materials
  let hash = 0;
  const str = mat.name + mat.code;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 9000000;
  }
  const sapNum = (3100000 + Math.abs(hash)).toString();
  return sapNum.padStart(18, '0');
};

export const TransaksiMaterialView: React.FC<TransaksiMaterialViewProps> = ({
  materials,
  transactions,
  onBackToLogbook
}) => {
  const [dariTanggal, setDariTanggal] = useState<string>('');
  const [sampaiTanggal, setSampaiTanggal] = useState<string>('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('all');
  const [selectedSuratJalanTx, setSelectedSuratJalanTx] = useState<WarehouseTransaction | null>(null);

  const handleResetFilter = () => {
    setDariTanggal('');
    setSampaiTanggal('');
    setSelectedMaterialId('all');
  };

  // Build mutations for each material
  const materialGroups = useMemo<MaterialMutationGroup[]>(() => {
    // Filter materials if a specific one is selected
    const targetMaterials = selectedMaterialId === 'all'
      ? materials
      : materials.filter(m => m.id === selectedMaterialId);

    // Sort transactions chronologically (oldest first) to compute running balance
    const sortedTxs = [...transactions].sort((a, b) => {
      const da = parseDateToComparable(a.tanggal || a.timestamp)?.getTime() || 0;
      const db = parseDateToComparable(b.tanggal || b.timestamp)?.getTime() || 0;
      return da - db;
    });

    const groups: MaterialMutationGroup[] = [];

    const startDate = dariTanggal ? parseDateToComparable(dariTanggal) : null;
    const endDate = sampaiTanggal ? parseDateToComparable(sampaiTanggal) : null;
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    for (const mat of targetMaterials) {
      let runningSaldo = mat.initialStock;
      const allMutationsForMat: MutationRecord[] = [];

      for (const tx of sortedTxs) {
        // Skip rejected transactions
        if (tx.status === 'Rejected') continue;

        const matNorm = NORMALISASI_MAP[mat.name] || '';
        const item = tx.items.find(it => {
          const itemNorm = it.normalisasi || NORMALISASI_MAP[it.materialName] || '';
          return (
            it.materialId === mat.id ||
            it.materialName.toLowerCase() === mat.name.toLowerCase() ||
            (Boolean(matNorm) && Boolean(itemNorm) && matNorm === itemNorm) ||
            Boolean(it.normalisasi && (mat.code.includes(it.normalisasi) || mat.id.includes(it.normalisasi)))
          );
        });

        if (item && item.quantity > 0) {
          const isMasuk = tx.admMaterial === 'Masuk' || tx.admMaterial === 'Return';
          const qty = Number(item.quantity) || 0;

          if (isMasuk) {
            runningSaldo += qty;
          } else {
            runningSaldo = Math.max(0, runningSaldo - qty);
          }

          const txDate = parseDateToComparable(tx.tanggal || tx.timestamp);

          // Apply date filter
          if (startDate && txDate && txDate < startDate) {
            continue;
          }
          if (endDate && txDate && txDate > endDate) {
            continue;
          }

          const noTx = tx.column1 || getTransactionSuratJalanNumber(tx, transactions) || tx.noGangguan || '-';
          const jenisTx =
            tx.noGangguan && tx.noGangguan.trim().length > 3
              ? tx.noGangguan.toUpperCase()
              : tx.keterangan || (isMasuk ? 'PENERIMAAN MATERIAL GUDANG' : 'GANGGUAN DAN PEMELIHARAAN');

          allMutationsForMat.push({
            txId: tx.id,
            waktu: formatWaktu(tx.tanggal || tx.timestamp),
            rawDate: tx.tanggal || tx.timestamp,
            noTransaksi: noTx,
            jenisTransaksi: jenisTx,
            jenisMutasi: isMasuk ? 'Material Masuk' : 'Material Keluar',
            isMasuk,
            masukDisplay: isMasuk ? qty : '-',
            keluarDisplay: !isMasuk ? qty : '-',
            masukNum: isMasuk ? qty : 0,
            keluarNum: !isMasuk ? qty : 0,
            saldoSetelahMutasi: runningSaldo,
            transaction: tx
          });
        }
      }

      // If user selected "all", show materials that have at least 1 mutation or if explicitly chosen
      if (selectedMaterialId !== 'all' || allMutationsForMat.length > 0) {
        const totalMasuk = allMutationsForMat.reduce((acc, m) => acc + m.masukNum, 0);
        const totalKeluar = allMutationsForMat.reduce((acc, m) => acc + m.keluarNum, 0);

        groups.push({
          material: mat,
          materialCode18: formatNoMaterial18(mat),
          unitDisplay: mat.unit.toUpperCase() === 'PCS' ? 'BH' : mat.unit.toUpperCase(),
          mutations: allMutationsForMat,
          totalMasuk,
          totalKeluar,
          saldoAkhir: runningSaldo
        });
      }
    }

    return groups;
  }, [materials, transactions, dariTanggal, sampaiTanggal, selectedMaterialId]);

  const todayStr = useMemo(() => getTodayFormatted(), []);

  return (
    <div className="w-full space-y-6 font-sans menu-transition-enter pb-16">
      {/* Header with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[11px] font-extrabold tracking-wider text-sky-800 uppercase">
              LOGBOOK MATERIAL · ULP TANGGUL
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0f2852] tracking-tight">
            Transaksi Material
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
            Rekapitulasi riwayat mutasi masuk, keluar, dan saldo persediaan per material secara akurat.
          </p>
        </div>

        {onBackToLogbook && (
          <button
            onClick={onBackToLogbook}
            className="px-4 py-2 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs self-start sm:self-center cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Logbook</span>
          </button>
        )}
      </div>

      {/* Top Filter Card matching Gambar 1 */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Dari Tanggal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Dari Tanggal
            </label>
            <div className="relative">
              <input
                type="date"
                value={dariTanggal}
                onChange={e => setDariTanggal(e.target.value)}
                placeholder="dd/mm/tttt"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Sampai Tanggal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Sampai Tanggal
            </label>
            <div className="relative">
              <input
                type="date"
                value={sampaiTanggal}
                onChange={e => setSampaiTanggal(e.target.value)}
                placeholder="dd/mm/tttt"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Material Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Material
            </label>
            <select
              value={selectedMaterialId}
              onChange={e => setSelectedMaterialId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 truncate transition-all cursor-pointer"
            >
              <option value="all">Semua Material</option>
              {materials.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Bersihkan Filter Button */}
          <div>
            <button
              onClick={handleResetFilter}
              className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Bersihkan Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Material Mutation Cards List matching Gambar 1 */}
      {materialGroups.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            Tidak Ada Transaksi Material
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Tidak ditemukan mutasi material pada rentang tanggal atau material yang dipilih. Silakan atur filter pencarian di atas.
          </p>
          <button
            onClick={handleResetFilter}
            className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {materialGroups.map(group => (
            <div
              key={group.material.id}
              className="bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/80 overflow-hidden transition-all hover:shadow-lg"
            >
              {/* Card Header matching Gambar 1 */}
              <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    {group.material.name.toUpperCase()}
                  </h2>
                  <div className="text-xs text-slate-500 font-medium">
                    No Material · <span className="font-mono">{group.materialCode18}</span> · Satuan {group.unitDisplay}
                  </div>
                </div>

                <div className="shrink-0 self-start sm:self-center">
                  <span className="inline-flex items-center px-3 py-1 bg-sky-50 text-sky-700 text-xs font-bold rounded-full border border-sky-100 shadow-2xs">
                    {group.mutations.length} mutasi
                  </span>
                </div>
              </div>

              {/* Table matching Gambar 1 */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4 sm:px-6">Waktu</th>
                      <th className="py-3 px-4">No. Transaksi</th>
                      <th className="py-3 px-4">Jenis Transaksi</th>
                      <th className="py-3 px-4">Jenis Mutasi</th>
                      <th className="py-3 px-4 text-center">Masuk</th>
                      <th className="py-3 px-4 text-center">Keluar</th>
                      <th className="py-3 px-4 sm:px-6 text-center">Saldo Setelah Mutasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {group.mutations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-xs text-slate-400 italic">
                          Belum ada riwayat mutasi untuk material ini pada periode yang dipilih.
                        </td>
                      </tr>
                    ) : (
                      group.mutations.map((mut, idx) => (
                        <tr
                          key={`${mut.txId}-${idx}`}
                          className="hover:bg-sky-50/40 transition-colors"
                        >
                          {/* Waktu */}
                          <td className="py-3.5 px-4 sm:px-6 text-slate-700 whitespace-nowrap">
                            {mut.waktu}
                          </td>

                          {/* No. Transaksi (Clickable to open Surat Jalan fixed in center) */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedSuratJalanTx(mut.transaction)}
                              title="Klik untuk melihat Surat Jalan resmi"
                              className="font-mono text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <span>{mut.noTransaksi}</span>
                              <ExternalLink className="w-3 h-3 opacity-60" />
                            </button>
                          </td>

                          {/* Jenis Transaksi */}
                          <td className="py-3.5 px-4 text-slate-700 uppercase font-medium">
                            {mut.jenisTransaksi}
                          </td>

                          {/* Jenis Mutasi (Colored matching Gambar 1) */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {mut.isMasuk ? (
                              <span className="text-emerald-600 font-semibold">
                                Material Masuk
                              </span>
                            ) : (
                              <span className="text-rose-600 font-semibold">
                                Material Keluar
                              </span>
                            )}
                          </td>

                          {/* Masuk */}
                          <td className="py-3.5 px-4 text-center font-bold text-emerald-600 whitespace-nowrap">
                            {mut.masukDisplay}
                          </td>

                          {/* Keluar */}
                          <td className="py-3.5 px-4 text-center font-bold text-rose-600 whitespace-nowrap">
                            {mut.keluarDisplay}
                          </td>

                          {/* Saldo Setelah Mutasi */}
                          <td className="py-3.5 px-4 sm:px-6 text-center font-black text-slate-800 whitespace-nowrap">
                            {mut.saldoSetelahMutasi}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Summary Footer matching Gambar 1 */}
              <div className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center gap-3">
                {/* Total Keluar */}
                <div className="flex-1 min-w-[180px] bg-white rounded-xl px-4 py-2.5 border border-slate-200/80 flex items-center justify-between text-xs shadow-2xs">
                  <span className="text-slate-500 font-medium">Total Keluar</span>
                  <span className="font-bold text-rose-600">
                    {group.totalKeluar} {group.unitDisplay}
                  </span>
                </div>

                {/* Total Masuk */}
                <div className="flex-1 min-w-[180px] bg-white rounded-xl px-4 py-2.5 border border-slate-200/80 flex items-center justify-between text-xs shadow-2xs">
                  <span className="text-slate-500 font-medium">Total Masuk</span>
                  <span className="font-bold text-emerald-600">
                    {group.totalMasuk} {group.unitDisplay}
                  </span>
                </div>

                {/* Saldo Akhir */}
                <div className="flex-1 min-w-[220px] bg-white rounded-xl px-4 py-2.5 border border-slate-200/80 flex items-center justify-between text-xs shadow-2xs">
                  <span className="text-slate-600 font-medium">
                    Saldo Akhir · {todayStr}
                  </span>
                  <span className="font-black text-slate-900">
                    {group.saldoAkhir} {group.unitDisplay}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Surat Jalan Modal fixed in dead-center of screen without background interference */}
      {selectedSuratJalanTx && (
        <SuratJalanModal
          isOpen={Boolean(selectedSuratJalanTx)}
          onClose={() => setSelectedSuratJalanTx(null)}
          data={createSuratJalanFromTransaction(selectedSuratJalanTx, { allTransactions: transactions })}
        />
      )}
    </div>
  );
};
