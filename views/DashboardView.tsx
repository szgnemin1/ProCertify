import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, 
  AlertTriangle, 
  Clock, 
  Search, 
  ExternalLink, 
  Building2, 
  RefreshCw,
  Plus,
  Pencil,
  X
} from 'lucide-react';
import { IssuedCertificate, DashboardStats } from '../types';
import { getCertificateStatus, getDaysRemaining, getStatusBadge, formatDateTR } from '../services/validityService';

interface DashboardViewProps {
  onNavigateToFill: () => void;
  onNavigateToCompany: (companyName: string) => void;
  onEditCertificate?: (cert: IssuedCertificate) => void;
  onOpenEmployee?: (tcOrName: string) => void;
  getApiUrl: (path: string) => string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToFill,
  onNavigateToCompany,
  onEditCertificate,
  onOpenEmployee,
  getApiUrl
}) => {
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    expired: 0,
    expiringSoon: 0,
    valid: 0
  });
  const [certificates, setCertificates] = useState<IssuedCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'expired' | 'expiring' | 'valid'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('vps_session_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Fetch stats
      const statsRes = await fetch(getApiUrl('/api/stats/dashboard'), { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch certificates (all or filtered)
      const certsRes = await fetch(getApiUrl('/api/certificates'), { headers });
      if (certsRes.ok) {
        const certsData = await certsRes.json();
        setCertificates(certsData || []);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filter certificates according to active filter card & search term
  const filteredCertificates = certificates.filter(cert => {
    const status = getCertificateStatus(cert.expiryDate);

    if (filterMode === 'expired' && status !== 'expired') return false;
    if (filterMode === 'expiring' && status !== 'expiring_soon') return false;
    if (filterMode === 'valid' && status !== 'valid') return false;

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const name = (cert.recipientName || '').toLowerCase();
      const tc = (cert.recipientTc || '').toLowerCase();
      const comp = (cert.company || '').toLowerCase();
      const serial = (cert.serialNo || '').toLowerCase();
      return name.includes(q) || tc.includes(q) || comp.includes(q) || serial.includes(q);
    }

    return true;
  });

  // If viewing 'all' without search, default to top 15 (compact allows 15 cleanly)
  const displayedCertificates = (filterMode === 'all' && !searchTerm.trim()) 
    ? filteredCertificates.slice(0, 15) 
    : filteredCertificates;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-3 sm:p-4 space-y-3 custom-scrollbar">
      {/* Üst Bar: Kompakt Başlık, Yenile & Yeni Sertifika */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <FileCheck2 className="text-amber-400 shrink-0" size={20} />
          <div>
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
              İSG Eğitim & Sertifika Takip Paneli
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Geçerlilik süreleri, yenileme takibi ve düzenlenen sertifikalar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={fetchDashboardData}
            title="Yenile"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={onNavigateToFill}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg shadow-md shadow-amber-500/20 transition text-xs active:scale-95"
          >
            <Plus size={15} />
            <span>Yeni Sertifika Hazırla</span>
          </button>
        </div>
      </div>

      {/* 3 YAN YANA KOMPAKT İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* KUTU 1: TOPLAM SERTİFİKA */}
        <div
          onClick={() => setFilterMode('all')}
          className={`cursor-pointer rounded-xl p-3 border transition-all duration-150 shadow-sm ${
            filterMode === 'all'
              ? 'bg-slate-900 border-blue-500/60 ring-1 ring-blue-500/30'
              : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Toplam Sertifika
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileCheck2 size={15} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white tracking-tight">
              {loading ? '...' : stats.total}
            </span>
            <span className="text-[11px] text-slate-400">adet</span>
          </div>
        </div>

        {/* KUTU 2: GEÇERLİLİK TARİHİ GEÇENLER */}
        <div
          onClick={() => setFilterMode('expired')}
          className={`cursor-pointer rounded-xl p-3 border transition-all duration-150 shadow-sm ${
            filterMode === 'expired'
              ? 'bg-red-950/40 border-red-500/60 ring-1 ring-red-500/30'
              : 'bg-slate-900/70 border-slate-800 hover:border-red-500/40 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">
              Süresi Dolanlar
            </span>
            <div className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle size={15} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-400 tracking-tight">
              {loading ? '...' : stats.expired}
            </span>
            <span className="text-[11px] text-red-300/70">yenilenmeli</span>
          </div>
        </div>

        {/* KUTU 3: GEÇERLİLİK TARİHİ YAKLAŞANLAR (<= 30 GÜN) */}
        <div
          onClick={() => setFilterMode('expiring')}
          className={`cursor-pointer rounded-xl p-3 border transition-all duration-150 shadow-sm ${
            filterMode === 'expiring'
              ? 'bg-amber-950/40 border-amber-500/60 ring-1 ring-amber-500/30'
              : 'bg-slate-900/70 border-slate-800 hover:border-amber-500/40 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              Yaklaşanlar (≤ 30 Gün)
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock size={15} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400 tracking-tight">
              {loading ? '...' : stats.expiringSoon}
            </span>
            <span className="text-[11px] text-amber-300/70">yakında bitecek</span>
          </div>
        </div>
      </div>

      {/* ARAMA VE FİLTRELEME ÇUBUĞU */}
      <div className="bg-slate-900/90 border border-slate-800/90 px-3 py-2 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Arama Alanı */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="İsim, TC No, Seri No veya Firma..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-7 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Hızlı Filtre Butonları */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              filterMode === 'all'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Tümü
          </button>

          <button
            onClick={() => setFilterMode('valid')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              filterMode === 'valid'
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                : 'bg-slate-800/70 text-slate-400 hover:text-emerald-300'
            }`}
          >
            Geçerli
          </button>

          <button
            onClick={() => setFilterMode('expiring')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              filterMode === 'expiring'
                ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                : 'bg-slate-800/70 text-slate-400 hover:text-amber-300'
            }`}
          >
            Yaklaşanlar ({stats.expiringSoon})
          </button>

          <button
            onClick={() => setFilterMode('expired')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              filterMode === 'expired'
                ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                : 'bg-slate-800/70 text-slate-400 hover:text-red-300'
            }`}
          >
            Süresi Dolanlar ({stats.expired})
          </button>

          <span className="text-[11px] text-slate-400 ml-1 font-mono">
            {displayedCertificates.length} {filterMode === 'all' && !searchTerm.trim() ? '(Son 15)' : 'kayıt'}
          </span>
        </div>
      </div>

      {/* SERTİFİKA TABLOSU (Kompakt, Ekrana Tam Sığar, Yatay Kaydırma Yapmaz) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        {loading ? (
          <div className="py-10 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-amber-500" />
            <span>Sertifikalar yükleniyor...</span>
          </div>
        ) : displayedCertificates.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-xs p-4">
            <FileCheck2 size={28} className="mx-auto mb-2 text-slate-600 stroke-[1.5]" />
            <div className="font-semibold text-slate-400">
              {searchTerm.trim() || filterMode !== 'all' 
                ? 'Arama kriterlerinize uygun sertifika bulunamadı.' 
                : 'Henüz kayıtlı bir sertifika bulunmuyor.'}
            </div>
            {(searchTerm.trim() || filterMode !== 'all') && (
              <button
                onClick={() => { setSearchTerm(''); setFilterMode('all'); }}
                className="mt-2 text-xs text-amber-400 hover:underline inline-flex items-center gap-1 font-semibold"
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2 px-2.5 w-28 font-mono">Seri No</th>
                  <th className="py-2 px-2.5">Alıcı (Kişi Adı & Eğitimler)</th>
                  <th className="py-2 px-2 w-44">Firma</th>
                  <th className="py-2 px-2 w-24">Eğitim Trh</th>
                  <th className="py-2 px-2 w-24">Bitiş Trh</th>
                  <th className="py-2 px-2 w-28">Durum</th>
                  <th className="py-2 px-2 w-16 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-medium text-xs">
                {displayedCertificates.map(cert => {
                  const status = getCertificateStatus(cert.expiryDate);
                  const daysLeft = getDaysRemaining(cert.expiryDate);
                  const badge = getStatusBadge(status, daysLeft);

                  return (
                    <tr key={cert.serialNo} className="hover:bg-slate-800/60 transition-colors duration-100">
                      {/* Seri No */}
                      <td className="py-2 px-2.5 font-mono text-slate-300 font-semibold text-[11px] truncate">
                        {cert.serialNo}
                      </td>

                      {/* Alıcı ve Eğitim Rozetleri (İsme tıklandığında Çalışan Kartı açılır) */}
                      <td className="py-2 px-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {onOpenEmployee ? (
                            <button
                              type="button"
                              onClick={() => onOpenEmployee(cert.recipientTc || cert.recipientName || '')}
                              className="font-bold text-white text-xs hover:text-amber-400 hover:underline transition text-left cursor-pointer"
                              title="Çalışan Kartını Aç"
                            >
                              {cert.recipientName || 'İsimsiz Alıcı'}
                            </button>
                          ) : (
                            <span className="font-bold text-white text-xs">
                              {cert.recipientName || 'İsimsiz Alıcı'}
                            </span>
                          )}
                          {cert.recipientTc && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              ({cert.recipientTc})
                            </span>
                          )}
                        </div>

                        {cert.projects && Array.isArray(cert.projects) && cert.projects.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {cert.projects.map((p, pIdx) => (
                              <span key={pIdx} className="text-[9px] bg-slate-800/90 text-amber-300/90 px-1.5 py-0.2 rounded border border-slate-700/80">
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Firma */}
                      <td className="py-2 px-2 truncate">
                        {cert.company ? (
                          <button
                            onClick={() => onNavigateToCompany(cert.company)}
                            className="text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 text-xs truncate max-w-full"
                            title={`Firma Detayı: ${cert.company}`}
                          >
                            <Building2 size={12} className="shrink-0" />
                            <span className="truncate">{cert.company}</span>
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Eğitim Tarihi */}
                      <td className="py-2 px-2 text-slate-300 text-[11px] truncate">
                        {cert.trainingDate || (cert.date ? formatDateTR(new Date(cert.date)) : '-')}
                      </td>

                      {/* Geçerlilik Bitiş Tarihi */}
                      <td className="py-2 px-2 text-slate-200 font-semibold text-[11px] truncate">
                        {cert.expiryDate ? formatDateTR(new Date(cert.expiryDate)) : '-'}
                      </td>

                      {/* Durum */}
                      <td className="py-2 px-2 truncate">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>

                      {/* İşlem (Düzenle & Doğrula Butonları) */}
                      <td className="py-2 px-2 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          {onEditCertificate && (
                            <button
                              type="button"
                              onClick={() => onEditCertificate(cert)}
                              title="Sertifikayı Düzenle / Doldur Ekranına Yükle"
                              className="p-1 rounded-md text-slate-400 hover:text-amber-400 hover:bg-slate-700/60 transition"
                            >
                              <Pencil size={13} />
                            </button>
                          )}
                          <a
                            href={`/dogrula?id=${cert.serialNo}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Sertifikayı Doğrula"
                            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/60 transition"
                          >
                            <ExternalLink size={13} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
