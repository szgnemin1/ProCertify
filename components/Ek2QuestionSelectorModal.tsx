import React, { useState, useMemo } from 'react';
import { 
  X, 
  CheckSquare, 
  Square, 
  Save, 
  RotateCcw, 
  Sliders, 
  Search, 
  CheckCircle2,
  Sparkles,
  Layers
} from 'lucide-react';
import { Ek2FieldMappingItem } from '../types';

interface Ek2QuestionSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Ek2FieldMappingItem[];
  onSaveQuestions: (updatedQuestions: Ek2FieldMappingItem[]) => Promise<void>;
}

export const Ek2QuestionSelectorModal: React.FC<Ek2QuestionSelectorModalProps> = ({
  isOpen,
  onClose,
  questions,
  onSaveQuestions
}) => {
  const [localQuestions, setLocalQuestions] = useState<Ek2FieldMappingItem[]>(questions);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync when prop updates
  React.useEffect(() => {
    setLocalQuestions(questions);
  }, [questions]);

  if (!isOpen) return null;

  // Toggle single question
  const toggleQuestion = (id: string) => {
    setLocalQuestions(prev => prev.map(q => {
      if (q.id === id) {
        return { ...q, enabled: q.enabled === false ? true : false };
      }
      return q;
    }));
  };

  // Group by section
  const sections = useMemo(() => {
    const map = new Map<string, Ek2FieldMappingItem[]>();
    localQuestions.forEach(q => {
      const sec = q.section || 'Genel Sorular';
      if (!map.has(sec)) map.set(sec, []);
      map.get(sec)!.push(q);
    });
    return Array.from(map.entries());
  }, [localQuestions]);

  // Section bulk toggle
  const toggleSection = (sectionName: string, state: boolean) => {
    setLocalQuestions(prev => prev.map(q => {
      if ((q.section || 'Genel Sorular') === sectionName) {
        return { ...q, enabled: state };
      }
      return q;
    }));
  };

  // Presets
  const applyPreset = (preset: 'all' | 'essential' | 'rapid') => {
    if (preset === 'all') {
      setLocalQuestions(prev => prev.map(q => ({ ...q, enabled: true })));
    } else if (preset === 'essential') {
      // Keep employee info, vitals, primary anamnez, decision
      setLocalQuestions(prev => prev.map(q => {
        const isEssential = ['employee', 'physical_exam', 'decision', 'anamnez_complaints'].includes(q.category);
        return { ...q, enabled: isEssential };
      }));
    } else if (preset === 'rapid') {
      // Rapid field check
      setLocalQuestions(prev => prev.map(q => {
        const isRapid = ['f_adSoyad', 'f_tckn', 'f_meslegi', 'f_vital_ta', 'f_vital_nb', 'f_vital_boy', 'f_vital_kilo', 'f_vital_vki', 'f_dec_elverisli', 'f_employeeSignature'].includes(q.id);
        return { ...q, enabled: isRapid };
      }));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSaveQuestions(localQuestions);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (e) {
      console.error(e);
      alert("Soru tercihleri kaydedilirken hata oluştu!");
    } finally {
      setSaving(false);
    }
  };

  const totalEnabled = localQuestions.filter(q => q.enabled !== false).length;

  return (
    <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Saha Soru Seçimi ve Görünürlük Yönetimi
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono">
                  {totalEnabled} / {localQuestions.length} Soru Aktif
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Sahada tablet üzerinde hangi soruların doldurulacağını seçin. Pasif sorular saha ekranında gizlenir.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar (Search & Presets) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Soru veya alan adı ara (Örn: Tansiyon, Şeker, Sigara)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-teal-500 bg-white"
            />
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => applyPreset('all')}
              className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition flex items-center gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5 text-teal-700" />
              Tümünü Aç
            </button>
            <button
              type="button"
              onClick={() => applyPreset('essential')}
              className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Standart Muayene
            </button>
            <button
              type="button"
              onClick={() => applyPreset('rapid')}
              className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Hızlı Giriş
            </button>
          </div>
        </div>

        {/* Questions List (Grouped by Sections) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {sections.map(([sectionName, items]) => {
            const filteredItems = items.filter(it => 
              !search || it.label.toLowerCase().includes(search.toLowerCase()) || it.fieldKey.toLowerCase().includes(search.toLowerCase())
            );

            if (filteredItems.length === 0) return null;

            const allSectionEnabled = filteredItems.every(it => it.enabled !== false);
            const someSectionEnabled = filteredItems.some(it => it.enabled !== false);

            return (
              <div key={sectionName} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {/* Section Header */}
                <div className="bg-slate-100/80 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{sectionName}</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      ({filteredItems.filter(i => i.enabled !== false).length}/{filteredItems.length})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSection(sectionName, true)}
                      className="text-[11px] font-bold text-teal-700 hover:text-teal-900 hover:underline"
                    >
                      Bölümü Aç
                    </button>
                    <span className="text-slate-300">&bull;</span>
                    <button
                      type="button"
                      onClick={() => toggleSection(sectionName, false)}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-700 hover:underline"
                    >
                      Bölümü Kapat
                    </button>
                  </div>
                </div>

                {/* Question Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3">
                  {filteredItems.map(item => {
                    const isChecked = item.enabled !== false;
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleQuestion(item.id)}
                        className={`flex items-start gap-3 p-2.5 rounded-xl border transition cursor-pointer select-none ${
                          isChecked
                            ? 'bg-teal-50/40 border-teal-200 hover:bg-teal-50'
                            : 'bg-slate-50/60 border-slate-200 opacity-60 hover:opacity-90'
                        }`}
                      >
                        <div className="mt-0.5">
                          {isChecked ? (
                            <CheckSquare className="w-5 h-5 text-teal-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-bold leading-tight ${isChecked ? 'text-slate-900' : 'text-slate-500 line-through'}`}>
                              {item.label}
                            </span>
                            {item.excelCell && (
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600">
                                {item.excelCell}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5 truncate">
                            {item.fieldKey}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-600">
            Toplam <strong className="text-slate-900 font-bold">{totalEnabled}</strong> soru aktif olarak tablet formunda gösterilecek.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-200 font-bold text-xs transition"
            >
              Vazgeç
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/30 active:scale-95 transition cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  Kaydedildi!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {saving ? 'Kaydediliyor...' : 'Tercihleri Kaydet ve Uygula'}
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
