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
  SlidersHorizontal
} from 'lucide-react';
import { Ek2FieldMappingItem } from '../types';

interface Ek2ExactExcelDocumentProps {
  formData?: Record<string, any>;
  onUpdateField?: (key: string, value: any) => void;
  employeeSignature?: string;
  onOpenSignaturePad?: () => void;
  activeQuestions?: Ek2FieldMappingItem[];
  readOnly?: boolean;
  selectionMode?: boolean;
  onToggleQuestion?: (fieldKey: string) => void;
  initialPage?: 1 | 2 | 'all';
}

export const Ek2ExactExcelDocument: React.FC<Ek2ExactExcelDocumentProps> = ({
  formData = {},
  onUpdateField = () => {},
  employeeSignature,
  onOpenSignaturePad,
  activeQuestions = [],
  readOnly = false,
  selectionMode = false,
  onToggleQuestion,
  initialPage = 'all'
}) => {
  const [currentPage, setCurrentPage] = useState<1 | 2 | 'all'>(initialPage);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Alias mapping between granular codes and broad categories
  const KEY_ALIASES: Record<string, string[]> = {
    'phy_goz': ['fm_duyu_organlari', 'phy_goz'],
    'phy_kbb': ['fm_duyu_organlari', 'phy_kbb'],
    'phy_deri': ['fm_duyu_organlari', 'phy_deri'],
    'phy_kvs': ['fm_kvs', 'phy_kvs'],
    'phy_solunum': ['fm_solunum', 'phy_solunum'],
    'phy_sindirim': ['fm_sindirim', 'phy_sindirim'],
    'phy_urogenital': ['fm_urogenital', 'phy_urogenital'],
    'phy_kas_iskelet': ['fm_kas_iskelet', 'phy_kas_iskelet'],
    'phy_norolojik': ['fm_norolojik', 'phy_norolojik'],
    'phy_psikiyatri': ['fm_psikiyatrik', 'phy_psikiyatri'],
    'phy_diger': ['fm_duyu_organlari', 'phy_diger'],
    'lab_kan': ['lab_bulgulari', 'lab_kan'],
    'lab_idrar': ['lab_bulgulari', 'lab_idrar'],
    'lab_radyoloji': ['lab_bulgulari', 'lab_radyoloji'],
    'lab_odyo': ['lab_bulgulari', 'lab_odyo'],
    'lab_sft': ['lab_bulgulari', 'lab_sft'],
    'lab_psikolojik': ['lab_bulgulari', 'lab_psikolojik'],
  };

  // Check if question is active
  const isEnabled = (fieldKey: string) => {
    if (!activeQuestions || activeQuestions.length === 0) return true;
    const clean = fieldKey.replace(/^f_/, '');
    const aliases = KEY_ALIASES[clean] || [clean];

    for (const key of aliases) {
      const item = activeQuestions.find(q => 
        q.fieldKey === key || 
        q.fieldKey === fieldKey || 
        q.id === key || 
        q.id === `f_${key}` ||
        q.fieldKey === clean ||
        q.id === `f_${clean}`
      );
      if (item && item.enabled === false) return false;
      if (item && item.enabled === true) return true;
    }
    return true;
  };

  // Helper for cell input with in-place toggle and hover close
  const cellInput = (
    fieldKey: string,
    placeholder: string = '',
    type: 'text' | 'number' = 'text',
    className: string = ''
  ) => {
    const enabled = isEnabled(fieldKey);
    const val = formData[fieldKey] || '';

    // Selection mode: click toggles
    if (selectionMode) {
      return (
        <span 
          onClick={(e) => {
            e.stopPropagation();
            onToggleQuestion && onToggleQuestion(fieldKey);
          }}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer select-none text-[10px] font-bold shadow-sm transition ${
            enabled 
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
              : 'bg-rose-100 hover:bg-rose-200 text-rose-800 line-through border border-rose-300'
          }`}
          title={enabled ? "Sahada kapatmak için tıklayın" : "Sahada açmak için tıklayın"}
        >
          {enabled ? '✓ Açık' : '✕ Kapalı'}
        </span>
      );
    }

    if (!enabled) {
      return (
        <div className="flex items-center gap-1.5 py-0.5">
          <span className="text-slate-400 italic text-[10px] select-none line-through">(Muaf)</span>
          {!readOnly && onToggleQuestion && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleQuestion(fieldKey);
              }}
              className="text-[9px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-1.5 py-0.2 rounded border border-teal-200 transition cursor-pointer"
              title="Bu soruyu aç"
            >
              + Aç
            </button>
          )}
        </div>
      );
    }

    if (readOnly) {
      return <span className="font-semibold text-slate-900">{val || '-'}</span>;
    }

    return (
      <div className="relative group w-full flex items-center">
        <input
          type={type}
          value={val}
          onChange={e => onUpdateField(fieldKey, e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-amber-50/20 focus:bg-white text-slate-900 font-semibold px-1 py-0.5 outline-none border-b border-transparent focus:border-teal-600 transition text-[11px] placeholder:text-slate-400 placeholder:font-normal ${className}`}
        />
        {!readOnly && onToggleQuestion && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleQuestion(fieldKey);
            }}
            className="opacity-0 group-hover:opacity-100 transition absolute right-0 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 hover:text-rose-600 px-1 py-0.2 rounded hover:bg-rose-50 cursor-pointer"
            title="Bu soruyu kapat (Muaf yap)"
          >
            ✕ Kapat
          </button>
        )}
      </div>
    );
  };

  // Helper for Evet / Hayır / Tarih row inside Anamnez tables
  const renderAnamnezItem = (
    label: string,
    fieldKey: string,
    dateKey?: string
  ) => {
    const enabled = isEnabled(fieldKey);
    const currentVal = formData[fieldKey] || 'Hayır';
    const dateVal = dateKey ? (formData[dateKey] || '') : '';

    if (selectionMode) {
      return (
        <tr 
          onClick={() => onToggleQuestion && onToggleQuestion(fieldKey)}
          className={`border border-black cursor-pointer transition select-none ${
            enabled ? 'bg-emerald-50/70 hover:bg-emerald-100' : 'bg-slate-100 opacity-60 hover:opacity-80'
          }`}
        >
          <td className="border border-black px-1.5 py-0.5 text-[11px] font-medium text-slate-900">
            <span className={enabled ? 'text-black' : 'line-through text-slate-400'}>{label}</span>
          </td>
          <td colSpan={3} className="border border-black text-center p-0.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm ${
              enabled ? 'bg-emerald-600 text-white' : 'bg-rose-100 text-rose-800 line-through border border-rose-300'
            }`}>
              {enabled ? '✓ Açık' : '✕ Kapalı (Muaf)'}
            </span>
          </td>
        </tr>
      );
    }

    if (!enabled) {
      return (
        <tr className="border border-black bg-slate-50/80">
          <td className="border border-black px-1.5 py-0.5 text-[10px] text-slate-400 line-through">{label}</td>
          <td colSpan={3} className="border border-black text-center text-[9px] text-slate-400 italic p-0.5">
            <div className="flex items-center justify-center gap-1.5">
              <span>(Muaf / Kapalı)</span>
              {!readOnly && onToggleQuestion && (
                <button
                  type="button"
                  onClick={() => onToggleQuestion(fieldKey)}
                  className="text-[9px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-1.5 py-0.2 rounded border border-teal-200 transition cursor-pointer"
                  title="Bu soruyu aç"
                >
                  + Aç
                </button>
              )}
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr className="border border-black hover:bg-teal-50/30 transition group">
        <td className="border border-black px-1.5 py-0.5 text-[11px] text-slate-900 font-medium">
          <div className="flex items-center justify-between">
            <span>{label}</span>
            {!readOnly && onToggleQuestion && (
              <button
                type="button"
                onClick={() => onToggleQuestion(fieldKey)}
                className="opacity-0 group-hover:opacity-100 transition text-[9px] text-slate-400 hover:text-rose-600 px-1 cursor-pointer rounded hover:bg-rose-50"
                title="Bu soruyu kapat (Muaf yap)"
              >
                ✕ Kapat
              </button>
            )}
          </div>
        </td>
        <td 
          onClick={() => !readOnly && onUpdateField(fieldKey, 'Evet')}
          className={`border border-black w-10 text-center text-[10px] font-bold cursor-pointer transition select-none ${
            currentVal === 'Evet' ? 'bg-rose-600 text-white' : 'hover:bg-rose-100 text-slate-600'
          }`}
        >
          {currentVal === 'Evet' ? 'X' : ''}
        </td>
        <td 
          onClick={() => !readOnly && onUpdateField(fieldKey, 'Hayır')}
          className={`border border-black w-10 text-center text-[10px] font-bold cursor-pointer transition select-none ${
            currentVal === 'Hayır' ? 'bg-emerald-700 text-white' : 'hover:bg-emerald-100 text-slate-600'
          }`}
        >
          {currentVal === 'Hayır' ? 'X' : ''}
        </td>
        <td className="border border-black w-24 p-0">
          {dateKey ? (
            <input
              type="text"
              value={dateVal}
              disabled={readOnly || currentVal !== 'Evet'}
              onChange={e => onUpdateField(dateKey, e.target.value)}
              placeholder={currentVal === 'Evet' ? 'Tarih' : '-'}
              className="w-full text-center text-[10px] bg-transparent outline-none disabled:opacity-30 placeholder:text-slate-300"
            />
          ) : (
            <span className="text-center block text-[10px] text-slate-400">-</span>
          )}
        </td>
      </tr>
    );
  };

  // Helper for questions 3-10
  const renderSpecialQuestionRow = (
    num: string,
    title: string,
    fieldKey: string,
    detailKey: string,
    detailPlaceholder: string,
    optionsType: 'hayir_evet' | 'sigara_alkol' = 'hayir_evet'
  ) => {
    const enabled = isEnabled(fieldKey);
    const currentVal = formData[fieldKey] || 'Hayır';
    const detailVal = formData[detailKey] || '';

    if (selectionMode) {
      return (
        <tr 
          onClick={() => onToggleQuestion && onToggleQuestion(fieldKey)}
          className={`border border-black cursor-pointer transition select-none ${
            enabled ? 'bg-emerald-50/70 hover:bg-emerald-100' : 'bg-slate-100 opacity-60 hover:opacity-80'
          }`}
        >
          <td className={`${tdCls} w-80 font-medium`}>
            <span className={enabled ? 'text-black font-semibold' : 'line-through text-slate-400'}>
              {num}. {title}
            </span>
          </td>
          <td className={tdCls}>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold shadow-sm ${
              enabled ? 'bg-emerald-600 text-white' : 'bg-rose-100 text-rose-800 line-through border border-rose-300'
            }`}>
              {enabled ? '✓ Açık' : '✕ Kapalı (Muaf)'}
            </span>
          </td>
        </tr>
      );
    }

    if (!enabled) {
      return (
        <tr className="border border-black bg-slate-50/80">
          <td className={`${tdCls} w-80 font-medium text-slate-400 line-through`}>
            {num}. {title}
          </td>
          <td className={tdCls}>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 italic">(Bu soru sahada kapatıldı / Muaf)</span>
              {!readOnly && onToggleQuestion && (
                <button
                  type="button"
                  onClick={() => onToggleQuestion(fieldKey)}
                  className="text-[10px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded border border-teal-200 transition cursor-pointer"
                  title="Bu soruyu aç"
                >
                  + Soruyu Aç
                </button>
              )}
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr className="border border-black hover:bg-teal-50/20 transition group">
        <td className={`${tdCls} w-80 font-medium`}>
          <div className="flex items-center justify-between">
            <span>{num}. {title}</span>
            {!readOnly && onToggleQuestion && (
              <button
                type="button"
                onClick={() => onToggleQuestion(fieldKey)}
                className="opacity-0 group-hover:opacity-100 transition text-[9px] text-slate-400 hover:text-rose-600 px-1 rounded hover:bg-rose-50 cursor-pointer"
                title="Bu soruyu kapat (Muaf yap)"
              >
                ✕ Kapat
              </button>
            )}
          </div>
        </td>
        <td className={tdCls}>
          {optionsType === 'hayir_evet' ? (
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1 cursor-pointer">
                <input 
                  type="radio" 
                  name={fieldKey} 
                  disabled={readOnly}
                  checked={currentVal !== 'Evet'} 
                  onChange={() => onUpdateField(fieldKey, 'Hayır')} 
                />
                <span className="font-bold">Hayır</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input 
                  type="radio" 
                  name={fieldKey} 
                  disabled={readOnly}
                  checked={currentVal === 'Evet'} 
                  onChange={() => onUpdateField(fieldKey, 'Evet')} 
                />
                <span>Evet (ise açıklama?):</span>
              </label>
              {currentVal === 'Evet' && (
                <input 
                  type="text" 
                  value={detailVal} 
                  disabled={readOnly}
                  onChange={e => onUpdateField(detailKey, e.target.value)} 
                  placeholder={detailPlaceholder} 
                  className="border-b border-black text-[11px] px-1 flex-1 outline-none bg-amber-50/30 focus:bg-white" 
                />
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1 cursor-pointer">
                <input 
                  type="radio" 
                  name={fieldKey} 
                  disabled={readOnly}
                  checked={currentVal === 'Hayır' || !currentVal} 
                  onChange={() => onUpdateField(fieldKey, 'Hayır')} 
                />
                <span className="font-bold">Hayır</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input 
                  type="radio" 
                  name={fieldKey} 
                  disabled={readOnly}
                  checked={currentVal === 'Bırakmış'} 
                  onChange={() => onUpdateField(fieldKey, 'Bırakmış')} 
                />
                <span>Bırakmış:</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input 
                  type="radio" 
                  name={fieldKey} 
                  disabled={readOnly}
                  checked={currentVal === 'Evet'} 
                  onChange={() => onUpdateField(fieldKey, 'Evet')} 
                />
                <span>Evet:</span>
              </label>
              {currentVal !== 'Hayır' && currentVal && (
                <input 
                  type="text" 
                  value={detailVal} 
                  disabled={readOnly}
                  onChange={e => onUpdateField(detailKey, e.target.value)} 
                  placeholder={detailPlaceholder} 
                  className="border-b border-black text-[11px] px-1 flex-1 outline-none bg-amber-50/30 focus:bg-white" 
                />
              )}
            </div>
          )}
        </td>
      </tr>
    );
  };

  // Helper for Physical Exam systems (Page 2)
  const renderSystemExamRow = (
    letterCode: string,
    title: string,
    fieldKey: string,
    placeholder: string
  ) => {
    const enabled = isEnabled(fieldKey);

    if (selectionMode) {
      return (
        <tr 
          onClick={() => onToggleQuestion && onToggleQuestion(fieldKey)}
          className={`border border-black cursor-pointer transition select-none ${
            enabled ? 'bg-emerald-50/70 hover:bg-emerald-100' : 'bg-slate-100 opacity-60 hover:opacity-80'
          }`}
        >
          <td className={thCls} colSpan={2}>
            <span className={enabled ? 'text-black' : 'line-through text-slate-400'}>
              {letterCode}) {title}
            </span>
          </td>
          <td className={tdCls}>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold shadow-sm ${
              enabled ? 'bg-emerald-600 text-white' : 'bg-rose-100 text-rose-800 line-through border border-rose-300'
            }`}>
              {enabled ? '✓ Açık' : '✕ Kapalı (Muaf)'}
            </span>
          </td>
        </tr>
      );
    }

    if (!enabled) {
      return (
        <tr className="border border-black bg-slate-50/80">
          <td className={thCls} colSpan={2}>
            <span className="line-through text-slate-400">{letterCode}) {title}</span>
          </td>
          <td className={tdCls}>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 italic">(Muaf / Bakılmadı)</span>
              {!readOnly && onToggleQuestion && (
                <button
                  type="button"
                  onClick={() => onToggleQuestion(fieldKey)}
                  className="text-[10px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded border border-teal-200 transition cursor-pointer"
                  title="Bu muayeneyi aç"
                >
                  + Aç
                </button>
              )}
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr className="border border-black hover:bg-teal-50/20 transition group">
        <td className={thCls} colSpan={2}>
          <div className="flex items-center justify-between">
            <span>{letterCode}) {title}</span>
            {!readOnly && onToggleQuestion && (
              <button
                type="button"
                onClick={() => onToggleQuestion(fieldKey)}
                className="opacity-0 group-hover:opacity-100 transition text-[9px] text-slate-400 hover:text-rose-600 px-1 rounded hover:bg-rose-50 cursor-pointer"
                title="Bu muayeneyi kapat"
              >
                ✕ Kapat
              </button>
            )}
          </div>
        </td>
        <td className={tdCls}>{cellInput(fieldKey, placeholder)}</td>
      </tr>
    );
  };

  // Helper for Lab exam rows (Page 2)
  const renderLabExamRow = (
    code: string,
    title: string,
    fieldKey: string,
    placeholder: string
  ) => {
    const enabled = isEnabled(fieldKey);

    if (selectionMode) {
      return (
        <tr 
          onClick={() => onToggleQuestion && onToggleQuestion(fieldKey)}
          className={`border border-black cursor-pointer transition select-none ${
            enabled ? 'bg-emerald-50/70 hover:bg-emerald-100' : 'bg-slate-100 opacity-60 hover:opacity-80'
          }`}
        >
          <td className={thCls} colSpan={2}>
            <span className={enabled ? 'text-black' : 'line-through text-slate-400'}>
              {code ? `${code}) ` : ''}{title}
            </span>
          </td>
          <td className={tdCls}>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold shadow-sm ${
              enabled ? 'bg-emerald-600 text-white' : 'bg-rose-100 text-rose-800 line-through border border-rose-300'
            }`}>
              {enabled ? '✓ Açık' : '✕ Kapalı (Muaf)'}
            </span>
          </td>
        </tr>
      );
    }

    if (!enabled) {
      return (
        <tr className="border border-black bg-slate-50/80">
          <td className={thCls} colSpan={2}>
            <span className="line-through text-slate-400">{code ? `${code}) ` : ''}{title}</span>
          </td>
          <td className={tdCls}>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 italic">(Muaf / İstenmedi)</span>
              {!readOnly && onToggleQuestion && (
                <button
                  type="button"
                  onClick={() => onToggleQuestion(fieldKey)}
                  className="text-[10px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded border border-teal-200 transition cursor-pointer"
                  title="Bu tetkiki aç"
                >
                  + Aç
                </button>
              )}
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr className="border border-black hover:bg-teal-50/20 transition group">
        <td className={thCls} colSpan={2}>
          <div className="flex items-center justify-between">
            <span>{code ? `${code}) ` : ''}{title}</span>
            {!readOnly && onToggleQuestion && (
              <button
                type="button"
                onClick={() => onToggleQuestion(fieldKey)}
                className="opacity-0 group-hover:opacity-100 transition text-[9px] text-slate-400 hover:text-rose-600 px-1 rounded hover:bg-rose-50 cursor-pointer"
                title="Bu tetkiki kapat"
              >
                ✕ Kapat
              </button>
            )}
          </div>
        </td>
        <td className={tdCls}>{cellInput(fieldKey, placeholder)}</td>
      </tr>
    );
  };

  const tbCls = "border-collapse w-full border border-black text-black font-sans text-[11px] table-fixed";
  const tdCls = "border border-black px-1.5 py-0.5 text-black align-middle";
  const thCls = "border border-black px-1.5 py-0.5 text-black font-bold bg-[#f2f2f2] align-middle";

  return (
    <div className="flex flex-col items-center w-full">
      {/* Top Controller Toolbar */}
      <div className="w-full max-w-[850px] bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 mb-4 sticky top-20 z-20 print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide">
              Çankaya OSGB &bull; Resmi EK-2 Muayene Formu
            </h3>
            <p className="text-[10px] text-teal-300 font-mono">
              Orijinal Excel Şablonu (Birebir Tasarım)
            </p>
          </div>
        </div>

        {/* Page Switcher */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-bold">
          <button
            type="button"
            onClick={() => setCurrentPage('all')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              currentPage === 'all' 
                ? 'bg-teal-600 text-white shadow-md' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Tüm Belge (Alt Alta)
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              currentPage === 1 
                ? 'bg-teal-600 text-white shadow-md' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Sayfa 1
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(2)}
            className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              currentPage === 2 
                ? 'bg-teal-600 text-white shadow-md' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Sayfa 2
          </button>
        </div>

        {/* Soru Kapatma / Açma Modu Butonu */}
        {onToggleQuestion && (
          <button
            type="button"
            onClick={() => onToggleQuestion('TOGGLE_MODE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-md cursor-pointer ${
              selectionMode 
                ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 ring-2 ring-amber-300 animate-pulse' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            title="Soruları form üzerinden tek tek kapatıp açma modunu etkinleştir"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {selectionMode ? '✕ Kapatma Modunu Bitir' : '🛠️ Soruları Kapat / Aç'}
          </button>
        )}

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.max(70, prev - 10))}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="Uzaklaştır"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono font-bold w-10 text-center text-teal-300">
            %{zoomLevel}
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.min(130, prev + 10))}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="Yakınlaştır"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(100)}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="Sıfırla"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="ml-1 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold transition cursor-pointer"
            title="Yazdır"
          >
            <Printer className="w-3.5 h-3.5 text-teal-400" />
            Yazdır
          </button>
        </div>
      </div>

      {/* Active Selection Mode Notice Banner */}
      {selectionMode && (
        <div className="w-full max-w-[850px] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 px-4 py-2.5 rounded-2xl shadow-xl mb-3 flex items-center justify-between text-xs font-bold border border-amber-300 print:hidden animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛠️</span>
            <div>
              <p className="font-extrabold text-sm">SORULARI SEÇME & KAPATMA MODU AKTİF</p>
              <p className="text-[11px] font-medium text-amber-950">
                Kapatmak istediğiniz sorunun (veya [✓ Açık] butonunun) üzerine tıklayın. Kapalı sorular sahada sorulmaz / (Muaf) sayılır.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onToggleQuestion && onToggleQuestion('TOGGLE_MODE')}
            className="bg-slate-950 text-white hover:bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
          >
            Doldurmaya Dön &rarr;
          </button>
        </div>
      )}

      {/* Sheets Container with native scroll and zoom */}
      <div 
        className="w-full flex flex-col items-center justify-center transition-all duration-200 overflow-x-auto pb-16"
        style={{ transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined, transformOrigin: 'top center' }}
      >
        {/* ========================================================================= */}
        {/* ============================== SAYFA 1 ================================= */}
        {/* ========================================================================= */}
        {(currentPage === 1 || currentPage === 'all') && (
          <div className="w-[850px] bg-white text-black border border-black shadow-2xl p-6 font-sans print:border-none print:shadow-none print:p-0 my-3 min-h-[1120px] flex flex-col justify-between box-border">
            <div>
              {/* HEADER SECTION: Logo, Title, Protokol No */}
              <table className={tbCls}>
                <tbody>
                  <tr>
                    <td className="border border-black p-1 text-center w-48 align-middle" rowSpan={2}>
                      <img 
                        src="/excel_extracted_img_1.png" 
                        alt="Çankaya OSGB" 
                        className="max-h-14 mx-auto object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/logo_cankaya.png'; }}
                      />
                    </td>
                    <td className="border border-black p-2 text-center align-middle font-bold text-base tracking-wider uppercase font-serif" rowSpan={2}>
                      İŞE GİRİŞ / PERİYODİK<br />MUAYENE FORMU
                    </td>
                    <td className="border border-black p-1.5 w-44 align-middle bg-[#f2f2f2]">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>Protokol No:</span>
                        <span className="font-mono text-teal-800 font-bold ml-1">
                          {formData.protokolNo || '…………...'}
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1 text-center align-middle bg-slate-50 text-[10px] text-slate-500">
                      (6331 Sayılı İSG Kanunu Ek-2)
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* İŞYERİ ÜNVANI VE FOTOĞRAF ALANI */}
              <table className={`${tbCls} -mt-[1px]`}>
                <tbody>
                  <tr>
                    <td className={`${thCls} w-36`}>İŞYERİ ÜNVANI</td>
                    <td className={`${tdCls} p-1 font-semibold`}>
                      {cellInput('isyeriUnvani', 'İşyeri tam ticari ünvanı')}
                    </td>
                    <td className="border border-black p-1 text-center w-28 align-middle" rowSpan={4}>
                      <div className="border border-dashed border-slate-500 rounded h-28 flex flex-col items-center justify-center p-1 text-slate-500 bg-slate-50">
                        <span className="text-[10px] font-bold uppercase tracking-widest">FOTOĞRAF</span>
                        <span className="text-[8px] text-slate-400 mt-1">3.5 x 4.5</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className={thCls}>SGK SİCİL NO</td>
                    <td className={`${tdCls} p-1`}>
                      {cellInput('sgkSicilNo', 'SGK İşyeri Sicil Numarası')}
                    </td>
                  </tr>
                  <tr>
                    <td className={thCls}>ADRES</td>
                    <td className={`${tdCls} p-1`}>
                      {cellInput('isyeriAdresi', 'İşyeri açık adresi')}
                    </td>
                  </tr>
                  <tr>
                    <td className={thCls}>TEL / FAKS / E-POSTA</td>
                    <td className={`${tdCls} p-1`}>
                      {cellInput('isyeriIletisim', 'İletişim bilgileri')}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* ÇALIŞANIN BEYANI VE İMZA KUTUSU */}
              <table className={`${tbCls} -mt-[1px]`}>
                <tbody>
                  <tr>
                    <td className={`${tdCls} p-2 text-[10px] leading-relaxed italic bg-amber-50/20`}>
                      İşe giriş/periyodik muayene olmayı kabul ettiğimi ve muayene sırasında verdiğim bilgilerin doğru ve eksiksiz olduğunu beyan ederim.
                      <div className="mt-2 font-bold text-slate-900 not-italic flex items-center justify-between">
                        <span>Çalışanın adı soyadı: <strong className="text-teal-900 underline">{formData.adSoyad || '.........................'}</strong></span>
                        <span className="text-[11px] font-bold text-slate-700">İMZA &rarr;</span>
                      </div>
                    </td>
                    <td 
                      onClick={onOpenSignaturePad}
                      className="border border-black w-48 p-1 text-center align-middle cursor-pointer hover:bg-teal-50 transition relative bg-white"
                      title="İmza atmak veya yenilemek için tıklayın"
                    >
                      {employeeSignature ? (
                        <div className="flex flex-col items-center justify-center py-1">
                          <img 
                            src={employeeSignature} 
                            alt="Çalışan İmzası" 
                            className="max-h-12 max-w-full object-contain filter drop-shadow-sm"
                          />
                          <span className="text-[8px] text-emerald-700 font-bold mt-0.5">✓ İmza Alındı (Değiştir)</span>
                        </div>
                      ) : (
                        <div className="py-2 text-slate-500 flex flex-col items-center justify-center gap-1">
                          <PenTool className="w-4 h-4 text-teal-600" />
                          <span className="text-[10px] font-bold text-slate-700">ÇALIŞAN İMZASI</span>
                          <span className="text-[8px] text-slate-400">(Tıklayın ve İmzalayın)</span>
                        </div>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* ÇALIŞANIN BÖLÜM BAŞLIĞI */}
              <div className="border-x border-b border-black bg-[#e0e0e0] font-bold text-xs px-2 py-1 uppercase tracking-wider">
                ÇALIŞANIN:
              </div>

              {/* ÇALIŞAN KİMLİK VE İŞ BİLGİLERİ TABLOSU */}
              <table className={`${tbCls} -mt-[1px]`}>
                <tbody>
                  <tr>
                    <td className={`${thCls} w-28`}>Adı ve Soyadı:</td>
                    <td className={`${tdCls} font-bold`}>{cellInput('adSoyad', 'Çalışanın Adı Soyadı')}</td>
                    <td className={`${thCls} w-28`}>T.C. Kimlik No:</td>
                    <td className={`${tdCls} font-mono font-bold`}>{cellInput('tckn', '11 haneli TCKN')}</td>
                  </tr>
                  <tr>
                    <td className={thCls}>Ev Adresi:</td>
                    <td className={tdCls} colSpan={3}>{cellInput('evAdresi', 'Açık ev adresi')}</td>
                  </tr>
                  <tr>
                    <td className={thCls}>Doğum Yeri ve Tarihi:</td>
                    <td className={tdCls}>{cellInput('dogumYeriTarihi', 'Örn: Ankara - 15.04.1990')}</td>
                    <td className={thCls}>Medeni Durumu:</td>
                    <td className={tdCls}>
                      <select 
                        value={formData.medeniDurumu || 'Bekar'} 
                        onChange={e => onUpdateField('medeniDurumu', e.target.value)}
                        className="w-full bg-transparent outline-none font-semibold text-[11px]"
                      >
                        <option value="Evli">Evli</option>
                        <option value="Bekar">Bekar</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td className={thCls}>Telefon No:</td>
                    <td className={tdCls}>{cellInput('telefonNo', '05XX XXX XX XX')}</td>
                    <td className={thCls}>Çocuk Sayısı:</td>
                    <td className={tdCls}>{cellInput('cocukSayisi', '0', 'number')}</td>
                  </tr>
                  <tr>
                    <td className={thCls}>Eğitim Durumu:</td>
                    <td className={tdCls}>
                      <select 
                        value={formData.egitimDurumu || 'Lise'} 
                        onChange={e => onUpdateField('egitimDurumu', e.target.value)}
                        className="w-full bg-transparent outline-none font-semibold text-[11px]"
                      >
                        <option value="İlkokul">İlkokul</option>
                        <option value="Ortaokul">Ortaokul</option>
                        <option value="Lise">Lise</option>
                        <option value="Ön Lisans">Ön Lisans</option>
                        <option value="Lisans">Lisans</option>
                        <option value="Yüksek Lisans / Doktora">Yüksek Lisans / Doktora</option>
                      </select>
                    </td>
                    <td className={thCls}>Cinsiyeti :</td>
                    <td className={tdCls}>
                      <select 
                        value={formData.cinsiyet || 'Erkek'} 
                        onChange={e => onUpdateField('cinsiyet', e.target.value)}
                        className="w-full bg-transparent outline-none font-semibold text-[11px]"
                      >
                        <option value="Erkek">Erkek</option>
                        <option value="Kadın">Kadın</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td className={thCls}>Mesleği:</td>
                    <td className={tdCls}>{cellInput('meslegi', 'Örn: Kaynakçı / Montajcı')}</td>
                    <td className={thCls}>Çalıştığı Bölüm:</td>
                    <td className={tdCls}>{cellInput('calistigiBolum', 'Örn: Üretim / Kalıphane')}</td>
                  </tr>
                  <tr>
                    <td className={thCls}>Yaptığı İş:</td>
                    <td className={tdCls} colSpan={3}>
                      {cellInput('yaptigiIs', 'Yaptığı iş (Ayrıntılı olarak tanımlanacaktır)')}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* DAHA ÖNCE ÇALIŞTIĞI YERLER TABLOSU */}
              <div className="border-x border-b border-black bg-[#e0e0e0] font-bold text-xs px-2 py-1">
                Daha önce çalıştığı yerler (Bugünden geçmişe doğru):
              </div>
              <table className={`${tbCls} -mt-[1px]`}>
                <thead>
                  <tr className="bg-[#f2f2f2]">
                    <th className="border border-black w-8 p-1 text-center font-bold">No</th>
                    <th className="border border-black p-1 text-left font-bold w-48">İşkolu :</th>
                    <th className="border border-black p-1 text-left font-bold w-48">Yaptığı iş:</th>
                    <th className="border border-black p-1 text-left font-bold w-36">Giriş-çıkış tarihi:</th>
                    <th className="border border-black p-1 text-left font-bold">Not:</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map(rowNum => (
                    <tr key={rowNum}>
                      <td className="border border-black text-center font-bold p-1 bg-slate-50">{rowNum}.</td>
                      <td className="border border-black p-0.5">{cellInput(`past_job_${rowNum}_col`, 'İşkolu...')}</td>
                      <td className="border border-black p-0.5">{cellInput(`past_job_${rowNum}_work`, 'Yaptığı iş...')}</td>
                      <td className="border border-black p-0.5">{cellInput(`past_job_${rowNum}_date`, 'Giriş - Çıkış...')}</td>
                      <td className="border border-black p-0.5">{cellInput(`past_job_${rowNum}_note`, 'Açıklama / Not...')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* TIBBİ ANAMNEZ BÖLÜMÜ */}
              <div className="border-x border-b border-black bg-[#e0e0e0] font-bold text-xs px-2 py-1 uppercase tracking-wider">
                TIBBİ ANAMNEZ :
              </div>

              {/* YAKINMALAR VE HASTALIKLAR TABLOLARI YAN YANA */}
              <div className="grid grid-cols-2 -mt-[1px]">
                {/* 1. YAKINMALAR (SOL SÜTUN) */}
                <table className="border-collapse w-full border border-black text-[11px] table-fixed">
                  <thead>
                    <tr className="bg-[#f2f2f2]">
                      <th className="border border-black p-1 text-left font-bold">1. Yakınmalar (Son 1 Ay)</th>
                      <th className="border border-black w-10 p-1 text-center font-bold">Evet</th>
                      <th className="border border-black w-10 p-1 text-center font-bold">Hayır</th>
                      <th className="border border-black w-24 p-1 text-center font-bold">Tarih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderAnamnezItem('Balgamlı öksürük', 'an_balgamli_oksuruk', 'an_date_balgam')}
                    {renderAnamnezItem('Nefes darlığı', 'an_nefes_darligi', 'an_date_nefes')}
                    {renderAnamnezItem('Göğüs ağrısı', 'an_gogus_agrisi', 'an_date_gogus')}
                    {renderAnamnezItem('Çarpıntı', 'an_carpinti', 'an_date_carpinti')}
                    {renderAnamnezItem('Sırt ağrısı', 'an_sirt_agrisi', 'an_date_sirt')}
                    {renderAnamnezItem('İshal veya kabızlık', 'an_ishal_kabizlik', 'an_date_ishal')}
                    {renderAnamnezItem('Eklemlerde ağrı', 'an_eklem_agrisi', 'an_date_eklem')}
                    <tr className="border border-black">
                      <td className="border border-black p-1 text-[11px] font-semibold">Diğer belirtiniz;</td>
                      <td className="border border-black p-0.5" colSpan={3}>
                        {cellInput('an_diger_belirti', 'Varsa diğer yakınma...')}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* 2. HASTALIKLAR (SAĞ SÜTUN) */}
                <table className="border-collapse w-full border border-black text-[11px] table-fixed -ml-[1px]">
                  <thead>
                    <tr className="bg-[#f2f2f2]">
                      <th className="border border-black p-1 text-left font-bold">2. Teşhis Konulan Hastalıklar</th>
                      <th className="border border-black w-10 p-1 text-center font-bold">Evet</th>
                      <th className="border border-black w-10 p-1 text-center font-bold">Hayır</th>
                      <th className="border border-black w-24 p-1 text-center font-bold">Tarih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderAnamnezItem('Kalp hastalığı', 'an_kalp', 'an_date_kalp')}
                    {renderAnamnezItem('Şeker hastalığı', 'an_seker', 'an_date_seker')}
                    {renderAnamnezItem('Böbrek rahatsızlığı', 'an_bobrek', 'an_date_bobrek')}
                    {renderAnamnezItem('Sarılık', 'an_sarilik', 'an_date_sarilik')}
                    {renderAnamnezItem('Mide veya on iki parmak ülseri', 'an_ulser', 'an_date_ulser')}
                    {renderAnamnezItem('İşitme kaybı', 'an_isitme', 'an_date_isitme')}
                    {renderAnamnezItem('Görme Bozukluğu', 'an_gorme', 'an_date_gorme')}
                    {renderAnamnezItem('Sinir sistemi Hastalığı', 'an_sinir', 'an_date_sinir')}
                    {renderAnamnezItem('Deri hastalığı', 'an_deri', 'an_date_deri')}
                    {renderAnamnezItem('Besin zehirlenmesi', 'an_besin', 'an_date_besin')}
                    <tr className="border border-black">
                      <td className="border border-black p-1 text-[11px] font-semibold">Diğer belirtiniz;</td>
                      <td className="border border-black p-0.5" colSpan={3}>
                        {cellInput('an_diger_hastalik', 'Varsa diğer hastalık...')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ANAMNEZ 3-10 ÖZEL SORULAR TABLOSU */}
              <table className={`${tbCls} -mt-[1px]`}>
                <tbody>
                  {renderSpecialQuestionRow('3', 'Hastanede yattınız mı?', 'an_hastane', 'an_hastane_detay', 'Tanı...')}
                  {renderSpecialQuestionRow('4', 'Ameliyat oldunuz mu?', 'an_ameliyat', 'an_ameliyat_detay', 'Ameliyat nedeni...')}
                  {renderSpecialQuestionRow('5', 'İş kazası geçirdiniz mi?', 'an_is_kazasi', 'an_is_kazasi_detay', 'Kaza açıklaması...')}
                  {renderSpecialQuestionRow('6', 'Meslek hastalıkları şüphesi ile ilgili tetkik veya muayeneye tabi tutuldunuz mu?', 'an_meslek_hastaligi', 'an_meslek_detay', 'Tetkik sonucu...')}
                  {renderSpecialQuestionRow('7', 'Maluliyet aldınız mı?', 'an_maluliyet', 'an_maluliyet_detay', 'Neden ve oran...')}
                  {renderSpecialQuestionRow('8', 'Şu anda herhangi bir tedavi görüyor musunuz?', 'an_mevcut_tedavi', 'an_tedavi_detay', 'Mevcut tedavi nedir...')}
                  {renderSpecialQuestionRow('9', 'Sigara içiyor musunuz?', 'an_sigara', 'an_sigara_detay', 'Örn: 5 yıldır 1 paket/gün', 'sigara_alkol')}
                  {renderSpecialQuestionRow('10', 'Alkol alıyor musunuz?', 'an_alkol', 'an_alkol_detay', 'Örn: Haftada 1-2 / Sosyal', 'sigara_alkol')}
                </tbody>
              </table>
            </div>

            {/* SAYFA 1 RESMİ ALT BİLGİ */}
            <div className="border-t border-black pt-2 mt-3 text-[10px] text-center font-serif leading-tight">
              <p className="font-bold">
                Üçevler Mahallesi Özkan Sokak No:1 Daire No:5 NİLÜFER / BURSA &bull; Telefon: 0532 402 94 61 - 0537 357 57 80
              </p>
              <p className="text-teal-900 font-sans font-semibold">
                https://www.cankayaosgb.com/ &bull; info@cankayaosgb.com
              </p>
              <div className="text-right text-[9px] text-slate-500 font-mono">
                Sayfa 1 / 2
              </div>
            </div>
          </div>
        )}

        {/* Separator between Page 1 and Page 2 when in 'all' view */}
        {currentPage === 'all' && (
          <div className="w-full max-w-[850px] my-5 flex items-center justify-center gap-3 select-none text-xs text-slate-600 font-bold print:hidden">
            <div className="h-[2px] bg-slate-400 flex-1"></div>
            <span className="bg-slate-300 text-slate-800 px-4 py-1.5 rounded-full shadow-sm text-xs font-bold flex items-center gap-2">
              <span>📄</span> SAYFA 2: FİZİK MUAYENE & KANAAT VE SONUÇ <span>⬇️</span>
            </span>
            <div className="h-[2px] bg-slate-400 flex-1"></div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ============================== SAYFA 2 ================================= */}
        {/* ========================================================================= */}
        {(currentPage === 2 || currentPage === 'all') && (
          <div className="w-[850px] bg-white text-black border border-black shadow-2xl p-6 font-sans print:border-none print:shadow-none print:p-0 my-3 min-h-[1120px] flex flex-col justify-between box-border">
            <div>
              {/* Page 2 Small Header */}
              <div className="flex items-center justify-between border-b border-black pb-1 mb-2">
                <div className="text-xs font-bold text-slate-800">
                  ÇALIŞAN: <span className="text-teal-800 font-bold">{formData.adSoyad || '.........................'}</span> (TCKN: {formData.tckn || '...........'})
                </div>
                <div className="text-xs font-bold text-slate-600">
                  EK-2 İŞE GİRİŞ / PERİYODİK MUAYENE FORMU (Sayfa 2)
                </div>
              </div>

              {/* ÖZGEÇMİŞİ VE SOY GEÇMİŞİ */}
              <div className="border-x border-t border-black bg-[#e0e0e0] font-bold text-xs px-2 py-1">
                Özgeçmişi:
              </div>
              <table className={tbCls}>
                <tbody>
                  <tr>
                    <td className={`${thCls} w-44`}>Kan Grubu:</td>
                    <td className={`${tdCls} font-bold`}>{cellInput('kanGrubu', 'A Rh(+)')}</td>
                  </tr>
                  <tr>
                    <td className={thCls}>Konjenital / Kronik Hastalık:</td>
                    <td className={tdCls}>{cellInput('kronikHastalik', 'Yok')}</td>
                  </tr>
                  <tr>
                    <td className={thCls}>Bağışıklama:</td>
                    <td className={tdCls}>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-[10px] font-bold block">- Tetanoz:</span>
                          {cellInput('asiTetanoz', 'Var / Tam')}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold block">- Hepatit:</span>
                          {cellInput('asiHepatit', 'Bağışık')}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold block">- Diğer:</span>
                          {cellInput('asiDiger', 'Yok')}
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="border-x border-black bg-[#e0e0e0] font-bold text-xs px-2 py-1 -mt-[1px]">
                Soy Geçmişi:
              </div>
              <table className={`${tbCls} -mt-[1px]`}>
                <tbody>
                  <tr>
                    <td className={`${thCls} w-20`}>Anne:</td>
                    <td className={tdCls}>{cellInput('soy_anne', 'Sağ / Doğal')}</td>
                    <td className={`${thCls} w-20`}>Baba:</td>
                    <td className={tdCls}>{cellInput('soy_baba', 'Sağ / Doğal')}</td>
                  </tr>
                  <tr>
                    <td className={thCls}>Kardeş:</td>
                    <td className={tdCls}>{cellInput('soy_kardes', 'Sağ / Doğal')}</td>
                    <td className={thCls}>Çocuk:</td>
                    <td className={tdCls}>{cellInput('soy_cocuk', 'Sağ / Doğal')}</td>
                  </tr>
                </tbody>
              </table>

              {/* FİZİK MUAYENE SONUÇLARI */}
              <div className="border-x border-black bg-[#e0e0e0] font-bold text-xs px-2 py-1 -mt-[1px] uppercase tracking-wider">
                FİZİK MUAYENE SONUÇLARI:
              </div>
              <table className={`${tbCls} -mt-[1px]`}>
                <tbody>
                  <tr>
                    <td className={`${thCls} w-60`} rowSpan={3}>a) Duyu organları.</td>
                    <td className={`${tdCls} w-36 font-semibold`}>-Göz</td>
                    <td className={tdCls}>{cellInput('phy_goz', 'Doğal / Normal')}</td>
                  </tr>
                  <tr>
                    <td className={`${tdCls} font-semibold`}>-Kulak-Burun-Boğaz</td>
                    <td className={tdCls}>{cellInput('phy_kbb', 'Doğal / Normal')}</td>
                  </tr>
                  <tr>
                    <td className={`${tdCls} font-semibold`}>-Deri</td>
                    <td className={tdCls}>{cellInput('phy_deri', 'Doğal / Normal')}</td>
                  </tr>

                  {renderSystemExamRow('b', 'Kardiyovasküler sistem muayenesi.', 'phy_kvs', 'S1, S2 ritmik, ek ses yok')}
                  {renderSystemExamRow('c', 'Solunum sistemi muayenesi.', 'phy_solunum', 'Bilateral veziküler')}
                  {renderSystemExamRow('ç', 'Sindirim sistemi muayenesi.', 'phy_sindirim', 'Batın rahat, defans yok')}
                  {renderSystemExamRow('d', 'Ürogenital sistem muayenesi.', 'phy_urogenital', 'Doğal')}
                  {renderSystemExamRow('e', 'Kas-iskelet sistemi muayenesi.', 'phy_kas_iskelet', 'Eklem hareketleri tam')}
                  {renderSystemExamRow('f', 'Nörolojik muayene.', 'phy_norolojik', 'Bilinç açık, oryante')}
                  {renderSystemExamRow('g', 'Psikiyatrik muayene.', 'phy_psikiyatri', 'Duygulanım doğal')}
                  {renderSystemExamRow('ğ', 'Diğer:', 'phy_diger', 'Özellik yok')}

                  {/* VİTAL DEĞERLER (TA, NB, BOY, KİLO, VKİ) */}
                  <tr>
                    <td className={thCls} colSpan={3}>
                      <div className="grid grid-cols-4 gap-2 text-[11px] font-normal py-0.5">
                        <div className="flex items-center gap-1 font-bold">
                          <span>-TA:</span>
                          <span className="w-20">{cellInput('vital_ta', '120/80')}</span>
                          <span className="font-normal text-slate-600">mmHg</span>
                        </div>
                        <div className="flex items-center gap-1 font-bold">
                          <span>-Nb:</span>
                          <span className="w-16">{cellInput('vital_nb', '76')}</span>
                          <span className="font-normal text-slate-600">/dk</span>
                        </div>
                        <div className="flex items-center gap-1 font-bold">
                          <span>-Boy:</span>
                          <span className="w-16">{cellInput('vital_boy', '175')}</span>
                          <span className="font-normal text-slate-600">cm</span>
                        </div>
                        <div className="flex items-center gap-1 font-bold">
                          <span>Kilo:</span>
                          <span className="w-16">{cellInput('vital_kilo', '75')}</span>
                          <span className="font-normal text-slate-600">kg</span>
                        </div>
                      </div>
                      <div className="mt-1 pt-1 border-t border-slate-300 flex items-center gap-2 text-[11px]">
                        <span className="font-bold">Vücut Kitle İndeksi:</span>
                        <span className="font-bold text-teal-800">{formData.vital_vki || '24.5 kg/m²'}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* LABORATUVAR BULGULARI */}
              <div className="border-x border-black bg-[#e0e0e0] font-bold text-xs px-2 py-1 -mt-[1px] uppercase tracking-wider">
                LABORATUVAR BULGULARI:
              </div>
              <table className={`${tbCls} -mt-[1px]`}>
                <tbody>
                  <tr>
                    <td className={`${thCls} w-48`} rowSpan={2}>a) Biyolojik analizler.</td>
                    <td className={`${tdCls} w-28 font-semibold`}>-Kan</td>
                    <td className={tdCls}>{cellInput('lab_kan', 'Rutin parametreler doğal')}</td>
                  </tr>
                  <tr>
                    <td className={`${tdCls} font-semibold`}>-İdrar</td>
                    <td className={tdCls}>{cellInput('lab_idrar', 'Tam idrar tetkiki normal')}</td>
                  </tr>
                  {renderLabExamRow('b', 'Radyolojik analizler.', 'lab_radyoloji', 'Akciğer Grafisi: Aktif lezyon izlenmedi')}
                  {renderLabExamRow('c', 'Fizyolojik analizler - Odyometre', 'lab_odyo', 'Odyometri: İki taraflı işitme doğal')}
                  {renderLabExamRow('c', 'Fizyolojik analizler - SFT', 'lab_sft', 'SFT: Solunum fonksiyonları normal')}
                  {renderLabExamRow('ç', 'Psikolojik testler.', 'lab_psikolojik', 'Normal')}
                  {renderLabExamRow('d', 'Diğer.', 'lab_bulgulari', 'Rutin tetkikler normal sınırlardadır.')}
                </tbody>
              </table>

              {/* KANAAT VE SONUÇ (HEKİM KARARI) */}
              <div className="border-x border-black bg-[#e0e0e0] font-bold text-xs px-2 py-1 -mt-[1px] uppercase tracking-wider">
                KANAAT VE SONUÇ:
              </div>
              <table className={`${tbCls} -mt-[1px]`}>
                <tbody>
                  <tr>
                    <td className={`${tdCls} w-8 font-bold text-center`}>1-</td>
                    <td className={tdCls}>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.dec_elverisli === 'X' || formData.dec_elverisli === 'Evet'}
                            onChange={e => onUpdateField('dec_elverisli', e.target.checked ? 'X' : '')}
                            className="w-4 h-4 text-teal-600 rounded"
                          />
                          <span className="font-bold">Çalışmaya elverişlidir.</span>
                        </label>
                        <span className="text-slate-400">/</span>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.dec_elverisli === 'Hayır'}
                            onChange={e => onUpdateField('dec_elverisli', e.target.checked ? 'Hayır' : '')}
                            className="w-4 h-4 text-rose-600 rounded"
                          />
                          <span>Elverişli değildir.</span>
                        </label>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td className={`${tdCls} font-bold text-center`}>2-</td>
                    <td className={tdCls}>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.dec_kosullar === 'X' || formData.dec_kosullar === 'Evet'}
                            onChange={e => onUpdateField('dec_kosullar', e.target.checked ? 'X' : '')}
                            className="w-4 h-4 text-amber-600 rounded"
                          />
                          <span className="font-bold">Yüksekte / Gece / Vardiyalı çalışmaya elverişlidir.</span>
                        </label>
                        <span className="text-slate-400">/</span>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.dec_kosullar === 'Hayır'}
                            onChange={e => onUpdateField('dec_kosullar', e.target.checked ? 'Hayır' : '')}
                            className="w-4 h-4 text-rose-600 rounded"
                          />
                          <span>Elverişli değildir.</span>
                        </label>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td className={`${tdCls} font-bold text-center`}>3-</td>
                    <td className={tdCls}>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">Şartı:</span>
                        <input
                          type="text"
                          value={formData.dec_sart || ''}
                          onChange={e => onUpdateField('dec_sart', e.target.value)}
                          placeholder="Örn: Gözlük / koruyucu donanım şartıyla çalışabilir (Yoksa: Yoktur)"
                          className="flex-1 bg-amber-50/20 focus:bg-white border-b border-black outline-none px-1 py-0.5 text-[11px]"
                        />
                        <span className="font-bold">şartıyla çalışmaya elverişlidir.</span>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td className={`${tdCls} p-2 text-[9px] text-slate-600 italic bg-slate-50`} colSpan={2}>
                      (*Yapılan muayene sonucunda çalışanın gece veya vardiyalı çalışma koşullarında çalışıp çalışamayacağı ile vücut sağlığını ve bütünlüğünü tamamlayıcı uygun alet teçhizat vs... bulunması durumunda çalışan için bu koşullarla çalışmaya elverişli olup olmadığı kanaati belirtilecektir.)
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* TARİH VE İŞYERİ HEKİMİ İMZA ALANI */}
              <div className="border border-black -mt-[1px] p-3 flex items-center justify-between bg-slate-50">
                <div className="text-xs">
                  <span className="font-bold text-slate-800">Muayene Tarihi: </span>
                  <span className="font-mono font-bold text-slate-900">
                    {new Date().toLocaleDateString('tr-TR')}
                  </span>
                </div>

                <div className="w-64 border border-dashed border-slate-500 p-2 rounded bg-white text-center">
                  <p className="text-[11px] font-bold text-slate-900 uppercase">İŞYERİ HEKİMİ</p>
                  <input
                    type="text"
                    value={formData.hekimAdi || 'Dr. İşyeri Hekimi'}
                    onChange={e => onUpdateField('hekimAdi', e.target.value)}
                    className="text-xs font-bold text-teal-800 text-center w-full bg-transparent outline-none mt-1"
                  />
                  <div className="text-[9px] text-slate-400 mt-2 font-serif border-t border-slate-300 pt-1">
                    Kaşe & İmza
                  </div>
                </div>
              </div>
            </div>

            {/* SAYFA 2 RESMİ ALT BİLGİ */}
            <div className="border-t border-black pt-2 mt-3 text-[10px] text-center font-serif leading-tight">
              <p className="font-bold">
                Üçevler Mahallesi Özkan Sokak No:1 Daire No:5 NİLÜFER / BURSA &bull; Telefon: 0532 402 94 61 - 0537 357 57 80
              </p>
              <div className="text-right text-[9px] text-slate-500 font-mono">
                Sayfa 2 / 2
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
