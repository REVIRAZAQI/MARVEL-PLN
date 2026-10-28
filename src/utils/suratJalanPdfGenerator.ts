import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SuratJalanData, SuratJalanItem } from '../types/warehouse';
import { PLN_LOGO_BASE64 } from './logoPlnBase64';

/**
 * Generates an official, razor-sharp vector PDF of Surat Jalan Barang matching the PLN template.
 * Uses jsPDF and jspdf-autotable directly, eliminating any oklch or canvas rendering errors.
 */
const saveDoc = (doc: jsPDF, fileName: string) => {
  try {
    // 1. Standard jsPDF save
    doc.save(fileName);
  } catch (err) {
    console.warn('Standard doc.save failed, using Blob fallback:', err);
    // 2. Blob URL fallback
    try {
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 1500);
    } catch (e2) {
      console.error('Blob save fallback failed:', e2);
      // 3. Fallback: open in new tab
      const dataUri = doc.output('datauristring');
      const win = window.open();
      if (win) {
        win.document.write(`<iframe src="${dataUri}" frameborder="0" style="border:0; top:0; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>`);
      }
    }
  }
};

/**
 * Renders a complete Surat Jalan document onto the current page of a jsPDF document.
 */
export const renderSuratJalanPage = (doc: jsPDF, data: SuratJalanData) => {
  // A4 size: 210 x 297 mm
  const marginX = 14;
  let cursorY = 12;

  // 1. PLN Official Logo Image (Official logo uploaded by user)
  try {
    doc.addImage(PLN_LOGO_BASE64, 'PNG', marginX, cursorY, 12, 16.8);
  } catch (err) {
    console.warn('Could not add base64 image to PDF', err);
  }

  // 2. Corporate Sub-Units Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  const textX = marginX + 15;
  doc.text('PT PLN (PERSERO)', textX, cursorY + 4);
  doc.text('UID JAWA TIMUR', textX, cursorY + 7.5);
  doc.text('UP3 JEMBER', textX, cursorY + 11);
  doc.text('ULP TANGGUL', textX, cursorY + 14.5);

  // 3. Document Title & Nomor Surat (Centered)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text('SURAT JALAN BARANG', 120, cursorY + 5.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(data.nomorSurat || '', 120, cursorY + 10.5, { align: 'center' });

  // 4. Metadata Section
  cursorY += 21;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Nama Petugas', marginX, cursorY);
  doc.text(':', marginX + 23, cursorY);
  doc.setFont('helvetica', 'bold');
  const namaPetugas = data.namaPetugas || data.penerima || 'Petugas Pelaksana';
  doc.text(namaPetugas, marginX + 26, cursorY);

  // Kendaraan on the right of Row 1
  doc.setFont('helvetica', 'normal');
  doc.text('Kendaraan :', 132, cursorY);
  doc.setFont('helvetica', 'bold');
  doc.text(data.kendaraan || 'Kendaraan Yantek', 152, cursorY);

  cursorY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.text('Peruntukan', marginX, cursorY);
  doc.text(':', marginX + 23, cursorY);
  doc.setFont('helvetica', 'bold');
  doc.text(data.peruntukan || 'Material ULP Tanggul', marginX + 26, cursorY);

  cursorY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.text('No SPK', marginX, cursorY);
  doc.text(':', marginX + 23, cursorY);
  doc.setFont('helvetica', 'bold');
  doc.text(data.noSpk || '', marginX + 26, cursorY);

  cursorY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Beikut kami kirimkan material berupa,', marginX, cursorY);

  // 5. Unified Materials Table (Combined single table matching template image)
  cursorY += 2;
  const allItems = (data.items && data.items.length > 0)
    ? data.items
    : [...(data.itemsAsg || []), ...(data.itemsNonAsg || [])];

  const itemRows: (string | number)[][] = [];
  const maxRows = Math.max(28, allItems.length);

  for (let i = 0; i < maxRows; i++) {
    const item = allItems[i];
    if (item) {
      const keluarVal = (item.keluar !== undefined && item.keluar > 0)
        ? item.keluar
        : (item.pasangBaru > 0 ? item.pasangBaru : '');
      const masukVal = (item.masuk !== undefined && item.masuk > 0)
        ? item.masuk
        : (item.perubahanDaya > 0 ? item.perubahanDaya : '');
      itemRows.push([
        item.no || i + 1,
        item.normalisasi || '',
        item.namaBarang || '',
        keluarVal,
        masukVal,
        item.jumlah > 0 ? item.jumlah : '',
        (item.satuan || '').toUpperCase()
      ]);
    } else {
      // Empty filler row
      itemRows.push(['', '', '', '', '', '', '']);
    }
  }

  // Draw Single Combined Table matching template image (28 rows, white head, double border styling)
  autoTable(doc, {
    startY: cursorY + 4,
    margin: { left: marginX, right: marginX },
    head: [['NO', 'NORMALISASI', 'NAMA BARANG', 'KELUAR', 'MASUK', 'JUMLAH', 'SAT']],
    body: itemRows,
    theme: 'grid',
    tableWidth: 182,
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.25,
      lineColor: [0, 0, 0]
    },
    bodyStyles: {
      textColor: [0, 0, 0],
      fontSize: 6.8,
      lineWidth: 0.2,
      lineColor: [0, 0, 0],
      cellPadding: 0.9,
      minCellHeight: 4.2
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },      // NO
      1: { cellWidth: 26, halign: 'center' },     // NORMALISASI
      2: { cellWidth: 73, halign: 'left' },       // NAMA BARANG
      3: { cellWidth: 20, halign: 'center' },     // KELUAR
      4: { cellWidth: 20, halign: 'center' },     // MASUK
      5: { cellWidth: 18, halign: 'center' },     // JUMLAH
      6: { cellWidth: 16, halign: 'center' }      // SAT
    }
  });

  // Draw crisp outer double border frame around table to replicate template image
  const afterTableY = (doc as any).lastAutoTable?.finalY || 215;
  const tableStartY = cursorY + 4;
  const tableH = afterTableY - tableStartY;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.rect(marginX - 0.7, tableStartY - 0.7, 182 + 1.4, tableH + 1.4);

  // 6. Signatures Footer
  const sigY = Math.max(afterTableY + 4, 236);

  // Tanggal on top right of signatures
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Tanggul,    ${data.tanggal || '20 Oktober 2026'}`, 196, sigY, { align: 'right' });

  // 3 Columns: Penerima Barang (col 1), Keamanan (col 2), Pemberi (col 3)
  const col1X = marginX + 25;  // ~39 mm
  const col2X = marginX + 91;  // ~105 mm
  const col3X = marginX + 157; // ~171 mm

  const roleTitleY = sigY + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Penerima Barang', col1X, roleTitleY, { align: 'center' });
  doc.text('Keamanan', col2X, roleTitleY, { align: 'center' });
  doc.text('Pemberi', col3X, roleTitleY, { align: 'center' });

  // Signatory Names at bottom
  const nameY = roleTitleY + 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  const penerimaName = data.penerima || namaPetugas;
  doc.text(
    penerimaName ? `( ${penerimaName} )` : '(                          )',
    col1X,
    nameY,
    { align: 'center' }
  );
  doc.text(
    data.keamanan ? `( ${data.keamanan} )` : '(                          )',
    col2X,
    nameY,
    { align: 'center' }
  );
  const pemberiName = data.pemberi || 'Ahmad Zaenudin';
  doc.text(pemberiName ? `( ${pemberiName} )` : '( Ahmad Zaenudin )', col3X, nameY, { align: 'center' });
};

/**
 * Generates an official vector PDF of a single Surat Jalan Barang.
 */
export const generateSuratJalanPDF = (data: SuratJalanData): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  renderSuratJalanPage(doc, data);
  return doc;
};

/**
 * Generates an official multi-page PDF combining multiple Surat Jalan into 1 file.
 * Each Surat Jalan is rendered on its own A4 page.
 */
export const generateCollectiveSuratJalanPDF = (dataList: SuratJalanData[]): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  dataList.forEach((data, index) => {
    if (index > 0) {
      doc.addPage('a4', 'portrait');
    }
    renderSuratJalanPage(doc, data);
  });

  return doc;
};

/**
 * Downloads a single Surat Jalan PDF file directly to user device with multi-layer browser fallback.
 */
export const downloadSuratJalanPDF = (data: SuratJalanData) => {
  const doc = generateSuratJalanPDF(data);
  const safeNo = (data.nomorSurat || 'PLN').replace(/[\/\\?%*:|"<>]/g, '_');
  const fileName = `Surat_Jalan_${safeNo}.pdf`;
  saveDoc(doc, fileName);
};

/**
 * Downloads multiple Surat Jalan documents collectively into a single multi-page PDF file.
 */
export const downloadCollectiveSuratJalanPDF = (dataList: SuratJalanData[], customFilename?: string) => {
  if (!dataList || dataList.length === 0) return;
  const doc = generateCollectiveSuratJalanPDF(dataList);
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const fileName = customFilename || `Surat_Jalan_Kolektif_${dataList.length}_Dokumen_${dateStr}.pdf`;
  saveDoc(doc, fileName);
};

/**
 * Generates an inner HTML string for a single Surat Jalan document.
 */
export const getSuratJalanPageInnerHTML = (data: SuratJalanData, isLast = false): string => {
  const safeNo = data.nomorSurat || '';
  const namaPetugas = data.namaPetugas || data.penerima || 'Petugas Pelaksana';
  const kendaraan = data.kendaraan || 'Kendaraan Yantek';
  const peruntukan = data.peruntukan || 'Material ULP Tanggul';
  const noSpk = data.noSpk || '';
  const tanggal = data.tanggal || '20 Oktober 2026';
  const pemberi = data.pemberi || 'Ahmad Zaenudin';
  const penerima = data.penerima || namaPetugas;

  const allItems = (data.items && data.items.length > 0)
    ? data.items
    : [...(data.itemsAsg || []), ...(data.itemsNonAsg || [])];

  const totalRows = Math.max(28, allItems.length);
  const emptyRowsCount = Math.max(0, totalRows - allItems.length);

  return `
  <div class="sheet-container" style="${isLast ? '' : 'page-break-after: always; break-after: page;'}">
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td style="width: 52px; vertical-align: top;">
          <img src="${PLN_LOGO_BASE64}" style="width: 46px; height: auto; display: block;" alt="Logo PLN" />
        </td>
        <td style="vertical-align: top; padding-left: 6px; width: 180px;">
          <div class="unit-text">
            PT PLN (PERSERO)<br>
            UID JAWA TIMUR<br>
            UP3 JEMBER<br>
            ULP TANGGUL
          </div>
        </td>
        <td style="vertical-align: middle; text-align: center; padding-right: 40px;">
          <div class="doc-title">SURAT JALAN BARANG</div>
          <div class="doc-no">${safeNo}</div>
        </td>
      </tr>
    </table>

    <!-- Metadata -->
    <table class="meta-table">
      <tr>
        <td style="width: 90px;">Nama Petugas</td>
        <td style="width: 8px;">:</td>
        <td style="font-weight: bold;">${namaPetugas}</td>
        <td style="width: 75px; text-align: right; padding-right: 6px;">Kendaraan :</td>
        <td style="width: 180px; font-weight: bold;">${kendaraan}</td>
      </tr>
      <tr>
        <td>Peruntukan</td>
        <td>:</td>
        <td colspan="3" style="font-weight: bold;">${peruntukan}</td>
      </tr>
      <tr>
        <td>No SPK</td>
        <td>:</td>
        <td colspan="3" style="font-weight: bold; font-family: monospace;">${noSpk}</td>
      </tr>
    </table>

    <div style="margin: 4px 0 3px 0;">Beikut kami kirimkan material berupa,</div>

    <!-- Single Combined Items Table (Double Border Outer Frame) -->
    <div class="table-outer-frame">
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 28px;">NO</th>
            <th style="width: 95px;">NORMALISASI</th>
            <th>NAMA BARANG</th>
            <th style="width: 70px;">KELUAR</th>
            <th style="width: 70px;">MASUK</th>
            <th style="width: 55px;">JUMLAH</th>
            <th style="width: 45px;">SAT</th>
          </tr>
        </thead>
        <tbody>
          ${allItems.map((item, idx) => {
            const keluarVal = (item.keluar !== undefined && item.keluar > 0)
              ? item.keluar
              : (item.pasangBaru > 0 ? item.pasangBaru : '');
            const masukVal = (item.masuk !== undefined && item.masuk > 0)
              ? item.masuk
              : (item.perubahanDaya > 0 ? item.perubahanDaya : '');
            return `
            <tr>
              <td class="text-center">${item.no || idx + 1}</td>
              <td class="text-center" style="font-family: monospace;">${item.normalisasi || ''}</td>
              <td style="font-weight: 500;">${item.namaBarang}</td>
              <td class="text-center">${keluarVal}</td>
              <td class="text-center">${masukVal}</td>
              <td class="text-center" style="font-weight: bold; font-family: monospace;">${item.jumlah > 0 ? item.jumlah : ''}</td>
              <td class="text-center">${(item.satuan || '').toUpperCase()}</td>
            </tr>
          `;
          }).join('')}
          ${Array.from({ length: emptyRowsCount }).map(() => `
            <tr>
              <td class="text-center">&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Signatures -->
    <div class="sig-section">
      <div class="sig-date">Tanggul,&nbsp;&nbsp;&nbsp;&nbsp;<b>${tanggal}</b></div>
      <div class="sig-grid">
        <div class="sig-col">
          <div style="font-weight: bold;">Penerima Barang</div>
          <div class="sig-name">${penerima ? `( ${penerima} )` : '( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )'}</div>
        </div>
        <div class="sig-col">
          <div style="font-weight: bold;">Keamanan</div>
          <div class="sig-name">${data.keamanan ? `( ${data.keamanan} )` : '( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )'}</div>
        </div>
        <div class="sig-col">
          <div style="font-weight: bold;">Pemberi</div>
          <div class="sig-name">${pemberi ? `( ${pemberi} )` : '( Ahmad Zaenudin )'}</div>
        </div>
      </div>
    </div>
  </div>`;
};

/**
 * Generates full HTML page containing multiple Surat Jalan for collective printing.
 */
export const getCollectiveSuratJalanPrintHTML = (dataList: SuratJalanData[]): string => {
  const pagesHtml = dataList.map((data, idx) => getSuratJalanPageInnerHTML(data, idx === dataList.length - 1)).join('\n');
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Surat Jalan PLN (${dataList.length} Dokumen)</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: Arial, Helvetica, sans-serif;
      color: #000;
    }
    body {
      background: #fff;
      padding: 0;
      font-size: 11px;
      line-height: 1.25;
    }
    .sheet-container {
      padding: 8px 12px;
      box-sizing: border-box;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .unit-text {
      font-size: 9.5px;
      font-weight: 900;
      line-height: 1.2;
      text-transform: uppercase;
      vertical-align: top;
      padding-left: 8px;
    }
    .doc-title {
      font-size: 16px;
      font-weight: 900;
      text-align: center;
      text-transform: uppercase;
    }
    .doc-no {
      font-size: 11px;
      font-weight: bold;
      text-align: center;
      margin-top: 2px;
      font-family: monospace, Courier, sans-serif;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      margin-bottom: 8px;
    }
    .meta-table td {
      padding: 1.5px 0;
      vertical-align: baseline;
    }
    .table-outer-frame {
      border: 1px solid #000;
      padding: 1.5px;
      margin-top: 5px;
      margin-bottom: 4px;
      background: #fff;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #000;
      font-size: 9.5px;
      background: #fff;
    }
    .items-table th {
      border: 1px solid #000;
      background-color: #fff;
      font-weight: bold;
      text-align: center;
      padding: 2.5px 2px;
      vertical-align: middle;
      font-size: 9.5px;
      letter-spacing: 0.2px;
    }
    .items-table td {
      border: 1px solid #000;
      padding: 2px 3px;
      height: 18px;
      vertical-align: middle;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .sig-section {
      margin-top: 18px;
      font-size: 10.5px;
    }
    .sig-date {
      text-align: right;
      padding-right: 30px;
      margin-bottom: 8px;
    }
    .sig-grid {
      display: flex;
      justify-content: space-between;
      text-align: center;
      padding: 0 15px;
    }
    .sig-col {
      width: 30%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 95px;
    }
    .sig-name {
      font-weight: bold;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;
};

/**
 * Generates clean, standalone HTML string for a single Surat Jalan
 */
export const getSuratJalanPrintHTML = (data: SuratJalanData): string => {
  return getCollectiveSuratJalanPrintHTML([data]);
};

/**
 * Foolproof printing of a single Surat Jalan using an isolated hidden iframe
 */
export const printSuratJalanViaIframe = (data: SuratJalanData) => {
  printCollectiveSuratJalanViaIframe([data]);
};

/**
 * Foolproof collective printing of multiple Surat Jalan documents via an isolated hidden iframe
 */
export const printCollectiveSuratJalanViaIframe = (dataList: SuratJalanData[]) => {
  if (!dataList || dataList.length === 0) return;
  const iframe = document.createElement('iframe');
  iframe.setAttribute('style', 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  const html = getCollectiveSuratJalanPrintHTML(dataList);
  doc.open();
  doc.write(html);
  doc.close();

  // Allow styles and fonts to render, then print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn('Iframe print error, falling back to window.print():', e);
      window.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 4000);
    }
  }, 300);
};
