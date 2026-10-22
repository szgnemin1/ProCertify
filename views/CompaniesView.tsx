import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  ChevronRight, 
  Award, 
  Plus, 
  ShieldAlert, 
  ShieldCheck, 
  Flame, 
  FileText, 
  Filter,
  X,
  ExternalLink
} from 'lucide-react';
import { Company, IssuedCertificate, DangerClass } from '../types';
import { getDangerClassLabel, getDangerClassBadgeClass } from '../services/validityService';

interface CompaniesViewProps {
  companies: Company[];
  certificates: IssuedCertificate[];
  onSelectCompany: (company: Company) => void;
  isAdmin: boolean;
  onOpenSettings: () => void;
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

export const CompaniesView: React.FC<CompaniesViewProps> = ({
  companies,
  certificates,
  onSelectCompany,
  isAdmin,
  onOpenSettings
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dangerFilter, setDangerFilter] = useState<'all' | 'with_certs' | DangerClass>('all');

  // Count certificates per company (matched by ID, exact name or shortName)
  const certCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const company of companies) {
      const compId = company.id;
      const compNameNorm = turkishToLower(company.name);
      const compShortNorm = company.shortName ? turkishToLower(company.shortName) : '';

      const matchedCount = certificates.filter(c => {
        if (c.companyId && c.companyId === compId) return true;
        if (!c.company) return false;
        const certCompNorm = turkishToLower(c.company);
        return certCompNorm === compNameNorm || 
               (compShortNorm && certCompNorm === compShortNorm) ||
               certCompNorm.includes(compNameNorm) ||
               compNameNorm.includes(certCompNorm);
      }).length;

      counts[company.id] = matchedCount;
    }
    return counts;
  }, [companies, certificates]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalCompanies = companies.length;
    let companiesWithCerts = 0;
    let totalCerts = 0;

    for (const comp of companies) {
      const count = certCounts[comp.id] || 0;
      if (count > 0) companiesWithCerts++;
      totalCerts += count;
    }

    return {
      totalCompanies,
      companiesWithCerts,
      totalCerts
    };
  }, [companies, certCounts]);

  // Alphabetically sorted & filtered companies (Turkish locale support)
  const sortedAndFilteredCompanies = useMemo(() => {
    let list = [...companies];

    // Alphabetical sort (tr-TR)
    list.sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'));

    // Filter by danger class or cert status
    if (dangerFilter === 'with_certs') {
      list = list.filter(c => (certCounts[c.id] || 0) > 0);
    } else if (dangerFilter !== 'all') {
      list = list.filter(c => c.dangerClass === dangerFilter);
    }

    // Filter by search query
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLocaleLowerCase('tr-TR');
      list = list.filter(c => 
        c.name.toLocaleLowerCase('tr-TR').includes(q) || 
        (c.shortName && c.shortName.toLocaleLowerCase('tr-TR').includes(q))
      );
    }

    return list;
  }, [companies, searchTerm, dangerFilter, certCounts]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6 custom-scrollbar">
      {/* Üst Başlık & Admin Butonu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="text-amber-400" size={26} />
            <span>Kayıtlı Firmalar</span>
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Sistemdeki firmaların liste görünümü, tehlike sınıfları ve düzenlenen sertifikalar
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={onOpenSettings}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Plus size={16} />
            <span>Yeni Firma Ekle / Düzenle</span>
          </button>
        )}
      </div>

      {/* Özet Bilgi Sayaçları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div>
            <div className="text-xs font-semibold text-slate-400">Toplam Kayıtlı Firma</div>
            <div className="text-2xl font-black text-white mt-1">{stats.totalCompanies}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
            <Building2 size={20} />
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div>
            <div className="text-xs font-semibold text-slate-400">Sertifikalı Firmalar</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{stats.companiesWithCerts}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck size={20} />
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div>
            <div className="text-xs font-semibold text-slate-400">Düzenlenen Toplam Sertifika</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{stats.totalCerts}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Award size={20} />
          </div>
        </div>
      </div>

      {/* Arama ve Filtreleme Çubuğu */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Arama Alanı */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Firma Adı veya Koduna Göre Ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-9 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sayı Göstergesi */}
          <div className="text-xs text-slate-400 flex items-center gap-1.5 self-end sm:self-center">
            <span>Gösterilen:</span>
            <strong className="text-white font-bold bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
              {sortedAndFilteredCompanies.length}
            </strong>
            <span>/ {companies.length} firma</span>
          </div>
        </div>

        {/* Hızlı Filtre Butonları */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 mr-1">
            <Filter size={12} />
            <span>Filtre:</span>
          </span>

          <button
            onClick={() => setDangerFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              dangerFilter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Tümü ({companies.length})
          </button>

          <button
            onClick={() => setDangerFilter('with_certs')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              dangerFilter === 'with_certs'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Sertifikası Olanlar ({stats.companiesWithCerts})
          </button>

          <button
            onClick={() => setDangerFilter('cok_tehlikeli')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              dangerFilter === 'cok_tehlikeli'
                ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                : 'bg-slate-800/80 text-slate-400 hover:text-red-400'
            }`}
          >
            Çok Tehlikeli (1 Yıl)
          </button>

          <button
            onClick={() => setDangerFilter('tehlikeli')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              dangerFilter === 'tehlikeli'
                ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                : 'bg-slate-800/80 text-slate-400 hover:text-amber-400'
            }`}
          >
            Tehlikeli (2 Yıl)
          </button>

          <button
            onClick={() => setDangerFilter('az_tehlikeli')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              dangerFilter === 'az_tehlikeli'
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                : 'bg-slate-800/80 text-slate-400 hover:text-emerald-400'
            }`}
          >
            Az Tehlikeli (3 Yıl)
          </button>
        </div>
      </div>

      {/* FİRMA LİSTE TABLOSU (Kutu Kutu Değil, Satır Satır Liste) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {sortedAndFilteredCompanies.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm p-6">
            <Building2 size={36} className="mx-auto mb-3 text-slate-600 stroke-[1.5]" />
            <div className="font-semibold text-slate-400">
              {searchTerm.trim() || dangerFilter !== 'all' 
                ? 'Seçilen filtrelere uygun firma bulunamadı.' 
                : 'Sistemde henüz kayıtlı firma bulunmuyor.'}
            </div>
            {(searchTerm.trim() || dangerFilter !== 'all') && (
              <button
                onClick={() => { setSearchTerm(''); setDangerFilter('all'); }}
                className="mt-3 text-xs text-amber-400 hover:underline inline-flex items-center gap-1 font-semibold"
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4 min-w-[280px]">Firma Bilgisi</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Kısa Kod</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Tehlike Sınıfı</th>
                  <th className="py-3.5 px-4 min-w-[140px] text-center">Sertifika Durumu</th>
                  <th className="py-3.5 px-4 w-28 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {sortedAndFilteredCompanies.map((company, index) => {
                  const count = certCounts[company.id] || 0;
                  const badgeClass = getDangerClassBadgeClass(company.dangerClass);
                  const dangerLabel = getDangerClassLabel(company.dangerClass);

                  // Extract 2-letter monogram for avatar
                  const initials = company.shortName 
                    ? company.shortName.substring(0, 2).toUpperCase() 
                    : company.name.substring(0, 2).toUpperCase();

                  return (
                    <tr
                      key={company.id}
                      onClick={() => onSelectCompany(company)}
                      className="group hover:bg-slate-800/50 cursor-pointer transition-colors duration-150"
                    >
                      {/* Sıra No */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-500 text-[11px]">
                        {index + 1}
                      </td>

                      {/* Firma Adı ve İkon */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-amber-400 shrink-0 font-bold text-xs group-hover:border-amber-500/50 group-hover:bg-slate-700/60 transition">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white text-sm group-hover:text-amber-400 transition truncate max-w-md">
                              {company.name}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                              <span>ID: {company.id}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Kısa Kod */}
                      <td className="py-3.5 px-4">
                        {company.shortName ? (
                          <span className="font-mono text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                            {company.shortName}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Belirtilmedi</span>
                        )}
                      </td>

                      {/* Tehlike Sınıfı */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${badgeClass}`}>
                          {company.dangerClass === 'cok_tehlikeli' && <Flame size={12} />}
                          {company.dangerClass === 'tehlikeli' && <ShieldAlert size={12} />}
                          {company.dangerClass === 'az_tehlikeli' && <ShieldCheck size={12} />}
                          <span>{dangerLabel}</span>
                        </span>
                      </td>

                      {/* Düzenlenen Sertifika Sayısı */}
                      <td className="py-3.5 px-4 text-center">
                        {count > 0 ? (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-bold text-xs">
                            <Award size={13} />
                            <span>{count} Sertifika</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-800/40 border border-slate-800 px-2.5 py-0.5 rounded-full text-[11px]">
                            <span>0 Sertifika</span>
                          </span>
                        )}
                      </td>

                      {/* Aksiyon Butonu */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCompany(company);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 px-3 py-1.5 rounded-xl transition group-hover:border-amber-400/40 group-hover:translate-x-0.5"
                        >
                          <span>İncele</span>
                          <ChevronRight size={13} />
                        </button>
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
