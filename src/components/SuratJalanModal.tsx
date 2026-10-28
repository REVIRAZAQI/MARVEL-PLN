import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SuratJalanData, SuratJalanItem } from '../types/warehouse';
import { X, Printer, Download, Edit3, ShieldCheck, Loader2, CheckCircle2, FileCheck } from 'lucide-react';
import { downloadSuratJalanPDF, printSuratJalanViaIframe } from '../utils/suratJalanPdfGenerator';

import { useModalScrollLock, forceUnlockScroll } from '../utils/modalScrollLock';

interface SuratJalanModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SuratJalanData | null;
  onSave?: (updatedData: SuratJalanData) => void;
}

export const SuratJalanModal: React.FC<SuratJalanModalProps> = ({
  isOpen,
  onClose,
  data,
  onSave
}) => {
  useModalScrollLock(isOpen);

  if (!isOpen || !data) return null;

  return (
    <SuratJalanModalInner
      onClose={() => {
        forceUnlockScroll();
        onClose();
      }}
      data={data}
      onSave={onSave}
    />
  );
};

const SuratJalanModalInner: React.FC<{
  onClose: () => void;
  data: SuratJalanData;
  onSave?: (updatedData: SuratJalanData) => void;
}> = ({
  onClose,
  data,
  onSave
}) => {
  const [formData, setFormData] = useState<SuratJalanData>(data);
  const [isEditing, setIsEditing] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Safely manage modal scroll lock
  useModalScrollLock(true);

  // Sync state when data prop changes
  React.useEffect(() => {
    setFormData(data);
    setFeedbackMessage(null);
  }, [data]);

  const handlePrint = () => {
    setIsPrinting(true);
    setFeedbackMessage('Membuka dialog cetak dokumen...');

    try {
      // Use clean iframe printer for 100% reliable printing without backdrop/modal clipping
      printSuratJalanViaIframe(formData);
    } catch (err) {
      console.warn('Iframe print failed, calling window.print directly:', err);
      window.print();
    } finally {
      setTimeout(() => {
        setIsPrinting(false);
        setTimeout(() => setFeedbackMessage(null), 3000);
      }, 1000);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloadingPdf(true);
    setFeedbackMessage('Menyiapkan file PDF resmi PLN...');

    try {
      // Direct vector PDF download with jsPDF & autotable
      downloadSuratJalanPDF(formData);
      setFeedbackMessage('Dokumen PDF berhasil diunduh!');
    } catch (err) {
      console.error('Error generating PDF:', err);
      // Fallback
      printSuratJalanViaIframe(formData);
      setFeedbackMessage('Mengalihkan ke dialog cetak / Simpan sebagai PDF...');
    } finally {
      setIsDownloadingPdf(false);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const allItems: SuratJalanItem[] = (formData.items && formData.items.length > 0)
    ? formData.items
    : [...(formData.itemsAsg || []), ...(formData.itemsNonAsg || [])];

  const handleItemChange = (
    index: number,
    field: keyof SuratJalanItem,
    value: string | number
  ) => {
    if (!formData) return;
    const targetList = [...allItems];
    const item = { ...targetList[index] };

    if (field === 'keluar' || field === 'masuk' || field === 'pasangBaru' || field === 'perubahanDaya') {
      const numVal = Math.max(0, parseInt(String(value), 10) || 0);
      if (field === 'keluar' || field === 'pasangBaru') {
        item.keluar = numVal;
        item.pasangBaru = numVal;
      } else {
        item.masuk = numVal;
        item.perubahanDaya = numVal;
      }
      const k = item.keluar ?? item.pasangBaru ?? 0;
      const m = item.masuk ?? item.perubahanDaya ?? 0;
      item.jumlah = k + m;
    } else {
      (item as any)[field] = value;
    }

    targetList[index] = item;
    const updated: SuratJalanData = {
      ...formData,
      items: targetList,
      itemsAsg: targetList,
      itemsNonAsg: []
    };
    setFormData(updated);
    if (onSave) onSave(updated);
  };

  // Full standard 28-row A4 sheet structure with scroll down preview
  const totalRows = Math.max(28, allItems.length);
  const emptyRowsCount = Math.max(0, totalRows - allItems.length);

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overscroll-contain modal-backdrop-print modal-backdrop-animate"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative bg-white rounded-2xl max-w-4xl w-full h-[92vh] max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden modal-dialog-print m-auto modal-content-animate"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Action Bar (Hidden in Print) */}
        <div className="no-print px-4 py-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 shadow-xs">
              <img
                src="/assets/aistudio/Logo_PLN_4161717a.png"
                alt="PLN"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold flex items-center gap-2">
                <span>Surat Jalan Pengambilan Barang</span>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Disetujui Admin & MULP
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {formData.nomorSurat} · ULP Tanggul
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {feedbackMessage && (
              <span className="text-xs text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2.5 py-1 rounded-md flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{feedbackMessage}</span>
              </span>
            )}

            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                isEditing
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Selesai Edit' : 'Edit Data'}</span>
            </button>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloadingPdf}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              title="Download dokumen Surat Jalan sebagai file PDF"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyiapkan PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 active:scale-95 rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              title="Cetak langsung ke printer atau Simpan PDF via dialog cetak"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mencetak...</span>
                </>
              ) : (
                <>
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak (Print)</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center modal-body-print">
          {/* Printable Sheet (EXACT REPLICA of user template image) */}
          <div
            ref={printRef}
            id="printable-surat-jalan"
            className="bg-white border border-slate-300 shadow-md p-5 sm:p-7 w-full max-w-[760px] text-black font-sans text-[11px] leading-tight print:shadow-none print:border-none print:p-0 print:max-w-none rounded-xl"
            style={{ backgroundColor: '#ffffff', color: '#000000' }}
          >
            {/* 1. Kop Surat PLN (Official Header) */}
            <div className="flex items-start justify-between pb-3">
              {/* Left: Official PLN Emblem & Units */}
              <div className="flex items-start gap-3">
                {/* Official PLN Logo Image */}
                <div className="flex flex-col items-center shrink-0">
                  <img
                    src="/assets/aistudio/Logo_PLN_4161717a.png"
                    alt="Logo PLN"
                    className="w-12 h-auto object-contain shrink-0"
                  />
                </div>

                {/* Corporate Text */}
                <div className="text-[10.5px] font-extrabold tracking-tight uppercase leading-tight pt-0.5">
                  <div>PT PLN (PERSERO)</div>
                  <div>UID JAWA TIMUR</div>
                  <div>UP3 JEMBER</div>
                  <div>ULP TANGGUL</div>
                </div>
              </div>

              {/* Center/Right: Document Title & Nomor Surat */}
              <div className="flex-1 text-center pr-8">
                <h1 className="text-sm sm:text-base font-black uppercase tracking-wide">
                  SURAT JALAN BARANG
                </h1>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.nomorSurat}
                    onChange={e => setFormData({ ...formData, nomorSurat: e.target.value })}
                    className="no-print mt-1 text-center font-bold text-xs border border-sky-400 rounded px-2 py-0.5 w-64"
                  />
                ) : (
                  <div className="text-xs font-bold font-mono tracking-tight mt-0.5">
                    {formData.nomorSurat}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Metadata */}
            <div className="mt-2 text-[10.5px] space-y-1">
              {/* Row 1: Nama Petugas + Kendaraan */}
              <div className="grid grid-cols-12 gap-1 items-baseline">
                <div className="col-span-2 font-medium">Nama Petugas</div>
                <div className="col-span-5 font-bold flex items-center gap-1">
                  <span>:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.namaPetugas || formData.penerima}
                      onChange={e => setFormData({ ...formData, namaPetugas: e.target.value, penerima: e.target.value })}
                      className="no-print border border-slate-300 rounded px-1.5 py-0.5 text-[10.5px] w-full"
                    />
                  ) : (
                    <span>{formData.namaPetugas || formData.penerima}</span>
                  )}
                </div>
                <div className="col-span-2 font-medium text-right pr-2">Kendaraan :</div>
                <div className="col-span-3 font-semibold">
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.kendaraan}
                      onChange={e => setFormData({ ...formData, kendaraan: e.target.value })}
                      className="no-print border border-slate-300 rounded px-1.5 py-0.5 text-[10.5px] w-full"
                    />
                  ) : (
                    <span>{formData.kendaraan || 'Kendaraan Yantek'}</span>
                  )}
                </div>
              </div>

              {/* Row 2: Peruntukan */}
              <div className="grid grid-cols-12 gap-1 items-baseline">
                <div className="col-span-2 font-medium">Peruntukan</div>
                <div className="col-span-10 font-bold flex items-center gap-1">
                  <span>:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.peruntukan}
                      onChange={e => setFormData({ ...formData, peruntukan: e.target.value })}
                      className="no-print border border-slate-300 rounded px-1.5 py-0.5 text-[10.5px] w-full"
                    />
                  ) : (
                    <span>{formData.peruntukan}</span>
                  )}
                </div>
              </div>

              {/* Row 3: No SPK (isi manual) */}
              <div className="grid grid-cols-12 gap-1 items-baseline">
                <div className="col-span-2 font-medium">No SPK</div>
                <div className="col-span-10 font-bold flex items-center gap-1">
                  <span>:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.noSpk}
                      onChange={e => setFormData({ ...formData, noSpk: e.target.value })}
                      placeholder="(Isi manual No. SPK)"
                      className="no-print border border-slate-300 rounded px-1.5 py-0.5 text-[10.5px] w-full font-mono"
                    />
                  ) : (
                    <span className="font-mono">
                      {formData.noSpk || <span className="text-slate-400 font-normal italic">(Isi manual)</span>}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Intro text */}
            <div className="mt-3 text-[10.5px]">
              Beikut kami kirimkan material berupa,
            </div>

            {/* 3. Single Combined Items Table (Double Outline Border Table matching reference image) */}
            <div className="mt-1 border border-black p-[1.5px] bg-white">
              <table className="w-full border-collapse border border-black text-[9.5px] sm:text-[10px] bg-white">
                <thead>
                  <tr className="border-b border-black text-center font-bold bg-white text-black">
                    <th className="border border-black py-1 px-1 w-8 text-center font-bold">NO</th>
                    <th className="border border-black py-1 px-1.5 w-24 text-center font-bold tracking-tight">NORMALISASI</th>
                    <th className="border border-black py-1 px-2 text-center font-bold">NAMA BARANG</th>
                    <th className="border border-black py-1 px-1 w-20 text-center font-bold leading-none">
                      KELUAR
                    </th>
                    <th className="border border-black py-1 px-1 w-20 text-center font-bold leading-none">
                      MASUK
                    </th>
                    <th className="border border-black py-1 px-1 w-14 text-center font-bold">JUMLAH</th>
                    <th className="border border-black py-1 px-1 w-12 text-center font-bold">SAT</th>
                  </tr>
                </thead>
                <tbody>
                  {allItems.map((item, idx) => {
                    const keluarVal = (item.keluar !== undefined && item.keluar > 0)
                      ? item.keluar
                      : (item.pasangBaru > 0 ? item.pasangBaru : '');
                    const masukVal = (item.masuk !== undefined && item.masuk > 0)
                      ? item.masuk
                      : (item.perubahanDaya > 0 ? item.perubahanDaya : '');
                    return (
                      <tr key={`item-${idx}`} className="border-b border-black h-5.5">
                        <td className="border border-black text-center py-0.5 px-1 font-mono">
                          {item.no || idx + 1}
                        </td>
                        <td className="border border-black text-center py-0.5 px-1 font-mono">
                          {isEditing ? (
                            <input
                              type="text"
                              value={item.normalisasi || ''}
                              onChange={e => handleItemChange(idx, 'normalisasi', e.target.value)}
                              className="no-print w-full text-center border rounded py-0 font-mono text-[9px]"
                            />
                          ) : (
                            item.normalisasi || ''
                          )}
                        </td>
                        <td className="border border-black py-0.5 px-2 font-medium">
                          {isEditing ? (
                            <input
                              type="text"
                              value={item.namaBarang}
                              onChange={e => handleItemChange(idx, 'namaBarang', e.target.value)}
                              className="no-print w-full border rounded py-0 text-[9px]"
                            />
                          ) : (
                            item.namaBarang
                          )}
                        </td>
                        <td className="border border-black text-center font-mono py-0.5 px-1">
                          {isEditing ? (
                            <input
                              type="number"
                              value={item.keluar ?? item.pasangBaru ?? ''}
                              onChange={e => handleItemChange(idx, 'keluar', e.target.value)}
                              className="no-print w-14 text-center border rounded py-0"
                            />
                          ) : (
                            keluarVal
                          )}
                        </td>
                        <td className="border border-black text-center font-mono py-0.5 px-1">
                          {isEditing ? (
                            <input
                              type="number"
                              value={item.masuk ?? item.perubahanDaya ?? ''}
                              onChange={e => handleItemChange(idx, 'masuk', e.target.value)}
                              className="no-print w-14 text-center border rounded py-0"
                            />
                          ) : (
                            masukVal
                          )}
                        </td>
                        <td className="border border-black text-center font-mono font-bold py-0.5 px-1">
                          {item.jumlah > 0 ? item.jumlah : ''}
                        </td>
                        <td className="border border-black text-center py-0.5 px-1 uppercase">
                          {isEditing ? (
                            <input
                              type="text"
                              value={item.satuan}
                              onChange={e => handleItemChange(idx, 'satuan', e.target.value)}
                              className="no-print w-10 text-center border rounded py-0 uppercase text-[9px]"
                            />
                          ) : (
                            item.satuan
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Empty filler rows to match standard printed paper template (28 rows) */}
                  {Array.from({ length: emptyRowsCount }).map((_, i) => (
                    <tr key={`fill-${i}`} className="border-b border-black h-5.5">
                      <td className="border border-black text-center py-0.5 px-1 text-transparent select-none">&nbsp;</td>
                      <td className="border border-black py-0.5 px-1">&nbsp;</td>
                      <td className="border border-black py-0.5 px-2">&nbsp;</td>
                      <td className="border border-black py-0.5 px-1">&nbsp;</td>
                      <td className="border border-black py-0.5 px-1">&nbsp;</td>
                      <td className="border border-black py-0.5 px-1">&nbsp;</td>
                      <td className="border border-black py-0.5 px-1">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 5. Signatures Footer (Exact layout matching template) */}
            <div className="mt-6 text-[10px] sm:text-[10.5px]">
              {/* Date right aligned */}
              <div className="flex justify-end pr-10 mb-1">
                <div className="text-right">
                  <span>Tanggul,&nbsp;&nbsp;&nbsp;&nbsp;</span>
                  {isEditing ? (
                    <div className="inline-flex items-center gap-1.5 no-print">
                      <span className="font-semibold text-slate-800">{formData.tanggal}</span>
                      <input
                        type="date"
                        onChange={e => {
                          const val = e.target.value;
                          if (val) {
                            const [y, m, d] = val.split('-');
                            const monthNames = [
                              'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                              'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                            ];
                            const indonesianDate = `${parseInt(d, 10)} ${monthNames[parseInt(m, 10) - 1]} ${y}`;
                            setFormData({ ...formData, tanggal: indonesianDate });
                          }
                        }}
                        className="border border-slate-300 rounded px-1 py-0.5 text-[10px] cursor-pointer bg-white"
                        title="Pilih tanggal surat jalan dengan kalender"
                      />
                    </div>
                  ) : (
                    <span className="font-semibold">{formData.tanggal}</span>
                  )}
                </div>
              </div>

              {/* 3 Signature Columns: Penerima Barang, Keamanan, Pemberi */}
              <div className="grid grid-cols-3 gap-4 text-center">
                {/* Column 1: Penerima Barang */}
                <div className="flex flex-col justify-between h-28">
                  <div className="font-bold">Penerima Barang</div>
                  <div className="space-y-0.5">
                    <div className="font-extrabold uppercase">
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.penerima}
                          onChange={e => setFormData({ ...formData, penerima: e.target.value })}
                          className="no-print border border-slate-300 rounded px-1 text-[10px] text-center w-full"
                        />
                      ) : (
                        <span>
                          {formData.penerima
                            ? `( ${formData.penerima} )`
                            : '( \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 )'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 2: Keamanan (Cell BP Sheet 1 Spreadsheet) */}
                <div className="flex flex-col justify-between h-28">
                  <div className="font-bold">Keamanan</div>
                  <div className="space-y-0.5">
                    <div className="font-extrabold uppercase">
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.keamanan}
                          onChange={e => setFormData({ ...formData, keamanan: e.target.value })}
                          placeholder="Nama Petugas Keamanan (Cell BP)"
                          className="no-print border border-slate-300 rounded px-1 text-[10px] text-center w-full font-bold"
                        />
                      ) : (
                        <span>
                          {formData.keamanan
                            ? `( ${formData.keamanan} )`
                            : '( \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 )'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 3: Pemberi (Cell CL Sheet 1 Spreadsheet) */}
                <div className="flex flex-col justify-between h-28">
                  <div className="font-bold">Pemberi</div>
                  <div className="space-y-0.5">
                    <div className="font-extrabold uppercase tracking-wider">
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.pemberi}
                          onChange={e => setFormData({ ...formData, pemberi: e.target.value })}
                          placeholder="Nama Pemberi Material (Cell CL)"
                          className="no-print border border-slate-300 rounded px-1 text-[10px] text-center w-full font-bold"
                        />
                      ) : (
                        <span>
                          {formData.pemberi
                            ? `( ${formData.pemberi} )`
                            : '( Ahmad Zaenudin )'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
