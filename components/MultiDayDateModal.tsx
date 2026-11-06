import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Check, Sparkles, AlertCircle } from 'lucide-react';
import { parseDateDetailed, TR_MONTH_NAMES } from '../services/validityService';

interface MultiDayDateModalProps {
  isOpen: boolean;
  initialValue?: string;
  onClose: () => void;
  onApply: (formattedDate: string) => void;
}

export const MultiDayDateModal: React.FC<MultiDayDateModalProps> = ({
  isOpen,
  initialValue = '',
  onClose,
  onApply
}) => {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedDays, setSelectedDays] = useState<number[]>([now.getDate()]);
  const [formatType, setFormatType] = useState<'parentheses' | 'dots' | 'dash' | 'text'>('parentheses');

  // Parse initial value on open
  useEffect(() => {
    if (isOpen) {
      if (initialValue && initialValue.trim()) {
        const parsed = parseDateDetailed(initialValue);
        if (parsed) {
          setSelectedYear(parsed.year);
          setSelectedMonth(parsed.month);
          setSelectedDays(parsed.allDays.length > 0 ? parsed.allDays : [parsed.startDay]);
          if (initialValue.startsWith('(') && initialValue.endsWith(')')) {
            setFormatType('parentheses');
          } else if (initialValue.includes('Kasım') || initialValue.includes('Ekim') || initialValue.includes('ve')) {
            setFormatType('text');
          } else if (initialValue.includes('-')) {
            setFormatType('dash');
          } else {
            setFormatType('dots');
          }
          return;
        }
      }
      // Defaults to yesterday & today for 2-day training convenience
      const today = now.getDate();
      const yesterday = today > 1 ? today - 1 : today;
      setSelectedYear(now.getFullYear());
      setSelectedMonth(now.getMonth());
      setSelectedDays(yesterday !== today ? [yesterday, today] : [today]);
    }
  }, [isOpen, initialValue]);

  // Days in selected month
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedYear, selectedMonth]);

  // First day of month (0 = Sun, 1 = Mon, ...)
  const firstDayOfWeek = useMemo(() => {
    const day = new Date(selectedYear, selectedMonth, 1).getDay();
    // In Turkey week starts on Monday (0 -> 6, 1 -> 0)
    return (day + 6) % 7;
  }, [selectedYear, selectedMonth]);

  const toggleDay = (day: number) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter(d => d !== day).sort((a, b) => a - b);
      } else {
        return [...prev, day].sort((a, b) => a - b);
      }
    });
  };

  const selectConsecutiveDays = (count: number) => {
    const today = Math.min(daysInMonth, now.getDate());
    const start = Math.max(1, today - count + 1);
    const days: number[] = [];
    for (let d = start; d <= today; d++) days.push(d);
    setSelectedDays(days);
  };

  // Generate output string according to format
  const generatedString = useMemo(() => {
    if (selectedDays.length === 0) return '';
    const sorted = [...selectedDays].sort((a, b) => a - b);
    const mStr = String(selectedMonth + 1).padStart(2, '0');
    const monthName = TR_MONTH_NAMES[selectedMonth] || '';

    if (formatType === 'parentheses') {
      // e.g. (12.13/11/2026) or (12.13.14/11/2026)
      const dayTokens = sorted.map(d => String(d).padStart(2, '0')).join('.');
      return `(${dayTokens}/${mStr}/${selectedYear})`;
    } else if (formatType === 'dots') {
      // e.g. 12.13/11/2026
      const dayTokens = sorted.map(d => String(d).padStart(2, '0')).join('.');
      return `${dayTokens}/${mStr}/${selectedYear}`;
    } else if (formatType === 'dash') {
      // e.g. 12-13.11.2026 or 12-14.11.2026
      const start = String(sorted[0]).padStart(2, '0');
      const end = String(sorted[sorted.length - 1]).padStart(2, '0');
      return `${start}-${end}.${mStr}.${selectedYear}`;
    } else {
      // e.g. 12 ve 13 Kasım 2026
      if (sorted.length === 1) {
        return `${sorted[0]} ${monthName} ${selectedYear}`;
      } else if (sorted.length === 2) {
        return `${sorted[0]} ve ${sorted[1]} ${monthName} ${selectedYear}`;
      } else {
        return `${sorted.slice(0, -1).join(', ')} ve ${sorted[sorted.length - 1]} ${monthName} ${selectedYear}`;
      }
    }
  }, [selectedDays, selectedMonth, selectedYear, formatType]);

  const previewInfo = useMemo(() => {
    return parseDateDetailed(generatedString);
  }, [generatedString]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-750 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Çok Günlü Eğitim Tarihi Seçici</h3>
              <p className="text-[11px] text-slate-400">2-3 gün süren İSG eğitimleri için resmi tarih formatı oluşturun</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pb-1">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Hazır Seçimler:</span>
            <button
              type="button"
              onClick={() => {
                const today = now.getDate();
                setSelectedDays([today]);
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              Bugün (1 Gün)
            </button>
            <button
              type="button"
              onClick={() => selectConsecutiveDays(2)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-semibold transition"
            >
              2 Günlük Eğitim
            </button>
            <button
              type="button"
              onClick={() => selectConsecutiveDays(3)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-semibold transition"
            >
              3 Günlük Eğitim
            </button>
          </div>

          {/* Month & Year Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Ay</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-750 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-semibold text-white outline-none cursor-pointer"
              >
                {TR_MONTH_NAMES.map((name, idx) => (
                  <option key={idx} value={idx}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Yıl</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-750 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-semibold text-white outline-none cursor-pointer"
              >
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Calendar Day Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-slate-300">
                Eğitim Yapılan Günleri Tıklayarak Seçin ({selectedDays.length} Gün Seçildi)
              </label>
              <span className="text-[10px] text-amber-400 font-medium">
                {selectedDays.length > 0 ? `${selectedDays.join(', ')} ${TR_MONTH_NAMES[selectedMonth]}` : 'Gün seçin'}
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[10px] font-bold text-slate-500 uppercase">
                <span>Pzt</span>
                <span>Sal</span>
                <span>Çar</span>
                <span>Per</span>
                <span>Cum</span>
                <span>Cmt</span>
                <span>Paz</span>
              </div>

              {/* Day buttons */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-8" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isSelected = selectedDays.includes(day);
                  const isEarliest = isSelected && day === Math.min(...selectedDays);
                  const isLatest = isSelected && day === Math.max(...selectedDays) && selectedDays.length > 1;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`h-8 rounded-lg text-xs font-bold transition flex items-center justify-center relative ${
                        isSelected 
                          ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400' 
                          : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      {day}
                      {isEarliest && selectedDays.length > 1 && (
                        <span className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-blue-500" title="İlk Gün" />
                      )}
                      {isLatest && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" title="Bitiş Günü" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Format Choices */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1.5">Sertifika Yazım Formatı</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label 
                className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                  formatType === 'parentheses' ? 'bg-amber-500/10 border-amber-500/50 text-amber-200' : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <input 
                  type="radio" 
                  name="dateFormat" 
                  checked={formatType === 'parentheses'} 
                  onChange={() => setFormatType('parentheses')} 
                  className="mt-0.5 accent-amber-500"
                />
                <div>
                  <div className="font-bold">Parantezli Çok Gün (Önerilen)</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Örn: (12.13/11/2026)</div>
                </div>
              </label>

              <label 
                className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                  formatType === 'dots' ? 'bg-amber-500/10 border-amber-500/50 text-amber-200' : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <input 
                  type="radio" 
                  name="dateFormat" 
                  checked={formatType === 'dots'} 
                  onChange={() => setFormatType('dots')} 
                  className="mt-0.5 accent-amber-500"
                />
                <div>
                  <div className="font-bold">Noktalı Çok Gün</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Örn: 12.13/11/2026</div>
                </div>
              </label>

              <label 
                className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                  formatType === 'dash' ? 'bg-amber-500/10 border-amber-500/50 text-amber-200' : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <input 
                  type="radio" 
                  name="dateFormat" 
                  checked={formatType === 'dash'} 
                  onChange={() => setFormatType('dash')} 
                  className="mt-0.5 accent-amber-500"
                />
                <div>
                  <div className="font-bold">Tireli Tarih Aralığı</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Örn: 12-13.11.2026</div>
                </div>
              </label>

              <label 
                className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                  formatType === 'text' ? 'bg-amber-500/10 border-amber-500/50 text-amber-200' : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <input 
                  type="radio" 
                  name="dateFormat" 
                  checked={formatType === 'text'} 
                  onChange={() => setFormatType('text')} 
                  className="mt-0.5 accent-amber-500"
                />
                <div>
                  <div className="font-bold">Yazılı Türkçe Metin</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Örn: 12 ve 13 Kasım 2026</div>
                </div>
              </label>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="bg-slate-950/90 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Sertifikaya Yazılacak Metin:</span>
              <span className="font-mono font-bold text-amber-400 text-sm bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {generatedString || '-'}
              </span>
            </div>
            {previewInfo && (
              <div className="text-[11px] text-emerald-400 flex items-center justify-between pt-1 border-t border-slate-800">
                <span className="flex items-center gap-1 font-medium">
                  <Check size={13} className="text-emerald-400" />
                  {previewInfo.displaySummary}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Bitiş: {String(previewInfo.endDay).padStart(2,'0')}.{String(previewInfo.month+1).padStart(2,'0')}.{previewInfo.year}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-750 bg-slate-950/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={() => {
              if (generatedString) {
                onApply(generatedString);
                onClose();
              }
            }}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>Tarihi Alana Aktar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
