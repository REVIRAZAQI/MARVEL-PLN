import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const SYNC_CONFIG_FILE = path.join(DATA_DIR, 'sync-config.json');
const WAREHOUSE_DATA_FILE = path.join(DATA_DIR, 'warehouse-data.json');
const SHEET1_CSV_FILE = path.join(DATA_DIR, 'server_spreadsheet_Sheet1.csv');
const DB_MATERIAL_CSV_FILE = path.join(DATA_DIR, 'server_spreadsheet_DB_MATERIAL.csv');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface ServerSyncConfig {
  webhookUrl: string;
  sheetName: string;
  dbMaterialSheetName: string;
  autoSync: boolean;
  lastSyncTimestamp?: string;
  lastDbMaterialSyncTimestamp?: string;
}

const DEFAULT_CONFIG: ServerSyncConfig = {
  webhookUrl: '',
  sheetName: 'Sheet1',
  dbMaterialSheetName: 'DB_MATERIAL',
  autoSync: true,
  lastSyncTimestamp: new Date().toLocaleString('id-ID'),
  lastDbMaterialSyncTimestamp: new Date().toLocaleString('id-ID')
};

function readSyncConfig(): ServerSyncConfig {
  try {
    if (fs.existsSync(SYNC_CONFIG_FILE)) {
      const raw = fs.readFileSync(SYNC_CONFIG_FILE, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('[SERVER] Failed reading sync-config.json', err);
  }
  return { ...DEFAULT_CONFIG };
}

function writeSyncConfig(config: Partial<ServerSyncConfig>): ServerSyncConfig {
  const current = readSyncConfig();
  const merged: ServerSyncConfig = {
    ...current,
    ...config,
    autoSync: config.autoSync !== undefined ? config.autoSync : true
  };
  try {
    fs.writeFileSync(SYNC_CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf-8');
  } catch (err) {
    console.error('[SERVER] Failed writing sync-config.json', err);
  }
  return merged;
}

// Convert row array to CSV line
function rowToCsvLine(row: (string | number)[]): string {
  return row
    .map(val => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
    .join(',');
}

async function forwardToGoogleAppsScript(webhookUrl: string, payload: any): Promise<{ success: boolean; message: string; data?: any }> {
  if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
    return {
      success: true,
      message: 'Tersimpan otomatis ke database server MARVEL (Mirror Spreadsheet Aktif).'
    };
  }

  try {
    const res = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      // non-json response
    }

    if (res.ok) {
      return {
        success: true,
        message: (json && json.message) || 'Data berhasil dikirim ke Google Spreadsheet.',
        data: json
      };
    } else {
      return {
        success: false,
        message: `Google Apps Script returned HTTP ${res.status}: ${text.slice(0, 150)}`
      };
    }
  } catch (err: any) {
    console.error('[SERVER] Error forwarding to Google Apps Script:', err.message);
    return {
      success: false,
      message: `Gagal meneruskan ke Google Sheets: ${err?.message || 'Koneksi terputus'}. Data tetap aman di server.`
    };
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize config file if missing
  if (!fs.existsSync(SYNC_CONFIG_FILE)) {
    writeSyncConfig(DEFAULT_CONFIG);
  }

  // API Routes
  // 1. Get Sync Config
  app.get('/api/sync-config', (req, res) => {
    const config = readSyncConfig();
    res.json({
      success: true,
      config,
      serverTime: new Date().toISOString()
    });
  });

  // 2. Save Sync Config
  app.post('/api/sync-config', (req, res) => {
    const newConfig = req.body;
    const saved = writeSyncConfig(newConfig);
    console.log('[SERVER] Sync config updated:', saved.webhookUrl ? 'Webhook configured' : 'Local mirror only');
    res.json({
      success: true,
      message: 'Konfigurasi sinkronisasi spreadsheet berhasil disimpan permanen di server.',
      config: saved
    });
  });

  // 3. Append Row(s) to Sheet 1 (Mutasi Transaksi)
  app.post('/api/spreadsheet/append', async (req, res) => {
    try {
      const { row, rows, sheetName, transaction } = req.body;
      const config = readSyncConfig();
      const targetSheet = sheetName || config.sheetName || 'Sheet1';
      const rowsToAppend: (string | number)[][] = rows || (row ? [row] : []);

      if (rowsToAppend.length === 0) {
        return res.status(400).json({ success: false, message: 'Tidak ada baris data untuk dikirim.' });
      }

      // Append to server-side CSV mirror
      try {
        const csvLines = rowsToAppend.map(r => rowToCsvLine(r)).join('\n') + '\n';
        if (!fs.existsSync(SHEET1_CSV_FILE)) {
          const header = 'No. Surat Jalan,Tanggal,Adm Material,Jabatan,Nama Petugas,Regu Yandal,No GANGGUAN DAN PEMELIHARAAN (APKT/PK Teknik/IDpel ggn),NORMALISASI,Nama Material,Jumlah,Pemberi Material,Security\n';
          fs.writeFileSync(SHEET1_CSV_FILE, header + csvLines, 'utf-8');
        } else {
          fs.appendFileSync(SHEET1_CSV_FILE, csvLines, 'utf-8');
        }
      } catch (mirrorErr) {
        console.error('[SERVER] Failed updating Sheet1 CSV mirror', mirrorErr);
      }

      // Forward to Google Apps Script if webhookUrl configured
      let webhookResult = { success: true, message: 'Tersimpan di server spreadsheet mirror' };
      if (config.webhookUrl) {
        for (const r of rowsToAppend) {
          const payload = {
            action: 'appendRow',
            sheetName: targetSheet,
            row: r,
            transaction
          };
          webhookResult = await forwardToGoogleAppsScript(config.webhookUrl, payload);
        }
      }

      const nowStr = new Date().toLocaleString('id-ID');
      writeSyncConfig({ lastSyncTimestamp: nowStr });

      res.json({
        success: true,
        message: config.webhookUrl
          ? 'Data berhasil disinkronkan langsung ke Google Spreadsheet!'
          : 'Data tersinkron otomatis ke Server Spreadsheet Mirror.',
        details: webhookResult,
        lastSyncTimestamp: nowStr
      });
    } catch (err: any) {
      console.error('[SERVER] /api/spreadsheet/append error:', err);
      res.status(500).json({ success: false, message: err?.message || 'Internal server error' });
    }
  });

  // 4. Sync Material Catalog & Ready Stock to Sheet "DB_MATERIAL"
  app.post('/api/spreadsheet/sync-materials', async (req, res) => {
    try {
      const { rows, headers, sheetName } = req.body;
      const config = readSyncConfig();
      const targetSheet = sheetName || config.dbMaterialSheetName || 'DB_MATERIAL';
      const rowsToSync: (string | number)[][] = rows || [];

      // Save to server CSV mirror
      try {
        const headerLine = (headers && headers.length > 0)
          ? headers.join(',') + '\n'
          : 'NORMALISASI,Nama Material,Satuan,Stock Siap,Kategori,Lokasi Rak\n';
        const bodyLines = rowsToSync.map(r => rowToCsvLine(r)).join('\n') + '\n';
        fs.writeFileSync(DB_MATERIAL_CSV_FILE, headerLine + bodyLines, 'utf-8');
      } catch (mirrorErr) {
        console.error('[SERVER] Failed updating DB_MATERIAL CSV mirror', mirrorErr);
      }

      let webhookResult = { success: true, message: 'Tersimpan di DB_MATERIAL mirror' };
      if (config.webhookUrl) {
        const payload = {
          action: 'syncDbMaterial',
          sheetName: targetSheet,
          headers: headers || ['NORMALISASI', 'Nama Material', 'Satuan', 'Stock Siap', 'Kategori', 'Lokasi Rak'],
          rows: rowsToSync
        };
        webhookResult = await forwardToGoogleAppsScript(config.webhookUrl, payload);
      }

      const nowStr = new Date().toLocaleString('id-ID');
      writeSyncConfig({ lastDbMaterialSyncTimestamp: nowStr });

      res.json({
        success: true,
        count: rowsToSync.length,
        message: config.webhookUrl
          ? `Seluruh ${rowsToSync.length} data material & saldo berhasil disinkronkan ke Sheet "${targetSheet}"!`
          : `Seluruh ${rowsToSync.length} data material tersimpan di DB_MATERIAL mirror.`,
        details: webhookResult,
        lastDbMaterialSyncTimestamp: nowStr
      });
    } catch (err: any) {
      console.error('[SERVER] /api/spreadsheet/sync-materials error:', err);
      res.status(500).json({ success: false, message: err?.message || 'Internal server error' });
    }
  });

  // 5. Bulk Sync All Transactions (Reconciliation)
  app.post('/api/spreadsheet/sync-all', async (req, res) => {
    try {
      const { rows, headers, sheetName } = req.body;
      const config = readSyncConfig();
      const targetSheet = sheetName || config.sheetName || 'Sheet1';
      const allRows: (string | number)[][] = rows || [];

      // Overwrite server CSV mirror
      try {
        const headerLine = (headers && headers.length > 0)
          ? headers.join(',') + '\n'
          : 'No. Surat Jalan,Tanggal,Adm Material,Jabatan,Nama Petugas,Regu Yandal,No GANGGUAN DAN PEMELIHARAAN (APKT/PK Teknik/IDpel ggn),NORMALISASI,Nama Material,Jumlah,Pemberi Material,Security\n';
        const bodyLines = allRows.map(r => rowToCsvLine(r)).join('\n') + '\n';
        fs.writeFileSync(SHEET1_CSV_FILE, headerLine + bodyLines, 'utf-8');
      } catch (mirrorErr) {
        console.error('[SERVER] Failed updating Sheet1 CSV mirror in sync-all', mirrorErr);
      }

      let webhookResult = { success: true, message: 'Tersimpan di Sheet1 mirror' };
      if (config.webhookUrl) {
        const payload = {
          action: 'syncAllRows',
          sheetName: targetSheet,
          headers: headers || [
            'No. Surat Jalan', 'Tanggal', 'Adm Material', 'Jabatan', 'Nama Petugas', 'Regu Yandal',
            'No GANGGUAN DAN PEMELIHARAAN (APKT/PK Teknik/IDpel ggn)', 'NORMALISASI', 'Nama Material',
            'Jumlah', 'Pemberi Material', 'Security'
          ],
          rows: allRows
        };
        webhookResult = await forwardToGoogleAppsScript(config.webhookUrl, payload);
      }

      const nowStr = new Date().toLocaleString('id-ID');
      writeSyncConfig({ lastSyncTimestamp: nowStr });

      res.json({
        success: true,
        count: allRows.length,
        message: config.webhookUrl
          ? `Seluruh ${allRows.length} data mutasi berhasil disinkronkan ke Google Spreadsheet!`
          : `Seluruh ${allRows.length} data mutasi tersimpan di server spreadsheet mirror.`,
        details: webhookResult,
        lastSyncTimestamp: nowStr
      });
    } catch (err: any) {
      console.error('[SERVER] /api/spreadsheet/sync-all error:', err);
      res.status(500).json({ success: false, message: err?.message || 'Internal server error' });
    }
  });

  // 6. Pull Live Data from Google Sheets
  app.get('/api/spreadsheet/pull', async (req, res) => {
    try {
      const config = readSyncConfig();
      const targetUrl = (req.query.url as string) || config.webhookUrl;
      const targetSheet = (req.query.sheet as string) || (req.query.action === 'getDbMaterial' ? config.dbMaterialSheetName : config.sheetName);

      if (!targetUrl) {
        return res.status(400).json({
          success: false,
          message: 'URL Google Spreadsheet atau Webhook belum dikonfigurasi di server.'
        });
      }

      let fetchUrl = targetUrl;
      if (targetUrl.includes('/macros/s/')) {
        const u = new URL(targetUrl);
        if (req.query.action) u.searchParams.set('action', String(req.query.action));
        if (targetSheet) u.searchParams.set('sheet', targetSheet);
        fetchUrl = u.toString();
      }

      const response = await fetch(fetchUrl);
      const text = await response.text();
      let parsedJson: any = null;
      try {
        parsedJson = JSON.parse(text);
      } catch {
        // text/csv fallback
      }

      res.json({
        success: true,
        data: parsedJson ? parsedJson.data : text,
        raw: !parsedJson ? text : undefined
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Failed fetching from spreadsheet' });
    }
  });

  // 7. Download Server-Side Spreadsheet Mirror
  app.get('/api/spreadsheet/mirror/:type', (req, res) => {
    const type = req.params.type;
    const file = type === 'db_material' ? DB_MATERIAL_CSV_FILE : SHEET1_CSV_FILE;
    const filename = type === 'db_material' ? 'MARVEL_DB_MATERIAL_MIRROR.csv' : 'MARVEL_WAREHOUSE_SHEET1_MIRROR.csv';

    if (fs.existsSync(file)) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.sendFile(file);
    } else {
      res.status(404).json({ success: false, message: 'Mirror file belum dibuat.' });
    }
  });

  // 8. Server-Side Warehouse Data Persistence
  app.get('/api/warehouse/data', (req, res) => {
    try {
      if (fs.existsSync(WAREHOUSE_DATA_FILE)) {
        const raw = fs.readFileSync(WAREHOUSE_DATA_FILE, 'utf-8');
        return res.json({ success: true, data: JSON.parse(raw) });
      }
      res.json({ success: false, data: null });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message });
    }
  });

  app.post('/api/warehouse/data', (req, res) => {
    try {
      const { materials, transactions } = req.body;
      const data = {
        materials,
        transactions,
        savedAt: new Date().toISOString()
      };
      fs.writeFileSync(WAREHOUSE_DATA_FILE, JSON.stringify(data), 'utf-8');
      res.json({ success: true, message: 'Warehouse data persisted on server' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true'
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MARVEL SERVER] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[MARVEL SERVER] Failed to start:', err);
});
