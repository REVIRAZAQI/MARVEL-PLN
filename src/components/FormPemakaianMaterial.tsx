import React, { useState } from 'react';
import { AppUser, MaterialItem, WarehouseTransaction } from '../types/warehouse';
import {
  Wrench,
  Calendar,
  User,
  Users,
  FileText,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  ClipboardList,
  Save
} from 'lucide-react';
import { DAFTAR_PEMBERI_MATERIAL, DAFTAR_PETUGAS_SECURITY } from '../data/warehouseStaff';
import { StaffSelectDropdown } from './StaffSelectDropdown';

interface FormPemakaianMaterialProps {
  currentUser: AppUser | null;
  materials: MaterialItem[];
  transactions: WarehouseTransaction[];
  onBackToTransaksi: () => void;
  onFinish?: () => void;
}

export const FormPemakaianMaterial: React.FC<FormPemakaianMaterialProps> = ({
  currentUser,
  materials,
  transactions,
  onBackToTransaksi,
  onFinish
}) => {
  const [tanggal, setTanggal] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [regu, setRegu] = useState<string>('ULC_A');
  const [petugasPelaksana, setPetugasPelaksana] = useState<string>(
    currentUser?.name ? currentUser.name.toUpperCase() : ''
  );
  const [keperluan, setKeperluan] = useState<string>('PASANG BARU');
  const [noLaporan, setNoLaporan] = useState<string>('');
  const [lokasiPekerjaan, setLokasiPekerjaan] = useState<string>('');
  const [keterangan, setKeterangan] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmitDraft = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(
      `Draft pencatatan Pemakaian Material (${keperluan} - ${regu}) berhasil disimpan. Inputan spesifikasi material menyusul akan segera disinkronkan ke sistem.`
    );
    setTimeout(() => {
      setFeedback(null);
      if (onFinish) onFinish();
      else onBackToTransaksi();
    }, 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      {/* 1. Header Navigation Bar (Tanpa tulisan ULP TANGGUL di atas judul) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" />
            <span className="text-[11px] font-extrabold tracking-wider text-amber-700 uppercase">
              TRANSAKSI PEMAKAIAN
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#0f2852] tracking-tight">
            Menu Pemakaian Material
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            Pencatatan dan pelaporan pemakaian material operasional di lapangan.
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToTransaksi}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-800 bg-white/95 hover:bg-white active:scale-95 border border-slate-200 rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
          <span>Kembali ke Transaksi</span>
        </button>
      </div>

      {/* 2. Notice Card: Inputan Menyusul */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50/50 border border-amber-300/80 rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
            <Wrench className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-amber-950">
                Sub Menu Pemakaian Material (Inputan Menyusul)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white tracking-wide uppercase shadow-2xs">
                Draft Modul
              </span>
            </div>
            <p className="text-xs sm:text-[13px] text-amber-900 leading-relaxed font-medium">
              Sub menu ini telah terintegrasi dalam alur menu <strong>Transaksi</strong>. Formulir detail spesifikasi pemakaian teknis (daftar material terpasang, kode tiang, no gardu, dsb) akan segera menyusul sesuai format laporan lapangan ULP.
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 3. Form Input Awal Pemakaian Material */}
      <form
        onSubmit={handleSubmitDraft}
        className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl border border-white/80 space-y-6"
      >
        <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Informasi Pemakaian Material
              </h2>
              <p className="text-xs text-slate-500">
                Isi parameter pekerjaan lapangan. Semua input manual otomatis berhuruf kapital.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
            Formulir Awal
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Tanggal */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Tanggal Pemakaian</span>
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={e => setTanggal(e.target.value)}
              className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-semibold text-slate-800 shadow-2xs"
              required
            />
          </div>

          {/* Regu (Perubahan dari Regu Yandal menjadi Regu) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Regu</span>
            </label>
            <select
              value={regu}
              onChange={e => setRegu(e.target.value.toUpperCase())}
              className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-800 shadow-2xs uppercase cursor-pointer"
            >
              <option value="ULC_A">ULC_A</option>
              <option value="ULC_B">ULC_B</option>
              <option value="ULC_C">ULC_C</option>
              <option value="ULC_D">ULC_D</option>
              <option value="MS1_A">MS1_A</option>
              <option value="MS1_B">MS1_B</option>
              <option value="MS1_C">MS1_C</option>
              <option value="MS1_D">MS1_D</option>
              <option value="GAMET">GAMET</option>
              <option value="PREVENTIF 1">PREVENTIF 1</option>
              <option value="PREVENTIF 2">PREVENTIF 2</option>
              <option value="PLN">PLN</option>
            </select>
          </div>

          {/* Petugas Pelaksana (Otomatis Kapital) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Petugas Pelaksana</span>
            </label>
            <input
              type="text"
              value={petugasPelaksana}
              onChange={e => setPetugasPelaksana(e.target.value.toUpperCase())}
              placeholder="NAMA PETUGAS PELAKSANA..."
              className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-900 uppercase tracking-wide shadow-2xs placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
              required
            />
          </div>

          {/* Keperluan / Jenis Pekerjaan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Keperluan / Jenis Pekerjaan</span>
            </label>
            <select
              value={keperluan}
              onChange={e => setKeperluan(e.target.value)}
              className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-800 shadow-2xs cursor-pointer"
            >
              <option value="PASANG BARU">PASANG BARU</option>
              <option value="PERUBAHAN DAYA DAN MIGRASI">PERUBAHAN DAYA DAN MIGRASI</option>
              <option value="GANGGUAN DAN PEMELIHARAAN">GANGGUAN DAN PEMELIHARAAN</option>
              <option value="GANTI METER">GANTI METER</option>
              <option value="P2TL">P2TL</option>
            </select>
          </div>

          {/* No. Laporan / No. Agenda / PK */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              No. Laporan / No. PK / Agenda
            </label>
            <input
              type="text"
              value={noLaporan}
              onChange={e => setNoLaporan(e.target.value.toUpperCase())}
              placeholder="CONTOH: PK-2026/04/001 ATAU NO AGENDA..."
              className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-900 uppercase shadow-2xs placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
            />
          </div>

          {/* Lokasi Pekerjaan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Lokasi Pekerjaan / Gardu
            </label>
            <input
              type="text"
              value={lokasiPekerjaan}
              onChange={e => setLokasiPekerjaan(e.target.value.toUpperCase())}
              placeholder="CONTOH: PENYULANG TGL02 / GARDU TG120..."
              className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-900 uppercase shadow-2xs placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Inputan Detail Rincian Material Menyusul Box */}
        <div className="p-5 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
            <Layers className="w-5 h-5" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-800">
            Daftar Rincian Material Terpakai (Inputan Menyusul)
          </h4>
          <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
            Kolom pemilihan material, normalisasi, nomor seri meter, dan kuantitas material terpasang sedang dipersiapkan dan akan ditampilkan pada pembaruan spesifikasi berikutnya.
          </p>
        </div>

        {/* Keterangan Tambahan */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Catatan / Keterangan
          </label>
          <textarea
            rows={2}
            value={keterangan}
            onChange={e => setKeterangan(e.target.value.toUpperCase())}
            placeholder="CATATAN PEMAKAIAN MATERIAL LAPANGAN..."
            className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium text-slate-900 uppercase shadow-2xs placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onBackToTransaksi}
            className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all cursor-pointer"
          >
            Kembali
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Draft Pemakaian</span>
          </button>
        </div>
      </form>
    </div>
  );
};
