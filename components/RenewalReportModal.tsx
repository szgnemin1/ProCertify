import React, { useState, useMemo } from 'react';
import { X, Printer, Copy, Check, AlertTriangle, Building2, Calendar, FileText, ShieldAlert } from 'lucide-react';
import { IssuedCertificate } from '../types';
import { getCertificateStatus, getDaysRemaining, formatDateTR, getDangerClassLabel } from '../services/validityService';

interface RenewalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificates: IssuedCertificate[];
}

export const RenewalReportModal: React.FC<RenewalReportModalProps> = ({
  isOpen,
  onClose,
  certificates
}) => {
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'expired' | 'expiring'>('all');
  const [copied, setCopied] = useState(false);

  // Distinct companies from certificates
  const companyList = useMemo(() => {
    const map = new Map<string, string>();
    certificates.forEach(c => {
      const name = c.company || 'Genel Katılımcı';
      if (!map.has(name)) map.set(name, name);
    });
    return Array.from(map.values()).sort();
  }, [certificates]);

  // Target expiring & expired certificates
  const renewalItems = useMemo(() => {
    return certificates.filter(c => {
      const status = getCertificateStatus(c.expiryDate);
      if (status === 'valid') return false; // Only expired or expiring

      if (filterType === 'expired' && status !== 'expired') return false;
      if (filterType === 'expiring' && status !== 'expiring_soon') return false;

      if (selectedCompany !== 'all' && (c.company || 'Genel Katılımcı') !== selectedCompany) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      const daysA = getDaysRemaining(a.expiryDate);
      const daysB = getDaysRemaining(b.expiryDate);
      return daysA - daysB; // Most urgent first
    });
  }, [certificates, selectedCompany, filterType]);

  const handleCopyTsv = () => {
    if (renewalItems.length === 0) return;
    const header = ['Sıra No', 'Adı Soyadı', 'T.C. Kimlik No', 'Firma', 'Görevi', 'Son Eğitim', 'Geçerlilik Bitiş', 'Kalan Gün', 'Durum'].join('\t');
    const rows = renewalItems.map((c, i) => {
      const days = getDaysRemaining(c.expiryDate);
      const statusText = days < 0 ? `Süresi Doldu (${Math.abs(days)} gün önce)` : `${days} gün kaldı`;
      return [
        i + 1,
        c.recipientName || '-',
        c.recipientTc || '-',
        c.company || '-',
        (c.fields && c.fields['GÖREVİ']) || '-',
        c.trainingDate || c.date || '-',
        c.expiryDate || '-',
        days,
        statusText
      ].join('\t');
    });

    const tsv = [header, ...rows].join('\n');
    navigator.clipboard.writeText(tsv).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white text-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        
        {/* Modal Header (No-Print Controls) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">İSG Eğitim Yenileme Listesi & Resmi Teklif Formu</h2>
              <p className="text-xs text-slate-400">Geçerlilik süresi dolan veya yaklaşan personeller için resmi bildirim dökümü</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyTsv}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700"
              title="Excel'e yapıştırmak üzere kopyala"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Excel İçin Kopyalandı!' : 'Excel Tablosu Kopyala'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <Printer size={14} />
              <span>Yazdır / PDF Kaydet</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter Controls (No-Print) */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <Building2 size={14} /> Firma Seçimi:
            </span>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-500 shadow-sm"
            >
              <option value="all">Tüm Firmalar ({companyList.length})</option>
              {companyList.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${filterType === 'all' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Tümü ({certificates.filter(c => getCertificateStatus(c.expiryDate) !== 'valid').length})
            </button>
            <button
              onClick={() => setFilterType('expired')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${filterType === 'expired' ? 'bg-white shadow text-rose-600' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Süresi Dolanlar
            </button>
            <button
              onClick={() => setFilterType('expiring')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${filterType === 'expiring' ? 'bg-white shadow text-amber-600' : 'text-slate-600 hover:text-slate-900'}`}
            >
              30 Gün Kalanlar
            </button>
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 bg-white">
          
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h1 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-wide">
                İŞ SAĞLIĞI VE GÜVENLİĞİ EĞİTİM YENİLEME BİLDİRİMİ VE TEKLİF RAPORU
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                6331 Sayılı İSG Kanunu Madde 16 & 17 ve İlgili Yönetmelik Kapsamında Düzenlenmiştir
              </p>
            </div>
            <div className="text-right text-xs font-mono text-slate-600">
              <p>Tarih: <strong>{new Date().toLocaleDateString('tr-TR')}</strong></p>
              <p className="text-[10px] text-slate-400">Rapor No: RPT-{Date.now().toString().slice(-6)}</p>
            </div>
          </div>

          {/* Target Company Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap justify-between items-center text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Muhatap Kurum / Firma</span>
              <span className="text-sm font-extrabold text-slate-900 uppercase">
                {selectedCompany === 'all' ? 'TÜM KAYITLI FİRMALAR' : selectedCompany}
              </span>
            </div>
            <div className="text-right text-xs space-y-0.5">
              <span className="text-slate-500 block">Tespit Edilen Yenileme İhtiyacı:</span>
              <span className="text-sm font-black text-rose-600">{renewalItems.length} Çalışan</span>
            </div>
          </div>

          {/* Legal Advisory Notice */}
          <div className="p-3.5 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-xl text-xs text-slate-700 leading-relaxed">
            <strong>Sayın Firma Yetkilisi,</strong><br />
            6331 sayılı İş Sağlığı ve Güvenliği Kanunu uyarınca, işveren çalışanların iş sağlığı ve güvenliği eğitimlerini tehlike sınıfına göre periyodik olarak yenilemekle yükümlüdür. Aşağıdaki listede yer alan personellerinizin yasal eğitim geçerlilik süreleri sona ermiş ya da dolmak üzeredir. Cezai müeyyideler ve denetim risklerinin önlenmesi amacıyla yenileme eğitimlerinin ivedilikle planlanması önem arz etmektedir.
          </div>

          {/* Table */}
          {renewalItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              Bu filtre kriterinde eğitim yenilemesi gereken personel bulunmamaktadır.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Katılımcı Adı Soyadı</th>
                    <th className="py-2.5 px-3">T.C. Kimlik No</th>
                    {selectedCompany === 'all' && <th className="py-2.5 px-3">Firma</th>}
                    <th className="py-2.5 px-3">Görevi</th>
                    <th className="py-2.5 px-3">Bitiş Tarihi</th>
                    <th className="py-2.5 px-3 text-right">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {renewalItems.map((c, i) => {
                    const days = getDaysRemaining(c.expiryDate);
                    const isExpired = days < 0;
                    return (
                      <tr key={c.serialNo + i} className="hover:bg-slate-50/80 transition">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">{i + 1}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{c.recipientName || 'İsimsiz'}</td>
                        <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">{c.recipientTc || '-'}</td>
                        {selectedCompany === 'all' && (
                          <td className="py-2 px-3 text-slate-700 max-w-[150px] truncate">{c.company || '-'}</td>
                        )}
                        <td className="py-2 px-3 text-slate-600">{(c.fields && c.fields['GÖREVİ']) || '-'}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-700">{(c.expiryDate && !isNaN(new Date(c.expiryDate).getTime()) ? formatDateTR(new Date(c.expiryDate)) : (c.expiryDate || '-'))}</td>
                        <td className="py-2 px-3 text-right font-bold text-xs">
                          {isExpired ? (
                            <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-mono text-[11px]">
                              Süresi Doldu ({Math.abs(days)} gün)
                            </span>
                          ) : (
                            <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-mono text-[11px]">
                              {days} Gün Kaldı
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Official Signature Lines */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <p className="font-bold text-slate-800">Bildirimi Yapan Yetkili / OSGB</p>
              <p className="text-[11px] text-slate-500">İş Sağlığı ve Güvenliği Hizmetleri</p>
              <div className="mt-10 border-b border-dashed border-slate-300 w-48 mx-auto"></div>
              <p className="text-[10px] text-slate-400 mt-1">İmza & Kaşe</p>
            </div>
            <div>
              <p className="font-bold text-slate-800">Tebellüğ Eden İşveren / Temsilci</p>
              <p className="text-[11px] text-slate-500">Teslim Alan Firma Yetkilisi</p>
              <div className="mt-10 border-b border-dashed border-slate-300 w-48 mx-auto"></div>
              <p className="text-[10px] text-slate-400 mt-1">İmza & Tarih</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
