import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AppUser, UserRole } from '../types/warehouse';
import { getUsers, addUser, updateUser, deleteUser, resetUsers } from '../utils/authStore';
import { useModalScrollLock } from '../utils/modalScrollLock';
import { Users, UserPlus, Edit3, Trash2, Shield, ClipboardCheck, Smartphone, CheckCircle2, AlertCircle, X, RotateCcw } from 'lucide-react';
import { TambahUserModal } from './TambahUserModal';

interface UserManagementViewProps {
  currentUser: AppUser;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<AppUser[]>(() => getUsers());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Lock window scroll so modals appear directly without scroll up/down
  useModalScrollLock(Boolean(userToDelete || isResetConfirmOpen || isModalOpen));

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('Petugas Gudang');
  const [title, setTitle] = useState('');
  const [nip, setNip] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const refreshUsers = () => {
    setUsers(getUsers());
  };

  const handleOpenAddModal = () => {
    setEditingUserId(null);
    setName('');
    setRole('Petugas Gudang');
    setTitle('Petugas Pelaksana Operasional Gudang');
    setNip('DI-0' + Math.floor(1000 + Math.random() * 9000));
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: AppUser) => {
    setEditingUserId(user.id);
    setName(user.name);
    setRole(user.role);
    setTitle(user.title);
    setNip(user.nip);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Harap isi Nama Lengkap');
      return;
    }
    if (!nip.trim()) {
      setErrorMsg('Harap isi NIP / ID Petugas');
      return;
    }

    if (editingUserId) {
      updateUser(editingUserId, { name, role, title, nip });
      setSuccessMsg(`Data pengguna "${name}" berhasil diperbarui.`);
    } else {
      addUser({ name, role, title, nip });
      setSuccessMsg(`Pengguna baru "${name}" berhasil ditambahkan.`);
    }

    refreshUsers();
    setIsModalOpen(false);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDelete = (user: AppUser) => {
    setUserToDelete(user);
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    const ok = deleteUser(userToDelete.id);
    if (ok) {
      refreshUsers();
      setSuccessMsg(`Pengguna "${userToDelete.name}" berhasil dihapus.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg('Tidak dapat menghapus user terakhir dalam sistem.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
    setUserToDelete(null);
  };

  const handleReset = () => {
    setIsResetConfirmOpen(true);
  };

  const handleConfirmReset = () => {
    resetUsers();
    refreshUsers();
    setIsResetConfirmOpen(false);
    setSuccessMsg('Daftar pengguna telah direset ke default.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const countMULP = users.filter(u => u.role === 'MULP').length;
  const countAdmin = users.filter(u => u.role === 'Admin Gudang').length;
  const countPetugas = users.filter(u => u.role === 'Petugas Gudang').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Kelola Pengguna Sistem (Admin User)
            </h2>
            <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
              Khusus MULP
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tambah, perbarui, dan hapus akun pengguna yang dapat login ke aplikasi Gudang PLN ULP Tanggul
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
            title="Reset ke akun default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Default</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengguna</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Role Summary Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">{countMULP}</div>
              <div className="text-[11px] text-slate-500">Manager ULP (Penyetuju)</div>
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-100 text-sky-800 rounded-lg">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">{countAdmin}</div>
              <div className="text-[11px] text-slate-500">Admin Gudang (Verifikator)</div>
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">{countPetugas}</div>
              <div className="text-[11px] text-slate-500">Petugas Gudang (Mobile)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Peran (Role)</th>
                <th className="py-3 px-4">Jabatan / Judul</th>
                <th className="py-3 px-4">NIP / ID Petugas</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(user => {
                const isMULP = user.role === 'MULP';
                const isAdmin = user.role === 'Admin Gudang';
                const isPetugas = user.role === 'Petugas Gudang';
                const isMe = user.id === currentUser.id;

                return (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{user.name}</span>
                        {isMe && (
                          <span className="text-[10px] font-semibold bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded">
                            Anda
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isMULP
                            ? 'bg-amber-100 text-amber-900'
                            : isAdmin
                            ? 'bg-sky-100 text-sky-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {isMULP ? (
                          <Shield className="w-3 h-3" />
                        ) : isAdmin ? (
                          <ClipboardCheck className="w-3 h-3" />
                        ) : (
                          <Smartphone className="w-3 h-3" />
                        )}
                        <span>{user.role}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {user.title}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 font-medium">
                      {user.nip}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          title="Edit Pengguna"
                          className="p-1.5 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {!isMe && (
                          <button
                            onClick={() => handleDelete(user)}
                            title="Hapus Pengguna"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal matching mockup tambah_user_48fb9741.png */}
      <TambahUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserSaved={savedUser => {
          if (editingUserId) {
            updateUser(editingUserId, savedUser);
            setSuccessMsg(`Data pengguna "${savedUser.name}" berhasil diperbarui.`);
          } else {
            addUser(savedUser);
            setSuccessMsg(`Pengguna baru "${savedUser.name}" berhasil ditambahkan.`);
          }
          refreshUsers();
          setIsModalOpen(false);
          setTimeout(() => setSuccessMsg(''), 4000);
        }}
        editUser={editingUserId ? users.find(u => u.id === editingUserId) : null}
      />

      {/* Delete User In-App Modal (CENTERED IN VIEWPORT - ZERO SCROLL) */}
      {userToDelete && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4 m-auto">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">
                  Hapus Pengguna Sistem?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Pengguna ini akan dihapus secara permanen dari sistem MARVEL ULP Tanggul.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-xs">
              <div className="font-bold text-slate-900 text-sm">
                {userToDelete.name}
              </div>
              <div className="text-slate-500 font-mono text-[11px]">
                {userToDelete.nip} · {userToDelete.role}
              </div>
              <div className="text-slate-600 text-[11px] pt-0.5">
                {userToDelete.title}
              </div>
              {currentUser && userToDelete.id === currentUser.id && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px]">
                  Peringatan: Anda sedang menghapus akun yang sedang aktif. Anda akan otomatis logout setelah akun ini dihapus.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Pengguna</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Reset Confirmation Modal (CENTERED IN VIEWPORT - ZERO SCROLL) */}
      {isResetConfirmOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4 m-auto">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">
                  Reset ke Akun Default?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Semua pengguna kustom akan dihapus dan dikembalikan ke daftar 18 akun default PLN.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 active:scale-95 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ya, Reset Pengguna</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
