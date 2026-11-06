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
  X,
  FileCheck2,
  Sparkles
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
    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 custom-scrollbar">
      {/* ========================================================================= */}
      {/* 1. ÜST HERO BAŞLIK & SAYAÇLAR                                             */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold mb-2">
            <Sparkles size={13} className="text-amber-400 animate-pulse" />
            <span>Firma Kayıtları & İSG Tehlike Sınıfı Yönetimi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Kayıtlı Firmalar Portföyü</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Hizmet verilen firmaların İSG tehlike sınıfları, geçerlilik süreleri, aktif personelleri ve sertifika kayıtları.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-auto">
          {/* İstatistik Rozetleri */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5">
              <span>Toplam:</span>
              <strong className="text-white font-bold text-sm">{stats.totalCompanies}</strong>
            </span>
            <span className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5">
              <FileCheck2 size={13} />
              <span>Sertifikalı:</span>
              <strong className="font-bold text-sm text-emerald-300">{stats.companiesWithCerts}</strong>
            </span>
            <span className="bg-amber-950/40 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5">
              <Award size={13} />
              <span>Sertifika:</span>
              <strong className="font-bold text-sm text-amber-200">{stats.totalCerts}</strong>
            </span>
          </div>

          {isAdmin && (
            <button
              onClick={onOpenSettings}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black px-4 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Plus size={16} strokeWidth={3} />
              <span>Firma Ekle / Düzenle</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ARAMA VE TEHLİKE SINIFI FİLTRE BARI                                    */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/90 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
        {/* Arama Kutusu */}
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Firma Adı veya Kodu Ara..."
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
            onClick={() => setDangerFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              dangerFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            Tümü ({companies.length})
          </button>

          <button
            onClick={() => setDangerFilter('with_certs')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
              dangerFilter === 'with_certs'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <Award size={13} />
            <span>Sertifikalılar ({stats.companiesWithCerts})</span>
          </button>

          <button
            onClick={() => setDangerFilter('cok_tehlikeli')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
              dangerFilter === 'cok_tehlikeli'
                ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                : 'bg-slate-800/70 text-slate-300 hover:text-rose-300 border border-slate-700/60'
            }`}
          >
            <Flame size={13} className="text-rose-400" />
            <span>Çok Tehlikeli (1 Yıl)</span>
          </button>

          <button
            onClick={() => setDangerFilter('tehlikeli')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
              dangerFilter === 'tehlikeli'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-800/70 text-slate-300 hover:text-amber-300 border border-slate-700/60'
            }`}
          >
            <ShieldAlert size={13} className="text-amber-400" />
            <span>Tehlikeli (2 Yıl)</span>
          </button>

          <button
            onClick={() => setDangerFilter('az_tehlikeli')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
              dangerFilter === 'az_tehlikeli'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/70 text-slate-300 hover:text-emerald-300 border border-slate-700/60'
            }`}
          >
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Az Tehlikeli (3 Yıl)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FİRMA LİSTESİ TABLOSU                                                  */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
        {sortedAndFilteredCompanies.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs p-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto mb-3 text-slate-500">
              <Building2 size={32} strokeWidth={1.5} />
            </div>
            <div className="font-bold text-white text-sm">
              {searchTerm.trim() || dangerFilter !== 'all' 
                ? 'Seçilen filtrelere uygun firma bulunamadı.' 
                : 'Sistemde henüz kayıtlı firma bulunmuyor.'}
            </div>
            <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
              Filtreleri temizleyebilir veya Ayarlar sekmesinden yeni firma tanımlayabilirsiniz.
            </p>
            {(searchTerm.trim() || dangerFilter !== 'all') && (
              <button
                onClick={() => { setSearchTerm(''); setDangerFilter('all'); }}
                className="mt-3 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 font-bold transition"
              >
                <X size={12} /> Filtreleri Temizle
              </button>
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/90 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3.5 w-12 text-center">#</th>
                  <th className="py-3 px-3">Firma Adı & Ünvanı</th>
                  <th className="py-3 px-3 w-36 hidden md:table-cell font-mono">Kısa Kod</th>
                  <th className="py-3 px-3 w-44">İSG Tehlike Sınıfı</th>
                  <th className="py-3 px-3 w-32 text-center">Düzenlenen Belge</th>
                  <th className="py-3 px-3.5 w-20 text-right">Detay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-xs">
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
                      className="group hover:bg-slate-800/50 cursor-pointer transition-colors duration-150"
                    >
                      {/* Sıra No */}
                      <td className="py-3 px-3.5 text-center font-mono text-slate-500 text-[11px]">
                        {index + 1}
                      </td>

                      {/* Firma Bilgisi */}
                      <td className="py-3 px-3 truncate">
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-amber-400 shrink-0 font-bold text-xs group-hover:border-amber-500/50 group-hover:bg-slate-750 transition shadow-inner">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-white group-hover:text-amber-400 transition truncate text-xs block">
                              {company.name}
                            </span>
                            <span className="text-[10px] text-slate-500 hidden sm:block">
                              {count > 0 ? `${count} adet aktif sertifikalı personel` : 'Henüz sertifika düzenlenmemiş'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Kısa Kod */}
                      <td className="py-3 px-3 hidden md:table-cell truncate">
                        {company.shortName ? (
                          <span className="font-mono text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-md">
                            {company.shortName}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Tehlike Sınıfı */}
                      <td className="py-3 px-3 truncate">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${badgeClass}`}>
                          {company.dangerClass === 'cok_tehlikeli' && <Flame size={12} />}
                          {company.dangerClass === 'tehlikeli' && <ShieldAlert size={12} />}
                          {company.dangerClass === 'az_tehlikeli' && <ShieldCheck size={12} />}
                          <span className="truncate">{dangerLabel}</span>
                        </span>
                      </td>

                      {/* Sertifika Sayısı */}
                      <td className="py-3 px-3 text-center">
                        {count > 0 ? (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-bold text-[11px] shadow-sm">
                            <Award size={13} className="text-emerald-400" />
                            <span>{count} Belge</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">0</span>
                        )}
                      </td>

                      {/* İşlem */}
                      <td className="py-3 px-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCompany(company);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 group-hover:text-amber-400 group-hover:bg-slate-800 transition"
                          title="Firma Personel ve Sertifika Listesini Aç"
                        >
                          <ChevronRight size={17} />
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
