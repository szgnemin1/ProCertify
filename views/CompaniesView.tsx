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
  Filter,
  X
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
    <div className="flex-1 overflow-y-auto bg-slate-950 p-3 sm:p-4 space-y-3 custom-scrollbar">
      {/* Üst Bar: Kompakt Başlık, Sayaç Rozetleri & Yeni Firma Butonu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/80">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="text-amber-400 shrink-0" size={20} />
            <h1 className="text-lg font-black text-white tracking-tight">Kayıtlı Firmalar</h1>
          </div>

          {/* Kompakt Yatay Sayaç Rozetleri */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium">
            <span className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
              Toplam: <strong className="text-white font-bold">{stats.totalCompanies}</strong>
            </span>
            <span className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-md">
              Sertifikalı: <strong className="font-bold">{stats.companiesWithCerts}</strong>
            </span>
            <span className="bg-amber-950/40 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-md">
              Sertifika: <strong className="font-bold">{stats.totalCerts}</strong>
            </span>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm active:scale-95 self-start sm:self-auto shrink-0"
          >
            <Plus size={14} />
            <span>Firma Ekle / Düzenle</span>
          </button>
        )}
      </div>

      {/* Kompakt Arama ve Hızlı Filtre Satırı */}
      <div className="bg-slate-900/90 border border-slate-800/90 px-3 py-2 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Arama Kutusu */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Firma Adı veya Kodu Ara..."
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
            onClick={() => setDangerFilter('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              dangerFilter === 'all'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Tümü ({companies.length})
          </button>

          <button
            onClick={() => setDangerFilter('with_certs')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              dangerFilter === 'with_certs'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Sertifikalılar ({stats.companiesWithCerts})
          </button>

          <button
            onClick={() => setDangerFilter('cok_tehlikeli')}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
              dangerFilter === 'cok_tehlikeli'
                ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                : 'bg-slate-800/70 text-slate-400 hover:text-red-300'
            }`}
          >
            Çok Tehlikeli (1 Yıl)
          </button>

          <button
            onClick={() => setDangerFilter('tehlikeli')}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
              dangerFilter === 'tehlikeli'
                ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                : 'bg-slate-800/70 text-slate-400 hover:text-amber-300'
            }`}
          >
            Tehlikeli (2 Yıl)
          </button>

          <button
            onClick={() => setDangerFilter('az_tehlikeli')}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
              dangerFilter === 'az_tehlikeli'
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                : 'bg-slate-800/70 text-slate-400 hover:text-emerald-300'
            }`}
          >
            Az Tehlikeli (3 Yıl)
          </button>

          <span className="text-[11px] text-slate-400 ml-1 font-mono">
            {sortedAndFilteredCompanies.length} firma
          </span>
        </div>
      </div>

      {/* KOMPAKT LİSTE TABLOSU (Genişliği ekrana sığar, yatay kaydırma gerektirmez) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        {sortedAndFilteredCompanies.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-xs p-4">
            <Building2 size={28} className="mx-auto mb-2 text-slate-600 stroke-[1.5]" />
            <div className="font-semibold text-slate-400">
              {searchTerm.trim() || dangerFilter !== 'all' 
                ? 'Seçilen filtrelere uygun firma bulunamadı.' 
                : 'Sistemde henüz kayıtlı firma bulunmuyor.'}
            </div>
            {(searchTerm.trim() || dangerFilter !== 'all') && (
              <button
                onClick={() => { setSearchTerm(''); setDangerFilter('all'); }}
                className="mt-2 text-xs text-amber-400 hover:underline inline-flex items-center gap-1 font-semibold"
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2 px-2.5 w-10 text-center">#</th>
                  <th className="py-2 px-2.5">Firma Adı</th>
                  <th className="py-2 px-2 w-32 hidden md:table-cell">Kısa Kod</th>
                  <th className="py-2 px-2 w-36">Tehlike Sınıfı</th>
                  <th className="py-2 px-2 w-28 text-center">Sertifika</th>
                  <th className="py-2 px-2 w-14 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-medium text-xs">
                {sortedAndFilteredCompanies.map((company, index) => {
                  const count = certCounts[company.id] || 0;
                  const badgeClass = getDangerClassBadgeClass(company.dangerClass);
                  const dangerLabel = getDangerClassLabel(company.dangerClass);

                  // Extract 2-letter monogram
                  const initials = company.shortName 
                    ? company.shortName.substring(0, 2).toUpperCase() 
                    : company.name.substring(0, 2).toUpperCase();

                  return (
                    <tr
                      key={company.id}
                      onClick={() => onSelectCompany(company)}
                      className="group hover:bg-slate-800/60 cursor-pointer transition-colors duration-100"
                    >
                      {/* Sıra No */}
                      <td className="py-2 px-2.5 text-center font-mono text-slate-500 text-[11px]">
                        {index + 1}
                      </td>

                      {/* Firma Bilgisi */}
                      <td className="py-2 px-2.5 truncate">
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700/80 flex items-center justify-center text-amber-400 shrink-0 font-bold text-[10px] group-hover:border-amber-500/50 group-hover:bg-slate-700 transition">
                            {initials}
                          </div>
                          <span className="font-semibold text-white group-hover:text-amber-400 transition truncate text-xs">
                            {company.name}
                          </span>
                        </div>
                      </td>

                      {/* Kısa Kod */}
                      <td className="py-2 px-2 hidden md:table-cell truncate">
                        {company.shortName ? (
                          <span className="font-mono text-[11px] text-amber-300/80 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                            {company.shortName}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Tehlike Sınıfı */}
                      <td className="py-2 px-2 truncate">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass}`}>
                          {company.dangerClass === 'cok_tehlikeli' && <Flame size={10} />}
                          {company.dangerClass === 'tehlikeli' && <ShieldAlert size={10} />}
                          {company.dangerClass === 'az_tehlikeli' && <ShieldCheck size={10} />}
                          <span className="truncate">{dangerLabel}</span>
                        </span>
                      </td>

                      {/* Sertifika Sayısı */}
                      <td className="py-2 px-2 text-center">
                        {count > 0 ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold text-[10px]">
                            <Award size={11} />
                            <span>{count}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">0</span>
                        )}
                      </td>

                      {/* İşlem */}
                      <td className="py-2 px-2 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCompany(company);
                          }}
                          className="p-1 rounded-md text-slate-400 group-hover:text-amber-400 group-hover:bg-slate-700/60 transition"
                          title="Firma Detayını Gör"
                        >
                          <ChevronRight size={15} />
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
