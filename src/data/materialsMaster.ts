import { MaterialCategory, MaterialItem } from '../types/warehouse';

export interface MaterialDefinition {
  id: string;
  code: string;
  name: string;
  normalizedName: string;
  category: MaterialCategory;
  unit: string;
  initialStock: number;
  minSafetyStock: number;
  rackLocation: string;
}

export const MASTER_MATERIALS: MaterialDefinition[] = [
  // 1. Konektor & Jointing
  {
    id: 'mat-01',
    code: 'PLN-CN-150H',
    name: 'Conn Press Al 150/150 mm Type H',
    normalizedName: 'Conn Press Al 150/150 mm Type H',
    category: 'Konektor & Jointing',
    unit: 'pcs',
    initialStock: 80,
    minSafetyStock: 15,
    rackLocation: 'Rak A-01'
  },
  {
    id: 'mat-02',
    code: 'PLN-CN-15070H',
    name: 'Conn Press Al 150/70 mm Type H',
    normalizedName: 'Conn Press Al 150/70 mm Type H',
    category: 'Konektor & Jointing',
    unit: 'pcs',
    initialStock: 75,
    minSafetyStock: 15,
    rackLocation: 'Rak A-02'
  },
  {
    id: 'mat-03',
    code: 'PLN-CN-7070C',
    name: 'Conn Press Al 70/70 mm Type C',
    normalizedName: 'Conn Press Al 70/70 mm Type C',
    category: 'Konektor & Jointing',
    unit: 'pcs',
    initialStock: 120,
    minSafetyStock: 25,
    rackLocation: 'Rak A-03'
  },
  {
    id: 'mat-04',
    code: 'PLN-CN-7035C',
    name: 'Conn Press Al 70/35 mm Type C',
    normalizedName: 'Conn Press Al 70/35 mm Type C',
    category: 'Konektor & Jointing',
    unit: 'pcs',
    initialStock: 90,
    minSafetyStock: 20,
    rackLocation: 'Rak A-04'
  },
  {
    id: 'mat-05',
    code: 'PLN-CN-5035C',
    name: 'Conn Press Al 50/35 mm Type C',
    normalizedName: 'Conn Press Al 50/35 mm Type C',
    category: 'Konektor & Jointing',
    unit: 'pcs',
    initialStock: 85,
    minSafetyStock: 20,
    rackLocation: 'Rak A-05'
  },
  {
    id: 'mat-06',
    code: 'PLN-CN-3516C',
    name: 'Conn Press Al 35/16 mm Type C',
    normalizedName: 'Conn Press Al 35/16 mm Type C',
    category: 'Konektor & Jointing',
    unit: 'pcs',
    initialStock: 100,
    minSafetyStock: 20,
    rackLocation: 'Rak A-06'
  },
  {
    id: 'mat-07',
    code: 'PLN-CN-1616C',
    name: 'Conn Press Al 16/16 mm Type C',
    normalizedName: 'Conn Press Al 16/16 mm Type C',
    category: 'Konektor & Jointing',
    unit: 'pcs',
    initialStock: 110,
    minSafetyStock: 20,
    rackLocation: 'Rak A-07'
  },
  {
    id: 'mat-08',
    code: 'PLN-CN-LT70',
    name: 'Line tap Connector Cover Scotch 70/70 mm',
    normalizedName: 'Line tap Connector Cover Scotch 70/70 mm',
    category: 'Konektor & Jointing',
    unit: 'pcs',
    initialStock: 65,
    minSafetyStock: 15,
    rackLocation: 'Rak A-08'
  },
  {
    id: 'mat-09',
    code: 'PLN-CN-70MM',
    name: 'Connector 70 mm',
    normalizedName: 'Connector 70 mm',
    category: 'Konektor & Jointing',
    unit: 'pcs',
    initialStock: 95,
    minSafetyStock: 20,
    rackLocation: 'Rak A-09'
  },
  {
    id: 'mat-10',
    code: 'PLN-JT-150T',
    name: 'Joint Al 150 mm Tension (Panjang)',
    normalizedName: 'Joint Al 150 mm Tension (Panjang)',
    category: 'Konektor & Jointing',
    unit: 'pcs',
    initialStock: 50,
    minSafetyStock: 10,
    rackLocation: 'Rak B-01'
  },
  {
    id: 'mat-11',
    code: 'PLN-JT-150NT',
    name: 'Joint Al 150 mm Non Tension (Pendek)',
    normalizedName: 'Joint Al 150 mm Non Tension (Pendek)',
    category: 'Konektor & Jointing',
    unit: 'pcs',
    initialStock: 60,
    minSafetyStock: 10,
    rackLocation: 'Rak B-02'
  },
  {
    id: 'mat-12',
    code: 'PLN-JT-150RS',
    name: 'Joint Repair Sleeve Al 150 mm',
    normalizedName: 'Joint Repair Sleeve Al 150 mm ',
    category: 'Konektor & Jointing',
    unit: 'pcs',
    initialStock: 45,
    minSafetyStock: 10,
    rackLocation: 'Rak B-03'
  },
  {
    id: 'mat-13',
    code: 'PLN-JT-70T',
    name: 'Joint Al 70 mm Tension (Panjang)',
    normalizedName: 'Joint Al 70 mm Tension (Panjang',
    category: 'Konektor & Jointing',
    unit: 'pcs',
    initialStock: 60,
    minSafetyStock: 12,
    rackLocation: 'Rak B-04'
  },
  {
    id: 'mat-14',
    code: 'PLN-JT-70NT',
    name: 'Joint Al 70 mm Non Tension (Pendek)',
    normalizedName: 'Joint Al 70 mm Non Tension (Pendek)',
    category: 'Konektor & Jointing',
    unit: 'pcs',
    initialStock: 70,
    minSafetyStock: 15,
    rackLocation: 'Rak B-05'
  },
  {
    id: 'mat-15',
    code: 'PLN-JT-70NTI',
    name: 'Joint Al 70 mm Non Tension Insulated (Pendek)',
    normalizedName: 'Joint Al 70 mm Non Tension Insulated (Pendek)',
    category: 'Konektor & Jointing',
    unit: 'pcs',
    initialStock: 55,
    minSafetyStock: 10,
    rackLocation: 'Rak B-06'
  },
  {
    id: 'mat-16',
    code: 'PLN-JT-50NT',
    name: 'Joint Al 50 mm Non Tension (Pendek)',
    normalizedName: 'Joint Al 50 mm Non Tension (Pendek)',
    category: 'Konektor & Jointing',
    unit: 'pcs',
    initialStock: 50,
    minSafetyStock: 10,
    rackLocation: 'Rak B-07'
  },
  {
    id: 'mat-17',
    code: 'PLN-JT-ALCU-7070',
    name: 'Joint Al-Cu 70/70 mm',
    normalizedName: 'Joint Al-Cu 70/70 mm',
    category: 'Konektor & Jointing',
    unit: 'pcs',
    initialStock: 65,
    minSafetyStock: 12,
    rackLocation: 'Rak B-08'
  },
  {
    id: 'mat-18',
    code: 'PLN-JT-ALCU-7050',
    name: 'Joint Al-Cu 70/50 mm',
    normalizedName: 'Joint Al-Cu 70/50 mm',
    category: 'Konektor & Jointing',
    unit: 'pcs',
    initialStock: 60,
    minSafetyStock: 12,
    rackLocation: 'Rak B-09'
  },

  // 2. Sepatu Kabel (Cable Shoe)
  {
    id: 'mat-19',
    code: 'PLN-CS-CU150-1H',
    name: 'Cable Shoe Cu ID 150 mm 1 H',
    normalizedName: 'Cable Shoe Cu ID 150 mm 1 H',
    category: 'Sepatu Kabel',
    unit: 'pcs',
    initialStock: 60,
    minSafetyStock: 15,
    rackLocation: 'Rak C-01'
  },
  {
    id: 'mat-20',
    code: 'PLN-CS-CU70-1H',
    name: 'Cable Shoe Cu ID 70 mm 1 H',
    normalizedName: 'Cable Shoe Cu ID 70 mm 1 H',
    category: 'Sepatu Kabel',
    unit: 'pcs',
    initialStock: 80,
    minSafetyStock: 15,
    rackLocation: 'Rak C-02'
  },
  {
    id: 'mat-21',
    code: 'PLN-CS-CU70-2H',
    name: 'Cable Shoe Cu ID 70 mm 2 H',
    normalizedName: 'Cable Shoe Cu ID 70 mm 2 H',
    category: 'Sepatu Kabel',
    unit: 'pcs',
    initialStock: 75,
    minSafetyStock: 15,
    rackLocation: 'Rak C-03'
  },
  {
    id: 'mat-22',
    code: 'PLN-CS-ALCU150-1H',
    name: 'Cable Shoe Al-Cu 150 mm 1 H',
    normalizedName: 'Cable Shoe Al-Cu 150 mm 1 H',
    category: 'Sepatu Kabel',
    unit: 'pcs',
    initialStock: 70,
    minSafetyStock: 15,
    rackLocation: 'Rak C-04'
  },
  {
    id: 'mat-23',
    code: 'PLN-CS-ALCU150-2H',
    name: 'Cable Shoe Al-Cu 150 mm 2 H',
    normalizedName: 'Cable Shoe Al-Cu 150 mm 2 H',
    category: 'Sepatu Kabel',
    unit: 'pcs',
    initialStock: 65,
    minSafetyStock: 15,
    rackLocation: 'Rak C-05'
  },
  {
    id: 'mat-24',
    code: 'PLN-CS-ALCU70-1H',
    name: 'Cable Shoe Al-Cu 70 mm 1 H',
    normalizedName: 'Cable Shoe Al-Cu 70 mm 1 H',
    category: 'Sepatu Kabel',
    unit: 'pcs',
    initialStock: 90,
    minSafetyStock: 20,
    rackLocation: 'Rak C-06'
  },
  {
    id: 'mat-25',
    code: 'PLN-CS-ALCU70-2H',
    name: 'Cable Shoe Al-Cu 70 mm 2 H',
    normalizedName: 'Cable Shoe Al-Cu 70 mm 2 H',
    category: 'Sepatu Kabel',
    unit: 'pcs',
    initialStock: 85,
    minSafetyStock: 20,
    rackLocation: 'Rak C-07'
  },
  {
    id: 'mat-26',
    code: 'PLN-CS-ALCU240-2H',
    name: 'Cable Shoe Al-Cu 240 mm 2 H',
    normalizedName: 'Cable Shoe Al-Cu 240 mm 2 H',
    category: 'Sepatu Kabel',
    unit: 'pcs',
    initialStock: 50,
    minSafetyStock: 10,
    rackLocation: 'Rak C-08'
  },

  // 3. Fuse Link TM
  {
    id: 'mat-27',
    code: 'PLN-FL-2A',
    name: 'Fuse Link 2A',
    normalizedName: 'Fuse Link 2A',
    category: 'Fuse Link',
    unit: 'pcs',
    initialStock: 120,
    minSafetyStock: 25,
    rackLocation: 'Rak D-01'
  },
  {
    id: 'mat-28',
    code: 'PLN-FL-3A',
    name: 'Fuse Link 3A',
    normalizedName: 'Fuse Link 3A',
    category: 'Fuse Link',
    unit: 'pcs',
    initialStock: 140,
    minSafetyStock: 25,
    rackLocation: 'Rak D-02'
  },
  {
    id: 'mat-29',
    code: 'PLN-FL-5A',
    name: 'Fuse Link 5A',
    normalizedName: 'Fuse Link 5A',
    category: 'Fuse Link',
    unit: 'pcs',
    initialStock: 110,
    minSafetyStock: 20,
    rackLocation: 'Rak D-03'
  },
  {
    id: 'mat-30',
    code: 'PLN-FL-6A',
    name: 'Fuse Link 6A',
    normalizedName: 'Fuse Link 6A',
    category: 'Fuse Link',
    unit: 'pcs',
    initialStock: 160,
    minSafetyStock: 30,
    rackLocation: 'Rak D-04'
  },
  {
    id: 'mat-31',
    code: 'PLN-FL-8A',
    name: 'Fuse Link 8A',
    normalizedName: 'Fuse Link 8A',
    category: 'Fuse Link',
    unit: 'pcs',
    initialStock: 130,
    minSafetyStock: 25,
    rackLocation: 'Rak D-05'
  },
  {
    id: 'mat-32',
    code: 'PLN-FL-10A',
    name: 'Fuse Link 10A',
    normalizedName: 'Fuse Link 10A',
    category: 'Fuse Link',
    unit: 'pcs',
    initialStock: 125,
    minSafetyStock: 25,
    rackLocation: 'Rak D-06'
  },
  {
    id: 'mat-33',
    code: 'PLN-FL-12A',
    name: 'Fuse Link 12A',
    normalizedName: 'Fuse Link 12A',
    category: 'Fuse Link',
    unit: 'pcs',
    initialStock: 90,
    minSafetyStock: 20,
    rackLocation: 'Rak D-07'
  },
  {
    id: 'mat-34',
    code: 'PLN-FL-15A',
    name: 'Fuse Link 15A',
    normalizedName: 'Fuse Link 15A',
    category: 'Fuse Link',
    unit: 'pcs',
    initialStock: 100,
    minSafetyStock: 20,
    rackLocation: 'Rak D-08'
  },
  {
    id: 'mat-35',
    code: 'PLN-FL-20A',
    name: 'Fuse Link 20A',
    normalizedName: 'Fuse Link 20A',
    category: 'Fuse Link',
    unit: 'pcs',
    initialStock: 85,
    minSafetyStock: 15,
    rackLocation: 'Rak D-09'
  },
  {
    id: 'mat-36',
    code: 'PLN-FL-25A',
    name: 'Fuse Link 25A',
    normalizedName: 'Fuse Link 25A',
    category: 'Fuse Link',
    unit: 'pcs',
    initialStock: 80,
    minSafetyStock: 15,
    rackLocation: 'Rak D-10'
  },
  {
    id: 'mat-37',
    code: 'PLN-FL-30A',
    name: 'Fuse Link 30A',
    normalizedName: 'Fuse Link 30A',
    category: 'Fuse Link',
    unit: 'pcs',
    initialStock: 75,
    minSafetyStock: 15,
    rackLocation: 'Rak D-11'
  },
  {
    id: 'mat-38',
    code: 'PLN-FL-40A',
    name: 'Fuse Link 40A',
    normalizedName: 'Fuse Link 40A',
    category: 'Fuse Link',
    unit: 'pcs',
    initialStock: 70,
    minSafetyStock: 15,
    rackLocation: 'Rak D-12'
  },
  {
    id: 'mat-39',
    code: 'PLN-FL-50A',
    name: 'Fuse Link 50A',
    normalizedName: 'Fuse Link 50A',
    category: 'Fuse Link',
    unit: 'pcs',
    initialStock: 60,
    minSafetyStock: 12,
    rackLocation: 'Rak D-13'
  },
  {
    id: 'mat-40',
    code: 'PLN-FL-100A',
    name: 'Fuse Link 100A',
    normalizedName: 'Fuse Link 100A',
    category: 'Fuse Link',
    unit: 'pcs',
    initialStock: 50,
    minSafetyStock: 10,
    rackLocation: 'Rak D-14'
  },

  // 4. NH Fuse & Holder TR
  {
    id: 'mat-41',
    code: 'PLN-NH-50A',
    name: 'NH Fuse 50 A',
    normalizedName: 'NH Fuse 50 A',
    category: 'NH Fuse & Holder',
    unit: 'pcs',
    initialStock: 80,
    minSafetyStock: 15,
    rackLocation: 'Rak E-01'
  },
  {
    id: 'mat-42',
    code: 'PLN-NH-63A',
    name: 'NH Fuse 63 A',
    normalizedName: 'NH Fuse 63 A',
    category: 'NH Fuse & Holder',
    unit: 'pcs',
    initialStock: 75,
    minSafetyStock: 15,
    rackLocation: 'Rak E-02'
  },
  {
    id: 'mat-43',
    code: 'PLN-NH-80A',
    name: 'NH Fuse 80 A',
    normalizedName: 'NH Fuse 80 A',
    category: 'NH Fuse & Holder',
    unit: 'pcs',
    initialStock: 70,
    minSafetyStock: 15,
    rackLocation: 'Rak E-03'
  },
  {
    id: 'mat-44',
    code: 'PLN-NH-100A',
    name: 'NH Fuse 100 A',
    normalizedName: 'NH Fuse 100 A',
    category: 'NH Fuse & Holder',
    unit: 'pcs',
    initialStock: 90,
    minSafetyStock: 20,
    rackLocation: 'Rak E-04'
  },
  {
    id: 'mat-45',
    code: 'PLN-NH-125A',
    name: 'NH Fuse 125 A',
    normalizedName: 'NH Fuse 125 A',
    category: 'NH Fuse & Holder',
    unit: 'pcs',
    initialStock: 85,
    minSafetyStock: 20,
    rackLocation: 'Rak E-05'
  },
  {
    id: 'mat-46',
    code: 'PLN-NH-160A',
    name: 'NH Fuse 160 A',
    normalizedName: 'NH Fuse 160 A',
    category: 'NH Fuse & Holder',
    unit: 'pcs',
    initialStock: 95,
    minSafetyStock: 20,
    rackLocation: 'Rak E-06'
  },
  {
    id: 'mat-47',
    code: 'PLN-NH-200A',
    name: 'NH Fuse 200 A',
    normalizedName: 'NH Fuse 200 A',
    category: 'NH Fuse & Holder',
    unit: 'pcs',
    initialStock: 90,
    minSafetyStock: 20,
    rackLocation: 'Rak E-07'
  },
  {
    id: 'mat-48',
    code: 'PLN-NH-224A',
    name: 'NH Fuse 224 A',
    normalizedName: 'NH Fuse 224 A',
    category: 'NH Fuse & Holder',
    unit: 'pcs',
    initialStock: 60,
    minSafetyStock: 12,
    rackLocation: 'Rak E-08'
  },
  {
    id: 'mat-49',
    code: 'PLN-NH-250A',
    name: 'NH Fuse 250 A',
    normalizedName: 'NH Fuse 250 A',
    category: 'NH Fuse & Holder',
    unit: 'pcs',
    initialStock: 110,
    minSafetyStock: 25,
    rackLocation: 'Rak E-09'
  },
  {
    id: 'mat-50',
    code: 'PLN-NH-300A',
    name: 'NH Fuse 300 A',
    normalizedName: 'NH Fuse 300 A',
    category: 'NH Fuse & Holder',
    unit: 'pcs',
    initialStock: 50,
    minSafetyStock: 10,
    rackLocation: 'Rak E-10'
  },
  {
    id: 'mat-51',
    code: 'PLN-NH-400A',
    name: 'NH Fuse 400 A',
    normalizedName: 'NH Fuse 400 A',
    category: 'NH Fuse & Holder',
    unit: 'pcs',
    initialStock: 80,
    minSafetyStock: 15,
    rackLocation: 'Rak E-11'
  },
  {
    id: 'mat-52',
    code: 'PLN-NH-HD250',
    name: 'NH Holder/Contact Feer 250 A',
    normalizedName: 'NH Holder/Contact Feer 250 A',
    category: 'NH Fuse & Holder',
    unit: 'set',
    initialStock: 45,
    minSafetyStock: 10,
    rackLocation: 'Rak E-12'
  },
  {
    id: 'mat-53',
    code: 'PLN-NH-RL250',
    name: 'Base Fuse Rail 250 A',
    normalizedName: 'Base Fuse Rail 250 A',
    category: 'NH Fuse & Holder',
    unit: 'set',
    initialStock: 35,
    minSafetyStock: 8,
    rackLocation: 'Rak E-13'
  },
  {
    id: 'mat-54',
    code: 'PLN-NH-HD400',
    name: 'NH Holder/Contact Feer 400 A',
    normalizedName: 'NH Holder/Contact Feer 400 A',
    category: 'NH Fuse & Holder',
    unit: 'set',
    initialStock: 40,
    minSafetyStock: 10,
    rackLocation: 'Rak E-14'
  },

  // 5. Konstruksi & Isolasi Jaringan
  {
    id: 'mat-55',
    code: 'PLN-KS-SUSP',
    name: 'Suspension Clamp',
    normalizedName: 'Suspension Clamp ',
    category: 'Konstruksi & Isolasi',
    unit: 'set',
    initialStock: 75,
    minSafetyStock: 15,
    rackLocation: 'Rak F-01'
  },
  {
    id: 'mat-56',
    code: 'PLN-KS-SAA',
    name: 'Small Angle Asembly (SAA)',
    normalizedName: 'Small Angle Asembly (SAA) ',
    category: 'Konstruksi & Isolasi',
    unit: 'set',
    initialStock: 70,
    minSafetyStock: 15,
    rackLocation: 'Rak F-02'
  },
  {
    id: 'mat-57',
    code: 'PLN-KS-LAA',
    name: 'Large Angle Asembly (LAA)',
    normalizedName: 'Large Angle Asembly (LAA) ',
    category: 'Konstruksi & Isolasi',
    unit: 'set',
    initialStock: 60,
    minSafetyStock: 12,
    rackLocation: 'Rak F-03'
  },
  {
    id: 'mat-58',
    code: 'PLN-KS-DEA',
    name: 'Dead End Asembly (DEA)',
    normalizedName: 'Dead End Asembly (DEA) ',
    category: 'Konstruksi & Isolasi',
    unit: 'set',
    initialStock: 80,
    minSafetyStock: 20,
    rackLocation: 'Rak F-04'
  },
  {
    id: 'mat-59',
    code: 'PLN-KS-SSSTRIP',
    name: 'Stainless Steel Strip',
    normalizedName: 'Stainless Steel Strip ',
    category: 'Konstruksi & Isolasi',
    unit: 'roll',
    initialStock: 40,
    minSafetyStock: 10,
    rackLocation: 'Rak F-05'
  },
  {
    id: 'mat-60',
    code: 'PLN-IS-CVCO',
    name: 'Cover CO',
    normalizedName: 'Cover CO ',
    category: 'Konstruksi & Isolasi',
    unit: 'pcs',
    initialStock: 50,
    minSafetyStock: 10,
    rackLocation: 'Rak F-06'
  },
  {
    id: 'mat-61',
    code: 'PLN-IS-CVBSH',
    name: 'Cover Bushing Trafo',
    normalizedName: 'Cover Bushing Trafo ',
    category: 'Konstruksi & Isolasi',
    unit: 'set',
    initialStock: 45,
    minSafetyStock: 10,
    rackLocation: 'Rak F-07'
  },
  {
    id: 'mat-62',
    code: 'PLN-IS-CVLA',
    name: 'Cover LA',
    normalizedName: 'Cover LA ',
    category: 'Konstruksi & Isolasi',
    unit: 'pcs',
    initialStock: 50,
    minSafetyStock: 10,
    rackLocation: 'Rak F-08'
  },
  {
    id: 'mat-63',
    code: 'PLN-KS-GROD',
    name: 'Ground ROD 2.5 Mtr',
    normalizedName: 'Ground ROD 2.5 Mtr',
    category: 'Konstruksi & Isolasi',
    unit: 'btg',
    initialStock: 60,
    minSafetyStock: 12,
    rackLocation: 'Rak F-09'
  },
  {
    id: 'mat-64',
    code: 'PLN-KS-ALBIND',
    name: 'AL Binding Wire',
    normalizedName: 'AL Binding Wire',
    category: 'Konstruksi & Isolasi',
    unit: 'kg',
    initialStock: 50,
    minSafetyStock: 10,
    rackLocation: 'Rak F-10'
  },

  // 6. Kabel & Saluran Rumah (SR)
  {
    id: 'mat-65',
    code: 'PLN-KB-TCSR2X10',
    name: 'TC / kabel SR 2x10mm',
    normalizedName: 'TC / kabel SR 2x10mm',
    category: 'Kabel & SR',
    unit: 'meter',
    initialStock: 2500,
    minSafetyStock: 400,
    rackLocation: 'Gudang Roll G-01'
  },

  // 7. Pengukuran & Pembatas (KWH & MCB)
  {
    id: 'mat-66',
    code: 'PLN-MCB-2A',
    name: 'MCB 2A',
    normalizedName: 'MCB 2A',
    category: 'KWH & MCB',
    unit: 'pcs',
    initialStock: 90,
    minSafetyStock: 20,
    rackLocation: 'Rak H-01'
  },
  {
    id: 'mat-67',
    code: 'PLN-MCB-4A',
    name: 'MCB 4A',
    normalizedName: 'MCB 4A',
    category: 'KWH & MCB',
    unit: 'pcs',
    initialStock: 110,
    minSafetyStock: 25,
    rackLocation: 'Rak H-02'
  },
  {
    id: 'mat-68',
    code: 'PLN-MCB-6A',
    name: 'MCB 6A',
    normalizedName: 'MCB 6A',
    category: 'KWH & MCB',
    unit: 'pcs',
    initialStock: 85,
    minSafetyStock: 20,
    rackLocation: 'Rak H-03'
  },
  {
    id: 'mat-69',
    code: 'PLN-MCB-10A',
    name: 'MCB 10A',
    normalizedName: 'MCB 10A',
    category: 'KWH & MCB',
    unit: 'pcs',
    initialStock: 100,
    minSafetyStock: 20,
    rackLocation: 'Rak H-04'
  },
  {
    id: 'mat-70',
    code: 'PLN-MCB-16A',
    name: 'MCB 16A',
    normalizedName: 'MCB 16A',
    category: 'KWH & MCB',
    unit: 'pcs',
    initialStock: 75,
    minSafetyStock: 15,
    rackLocation: 'Rak H-05'
  },
  {
    id: 'mat-71',
    code: 'PLN-MCB-20A',
    name: 'MCB 20A',
    normalizedName: 'MCB 20A',
    category: 'KWH & MCB',
    unit: 'pcs',
    initialStock: 80,
    minSafetyStock: 15,
    rackLocation: 'Rak H-06'
  },
  {
    id: 'mat-72',
    code: 'PLN-MCB-25A',
    name: 'MCB 25A',
    normalizedName: 'MCB 25A',
    category: 'KWH & MCB',
    unit: 'pcs',
    initialStock: 70,
    minSafetyStock: 15,
    rackLocation: 'Rak H-07'
  },
  {
    id: 'mat-73',
    code: 'PLN-MCB-35A',
    name: 'MCB 35A',
    normalizedName: 'MCB 35A',
    category: 'KWH & MCB',
    unit: 'pcs',
    initialStock: 65,
    minSafetyStock: 12,
    rackLocation: 'Rak H-08'
  },
  {
    id: 'mat-74',
    code: 'PLN-MTR-PRA',
    name: 'KWH METER PRA BAYAR',
    normalizedName: 'KWH METER PRA BAYAR',
    category: 'KWH & MCB',
    unit: 'unit',
    initialStock: 450,
    minSafetyStock: 50,
    rackLocation: 'Rak I-01'
  },
  {
    id: 'mat-75',
    code: 'PLN-MTR-PASCA',
    name: 'KWH METER PASCA BAYAR',
    normalizedName: 'KWH METER PASCA BAYAR',
    category: 'KWH & MCB',
    unit: 'unit',
    initialStock: 300,
    minSafetyStock: 40,
    rackLocation: 'Rak I-02'
  },
  {
    id: 'mat-76',
    code: 'PLN-SW-400V3P',
    name: 'MAIN SWITCH 400V 400A 3P',
    normalizedName: 'MAIN SWITCH 400V 400A 3P',
    category: 'KWH & MCB',
    unit: 'set',
    initialStock: 25,
    minSafetyStock: 5,
    rackLocation: 'Rak I-03'
  }
];
