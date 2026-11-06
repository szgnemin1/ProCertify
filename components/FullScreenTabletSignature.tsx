import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCcw, Check, X, PenTool, ShieldCheck } from 'lucide-react';

interface FullScreenTabletSignatureProps {
  employeeName: string;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

export const FullScreenTabletSignature: React.FC<FullScreenTabletSignatureProps> = ({
  employeeName,
  onSave,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Resize canvas to full window while taking devicePixelRatio into account for crisp lines
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Save previous drawing if needed, or just initialize clean
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3.5;
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Prevent default touch scrolling
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setHasDrawn(true);
    lastPointRef.current = { x, y };

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx && lastPointRef.current) {
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      // Smooth quadratic curve midpoint
      const midX = (lastPointRef.current.x + x) / 2;
      const midY = (lastPointRef.current.y + y) / 2;
      ctx.quadraticCurveTo(lastPointRef.current.x, lastPointRef.current.y, midX, midY);
      ctx.stroke();
    }

    lastPointRef.current = { x, y };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(false);
    lastPointRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch { /* ignore */ }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    setHasDrawn(false);
  };

  // Crop ink bounding box so signature is tightly framed and fits any target rectangle cleanly
  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    let minX = w;
    let minY = h;
    let maxX = 0;
    let maxY = 0;
    let hasPixels = false;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const alpha = data[(y * w + x) * 4 + 3];
        if (alpha > 20) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          hasPixels = true;
        }
      }
    }

    if (!hasPixels) {
      alert("Lütfen önce imzanızı atınız.");
      return;
    }

    // Add safety margin around ink
    const pad = 12;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(w, maxX + pad);
    maxY = Math.min(h, maxY + pad);

    const cropW = Math.max(1, maxX - minX);
    const cropH = Math.max(1, maxY - minY);

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
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col select-none touch-none animate-fadeIn">
      {/* Top Banner Header */}
      <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between shadow-lg border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Çalışan İmza Alanı
              <span className="text-xs bg-teal-600/30 text-teal-300 font-semibold px-2.5 py-0.5 rounded-full border border-teal-500/30">
                Tablet Stylus Uyumlu
              </span>
            </h2>
            <p className="text-sm text-slate-300">
              <strong className="text-white">{employeeName}</strong> &bull; Lütfen kalem veya parmağınızla ekranın ortasındaki alana imzanızı atınız.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={clearCanvas}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-200 font-semibold transition"
          >
            <RotateCcw className="w-4 h-4" />
            Temizle
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-rose-900/60 text-slate-300 hover:text-white active:scale-95 font-semibold transition"
          >
            <X className="w-4 h-4" />
            İptal
          </button>
        </div>
      </div>

      {/* Fullscreen Drawing Canvas Area */}
      <div className="relative flex-1 bg-white cursor-crosshair overflow-hidden">
        {/* Subtle Watermark Guideline */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
          <ShieldCheck className="w-32 h-32 text-slate-400 mb-4" />
          <p className="text-2xl font-bold text-slate-500 tracking-wider uppercase">
            {employeeName}
          </p>
          <p className="text-sm text-slate-400 mt-1">İmzanızı bu alan içerisine atınız</p>
          <div className="w-96 border-b-2 border-dashed border-slate-300 mt-8"></div>
        </div>

        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
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
          İmzanız resmi Ek-2 formuna otomatik ölçeklenerek ve orantısı korunarak işlenecektir.
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!hasDrawn}
          className={`flex items-center gap-3 px-8 py-3.5 rounded-xl font-bold text-lg shadow-xl transition active:scale-95 ${
            hasDrawn
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/25 cursor-pointer'
              : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
          }`}
        >
          <Check className="w-6 h-6" />
          İmzayı Onayla ve Devam Et
        </button>
      </div>
    </div>
  );
};
