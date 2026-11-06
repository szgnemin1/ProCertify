import React from 'react';
import { X, Palette, Check } from 'lucide-react';

export interface ColorTheme {
  id: string;
  name: string;
  desc: string;
  borderColor: string;
  textColor: string;
  shapeBorderColor: string;
  badgeColor: string;
  previewColors: string[];
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'gold_navy',
    name: 'Kraliyet Altını & Lacivert',
    desc: 'Geleneksel prestijli mezuniyet ve katılım belgesi',
    borderColor: '#b45309',
    textColor: '#1e3a8a',
    shapeBorderColor: '#d97706',
    badgeColor: '#b45309',
    previewColors: ['#b45309', '#d97706', '#1e3a8a', '#f8fafc']
  },
  {
    id: 'safety_blue',
    name: 'İSG Güvenlik & Okyanus',
    desc: 'Teknik ve saha güvenliği standart sertifikası',
    borderColor: '#0284c7',
    textColor: '#0f172a',
    shapeBorderColor: '#0284c7',
    badgeColor: '#0369a1',
    previewColors: ['#0284c7', '#38bdf8', '#0f172a', '#f0f9ff']
  },
  {
    id: 'eco_green',
    name: 'Çevre & Ekolojik Zümrüt',
    desc: 'Çevre, sürdürülebilirlik ve hijyen eğitimleri',
    borderColor: '#059669',
    textColor: '#064e3b',
    shapeBorderColor: '#10b981',
    badgeColor: '#059669',
    previewColors: ['#059669', '#10b981', '#064e3b', '#f0fdf4']
  },
  {
    id: 'danger_red',
    name: 'Yangın & Acil Durum',
    desc: 'Yangın eğitimi, ilk yardım ve acil kurtarma',
    borderColor: '#dc2626',
    textColor: '#7f1d1d',
    shapeBorderColor: '#ef4444',
    badgeColor: '#dc2626',
    previewColors: ['#dc2626', '#ef4444', '#7f1d1d', '#fef2f2']
  },
  {
    id: 'modern_platinum',
    name: 'Platin & Modern Antrasit',
    desc: 'Minimalist, kurumsal yönetim ve denetim belgesi',
    borderColor: '#475569',
    textColor: '#0f172a',
    shapeBorderColor: '#64748b',
    badgeColor: '#334155',
    previewColors: ['#475569', '#64748b', '#0f172a', '#f8fafc']
  }
];

interface ColorPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTheme: (theme: ColorTheme) => void;
}

export const ColorPaletteModal: React.FC<ColorPaletteModalProps> = ({
  isOpen,
  onClose,
  onApplyTheme
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-750 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Palette size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">1-Tıkla Renk Teması Dönüştürücü</h3>
              <p className="text-[10px] text-slate-400">Tüm çerçeve, mühür ve ayraçları kurumsal uyumlu renklere dönüştürün</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X size={18} />
          </button>
        </div>

        {/* Themes Grid */}
        <div className="p-4 space-y-2.5 overflow-y-auto max-h-[60vh] custom-scrollbar">
          {COLOR_THEMES.map(theme => (
            <div
              key={theme.id}
              onClick={() => {
                onApplyTheme(theme);
                onClose();
              }}
              className="p-3.5 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 rounded-xl transition cursor-pointer flex items-center justify-between group"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-white group-hover:text-amber-400 transition block">
                  {theme.name}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {theme.desc}
                </span>
              </div>

              {/* Color Swatches */}
              <div className="flex items-center gap-1.5 shrink-0 pl-3">
                {theme.previewColors.map((col, idx) => (
                  <div
                    key={idx}
                    className="w-5 h-5 rounded-full border border-black/30 shadow-sm"
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 text-center">
          Temayı seçtiğinizde tuvaldeki çerçeveler, ayraç çizgileri ve mühürler otomatik renk değiştirir.
        </div>
      </div>
    </div>
  );
};
