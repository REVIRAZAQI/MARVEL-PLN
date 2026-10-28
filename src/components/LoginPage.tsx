import React, { useState, useEffect } from 'react';
import { AppUser } from '../types/warehouse';
import { getUsers, setCurrentUser } from '../utils/authStore';
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: AppUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [users, setUsers] = useState<AppUser[]>(() => getUsers());
  const [username, setUsername] = useState('superuser');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleUpdate = () => {
      setUsers(getUsers());
    };
    window.addEventListener('pln-users-updated', handleUpdate);
    return () => window.removeEventListener('pln-users-updated', handleUpdate);
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const inputUser = username.trim().toLowerCase();
    const inputPass = password.trim();

    if (!inputUser) {
      setErrorMsg('Harap masukkan username.');
      return;
    }

    if (!inputPass) {
      setErrorMsg('Harap masukkan password.');
      return;
    }

    // Ambil daftar user terbaru dari Data User
    const currentUsers = getUsers();
    setUsers(currentUsers);

    // 1. Cari user yang cocok berdasarkan username, nama, atau NIP di Data User
    const cleanInput = inputUser.startsWith('@') ? inputUser.slice(1) : inputUser;
    const matchedUser = currentUsers.find(u => {
      const uName = (u.username || '').trim().toLowerCase();
      const fullName = (u.name || '').trim().toLowerCase();
      const nip = (u.nip || '').trim().toLowerCase();

      return uName === cleanInput || fullName === cleanInput || nip === cleanInput;
    });

    if (!matchedUser) {
      setErrorMsg('Username tidak terdaftar pada Data User. Silakan periksa kembali.');
      return;
    }

    // 2. Samakan password dengan yang tertera pada Data User
    const registeredPassword = matchedUser.password || 'password123';
    if (inputPass !== registeredPassword) {
      setErrorMsg('Password salah! Masukkan password yang terdaftar pada Data User.');
      return;
    }

    // Jika username dan password cocok, set user aktif dan lanjutkan masuk
    setCurrentUser(matchedUser);
    onLoginSuccess(matchedUser);
  };

  return (
    <div
      className="min-h-screen w-full relative flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat font-sans overflow-hidden transition-all duration-500 animate-in fade-in"
      style={{
        backgroundImage: `url('/assets/aistudio/login-background_306ad1f5.png')`
      }}
    >
      {/* Main Glass Card matching template - Compact & Sleek */}
      <div className="relative z-10 w-full max-w-[330px] sm:max-w-[345px] bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/80 shadow-2xl p-5 sm:p-6 flex flex-col items-center animate-in zoom-in-95 duration-300">
        {/* Brand Logo & Monogram */}
        <div className="flex flex-col items-center text-center mb-4">
          <img
            src="/assets/aistudio/marvel_logo_clean.png"
            alt="MARVEL - Material Akuntabel Resik Visible Cepat Lengkap"
            className="w-24 sm:w-28 h-auto object-contain mb-1.5 select-none pointer-events-none"
          />
          <p className="text-[11px] font-semibold text-slate-500 tracking-tight leading-tight">
            Material Akuntabel Resik Visible Cepat Lengkap
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="w-full space-y-2.5">
          {errorMsg && (
            <div className="text-[11px] text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2 text-center font-medium">
              {errorMsg}
            </div>
          )}

          {/* Username Input matching Gambar 1 */}
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-blue-500">
              <User className="w-3.5 h-3.5 stroke-[2.2]" />
            </span>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
              required
            />
          </div>

          {/* Password Input matching Gambar 1 */}
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-blue-500">
              <Lock className="w-3.5 h-3.5 stroke-[2.2]" />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-1"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            className="w-full mt-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0080ff] via-[#3b82f6] to-[#7c3aed] hover:from-blue-700 hover:to-purple-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-between group active:scale-[0.99] cursor-pointer"
          >
            <span className="flex-1 text-center font-bold tracking-wide">
              Masuk ke MARVEL
            </span>
            <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[#7c3aed] group-hover:scale-105 transition-all shadow-sm shrink-0">
              <ArrowRight className="w-3 h-3 stroke-[2.5]" />
            </span>
          </button>

          {/* Information Notice */}
          <p className="text-[10px] text-slate-400 text-center pt-0.5 font-medium leading-tight">
            Username &amp; Password terdaftar dapat dikelola melalui <strong>Data Master &gt; Data User</strong>.
          </p>
        </form>
      </div>

      {/* Watermark Bottom Left matching Gambar 1 */}
      <div className="absolute bottom-4 left-6 text-[10px] font-bold tracking-widest text-slate-400 uppercase select-none drop-shadow-xs">
        MARVEL ULP TANGGUL
      </div>
    </div>
  );
};
