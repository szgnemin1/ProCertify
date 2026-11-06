import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCcw, Check, X, PenTool, ShieldCheck, Undo2, Palette } from 'lucide-react';

interface FullScreenTabletSignatureProps {
  employeeName: string;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

interface StrokePoint {
  x: number;
  y: number;
}

interface Stroke {
  points: StrokePoint[];
  color: string;
  width: number;
}

export const FullScreenTabletSignature: React.FC<FullScreenTabletSignatureProps> = ({
  employeeName,
  onSave,
  onClose
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentStrokeRef = useRef<StrokePoint[]>([]);
  const isDrawingRef = useRef(false);

  const [penColor, setPenColor] = useState<string>('#0f172a'); // Default dark navy
  const [penWidth, setPenWidth] = useState<number>(3.5);

  // Redraw all strokes on canvas
  const redrawCanvas = useCallback((allStrokes: Stroke[], inProgressPoints?: StrokePoint[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawSingleStroke = (pts: StrokePoint[], color: string, width: number) => {
      if (pts.length === 0) return;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color;
      ctx.lineWidth = width;

      if (pts.length === 1) {
        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, width / 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
        return;
      }

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);

      for (let i = 1; i < pts.length; i++) {
        const p1 = pts[i - 1];
        const p2 = pts[i];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      }
      ctx.stroke();
      ctx.restore();
    };

    allStrokes.forEach(s => drawSingleStroke(s.points, s.color, s.width));
    if (inProgressPoints && inProgressPoints.length > 0) {
      drawSingleStroke(inProgressPoints, penColor, penWidth);
    }
  }, [penColor, penWidth]);

  // Canvas size setup
  const updateCanvasSize = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    canvas.width = Math.floor(rect.width);
    canvas.height = Math.floor(rect.height);

    redrawCanvas(strokes, currentStrokeRef.current);
  }, [strokes, redrawCanvas]);

  useEffect(() => {
    // Immediate and delayed resize to guarantee rect is non-zero after mount animation
    updateCanvasSize();
    const t1 = setTimeout(updateCanvasSize, 50);
    const t2 = setTimeout(updateCanvasSize, 250);

    window.addEventListener('resize', updateCanvasSize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [updateCanvasSize]);

  // Pointer event coordinate extractor relative to canvas
  const getCanvasCoords = (clientX: number, clientY: number): StrokePoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const pt = getCanvasCoords(e.clientX, e.clientY);
    currentStrokeRef.current = [pt];
    redrawCanvas(strokes, currentStrokeRef.current);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const pt = getCanvasCoords(e.clientX, e.clientY);
    currentStrokeRef.current.push(pt);
    redrawCanvas(strokes, currentStrokeRef.current);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    isDrawingRef.current = false;

    if (currentStrokeRef.current.length > 0) {
      const newStroke: Stroke = {
        points: [...currentStrokeRef.current],
        color: penColor,
        width: penWidth
      };
      const updated = [...strokes, newStroke];
      setStrokes(updated);
      currentStrokeRef.current = [];
      redrawCanvas(updated);
    }
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const updated = strokes.slice(0, -1);
    setStrokes(updated);
    redrawCanvas(updated);
  };

  const handleClear = () => {
    setStrokes([]);
    currentStrokeRef.current = [];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Safe ink bounding box crop
  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || strokes.length === 0) {
      alert("Lütfen önce imzanızı atınız.");
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Find actual ink bounds from strokes directly
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    strokes.forEach(s => {
      s.points.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });
    });

    if (minX === Infinity) {
      alert("Lütfen önce imzanızı atınız.");
      return;
    }

    const pad = 16;
    minX = Math.max(0, Math.floor(minX - pad));
    minY = Math.max(0, Math.floor(minY - pad));
    maxX = Math.min(canvas.width, Math.ceil(maxX + pad));
    maxY = Math.min(canvas.height, Math.ceil(maxY + pad));

    const cropW = Math.max(10, maxX - minX);
    const cropH = Math.max(10, maxY - minY);

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropW;
    cropCanvas.height = cropH;
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) return;

    cropCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
    const croppedDataUrl = cropCanvas.toDataURL('image/png');
    onSave(croppedDataUrl);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900 flex flex-col select-none touch-none">
      {/* Top Header */}
      <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between border-b border-slate-700 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Çalışan İmza Alanı
              <span className="text-xs bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Tablet Kalem & Parmak Uyumlu
              </span>
            </h2>
            <p className="text-sm text-slate-300">
              <strong className="text-white">{employeeName}</strong> &bull; Lütfen aşağıdaki kutu içerisine imzanızı atınız.
            </p>
          </div>
        </div>

        {/* Pen Controls & Actions */}
        <div className="flex items-center gap-3">
          {/* Pen Color Selector */}
          <div className="flex items-center bg-slate-700/80 rounded-xl p-1 border border-slate-600">
            <button
              type="button"
              onClick={() => setPenColor('#0f172a')}
              className={`w-7 h-7 rounded-lg transition flex items-center justify-center ${penColor === '#0f172a' ? 'ring-2 ring-teal-400 scale-105' : 'opacity-70'}`}
              title="Siyah Mürekkep"
            >
              <div className="w-4 h-4 rounded-full bg-slate-950 border border-slate-400"></div>
            </button>
            <button
              type="button"
              onClick={() => setPenColor('#1e40af')}
              className={`w-7 h-7 rounded-lg transition flex items-center justify-center ${penColor === '#1e40af' ? 'ring-2 ring-teal-400 scale-105' : 'opacity-70'}`}
              title="Resmi Mavi Mürekkep"
            >
              <div className="w-4 h-4 rounded-full bg-blue-700 border border-blue-400"></div>
            </button>
          </div>

          {/* Pen Width */}
          <div className="flex items-center gap-1 bg-slate-700/80 rounded-xl px-2 py-1 border border-slate-600 text-xs font-semibold">
            {[
              { w: 2.5, label: 'İnce' },
              { w: 3.5, label: 'Orta' },
              { w: 5.0, label: 'Kalın' }
            ].map(pw => (
              <button
                key={pw.w}
                type="button"
                onClick={() => setPenWidth(pw.w)}
                className={`px-2 py-1 rounded-md transition ${penWidth === pw.w ? 'bg-teal-600 text-white' : 'text-slate-300 hover:text-white'}`}
              >
                {pw.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 font-semibold text-xs transition"
          >
            <Undo2 className="w-4 h-4" />
            Geri Al
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={strokes.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 font-semibold text-xs transition"
          >
            <RotateCcw className="w-4 h-4" />
            Temizle
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-rose-900/60 text-slate-300 hover:text-white font-semibold text-xs transition"
          >
            <X className="w-4 h-4" />
            Kapat
          </button>
        </div>
      </div>

      {/* Canvas Area with Paper Guideline */}
      <div 
        ref={containerRef} 
        className="relative flex-1 bg-white cursor-crosshair overflow-hidden touch-none"
        style={{ touchAction: 'none' }}
      >
        {/* Subtle Watermark and Baseline */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
          <ShieldCheck className="w-24 h-24 text-slate-400 mb-2" />
          <p className="text-xl font-bold text-slate-500 uppercase tracking-widest">
            {employeeName}
          </p>
          <p className="text-xs text-slate-400 mt-1">Lütfen imzanızı bu çizginin üzerine atınız</p>
          <div className="w-3/4 max-w-xl border-b-2 border-dashed border-slate-400 mt-6"></div>
        </div>

        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block"
          style={{ touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between border-t border-slate-700 shadow-2xl">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          İmza atıldıktan sonra resmi Ek-2 formuna otomatik ölçeklenerek orantılı şekilde yerleştirilecektir.
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={strokes.length === 0}
          className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl font-bold text-lg shadow-xl transition active:scale-95 ${
            strokes.length > 0
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/25 cursor-pointer'
              : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
          }`}
        >
          <Check className="w-6 h-6" />
          İmzayı Onayla ve Belgeye Aktar
        </button>
      </div>
    </div>
  );
};
