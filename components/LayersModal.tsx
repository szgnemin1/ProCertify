import React from 'react';
import { X, Layers, ArrowUp, ArrowDown, Trash2, Eye, BoxSelect, Award, Shapes, Type, Calendar, Building, ShieldCheck, PenTool, QrCode, ImageIcon } from 'lucide-react';
import { CanvasElement, ElementType } from '../types';

interface LayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: CanvasElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (newElements: CanvasElement[]) => void;
  onDelete: (id: string) => void;
}

export const LayersModal: React.FC<LayersModalProps> = ({
  isOpen,
  onClose,
  elements,
  selectedId,
  onSelect,
  onReorder,
  onDelete
}) => {
  if (!isOpen) return null;

  // Visual stack order: index 0 is bottom (rendered first), last index is top (rendered last)
  // In the UI list, we display from Top to Bottom (last index at the top)
  const displayList = [...elements].reverse();

  const moveLayer = (elementId: string, direction: 'up' | 'down') => {
    const idx = elements.findIndex(e => e.id === elementId);
    if (idx === -1) return;

    const newArr = [...elements];
    if (direction === 'up' && idx < newArr.length - 1) {
      const temp = newArr[idx];
      newArr[idx] = newArr[idx + 1];
      newArr[idx + 1] = temp;
      onReorder(newArr);
    } else if (direction === 'down' && idx > 0) {
      const temp = newArr[idx];
      newArr[idx] = newArr[idx - 1];
      newArr[idx - 1] = temp;
      onReorder(newArr);
    }
  };

  const getElementIcon = (type: ElementType) => {
    switch (type) {
      case ElementType.BORDER: return <BoxSelect size={14} className="text-amber-400" />;
      case ElementType.BADGE: return <Award size={14} className="text-amber-400" />;
      case ElementType.SHAPE: return <Shapes size={14} className="text-indigo-400" />;
      case ElementType.TEXT: return <Type size={14} className="text-blue-400" />;
      case ElementType.DATE: return <Calendar size={14} className="text-emerald-400" />;
      case ElementType.COMPANY: return <Building size={14} className="text-purple-400" />;
      case ElementType.TCKN: return <ShieldCheck size={14} className="text-cyan-400" />;
      case ElementType.SIGNATURE: return <PenTool size={14} className="text-violet-400" />;
      case ElementType.QRCODE: return <QrCode size={14} className="text-slate-300" />;
      case ElementType.IMAGE: return <ImageIcon size={14} className="text-amber-400" />;
      default: return <Type size={14} className="text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-750 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Layers size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Katmanlar Paneli (Z-Index)</h3>
              <p className="text-[10px] text-slate-400">Bileşenlerin öne/arkaya sıralamasını yönetin ({elements.length} Katman)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X size={18} />
          </button>
        </div>

        {/* Layers List */}
        <div className="p-3 overflow-y-auto space-y-1.5 flex-1 custom-scrollbar">
          {displayList.map((el, reverseIndex) => {
            const actualIndex = elements.length - 1 - reverseIndex;
            const isSelected = selectedId === el.id;

            return (
              <div
                key={el.id}
                onClick={() => onSelect(el.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer select-none ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-6 h-6 rounded-md bg-slate-900 border border-slate-750 flex items-center justify-center shrink-0">
                    {getElementIcon(el.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold truncate block">
                      {el.label || el.type}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono block">
                      x: {Math.round(el.x)}px, y: {Math.round(el.y)}px
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); moveLayer(el.id, 'up'); }}
                    disabled={actualIndex >= elements.length - 1}
                    className={`p-1 rounded transition ${actualIndex >= elements.length - 1 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
                    title="Öne Getir"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveLayer(el.id, 'down'); }}
                    disabled={actualIndex <= 0}
                    className={`p-1 rounded transition ${actualIndex <= 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
                    title="Arkaya Gönder"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(el.id); }}
                    className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition ml-1"
                    title="Katmanı Sil"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 text-center">
          En üstteki katman tuvalde en önde çizilir.
        </div>
      </div>
    </div>
  );
};
