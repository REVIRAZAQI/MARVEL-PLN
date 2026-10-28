import React, { useState, useMemo } from 'react';
import { MaterialItem, MaterialCategory, WarehouseTransaction, SuratJalanData } from '../types/warehouse';
import { createSuratJalanFromMaterials, createSuratJalanFromTransaction } from '../utils/suratJalanHelper';
import { SuratJalanModal } from './SuratJalanModal';
import {
  Search,
  FileText,
  ArrowUpDown,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Printer,
  X,
  RefreshCw,
  ZoomIn,
  Maximize2,
  MapPin,
  ExternalLink,
  Layers,
  Table as TableIcon,
  ChevronRight,
  Info
} from 'lucide-react';

interface StockTableProps {
  materials: MaterialItem[];
  transactions?: WarehouseTransaction[];
  selectedCategory?: string;
  selectedStatus?: 'all' | 'safe' | 'warning' | 'critical';
  onViewStockCard: (materialId: string) => void;
  onQuickRestock: (material: MaterialItem) => void;
}

// Visual E-Catalog Item Interface
interface CatalogItemDef {
  id: string;
  itemNumber: string;
  name: string;
  locationText: string;
  ambalanCode: string;
  fullSpec?: string;
  samplePhoto?: string;
  category: string;
  defaultQty?: number;
}

// Visual E-Catalog Rack Interface
interface CatalogRackDef {
  id: 'RAK_A' | 'RAK_B' | 'RAK_C' | 'LEMARI_MCB';
  key: string;
  tabLabel: string;
  subtitle: string;
  headerTitle: string;
  headerRefTag: string;
  imageVisual: string;
  imageFallback: string;
  items: CatalogItemDef[];
}

const CATALOG_RACKS: CatalogRackDef[] = [
  {
    id: 'RAK_A',
    key: 'A',
    tabLabel: 'RAK A',
    subtitle: 'Meter & segel',
    headerTitle: 'Material Rak A',
    headerRefTag: 'RAK A - ULP TANGGUL',
    imageVisual: '/assets/aistudio/RAK_A_6a8672c8.webp',
    imageFallback: '/assets/aistudio/KATALOG1_b9049ebe.JPG',
    items: [
      {
        id: 'A1',
        itemNumber: '01',
        name: 'Meter Prabayar GAMET',
        locationText: 'Rak A · Kode ambalan A11',
        ambalanCode: 'A11',
        fullSpec: 'MTR;KWH E-PR;;1P;230V;5-60A;1; ;2W (Gamet / Hexing)',
        category: 'KWH & MCB'
      },
      {
        id: 'A2',
        itemNumber: '02',
        name: 'Meter Pascabayar GAMET',
        locationText: 'Rak A · Kode ambalan A21',
        ambalanCode: 'A21',
        fullSpec: 'MTR;KWH ECOM;;1P; 230V;5-40A MINMCB;1; (Gamet Elektromekanik)',
        category: 'KWH & MCB'
      },
      {
        id: 'A3',
        itemNumber: '03',
        name: 'Segel HAR',
        locationText: 'Rak A · Kode ambalan A31',
        ambalanCode: 'A31',
        fullSpec: 'MTR ACC;SEGEL PUTAR PLASTIC (HAR) - Hijau / Oranye',
        category: 'Konstruksi & Isolasi'
      },
      {
        id: 'A4',
        itemNumber: '04',
        name: 'Segel Gangguan',
        locationText: 'Rak A · Kode ambalan A12',
        ambalanCode: 'A12',
        fullSpec: 'SEGEL PLASTIK GANGGUAN MERAH / KUNING',
        category: 'Konstruksi & Isolasi'
      }
    ]
  },
  {
    id: 'RAK_B',
    key: 'B',
    tabLabel: 'RAK B',
    subtitle: 'Meter listrik',
    headerTitle: 'Material Rak B',
    headerRefTag: 'RAK B - ULP TANGGUL',
    imageVisual: '/assets/aistudio/RAK_B_4d89d0d7.webp',
    imageFallback: '/assets/aistudio/KATALOG2_869067a4.JPG',
    items: [
      {
        id: 'B1',
        itemNumber: '01',
        name: 'Meter Prabayar',
        locationText: 'Rak B · Kode ambalan B11',
        ambalanCode: 'B11',
        fullSpec: 'MTR;KWH E-PR;;1P;230V;5-60A;1;;2W (Itron / Actaris)',
        category: 'KWH & MCB'
      },
      {
        id: 'B2',
        itemNumber: '02',
        name: 'Meter Prabayar',
        locationText: 'Rak B · Kode ambalan B21',
        ambalanCode: 'B21',
        fullSpec: 'MTR;KWH E-PR;;1P;230V;5-60A;1;;2W (Hexing HDE110)',
        category: 'KWH & MCB'
      },
      {
        id: 'B3',
        itemNumber: '03',
        name: 'Meter Pascabayar',
        locationText: 'Rak B · Kode ambalan B31',
        ambalanCode: 'B31',
        fullSpec: 'MTR;KWH ECOM;;1P; 230V;5-40A MINMCB;1; (Pascabayar Melcoinda)',
        category: 'KWH & MCB'
      },
      {
        id: 'B4',
        itemNumber: '04',
        name: 'Meter Dummy Pesta',
        locationText: 'Rak B · Kode ambalan B12',
        ambalanCode: 'B12',
        fullSpec: 'KWH METER DUMMY / PESTA SEMENTARA (PORTABLE KOPER)',
        category: 'KWH & MCB'
      }
    ]
  },
  {
    id: 'RAK_C',
    key: 'C',
    tabLabel: 'RAK C',
    subtitle: 'Segel & konektor',
    headerTitle: 'Material Rak C',
    headerRefTag: 'RAK C - ULP TANGGUL',
    imageVisual: '/assets/aistudio/RAK_C_834d79e2.webp',
    imageFallback: '/assets/aistudio/KATALOG3_5be50826.JPG',
    items: [
      {
        id: 'C1',
        itemNumber: '01',
        name: 'Segel PB PD',
        locationText: 'Rak C · Kode ambalan C11',
        ambalanCode: 'C11',
        fullSpec: 'SEGEL PLASTIK PB / PD ULP TANGGUL (Transparan & Putar)',
        category: 'Konstruksi & Isolasi'
      },
      {
        id: 'C2',
        itemNumber: '02',
        name: 'Segel PB PD',
        locationText: 'Rak C · Kode ambalan C21',
        ambalanCode: 'C21',
        fullSpec: 'SEGEL LOGAM / TIMAH PB PD DENGAN KAWAT SPIRAL',
        category: 'Konstruksi & Isolasi'
      },
      {
        id: 'C3',
        itemNumber: '03',
        name: 'Fuse Link',
        locationText: 'Rak C · Kode ambalan C31',
        ambalanCode: 'C31',
        fullSpec: 'CUT OUT ACC;FUSE LINK 20kV (K, T Type 2A - 15A)',
        category: 'Fuse Link'
      },
      {
        id: 'C4',
        itemNumber: '04',
        name: 'Connector Press',
        locationText: 'Rak C · Kode ambalan C12',
        ambalanCode: 'C12',
        fullSpec: 'CONN;0.6/1kV;H;AL; mm2;PRS (Tipe H / CCO Press)',
        category: 'Konektor & Jointing'
      },
      {
        id: 'C5',
        itemNumber: '05',
        name: 'Connector Press',
        locationText: 'Rak C · Kode ambalan C22',
        ambalanCode: 'C22',
        fullSpec: 'CONN;0.6/1kV;H;AL; mm2;PRS UKURAN SEDANG (AL-CU)',
        category: 'Konektor & Jointing'
      },
      {
        id: 'C6',
        itemNumber: '06',
        name: 'NH Fuse',
        locationText: 'Rak C · Kode ambalan C32',
        ambalanCode: 'C32',
        fullSpec: 'FUSE;380/220V;A;SQUARE;1 (GNE NT1 gl 125A / 160A)',
        category: 'NH Fuse & Holder'
      }
    ]
  },
  {
    id: 'LEMARI_MCB',
    key: 'MCB',
    tabLabel: 'LEMARI MCB',
    subtitle: 'Miniature circuit breaker',
    headerTitle: 'Material Lemari MCB',
    headerRefTag: 'LEMARI MCB - ULP TANGGUL',
    imageVisual: '/assets/aistudio/RAK_D_17923564.webp',
    imageFallback: '/assets/aistudio/KATALOG4_4a7d1e8b.JPG',
    items: [
      {
        id: 'M1',
        itemNumber: '01',
        name: 'MCB 2A, MCB 4A',
        locationText: 'Lemari MCB · Kode ambalan M1',
        ambalanCode: 'M1',
        fullSpec: 'MCB;230/400V;1P;2A & 4A; 50Hz;MIN BOX (450VA & 900VA)',
        category: 'KWH & MCB'
      },
      {
        id: 'M2',
        itemNumber: '02',
        name: 'MCB 6A, MCB 10A',
        locationText: 'Lemari MCB · Kode ambalan M2',
        ambalanCode: 'M2',
        fullSpec: 'MCB;230/400V;1P;6A & 10A; 50Hz;MIN BOX (1300VA & 2200VA)',
        category: 'KWH & MCB'
      },
      {
        id: 'M3',
        itemNumber: '03',
        name: 'MCB 16A, MCB 20A',
        locationText: 'Lemari MCB · Kode ambalan M3',
        ambalanCode: 'M3',
        fullSpec: 'MCB;230/400V;1P;16A & 20A; 50Hz;MIN BOX (3500VA & 4400VA)',
        category: 'KWH & MCB'
      },
      {
        id: 'M4',
        itemNumber: '04',
        name: 'MCB 25A, MCB 35A',
        locationText: 'Lemari MCB · Kode ambalan M4',
        ambalanCode: 'M4',
        fullSpec: 'MCB;230/400V;1P;25A & 35A; 50Hz;MIN BOX (5500VA & 7700VA)',
        category: 'KWH & MCB'
      },
      {
        id: 'M5',
        itemNumber: '05',
        name: 'MCB 2A, MCB 4A, MCB 6A',
        locationText: 'Lemari MCB · Kode ambalan M5',
        ambalanCode: 'M5',
        fullSpec: 'MCB 1P RETUR / TOLAKAN 2A - 6A (Area Uji Karantina)',
        category: 'KWH & MCB'
      },
      {
        id: 'M6',
        itemNumber: '06',
        name: 'MCB 10A, MCB 16A, MCB 20A',
        locationText: 'Lemari MCB · Kode ambalan M6',
        ambalanCode: 'M6',
        fullSpec: 'MCB 1P RETUR / TOLAKAN 10A - 20A (Area Uji Karantina)',
        category: 'KWH & MCB'
      },
      {
        id: 'M7',
        itemNumber: '07',
        name: 'MCB 25A, MCB 35A, MCB 50A',
        locationText: 'Lemari MCB · Kode ambalan M7',
        ambalanCode: 'M7',
        fullSpec: 'MCB 1P & 3P RETUR / TOLAKAN 25A - 50A (Area Uji Karantina)',
        category: 'KWH & MCB'
      }
    ]
  }
];

export const StockTable: React.FC<StockTableProps> = ({
  materials,
  transactions = [],
  selectedCategory: initialCategory,
  selectedStatus: initialStatus,
  onViewStockCard,
  onQuickRestock
}) => {
  // Mode toggle: 'visual' (Default matching mockups) or 'table' (Detailed Inventory Matrix)
  const [catalogMode, setCatalogMode] = useState<'visual' | 'table'>('visual');

  // Selected Rack Tab for Visual Mode (defaults to RAK_A)
  const [selectedRackId, setSelectedRackId] = useState<'RAK_A' | 'RAK_B' | 'RAK_C' | 'LEMARI_MCB'>('RAK_A');

  // Selected item inside Visual Mode (for detail peek)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Zoom Image Modal
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Search input for Visual Mode and Table Mode
  const [searchQuery, setSearchQuery] = useState('');

  // Table Mode Filters
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory || 'Semua');
  const [statusFilter, setStatusFilter] = useState<'all' | 'safe' | 'warning' | 'critical'>(initialStatus || 'all');
  const [sortField, setSortField] = useState<'name' | 'currentStock' | 'totalOut'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterMaterialId, setFilterMaterialId] = useState<string>('all');

  // Surat Jalan Modal State
  const [isSuratJalanOpen, setIsSuratJalanOpen] = useState(false);
  const [activeSuratJalan, setActiveSuratJalan] = useState<SuratJalanData | null>(null);

  const categories: (MaterialCategory | 'Semua')[] = [
    'Semua',
    'Konektor & Jointing',
    'Sepatu Kabel',
    'Fuse Link',
    'NH Fuse & Holder',
    'Konstruksi & Isolasi',
    'Kabel & SR',
    'KWH & MCB'
  ];

  // Current active rack in visual mode
  const currentRack = useMemo(() => {
    return CATALOG_RACKS.find(r => r.id === selectedRackId) || CATALOG_RACKS[0];
  }, [selectedRackId]);

  // Filtered items in visual mode based on search
  const currentDisplayItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return currentRack.items;
    }
    const q = searchQuery.toLowerCase().trim();
    // Search within current rack or across all racks if matching
    const inCurrent = currentRack.items.filter(
      item =>
        item.name.toLowerCase().includes(q) ||
        item.ambalanCode.toLowerCase().includes(q) ||
        item.locationText.toLowerCase().includes(q) ||
        (item.fullSpec && item.fullSpec.toLowerCase().includes(q))
    );

    if (inCurrent.length > 0) return inCurrent;

    // If no match in current rack, look across all racks
    for (const r of CATALOG_RACKS) {
      const match = r.items.filter(
        item =>
          item.name.toLowerCase().includes(q) ||
          item.ambalanCode.toLowerCase().includes(q) ||
          item.locationText.toLowerCase().includes(q)
      );
      if (match.length > 0) {
        // Automatically switch rack to the match!
        setSelectedRackId(r.id);
        return match;
      }
    }

    return [];
  }, [currentRack, searchQuery]);

  // Find linked material in the MARVEL database for selected visual item
  const selectedItemLinkedMaterial = useMemo(() => {
    if (!selectedItemId) return null;
    const currentItem = currentRack.items.find(i => i.id === selectedItemId);
    if (!currentItem) return null;

    // Find best match in materials array
    const qName = currentItem.name.toLowerCase();
    const qAmbalan = currentItem.ambalanCode.toLowerCase();

    return (
      materials.find(
        m =>
          m.rackLocation.toLowerCase().includes(qAmbalan) ||
          m.name.toLowerCase().includes(qName) ||
          qName.includes(m.name.toLowerCase())
      ) || null
    );
  }, [selectedItemId, currentRack, materials]);

  // Helper to format date string to DD/MM/YYYY
  const targetDateFormatted = useMemo(() => {
    if (!filterDate) return '';
    const parts = filterDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return filterDate;
  }, [filterDate]);

  // Aggregate mutations by date
  const dateMutations = useMemo(() => {
    if (!targetDateFormatted) return null;

    const outMap: Record<string, number> = {};
    const inMap: Record<string, number> = {};
    let totalKeluar = 0;
    let totalMasuk = 0;
    let txCount = 0;

    const matchingTxs = transactions.filter(tx => {
      const matchDate = tx.tanggal === targetDateFormatted || tx.timestamp?.includes(targetDateFormatted);
      return matchDate && tx.status !== 'Rejected';
    });

    for (const tx of matchingTxs) {
      txCount++;
      for (const item of tx.items) {
        const qty = Number(item.quantity) || 0;
        if (tx.admMaterial === 'Masuk') {
          inMap[item.materialId] = (inMap[item.materialId] || 0) + qty;
          totalMasuk += qty;
        } else {
          outMap[item.materialId] = (outMap[item.materialId] || 0) + qty;
          totalKeluar += qty;
        }
      }
    }

    return { outMap, inMap, totalKeluar, totalMasuk, txCount, matchingTxs };
  }, [targetDateFormatted, transactions]);

  const filteredMaterials = useMemo(() => {
    return materials
      .filter(m => {
        if (filterMaterialId !== 'all' && m.id !== filterMaterialId) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = m.name.toLowerCase().includes(q);
          const matchCode = m.code.toLowerCase().includes(q);
          const matchRack = m.rackLocation.toLowerCase().includes(q);
          if (!matchName && !matchCode && !matchRack) return false;
        }

        if (activeCategory !== 'Semua' && m.category !== activeCategory) {
          return false;
        }

        if (statusFilter === 'critical') return m.currentStock <= 0;
        if (statusFilter === 'warning') return m.currentStock > 0 && m.currentStock <= m.minSafetyStock;
        if (statusFilter === 'safe') return m.currentStock > m.minSafetyStock;

        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === 'string') {
          return sortOrder === 'asc'
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        }

        return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [materials, searchQuery, activeCategory, statusFilter, sortField, sortOrder, filterMaterialId]);

  const toggleSort = (field: 'name' | 'currentStock' | 'totalOut') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleOpenGeneralSuratJalan = () => {
    if (dateMutations && dateMutations.matchingTxs.length > 0) {
      const approvedTx = dateMutations.matchingTxs.find(t => t.status === 'Approved') || dateMutations.matchingTxs[0];
      const sj = createSuratJalanFromTransaction(approvedTx);
      setActiveSuratJalan(sj);
    } else if (filterMaterialId !== 'all') {
      const selectedMat = materials.find(m => m.id === filterMaterialId);
      if (selectedMat) {
        const sj = createSuratJalanFromMaterials([{ material: selectedMat, quantity: 5 }]);
        setActiveSuratJalan(sj);
      }
    } else {
      const sampleMaterials = materials.slice(0, 10).map((m, i) => ({
        material: m,
        quantity: i % 2 === 0 ? (i + 1) * 2 : 0
      }));
      const sj = createSuratJalanFromMaterials(sampleMaterials);
      setActiveSuratJalan(sj);
    }
    setIsSuratJalanOpen(true);
  };

  const handleOpenRowSuratJalan = (mat: MaterialItem) => {
    const sj = createSuratJalanFromMaterials([
      { material: mat, quantity: Math.min(10, Math.max(1, mat.currentStock)) }
    ], {
      peruntukan: `Pengambilan Material ${mat.name} ULP Tanggul`
    });
    setActiveSuratJalan(sj);
    setIsSuratJalanOpen(true);
  };

  const handleSetToday = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setFilterDate(`${yyyy}-${mm}-${dd}`);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. TOP HEADER BAR: ULP TANGGUL - KATALOG GUDANG */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-sky-600 tracking-wider uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-300" />
            <span>• KATALOG GUDANG</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0B2545] tracking-tight">
            E-Catalog Material
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Temukan material berdasarkan rak, kode ambalan, atau nama barang.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-2xl sm:text-3xl font-black text-blue-700 tracking-widest font-mono select-none">
            A • B • C • MCB
          </div>

          {/* Mode Switcher: Visual Catalog vs Table */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setCatalogMode('visual')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                catalogMode === 'visual'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Visual E-Catalog Rak & Infografis Gudang"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Katalog Visual</span>
            </button>
            <button
              type="button"
              onClick={() => setCatalogMode('table')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                catalogMode === 'table'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Tabel Stok Fisik, Restock & Surat Jalan"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabel Stok</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODE 1: VISUAL E-CATALOG TEMPLATE (MATCHING EXACT MOCKUP) */}
      {/* ======================================================== */}
      {catalogMode === 'visual' && (
        <div className="space-y-4">
          {/* 2. SEARCH BAR & MATERIAL COUNTER */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl px-4 py-3 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari kode rak atau nama material..."
                className="w-full text-xs sm:text-sm bg-transparent border-none text-slate-900 placeholder-slate-400 font-medium focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Hapus pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="px-3 py-1 bg-slate-100 text-slate-700 font-bold font-mono text-xs rounded-xl shrink-0 border border-slate-200/70">
              {currentDisplayItems.length} material
            </div>
          </div>

          {/* 3. 4 TOP RAK SELECTOR CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {CATALOG_RACKS.map(rack => {
              const isActive = selectedRackId === rack.id;
              return (
                <button
                  key={rack.id}
                  type="button"
                  onClick={() => {
                    setSelectedRackId(rack.id);
                    setSelectedItemId(null);
                  }}
                  className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-lg shadow-blue-500/25 scale-[1.01]'
                      : 'bg-white/90 hover:bg-white text-slate-800 border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className={`font-black text-sm tracking-wide ${isActive ? 'text-white' : 'text-slate-900'}`}>
                        {rack.tabLabel}
                      </div>
                      <div className={`text-[11px] font-medium mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                        {rack.subtitle}
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 font-mono ${
                        isActive
                          ? 'bg-white/20 text-white backdrop-blur-xs'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {rack.items.length}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 4. TWO-COLUMN SPLIT: DAFTAR BARANG (LEFT) & REFERENSI VISUAL (RIGHT) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT COLUMN: DAFTAR BARANG (~38% width -> lg:col-span-5) */}
            <div className="lg:col-span-5 bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
              {/* Header */}
              <div className="space-y-1 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-600 tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>• DAFTAR BARANG</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <h2 className="text-lg font-black text-[#0B2545] tracking-tight">
                    {currentRack.headerTitle}
                  </h2>
                  <span className="text-xs font-bold font-mono text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/60">
                    {currentDisplayItems.length} item
                  </span>
                </div>
              </div>

              {/* Numbered Item Cards */}
              <div className="space-y-2.5">
                {currentDisplayItems.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada material yang cocok dengan pencarian di rak ini.
                  </div>
                ) : (
                  currentDisplayItems.map(item => {
                    const isSelected = selectedItemId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItemId(item.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-blue-50/90 border-blue-400 shadow-xs'
                            : 'bg-white hover:bg-slate-50/90 border-slate-200/80 shadow-2xs hover:border-slate-300'
                        }`}
                        title="Klik untuk melihat spesifikasi fisik & cek stok"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Circle Number: 01, 02... */}
                          <div className="w-8 h-8 rounded-xl bg-blue-50/80 border border-blue-200/70 text-blue-800 font-black font-mono text-xs flex items-center justify-center shrink-0">
                            {item.itemNumber}
                          </div>

                          {/* Material Details */}
                          <div className="min-w-0">
                            <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                              {item.locationText}
                            </div>
                          </div>
                        </div>

                        {/* Ambalan Badge */}
                        <div className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/70 font-mono font-bold text-xs shrink-0">
                          {item.ambalanCode}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Warehouse Guide Note */}
              <div className="mt-4 p-3 bg-slate-50/90 rounded-2xl border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-slate-800">Petunjuk lokasi gudang:</strong> Kode ambalan pada daftar menunjukkan posisi penyimpanan material pada denah gudang indoor.
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: REFERENSI VISUAL (~62% width -> lg:col-span-7) */}
            <div className="lg:col-span-7 bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-600 tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>• REFERENSI VISUAL</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    {currentRack.headerRefTag}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsImageModalOpen(true)}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Perbesar gambar infografis"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Infographic Visual Card */}
              <div
                onClick={() => setIsImageModalOpen(true)}
                className="relative group rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs cursor-zoom-in bg-slate-950/5 transition-all hover:shadow-md"
              >
                <img
                  src={currentRack.imageVisual}
                  alt={currentRack.headerTitle}
                  className="w-full h-auto object-contain max-h-[580px] mx-auto rounded-2xl group-hover:scale-[1.01] transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="px-4 py-2 bg-slate-900/90 backdrop-blur-sm text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-2">
                    <ZoomIn className="w-4 h-4 text-cyan-400" />
                    <span>Klik untuk Perbesar Gambar Infografis</span>
                  </span>
                </div>
              </div>

              {/* Caption */}
              <div className="text-center text-xs text-slate-400 font-medium">
                Pilih gambar untuk melihat lebih jelas
              </div>
            </div>
          </div>

          {/* Quick Peek Drawer / Modal for Selected Item */}
          {selectedItemId && (
            <div className="bg-blue-50/95 border-2 border-blue-200/90 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
              {(() => {
                const item = currentRack.items.find(i => i.id === selectedItemId);
                if (!item) return null;
                return (
                  <>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs">
                          {item.ambalanCode}
                        </span>
                        <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                          {currentRack.tabLabel} · DETAIL PENYIMPANAN
                        </span>
                      </div>
                      <h4 className="text-base sm:text-lg font-black text-slate-900">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-600 font-medium">
                        Spesifikasi: {item.fullSpec || item.locationText}
                      </p>
                      {selectedItemLinkedMaterial && (
                        <div className="text-xs text-slate-700 flex items-center gap-3 pt-1">
                          <span>
                            Stok Saat Ini:{' '}
                            <strong className="text-slate-950 font-mono">
                              {selectedItemLinkedMaterial.currentStock} {selectedItemLinkedMaterial.unit}
                            </strong>
                          </span>
                          <span>·</span>
                          <span className="font-mono text-slate-500">
                            SKU: {selectedItemLinkedMaterial.code}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap shrink-0 self-end sm:self-auto">
                      {selectedItemLinkedMaterial && (
                        <>
                          <button
                            type="button"
                            onClick={() => onViewStockCard(selectedItemLinkedMaterial.id)}
                            className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            title="Buka Kartu Gantung Digital PLN"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Kartu Gantung</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onQuickRestock(selectedItemLinkedMaterial)}
                            className="px-3.5 py-2 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                            title="Dropping / Restock Material"
                          >
                            <PlusCircle className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Restock</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenRowSuratJalan(selectedItemLinkedMaterial)}
                            className="px-3.5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                            title="Cetak Surat Jalan Material"
                          >
                            <FileText className="w-3.5 h-3.5 text-sky-600" />
                            <span>Surat Jalan</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedItemId(null)}
                        className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-blue-100/60 transition-colors cursor-pointer"
                        title="Tutup detail"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 2: TABEL STOK FISIK LENGKAP & KARTU GANTUNG         */}
      {/* ======================================================== */}
      {catalogMode === 'table' && (
        <div className="space-y-4">
          {/* Top Filter & Search Controls */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
            {/* Row 1: Search, Filter Tanggal, Filter Material, and Cetak Surat Jalan Button */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search bar */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari nama material, kode, atau lokasi rak..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              {/* Filter Tanggal */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="relative flex items-center">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
                  <input
                    type="date"
                    value={filterDate}
                    onChange={e => setFilterDate(e.target.value)}
                    title="Filter berdasarkan tanggal mutasi"
                    className="pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                {filterDate ? (
                  <button
                    onClick={() => setFilterDate('')}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                    title="Hapus filter tanggal"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSetToday}
                    className="px-2 py-1.5 text-[11px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Hari Ini
                  </button>
                )}
              </div>

              {/* Filter Material Dropdown */}
              <div className="min-w-[200px] shrink-0">
                <select
                  value={filterMaterialId}
                  onChange={e => setFilterMaterialId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500 truncate"
                >
                  <option value="all">Semua Material ({materials.length} SKU)</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Stok: {m.currentStock} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cetak / Simpan Surat Jalan Action Button */}
              <div className="shrink-0 flex items-center gap-2">
                <button
                  onClick={handleOpenGeneralSuratJalan}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  title="Cetak atau Simpan Surat Jalan Barang (PDF)"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Surat Jalan</span>
                </button>
              </div>
            </div>

            {/* Row 2: Status Pills and Category Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              {/* Category Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs w-full sm:w-auto">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-sky-700 text-white shadow-2xs font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0 self-end sm:self-auto">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({materials.length})
                </button>
                <button
                  onClick={() => setStatusFilter('safe')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    statusFilter === 'safe'
                      ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Aman
                </button>
                <button
                  onClick={() => setStatusFilter('warning')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    statusFilter === 'warning'
                      ? 'bg-white text-amber-800 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Menipis
                </button>
                <button
                  onClick={() => setStatusFilter('critical')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    statusFilter === 'critical'
                      ? 'bg-white text-rose-800 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Habis
                </button>
              </div>
            </div>

            {/* Date Filter Active Information Banner */}
            {targetDateFormatted && dateMutations && (
              <div className="p-3 bg-sky-50/80 border border-sky-200 rounded-xl text-xs text-sky-900 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-700 shrink-0" />
                  <span>
                    Filter Tanggal Aktif: <strong className="font-mono">{targetDateFormatted}</strong> ({dateMutations.txCount} mutasi tercatat)
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="text-rose-700">
                    Keluar pada tanggal ini: <strong>{dateMutations.totalKeluar} item</strong>
                  </span>
                  <span className="text-emerald-700">
                    Masuk pada tanggal ini: <strong>{dateMutations.totalMasuk} item</strong>
                  </span>
                  <button
                    onClick={() => setFilterDate('')}
                    className="text-xs text-sky-700 hover:underline flex items-center gap-0.5 ml-2 cursor-pointer"
                  >
                    Reset Tanggal
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Main Stock Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Kode</th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-slate-900"
                      onClick={() => toggleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Nama Material</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Lokasi Rak</th>
                    <th className="py-3 px-2 text-right">Awal</th>
                    <th className="py-3 px-2 text-right text-emerald-700">Masuk</th>
                    <th
                      className="py-3 px-2 text-right text-rose-700 cursor-pointer hover:text-rose-900"
                      onClick={() => toggleSort('totalOut')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Keluar</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-2 text-right text-sky-700">Return</th>
                    <th
                      className="py-3 px-4 text-right cursor-pointer hover:text-slate-900"
                      onClick={() => toggleSort('currentStock')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Sisa Stok</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMaterials.map(mat => {
                    const isCritical = mat.currentStock <= 0;
                    const isWarning = mat.currentStock > 0 && mat.currentStock <= mat.minSafetyStock;
                    const hasDateFilter = Boolean(targetDateFormatted && dateMutations);
                    const outDate = hasDateFilter && dateMutations?.outMap[mat.id] ? dateMutations.outMap[mat.id] : null;
                    const inDate = hasDateFilter && dateMutations?.inMap[mat.id] ? dateMutations.inMap[mat.id] : null;

                    return (
                      <tr key={mat.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-500 whitespace-nowrap">
                          {mat.code}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 max-w-[280px]">
                          <div>{mat.name}</div>
                          {hasDateFilter && (outDate || inDate) && (
                            <div className="text-[10px] text-sky-700 font-mono mt-0.5">
                              {outDate ? `Keluar: ${outDate} ${mat.unit}` : ''}
                              {outDate && inDate ? ' · ' : ''}
                              {inDate ? `Masuk: ${inDate} ${mat.unit}` : ''}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          {mat.category}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                          {mat.rackLocation}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-slate-500 tabular-nums">
                          {mat.initialStock}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-emerald-700 font-medium tabular-nums">
                          +{mat.totalIn}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-rose-700 font-medium tabular-nums">
                          -{mat.totalOut}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-sky-700 font-medium tabular-nums">
                          {mat.totalReturn > 0 ? `+${mat.totalReturn}` : 0}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                            {mat.currentStock}{' '}
                            <span className="text-[11px] font-normal text-slate-500">{mat.unit}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Min: {mat.minSafetyStock}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              isCritical
                                ? 'bg-rose-100 text-rose-800'
                                : isWarning
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isCritical ? (
                              <>
                                <AlertCircle className="w-3 h-3" />
                                <span>Habis</span>
                              </>
                            ) : isWarning ? (
                              <>
                                <AlertCircle className="w-3 h-3" />
                                <span>Menipis</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Aman</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Surat Jalan Button for this material */}
                            <button
                              onClick={() => handleOpenRowSuratJalan(mat)}
                              className="px-2 py-1 text-xs font-semibold text-slate-700 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition-colors border border-slate-200 flex items-center gap-1 cursor-pointer"
                              title="Cetak Surat Jalan untuk material ini"
                            >
                              <FileText className="w-3.5 h-3.5 text-sky-600" />
                              <span className="hidden sm:inline">Surat Jalan</span>
                            </button>

                            {/* Kartu Gantung Button */}
                            <button
                              onClick={() => onViewStockCard(mat.id)}
                              className="p-1.5 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                              title="Buka Kartu Gantung Digital PLN"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>

                            {/* Quick Restock Button */}
                            <button
                              onClick={() => onQuickRestock(mat)}
                              className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Dropping / Restock Material"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. FULLSCREEN IMAGE ZOOM MODAL */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-6xl flex items-center justify-between text-white pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="font-bold text-sm sm:text-base">
                {currentRack.headerTitle} · Infografis Denah & Contoh Fisik
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={currentRack.imageVisual}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5"
                title="Buka gambar di tab baru"
              >
                <span>Buka Gambar Asli</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Tutup (Esc)"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="relative max-w-6xl max-h-[85vh] w-full overflow-auto bg-slate-900 rounded-2xl border border-slate-700 p-2 flex items-center justify-center">
            <img
              src={currentRack.imageVisual}
              alt={currentRack.headerTitle}
              className="w-auto h-auto max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* 6. SURAT JALAN MODAL */}
      <SuratJalanModal
        isOpen={isSuratJalanOpen}
        onClose={() => setIsSuratJalanOpen(false)}
        data={activeSuratJalan}
      />
    </div>
  );
};
