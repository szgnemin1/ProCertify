import React, { useRef, useState, useEffect } from 'react';
import { CanvasElement, ElementType } from '../types';
import { Trash2, Maximize2, List, Check, Move } from 'lucide-react';
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
  const [dragMode, setDragMode] = useState<'main' | 'secondary'>('main');
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Resizing State
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0, fontSize: 0 });

  // QR Code Cache to prevent flickering
  const [qrCache, setQrCache] = useState<Record<string, string>>({});

  // Use refs for event listeners to avoid re-binding and stale closures
  const elementsRef = useRef(elements);
  const draggingIdRef = useRef(draggingId);
  const dragOffsetRef = useRef(dragOffset);
  const dragModeRef = useRef(dragMode);
  const resizingIdRef = useRef(resizingId);
  const resizeStartRef = useRef(resizeStart);
  const scaleRef = useRef(scale);
  const animationFrameRef = useRef<number | null>(null);

  // Sync refs with state/props
  useEffect(() => { elementsRef.current = elements; }, [elements]);
  useEffect(() => { draggingIdRef.current = draggingId; }, [draggingId]);
  useEffect(() => { dragOffsetRef.current = dragOffset; }, [dragOffset]);
  useEffect(() => { dragModeRef.current = dragMode; }, [dragMode]);
  useEffect(() => { resizingIdRef.current = resizingId; }, [resizingId]);
  useEffect(() => { resizeStartRef.current = resizeStart; }, [resizeStart]);
  useEffect(() => { scaleRef.current = scale; }, [scale]);


  // Generate QR Codes - Optimized Dependency & Cleanup
  useEffect(() => {
    let isMounted = true;
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
                    if (isMounted) {
                        newCache[cacheKey] = url;
                        hasChanges = true;
                    }
                } catch (e) {
                    console.error("QR Gen Error", e);
                }
            }
        }
        if (hasChanges && isMounted) setQrCache(newCache);
    };
    
    generateQRs();
    
    return () => { isMounted = false; };
  }, [elements]);


  // --- DRAG HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent, id: string, mode: 'main' | 'secondary' = 'main') => {
    if (readOnly) return;
    e.stopPropagation(); // Prevent canvas deselect
    const element = elements.find(el => el.id === id);
    if (!element || !canvasRef.current) return;

    onSelect(id);
    setDraggingId(id);
    setDragMode(mode);

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (e.clientY - rect.top) / scale;

    if (mode === 'main') {
        setDragOffset({
            x: mouseX - element.x,
            y: mouseY - element.y
        });
    } else {
        // Dragging the secondary box
        setDragOffset({
            x: mouseX - (element.secondaryX || (element.x + 100)),
            y: mouseY - (element.secondaryY || element.y)
        });
    }
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

  // --- GLOBAL MOVE/UP HANDLERS (OPTIMIZED WITH RAF) ---
  useEffect(() => {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (readOnly || !canvasRef.current) return;

        // Cancel previous frame if it exists to ensure we only render the latest
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(() => {
            const currentScale = scaleRef.current;
            const currentElements = elementsRef.current;
            const currentDragId = draggingIdRef.current;
            const currentResizingId = resizingIdRef.current;

            // Handle Dragging
            if (currentDragId) {
                const rect = canvasRef.current?.getBoundingClientRect();
                if (!rect) return;
                
                const mouseX = (e.clientX - rect.left) / currentScale;
                const mouseY = (e.clientY - rect.top) / currentScale;
                
                const currentMode = dragModeRef.current;
                const currentOffset = dragOffsetRef.current;

                if (currentMode === 'main') {
                    const element = currentElements.find(el => el.id === currentDragId);
                    if (element) {
                        const dx = (mouseX - currentOffset.x) - element.x;
                        const dy = (mouseY - currentOffset.y) - element.y;
                        
                        onUpdateElement(currentDragId, { 
                            x: mouseX - currentOffset.x, 
                            y: mouseY - currentOffset.y,
                            secondaryX: (element.secondaryX || (element.x + 100)) + dx,
                            secondaryY: (element.secondaryY || element.y) + dy
                        });
                    }
                } else {
                    onUpdateElement(currentDragId, {
                        secondaryX: mouseX - currentOffset.x,
                        secondaryY: mouseY - currentOffset.y
                    });
                }
                return;
            }

            // Handle Resizing
            if (currentResizingId) {
                const element = currentElements.find(el => el.id === currentResizingId);
                if (!element) return;

                const start = resizeStartRef.current;
                const deltaX = (e.clientX - start.x) / currentScale;
                const deltaY = (e.clientY - start.y) / currentScale;

                const newWidth = Math.max(20, start.w + deltaX);
                const newHeight = Math.max(20, start.h + deltaY);

                const updates: Partial<CanvasElement> = {
                    width: newWidth,
                    height: newHeight
                };

                if (element.type === ElementType.TEXT || element.type === ElementType.DROPDOWN || element.type === ElementType.COMPANY || element.type === ElementType.TCKN) {
                    const ratio = newWidth / start.w;
                    updates.fontSize = Math.max(10, start.fontSize * ratio);
                }

                onUpdateElement(currentResizingId, updates);
            }
        });
    };

    const handleGlobalMouseUp = () => {
        if (draggingIdRef.current || resizingIdRef.current) {
            setDraggingId(null);
            setResizingId(null);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }
    };

    // Only attach/detach based on active drag state
    if (draggingId || resizingId) {
        window.addEventListener('mousemove', handleGlobalMouseMove);
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }
  }, [draggingId, resizingId, onUpdateElement, readOnly]); // Minimized dependency array

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
        {elements.map((el) => {
            // SPECIAL RENDER FOR CHOICE BOX
            if (el.type === ElementType.CHOICE_BOX) {
                const opt1Label = el.options?.[0] || 'Evet';
                const opt2Label = el.options?.[1] || 'Hayır';
                const isOpt1Selected = el.content === opt1Label;
                const secX = el.secondaryX ?? (el.x + 100);
                const secY = el.secondaryY ?? el.y;

                return (
                    <React.Fragment key={el.id}>
                        {/* Option 1 Box (Main) */}
                        <div
                            className={`absolute flex items-center justify-center
                                ${!readOnly ? 'cursor-move group' : ''}
                                ${selectedId === el.id ? 'z-50' : 'z-10'}
                            `}
                            style={{
                                left: el.x,
                                top: el.y,
                                width: el.width,
                                height: el.height,
                                border: (!readOnly || isOpt1Selected) ? `2px solid ${el.color || '#000'}` : 'none',
                                backgroundColor: (!readOnly) ? 'rgba(255,255,255,0.2)' : 'transparent'
                            }}
                            onMouseDown={(e) => handleMouseDown(e, el.id, 'main')}
                        >
                            {/* Visual Feedback for Selected Option */}
                            {isOpt1Selected && <Check size={el.width * 0.8} color={el.color || '#000'} strokeWidth={3} />}
                            
                            {!readOnly && (
                                <div className="absolute -top-6 left-0 bg-amber-500 text-white text-[10px] px-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">
                                    {opt1Label}
                                </div>
                            )}
                            
                            {/* Selection Controls for Main Box */}
                            {!readOnly && selectedId === el.id && (
                                <>
                                    <div className="absolute -inset-2 border-2 border-blue-500 rounded-sm pointer-events-none opacity-50"></div>
                                    <div className="absolute -top-8 right-0 flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); onDeleteElement(el.id); }} className="bg-red-500 text-white p-1 rounded hover:bg-red-600 transition shadow-sm"><Trash2 size={14} /></button>
                                    </div>
                                    {/* Connection Line to Secondary */}
                                    <svg className="absolute top-1/2 left-1/2 overflow-visible pointer-events-none" style={{ width: 0, height: 0 }}>
                                        <line 
                                            x1={0} 
                                            y1={0} 
                                            x2={secX - el.x} 
                                            y2={secY - el.y} 
                                            stroke="blue" 
                                            strokeWidth="1" 
                                            strokeDasharray="4"
                                            opacity="0.5"
                                        />
                                    </svg>
                                </>
                            )}
                        </div>

                        {/* Option 2 Box (Secondary) */}
                        <div
                            className={`absolute flex items-center justify-center
                                ${!readOnly ? 'cursor-move group' : ''}
                                ${selectedId === el.id ? 'z-50' : 'z-10'}
                            `}
                            style={{
                                left: secX,
                                top: secY,
                                width: el.width,
                                height: el.height,
                                border: (!readOnly || !isOpt1Selected) ? `2px solid ${el.color || '#000'}` : 'none',
                                backgroundColor: (!readOnly) ? 'rgba(255,255,255,0.2)' : 'transparent'
                            }}
                            onMouseDown={(e) => handleMouseDown(e, el.id, 'secondary')}
                        >
                             {!isOpt1Selected && <Check size={el.width * 0.8} color={el.color || '#000'} strokeWidth={3} />}
                             
                             {!readOnly && (
                                <div className="absolute -top-6 left-0 bg-slate-500 text-white text-[10px] px-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">
                                    {opt2Label}
                                </div>
                            )}

                             {/* Visual Handle for Secondary when selected */}
                             {!readOnly && selectedId === el.id && (
                                 <div className="absolute -inset-1 border border-blue-400 border-dashed rounded-sm pointer-events-none flex items-center justify-center">
                                     <Move size={12} className="text-blue-500 opacity-50" />
                                 </div>
                             )}
                        </div>
                    </React.Fragment>
                );
            }

            // STANDARD RENDER FOR OTHER ELEMENTS
            return (
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
                height: (el.type === ElementType.TEXT || el.type === ElementType.DROPDOWN || el.type === ElementType.COMPANY || el.type === ElementType.TCKN) ? 'auto' : el.height,
                minHeight: (el.type === ElementType.TEXT || el.type === ElementType.DROPDOWN || el.type === ElementType.COMPANY || el.type === ElementType.TCKN) ? undefined : el.height,
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

            {/* Content Rendering: TEXT, DROPDOWN, COMPANY, and TCKN */}
            {(el.type === ElementType.TEXT || el.type === ElementType.DROPDOWN || el.type === ElementType.COMPANY || el.type === ElementType.TCKN) && (
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

                {/* Visual cue for TCKN in Edit Mode */}
                {!readOnly && el.type === ElementType.TCKN && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-red-600 text-white px-2 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
                        TC Kimlik No (Sansürlü)
                    </div>
                )}
                
                {el.content ? el.content : (readOnly ? '' : (el.type === ElementType.DROPDOWN ? '{Seçenek}' : (el.type === ElementType.COMPANY ? '{Firma}' : (el.type === ElementType.TCKN ? '12*******01' : '{Metin}'))))}
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
            )
        })}
        </div>
    </div>
  );
};

export default CanvasEditor;