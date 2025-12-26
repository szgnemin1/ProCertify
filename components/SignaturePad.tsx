import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Pen, Check, X } from 'lucide-react';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 600;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
      }
    }
  }, []); // Run once on mount

  useEffect(() => {
     const canvas = canvasRef.current;
     if (canvas) {
         const ctx = canvas.getContext('2d');
         if(ctx) {
             ctx.strokeStyle = color;
             ctx.lineWidth = lineWidth;
         }
     }
  }, [color, lineWidth]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    return {
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top
    };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl p-6 shadow-2xl w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-800">İmza Oluştur</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500">
            <X size={24} />
          </button>
        </div>

        <div className="bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 overflow-hidden cursor-crosshair relative">
           <canvas
            ref={canvasRef}
            className="w-full h-auto bg-transparent touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          <div className="absolute bottom-2 right-2 text-xs text-slate-400 pointer-events-none">
            Çizmek için sürükleyin
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between mt-4 gap-4">
          <div className="flex items-center gap-2">
            <button
                onClick={() => setColor('#000000')}
                className={`w-8 h-8 rounded-full bg-black border-2 ${color === '#000000' ? 'border-blue-500' : 'border-transparent'}`}
            />
             <button
                onClick={() => setColor('#1e40af')}
                className={`w-8 h-8 rounded-full bg-blue-800 border-2 ${color === '#1e40af' ? 'border-blue-500' : 'border-transparent'}`}
            />
            <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
            <input 
                type="range" 
                min="1" 
                max="10" 
                value={lineWidth} 
                onChange={(e) => setLineWidth(Number(e.target.value))}
                className="w-24 accent-blue-600"
            />
          </div>

          <div className="flex gap-2">
            <button 
              onClick={clearCanvas}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              <Eraser size={18} />
              Temizle
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition shadow-lg shadow-blue-500/30"
            >
              <Check size={18} />
              Ekle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignaturePad;
