import React, { useState, useMemo } from 'react';
import { Building2, Search, ChevronRight, Award, AlertTriangle, ShieldCheck, Plus } from 'lucide-react';
import { Company, IssuedCertificate } from '../types';
import { getDangerClassLabel, getDangerClassBadgeClass } from '../services/validityService';

interface CompaniesViewProps {
  companies: Company[];
  certificates: IssuedCertificate[];
  onSelectCompany: (company: Company) => void;
  isAdmin: boolean;
  onOpenSettings: () => void;
}

export const CompaniesView: React.FC<CompaniesViewProps> = ({
  companies,
  certificates,
  onSelectCompany,
  isAdmin,
  onOpenSettings
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Count certificates per company
  const certCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cert of certificates) {
      if (cert.company) {
        const k = cert.company.trim().toLowerCase();
        counts[k] = (counts[k] || 0) + 1;
      }
    }
    return counts;
  }, [certificates]);

  // Alphabetically sorted companies (Turkish locale support)
  const sortedAndFilteredCompanies = useMemo(() => {
    let list = [...companies];

    // Alphabetical sort (tr-TR)
    list.sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'));

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLocaleLowerCase('tr-TR');
      list = list.filter(c => 
        c.name.toLocaleLowerCase('tr-TR').includes(q) || 
        (c.shortName && c.shortName.toLocaleLowerCase('tr-TR').includes(q))
      );
    }

    return list;
  }, [companies, searchTerm]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6 custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="text-amber-400" size={26} />
            <span>Kayıtlı Firmalar</span>
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Sistemde kayıtlı firmaların alfabetik listesi, tehlike sınıfları ve sertifika sayıları
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-md"
          >
            <Plus size={15} />
            <span>Firma Ekle / Düzenle</span>
          </button>
        )}
      </div>

      {/* Search Bar & Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Firma Adı veya Koduna Göre Ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-white">{sortedAndFilteredCompanies.length}</span>
          <span>firma listeleniyor</span>
        </div>
      </div>

      {/* Alphabetical List */}
      {sortedAndFilteredCompanies.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
          {searchTerm.trim() ? 'Aramanıza uygun firma bulunamadı.' : 'Henüz kayıtlı firma bulunmuyor.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedAndFilteredCompanies.map((company) => {
            const count = certCounts[company.name.trim().toLowerCase()] || 0;
            const badgeClass = getDangerClassBadgeClass(company.dangerClass);
            const dangerLabel = getDangerClassLabel(company.dangerClass);

            return (
              <div
                key={company.id}
                onClick={() => onSelectCompany(company)}
                className="group cursor-pointer bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 transition-all duration-200 transform hover:-translate-y-1 shadow-md hover:shadow-xl relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0 font-bold text-sm group-hover:scale-105 transition">
                    {company.shortName ? company.shortName.substring(0, 3).toUpperCase() : company.name.substring(0, 2).toUpperCase()}
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
                    {dangerLabel}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="font-bold text-white text-base leading-tight group-hover:text-amber-400 transition truncate">
                    {company.name}
                  </h3>
                  {company.shortName && (
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      Kod: {company.shortName}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Award size={14} className="text-amber-500" />
                    <span><strong className="text-white">{count}</strong> Sertifika</span>
                  </div>

                  <div className="text-amber-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition">
                    <span>Sertifikaları Gör</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
