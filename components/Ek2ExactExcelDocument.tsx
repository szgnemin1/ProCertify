import React, { useState } from 'react';
import { 
  Check, 
  X, 
  PenTool, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { Ek2FieldMappingItem } from '../types';

interface Ek2ExactExcelDocumentProps {
  formData: Record<string, any>;
  onUpdateField: (key: string, value: any) => void;
  employeeSignature?: string;
  onOpenSignaturePad?: () => void;
  activeQuestions?: Ek2FieldMappingItem[];
  readOnly?: boolean;
}

export const Ek2ExactExcelDocument: React.FC<Ek2ExactExcelDocumentProps> = ({
  formData,
  onUpdateField,
  employeeSignature,
  onOpenSignaturePad,
  activeQuestions = [],
  readOnly = false
}) => {
  const [currentPage, setCurrentPage] = useState<1 | 2>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Check if a question is enabled
  const isEnabled = (fieldKey: string) => {
    if (!activeQuestions || activeQuestions.length === 0) return true;
    const item = activeQuestions.find(q => q.fieldKey === fieldKey);
    return item ? item.enabled !== false : true;
  };

  // Helper to render editable table cell input
  const renderCellInput = (
    fieldKey: string, 
    placeholder: string = '', 
    type: 'text' | 'textarea' | 'number' = 'text',
    className: string = ''
  ) => {
    const enabled = isEnabled(fieldKey);
    const val = formData[fieldKey] || '';

    if (!enabled) {
      return (
        <div className="w-full h-full bg-slate-100/80 text-slate-400 italic text-[11px] flex items-center px-2 select-none">
          (Sorulmuyor / Muaf)
        </div>
      );
    }

    if (readOnly) {
      return (
        <div className={`w-full px-2 py-1 text-slate-900 font-semibold text-xs whitespace-pre-wrap ${className}`}>
          {val || '-'}
        </div>
      );
    }

    if (type === 'textarea') {
      return (
        <textarea
          rows={3}
          value={val}
          onChange={(e) => onUpdateField(fieldKey, e.target.value)}
          placeholder={placeholder}
          className={`w-full h-full p-1.5 bg-amber-50/20 focus:bg-white text-slate-900 font-medium text-xs outline-none border-none resize-none transition focus:ring-1 focus:ring-teal-500 ${className}`}
        />
      );
    }

    return (
      <input
        type={type}
        value={val}
        onChange={(e) => onUpdateField(fieldKey, e.target.value)}
        placeholder={placeholder}
        className={`w-full h-full px-2 py-1 bg-amber-50/20 focus:bg-white text-slate-900 font-medium text-xs outline-none border-none transition focus:ring-1 focus:ring-teal-500 ${className}`}
      />
    );
  };

  // Helper to render Evet / Hayır / Tarih row inside the Excel Anamnez table
  const renderAnamnezRow = (
    label: string, 
    fieldKey: string, 
    dateKey?: string,
    isDisease: boolean = false
  ) => {
    const enabled = isEnabled(fieldKey);
    const currentVal = formData[fieldKey] || 'Hayır';
    const dateVal = dateKey ? (formData[dateKey] || '') : '';

    if (!enabled) {
      return (
        <tr className="border-b border-slate-300 bg-slate-50/50 opacity-60">
          <td className="p-1.5 text-[11px] text-slate-400 font-medium line-through">{label}</td>
          <td colSpan={3} className="p-1 text-center text-[10px] text-slate-400 italic">
            Devre Dışı
          </td>
        </tr>
      );
    }

    return (
      <tr className="border-b border-slate-300 hover:bg-teal-50/30 transition">
        <td className="p-1.5 text-xs text-slate-900 font-semibold border-r border-slate-300">
          {label}
        </td>

        {/* Evet Toggle */}
        <td 
          onClick={() => !readOnly && onUpdateField(fieldKey, 'Evet')}
          className={`w-12 text-center p-1 border-r border-slate-300 cursor-pointer select-none transition ${
            currentVal === 'Evet' 
              ? 'bg-rose-500 text-white font-bold shadow-inner' 
              : 'hover:bg-rose-100 text-slate-500 text-xs'
          }`}
        >
          {currentVal === 'Evet' ? 'EVET' : 'E'}
        </td>

        {/* Hayır Toggle */}
        <td 
          onClick={() => !readOnly && onUpdateField(fieldKey, 'Hayır')}
          className={`w-12 text-center p-1 border-r border-slate-300 cursor-pointer select-none transition ${
            currentVal === 'Hayır' 
              ? 'bg-emerald-600 text-white font-bold shadow-inner' 
              : 'hover:bg-emerald-100 text-slate-500 text-xs'
          }`}
        >
          {currentVal === 'Hayır' ? 'HAYIR' : 'H'}
        </td>

        {/* Tarih / Not */}
        <td className="p-0.5 w-28">
          {dateKey ? (
            <input
              type="text"
              value={dateVal}
              disabled={readOnly || currentVal !== 'Evet'}
              onChange={(e) => onUpdateField(dateKey, e.target.value)}
              placeholder={currentVal === 'Evet' ? 'Tarih / Tanı' : '-'}
              className="w-full px-1.5 py-0.5 text-[11px] bg-transparent text-slate-800 outline-none placeholder-slate-400 disabled:opacity-30"
            />
          ) : (
            <span className="text-[10px] text-slate-400 text-center block">-</span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Document Controller Toolbar */}
      <div className="w-full max-w-5xl bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4 mb-6 sticky top-20 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Resmi Ek-2 İşe Giriş / Periyodik Muayene Belgesi
            </h3>
            <p className="text-[11px] text-teal-300 font-mono">
              Çankaya OSGB Standart Excel Şablonu (Birebir Tasarım)
            </p>
          </div>
        </div>

        {/* Page Switcher */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              currentPage === 1 
                ? 'bg-teal-600 text-white shadow-md' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Sayfa 1 (İşyeri & Anamnez)
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(2)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              currentPage === 2 
                ? 'bg-teal-600 text-white shadow-md' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Sayfa 2 (Muayene & Karar)
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.max(70, prev - 10))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Uzaklaştır"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold w-12 text-center text-teal-300">
            %{zoomLevel}
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.min(130, prev + 10))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Yakınlaştır"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(100)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Sıfırla"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
            title="Yazdır"
          >
            <Printer className="w-4 h-4 text-teal-400" />
            Yazdır
          </button>
        </div>
      </div>

      {/* Scaled Printable Document Sheet Container */}
      <div 
        className="w-full flex justify-center transition-all duration-200"
        style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
      >
        <div className="w-[850px] bg-white text-slate-900 border-2 border-slate-400 shadow-2xl p-7 font-sans print:border-none print:shadow-none print:p-0 my-4 min-h-[1100px] flex flex-col justify-between">
          
          {/* ================= PAGE 1 ================= */}
          {currentPage === 1 && (
            <div className="flex-1 flex flex-col justify-between">
              <div>
                {/* 1. HEADER SECTION (Çankaya OSGB Logo + Title + Photo Box) */}
                <div className="flex items-center justify-between border-2 border-slate-900 p-3 mb-2 bg-gradient-to-r from-slate-50 to-white">
                  {/* Left: Çankaya OSGB Logo */}
                  <div className="w-44 flex flex-col items-center">
                    <img 
                      src="/logo_cankaya.png" 
                      alt="Çankaya OSGB" 
                      className="h-14 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/cankaya_logo.png';
                      }}
                    />
                  </div>

                  {/* Center: Title */}
                  <div className="flex-1 text-center px-4">
                    <h1 className="text-xl font-black text-slate-900 tracking-wider uppercase leading-tight font-serif">
                      İŞE GİRİŞ / PERİYODİK<br />MUAYENE FORMU
                    </h1>
                    <p className="text-[11px] text-slate-600 mt-1 font-semibold">
                      (6331 Sayılı İş Sağlığı ve Güvenliği Kanunu Ek-2 Standart Formu)
                    </p>
                  </div>

                  {/* Right: Photo Box */}
                  <div className="w-24 h-28 border-2 border-dashed border-slate-400 rounded bg-slate-50 flex flex-col items-center justify-center p-1 text-center">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      FOTOĞRAF
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5">3.5 x 4.5</span>
                  </div>
                </div>

                {/* 2. İŞYERİ BİLGİLERİ TABLOSU */}
                <table className="w-full border-collapse border-2 border-slate-900 text-xs mb-2">
                  <tbody>
                    <tr className="border-b border-slate-900">
                      <td className="w-36 bg-slate-100 p-1.5 font-bold border-r border-slate-900 text-slate-800">
                        İŞYERİ ÜNVANI
                      </td>
                      <td className="p-0" colSpan={3}>
                        {renderCellInput('isyeriUnvani', 'İşyeri tam ticari ünvanı')}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="bg-slate-100 p-1.5 font-bold border-r border-slate-900 text-slate-800">
                        SGK SİCİL NO
                      </td>
                      <td className="p-0 w-80 border-r border-slate-900">
                        {renderCellInput('sgkSicilNo', 'SGK İşyeri Sicil No')}
                      </td>
                      <td className="w-28 bg-slate-100 p-1.5 font-bold border-r border-slate-900 text-slate-800">
                        PROTOKOL NO
                      </td>
                      <td className="p-0">
                        {renderCellInput('protokolNo', 'PRT-XXXXXX')}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="bg-slate-100 p-1.5 font-bold border-r border-slate-900 text-slate-800">
                        ADRES
                      </td>
                      <td className="p-0" colSpan={3}>
                        {renderCellInput('isyeriAdresi', 'İşyeri açık adresi')}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-slate-100 p-1.5 font-bold border-r border-slate-900 text-slate-800">
                        TEL / FAKS / E-POSTA
                      </td>
                      <td className="p-0" colSpan={3}>
                        {renderCellInput('isyeriIletisim', 'İletişim bilgileri')}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* 3. ÇALIŞANIN BEYANI VE İMZA KUTUSU */}
                <div className="border-2 border-slate-900 p-2 mb-2 bg-amber-50/20 text-xs flex items-center justify-between gap-4">
                  <div className="flex-1 text-[11px] leading-relaxed text-slate-800 italic pr-4">
                    <strong>Çalışanın Beyanı:</strong> "İşe giriş/periyodik muayene olmayı kabul ettiğimi ve muayene sırasında verdiğim bilgilerin doğru ve eksiksiz olduğunu beyan ederim."
                  </div>
                  
                  {/* Signature Box */}
                  <div 
                    onClick={onOpenSignaturePad}
                    className="w-48 h-18 border-2 border-slate-700 rounded bg-white flex flex-col items-center justify-center p-1 cursor-pointer hover:border-teal-600 transition shadow-sm relative group"
                    title="İmza atmak veya güncellemek için tıklayın"
                  >
                    {employeeSignature ? (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <img 
                          src={employeeSignature} 
                          alt="Çalışan İmzası" 
                          className="max-h-12 max-w-full object-contain"
                        />
                        <span className="text-[9px] font-bold text-emerald-700 mt-0.5">✓ İmzalandı</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-teal-600">
                        <PenTool className="w-4 h-4 mb-0.5" />
                        <span className="text-[10px] font-bold">Çalışan İmzası (Tıklayın)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. ÇALIŞANIN KİMLİK VE İLETİŞİM BİLGİLERİ */}
                <div className="bg-slate-800 text-white px-2 py-1 text-xs font-bold uppercase tracking-wider mb-0.5">
                  ÇALIŞANIN:
                </div>
                <table className="w-full border-collapse border-2 border-slate-900 text-xs mb-2">
                  <tbody>
                    <tr className="border-b border-slate-900">
                      <td className="w-36 bg-slate-100 p-1 font-bold border-r border-slate-900">Adı ve Soyadı:</td>
                      <td className="p-0 border-r border-slate-900 font-bold">{renderCellInput('adSoyad', 'Çalışanın tam adı')}</td>
                      <td className="w-32 bg-slate-100 p-1 font-bold border-r border-slate-900">T.C. Kimlik No:</td>
                      <td className="p-0 w-36 font-mono font-bold">{renderCellInput('tckn', '11 haneli TCKN')}</td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="bg-slate-100 p-1 font-bold border-r border-slate-900">Ev Adresi:</td>
                      <td className="p-0" colSpan={3}>{renderCellInput('evAdresi', 'İkametgah adresi')}</td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="bg-slate-100 p-1 font-bold border-r border-slate-900">Doğum Yeri ve Tarihi:</td>
                      <td className="p-0 border-r border-slate-900">{renderCellInput('dogumYeriTarihi', 'Örn: Ankara - 15.05.1990')}</td>
                      <td className="bg-slate-100 p-1 font-bold border-r border-slate-900">Medeni Durumu:</td>
                      <td className="p-0">{renderCellInput('medeniDurumu', 'Bekar / Evli')}</td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="bg-slate-100 p-1 font-bold border-r border-slate-900">Telefon No:</td>
                      <td className="p-0 border-r border-slate-900">{renderCellInput('telefonNo', '05XX XXX XX XX')}</td>
                      <td className="bg-slate-100 p-1 font-bold border-r border-slate-900">Eğitim Durumu:</td>
                      <td className="p-0">{renderCellInput('egitimDurumu', 'Lise / Üniversite vb.')}</td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="bg-slate-100 p-1 font-bold border-r border-slate-900">Mesleği:</td>
                      <td className="p-0 border-r border-slate-900">{renderCellInput('meslegi', 'Mesleği')}</td>
                      <td className="bg-slate-100 p-1 font-bold border-r border-slate-900">Çalıştığı Bölüm:</td>
                      <td className="p-0">{renderCellInput('calistigiBolum', 'Bölüm / Departman')}</td>
                    </tr>
                    <tr>
                      <td className="bg-slate-100 p-1 font-bold border-r border-slate-900">Yaptığı İş (Ayrıntılı):</td>
                      <td className="p-0" colSpan={3}>{renderCellInput('yaptigiIs', 'İş tanımı ve görevleri...')}</td>
                    </tr>
                  </tbody>
                </table>

                {/* 5. DAHA ÖNCE ÇALIŞTIĞI YERLER */}
                <div className="bg-slate-800 text-white px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider mb-0.5">
                  Daha Önce Çalıştığı Yerler (Bugünden geçmişe doğru):
                </div>
                <table className="w-full border-collapse border-2 border-slate-900 text-xs mb-2">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-900 text-[11px]">
                      <th className="p-1 border-r border-slate-900 w-12 text-center">No</th>
                      <th className="p-1 border-r border-slate-900 text-left">İşkolu</th>
                      <th className="p-1 border-r border-slate-900 text-left">Yaptığı İş</th>
                      <th className="p-1 text-left w-36">Giriş-Çıkış Tarihi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-300">
                      <td className="p-1 text-center font-bold border-r border-slate-900">1.</td>
                      <td className="p-0 border-r border-slate-900">{renderCellInput('past_job_1_col', 'Örn: İnşaat')}</td>
                      <td className="p-0 border-r border-slate-900">{renderCellInput('past_job_1_work', 'Örn: Sıva / Boya')}</td>
                      <td className="p-0">{renderCellInput('past_job_1_date', '2020 - 2023')}</td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <td className="p-1 text-center font-bold border-r border-slate-900">2.</td>
                      <td className="p-0 border-r border-slate-900">{renderCellInput('past_job_2_col', 'Örn: Lojistik')}</td>
                      <td className="p-0 border-r border-slate-900">{renderCellInput('past_job_2_work', 'Örn: Depo Görevlisi')}</td>
                      <td className="p-0">{renderCellInput('past_job_2_date', '2018 - 2020')}</td>
                    </tr>
                    <tr>
                      <td className="p-1 text-center font-bold border-r border-slate-900">3.</td>
                      <td className="p-0 border-r border-slate-900">{renderCellInput('past_job_3_col', '-')}</td>
                      <td className="p-0 border-r border-slate-900">{renderCellInput('past_job_3_work', '-')}</td>
                      <td className="p-0">{renderCellInput('past_job_3_date', '-')}</td>
                    </tr>
                  </tbody>
                </table>

                {/* 6. TIBBİ ANAMNEZ TABLOSU (Birebir 2 Sütunlu Excel Grid) */}
                <div className="bg-slate-800 text-white px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider mb-0.5">
                  TIBBİ ANAMNEZ:
                </div>
                <div className="grid grid-cols-2 gap-2 border-2 border-slate-900 p-1 mb-2">
                  {/* Sol Sütun: 1. Yakınmalar */}
                  <div>
                    <div className="bg-slate-100 p-1 text-[11px] font-bold border border-slate-400 mb-1">
                      1. Aşağıdaki yakınmalardan herhangi birini yaşadınız mı?
                    </div>
                    <table className="w-full border-collapse border border-slate-400 text-xs">
                      <thead>
                        <tr className="bg-slate-200 border-b border-slate-400 text-[10px]">
                          <th className="p-1 text-left">Yakınma</th>
                          <th className="p-1 w-10 text-center">Evet</th>
                          <th className="p-1 w-10 text-center">Hayır</th>
                          <th className="p-1 w-24 text-center">Tarih</th>
                        </tr>
                      </thead>
                      <tbody>
                        {renderAnamnezRow('Balgamlı Öksürük', 'an_balgamli_oksuruk', 'an_date_balgam')}
                        {renderAnamnezRow('Nefes Darlığı', 'an_nefes_darligi', 'an_date_nefes')}
                        {renderAnamnezRow('Göğüs Ağrısı', 'an_gogus_agrisi', 'an_date_gogus')}
                        {renderAnamnezRow('Çarpıntı', 'an_carpinti', 'an_date_carpinti')}
                        {renderAnamnezRow('Sırt Ağrısı', 'an_sirt_agrisi', 'an_date_sirt')}
                        {renderAnamnezRow('İshal veya Kabızlık', 'an_ishal_kabizlik', 'an_date_ishal')}
                        {renderAnamnezRow('Eklemlerde Ağrı', 'an_eklem_agrisi', 'an_date_eklem')}
                        <tr className="border-b border-slate-300">
                          <td className="p-1 text-xs font-semibold" colSpan={4}>
                            Diğer belirtiniz: {renderCellInput('an_diger_belirti', 'Varsa yazınız...')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Sağ Sütun: 2. Hastalıklar */}
                  <div>
                    <div className="bg-slate-100 p-1 text-[11px] font-bold border border-slate-400 mb-1">
                      2. Aşağıdaki hastalıklardan herhangi biri için teşhis konuldu mu?
                    </div>
                    <table className="w-full border-collapse border border-slate-400 text-xs">
                      <thead>
                        <tr className="bg-slate-200 border-b border-slate-400 text-[10px]">
                          <th className="p-1 text-left">Hastalık</th>
                          <th className="p-1 w-10 text-center">Evet</th>
                          <th className="p-1 w-10 text-center">Hayır</th>
                          <th className="p-1 w-24 text-center">Tarih</th>
                        </tr>
                      </thead>
                      <tbody>
                        {renderAnamnezRow('Kalp Hastalığı', 'an_kalp', 'an_date_kalp', true)}
                        {renderAnamnezRow('Şeker Hastalığı', 'an_seker', 'an_date_seker', true)}
                        {renderAnamnezRow('Böbrek Rahatsızlığı', 'an_bobrek', 'an_date_bobrek', true)}
                        {renderAnamnezRow('Sarılık', 'an_sarilik', 'an_date_sarilik', true)}
                        {renderAnamnezRow('Mide/Oniki Parmak Ülseri', 'an_ulser', 'an_date_ulser', true)}
                        {renderAnamnezRow('İşitme Kaybı', 'an_isitme', 'an_date_isitme', true)}
                        {renderAnamnezRow('Görme Bozukluğu', 'an_gorme', 'an_date_gorme', true)}
                        {renderAnamnezRow('Sinir Sistemi Hastalığı', 'an_sinir', 'an_date_sinir', true)}
                        {renderAnamnezRow('Deri Hastalığı', 'an_deri', 'an_date_deri', true)}
                        {renderAnamnezRow('Besin Zehirlenmesi', 'an_besin', 'an_date_besin', true)}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 7. ÖZEL ANAMNEZ SORULARI 3-10 */}
                <table className="w-full border-collapse border-2 border-slate-900 text-[11px] mb-2">
                  <tbody>
                    <tr className="border-b border-slate-300">
                      <td className="p-1 font-semibold w-72">3. Hastanede yattınız mı?</td>
                      <td className="p-1">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="an_hastane" checked={formData.an_hastane === 'Hayır'} onChange={() => onUpdateField('an_hastane', 'Hayır')} />
                            <span>Hayır</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="an_hastane" checked={formData.an_hastane === 'Evet'} onChange={() => onUpdateField('an_hastane', 'Evet')} />
                            <span>Evet (Tanı:)</span>
                          </label>
                          {formData.an_hastane === 'Evet' && (
                            <input type="text" value={formData.an_hastane_detay || ''} onChange={(e) => onUpdateField('an_hastane_detay', e.target.value)} placeholder="Tanı giriniz..." className="border-b border-slate-400 text-xs px-1 flex-1 outline-none" />
                          )}
                        </div>
                      </td>
                    </tr>

                    <tr className="border-b border-slate-300">
                      <td className="p-1 font-semibold">4. Ameliyat oldunuz mu?</td>
                      <td className="p-1">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="an_ameliyat" checked={formData.an_ameliyat === 'Hayır'} onChange={() => onUpdateField('an_ameliyat', 'Hayır')} />
                            <span>Hayır</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="an_ameliyat" checked={formData.an_ameliyat === 'Evet'} onChange={() => onUpdateField('an_ameliyat', 'Evet')} />
                            <span>Evet (Neden:)</span>
                          </label>
                          {formData.an_ameliyat === 'Evet' && (
                            <input type="text" value={formData.an_ameliyat_detay || ''} onChange={(e) => onUpdateField('an_ameliyat_detay', e.target.value)} placeholder="Ameliyat nedeni..." className="border-b border-slate-400 text-xs px-1 flex-1 outline-none" />
                          )}
                        </div>
                      </td>
                    </tr>

                    <tr className="border-b border-slate-300">
                      <td className="p-1 font-semibold">5. İş kazası geçirdiniz mi?</td>
                      <td className="p-1">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="an_is_kazasi" checked={formData.an_is_kazasi === 'Hayır'} onChange={() => onUpdateField('an_is_kazasi', 'Hayır')} />
                            <span>Hayır</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="an_is_kazasi" checked={formData.an_is_kazasi === 'Evet'} onChange={() => onUpdateField('an_is_kazasi', 'Evet')} />
                            <span>Evet (Açıklama:)</span>
                          </label>
                          {formData.an_is_kazasi === 'Evet' && (
                            <input type="text" value={formData.an_is_kazasi_detay || ''} onChange={(e) => onUpdateField('an_is_kazasi_detay', e.target.value)} placeholder="Kaza detayı..." className="border-b border-slate-400 text-xs px-1 flex-1 outline-none" />
                          )}
                        </div>
                      </td>
                    </tr>

                    <tr className="border-b border-slate-300">
                      <td className="p-1 font-semibold">6. Meslek hastalığı şüphesi ile tetkik/muayene?</td>
                      <td className="p-1">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="an_meslek_hastaligi" checked={formData.an_meslek_hastaligi === 'Hayır'} onChange={() => onUpdateField('an_meslek_hastaligi', 'Hayır')} />
                            <span>Hayır</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="an_meslek_hastaligi" checked={formData.an_meslek_hastaligi === 'Evet'} onChange={() => onUpdateField('an_meslek_hastaligi', 'Evet')} />
                            <span>Evet (Sonuç:)</span>
                          </label>
                          {formData.an_meslek_hastaligi === 'Evet' && (
                            <input type="text" value={formData.an_meslek_detay || ''} onChange={(e) => onUpdateField('an_meslek_detay', e.target.value)} placeholder="Sonuç..." className="border-b border-slate-400 text-xs px-1 flex-1 outline-none" />
                          )}
                        </div>
                      </td>
                    </tr>

                    <tr className="border-b border-slate-300">
                      <td className="p-1 font-semibold">7. Maluliyet aldınız mı?</td>
                      <td className="p-1">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="an_maluliyet" checked={formData.an_maluliyet === 'Hayır'} onChange={() => onUpdateField('an_maluliyet', 'Hayır')} />
                            <span>Hayır</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="an_maluliyet" checked={formData.an_maluliyet === 'Evet'} onChange={() => onUpdateField('an_maluliyet', 'Evet')} />
                            <span>Evet (Neden ve Oran:)</span>
                          </label>
                          {formData.an_maluliyet === 'Evet' && (
                            <input type="text" value={formData.an_maluliyet_detay || ''} onChange={(e) => onUpdateField('an_maluliyet_detay', e.target.value)} placeholder="Oran ve neden..." className="border-b border-slate-400 text-xs px-1 flex-1 outline-none" />
                          )}
                        </div>
                      </td>
                    </tr>

                    <tr className="border-b border-slate-300">
                      <td className="p-1 font-semibold">8. Şu anda herhangi bir tedavi görüyor musunuz?</td>
                      <td className="p-1">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="an_mevcut_tedavi" checked={formData.an_mevcut_tedavi === 'Hayır'} onChange={() => onUpdateField('an_mevcut_tedavi', 'Hayır')} />
                            <span>Hayır</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="an_mevcut_tedavi" checked={formData.an_mevcut_tedavi === 'Evet'} onChange={() => onUpdateField('an_mevcut_tedavi', 'Evet')} />
                            <span>Evet (Nedir:)</span>
                          </label>
                          {formData.an_mevcut_tedavi === 'Evet' && (
                            <input type="text" value={formData.an_tedavi_detay || ''} onChange={(e) => onUpdateField('an_tedavi_detay', e.target.value)} placeholder="Tedavi..." className="border-b border-slate-400 text-xs px-1 flex-1 outline-none" />
                          )}
                        </div>
                      </td>
                    </tr>

                    <tr className="border-b border-slate-300">
                      <td className="p-1 font-semibold">9. Sigara içiyor musunuz?</td>
                      <td className="p-1">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="an_sigara" checked={formData.an_sigara === 'Hayır'} onChange={() => onUpdateField('an_sigara', 'Hayır')} />
                            <span>Hayır</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="an_sigara" checked={formData.an_sigara === 'Bırakmış'} onChange={() => onUpdateField('an_sigara', 'Bırakmış')} />
                            <span>Bırakmış</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="an_sigara" checked={formData.an_sigara === 'Evet'} onChange={() => onUpdateField('an_sigara', 'Evet')} />
                            <span>Evet</span>
                          </label>
                          {formData.an_sigara !== 'Hayır' && (
                            <input type="text" value={formData.an_sigara_detay || ''} onChange={(e) => onUpdateField('an_sigara_detay', e.target.value)} placeholder="Örn: 5 yıldır 1 paket/gün" className="border-b border-slate-400 text-xs px-1 flex-1 outline-none" />
                          )}
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td className="p-1 font-semibold">10. Alkol alıyor musunuz?</td>
                      <td className="p-1">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="an_alkol" checked={formData.an_alkol === 'Hayır'} onChange={() => onUpdateField('an_alkol', 'Hayır')} />
                            <span>Hayır</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="an_alkol" checked={formData.an_alkol === 'Bırakmış'} onChange={() => onUpdateField('an_alkol', 'Bırakmış')} />
                            <span>Bırakmış</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="an_alkol" checked={formData.an_alkol === 'Evet'} onChange={() => onUpdateField('an_alkol', 'Evet')} />
                            <span>Evet</span>
                          </label>
                          {formData.an_alkol !== 'Hayır' && (
                            <input type="text" value={formData.an_alkol_detay || ''} onChange={(e) => onUpdateField('an_alkol_detay', e.target.value)} placeholder="Sıklık..." className="border-b border-slate-400 text-xs px-1 flex-1 outline-none" />
                          )}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* SAYFA 1 RESMİ ALT BİLGİ (Çankaya OSGB Footer) */}
              <div className="border-t-2 border-slate-800 pt-1.5 mt-2 text-[10px] text-slate-700 text-center font-serif leading-tight">
                <p className="font-bold">
                  Üçevler Mahallesi Özkan Sokak No:1 Daire No:5 NİLÜFER / BURSA &bull; Telefon: 0532 402 94 61 - 0537 357 57 80
                </p>
                <p className="text-teal-800 font-sans font-semibold">
                  https://www.cankayaosgb.com/ &bull; info@cankayaosgb.com
                </p>
                <div className="text-right text-[9px] text-slate-500 font-mono mt-0.5">
                  Sayfa 1 / 2
                </div>
              </div>
            </div>
          )}

          {/* ================= PAGE 2 ================= */}
          {currentPage === 2 && (
            <div className="flex-1 flex flex-col justify-between">
              <div>
                {/* Page 2 Small Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1 mb-2">
                  <div className="text-xs font-bold text-slate-800">
                    ÇALIŞAN: <span className="text-teal-800">{formData.adSoyad || '-'}</span> (TCKN: {formData.tckn || '-'})
                  </div>
                  <div className="text-xs font-bold text-slate-600">
                    EK-2 İŞE GİRİŞ / PERİYODİK MUAYENE FORMU (Sayfa 2)
                  </div>
                </div>

                {/* 1. ÖZGEÇMİŞİ & SOYGEÇMİŞİ */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {/* Özgeçmişi */}
                  <div>
                    <div className="bg-slate-800 text-white px-2 py-0.5 text-xs font-bold uppercase mb-0.5">
                      Özgeçmişi:
                    </div>
                    <table className="w-full border-collapse border-2 border-slate-900 text-xs">
                      <tbody>
                        <tr className="border-b border-slate-900">
                          <td className="w-28 bg-slate-100 p-1 font-bold border-r border-slate-900">Kan Grubu:</td>
                          <td className="p-0 font-bold">{renderCellInput('kanGrubu', 'A Rh(+)')}</td>
                        </tr>
                        <tr className="border-b border-slate-900">
                          <td className="bg-slate-100 p-1 font-bold border-r border-slate-900 text-[11px]">Kronik Hastalık:</td>
                          <td className="p-0">{renderCellInput('kronikHastalik', 'Yok')}</td>
                        </tr>
                        <tr className="border-b border-slate-900">
                          <td className="bg-slate-100 p-1 font-bold border-r border-slate-900 text-[11px]">Aşı - Tetanoz:</td>
                          <td className="p-0">{renderCellInput('asiTetanoz', 'Var / Tam')}</td>
                        </tr>
                        <tr>
                          <td className="bg-slate-100 p-1 font-bold border-r border-slate-900 text-[11px]">Aşı - Hepatit:</td>
                          <td className="p-0">{renderCellInput('asiHepatit', 'Bağışık')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Soygeçmişi */}
                  <div>
                    <div className="bg-slate-800 text-white px-2 py-0.5 text-xs font-bold uppercase mb-0.5">
                      Soy Geçmişi:
                    </div>
                    <table className="w-full border-collapse border-2 border-slate-900 text-xs">
                      <tbody>
                        <tr className="border-b border-slate-900">
                          <td className="w-24 bg-slate-100 p-1 font-bold border-r border-slate-900">Anne:</td>
                          <td className="p-0">{renderCellInput('soy_anne', 'Sağ / Doğal')}</td>
                        </tr>
                        <tr className="border-b border-slate-900">
                          <td className="bg-slate-100 p-1 font-bold border-r border-slate-900">Baba:</td>
                          <td className="p-0">{renderCellInput('soy_baba', 'Sağ / Doğal')}</td>
                        </tr>
                        <tr className="border-b border-slate-900">
                          <td className="bg-slate-100 p-1 font-bold border-r border-slate-900">Kardeş:</td>
                          <td className="p-0">{renderCellInput('soy_kardes', 'Sağ / Doğal')}</td>
                        </tr>
                        <tr>
                          <td className="bg-slate-100 p-1 font-bold border-r border-slate-900">Çocuk:</td>
                          <td className="p-0">{renderCellInput('soy_cocuk', 'Sağ / Doğal')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. FİZİK MUAYENE SONUÇLARI */}
                <div className="bg-slate-800 text-white px-2 py-0.5 text-xs font-bold uppercase tracking-wider mb-0.5">
                  FİZİK MUAYENE SONUÇLARI:
                </div>
                <table className="w-full border-collapse border-2 border-slate-900 text-xs mb-2">
                  <tbody>
                    <tr className="border-b border-slate-900">
                      <td className="w-56 bg-slate-100 p-1 font-bold border-r border-slate-900">a) Duyu organları (Göz, KBB, Deri):</td>
                      <td className="p-0">{renderCellInput('fm_duyu_organlari', 'Göz, KBB ve Deri muayenesi doğal.')}</td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="bg-slate-100 p-1 font-bold border-r border-slate-900">b) Kardiyovasküler sistem muayenesi:</td>
                      <td className="p-0">{renderCellInput('fm_kvs', 'S1, S2 ritmik, ek ses/üfürüm yok.')}</td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="bg-slate-100 p-1 font-bold border-r border-slate-900">c) Solunum sistemi muayenesi:</td>
                      <td className="p-0">{renderCellInput('fm_solunum', 'Bilateral veziküler, ral-ronküs yok.')}</td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="bg-slate-100 p-1 font-bold border-r border-slate-900">ç) Sindirim sistemi muayenesi:</td>
                      <td className="p-0">{renderCellInput('fm_sindirim', 'Batın rahat, defans/rebound yok.')}</td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="bg-slate-100 p-1 font-bold border-r border-slate-900">d) Ürogenital sistem muayenesi:</td>
                      <td className="p-0">{renderCellInput('fm_urogenital', 'Doğal.')}</td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="bg-slate-100 p-1 font-bold border-r border-slate-900">e) Kas-iskelet sistemi muayenesi:</td>
                      <td className="p-0">{renderCellInput('fm_kas_iskelet', 'Eklem hareket açıklıkları tam, deformite yok.')}</td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="bg-slate-100 p-1 font-bold border-r border-slate-900">f) Nörolojik muayene:</td>
                      <td className="p-0">{renderCellInput('fm_norolojik', 'Bilinç açık, oryante, koopere.')}</td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="bg-slate-100 p-1 font-bold border-r border-slate-900">g) Psikiyatrik muayene:</td>
                      <td className="p-0">{renderCellInput('fm_psikiyatrik', 'Duygulanım ve düşünce içeriği doğal.')}</td>
                    </tr>
                    
                    {/* Vital Bulgular Grid Row */}
                    <tr>
                      <td className="bg-slate-200 p-1.5 font-bold border-r border-slate-900 text-slate-900" colSpan={2}>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-700">TA:</span>
                            <div className="w-24">{renderCellInput('vital_ta', '120/80')}</div>
                            <span className="text-[11px] text-slate-500 font-mono">mmHg</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-700">Nb:</span>
                            <div className="w-16">{renderCellInput('vital_nb', '76')}</div>
                            <span className="text-[11px] text-slate-500 font-mono">/dk</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-700">Boy:</span>
                            <div className="w-16">{renderCellInput('vital_boy', '175', 'number')}</div>
                            <span className="text-[11px] text-slate-500 font-mono">cm</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-700">Kilo:</span>
                            <div className="w-16">{renderCellInput('vital_kilo', '75', 'number')}</div>
                            <span className="text-[11px] text-slate-500 font-mono">kg</span>
                          </div>

                          <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded border border-slate-300">
                            <span className="font-bold text-slate-700">VKİ:</span>
                            <span className="font-bold text-teal-800 text-xs">{formData.vital_vki || '24.5 kg/m² (Normal)'}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* 3. LABORATUVAR BULGULARI */}
                <div className="bg-slate-800 text-white px-2 py-0.5 text-xs font-bold uppercase tracking-wider mb-0.5">
                  LABORATUVAR BULGULARI:
                </div>
                <table className="w-full border-collapse border-2 border-slate-900 text-xs mb-2">
                  <tbody>
                    <tr className="border-b border-slate-900">
                      <td className="w-48 bg-slate-100 p-1 font-bold border-r border-slate-900">a) Biyolojik analizler:</td>
                      <td className="p-0 border-r border-slate-900 w-64">{renderCellInput('lab_kan', 'Kan: Rutin parametreler doğal')}</td>
                      <td className="p-0">{renderCellInput('lab_idrar', 'İdrar: Tam idrar tetkiki normal')}</td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="bg-slate-100 p-1 font-bold border-r border-slate-900">b) Radyolojik analizler:</td>
                      <td className="p-0" colSpan={2}>{renderCellInput('lab_radyoloji', 'Akciğer Grafisi: Aktif lezyon izlenmedi.')}</td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="bg-slate-100 p-1 font-bold border-r border-slate-900">c) Fizyolojik analizler:</td>
                      <td className="p-0 border-r border-slate-900">{renderCellInput('lab_odyo', 'Odyometri: İki taraflı işitme doğal')}</td>
                      <td className="p-0">{renderCellInput('lab_sft', 'SFT: Solunum fonksiyonları normal')}</td>
                    </tr>
                    <tr>
                      <td className="bg-slate-100 p-1 font-bold border-r border-slate-900">ç) Psikolojik testler / Diğer:</td>
                      <td className="p-0" colSpan={2}>{renderCellInput('lab_bulgulari', 'Genel değerlendirme normal sınırlardadır.')}</td>
                    </tr>
                  </tbody>
                </table>

                {/* 4. KANAAT VE SONUÇ (HEKİM KARAR ALANI) */}
                <div className="bg-slate-800 text-white px-2 py-0.5 text-xs font-bold uppercase tracking-wider mb-0.5">
                  KANAAT VE SONUÇ:
                </div>
                <table className="w-full border-collapse border-2 border-slate-900 text-xs mb-2">
                  <tbody>
                    <tr className="border-b border-slate-900">
                      <td className="w-8 text-center font-bold bg-slate-100 border-r border-slate-900">1-</td>
                      <td className="p-1">
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={formData.dec_elverisli || 'İşinde bedenen ve ruhen çalışmaya elverişlidir.'}
                            onChange={(e) => onUpdateField('dec_elverisli', e.target.value)}
                            className="flex-1 px-1.5 py-0.5 font-bold text-slate-900 bg-amber-50/20 text-xs outline-none"
                          />
                        </div>
                      </td>
                    </tr>

                    <tr className="border-b border-slate-900">
                      <td className="w-8 text-center font-bold bg-slate-100 border-r border-slate-900">2-</td>
                      <td className="p-1">
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={formData.dec_kosullar || 'Yüksekte / Gece / Vardiyalı çalışmaya elverişlidir.'}
                            onChange={(e) => onUpdateField('dec_kosullar', e.target.value)}
                            className="flex-1 px-1.5 py-0.5 font-bold text-slate-900 bg-amber-50/20 text-xs outline-none"
                          />
                        </div>
                      </td>
                    </tr>

                    <tr className="border-b border-slate-900">
                      <td className="w-8 text-center font-bold bg-slate-100 border-r border-slate-900">3-</td>
                      <td className="p-1">
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={formData.dec_sart || 'Şartı: Yoktur.'}
                            onChange={(e) => onUpdateField('dec_sart', e.target.value)}
                            className="flex-1 px-1.5 py-0.5 font-bold text-slate-900 bg-amber-50/20 text-xs outline-none"
                          />
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={2} className="p-1.5 text-[9px] text-slate-600 italic bg-slate-50 leading-tight">
                        (*Yapılan muayene sonucunda çalışanın gece veya vardiyalı çalışma koşullarında çalışıp çalışamayacağı ile vücut sağlığını ve bütünlüğünü tamamlayıcı uygun alet teçhizat vs... bulunması durumunda çalışan için bu koşullarla çalışmaya elverişli olup olmadığı kanaati belirtilecektir.)
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* 5. TARİH VE İŞYERİ HEKİMİ ONAY MÜHRÜ */}
                <div className="border-2 border-slate-900 p-3 mt-3 flex items-center justify-between bg-slate-50">
                  <div className="text-xs">
                    <span className="font-bold text-slate-700">Muayene Tarihi: </span>
                    <span className="font-mono font-bold text-slate-900">
                      {new Date().toLocaleDateString('tr-TR')}
                    </span>
                  </div>

                  <div className="w-64 border-2 border-dashed border-slate-400 p-2 rounded bg-white text-center">
                    <p className="text-[11px] font-bold text-slate-900">İŞYERİ HEKİMİ</p>
                    <input 
                      type="text"
                      value={formData.hekimAdi || 'Dr. İşyeri Hekimi'}
                      onChange={(e) => onUpdateField('hekimAdi', e.target.value)}
                      className="text-xs font-bold text-teal-800 text-center w-full bg-transparent outline-none mt-1"
                    />
                    <div className="text-[10px] text-slate-400 mt-2 font-serif border-t border-slate-300 pt-1">
                      Kaşe & İmza
                    </div>
                  </div>
                </div>
              </div>

              {/* SAYFA 2 RESMİ ALT BİLGİ */}
              <div className="border-t-2 border-slate-800 pt-1.5 mt-2 text-[10px] text-slate-700 text-center font-serif leading-tight">
                <p className="font-bold">
                  Üçevler Mahallesi Özkan Sokak No:1 Daire No:5 NİLÜFER / BURSA &bull; Telefon: 0532 402 94 61 - 0537 357 57 80
                </p>
                <div className="text-right text-[9px] text-slate-500 font-mono mt-0.5">
                  Sayfa 2 / 2
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
