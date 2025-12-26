import React, { useRef, useState, useEffect } from 'react';
import { CanvasElement, ElementType } from '../types';
import { Trash2, Maximize2, List } from 'lucide-react';
import QRCode from 'qrcode';

interface CanvasEditorProps {
  elements: CanvasElement[];
  width: number;
  height: number;
  bgUrl: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
  scale: number;
  readOnly?: boolean;
}

const CanvasEditor: React.FC<CanvasEditorProps> = ({
  elements,
  width,
  height,
  bgUrl,
  selectedId,
  onSelect,
  onUpdateElement,
  onDeleteElement,
  scale,
  readOnly = false
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Dragging State
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Resizing State
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0, fontSize: 0 });

  // QR Code Cache to prevent flickering
  const [qrCache, setQrCache] = useState<Record<string, string>>({});

  // Generate QR Codes
  useEffect(() => {
    const generateQRs = async () => {
        const qrElements = elements.filter(el => el.type === ElementType.QRCODE);
        const newCache = { ...qrCache };
        let hasChanges = false;

        for (const el of qrElements) {
            const cacheKey = `${el.id}-${el.content}-${el.color || '#000000'}`;
            if (!newCache[cacheKey]) {
                try {
                    const url = await QRCode.toDataURL(el.content || 'https://example.com', {
                        width: 400, // Generate high res then scale down via CSS
                        margin: 1,
                        color: {
                            dark: el.color || '#000000',
                            light: '#00000000' // Transparent background
                        }
                    });
                    newCache[cacheKey] = url;
                    hasChanges = true;
                } catch (e) {
                    console.error("QR Gen Error", e);
                }
            }
        }
        if (hasChanges) setQrCache(newCache);
    };
    generateQRs();
  }, [elements]);


  // --- DRAG HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (readOnly) return;
    e.stopPropagation(); // Prevent canvas deselect
    const element = elements.find(el => el.id === id);
    if (!element || !canvasRef.current) return;

    onSelect(id);
    setDraggingId(id);

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (e.clientY - rect.top) / scale;

    setDragOffset({
      x: mouseX - element.x,
      y: mouseY - element.y
    });
  };

  // --- RESIZE HANDLERS ---
  const handleResizeStart = (e: React.MouseEvent, id: string) => {
    if (readOnly) return;
    e.stopPropagation();
    e.preventDefault();
    
    const element = elements.find(el => el.id === id);
    if (!element) return;

    setResizingId(id);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      w: element.width,
      h: element.height,
      fontSize: element.fontSize || 20
    });
  };

  // --- GLOBAL MOVE/UP HANDLERS ---
  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (readOnly || !canvasRef.current) return;

    // Handle Dragging
    if (draggingId) {
       const rect = canvasRef.current.getBoundingClientRect();
       const mouseX = (e.clientX - rect.left) / scale;
       const mouseY = (e.clientY - rect.top) / scale;

       onUpdateElement(draggingId, { 
           x: mouseX - dragOffset.x, 
           y: mouseY - dragOffset.y 
       });
       return;
    }

    // Handle Resizing
    if (resizingId) {
      const element = elements.find(el => el.id === resizingId);
      if (!element) return;

      const deltaX = (e.clientX - resizeStart.x) / scale;
      const deltaY = (e.clientY - resizeStart.y) / scale;

      // Calculate new dimensions
      const newWidth = Math.max(20, resizeStart.w + deltaX);
      const newHeight = Math.max(20, resizeStart.h + deltaY);

      const updates: Partial<CanvasElement> = {
        width: newWidth,
        height: newHeight
      };

      // For text and dropdown, we scale font size based on width change ratio
      if (element.type === ElementType.TEXT || element.type === ElementType.DROPDOWN || element.type === ElementType.COMPANY) {
         const ratio = newWidth / resizeStart.w;
         updates.fontSize = Math.max(10, resizeStart.fontSize * ratio);
      }

      onUpdateElement(resizingId, updates);
    }
  };

  const handleGlobalMouseUp = () => {
    setDraggingId(null);
    setResizingId(null);
  };

  useEffect(() => {
    if (draggingId || resizingId) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [draggingId, resizingId, elements, dragOffset, resizeStart]);

  return (
    <div 
        className="relative shadow-2xl transition-all duration-200 ease-out flex-shrink-0"
        style={{
            width: width * scale,
            height: height * scale,
        }}
    >
        <div
            ref={canvasRef}
            className="absolute top-0 left-0 overflow-hidden bg-white origin-top-left"
            style={{
                width: width,
                height: height,
                transform: `scale(${scale})`,
                backgroundImage: `url(${bgUrl})`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
            }}
            onMouseDown={() => !readOnly && onSelect(null)}
        >
        {elements.map((el) => (
            <div
            key={el.id}
            className={`absolute flex flex-col justify-center
                ${!readOnly ? 'cursor-move group' : ''}
                ${selectedId === el.id ? 'z-50' : 'z-10'}
            `}
            style={{
                left: el.x,
                top: el.y,
                width: el.width,
                height: (el.type === ElementType.TEXT || el.type === ElementType.DROPDOWN || el.type === ElementType.COMPANY) ? 'auto' : el.height,
                minHeight: (el.type === ElementType.TEXT || el.type === ElementType.DROPDOWN || el.type === ElementType.COMPANY) ? undefined : el.height,
                transform: 'translate(0, 0)', 
                alignItems: el.textAlign === 'left' ? 'flex-start' : (el.textAlign === 'right' ? 'flex-end' : 'center')
            }}
            onMouseDown={(e) => handleMouseDown(e, el.id)}
            >
            {/* Selection Border & Resize Handles - Only in Edit Mode */}
            {!readOnly && selectedId === el.id && (
                <>
                  {/* Border */}
                  <div className="absolute -inset-1 border-2 border-blue-500 rounded-sm pointer-events-none opacity-80"></div>
                  
                  {/* Delete Button */}
                  <div className="absolute -top-8 right-0 flex gap-2">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteElement(el.id); }}
                        className="bg-red-500 text-white p-1 rounded hover:bg-red-600 transition shadow-sm"
                    >
                        <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Resize Handle (Bottom Right) */}
                  <div 
                    className="absolute -bottom-2 -right-2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full cursor-se-resize flex items-center justify-center shadow-sm z-50 hover:bg-blue-50"
                    onMouseDown={(e) => handleResizeStart(e, el.id)}
                  >
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  </div>
                </>
            )}

            {/* Content Rendering: TEXT, DROPDOWN, and COMPANY use similar text rendering */}
            {(el.type === ElementType.TEXT || el.type === ElementType.DROPDOWN || el.type === ElementType.COMPANY) && (
                <div
                style={{
                    fontSize: `${el.fontSize}px`,
                    fontFamily: el.fontFamily,
                    color: el.color,
                    fontWeight: el.fontWeight,
                    fontStyle: el.fontStyle || 'normal', // Apply Italic
                    textAlign: el.textAlign || 'center', // Use defined alignment or default center
                    whiteSpace: 'pre-wrap',
                    minWidth: '50px',
                    lineHeight: '1.2',
                    width: '100%',
                    border: (!readOnly && !el.content && el.type === ElementType.TEXT) ? '1px dashed #ccc' : 'none',
                    userSelect: 'none'
                }}
                >
                {/* Visual cue for Dropdown in Edit Mode */}
                {!readOnly && el.type === ElementType.DROPDOWN && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-blue-500 text-white px-2 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
                        Seçenekli Alan
                    </div>
                )}

                {/* Visual cue for Company in Edit Mode */}
                {!readOnly && el.type === ElementType.COMPANY && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-green-600 text-white px-2 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
                        Firma Alanı
                    </div>
                )}
                
                {el.content ? el.content : (readOnly ? '' : (el.type === ElementType.DROPDOWN ? '{Seçenek}' : (el.type === ElementType.COMPANY ? '{Firma}' : '{Metin}')))}
                </div>
            )}

            {el.type === ElementType.QRCODE && (
                <div style={{ width: '100%', height: '100%' }}>
                    {/* Use Cached QR Data URL */}
                    <img 
                        src={qrCache[`${el.id}-${el.content}-${el.color || '#000000'}`] || ''} 
                        alt="QR Code" 
                        className="w-full h-full object-contain pointer-events-none select-none"
                    />
                    {!readOnly && !el.content && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 text-xs text-black font-bold">
                            BOŞ QR
                        </div>
                    )}
                </div>
            )}

            {el.type === ElementType.SIGNATURE && (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {el.content && el.content.startsWith('data:image') ? (
                     <img 
                     src={el.content} 
                     alt="Signature" 
                     className="pointer-events-none select-none w-full h-full object-contain"
                     />
                  ) : (
                    <div 
                      style={{
                        width: '100%',
                        height: '100%',
                        border: '2px dashed rgba(0,0,0,0.3)',
                        backgroundColor: 'rgba(0,0,0,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: '#666',
                        textAlign: 'center'
                      }}
                    >
                      {readOnly ? '' : 'İMZA ALANI'}
                    </div>
                  )}
                </div>
            )}

            {el.type === ElementType.IMAGE && (
                <img 
                src={el.content} 
                alt="Uploaded Asset" 
                className="pointer-events-none select-none w-full h-full object-contain"
                />
            )}
            </div>
        ))}
        </div>
    </div>
  );
};

export default CanvasEditor;