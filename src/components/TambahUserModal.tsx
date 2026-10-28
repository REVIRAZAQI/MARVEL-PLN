import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AppUser, UserRole } from '../types/warehouse';
import { X, ChevronDown, Check, Upload, Trash2, Eye, EyeOff } from 'lucide-react';
import { useModalScrollLock, forceUnlockScroll } from '../utils/modalScrollLock';

interface TambahUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSaved: (user: AppUser) => void;
  editUser?: AppUser | null;
}

export const TambahUserModal: React.FC<TambahUserModalProps> = ({
  isOpen,
  onClose,
  onUserSaved,
  editUser
}) => {
  useModalScrollLock(isOpen);

  // Form Fields matching mockup
  const [namaLengkap, setNamaLengkap] = useState('');
  const [petugas, setPetugas] = useState('Pegawai PLN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Selected Permissions
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Digital Signature
  const [signatureFileName, setSignatureFileName] = useState<string>('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // References for zero-scroll direct focus
  const namaInputRef = useRef<HTMLInputElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Error feedback
  const [errorMessage, setErrorMessage] = useState('');

  // Pre-fill when editing or reset when adding, and scroll directly to top
  useEffect(() => {
    if (isOpen) {
      // Ensure window and container are reset immediately to top
      window.scrollTo(0, 0);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }

      if (editUser) {
        setNamaLengkap(editUser.name || '');
        setPetugas(editUser.petugas || 'Pegawai PLN');
        setUsername(editUser.username || '');
        setPassword(editUser.password || 'password123');
        setSelectedPermissions(editUser.permissions || []);
        setSignatureDataUrl(editUser.signatureUrl || '');
        setSignatureFileName(editUser.signatureUrl ? 'Tanda tangan tersimpan' : '');
      } else {
        setNamaLengkap('');
        setPetugas('Pegawai PLN');
        setUsername('');
        setPassword('');
        setSelectedPermissions([
          'Transaksi - Menu Pengambilan Material',
          'Logbook - Logbook'
        ]);
        setSignatureDataUrl('');
        setSignatureFileName('');
      }
      setErrorMessage('');
      setShowPassword(false);

      // Focus first input automatically
      const timer = setTimeout(() => {
        namaInputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [editUser, isOpen]);

  if (!isOpen) return null;

  const handleCloseModal = () => {
    forceUnlockScroll();
    onClose();
  };

  // Toggle permission helper
  const togglePermission = (permKey: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permKey) ? prev.filter(p => p !== permKey) : [...prev, permKey]
    );
  };

  // Handle signature file upload
  const handleSignatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Ukuran file tanda tangan maksimal 2 MB.');
      return;
    }

    setSignatureFileName(file.name);
    const reader = new FileReader();
    reader.onload = event => {
      if (event.target?.result) {
        setSignatureDataUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSignature = () => {
    setSignatureFileName('');
    setSignatureDataUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Auto-generate username from name if empty
  const handleNamaChange = (val: string) => {
    setNamaLengkap(val);
    if (!editUser && (!username || username === namaLengkap.toLowerCase().replace(/[^a-z0-9]/g, '.'))) {
      setUsername(val.toLowerCase().trim().replace(/[^a-z0-9]/g, '.'));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!namaLengkap.trim()) {
      setErrorMessage('Harap masukkan nama lengkap.');
      return;
    }

    if (!username.trim()) {
      setErrorMessage('Harap masukkan username.');
      return;
    }

    if (!password.trim() || password.length < 6) {
      setErrorMessage('Password minimal 6 karakter.');
      return;
    }

    // Determine role based on permissions
    let role: UserRole = 'Petugas Gudang';
    if (selectedPermissions.includes('Data Master - Data User') || petugas === 'Manager ULP') {
      role = 'MULP';
    } else if (
      selectedPermissions.includes('Approval - Menu Material Keluar') ||
      selectedPermissions.includes('Approval - Menu Penerimaan Material') ||
      petugas === 'Admin Gudang'
    ) {
      role = 'Admin Gudang';
    }

    // Auto title if not provided
    const userTitle =
      editUser?.title ||
      (role === 'MULP'
        ? 'Super Administrator MARVEL'
        : role === 'Admin Gudang'
        ? 'Admin Pengawas Logistik Gudang'
        : 'Petugas Operasional Lapangan');

    const userNip = editUser?.nip || 'DI-PLN-' + Math.floor(1000 + Math.random() * 9000);

    const savedUser: AppUser = {
      id: editUser?.id || `user-${Date.now()}`,
      name: namaLengkap.trim(),
      username: username.trim().toLowerCase(),
      petugas: petugas || 'Pegawai PLN',
      role,
      title: userTitle,
      nip: userNip,
      password: password.trim(),
      permissions: selectedPermissions,
      signatureUrl: signatureDataUrl || undefined
    };

    onUserSaved(savedUser);
    handleCloseModal();
  };

  // Render directly into document.body to bypass any parent container CSS transforms and viewport scroll issues
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      {/* Modal Dialog Card matching tambah_user_48fb9741.png - Centered in viewport */}
      <div className="w-full max-w-[940px] max-h-[92vh] sm:max-h-[94vh] bg-white rounded-[28px] sm:rounded-[34px] shadow-2xl border border-white/80 p-5 sm:p-7 md:p-9 relative animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Top-Right Close Button matching mockup */}
        <button
          type="button"
          onClick={handleCloseModal}
          className="absolute top-5 right-5 sm:top-7 sm:right-7 w-9 h-9 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shadow-2xs cursor-pointer z-10"
          title="Tutup Modal"
        >
          <X className="w-4 h-4 stroke-[2.2]" />
        </button>

        {/* Top-Left Header matching mockup */}
        <div className="mb-4 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-black text-sky-500 tracking-wider uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>AKUN BARU</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0f2852] tracking-tight leading-tight">
            {editUser ? 'Edit User' : 'Tambah User'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Atur identitas, role, dan akses fitur untuk pengguna.
          </p>
        </div>

        {/* Scrollable Form Body - Smooth and directly viewable without page scroll */}
        <div ref={scrollContainerRef} className="overflow-y-auto pr-1 sm:pr-2 flex-1 space-y-4">
          <form id="tambah-user-form" onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            {/* Row 1: Nama Lengkap & Petugas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  ref={namaInputRef}
                  type="text"
                  required
                  value={namaLengkap}
                  onChange={e => handleNamaChange(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="w-full px-4 py-2.5 sm:py-3 bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                />
              </div>

              {/* Petugas Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Petugas
                </label>
                <div className="relative">
                  <select
                    value={petugas}
                    onChange={e => setPetugas(e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs appearance-none cursor-pointer pr-10"
                  >
                    <option value="Pegawai PLN">Pegawai PLN</option>
                    <option value="Petugas Gudang">Petugas Gudang</option>
                    <option value="Security">Security</option>
                    <option value="Petugas Yanbung">Petugas Yanbung</option>
                    <option value="Manager ULP">Manager ULP</option>
                    <option value="Admin Gudang">Admin Gudang</option>
                    <option value="Petugas HAR">Petugas HAR</option>
                    <option value="Pelayanan Teknik">Pelayanan Teknik</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Row 2: Username & Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Contoh: budi.gudang"
                  className="w-full px-4 py-2.5 sm:py-3 bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                />
              </div>

              {/* Password with Eye toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-4 pr-11 py-2.5 sm:py-3 bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Grouped Box: Role dan Fitur yang Diperoleh matching mockup */}
            <div className="border border-blue-200/80 rounded-2xl p-4 sm:p-5 bg-[#f8fbff]/70 relative mt-2 shadow-2xs">
              <span className="text-xs font-bold text-slate-800 block mb-1">
                Role dan Fitur yang Diperoleh
              </span>
              <p className="text-xs text-slate-500 mb-3.5 font-normal">
                Pilih menu yang dapat diakses oleh user ini. Setiap kelompok menu berfungsi sebagai role akses.
              </p>

              {/* 2 Columns inside Role box matching mockup */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                {/* Left Column: Transaksi, Logbook, Data Master */}
                <div className="space-y-3.5">
                  {/* 1. Sub-box: Transaksi */}
                  <div className="border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 bg-white/95 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-700 block mb-2">
                      Transaksi
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {/* Item 1: Menu Pengambilan Material */}
                      <label
                        onClick={() => togglePermission('Transaksi - Menu Pengambilan Material')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          selectedPermissions.includes('Transaksi - Menu Pengambilan Material')
                            ? 'border-blue-400 bg-blue-50/70 text-blue-900 shadow-2xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes('Transaksi - Menu Pengambilan Material')}
                          onChange={() => {}}
                          className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer pointer-events-none"
                        />
                        <span>Menu Pengambilan Material</span>
                      </label>

                      {/* Item 2: Menu Penerimaan Material */}
                      <label
                        onClick={() => togglePermission('Transaksi - Menu Penerimaan Material')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          selectedPermissions.includes('Transaksi - Menu Penerimaan Material')
                            ? 'border-blue-400 bg-blue-50/70 text-blue-900 shadow-2xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes('Transaksi - Menu Penerimaan Material')}
                          onChange={() => {}}
                          className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer pointer-events-none"
                        />
                        <span>Menu Penerimaan Material</span>
                      </label>
                    </div>
                  </div>

                  {/* 2. Sub-box: Logbook */}
                  <div className="border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 bg-white/95 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-700 block mb-2">
                      Logbook
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <label
                        onClick={() => togglePermission('Logbook - Logbook')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          selectedPermissions.includes('Logbook - Logbook')
                            ? 'border-blue-400 bg-blue-50/70 text-blue-900 shadow-2xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes('Logbook - Logbook')}
                          onChange={() => {}}
                          className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer pointer-events-none"
                        />
                        <span>Logbook</span>
                      </label>
                    </div>
                  </div>

                  {/* 3. Sub-box: Data Master */}
                  <div className="border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 bg-white/95 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-700 block mb-2">
                      Data Master
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {/* Item 1: Data Material dan Saldo */}
                      <label
                        onClick={() => togglePermission('Data Master - Data Material dan Saldo')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          selectedPermissions.includes('Data Master - Data Material dan Saldo')
                            ? 'border-blue-400 bg-blue-50/70 text-blue-900 shadow-2xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes('Data Master - Data Material dan Saldo')}
                          onChange={() => {}}
                          className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer pointer-events-none"
                        />
                        <span>Data Material dan Saldo</span>
                      </label>

                      {/* Item 2: Data User */}
                      <label
                        onClick={() => togglePermission('Data Master - Data User')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          selectedPermissions.includes('Data Master - Data User')
                            ? 'border-blue-400 bg-blue-50/70 text-blue-900 shadow-2xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes('Data Master - Data User')}
                          onChange={() => {}}
                          className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer pointer-events-none"
                        />
                        <span>Data User</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Right Column: Approval, Statistik */}
                <div className="space-y-3.5">
                  {/* 4. Sub-box: Approval */}
                  <div className="border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 bg-white/95 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-700 block mb-2">
                      Approval
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {/* Item 1: Menu Material Keluar */}
                      <label
                        onClick={() => togglePermission('Approval - Menu Material Keluar')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          selectedPermissions.includes('Approval - Menu Material Keluar')
                            ? 'border-blue-400 bg-blue-50/70 text-blue-900 shadow-2xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes('Approval - Menu Material Keluar')}
                          onChange={() => {}}
                          className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer pointer-events-none"
                        />
                        <span>Menu Material Keluar</span>
                      </label>

                      {/* Item 2: Menu Penerimaan Material */}
                      <label
                        onClick={() => togglePermission('Approval - Menu Penerimaan Material')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          selectedPermissions.includes('Approval - Menu Penerimaan Material')
                            ? 'border-blue-400 bg-blue-50/70 text-blue-900 shadow-2xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes('Approval - Menu Penerimaan Material')}
                          onChange={() => {}}
                          className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer pointer-events-none"
                        />
                        <span>Menu Penerimaan Material</span>
                      </label>
                    </div>
                  </div>

                  {/* 5. Sub-box: Statistik */}
                  <div className="border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 bg-white/95 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-700 block mb-2">
                      Statistik
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <label
                        onClick={() => togglePermission('Statistik - Statistik')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          selectedPermissions.includes('Statistik - Statistik')
                            ? 'border-blue-400 bg-blue-50/70 text-blue-900 shadow-2xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes('Statistik - Statistik')}
                          onChange={() => {}}
                          className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer pointer-events-none"
                        />
                        <span>Statistik</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Tanda Tangan Digital matching mockup */}
            <div className="pt-1">
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Tanda Tangan Digital
              </label>

              {/* Hidden native input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png, image/jpeg, image/webp"
                onChange={handleSignatureFileChange}
                className="hidden"
              />

              {/* File chooser button row */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Choose File</span>
                </button>
                <span className="text-xs text-slate-500">
                  {signatureFileName || 'No file chosen'}
                </span>
                {signatureDataUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveSignature}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Hapus tanda tangan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Helper text */}
              <p className="text-[11px] text-slate-400 mt-1 font-normal">
                Pilih gambar tanda tangan (PNG, JPG, atau WebP), maksimal 2 MB. Boleh ditambahkan nanti.
              </p>

              {/* Status indicator pill matching mockup */}
              <div className="mt-2 flex items-center gap-3">
                {!signatureDataUrl ? (
                  <span className="inline-block px-3 py-1 rounded-xl bg-sky-50/90 text-sky-700 text-[11px] font-semibold border border-sky-100 shadow-2xs">
                    Belum ada file dipilih
                  </span>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200 shadow-2xs">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                    <span>Tanda tangan terpasang</span>
                    {signatureDataUrl && (
                      <img
                        src={signatureDataUrl}
                        alt="Tanda tangan"
                        className="h-5 w-auto max-w-[50px] object-contain ml-1 bg-white rounded border border-slate-200 p-0.5"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer Action Buttons - Fixed at bottom of card so always immediately visible */}
        <div className="flex items-center justify-end gap-3 pt-4 sm:pt-5 border-t border-slate-100 shrink-0 mt-3">
          <button
            type="button"
            onClick={handleCloseModal}
            className="px-6 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            Batal
          </button>
          <button
            type="submit"
            form="tambah-user-form"
            className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#0066ff] via-[#2563eb] to-[#4f46e5] hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Simpan User
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
