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
  X,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { IssuedCertificate, DashboardStats } from '../types';
import { RenewalReportModal } from '../components/RenewalReportModal';
import { FileText } from 'lucide-react';
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
  const [showRenewalModal, setShowRenewalModal] = useState(false);

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

  // If viewing 'all' without search, default to top 20
  const displayedCertificates = (filterMode === 'all' && !searchTerm.trim()) 
    ? filteredCertificates.slice(0, 20) 
    : filteredCertificates;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 custom-scrollbar">
      {/* ========================================================================= */}
      {/* 1. HERO BAŞLIK & HIZLI İŞLEM ÇUBUĞU                                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold mb-2">
            <Sparkles size={13} className="text-amber-400 animate-pulse" />
            <span>İSG Sertifika & Eğitim Takip Merkezi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Genel Durum & Sertifika Takibi</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Düzenlenen sertifikalar, yaklaşan geçerlilik süreleri, yenileme alarmları ve çalışan kayıtları tek merkezden yönetilir.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setShowRenewalModal(true)}
            className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-white transition shadow-sm active:scale-95 flex items-center gap-2 text-xs font-semibold cursor-pointer"
            title="Eğitim Yenilemesi Gerekenler İçin Resmi Teklif & Bildirim Raporu"
          >
            <FileText size={15} className="text-rose-400" />
            <span className="hidden sm:inline">Yenileme Teklif Raporu (A4)</span>
            <span className="sm:hidden">Yenileme Raporu</span>
          </button>

          <button
            onClick={fetchDashboardData}
            title="Verileri Yenile"
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition shadow-sm active:scale-95 flex items-center gap-2 text-xs font-medium"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-amber-400" : ""} />
            <span className="hidden sm:inline">Yenile</span>
          </button>

          <button
            onClick={onNavigateToFill}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all text-xs sm:text-sm active:scale-95 transform cursor-pointer"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Yeni Sertifika Hazırla</span>
            <ArrowRight size={14} className="opacity-70 hidden sm:inline" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MODERN 3'LÜ ETKİLEŞİMLİ İSTATİSTİK KARTLARI                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KART 1: TOPLAM SERTİFİKA */}
        <div
          onClick={() => setFilterMode('all')}
          className={`cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all duration-200 relative overflow-hidden group select-none shadow-md ${
            filterMode === 'all'
              ? 'bg-gradient-to-br from-blue-950/40 via-slate-900/90 to-slate-900 border-blue-500/70 ring-2 ring-blue-500/30 shadow-blue-950/30 -translate-y-0.5'
              : 'bg-slate-900/70 border-slate-800/80 hover:border-blue-500/40 hover:bg-slate-900 hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
              Toplam Sertifika
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition shadow-inner">
              <FileCheck2 size={18} />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {loading ? '...' : stats.total}
            </span>
            <span className="text-xs text-slate-400 font-medium">düzenlenen belge</span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Sistemde Kayıtlı</span>
            <span className="text-blue-400 font-semibold group-hover:underline flex items-center gap-0.5">
              Filtrele & Göster →
            </span>
          </div>
        </div>

        {/* KART 2: GEÇERLİLİK TARİHİ GEÇENLER */}
        <div
          onClick={() => setFilterMode('expired')}
          className={`cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all duration-200 relative overflow-hidden group select-none shadow-md ${
            filterMode === 'expired'
              ? 'bg-gradient-to-br from-rose-950/40 via-slate-900/90 to-slate-900 border-rose-500/70 ring-2 ring-rose-500/30 shadow-rose-950/30 -translate-y-0.5'
              : 'bg-slate-900/70 border-slate-800/80 hover:border-rose-500/40 hover:bg-slate-900 hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-ping"></span>
              Süresi Dolanlar
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition shadow-inner">
              <AlertTriangle size={18} />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-rose-400 tracking-tight">
              {loading ? '...' : stats.expired}
            </span>
            <span className="text-xs text-rose-300/80 font-medium">hemen yenilenmeli</span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="text-rose-400/90 font-medium">⚠️ Geçerlilik süresi bitti</span>
            <span className="text-rose-400 font-semibold group-hover:underline flex items-center gap-0.5">
              Acil İncele →
            </span>
          </div>
        </div>

        {/* KART 3: GEÇERLİLİK TARİHİ YAKLAŞANLAR (<= 30 GÜN) */}
        <div
          onClick={() => setFilterMode('expiring')}
          className={`cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all duration-200 relative overflow-hidden group select-none shadow-md ${
            filterMode === 'expiring'
              ? 'bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-slate-900 border-amber-500/70 ring-2 ring-amber-500/30 shadow-amber-950/30 -translate-y-0.5'
              : 'bg-slate-900/70 border-slate-800/80 hover:border-amber-500/40 hover:bg-slate-900 hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
              Yaklaşanlar (≤ 30 Gün)
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition shadow-inner">
              <Clock size={18} />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">
              {loading ? '...' : stats.expiringSoon}
            </span>
            <span className="text-xs text-amber-300/80 font-medium">yakında bitecek</span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="text-amber-400/90 font-medium">Planlı eğitim gerekli</span>
            <span className="text-amber-400 font-semibold group-hover:underline flex items-center gap-0.5">
              Listele →
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ARAMA VE FİLTRELEME ÇUBUĞU                                             */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/90 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
        {/* Arama Alanı */}
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Kişi Adı, TC Kimlik, Seri No veya Firma..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition shadow-inner"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded transition"
              title="Aramayı Temizle"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Hızlı Filtre Butonları */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              filterMode === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <span>Tümü</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterMode === 'all' ? 'bg-slate-950 text-amber-400' : 'bg-slate-700 text-slate-300'}`}>
              {stats.total}
            </span>
          </button>

          <button
            onClick={() => setFilterMode('valid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              filterMode === 'valid'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/70 text-slate-300 hover:text-emerald-300 border border-slate-700/60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Geçerli</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterMode === 'valid' ? 'bg-slate-950 text-emerald-400' : 'bg-slate-700 text-slate-300'}`}>
              {stats.valid}
            </span>
          </button>

          <button
            onClick={() => setFilterMode('expiring')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              filterMode === 'expiring'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-800/70 text-slate-300 hover:text-amber-300 border border-slate-700/60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>Yaklaşanlar</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterMode === 'expiring' ? 'bg-slate-950 text-amber-400' : 'bg-slate-700 text-slate-300'}`}>
              {stats.expiringSoon}
            </span>
          </button>

          <button
            onClick={() => setFilterMode('expired')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              filterMode === 'expired'
                ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                : 'bg-slate-800/70 text-slate-300 hover:text-rose-300 border border-slate-700/60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            <span>Süresi Dolanlar</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterMode === 'expired' ? 'bg-slate-950 text-rose-400' : 'bg-slate-700 text-slate-300'}`}>
              {stats.expired}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SERTİFİKA LİSTESİ TABLOSU                                              */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-3">
            <RefreshCw size={24} className="animate-spin text-amber-500" />
            <span className="font-semibold text-slate-300">Sertifikalar ve geçerlilik kayıtları yükleniyor...</span>
          </div>
        ) : displayedCertificates.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs p-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto mb-3 text-slate-500">
              <FileCheck2 size={32} strokeWidth={1.5} />
            </div>
            <div className="font-bold text-white text-sm">
              {searchTerm.trim() || filterMode !== 'all' 
                ? 'Arama kriterlerinize uygun sertifika bulunamadı.' 
                : 'Sistemde henüz kayıtlı sertifika bulunmuyor.'}
            </div>
            <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
              {searchTerm.trim() || filterMode !== 'all'
                ? 'Filtreleri sıfırlayarak tüm sertifikaları görebilirsiniz.'
                : 'Yeni bir sertifika hazırlamak için yukarıdaki "Yeni Sertifika Hazırla" butonuna tıklayın.'}
            </p>
            {(searchTerm.trim() || filterMode !== 'all') && (
              <button
                onClick={() => { setSearchTerm(''); setFilterMode('all'); }}
                className="mt-3 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 font-bold transition"
              >
                <X size={12} /> Filtreleri Temizle
              </button>
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/90 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3.5 w-32 font-mono">Seri No</th>
                  <th className="py-3 px-3">Alıcı (Kişi Adı & Sertifikalar)</th>
                  <th className="py-3 px-3 w-48">Firma</th>
                  <th className="py-3 px-3 w-28">Eğitim Trh</th>
                  <th className="py-3 px-3 w-28">Bitiş Trh</th>
                  <th className="py-3 px-3 w-32">Durum</th>
                  <th className="py-3 px-3 w-20 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-xs">
                {displayedCertificates.map(cert => {
                  const status = getCertificateStatus(cert.expiryDate);
                  const daysLeft = getDaysRemaining(cert.expiryDate);
                  const badge = getStatusBadge(status, daysLeft);

                  // Recipient initials for monogram avatar
                  const initials = cert.recipientName
                    ? cert.recipientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                    : 'ÇL';

                  return (
                    <tr key={cert.serialNo} className="hover:bg-slate-800/50 transition-colors duration-150 group">
                      {/* Seri No */}
                      <td className="py-2.5 px-3.5 font-mono text-[11px] truncate">
                        <span className="bg-slate-950/80 text-amber-300 font-bold px-2 py-0.5 rounded-md border border-slate-800 inline-block shadow-inner">
                          {cert.serialNo}
                        </span>
                      </td>

                      {/* Alıcı ve Sertifika Rozetleri (İsme tıklandığında Çalışan Kartı açılır) */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center text-amber-400 font-bold text-[10px] shrink-0 group-hover:border-amber-500/40 group-hover:bg-slate-750 transition shadow-inner">
                            {initials}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {onOpenEmployee ? (
                                <button
                                  type="button"
                                  onClick={() => onOpenEmployee(cert.recipientTc || cert.recipientName || '')}
                                  className="font-bold text-white text-xs hover:text-amber-400 hover:underline transition text-left cursor-pointer truncate"
                                  title="Çalışan Kartını & Evraklarını Aç"
                                >
                                  {cert.recipientName || 'İsimsiz Alıcı'}
                                </button>
                              ) : (
                                <span className="font-bold text-white text-xs truncate">
                                  {cert.recipientName || 'İsimsiz Alıcı'}
                                </span>
                              )}

                              {cert.recipientTc && (
                                <span className="text-[10px] text-slate-400 font-mono bg-slate-950/60 px-1.5 py-0.2 rounded border border-slate-800">
                                  {cert.recipientTc}
                                </span>
                              )}
                            </div>

                            {cert.projects && Array.isArray(cert.projects) && cert.projects.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {cert.projects.map((p, pIdx) => (
                                  <span key={pIdx} className="text-[9px] bg-slate-800/90 text-amber-300/90 px-1.5 py-0.2 rounded border border-slate-700/80 font-medium">
                                    {p}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Firma */}
                      <td className="py-2.5 px-3 truncate">
                        {cert.company ? (
                          <button
                            onClick={() => onNavigateToCompany(cert.company)}
                            className="text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1.5 text-xs truncate max-w-full font-medium"
                            title={`Firma Detayı: ${cert.company}`}
                          >
                            <Building2 size={13} className="shrink-0 text-amber-500/80" />
                            <span className="truncate">{cert.company}</span>
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Eğitim Tarihi */}
                      <td className="py-2.5 px-3 text-slate-300 text-[11px] font-mono truncate">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-500 shrink-0" />
                          <span>{cert.trainingDate || (cert.date ? formatDateTR(new Date(cert.date)) : '-')}</span>
                        </div>
                      </td>

                      {/* Geçerlilik Bitiş Tarihi */}
                      <td className="py-2.5 px-3 text-slate-200 font-bold text-[11px] font-mono truncate">
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-slate-500 shrink-0" />
                          <span>{cert.expiryDate ? formatDateTR(new Date(cert.expiryDate)) : '-'}</span>
                        </div>
                      </td>

                      {/* Durum */}
                      <td className="py-2.5 px-3 truncate">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${badge.className}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            status === 'valid' ? 'bg-emerald-400' : (status === 'expiring_soon' ? 'bg-amber-400 animate-pulse' : 'bg-rose-400')
                          }`}></span>
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* İşlem (Düzenle & Doğrula Butonları) */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          {onEditCertificate && (
                            <button
                              type="button"
                              onClick={() => onEditCertificate(cert)}
                              title="Sertifikayı Düzenle / Doldur Ekranına Yükle"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          <a
                            href={`/dogrula?id=${cert.serialNo}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Sertifikayı Doğrula"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          >
                            <ExternalLink size={14} />
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
