import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  ArrowLeft, 
  Search, 
  ExternalLink, 
  Calendar, 
  ShieldAlert, 
  ShieldCheck,
  Clock, 
  AlertTriangle,
  Award,
  FileCheck2,
  Flame,
  X
} from 'lucide-react';
import { Company, IssuedCertificate } from '../types';
import { 
  getCertificateStatus, 
  getDaysRemaining, 
  getStatusBadge, 
  getDangerClassLabel, 
  getDangerClassBadgeClass, 
  formatDateTR 
} from '../services/validityService';

interface CompanyDetailViewProps {
  company: Company;
  certificates: IssuedCertificate[];
  onBack: () => void;
  onNavigateToFillWithCompany: (companyName: string) => void;
}

const turkishToLower = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .replace(/Ğ/g, 'ğ')
    .replace(/Ü/g, 'ü')
    .replace(/Ş/g, 'ş')
    .replace(/Ö/g, 'ö')
    .replace(/Ç/g, 'ç')
    .toLowerCase()
    .trim();
};

export const CompanyDetailView: React.FC<CompanyDetailViewProps> = ({
  company,
  certificates,
  onBack,
  onNavigateToFillWithCompany
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'expiring' | 'expired'>('all');

  // Filter certificates strictly for this company (matched by ID, exact name or shortName)
  const companyCertificates = useMemo(() => {
    const compId = company.id;
    const compNameNorm = turkishToLower(company.name);
    const compShortNorm = company.shortName ? turkishToLower(company.shortName) : '';

    return certificates.filter(c => {
      if (c.companyId && c.companyId === compId) return true;
      if (!c.company) return false;
      const certCompNorm = turkishToLower(c.company);
      return certCompNorm === compNameNorm || 
             (compShortNorm && certCompNorm === compShortNorm) ||
             certCompNorm.includes(compNameNorm) ||
             compNameNorm.includes(certCompNorm);
    });
  }, [certificates, company]);

  // Compute breakdown stats for this company
  const companyStats = useMemo(() => {
    let expired = 0;
    let expiring = 0;
    let valid = 0;

    for (const cert of companyCertificates) {
      const status = getCertificateStatus(cert.expiryDate);
      if (status === 'expired') expired++;
      else if (status === 'expiring_soon') expiring++;
      else valid++;
    }

    return {
      total: companyCertificates.length,
      expired,
      expiring,
      valid
    };
  }, [companyCertificates]);

  // Apply search & status filter
  const filteredCertificates = useMemo(() => {
    return companyCertificates.filter(cert => {
      const status = getCertificateStatus(cert.expiryDate);

      if (statusFilter === 'valid' && status !== 'valid') return false;
      if (statusFilter === 'expiring' && status !== 'expiring_soon') return false;
      if (statusFilter === 'expired' && status !== 'expired') return false;

      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const name = (cert.recipientName || '').toLowerCase();
        const tc = (cert.recipientTc || '').toLowerCase();
        const serial = (cert.serialNo || '').toLowerCase();
        return name.includes(q) || tc.includes(q) || serial.includes(q);
      }

      return true;
    });
  }, [companyCertificates, statusFilter, searchTerm]);

  // Monogram initials
  const initials = company.shortName 
    ? company.shortName.substring(0, 2).toUpperCase() 
    : company.name.substring(0, 2).toUpperCase();

  const validityYearsText = company.dangerClass === 'az_tehlikeli' 
    ? '3 Yıl' 
    : company.dangerClass === 'tehlikeli' 
    ? '2 Yıl' 
    : '1 Yıl';

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-3 sm:p-4 space-y-3 custom-scrollbar">
      {/* Üst Başlık Kartı: Geri Dönüş, Firma Başlığı ve İşlem Butonu */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Sol: Geri Dön Butonu + Firma Bilgileri */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBack}
              title="Firmalar Listesine Dön"
              className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition shrink-0"
            >
              <ArrowLeft size={16} />
            </button>

            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
              {initials}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight truncate max-w-lg">
                  {company.name}
                </h1>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${getDangerClassBadgeClass(company.dangerClass)}`}>
                  {company.dangerClass === 'cok_tehlikeli' && <Flame size={10} />}
                  {company.dangerClass === 'tehlikeli' && <ShieldAlert size={10} />}
                  {company.dangerClass === 'az_tehlikeli' && <ShieldCheck size={10} />}
                  <span>{getDangerClassLabel(company.dangerClass)}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-0.5 text-[11px] text-slate-400">
                {company.shortName && (
                  <span className="font-mono text-amber-300/80 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded">
                    Kod: {company.shortName}
                  </span>
                )}
                <span>Geçerlilik: <strong className="text-slate-200">{validityYearsText}</strong></span>
                <span>Toplam Sertifika: <strong className="text-white">{companyStats.total}</strong></span>
              </div>
            </div>
          </div>

          {/* Sağ: Yeni Sertifika Butonu */}
          <button
            onClick={() => onNavigateToFillWithCompany(company.name)}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs shadow-md shadow-amber-500/20 transition shrink-0 self-start sm:self-auto"
          >
            <FileCheck2 size={14} />
            <span>Bu Firma İçin Sertifika Hazırla</span>
          </button>
        </div>
      </div>

      {/* Kompakt Durum Filtreleri ve Arama Çubuğu */}
      <div className="bg-slate-900/90 border border-slate-800/90 px-3 py-2 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Arama Kutusu */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="İsim, TC No veya Seri No Ara..."
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

        {/* Durum Filtre Butonları */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              statusFilter === 'all'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Tümü ({companyStats.total})
          </button>

          <button
            onClick={() => setStatusFilter('valid')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              statusFilter === 'valid'
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                : 'bg-slate-800/70 text-slate-400 hover:text-emerald-300'
            }`}
          >
            Geçerli ({companyStats.valid})
          </button>

          <button
            onClick={() => setStatusFilter('expiring')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              statusFilter === 'expiring'
                ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                : 'bg-slate-800/70 text-slate-400 hover:text-amber-300'
            }`}
          >
            Yaklaşanlar ({companyStats.expiring})
          </button>

          <button
            onClick={() => setStatusFilter('expired')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              statusFilter === 'expired'
                ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                : 'bg-slate-800/70 text-slate-400 hover:text-red-300'
            }`}
          >
            Süresi Dolanlar ({companyStats.expired})
          </button>

          <span className="text-[11px] text-slate-400 ml-1 font-mono">
            {filteredCertificates.length} kayıt
          </span>
        </div>
      </div>

      {/* Kompakt Sertifika Tablosu (Ekrana Tam Sığar, Yatay Kaydırma Yapmaz) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        {filteredCertificates.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-xs p-4">
            <Award size={28} className="mx-auto mb-2 text-slate-600 stroke-[1.5]" />
            <div className="font-semibold text-slate-400">
              {searchTerm.trim() || statusFilter !== 'all' 
                ? 'Arama kriterlerinize uygun sertifika bulunamadı.' 
                : 'Bu firma için henüz bir sertifika düzenlenmemiş.'}
            </div>
            {(searchTerm.trim() || statusFilter !== 'all') && (
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                className="mt-2 text-xs text-amber-400 hover:underline inline-flex items-center gap-1 font-semibold"
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        ) : (
          <div className="w-full">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2 px-2.5 w-28 font-mono">Seri No</th>
                  <th className="py-2 px-2.5">Alıcı (Kişi Adı & Sertifikalar)</th>
                  <th className="py-2 px-2 w-28 hidden sm:table-cell font-mono">TC Kimlik No</th>
                  <th className="py-2 px-2 w-24">Eğitim Trh</th>
                  <th className="py-2 px-2 w-24">Bitiş Trh</th>
                  <th className="py-2 px-2 w-28">Durum</th>
                  <th className="py-2 px-2 w-14 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-medium text-xs">
                {filteredCertificates.map(cert => {
                  const status = getCertificateStatus(cert.expiryDate);
                  const daysLeft = getDaysRemaining(cert.expiryDate);
                  const badge = getStatusBadge(status, daysLeft);

                  return (
                    <tr key={cert.serialNo} className="hover:bg-slate-800/60 transition-colors duration-100">
                      {/* Seri No */}
                      <td className="py-2 px-2.5 font-mono text-slate-300 font-semibold text-[11px] truncate">
                        {cert.serialNo}
                      </td>

                      {/* Alıcı ve Sertifika Rozetleri */}
                      <td className="py-2 px-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-white text-xs">
                            {cert.recipientName || 'İsimsiz Alıcı'}
                          </span>
                          {/* Mobil/küçük ekranda TC'yi isim yanına küçük yaz */}
                          {cert.recipientTc && (
                            <span className="text-[10px] text-slate-500 font-mono sm:hidden">
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

                      {/* TC Kimlik No */}
                      <td className="py-2 px-2 font-mono text-slate-400 text-[11px] hidden sm:table-cell truncate">
                        {cert.recipientTc || '-'}
                      </td>

                      {/* Eğitim Tarihi */}
                      <td className="py-2 px-2 text-slate-300 text-[11px] truncate">
                        {cert.trainingDate || (cert.date ? formatDateTR(new Date(cert.date)) : '-')}
                      </td>

                      {/* Bitiş Tarihi */}
                      <td className="py-2 px-2 text-slate-200 font-semibold text-[11px] truncate">
                        {cert.expiryDate ? formatDateTR(new Date(cert.expiryDate)) : '-'}
                      </td>

                      {/* Durum */}
                      <td className="py-2 px-2 truncate">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Doğrulama Bağlantısı */}
                      <td className="py-2 px-2 text-right">
                        <a
                          href={`/dogrula?id=${cert.serialNo}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Sertifikayı Doğrula"
                          className="inline-flex items-center justify-center p-1 rounded-md text-slate-400 hover:text-amber-400 hover:bg-slate-700/60 transition"
                        >
                          <ExternalLink size={14} />
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
