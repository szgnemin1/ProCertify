import React, { useState } from 'react';
import { ShieldCheck, User, Lock, KeyRound, ArrowRight, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: { id: string; username: string; role: UserRole; name: string }) => void;
  getApiUrl: (path: string) => string;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  getApiUrl
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAdminTab, setIsAdminTab] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        username: isAdminTab ? 'admin' : username.trim(),
        password: password.trim()
      };

      const res = await fetch(getApiUrl('/api/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success && data.token) {
        localStorage.setItem('vps_session_token', data.token);
        localStorage.setItem('vps_session', 'authenticated');
        if (data.user) {
          localStorage.setItem('vps_user_info', JSON.stringify(data.user));
          onLoginSuccess(data.user);
        } else {
          const fallbackUser = { id: 'admin', username: 'admin', role: 'admin' as UserRole, name: 'Sistem Yöneticisi' };
          localStorage.setItem('vps_user_info', JSON.stringify(fallbackUser));
          onLoginSuccess(fallbackUser);
        }
      } else {
        setError(data.error || "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
      }
    } catch (err: any) {
      setError("Sunucuya bağlanılamadı. Lütfen bağlantınızı kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Brand */}
        <div className="text-center space-y-2 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 mx-auto flex items-center justify-center font-black text-slate-950 text-2xl shadow-xl shadow-amber-500/20">
            PC
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">ProCertify Studio</h1>
          <p className="text-xs text-slate-400 font-medium">İSG & Eğitim Takip Sistemi</p>
        </div>

        {/* Tab Selector: User vs Admin */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setIsAdminTab(false); setError(null); }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              !isAdminTab ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <User size={14} />
            <span>İSG Uzmanı Girişi</span>
          </button>
          <button
            type="button"
            onClick={() => { setIsAdminTab(true); setError(null); }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              isAdminTab ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck size={14} />
            <span>Yönetici Girişi</span>
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isAdminTab && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Kullanıcı adınızı girin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={!isAdminTab}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                {isAdminTab ? 'Yönetici Şifresi' : 'Şifre'}
              </label>
              {isAdminTab && (
                <span className="text-[10px] text-slate-500">Varsayılan: 159357Vp!!</span>
              )}
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                placeholder={isAdminTab ? "Yönetici şifresini girin" : "Şifrenizi girin"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-200 mt-2 shadow-lg ${
              isAdminTab
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
            }`}
          >
            <span>{loading ? 'Giriş Yapılıyor...' : 'Sisteme Giriş Yap'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
          ProCertify Studio &copy; {new Date().getFullYear()} • Güvenli İSG Sertifika Platformu
        </div>
      </div>
    </div>
  );
};
