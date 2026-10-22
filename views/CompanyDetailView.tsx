import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  ArrowLeft, 
  Search, 
  ExternalLink, 
  Calendar, 
  ShieldAlert, 
  Clock, 
  User, 
  Award,
  Filter,
  CheckCircle2,
  FileCheck2
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

export const CompanyDetailView: React.FC<CompanyDetailViewProps> = ({
  company,
  certificates,
  onBack,
  onNavigateToFillWithCompany
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'expiring' | 'expired'>('all');

  // Filter certificates strictly for this company
  const companyCertificates = useMemo(() => {
    const compNameLower = company.name.trim().toLowerCase();
    const compShortLower = (company.shortName || '').trim().toLowerCase();

    return certificates.filter(c => {
      if (!c.company) return false;
      const cCompLower = c.company.trim().toLowerCase();
      return cCompLower === compNameLower || (compShortLower && cCompLower === compShortLower) || c.companyId === company.id;
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

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6 custom-scrollbar">
      {/* Top Bar with Back Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition"
        >
          <ArrowLeft size={16} />
          <span>Firmalara Dön</span>
        </button>
      </div>

      {/* Company Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-amber-400 font-black text-2xl shadow-lg shrink-0">
              {company.shortName ? company.shortName.substring(0, 3).toUpperCase() : company.name.substring(0, 2).toUpperCase()}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {company.name}
                </h1>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${getDangerClassBadgeClass(company.dangerClass)}`}>
                  {getDangerClassLabel(company.dangerClass)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                {company.shortName && (
                  <span className="font-mono bg-slate-800/80 px-2 py-0.5 rounded text-slate-300 border border-slate-700/60">
                    Kısa Kod: {company.shortName}
                  </span>
                )}
                <span>Geçerlilik Periyodu: <strong className="text-white">{company.dangerClass === 'az_tehlikeli' ? '3 Yıl' : company.dangerClass === 'tehlikeli' ? '2 Yıl' : '1 Yıl'}</strong></span>
                <span>Toplam Sertifika: <strong className="text-white">{companyStats.total}</strong></span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateToFillWithCompany(company.name)}
            className="self-start md:self-auto flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 text-xs transition"
          >
            <FileCheck2 size={16} />
            <span>Bu Firma İçin Sertifika Üret</span>
          </button>
        </div>

        {/* Mini Status Breakdown Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`p-3 rounded-xl border text-left transition ${
              statusFilter === 'all' ? 'bg-slate-800 border-blue-500/40 text-white' : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-slate-400">Toplam Sertifika</div>
            <div className="text-xl font-black text-white mt-0.5">{companyStats.total}</div>
          </button>

          <button
            onClick={() => setStatusFilter('valid')}
            className={`p-3 rounded-xl border text-left transition ${
              statusFilter === 'valid' ? 'bg-emerald-950/40 border-emerald-500/50 text-white' : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-emerald-400">Geçerli Olanlar</div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">{companyStats.valid}</div>
          </button>

          <button
            onClick={() => setStatusFilter('expiring')}
            className={`p-3 rounded-xl border text-left transition ${
              statusFilter === 'expiring' ? 'bg-amber-950/40 border-amber-500/50 text-white' : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-amber-400">Süresi Yaklaşanlar</div>
            <div className="text-xl font-black text-amber-400 mt-0.5">{companyStats.expiring}</div>
          </button>

          <button
            onClick={() => setStatusFilter('expired')}
            className={`p-3 rounded-xl border text-left transition ${
              statusFilter === 'expired' ? 'bg-red-950/40 border-red-500/50 text-white' : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-red-400">Süresi Dolanlar</div>
            <div className="text-xl font-black text-red-400 mt-0.5">{companyStats.expired}</div>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="TC Kimlik No veya İsim ile Kişi Ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Filtrelenen:</span>
            <strong className="text-white">{filteredCertificates.length} Kişi</strong>
          </div>
        </div>

        {/* Certificate List Table */}
        {filteredCertificates.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
            {searchTerm.trim() || statusFilter !== 'all' 
              ? 'Arama kriterlerinize uygun sertifika bulunamadı.' 
              : 'Bu firma için henüz bir sertifika düzenlenmemiş.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Seri No</th>
                  <th className="py-3 px-3">Alıcı (Kişi Adı)</th>
                  <th className="py-3 px-3">TC Kimlik No</th>
                  <th className="py-3 px-3">Eğitim Tarihi</th>
                  <th className="py-3 px-3">Geçerlilik Bitiş</th>
                  <th className="py-3 px-3">Durum</th>
                  <th className="py-3 px-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredCertificates.map(cert => {
                  const status = getCertificateStatus(cert.expiryDate);
                  const daysLeft = getDaysRemaining(cert.expiryDate);
                  const badge = getStatusBadge(status, daysLeft);

                  return (
                    <tr key={cert.serialNo} className="hover:bg-slate-800/40 transition group">
                      <td className="py-3 px-3 font-mono text-slate-300 font-semibold">
                        {cert.serialNo}
                      </td>
                      <td className="py-3 px-3 font-bold text-white">
                        {cert.recipientName || 'İsimsiz Alıcı'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {cert.recipientTc || '-'}
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
