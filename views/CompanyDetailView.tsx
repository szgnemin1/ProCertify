import React, { useState, useEffect, useMemo } from 'react';
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
  UserX, 
  UserCheck, 
  Pencil, 
  X,
  FileText,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';
import { Company, IssuedCertificate, Employee } from '../types';
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
  onEditCertificate?: (cert: IssuedCertificate) => void;
  onOpenEmployee?: (tcOrName: string) => void;
  getApiUrl: (path: string) => string;
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
  onNavigateToFillWithCompany,
  onEditCertificate,
  onOpenEmployee,
  getApiUrl
}) => {
  // Main view tab: 'active_staff' (Aktif Çalışanlar) or 'terminated_staff' (İşten Ayrılanlar)
  const [mainTab, setMainTab] = useState<'active_staff' | 'terminated_staff'>('active_staff');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'expiring' | 'expired'>('all');
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Fetch employees for this company
  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('vps_session_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(getApiUrl(`/api/employees?company=${encodeURIComponent(company.id)}&status=all`), { headers });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data || []);
      }
    } catch (e) {
      console.error("Error fetching company employees:", e);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [company.id]);

  const handleReactivateEmployee = async (empId: string) => {
    try {
      const token = localStorage.getItem('vps_session_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(getApiUrl(`/api/employees/${encodeURIComponent(empId)}/status`), {
        method: 'POST',
        headers,
        body: JSON.stringify({ status: 'active' })
      });
      if (res.ok) {
        await fetchEmployees();
      }
    } catch (e) {
      console.error("Error reactivating employee:", e);
    }
  };

  // Map employee status by TC and Name for fast lookup
  const employeeStatusMap = useMemo(() => {
    const map = new Map<string, 'active' | 'passive'>();
    for (const emp of employees) {
      if (emp.tc) map.set(emp.tc.trim(), emp.status);
      if (emp.name) map.set(turkishToLower(emp.name), emp.status);
    }
    return map;
  }, [employees]);

  // Split employees into active vs terminated
  const terminatedEmployees = useMemo(() => {
    return employees.filter(e => e.status === 'passive');
  }, [employees]);

  const activeEmployees = useMemo(() => {
    return employees.filter(e => e.status !== 'passive');
  }, [employees]);

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

  // Separate certificates belonging to ACTIVE employees only
  const activeCertificates = useMemo(() => {
    return companyCertificates.filter(cert => {
      const empStatus = (cert.recipientTc && employeeStatusMap.get(cert.recipientTc.trim())) ||
                        (cert.recipientName && employeeStatusMap.get(turkishToLower(cert.recipientName))) ||
                        'active';
      return empStatus !== 'passive';
    });
  }, [companyCertificates, employeeStatusMap]);

  // Compute breakdown stats for active certificates
  const activeStats = useMemo(() => {
    let expired = 0;
    let expiring = 0;
    let valid = 0;

    for (const cert of activeCertificates) {
      const status = getCertificateStatus(cert.expiryDate);
      if (status === 'expired') expired++;
      else if (status === 'expiring_soon') expiring++;
      else valid++;
    }

    return {
      total: activeCertificates.length,
      expired,
      expiring,
      valid
    };
  }, [activeCertificates]);

  // Filter active certificates according to validity and search
  const filteredActiveCertificates = useMemo(() => {
    return activeCertificates.filter(cert => {
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
  }, [activeCertificates, statusFilter, searchTerm]);

  // Filter terminated employees by search query
  const filteredTerminatedEmployees = useMemo(() => {
    if (!searchTerm.trim()) return terminatedEmployees;
    const q = turkishToLower(searchTerm);
    return terminatedEmployees.filter(e => 
      turkishToLower(e.name).includes(q) || 
      (e.tc && e.tc.includes(q)) ||
      (e.terminationNote && turkishToLower(e.terminationNote).includes(q))
    );
  }, [terminatedEmployees, searchTerm]);

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
    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-5 custom-scrollbar">
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
                <span>Aktif Sertifika: <strong className="text-white">{activeCertificates.length}</strong></span>
                <span>Ayrılan Personel: <strong className="text-red-400">{terminatedEmployees.length}</strong></span>
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

      {/* ANA SEKMELER: 1. AKTİF ÇALIŞANLAR VE SERTİFİKALARI | 2. İŞTEN AYRILANLAR LİSTESİ */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => {
            setMainTab('active_staff');
            setSearchTerm('');
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            mainTab === 'active_staff'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <CheckCircle2 size={14} />
          <span>Aktif Çalışanlar & Sertifikalar ({activeCertificates.length})</span>
        </button>

        <button
          onClick={() => {
            setMainTab('terminated_staff');
            setSearchTerm('');
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            mainTab === 'terminated_staff'
              ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-md'
              : 'text-slate-400 hover:text-red-400 hover:bg-slate-800/80'
          }`}
        >
          <UserX size={14} />
          <span>İşten Ayrılanlar Listesi ({terminatedEmployees.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. SEKME: AKTİF ÇALIŞANLAR VE SERTİFİKALAR                                 */}
      {/* ========================================================================= */}
      {mainTab === 'active_staff' && (
        <div className="space-y-3">
          {/* Kompakt Durum Filtreleri ve Arama Çubuğu */}
          <div className="bg-slate-900/90 border border-slate-800/90 px-3 py-2 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Arama Kutusu */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Aktif Personel veya Sertifika Ara..."
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

            {/* Sertifika Geçerlilik Filtre Butonları */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                  statusFilter === 'all'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                Tümü ({activeStats.total})
              </button>

              <button
                onClick={() => setStatusFilter('valid')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                  statusFilter === 'valid'
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                    : 'bg-slate-800/70 text-slate-400 hover:text-emerald-300'
                }`}
              >
                Geçerli ({activeStats.valid})
              </button>

              <button
                onClick={() => setStatusFilter('expiring')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                  statusFilter === 'expiring'
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                    : 'bg-slate-800/70 text-slate-400 hover:text-amber-300'
                }`}
              >
                Yaklaşanlar ({activeStats.expiring})
              </button>

              <button
                onClick={() => setStatusFilter('expired')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                  statusFilter === 'expired'
                    ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                    : 'bg-slate-800/70 text-slate-400 hover:text-red-300'
                }`}
              >
                Süresi Dolanlar ({activeStats.expired})
              </button>

              <span className="text-[11px] text-slate-400 ml-1 font-mono">
                {filteredActiveCertificates.length} kayıt
              </span>
            </div>
          </div>

          {/* Aktif Sertifika Tablosu */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-md">
            {filteredActiveCertificates.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs p-4">
                <Award size={28} className="mx-auto mb-2 text-slate-600 stroke-[1.5]" />
                <div className="font-semibold text-slate-400">
                  {searchTerm.trim() || statusFilter !== 'all' 
                    ? 'Arama kriterlerinize uygun aktif sertifika bulunamadı.' 
                    : 'Bu firmada henüz düzenlenmiş aktif bir sertifika bulunmuyor.'}
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
              <div className="w-full overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[720px]">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-2 px-2.5 w-28 font-mono">Seri No</th>
                      <th className="py-2 px-2.5">Alıcı (Kişi Adı & Sertifikalar)</th>
                      <th className="py-2 px-2 w-28 hidden sm:table-cell font-mono">TC Kimlik No</th>
                      <th className="py-2 px-2 w-24">Eğitim Trh</th>
                      <th className="py-2 px-2 w-24">Bitiş Trh</th>
                      <th className="py-2 px-2 w-28">Durum</th>
                      <th className="py-2 px-2 w-16 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 font-medium text-xs">
                    {filteredActiveCertificates.map(cert => {
                      const status = getCertificateStatus(cert.expiryDate);
                      const daysLeft = getDaysRemaining(cert.expiryDate);
                      const badge = getStatusBadge(status, daysLeft);

                      return (
                        <tr key={cert.serialNo} className="hover:bg-slate-800/60 transition-colors duration-100">
                          {/* Seri No */}
                          <td className="py-2 px-2.5 font-mono text-slate-300 font-semibold text-[11px] truncate">
                            {cert.serialNo}
                          </td>

                          {/* Alıcı ve Sertifika Rozetleri (İsme tıklanarak Çalışan Kartı açılır) */}
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
      )}

      {/* ========================================================================= */}
      {/* 2. SEKME: İŞTEN AYRILANLAR AYRI LİSTESİ (ÖZEL ARŞİV TABLOSU)              */}
      {/* ========================================================================= */}
      {mainTab === 'terminated_staff' && (
        <div className="space-y-3">
          {/* Arama Çubuğu & Bilgi */}
          <div className="bg-red-950/20 border border-red-500/20 px-3 py-2 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ayrılan Personel veya Not Ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-7 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition"
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

            <div className="flex items-center gap-2 text-[11px] text-red-300">
              <UserX size={14} className="text-red-400" />
              <span>
                Toplam <strong>{terminatedEmployees.length}</strong> personel işten ayrılmış (evrakları ve sertifikaları arşivde saklanıyor).
              </span>
            </div>
          </div>

          {/* Ayrılan Personel Özel Listesi */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-md">
            {filteredTerminatedEmployees.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs p-4">
                <UserCheck size={32} className="mx-auto mb-2 text-emerald-500/60 stroke-[1.5]" />
                <div className="font-semibold text-slate-300">
                  {searchTerm.trim() 
                    ? 'Aramanıza uygun ayrılan personel bulunamadı.' 
                    : 'Bu firmadan işten ayrılan kayıtlı personel bulunmuyor.'}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Çalışan kartından "İşten Çıkarıldı" olarak işaretlenen personeller bu listeye aktarılır.
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[720px]">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-2 px-2.5 w-10 text-center">#</th>
                      <th className="py-2 px-2.5 min-w-[180px]">Personel (Ad Soyad & TC)</th>
                      <th className="py-2 px-2 w-28">Ayrılma Tarihi</th>
                      <th className="py-2 px-2">Ayrılma Notu / Nedeni</th>
                      <th className="py-2 px-2 w-28 text-center">Sertifikaları</th>
                      <th className="py-2 px-2 w-24 text-center">Evraklar</th>
                      <th className="py-2 px-2 w-36 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 font-medium text-xs">
                    {filteredTerminatedEmployees.map((emp, index) => {
                      // Find certificates for this parted employee
                      const empCerts = companyCertificates.filter(c => {
                        if (emp.tc && c.recipientTc && c.recipientTc.trim() === emp.tc.trim()) return true;
                        return turkishToLower(c.recipientName || '') === turkishToLower(emp.name);
                      });

                      const docCount = (emp.documents || []).length;
                      const empInitials = emp.name.substring(0, 2).toUpperCase();

                      return (
                        <tr key={emp.id} className="hover:bg-slate-800/60 transition-colors duration-100">
                          {/* Sıra No */}
                          <td className="py-2 px-2.5 text-center font-mono text-slate-500 text-[11px]">
                            {index + 1}
                          </td>

                          {/* Personel Bilgisi */}
                          <td className="py-2 px-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-red-950/50 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 font-bold text-[10px]">
                                {empInitials}
                              </div>
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => onOpenEmployee && onOpenEmployee(emp.tc || emp.name)}
                                  className="font-bold text-white text-xs hover:text-red-400 hover:underline transition text-left truncate block"
                                  title="Çalışan Kartını Aç"
                                >
                                  {emp.name}
                                </button>
                                {emp.tc && (
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    TC: {emp.tc}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Ayrılma Tarihi */}
                          <td className="py-2 px-2 text-slate-300 text-[11px] truncate">
                            {emp.terminatedAt ? formatDateTR(new Date(emp.terminatedAt)) : '-'}
                          </td>

                          {/* Ayrılma Notu / Nedeni */}
                          <td className="py-2 px-2 truncate">
                            {emp.terminationNote ? (
                              <span className="text-slate-300 italic text-[11px] truncate block" title={emp.terminationNote}>
                                "{emp.terminationNote}"
                              </span>
                            ) : (
                              <span className="text-slate-600 text-[11px]">-</span>
                            )}
                          </td>

                          {/* Sertifikaları */}
                          <td className="py-2 px-2 text-center">
                            {empCerts.length > 0 ? (
                              <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                <Award size={11} className="text-amber-400" />
                                <span>{empCerts.length} Sertifika</span>
                              </span>
                            ) : (
                              <span className="text-slate-600 text-[11px]">-</span>
                            )}
                          </td>

                          {/* Evraklar */}
                          <td className="py-2 px-2 text-center">
                            {docCount > 0 ? (
                              <span className="inline-flex items-center gap-1 bg-blue-950/40 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                                <FileText size={11} className="text-blue-400" />
                                <span>{docCount} Evrak</span>
                              </span>
                            ) : (
                              <span className="text-slate-600 text-[11px]">0</span>
                            )}
                          </td>

                          {/* İşlemler: Kartı Aç & Tekrar İşe Al */}
                          <td className="py-2 px-2 text-right">
                            <div className="inline-flex items-center gap-1 justify-end">
                              <button
                                type="button"
                                onClick={() => onOpenEmployee && onOpenEmployee(emp.tc || emp.name)}
                                className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded-md text-[11px] font-semibold transition"
                                title="Çalışan Kartını Aç (Evraklar ve Sertifikalar)"
                              >
                                <FolderOpen size={12} />
                                <span>Kart</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleReactivateEmployee(emp.id)}
                                className="inline-flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-md text-[11px] font-semibold transition"
                                title="Personeli Tekrar Aktif Çalışan Yap"
                              >
                                <UserCheck size={12} />
                                <span>İşe Al</span>
                              </button>
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
      )}
    </div>
  );
};
