import { AppUser, UserRole } from '../types/warehouse';

const AUTH_USER_KEY = 'pln_auth_current_user_v1';
const USERS_LIST_KEY = 'pln_users_directory_v1';

export const DEFAULT_USERS: AppUser[] = [
  {
    id: 'user-01',
    name: 'Superuser',
    username: 'superuser',
    petugas: 'Pegawai PLN',
    role: 'MULP',
    title: 'Super Administrator MARVEL PLN',
    nip: 'NIP. 198501012010121001',
    password: 'password123',
    permissions: [
      'Transaksi - Menu Pengambilan Material',
      'Transaksi - Menu Penerimaan Material',
      'Approval - Menu Material Keluar',
      'Approval - Menu Penerimaan Material',
      'Logbook - Logbook',
      'Statistik - Statistik',
      'Data Master - Data Material dan Saldo',
      'Data Master - Data User'
    ]
  },
  {
    id: 'user-02',
    name: 'Ahmad Zaenudin',
    username: 'ahmad.zaenudin',
    petugas: 'Pegawai PLN',
    role: 'Admin Gudang',
    title: 'Koordinator Pelayanan Teknik & Distribusi',
    nip: 'NIP. 198904122013011002',
    password: 'password123',
    permissions: [
      'Transaksi - Menu Pengambilan Material',
      'Transaksi - Menu Penerimaan Material',
      'Approval - Menu Material Keluar',
      'Approval - Menu Penerimaan Material',
      'Logbook - Logbook',
      'Statistik - Statistik'
    ]
  },
  {
    id: 'user-03',
    name: 'Andreas Widyo Nugroho',
    username: 'andreas.widyo',
    petugas: 'Security',
    role: 'Petugas Gudang',
    title: 'Petugas Keamanan Gudang & Gerbang',
    nip: 'DI-SEC-004',
    password: 'password123',
    permissions: [
      'Transaksi - Menu Pengambilan Material',
      'Approval - Menu Material Keluar',
      'Approval - Menu Penerimaan Material',
      'Logbook - Logbook',
      'Statistik - Statistik'
    ]
  },
  {
    id: 'user-04',
    name: 'Emma Agustina',
    username: 'emma.agustina',
    petugas: 'Pegawai PLN',
    role: 'Admin Gudang',
    title: 'Pengawas Logistik & Administrasi Material',
    nip: 'NIP. 199108252015022003',
    password: 'password123',
    permissions: [
      'Transaksi - Menu Pengambilan Material',
      'Transaksi - Menu Penerimaan Material',
      'Approval - Menu Material Keluar',
      'Approval - Menu Penerimaan Material',
      'Logbook - Logbook',
      'Statistik - Statistik',
      'Data Master - Data Material dan Saldo'
    ]
  },
  {
    id: 'user-05',
    name: 'Fachrur Rizal Zamroni',
    username: 'rizal.zamroni',
    petugas: 'Pegawai PLN',
    role: 'Admin Gudang',
    title: 'Supervisor Teknik & Pemeliharaan',
    nip: 'NIP. 199203152016011004',
    password: 'password123',
    permissions: [
      'Approval - Menu Material Keluar',
      'Approval - Menu Penerimaan Material'
    ]
  },
  {
    id: 'user-06',
    name: 'Nur Rahmad',
    username: 'nur.rahmad',
    petugas: 'Petugas Yanbung',
    role: 'Petugas Gudang',
    title: 'Pelaksana Penyambungan & Pasang Baru',
    nip: 'DI-YB-012',
    password: 'password123',
    permissions: [
      'Transaksi - Menu Pengambilan Material',
      'Logbook - Logbook'
    ]
  },
  {
    id: 'user-07',
    name: 'Nyoman Abisatya',
    username: 'abisatya',
    petugas: 'Manager ULP',
    role: 'MULP',
    title: 'Manager ULP Tanggul (Pemberi Persetujuan)',
    nip: 'NIP. 198006182006041001',
    password: 'password123',
    permissions: [
      'Transaksi - Menu Pengambilan Material',
      'Transaksi - Menu Penerimaan Material',
      'Approval - Menu Material Keluar',
      'Approval - Menu Penerimaan Material',
      'Logbook - Logbook',
      'Statistik - Statistik',
      'Data Master - Data Material dan Saldo',
      'Data Master - Data User'
    ]
  },
  {
    id: 'user-08',
    name: 'Revi Alvin Razaqi',
    username: 'revi.razaqi',
    petugas: 'Pegawai PLN',
    role: 'Admin Gudang',
    title: 'Penanggung Jawab Sistem & Inventaris',
    nip: 'NIP. 199511102018011005',
    password: 'password123',
    permissions: [
      'Transaksi - Menu Pengambilan Material',
      'Transaksi - Menu Penerimaan Material',
      'Approval - Menu Material Keluar',
      'Approval - Menu Penerimaan Material',
      'Logbook - Logbook',
      'Statistik - Statistik'
    ]
  },
  {
    id: 'user-09',
    name: 'David Basyhul Hafi',
    username: 'david.basyhul',
    petugas: 'Pegawai PLN',
    role: 'Admin Gudang',
    title: 'Supervisor K3L & Administrasi Gudang',
    nip: 'DI-01471',
    password: 'password123',
    permissions: [
      'Transaksi - Menu Pengambilan Material',
      'Transaksi - Menu Penerimaan Material',
      'Approval - Menu Material Keluar',
      'Logbook - Logbook',
      'Statistik - Statistik',
      'Data Master - Data Material dan Saldo'
    ]
  },
  {
    id: 'user-10',
    name: 'Septian Dwi Cahyo',
    username: 'septian.dwi',
    petugas: 'Pegawai PLN',
    role: 'Petugas Gudang',
    title: 'Petugas Pelaksana Operasional Gudang',
    nip: 'DI-01494',
    password: 'password123',
    permissions: [
      'Transaksi - Menu Pengambilan Material',
      'Transaksi - Menu Penerimaan Material',
      'Logbook - Logbook'
    ]
  },
  {
    id: 'user-11',
    name: 'Ir. H. Bambang Hermanto',
    username: 'bambang.h',
    petugas: 'Manager ULP',
    role: 'MULP',
    title: 'Pembina & Pengawas Senior ULP Tanggul',
    nip: 'NIP. 8509124Z',
    password: 'password123',
    permissions: [
      'Approval - Menu Material Keluar',
      'Approval - Menu Penerimaan Material',
      'Logbook - Logbook',
      'Statistik - Statistik'
    ]
  },
  {
    id: 'user-12',
    name: 'Budi Santoso',
    username: 'budi.santoso',
    petugas: 'Pegawai PLN',
    role: 'Petugas Gudang',
    title: 'Regu Pelayanan Gangguan A',
    nip: 'DI-02101',
    password: 'password123',
    permissions: [
      'Transaksi - Menu Pengambilan Material',
      'Logbook - Logbook'
    ]
  },
  {
    id: 'user-13',
    name: 'Agus Prasetyo',
    username: 'agus.prasetyo',
    petugas: 'Pegawai PLN',
    role: 'Petugas Gudang',
    title: 'Regu Pelayanan Gangguan B',
    nip: 'DI-02102',
    password: 'password123',
    permissions: [
      'Transaksi - Menu Pengambilan Material',
      'Logbook - Logbook'
    ]
  },
  {
    id: 'user-14',
    name: 'Hendra Setiawan',
    username: 'hendra.s',
    petugas: 'Pegawai PLN',
    role: 'Petugas Gudang',
    title: 'Regu Pelayanan Gangguan C',
    nip: 'DI-02103',
    password: 'password123',
    permissions: [
      'Transaksi - Menu Pengambilan Material',
      'Logbook - Logbook'
    ]
  },
  {
    id: 'user-15',
    name: 'Yogi Pratama',
    username: 'yogi.pratama',
    petugas: 'Security',
    role: 'Petugas Gudang',
    title: 'Petugas Keamanan Malam Gudang',
    nip: 'DI-SEC-008',
    password: 'password123',
    permissions: [
      'Transaksi - Menu Pengambilan Material',
      'Logbook - Logbook'
    ]
  },
  {
    id: 'user-16',
    name: 'Wawan Kurniawan',
    username: 'wawan.k',
    petugas: 'Petugas Yanbung',
    role: 'Petugas Gudang',
    title: 'Teknisi Pasang Baru ULP Tanggul',
    nip: 'DI-YB-015',
    password: 'password123',
    permissions: [
      'Transaksi - Menu Pengambilan Material',
      'Logbook - Logbook'
    ]
  },
  {
    id: 'user-17',
    name: 'Dwi Cahyono',
    username: 'dwi.cahyono',
    petugas: 'Petugas HAR',
    role: 'Petugas Gudang',
    title: 'Teknisi Pemeliharaan Jaringan',
    nip: 'DI-HAR-021',
    password: 'password123',
    permissions: [
      'Transaksi - Menu Pengambilan Material',
      'Logbook - Logbook'
    ]
  },
  {
    id: 'user-18',
    name: 'Siti Aminah',
    username: 'siti.aminah',
    petugas: 'Pegawai PLN',
    role: 'Admin Gudang',
    title: 'Staf Administrasi & Pembukuan ULP',
    nip: 'NIP. 199605202020012006',
    password: 'password123',
    permissions: [
      'Logbook - Logbook',
      'Statistik - Statistik'
    ]
  }
];

export const PRESET_USERS = DEFAULT_USERS;

export const getUsers = (): AppUser[] => {
  try {
    const raw = localStorage.getItem(USERS_LIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Failed reading users from localStorage', err);
  }
  saveUsers(DEFAULT_USERS);
  return DEFAULT_USERS;
};

export const saveUsers = (users: AppUser[]) => {
  localStorage.setItem(USERS_LIST_KEY, JSON.stringify(users));
  window.dispatchEvent(new CustomEvent('pln-users-updated'));
};

export const addUser = (newUser: Omit<AppUser, 'id'>): AppUser => {
  const users = getUsers();
  const created: AppUser = {
    ...newUser,
    id: `user-${Date.now()}`
  };
  const updated = [...users, created];
  saveUsers(updated);
  return created;
};

export const updateUser = (id: string, updates: Partial<AppUser>): boolean => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return false;

  users[index] = { ...users[index], ...updates };
  saveUsers(users);

  // If current logged-in user was updated, update auth state too
  const current = getCurrentUser();
  if (current && current.id === id) {
    setCurrentUser(users[index]);
  }

  return true;
};

export const deleteUser = (id: string): boolean => {
  const users = getUsers();
  if (users.length <= 1) return false; // Cannot delete the last remaining user

  const filtered = users.filter(u => u.id !== id);
  if (filtered.length === users.length) return false;
  saveUsers(filtered);

  // If deleted current user, logout
  const current = getCurrentUser();
  if (current && current.id === id) {
    logout();
  }

  return true;
};

export const deleteUsers = (ids: string[]): boolean => {
  const users = getUsers();
  if (users.length <= 1 || ids.length === 0) return false;

  const toDeleteSet = new Set(ids);
  let filtered = users.filter(u => !toDeleteSet.has(u.id));
  if (filtered.length === 0) {
    // Keep at least one user
    filtered = [users[0]];
  }
  saveUsers(filtered);

  const current = getCurrentUser();
  if (current && toDeleteSet.has(current.id)) {
    logout();
  }

  return true;
};

export const resetUsers = () => {
  saveUsers(DEFAULT_USERS);
};

// Ensure opening the link fresh always prompts the login page
try {
  localStorage.removeItem(AUTH_USER_KEY);
} catch (e) {
  // ignore
}

export const getCurrentUser = (): AppUser | null => {
  try {
    const raw = sessionStorage.getItem(AUTH_USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed reading user from sessionStorage', err);
  }
  return null;
};

export const setCurrentUser = (user: AppUser | null) => {
  if (user) {
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(AUTH_USER_KEY);
  }
  try {
    localStorage.removeItem(AUTH_USER_KEY);
  } catch (e) {}
  window.dispatchEvent(new CustomEvent('pln-auth-changed'));
};

export const logout = () => {
  setCurrentUser(null);
};

export const loginAsRole = (role: UserRole): AppUser => {
  const users = getUsers();
  const found = users.find(u => u.role === role) || users[0];
  setCurrentUser(found);
  return found;
};
