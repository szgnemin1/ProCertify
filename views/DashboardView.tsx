import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, 
  AlertTriangle, 
  Clock, 
  Search, 
  ExternalLink, 
  Calendar, 
  Building2, 
  UserCheck, 
  CheckCircle2, 
  Filter,
  RefreshCw,
  Plus
} from 'lucide-react';
import { IssuedCertificate, DashboardStats } from '../types';
import { getCertificateStatus, getDaysRemaining, getStatusBadge, formatDateTR, parseCustomDate } from '../services/validityService';

interface DashboardViewProps {
  onNavigateToFill: () => void;
  onNavigateToCompany: (companyName: string) => void;
  getApiUrl: (path: string) => string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToFill,
  onNavigateToCompany,
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

  // If viewing 'all' without search, default to top 10
  const displayedCertificates = (filterMode === 'all' && !searchTerm.trim()) 
    ? filteredCertificates.slice(0, 10) 
    : filteredCertificates;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6 custom-scrollbar">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            İSG Eğitim & Sertifika Takip Paneli
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Geçerlilik süreleri, yenileme takibi ve son üretilen sertifikalar
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            title="Yenile"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition shadow-sm"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={onNavigateToFill}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition duration-200 text-sm"
          >
            <Plus size={18} />
            <span>Yeni Sertifika Hazırla</span>
          </button>
        </div>
      </div>

      {/* 3 YAN YANA İSTATİSTİK KUTUSU */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KUTU 1: TOPLAM SERTİFİKA */}
        <div
          onClick={() => setFilterMode('all')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg relative overflow-hidden ${
            filterMode === 'all'
              ? 'bg-slate-900 border-blue-500/60 ring-2 ring-blue-500/20'
              : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Toplam Sertifika
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileCheck2 size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white tracking-tight">
              {loading ? '...' : stats.total}
            </span>
            <span className="text-xs text-slate-400 font-medium">adet düzenlendi</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-400 font-medium">
            <span>Tüm sertifikaları listele</span>
            <span className="text-[10px]">→</span>
          </div>
        </div>

        {/* KUTU 2: GEÇERLİLİK TARİHİ GEÇENLER */}
        <div
          onClick={() => setFilterMode('expired')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg relative overflow-hidden ${
            filterMode === 'expired'
              ? 'bg-red-950/40 border-red-500/60 ring-2 ring-red-500/20'
              : 'bg-slate-900/70 border-slate-800 hover:border-red-500/40 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-400">
              Geçerlilik Süresi Dolanlar
            </span>
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-red-400 tracking-tight">
              {loading ? '...' : stats.expired}
            </span>
            <span className="text-xs text-red-300/70 font-medium">yenilenmesi gereken</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-red-400 font-medium">
            <span>Süresi geçenleri filtrele</span>
            <span className="text-[10px]">→</span>
          </div>
        </div>

        {/* KUTU 3: GEÇERLİLİK TARİHİ YAKLAŞANLAR (<= 30 GÜN) */}
        <div
          onClick={() => setFilterMode('expiring')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg relative overflow-hidden ${
            filterMode === 'expiring'
              ? 'bg-amber-950/40 border-amber-500/60 ring-2 ring-amber-500/20'
              : 'bg-slate-900/70 border-slate-800 hover:border-amber-500/40 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Süresi Yaklaşanlar (≤ 30 Gün)
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400 tracking-tight">
              {loading ? '...' : stats.expiringSoon}
            </span>
            <span className="text-xs text-amber-300/70 font-medium">yakında bitecek</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-400 font-medium">
            <span>Yaklaşanları incele</span>
            <span className="text-[10px]">→</span>
          </div>
        </div>
      </div>

      {/* LİSTE BAŞLIĞI, ARAMA & FİLTRELER */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>
                {filterMode === 'all' && !searchTerm.trim() ? 'Son 10 Sertifika' : 'Sertifika Listesi'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                {displayedCertificates.length} Kayıt
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {filterMode === 'all' 
                ? 'Son düzenlenen sertifikalar ve geçerlilik detayları' 
                : filterMode === 'expired' 
                ? 'Geçerlilik süresi dolmuş sertifikalar' 
                : '30 gün içinde yenilenmesi gereken sertifikalar'}
            </p>
          </div>

          {/* Arama & Hızlı Filtre Butonları */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="İsim, TC No, Seri No veya Firma Ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  filterMode === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tümü
              </button>
              <button
                onClick={() => setFilterMode('expired')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  filterMode === 'expired' ? 'bg-red-500/20 text-red-300' : 'text-slate-400 hover:text-red-400'
                }`}
              >
                Süresi Dolanlar
              </button>
              <button
                onClick={() => setFilterMode('expiring')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  filterMode === 'expiring' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-amber-400'
                }`}
              >
                Yaklaşanlar
              </button>
            </div>
          </div>
        </div>

        {/* SERTİFİKA TABLOSU */}
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
            <RefreshCw size={18} className="animate-spin text-amber-500" />
            <span>Sertifikalar yükleniyor...</span>
          </div>
        ) : displayedCertificates.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
            Kayıtlı sertifika bulunamadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Seri No</th>
                  <th className="py-3 px-3">Alıcı (Kişi)</th>
                  <th className="py-3 px-3">Firma</th>
                  <th className="py-3 px-3">Eğitim Tarihi</th>
                  <th className="py-3 px-3">Geçerlilik Bitiş</th>
                  <th className="py-3 px-3">Durum</th>
                  <th className="py-3 px-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {displayedCertificates.map(cert => {
                  const status = getCertificateStatus(cert.expiryDate);
                  const daysLeft = getDaysRemaining(cert.expiryDate);
                  const badge = getStatusBadge(status, daysLeft);

                  return (
                    <tr key={cert.serialNo} className="hover:bg-slate-800/40 transition group">
                      <td className="py-3 px-3 font-mono text-slate-300 font-semibold">
                        {cert.serialNo}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">
                          {cert.recipientName || 'İsimsiz Alıcı'}
                        </div>
                        {cert.recipientTc && (
                          <div className="text-[11px] text-slate-500 font-mono">
                            TC: {cert.recipientTc}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {cert.company ? (
                          <button
                            onClick={() => onNavigateToCompany(cert.company)}
                            className="text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1"
                          >
                            <Building2 size={12} />
                            <span>{cert.company}</span>
                          </button>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {cert.trainingDate || (cert.date ? formatDateTR(new Date(cert.date)) : '-')}
                      </td>
                      <td className="py-3 px-3 text-slate-200 font-semibold">
                        {cert.expiryDate ? formatDateTR(new Date(cert.expiryDate)) : '-'}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <a
                          href={`/dogrula?id=${cert.serialNo}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition text-xs font-semibold"
                        >
                          <ExternalLink size={12} />
                          <span>Doğrula</span>
                        </a>
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
