import { WarehouseTransaction } from '../types/warehouse';
import spreadsheetData from './spreadsheetTransactions.json';

/**
 * All 740 transactions synchronized directly from Google Spreadsheet Sheet 1:
 * "Pengambilan Material Fast Moving (Jawaban)"
 * Includes cell B (Tanggal), cell BP (Security), cell CL (Pemberi Material), and all 90 columns.
 */
export const INITIAL_TRANSACTIONS: WarehouseTransaction[] = spreadsheetData as WarehouseTransaction[];
