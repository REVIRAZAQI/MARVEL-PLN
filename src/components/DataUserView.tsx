import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AppUser, UserRole } from '../types/warehouse';
import { getUsers, saveUsers, addUser, updateUser, deleteUser, deleteUsers } from '../utils/authStore';
import { useModalScrollLock } from '../utils/modalScrollLock';
import {
  Users,
  UserPlus,
  Edit3,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  X,
  FileSignature,
  Shield,
  Plus
} from 'lucide-react';
import { TambahUserModal } from './TambahUserModal';

interface DataUserViewProps {
  users: AppUser[];
  currentUser: AppUser | null;
  onBackToHub: () => void;
  onUsersUpdated?: () => void;
}

const AVAILABLE_PERMISSIONS = [
  'Transaksi - Menu Pengambilan Material',
  'Transaksi - Menu Penerimaan Material',
  'Approval - Menu Material Keluar',
  'Approval - Menu Penerimaan Material',
  'Logbook - Logbook',
  'Statistik - Statistik',
  'Data Master - Data Material dan Saldo',
  'Data Master - Data User'
];

export const DataUserView: React.FC<DataUserViewProps> = ({
  users,
  currentUser,
  onBackToHub,
  onUsersUpdated
}) => {
  const [userList, setUserList] = useState<AppUser[]>(users);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Password visibility map
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureTargetUser, setSignatureTargetUser] = useState<AppUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Lock window scroll so popups appear directly without scroll up/down
  useModalScrollLock(Boolean(userToDelete || isBulkDeleteModalOpen || isSignatureModalOpen));

  // Form states
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPetugas, setFormPetugas] = useState('Pegawai PLN');
  const [formRole, setFormRole] = useState<UserRole>('Petugas Gudang');
  const [formTitle, setFormTitle] = useState('');
  const [formNip, setFormNip] = useState('');
  const [formPassword, setFormPassword] = useState('password123');
  const [formPermissions, setFormPermissions] = useState<string[]>([]);

  // Signature canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Feedback state
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync with prop
  React.useEffect(() => {
    setUserList(users);
  }, [users]);

  const selectedUser = useMemo(() => {
    return userList.find(u => u.id === selectedUserId) || null;
  }, [userList, selectedUserId]);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleOpenAddModal = () => {
    setIsEditModalOpen(false);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = () => {
    if (!selectedUser) return;
    setIsAddModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleUserSavedFromModal = (savedUser: AppUser) => {
    if (isEditModalOpen && selectedUser) {
      updateUser(selectedUser.id, savedUser);
      setFeedback({
        type: 'success',
        message: `Data user "${savedUser.name}" berhasil diperbarui.`
      });
    } else {
      const created = addUser(savedUser);
      setSelectedUserId(created.id);
      setFeedback({
        type: 'success',
        message: `User baru "${created.name}" (@${created.username}) berhasil ditambahkan.`
      });
    }
    const refreshed = getUsers();
    setUserList(refreshed);
    if (onUsersUpdated) onUsersUpdated();
    setTimeout(() => setFeedback(null), 5000);
  };

  // Collective selection helpers
  const isAllSelected = useMemo(() => {
    if (userList.length === 0) return false;
    return userList.every(u => selectedUserIds.includes(u.id));
  }, [userList, selectedUserIds]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(userList.map(u => u.id));
    }
  };

  const toggleSelectUser = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Handle Delete User (In-app modal, fully functional)
  const handleRequestDeleteUser = (targetUser?: AppUser | null) => {
    const toDelete = targetUser || selectedUser;
    if (!toDelete) {
      if (selectedUserIds.length > 0) {
        setIsBulkDeleteModalOpen(true);
      }
      return;
    }
    setUserToDelete(toDelete);
  };

  const handleConfirmDeleteUser = () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      const deletedName = userToDelete.name;
      const success = deleteUser(userToDelete.id);
      if (!success) {
        throw new Error('Tidak dapat menghapus user terakhir dalam sistem.');
      }
      const refreshed = getUsers();
      setUserList(refreshed);
      if (onUsersUpdated) onUsersUpdated();
      if (selectedUserId === userToDelete.id) {
        setSelectedUserId(null);
      }
      setSelectedUserIds(prev => prev.filter(id => id !== userToDelete.id));
      setUserToDelete(null);

      setFeedback({
        type: 'success',
        message: `Akun "${deletedName}" berhasil dihapus dari sistem.`
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Gagal menghapus user: ${err?.message || 'Terjadi kesalahan sistem'}`
      });
      setTimeout(() => setFeedback(null), 5000);
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleConfirmBulkDelete = () => {
    if (selectedUserIds.length === 0) return;
    setIsDeletingBulk(true);
    try {
      const count = selectedUserIds.length;
      const ok = deleteUsers(selectedUserIds);
      if (!ok) {
        throw new Error('Tidak dapat menghapus user terakhir dalam sistem.');
      }
      const refreshed = getUsers();
      setUserList(refreshed);
      if (onUsersUpdated) onUsersUpdated();
      setSelectedUserIds([]);
      setSelectedUserId(null);
      setIsBulkDeleteModalOpen(false);

      setFeedback({
        type: 'success',
        message: `${count} akun pengguna berhasil dihapus dari sistem.`
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Gagal menghapus pengguna: ${err?.message || 'Terjadi kesalahan sistem'}`
      });
      setTimeout(() => setFeedback(null), 5000);
    } finally {
      setIsDeletingBulk(false);
    }
  };

  // Signature canvas handlers
  const handleOpenSignatureModal = (user: AppUser) => {
    setSignatureTargetUser(user);
    setIsSignatureModalOpen(true);
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = '#003399';
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
        }
      }
    }, 100);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleSaveSignature = () => {
    if (!signatureTargetUser || !canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    updateUser(signatureTargetUser.id, {
      signatureUrl: dataUrl
    });
    const refreshed = getUsers();
    setUserList(refreshed);
    if (onUsersUpdated) onUsersUpdated();
    setIsSignatureModalOpen(false);
    setFeedback({
      type: 'success',
      message: `Tanda tangan digital untuk ${signatureTargetUser.name} berhasil disimpan.`
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 max-w-[1400px] mx-auto">
      {/* 1. TOP HEADER matching DATA_USER_80b6c80e.JPG */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-black text-cyan-600 tracking-wider uppercase drop-shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse shadow-sm shadow-cyan-300" />
            <span>• DATA MASTER · AKUN PENGGUNA</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0B2545] tracking-tight drop-shadow-xs">
            Data User
          </h1>
          <p className="text-sm text-slate-700 font-medium drop-shadow-xs">
            Kelola akun, role, fitur aplikasi, dan tanda tangan digital pengguna.
          </p>
        </div>

        {/* Action Controls & Kembali */}
        <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
          {/* Button: + Tambah User */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah User</span>
          </button>

          {/* Button: Edit User */}
          <button
            type="button"
            onClick={handleOpenEditModal}
            disabled={!selectedUser}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              selectedUser
                ? 'bg-slate-800 hover:bg-slate-700 text-white shadow-xs cursor-pointer active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit User</span>
          </button>

          {/* Button: Hapus User / Hapus Kolektif */}
          <button
            type="button"
            onClick={() => {
              if (selectedUserIds.length > 0) {
                setIsBulkDeleteModalOpen(true);
              } else if (selectedUser) {
                handleRequestDeleteUser(selectedUser);
              }
            }}
            disabled={!selectedUser && selectedUserIds.length === 0}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              selectedUser || selectedUserIds.length > 0
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>
              {selectedUserIds.length > 1
                ? `Hapus Kolektif (${selectedUserIds.length})`
                : selectedUserIds.length === 1
                ? 'Hapus Terpilih (1)'
                : 'Hapus User'}
            </span>
          </button>

          {/* Button: Kembali ke Data Master */}
          <button
            type="button"
            onClick={onBackToHub}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-800 bg-white/95 hover:bg-white active:scale-95 border border-white/80 rounded-full shadow-md transition-all cursor-pointer ml-auto sm:ml-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Data Master</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* 2. BOTTOM SECTION: PENGGUNA APLIKASI matching DATA_USER_80b6c80e.JPG */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-7 shadow-xl border border-white/80 space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-600 tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>• PENGGUNA APLIKASI</span>
            </div>
            <h2 className="text-xl font-black text-[#0B2545] mt-0.5">
              Daftar User
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Pilih user atau centang beberapa user untuk Edit atau Hapus Kolektif.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {selectedUserIds.length > 0 && (
              <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                {selectedUserIds.length} dipilih
              </span>
            )}
            {/* Counter matching mockup: 18 user */}
            <span className="text-xs font-bold font-mono text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              {userList.length} user
            </span>
          </div>
        </div>

        {/* 3. TABLE OF USERS matching DATA_USER_80b6c80e.JPG */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-800 text-[11px] font-black uppercase tracking-wider">
                  <th className="py-3.5 px-3.5 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      title="Pilih semua user untuk aksi kolektif"
                    />
                  </th>
                  <th className="py-3.5 px-4 font-bold min-w-[200px]">Nama / Username</th>
                  <th className="py-3.5 px-4 font-bold min-w-[130px]">Petugas</th>
                  <th className="py-3.5 px-4 font-bold min-w-[150px]">Password</th>
                  <th className="py-3.5 px-4 font-bold min-w-[320px]">Role / Hak Akses</th>
                  <th className="py-3.5 px-4 font-bold min-w-[160px] text-center">Tanda Tangan Digital</th>
                  <th className="py-3.5 px-3.5 font-bold w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userList.map((user, idx) => {
                  const isSelected = selectedUserId === user.id;
                  const isPassVisible = Boolean(visiblePasswords[user.id]);
                  const perms = user.permissions && user.permissions.length > 0
                    ? user.permissions
                    : [
                        'Transaksi - Menu Pengambilan Material',
                        'Logbook - Logbook'
                      ];

                  return (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/90 font-medium'
                          : idx % 2 === 1
                          ? 'bg-slate-50/40 hover:bg-slate-50/80'
                          : 'bg-white hover:bg-slate-50/80'
                      }`}
                    >
                      {/* 1. Selection Checkbox */}
                      <td className="py-3.5 px-3.5 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => {
                            toggleSelectUser(user.id);
                            setSelectedUserId(user.id);
                          }}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* 2. Nama / Username */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-slate-900 text-xs">
                          {user.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          @{user.username || user.name.toLowerCase().replace(/\s+/g, '.')}
                        </div>
                      </td>

                      {/* 3. Petugas */}
                      <td className="py-3.5 px-4 text-slate-800 font-semibold">
                        {user.petugas || 'Pegawai PLN'}
                      </td>

                      {/* 4. Password + Tampilkan Button */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-700 tracking-wider">
                            {isPassVisible ? user.password || 'password123' : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              togglePasswordVisibility(user.id);
                            }}
                            className="px-2 py-0.5 text-[10.5px] font-bold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                          >
                            {isPassVisible ? 'Sembunyikan' : 'Tampilkan'}
                          </button>
                        </div>
                      </td>

                      {/* 5. Role / Hak Akses */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-lg">
                          {perms.map((p, pIdx) => {
                            const isApproval = p.includes('Approval');
                            const isTransaksi = p.includes('Transaksi');
                            const isMaster = p.includes('Data Master');
                            return (
                              <span
                                key={pIdx}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md leading-tight ${
                                  isApproval
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : isTransaksi
                                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                    : isMaster
                                    ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {p}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* 6. Tanda Tangan Digital */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {user.signatureUrl ? (
                          <div
                            onClick={e => {
                              e.stopPropagation();
                              handleOpenSignatureModal(user);
                            }}
                            className="inline-flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-blue-400 cursor-pointer"
                            title="Klik untuk mengubah tanda tangan digital"
                          >
                            <img
                              src={user.signatureUrl}
                              alt="Tanda Tangan"
                              className="h-6 w-auto max-w-[80px] object-contain"
                            />
                            <span className="text-[10px] text-emerald-700 font-bold">Terunggah</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleOpenSignatureModal(user);
                            }}
                            className="text-slate-400 hover:text-blue-600 text-[11px] font-medium hover:underline cursor-pointer"
                            title="Unggah atau gambar tanda tangan"
                          >
                            Belum diunggah
                          </button>
                        )}
                      </td>

                      {/* 7. Aksi (Edit & Hapus) */}
                      <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setFormName(user.name);
                              setFormUsername(user.username || user.name.toLowerCase().replace(/\s+/g, '.'));
                              setFormPetugas(user.petugas || 'Pegawai PLN');
                              setFormRole(user.role);
                              setFormTitle(user.title);
                              setFormNip(user.nip);
                              setFormPassword(user.password || 'password123');
                              setFormPermissions(user.permissions || [
                                'Transaksi - Menu Pengambilan Material',
                                'Logbook - Logbook'
                              ]);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit User"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestDeleteUser(user)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* 4. MODAL: TAMBAH USER / EDIT USER matching mockup tambah_user_48fb9741.png */}
      <TambahUserModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        onUserSaved={handleUserSavedFromModal}
        editUser={isEditModalOpen ? selectedUser : null}
      />

      {/* 5. MODAL: TANDA TANGAN DIGITAL (DRAW CANVAS) */}
      {isSignatureModalOpen && signatureTargetUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Tanda Tangan Digital ({signatureTargetUser.name})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-500">
                Goreskan tanda tangan Anda di area putih di bawah ini:
              </p>

              <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-white overflow-hidden flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={380}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="cursor-crosshair w-full h-[180px]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const canvas = canvasRef.current;
                    if (canvas) {
                      const ctx = canvas.getContext('2d');
                      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                  }}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Hapus / Ulangi
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSignatureModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSignature}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-xs cursor-pointer"
                  >
                    Simpan Tanda Tangan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL KONFIRMASI HAPUS USER (CENTERED IN VIEWPORT - ZERO SCROLL) */}
      {userToDelete && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4 m-auto">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">
                  Hapus Akun Pengguna?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Akun pengguna ini akan dihapus secara permanen dari sistem MARVEL ULP Tanggul.
                </p>
              </div>
            </div>

            {/* User Info Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-xs">
              <div className="font-bold text-slate-900 text-sm">
                {userToDelete.name}
              </div>
              <div className="text-slate-500 font-mono text-[11px]">
                @{userToDelete.username || userToDelete.name.toLowerCase().replace(/\s+/g, '.')} · {userToDelete.role}
              </div>
              <div className="text-slate-600 text-[11px] pt-0.5">
                {userToDelete.title || userToDelete.nip}
              </div>
              {currentUser && userToDelete.id === currentUser.id && (
                <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] leading-relaxed">
                  <strong>Perhatian:</strong> Anda sedang menghapus akun yang sedang aktif digunakan. Anda akan dialihkan ke halaman login setelah akun ini berhasil dihapus.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeletingUser}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={isDeletingUser}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingUser ? 'Menghapus...' : 'Ya, Hapus Akun'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 7. MODAL KONFIRMASI HAPUS USER KOLEKTIF (CENTERED IN VIEWPORT - ZERO SCROLL) */}
      {isBulkDeleteModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4 m-auto">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">
                  Hapus {selectedUserIds.length} Pengguna Terpilih?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Akun pengguna yang dipilih akan dihapus secara permanen dari daftar master sistem.
                </p>
              </div>
            </div>

            {/* List preview with scroll */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 max-h-48 overflow-y-auto text-xs">
              {selectedUserIds.map(id => {
                const u = userList.find(item => item.id === id);
                if (!u) return null;
                return (
                  <div key={id} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-none text-[11px]">
                    <span className="font-bold text-slate-800 truncate mr-2">{u.name}</span>
                    <span className="text-slate-500 font-mono text-[10px] shrink-0">{u.role}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                disabled={isDeletingBulk}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                disabled={isDeletingBulk}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingBulk ? 'Menghapus...' : `Ya, Hapus (${selectedUserIds.length})`}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
