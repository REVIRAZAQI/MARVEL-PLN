import React, { useState, useEffect } from 'react';
import { AppUser, UserRole } from '../types/warehouse';
import { getUsers, setCurrentUser } from '../utils/authStore';
import { X, UserCheck, Shield, ClipboardCheck, ArrowRight, Smartphone } from 'lucide-react';
import { useModalScrollLock } from '../utils/modalScrollLock';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  onSelectRole: (role: UserRole) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectRole
}) => {
  useModalScrollLock(isOpen);
  const [users, setUsers] = useState<AppUser[]>(() => getUsers());

  useEffect(() => {
    const handleUpdate = () => setUsers(getUsers());
    window.addEventListener('pln-users-updated', handleUpdate);
    return () => window.removeEventListener('pln-users-updated', handleUpdate);
  }, []);

  if (!isOpen) return null;

  const handleChoose = (user: AppUser) => {
    setCurrentUser(user);
    onSelectRole(user.role);
    onClose();
  };


  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden m-auto">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-sky-800 to-sky-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center font-bold text-lg text-amber-300">
              PLN
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Pilih Akun / Menu Login
              </h3>
              <p className="text-xs text-sky-200">
                Sistem Monitoring Gudang PLN ULP Tanggul
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-sky-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Roles List */}
        <div className="p-6 space-y-3 text-xs">
          <p className="text-slate-600 font-medium">
            Silakan pilih hak akses peran pengguna di bawah ini untuk menguji menu dan fitur:
          </p>

          {users.map(user => {
            const isCurrent = currentUser?.id === user.id;
            const isPetugas = user.role === 'Petugas Gudang';
            const isAdmin = user.role === 'Admin Gudang';
            const isMULP = user.role === 'MULP';


            return (
              <div
                key={user.id}
                onClick={() => handleChoose(user)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                  isCurrent
                    ? 'border-sky-500 bg-sky-50/70 shadow-xs'
                    : 'border-slate-200 hover:border-sky-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isMULP
                        ? 'bg-amber-100 text-amber-800'
                        : isAdmin
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isMULP ? (
                      <Shield className="w-5 h-5" />
                    ) : isAdmin ? (
                      <ClipboardCheck className="w-5 h-5" />
                    ) : (
                      <Smartphone className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {user.role}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] bg-sky-200 text-sky-900 px-2 py-0.5 rounded-full font-semibold">
                          Sedang Aktif
                        </span>
                      )}
                      {isPetugas && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                          Mobile Langsung
                        </span>
                      )}
                    </div>
                    <div className="text-slate-700 font-medium mt-0.5">{user.name}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {user.title} · {user.nip}
                    </div>
                  </div>
                </div>

                <div className="p-2 rounded-lg text-slate-400 group-hover:text-sky-700 group-hover:bg-sky-100/50 transition-colors shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Login instan untuk kemudahan verifikasi & operasional</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
