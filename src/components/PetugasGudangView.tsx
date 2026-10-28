import React, { useState } from 'react';
import { MaterialItem, WarehouseTransaction, TransactionType, AppUser, SuratJalanData } from '../types/warehouse';
import { addWarehouseTransaction } from '../utils/inventoryStore';
import { sendTransactionToSpreadsheet } from '../utils/spreadsheetSync';
import { createSuratJalanFromTransaction } from '../utils/suratJalanHelper';
import { SuratJalanModal } from './SuratJalanModal';
import { ArrowUpRight, ArrowDownLeft, Plus, Minus, Trash2, CheckCircle2, Clock, AlertCircle, Link2, Shield, User, Camera, LogOut, ArrowRightLeft, Printer, FileText, Lock, ShieldCheck } from 'lucide-react';

interface PetugasGudangViewProps {
  currentUser: AppUser;
  materials: MaterialItem[];
  transactions: WarehouseTransaction[];
  onOpenLoginModal: () => void;
  onLogout: () => void;
  onViewStockCard: (materialId: string) => void;
}

export const PetugasGudangView: React.FC<PetugasGudangViewProps> = ({
  currentUser,
  materials,
  transactions,
  onOpenLoginModal,
  onLogout,
  onViewStockCard
}) => {
  // Submenu: Material Keluar vs Material Masuk
  const [activeSubmenu, setActiveSubmenu] = useState<'Keluar' | 'Masuk'>('Keluar');

  // Form states
  const [tanggalDate, setTanggalDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [reguYandal, setReguYandal] = useState('ULC_A');
  const [peruntukan, setPeruntukan] = useState('Pasang Baru');
  const [kendaraan, setKendaraan] = useState('Mobil Yandal ULP Tanggul');
  const [namaPetugas, setNamaPetugas] = useState('');
  const [jabatan, setJabatan] = useState('Yandal');
  const [petugasSecurity, setPetugasSecurity] = useState('Hari Sujoko');
  const [evidenUrl, setEvidenUrl] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Surat Jalan state
  const [selectedSuratJalan, setSelectedSuratJalan] = useState<SuratJalanData | null>(null);
  const [isSuratJalanOpen, setIsSuratJalanOpen] = useState(false);

  // Items list
  const [items, setItems] = useState<
    { materialId: string; materialName: string; quantity: number }[]
  >([{ materialId: materials[0]?.id || '', materialName: materials[0]?.name || '', quantity: 1 }]);

  const handleAddItemRow = () => {
    setItems(prev => [
      ...prev,
      { materialId: materials[0]?.id || '', materialName: materials[0]?.name || '', quantity: 1 }
    ]);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleMaterialChange = (idx: number, matId: string) => {
    const mat = materials.find(m => m.id === matId);
    if (!mat) return;
    setItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], materialId: mat.id, materialName: mat.name };
      return copy;
    });
  };

  const handleQuantityStep = (idx: number, delta: number) => {
    setItems(prev => {
      const copy = [...prev];
      const cur = copy[idx].quantity || 1;
      copy[idx].quantity = Math.max(1, cur + delta);
      return copy;
    });
  };

  const handleQuantityInput = (idx: number, val: number) => {
    const qty = Math.max(1, isNaN(val) ? 1 : val);
    setItems(prev => {
      const copy = [...prev];
      copy[idx].quantity = qty;
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!namaPetugas.trim()) {
      setErrorMessage('Harap isi Nama Petugas Pelaksana / Pengambil');
      return;
    }

    // Validate stock if Keluar
    if (activeSubmenu === 'Keluar') {
      for (const item of items) {
        const mat = materials.find(m => m.id === item.materialId);
        if (mat && item.quantity > mat.currentStock) {
          setErrorMessage(
            `Stok "${mat.name}" tidak mencukupi (Diminta: ${item.quantity} ${mat.unit}, Sisa Fisik: ${mat.currentStock} ${mat.unit})!`
          );
          return;
        }
      }
    }

    const autoRef = activeSubmenu === 'Keluar'
      ? `${peruntukan} (${reguYandal})`
      : 'Penerimaan Dropping';

    const [py, pm, pd] = tanggalDate.split('-');
    const formattedDate = py && pm && pd ? `${pd}/${pm}/${py}` : tanggalDate;

    addWarehouseTransaction({
      tanggal: formattedDate,
      admMaterial: activeSubmenu,
      jabatan,
      namaPetugas,
      reguYandal,
      noGangguan: autoRef,
      items,
      petugasSecurity,
      evidenUrl,
      petugasPelayananTeknik: namaPetugas,
      keterangan: keterangan || `Peruntukan: ${peruntukan} | Kendaraan: ${kendaraan} | Dicatat oleh ${currentUser.name}`,
      createdByRole: 'Petugas Gudang',
      status: 'Pending' // Petugas Gudang submits for Admin Gudang / MULP review
    });

    // NOTE: Sesuai SOP, spreadsheet HANYA di-update setelah transaksi disetujui (Approved) oleh Admin Gudang / MULP!

    setSuccessMessage(
      `Transaksi ${activeSubmenu} (${items.length} item) berhasil disimpan dan masuk ke antrean persetujuan Admin Gudang / MULP. Spreadsheet akan otomatis diperbarui setelah disetujui.`
    );

    // Reset form
    setNamaPetugas('');
    setEvidenUrl('');
    setKeterangan('');
    setItems([{ materialId: materials[0]?.id || '', materialName: materials[0]?.name || '', quantity: 1 }]);
  };

  // Recent submissions by Petugas
  const myRecentSubmissions = transactions.slice(0, 5);

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-12">
      {/* Mobile Top Profile Badge */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
            PG
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 leading-tight">
              {currentUser.name}
            </div>
            <div className="text-[11px] text-slate-500">
              {currentUser.role} · {currentUser.nip}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenLoginModal}
            className="text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            <ArrowRightLeft className="w-3 h-3" />
            <span>Ganti Peran</span>
          </button>
          <button
            onClick={onLogout}
            title="Keluar ke Menu Login"
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>


      {/* Submenu Tabs (Besar, Rapi di HP) */}
      <div className="grid grid-cols-2 p-1.5 bg-slate-200/80 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => {
            setActiveSubmenu('Keluar');
            setErrorMessage('');
            setSuccessMessage('');
          }}
          className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeSubmenu === 'Keluar'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 shrink-0" />
          <span>Material Keluar</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubmenu('Masuk');
            setErrorMessage('');
            setSuccessMessage('');
          }}
          className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeSubmenu === 'Masuk'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 shrink-0" />
          <span>Material Masuk</span>
        </button>
      </div>

      {/* Mobile Form Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">
            {activeSubmenu === 'Keluar'
              ? 'Form Pengambilan Material (Pelayanan Teknik / Yandal)'
              : 'Form Penerimaan Material (Dropping / Logistik UP3)'}
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {activeSubmenu === 'Keluar'
              ? 'Catat pengeluaran material gangguan, preventif, atau stok mobil.'
              : 'Catat barang masuk dari dropping pabrikan atau transfer logistik.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Tanggal & Regu */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block font-medium text-slate-700">Tanggal Transaksi</label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      setTanggalDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                    }}
                    className="text-[10px] font-semibold text-sky-700 hover:underline cursor-pointer"
                  >
                    Hari Ini
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 1);
                      setTanggalDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                    }}
                    className="text-[10px] font-semibold text-slate-500 hover:underline cursor-pointer"
                  >
                    Kemarin
                  </button>
                </div>
              </div>
              <input
                type="date"
                value={tanggalDate}
                onChange={e => setTanggalDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900 font-bold cursor-pointer"
              />
              <div className="text-[10px] text-slate-500 font-mono">
                Format: {tanggalDate ? `${tanggalDate.split('-')[2]}/${tanggalDate.split('-')[1]}/${tanggalDate.split('-')[0]}` : '-'}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block font-medium text-slate-700">Regu Yandal</label>
              <select
                value={reguYandal}
                onChange={e => setReguYandal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
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

          {/* Peruntukan & Kendaraan (Sesuai Format Surat Jalan) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="block font-medium text-slate-700">Peruntukan</label>
              <select
                value={peruntukan}
                onChange={e => setPeruntukan(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="Pasang Baru">Pasang Baru (PB)</option>
                <option value="Perubahan Daya">Perubahan Daya (PD)</option>
                <option value="Gangguan & Pemeliharaan">Gangguan & Pemeliharaan</option>
                <option value="Material PBPD ULP Tanggul">Material PBPD ULP Tanggul</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block font-medium text-slate-700">Kendaraan</label>
              <input
                type="text"
                value={kendaraan}
                onChange={e => setKendaraan(e.target.value)}
                placeholder="Mobil Yandal ULP Tanggul"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Section 3: Petugas Pelaksana */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="block font-medium text-slate-700">
                Nama Petugas Pelaksana / Pengambil *
              </label>
              <input
                type="text"
                value={namaPetugas}
                onChange={e => setNamaPetugas(e.target.value)}
                placeholder="Contoh: DI-01496_SYAIFUDIN ZUHRI"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block font-medium text-slate-700">Petugas Security / Saksi</label>
              <input
                type="text"
                value={petugasSecurity}
                onChange={e => setPetugasSecurity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Section 4: Items Selector (Big Touch Targets) */}
          <div className="pt-2 border-t border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Material & Jumlah Kuantitas</span>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, idx) => {
                const currentMat = materials.find(m => m.id === item.materialId);
                const sisa = currentMat ? currentMat.currentStock : 0;

                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500">
                        Item #{idx + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Material Dropdown */}
                    <select
                      value={item.materialId}
                      onChange={e => handleMaterialChange(idx, e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      {materials.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} (Sisa: {m.currentStock} {m.unit})
                        </option>
                      ))}
                    </select>

                    {/* Touch-Friendly Stepper */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[11px] text-slate-500">
                        <span>Sisa Fisik: </span>
                        <span className="font-mono font-bold text-slate-900">
                          {sisa} {currentMat?.unit || 'pcs'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuantityStep(idx, -1)}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 shadow-2xs active:scale-95"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => handleQuantityInput(idx, parseInt(e.target.value))}
                          className="w-16 h-8 text-center bg-white border border-slate-200 rounded-lg font-mono font-bold text-xs"
                        />

                        <button
                          type="button"
                          onClick={() => handleQuantityStep(idx, 1)}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 shadow-2xs active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>

                        <span className="text-slate-500 text-[11px] font-mono pl-1">
                          {currentMat?.unit || 'pcs'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 5: Link Eviden */}
          <div className="space-y-1">
            <label className="block font-medium text-slate-700">
              Link Foto Eviden (Google Drive / Dokumentasi Fisik)
            </label>
            <div className="relative">
              <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={evidenUrl}
                onChange={e => setEvidenUrl(e.target.value)}
                placeholder="https://drive.google.com/open?id=..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Submit Button (Big Touch Button) */}
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 ${
                activeSubmenu === 'Keluar'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Simpan & Ajukan Transaksi</span>
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-2">
              Transaksi otomatis masuk antrean persetujuan Admin Gudang dan disinkronkan ke Spreadsheet.
            </p>
          </div>
        </form>
      </div>

      {/* Riwayat Input Petugas */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="font-bold text-slate-900 text-xs">
            Riwayat Pengajuan Terakhir
          </div>
          <span className="text-[11px] text-slate-400">Status Persetujuan</span>
        </div>

        <div className="space-y-2">
          {myRecentSubmissions.map(tx => {
            const isApproved = tx.status === 'Approved' || !tx.status;
            const isPending = tx.status === 'Pending';
            const isRejected = tx.status === 'Rejected';

            return (
              <div
                key={tx.id}
                className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 text-xs flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-bold text-[11px] ${
                        tx.admMaterial === 'Keluar' ? 'text-rose-700' : 'text-emerald-700'
                      }`}
                    >
                      {tx.admMaterial}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="font-mono text-slate-500">{tx.tanggal}</span>
                  </div>
                  <div className="font-medium text-slate-900 truncate max-w-[200px] mt-0.5">
                    {tx.noGangguan}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {tx.items.length} jenis material ({tx.reguYandal})
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                  {isPending ? (
                    <div className="flex flex-col items-end gap-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        <span>Menunggu Persetujuan</span>
                      </span>
                      <span
                        className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 cursor-not-allowed"
                        title="Surat Jalan baru dapat dicetak setelah disetujui Admin Gudang dan Penyetuju MULP"
                      >
                        <Lock className="w-2.5 h-2.5" />
                        <span>Surat Jalan Terkunci</span>
                      </span>
                    </div>
                  ) : isApproved ? (
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Disetujui Admin & MULP</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const sj = createSuratJalanFromTransaction(tx, { allTransactions: transactions });
                          setSelectedSuratJalan(sj);
                          setIsSuratJalanOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs transition-colors"
                        title="Cetak Surat Jalan Barang resmi atau simpan sebagai PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak Surat Jalan</span>
                      </button>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                      <span>Ditolak</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Surat Jalan Modal */}
      <SuratJalanModal
        isOpen={isSuratJalanOpen}
        onClose={() => setIsSuratJalanOpen(false)}
        data={selectedSuratJalan}
      />
    </div>
  );
};
