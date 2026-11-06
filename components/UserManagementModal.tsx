import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, ShieldCheck, UserCheck, X, AlertCircle, Building2 } from 'lucide-react';
import { AppUser, UserRole, Company } from '../types';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  getApiUrl: (path: string) => string;
  companies?: Company[];
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  getApiUrl,
  companies = []
}) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New user form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [title, setTitle] = useState('İşyeri Hekimi');
  const [pinCode, setPinCode] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedCompanyName, setSelectedCompanyName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('vps_session_token');
      const res = await fetch(getApiUrl('/api/users'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        const err = await res.json();
        setError(err.error || "Kullanıcılar yüklenemedi.");
      }
    } catch (e: any) {
      setError(e.message || "Ağ hatası.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !name.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('vps_session_token');
      const res = await fetch(getApiUrl('/api/users'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          name: name.trim(),
          role,
          title: title.trim(),
          pinCode: pinCode.trim(),
          companyId: role === 'company_rep' ? selectedCompanyId : undefined,
          companyName: role === 'company_rep' ? selectedCompanyName : undefined
        })
      });

      if (res.ok) {
        setUsername('');
        setPassword('');
        setName('');
        setRole('user');
        setTitle('İşyeri Hekimi');
        setPinCode('');
        setSelectedCompanyId('');
        setSelectedCompanyName('');
        fetchUsers();
      } else {
        const err = await res.json();
        setError(err.error || "Kullanıcı oluşturulamadı.");
      }
    } catch (e: any) {
      setError(e.message || "Ağ hatası.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, uname: string) => {
    if (!confirm(`'${uname}' isimli kullanıcıyı silmek istediğinize emin misiniz?`)) return;

    try {
      const token = localStorage.getItem('vps_session_token');
      const res = await fetch(getApiUrl(`/api/users/${id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || "Kullanıcı silinemedi.");
      }
    } catch (e: any) {
      alert("Ağ hatası.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Kullanıcı Yönetimi (Sınırsız Kullanıcı)</h2>
              <p className="text-xs text-slate-400">Sertifika üretimi yapacak İSG uzmanlarını ve yöneticileri yönetin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* New User Form */}
          <form onSubmit={handleCreateUser} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <UserPlus size={14} />
              <span>Yeni Kullanıcı Ekle</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Adı Soyadı</label>
                <input
                  type="text"
                  placeholder="Örn: Ahmet Yılmaz"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Kullanıcı Adı (Giriş İçin)</label>
                <input
                  type="text"
                  placeholder="Örn: ahmet.yilmaz"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Giriş Şifresi</label>
                <input
                  type="password"
                  placeholder="Şifre belirleyin..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Kullanıcı Rolü</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="user">Sağlık Personeli / İSG Uzmanı</option>
                  <option value="company_rep">Firma Temsilcisi / Müşteri İK (Sadece Kendi Firmasını Görür)</option>
                  <option value="admin">Yönetici (Tam Yetkili)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Mesleki Ünvan</label>
                <input
                  type="text"
                  placeholder="Örn: İşyeri Hekimi, Diğer Sağlık Personeli"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-teal-400 mb-1">Saha Tablet PIN Şifresi (4-6 Rakam)</label>
                <input
                  type="text"
                  maxLength={8}
                  placeholder="Örn: 1234"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-900 border border-teal-500/50 rounded-lg px-3 py-2 text-xs font-mono font-bold text-teal-300 focus:outline-none focus:border-teal-400"
                />
              </div>

              {role === 'company_rep' && (
                <div className="col-span-1 sm:col-span-2 bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl space-y-1.5">
                  <label className="block text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                    <Building2 size={13} /> Temsil Edilecek Müşteri Firması
                  </label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedCompanyId(id);
                      const found = companies.find(c => c.id === id);
                      setSelectedCompanyName(found ? (found.shortName || found.name) : '');
                    }}
                    required
                    className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="">-- Firma Seçiniz --</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400">Bu kullanıcı giriş yaptığında yalnızca bu firmanın personellerini, sertifikalarını ve belgelerini görebilir.</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition flex items-center gap-1.5 shadow"
              >
                <UserPlus size={14} />
                <span>{submitting ? 'Ekleniyor...' : 'Kullanıcıyı Kaydet'}</span>
              </button>
            </div>
          </form>

          {/* Users List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-white">Sistemdeki Kullanıcılar ({users.length})</span>
              <span>Yönetici: admin (Varsayılan)</span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-500 text-xs">Yükleniyor...</div>
            ) : users.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                Henüz özel kullanıcı eklenmemiş. Sistemde sadece ana yönetici (admin) bulunuyor.
              </div>
            ) : (
              <div className="space-y-2">
                {users.map(u => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        u.role === 'admin' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {u.role === 'admin' ? <ShieldCheck size={16} /> : <UserCheck size={16} />}
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs flex items-center gap-2">
                          <span>{u.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                            u.role === 'admin' ? 'bg-amber-500/15 text-amber-400' : (u.role === 'company_rep' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' : 'bg-blue-500/15 text-blue-400')
                          }`}>
                            {u.role === 'admin' ? 'Yönetici' : (u.role === 'company_rep' ? `Firma İK (${u.companyName || 'Atanmış Firma'})` : 'İSG Uzmanı')}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                          <span>@{u.username}</span>
                          {u.title && <span className="text-slate-400">({u.title})</span>}
                          {u.pinCode && (
                            <span className="bg-teal-500/15 text-teal-300 px-1.5 py-0.2 rounded text-[10px] font-bold border border-teal-500/30">
                              PIN: {u.pinCode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteUser(u.id, u.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                      title="Kullanıcıyı Sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
