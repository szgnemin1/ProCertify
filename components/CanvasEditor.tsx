import React, { useRef, useState, useEffect } from 'react';
import { CanvasElement, ElementType } from '../types';
import { 
  Trash2, 
  Maximize2, 
  List, 
  Check, 
  Move,
  Copy,
  Type,
  Calendar,
  Building,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  PenTool,
  ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Italic,
  Minus,
  Plus,
  Filter,
  Award,
  BoxSelect,
  Shapes,
  Edit3,
  Magnet,
  Grid
} from 'lucide-react';
import QRCode from 'qrcode';
import { FONTS, FONT_WEIGHTS } from '../constants';
import { getBorderSvg, getBadgeSvg } from '../services/vectorPdfService';

export interface ActiveGuide {
  id: string;
  type: 'vertical' | 'horizontal';
  pos: number;
  label?: string;
  isCenter?: boolean;
}

interface SnapLock {
  snapPos: number;
  snappedCoord: number;
  screenOrigin: number;
  guide: ActiveGuide;
}

interface CanvasEditorProps {
  elements: CanvasElement[];
  width: number;
  height: number;
  bgUrl: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement?: (id: string) => void;
  onOpenOptionManager?: () => void;
  onOpenSigPermissions?: () => void;
  scale: number;
  readOnly?: boolean;
  onActionStart?: () => void;
  enableSnapping?: boolean;
  showGrid?: boolean;
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
  onDuplicateElement,
  onOpenOptionManager,
  onOpenSigPermissions,
  scale,
  readOnly = false,
  onActionStart,
  enableSnapping = true,
  showGrid = false
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Canva-Style Smart Snap & Alignment Guidelines State
  const [activeGuides, setActiveGuides] = useState<ActiveGuide[]>([]);
  const enableSnappingRef = useRef(enableSnapping);
  useEffect(() => { enableSnappingRef.current = enableSnapping; }, [enableSnapping]);
  // Hysteresis Magnetic Locks (Prevents rapid flicker and ensures smooth Canva-like snap feel)
  const snapLockXRef = useRef<SnapLock | null>(null);
  const snapLockYRef = useRef<SnapLock | null>(null);
  
  // Dragging State
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<'main' | 'secondary'>('main');
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Resizing State
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0, fontSize: 0 });

  // Direct In-Canvas Text Editing State
  const [editingElementId, setEditingElementId] = useState<string | null>(null);

  // Sync editingElementId with selectedId: reset inline editing if element selection clears
  useEffect(() => {
    if (selectedId !== editingElementId) {
      setEditingElementId(null);
    }
  }, [selectedId]);

  // Drag & Resize Threshold State (prevents jitter on single clicks)
  const dragStartScreenRef = useRef({ x: 0, y: 0 });
  const isDragThresholdPassedRef = useRef(false);
  const resizeStartScreenRef = useRef({ x: 0, y: 0 });
  const isResizeThresholdPassedRef = useRef(false);

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
  const actionStartedRef = useRef(false);

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
    e.preventDefault(); // Prevent text selection or browser ghost dragging
    const element = elements.find(el => el.id === id);
    if (!element || !canvasRef.current) return;

    actionStartedRef.current = false;
    isDragThresholdPassedRef.current = false;
    dragStartScreenRef.current = { x: e.clientX, y: e.clientY };
    snapLockXRef.current = null;
    snapLockYRef.current = null;
    setActiveGuides([]);

    onSelect(id);
    setDraggingId(id);
    setDragMode(mode);

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (e.clientY - rect.top) / scale;

    const offset = mode === 'main'
      ? { x: mouseX - element.x, y: mouseY - element.y }
      : { x: mouseX - (element.secondaryX || (element.x + 100)), y: mouseY - (element.secondaryY || element.y) };

    setDragOffset(offset);
    // Sync refs immediately to eliminate any drag delay or stale coordinates
    draggingIdRef.current = id;
    dragModeRef.current = mode;
    dragOffsetRef.current = offset;
  };

  // --- RESIZE HANDLERS ---
  const handleResizeStart = (e: React.MouseEvent, id: string) => {
    if (readOnly) return;
    e.stopPropagation();
    e.preventDefault();
    
    const element = elements.find(el => el.id === id);
    if (!element) return;

    actionStartedRef.current = false;
    isResizeThresholdPassedRef.current = false;
    resizeStartScreenRef.current = { x: e.clientX, y: e.clientY };

    setResizingId(id);
    const startObj = {
      x: e.clientX,
      y: e.clientY,
      w: element.width,
      h: element.height,
      fontSize: element.fontSize || 20
    };
    setResizeStart(startObj);
    resizingIdRef.current = id;
    resizeStartRef.current = startObj;
  };

  // --- GLOBAL MOVE/UP HANDLERS (OPTIMIZED WITH RAF & DRAG THRESHOLD) ---
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
                // Drag threshold: require at least 3px physical mouse movement before initiating position change
                if (!isDragThresholdPassedRef.current) {
                    const dist = Math.hypot(
                        e.clientX - dragStartScreenRef.current.x,
                        e.clientY - dragStartScreenRef.current.y
                    );
                    if (dist < 3) return;
                    isDragThresholdPassedRef.current = true;
                }

                // Trigger undo snapshot once right before the first position change
                if (!actionStartedRef.current) {
                    actionStartedRef.current = true;
                    onActionStart?.();
                }

                const rect = canvasRef.current?.getBoundingClientRect();
                if (!rect) return;
                
                const mouseX = (e.clientX - rect.left) / currentScale;
                const mouseY = (e.clientY - rect.top) / currentScale;
                
                const currentMode = dragModeRef.current;
                const currentOffset = dragOffsetRef.current;

                if (currentMode === 'main') {
                    const element = currentElements.find(el => el.id === currentDragId);
                    if (element) {
                        let newX = Math.round(mouseX - currentOffset.x);
                        let newY = Math.round(mouseY - currentOffset.y);

                        const detectedGuides: ActiveGuide[] = [];

                        // Canva-Style Smart Alignment & Magnetic Snapping
                        // (Holding Alt key bypasses snapping for freehand placement)
                        if (enableSnappingRef.current && !e.altKey) {
                            // Screen-space thresholds (physical pixels on user's monitor)
                            // This ensures rock-solid, smooth behavior at ANY zoom level (%30 or %200)
                            const SCREEN_SNAP_ACQUIRE = 9;   // Must come within 9 physical pixels to lock
                            const SCREEN_SNAP_BREAKOUT = 18; // Must pull 18 physical pixels away to break lock

                            const elW = element.width || 120;
                            const elH = (element.type === ElementType.TEXT || element.type === ElementType.DROPDOWN || element.type === ElementType.COMPANY || element.type === ElementType.TCKN || element.type === ElementType.DATE)
                                ? (element.fontSize ? Math.round(element.fontSize * 1.3) : (element.height && element.height > 10 ? element.height : 30))
                                : (element.height || 40);

                            const snapCandidates = currentElements.filter(el => 
                                el.id !== currentDragId && 
                                !(el.type === ElementType.BORDER && el.width > width * 0.75) &&
                                (el.width || 0) > 5
                            );

                            let guideX: ActiveGuide | null = null;
                            let guideY: ActiveGuide | null = null;

                            // ==============================================
                            // --- HORIZONTAL (X) MAGNETIC HYSTERESIS LOCK ---
                            // ==============================================
                            if (snapLockXRef.current) {
                                const lock = snapLockXRef.current;
                                const screenDelta = Math.abs(e.clientX - lock.screenOrigin);
                                if (screenDelta < SCREEN_SNAP_BREAKOUT) {
                                    newX = lock.snappedCoord;
                                    guideX = lock.guide;
                                } else {
                                    snapLockXRef.current = null; // Deliberate breakout
                                }
                            }

                            if (!snapLockXRef.current) {
                                let bestScreenDistX = SCREEN_SNAP_ACQUIRE + 1;
                                let candidateCoordX = newX;
                                let candidateGuideX: ActiveGuide | null = null;

                                // 1. Canvas Center X (Top Priority)
                                const canvasCenterX = Math.round(width / 2);
                                const myCenterX = newX + Math.round(elW / 2);
                                const screenDistCenter = Math.abs(myCenterX - canvasCenterX) * currentScale;
                                if (screenDistCenter <= SCREEN_SNAP_ACQUIRE) {
                                    bestScreenDistX = screenDistCenter;
                                    candidateCoordX = Math.round(canvasCenterX - elW / 2);
                                    candidateGuideX = {
                                        id: 'canvas-center-x',
                                        type: 'vertical',
                                        pos: canvasCenterX,
                                        label: `🎯 Tuval Dikey Merkez (${canvasCenterX}px)`,
                                        isCenter: true
                                    };
                                }

                                // 2. Snap to other elements (Center, Left, Right)
                                for (const other of snapCandidates) {
                                    const otherW = other.width || 120;
                                    const otherLeft = other.x;
                                    const otherCenter = Math.round(other.x + otherW / 2);
                                    const otherRight = other.x + otherW;
                                    const otherLabel = other.label || (other.content ? (other.content.length > 15 ? other.content.slice(0, 15) + '…' : other.content) : other.type);

                                    // Center to Center
                                    const dCenterScreen = Math.abs((newX + Math.round(elW / 2)) - otherCenter) * currentScale;
                                    if (dCenterScreen <= SCREEN_SNAP_ACQUIRE && dCenterScreen < bestScreenDistX) {
                                        bestScreenDistX = dCenterScreen;
                                        candidateCoordX = Math.round(otherCenter - elW / 2);
                                        candidateGuideX = {
                                            id: `guide-cx-${other.id}`,
                                            type: 'vertical',
                                            pos: otherCenter,
                                            label: `Orta: ${otherLabel}`,
                                        };
                                    }

                                    // Left to Left
                                    const dLeftScreen = Math.abs(newX - otherLeft) * currentScale;
                                    if (dLeftScreen <= SCREEN_SNAP_ACQUIRE && dLeftScreen < bestScreenDistX) {
                                        bestScreenDistX = dLeftScreen;
                                        candidateCoordX = otherLeft;
                                        candidateGuideX = {
                                            id: `guide-left-${other.id}`,
                                            type: 'vertical',
                                            pos: otherLeft,
                                            label: `Sol Hizalı: ${otherLabel}`,
                                        };
                                    }

                                    // Right to Right
                                    const dRightScreen = Math.abs((newX + elW) - otherRight) * currentScale;
                                    if (dRightScreen <= SCREEN_SNAP_ACQUIRE && dRightScreen < bestScreenDistX) {
                                        bestScreenDistX = dRightScreen;
                                        candidateCoordX = otherRight - elW;
                                        candidateGuideX = {
                                            id: `guide-right-${other.id}`,
                                            type: 'vertical',
                                            pos: otherRight,
                                            label: `Sağ Hizalı: ${otherLabel}`,
                                        };
                                    }
                                }

                                if (candidateGuideX) {
                                    snapLockXRef.current = {
                                        snapPos: candidateGuideX.pos,
                                        snappedCoord: candidateCoordX,
                                        screenOrigin: e.clientX,
                                        guide: candidateGuideX
                                    };
                                    newX = candidateCoordX;
                                    guideX = candidateGuideX;
                                }
                            }

                            if (guideX) {
                                detectedGuides.push(guideX);
                            }

                            // ============================================
                            // --- VERTICAL (Y) MAGNETIC HYSTERESIS LOCK ---
                            // ============================================
                            if (snapLockYRef.current) {
                                const lock = snapLockYRef.current;
                                const screenDelta = Math.abs(e.clientY - lock.screenOrigin);
                                if (screenDelta < SCREEN_SNAP_BREAKOUT) {
                                    newY = lock.snappedCoord;
                                    guideY = lock.guide;
                                } else {
                                    snapLockYRef.current = null; // Deliberate breakout
                                }
                            }

                            if (!snapLockYRef.current) {
                                let bestScreenDistY = SCREEN_SNAP_ACQUIRE + 1;
                                let candidateCoordY = newY;
                                let candidateGuideY: ActiveGuide | null = null;

                                // 1. Canvas Center Y (Top Priority)
                                const canvasCenterY = Math.round(height / 2);
                                const myCenterY = newY + Math.round(elH / 2);
                                const screenDistCenterY = Math.abs(myCenterY - canvasCenterY) * currentScale;
                                if (screenDistCenterY <= SCREEN_SNAP_ACQUIRE) {
                                    bestScreenDistY = screenDistCenterY;
                                    candidateCoordY = Math.round(canvasCenterY - elH / 2);
                                    candidateGuideY = {
                                        id: 'canvas-center-y',
                                        type: 'horizontal',
                                        pos: canvasCenterY,
                                        label: `🎯 Tuval Yatay Merkez (${canvasCenterY}px)`,
                                        isCenter: true
                                    };
                                }

                                // 2. Snap to other elements (Middle, Top, Bottom)
                                for (const other of snapCandidates) {
                                    const otherH = (other.type === ElementType.TEXT || other.type === ElementType.DROPDOWN || other.type === ElementType.COMPANY || other.type === ElementType.TCKN || other.type === ElementType.DATE)
                                        ? (other.fontSize ? Math.round(other.fontSize * 1.3) : (other.height && other.height > 10 ? other.height : 30))
                                        : (other.height || 40);
                                    const otherTop = other.y;
                                    const otherMiddle = Math.round(other.y + otherH / 2);
                                    const otherBottom = other.y + otherH;
                                    const otherLabel = other.label || (other.content ? (other.content.length > 15 ? other.content.slice(0, 15) + '…' : other.content) : other.type);

                                    // Middle to Middle
                                    const dMiddleScreen = Math.abs((newY + Math.round(elH / 2)) - otherMiddle) * currentScale;
                                    if (dMiddleScreen <= SCREEN_SNAP_ACQUIRE && dMiddleScreen < bestScreenDistY) {
                                        bestScreenDistY = dMiddleScreen;
                                        candidateCoordY = Math.round(otherMiddle - elH / 2);
                                        candidateGuideY = {
                                            id: `guide-cy-${other.id}`,
                                            type: 'horizontal',
                                            pos: otherMiddle,
                                            label: `Yatay Orta: ${otherLabel}`,
                                        };
                                    }

                                    // Top to Top
                                    const dTopScreen = Math.abs(newY - otherTop) * currentScale;
                                    if (dTopScreen <= SCREEN_SNAP_ACQUIRE && dTopScreen < bestScreenDistY) {
                                        bestScreenDistY = dTopScreen;
                                        candidateCoordY = otherTop;
                                        candidateGuideY = {
                                            id: `guide-top-${other.id}`,
                                            type: 'horizontal',
                                            pos: otherTop,
                                            label: `Üst Hizalı: ${otherLabel}`,
                                        };
                                    }

                                    // Bottom to Bottom
                                    const dBottomScreen = Math.abs((newY + elH) - otherBottom) * currentScale;
                                    if (dBottomScreen <= SCREEN_SNAP_ACQUIRE && dBottomScreen < bestScreenDistY) {
                                        bestScreenDistY = dBottomScreen;
                                        candidateCoordY = otherBottom - elH;
                                        candidateGuideY = {
                                            id: `guide-bottom-${other.id}`,
                                            type: 'horizontal',
                                            pos: otherBottom,
                                            label: `Alt Hizalı: ${otherLabel}`,
                                        };
                                    }
                                }

                                if (candidateGuideY) {
                                    snapLockYRef.current = {
                                        snapPos: candidateGuideY.pos,
                                        snappedCoord: candidateCoordY,
                                        screenOrigin: e.clientY,
                                        guide: candidateGuideY
                                    };
                                    newY = candidateCoordY;
                                    guideY = candidateGuideY;
                                }
                            }

                            if (guideY) {
                                detectedGuides.push(guideY);
                            }
                        } else {
                            // Snapping disabled or Alt held
                            snapLockXRef.current = null;
                            snapLockYRef.current = null;
                        }

                        setActiveGuides(detectedGuides);

                        const dx = newX - element.x;
                        const dy = newY - element.y;
                        
                        onUpdateElement(currentDragId, { 
                            x: newX, 
                            y: newY,
                            secondaryX: Math.round((element.secondaryX || (element.x + 100)) + dx),
                            secondaryY: Math.round((element.secondaryY || element.y) + dy)
                        });
                    }
                } else {
                    snapLockXRef.current = null;
                    snapLockYRef.current = null;
                    setActiveGuides([]);
                    onUpdateElement(currentDragId, {
                        secondaryX: Math.round(mouseX - currentOffset.x),
                        secondaryY: Math.round(mouseY - currentOffset.y)
                    });
                }
                return;
            }

            // Handle Resizing
            if (currentResizingId) {
                if (!isResizeThresholdPassedRef.current) {
                    const dist = Math.hypot(
                        e.clientX - resizeStartScreenRef.current.x,
                        e.clientY - resizeStartScreenRef.current.y
                    );
                    if (dist < 3) return;
                    isResizeThresholdPassedRef.current = true;
                }

                if (!actionStartedRef.current) {
                    actionStartedRef.current = true;
                    onActionStart?.();
                }

                const element = currentElements.find(el => el.id === currentResizingId);
                if (!element) return;

                const start = resizeStartRef.current;
                const deltaX = (e.clientX - start.x) / currentScale;
                const deltaY = (e.clientY - start.y) / currentScale;

                const newWidth = Math.round(Math.max(20, start.w + deltaX));
                const newHeight = Math.round(Math.max(20, start.h + deltaY));

                const updates: Partial<CanvasElement> = {
                    width: newWidth,
                    height: newHeight
                };

                if (element.type === ElementType.TEXT || element.type === ElementType.DROPDOWN || element.type === ElementType.COMPANY || element.type === ElementType.TCKN || element.type === ElementType.DATE) {
                    const ratio = newWidth / start.w;
                    updates.fontSize = Math.round(Math.max(10, start.fontSize * ratio));
                }

                onUpdateElement(currentResizingId, updates);
            }
        });
    };

    const handleGlobalMouseUp = () => {
        actionStartedRef.current = false;
        isDragThresholdPassedRef.current = false;
        isResizeThresholdPassedRef.current = false;
        snapLockXRef.current = null;
        snapLockYRef.current = null;
        setActiveGuides([]);
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
            snapLockXRef.current = null;
            snapLockYRef.current = null;
            setActiveGuides([]);
        };
    }
  }, [draggingId, resizingId, onUpdateElement, readOnly]); // Minimized dependency array

  // 4. Professional Keyboard Navigation & Shortcuts (Arrow keys, Shift+Arrow, Delete, Duplicate)
  useEffect(() => {
    if (readOnly || !selectedId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT' || activeEl.isContentEditable)) {
        return;
      }

      const el = elements.find(item => item.id === selectedId);
      if (!el) return;

      const step = e.shiftKey ? 10 : 1;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        onActionStart?.();
        onUpdateElement(el.id, { y: Math.max(0, el.y - step) });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onActionStart?.();
        onUpdateElement(el.id, { y: el.y + step });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onActionStart?.();
        onUpdateElement(el.id, { x: Math.max(0, el.x - step) });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onActionStart?.();
        onUpdateElement(el.id, { x: el.x + step });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onActionStart?.();
        onDeleteElement(el.id);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        onDuplicateElement?.(el.id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onSelect(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readOnly, selectedId, elements, onUpdateElement, onDeleteElement, onDuplicateElement, onSelect, onActionStart]);

  const selectedElement = (!readOnly && selectedId) ? elements.find(el => el.id === selectedId) : null;

  // Floating Contextual Toolbar Position Calculation (in screen pixels)
  let toolbarLeft = 0;
  let toolbarTop = 0;
  let isNearTop = false;

  if (selectedElement) {
    const isChoiceBox = selectedElement.type === ElementType.CHOICE_BOX;
    const targetX = selectedElement.x;
    const targetY = selectedElement.y;
    const targetW = selectedElement.width;
    const targetH = isChoiceBox ? selectedElement.height : (
      (selectedElement.type === ElementType.TEXT || selectedElement.type === ElementType.DROPDOWN || selectedElement.type === ElementType.COMPANY || selectedElement.type === ElementType.TCKN || selectedElement.type === ElementType.DATE)
        ? Math.max(24, (selectedElement.fontSize || 30) * 1.25)
        : (selectedElement.height || 50)
    );

    const screenX = targetX * scale;
    const screenY = targetY * scale;
    const screenW = targetW * scale;
    const screenH = targetH * scale;

    isNearTop = screenY < 75;
    toolbarTop = isNearTop ? screenY + screenH + 10 : screenY - 10;

    const canvasWidthPx = width * scale;
    const halfWidth = Math.min(220, canvasWidthPx / 2);
    const rawCenter = screenX + (screenW / 2);
    toolbarLeft = Math.max(halfWidth, Math.min(canvasWidthPx - halfWidth, rawCenter));
  }

  return (
    <div 
        className="relative shadow-2xl flex-shrink-0"
        style={{
            width: Math.round(width * scale),
            height: Math.round(height * scale),
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
            onMouseDown={() => {
                if (!readOnly) {
                    onSelect(null);
                    setEditingElementId(null);
                }
            }}
        >
        {/* Optional Canvas Dot Grid Overlay */}
        {showGrid && (
          <div 
            className="absolute inset-0 pointer-events-none z-0 opacity-25"
            style={{
              backgroundImage: 'radial-gradient(circle, #334155 1.5px, transparent 1.5px)',
              backgroundSize: '24px 24px',
            }}
          />
        )}
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
                                    <div className={`absolute ${el.y < 35 ? 'top-1 right-1' : '-top-7 right-0'} flex gap-1 z-30`}>
                                        <button onClick={(e) => { e.stopPropagation(); onDeleteElement(el.id); }} className="bg-rose-500 hover:bg-rose-600 text-white p-1 rounded shadow-md transition pointer-events-auto" title="Sil (Delete)"><Trash2 size={12} /></button>
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
            const isEditingThis = editingElementId === el.id;

            return (
            <div
            key={el.id}
            className={`absolute flex flex-col justify-center
                ${!readOnly ? (isEditingThis ? 'cursor-text' : 'cursor-move group') : ''}
                ${selectedId === el.id ? 'z-50' : 'z-10'}
            `}
            style={{
                left: el.x,
                top: el.y,
                width: el.width,
                height: (el.type === ElementType.TEXT || el.type === ElementType.DROPDOWN || el.type === ElementType.COMPANY || el.type === ElementType.TCKN || el.type === ElementType.DATE) ? 'auto' : el.height,
                minHeight: (el.type === ElementType.TEXT || el.type === ElementType.DROPDOWN || el.type === ElementType.COMPANY || el.type === ElementType.TCKN || el.type === ElementType.DATE) ? undefined : el.height,
                transform: 'translate(0, 0)', 
                alignItems: el.textAlign === 'left' ? 'flex-start' : (el.textAlign === 'right' ? 'flex-end' : 'center')
            }}
            onMouseDown={(e) => {
                if (isEditingThis) {
                    e.stopPropagation();
                    return;
                }
                handleMouseDown(e, el.id);
            }}
            onDoubleClick={(e) => {
                e.stopPropagation();
                if (!readOnly && (el.type === ElementType.TEXT || el.type === ElementType.COMPANY || el.type === ElementType.TCKN || el.type === ElementType.DATE)) {
                    setEditingElementId(el.id);
                }
            }}
            >
            {/* Selection Border & Resize Handles - Only in Edit Mode */}
            {!readOnly && selectedId === el.id && !isEditingThis && (
                <>
                  {/* Border */}
                  <div className="absolute -inset-1 border-2 border-blue-500 rounded-sm pointer-events-none opacity-80"></div>
                  
                  {/* Delete Button */}
                  <div className={`absolute ${el.y < 35 ? 'top-1 right-1' : '-top-7 right-0'} flex gap-1 z-30`}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteElement(el.id); }}
                        className="bg-rose-500 hover:bg-rose-600 text-white p-1 rounded shadow-md transition pointer-events-auto"
                        title="Seçili Bileşeni Sil (Delete)"
                    >
                        <Trash2 size={12} />
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

            {/* Content Rendering: TEXT, DROPDOWN, COMPANY, TCKN, and DATE */}
            {(el.type === ElementType.TEXT || el.type === ElementType.DROPDOWN || el.type === ElementType.COMPANY || el.type === ElementType.TCKN || el.type === ElementType.DATE) && (
                isEditingThis ? (
                    <div className="relative w-full z-50" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                        <textarea
                            autoFocus
                            value={el.content || ''}
                            placeholder="Metin yazın..."
                            onChange={(e) => onUpdateElement(el.id, { content: e.target.value })}
                            onBlur={() => setEditingElementId(null)}
                            onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Escape') {
                                    setEditingElementId(null);
                                }
                            }}
                            rows={Math.max(1, (el.content || '').split('\n').length)}
                            style={{
                                fontSize: `${el.fontSize}px`,
                                fontFamily: el.fontFamily,
                                color: el.color || '#000000',
                                fontWeight: el.fontWeight || 400,
                                fontStyle: el.fontStyle || 'normal',
                                textAlign: el.textAlign || 'center',
                                lineHeight: '1.2',
                                width: '100%',
                                minWidth: '160px',
                                background: 'rgba(255, 255, 255, 0.95)',
                                border: '2px solid #f59e0b',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                outline: 'none',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                                resize: 'both'
                            }}
                        />
                        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-amber-500 text-[10px] text-slate-950 font-bold px-2 py-0.5 rounded shadow whitespace-nowrap pointer-events-none">
                            Yazmayı bitirmek için dışarı tıklayın veya Esc'ye basın
                        </div>
                    </div>
                ) : (
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
                    title={!readOnly ? "Yazıyı düzenlemek için çift tıklayın" : undefined}
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

                    {/* Visual cue for DATE in Edit Mode */}
                    {!readOnly && el.type === ElementType.DATE && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-amber-500 text-slate-950 font-bold px-2 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition shadow-md">
                            {el.dateKind === 'validity' ? '⌛ Geçerlilik Tarihi (Hesaplanan)' : '📅 Başlangıç / Eğitim Tarihi'}
                        </div>
                    )}
                    
                    {el.content ? el.content : (readOnly ? '' : (el.type === ElementType.DROPDOWN ? '{Seçenek}' : (el.type === ElementType.COMPANY ? '{Firma}' : (el.type === ElementType.TCKN ? '12*******01' : (el.type === ElementType.DATE ? '{Tarih}' : 'Metin Yazısı')))))}
                    </div>
                )
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

            {el.type === ElementType.BORDER && (
                <div 
                  className="w-full h-full pointer-events-none select-none overflow-hidden"
                  dangerouslySetInnerHTML={{ 
                    __html: getBorderSvg(el.borderStyle || 'classic_gold', el.width, el.height, el.borderColor || '#d97706') 
                  }}
                />
            )}

            {el.type === ElementType.BADGE && (
                <div 
                  className="w-full h-full pointer-events-none select-none flex items-center justify-center overflow-hidden"
                  dangerouslySetInnerHTML={{ 
                    __html: getBadgeSvg(el.badgeStyle || 'isg_approved', el.width, el.color || el.borderColor || '#d97706') 
                  }}
                />
            )}

            {el.type === ElementType.SHAPE && (
                <div className="w-full h-full pointer-events-none select-none flex items-center justify-center">
                  {(el.shapeType === 'line' || el.shapeType === 'divider') ? (
                    <div 
                      style={{ 
                        width: '100%', 
                        height: `${el.borderWidth || 2}px`, 
                        backgroundColor: el.borderColor || '#d97706' 
                      }} 
                    />
                  ) : el.shapeType === 'circle' ? (
                    <div 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        borderRadius: '50%', 
                        backgroundColor: el.fillColor || '#ffffff', 
                        border: `${el.borderWidth || 2}px solid ${el.borderColor || '#d97706'}` 
                      }} 
                    />
                  ) : (
                    <div 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        borderRadius: '6px', 
                        backgroundColor: el.fillColor || '#ffffff', 
                        border: `${el.borderWidth || 2}px solid ${el.borderColor || '#d97706'}` 
                      }} 
                    />
                  )}
                </div>
            )}
            </div>
            )
        })}
        </div>

        {/* ========================================================================= */}
        {/* HUD OVERLAY: ROCK-SOLID CANVA-STYLE ALIGNMENT GUIDELINES                  */}
        {/* Rendered at true screen resolution (solid 2px line, crisp 11px font badge) */}
        {/* ========================================================================= */}
        {!readOnly && activeGuides.map((guide) => {
          if (guide.type === 'vertical') {
            const screenX = Math.round(guide.pos * scale);
            const totalWidthPx = Math.round(width * scale);
            const badgeScreenX = Math.max(75, Math.min(totalWidthPx - 75, screenX));
            return (
              <div
                key={guide.id}
                className="absolute top-0 bottom-0 pointer-events-none z-40"
                style={{ left: screenX }}
              >
                {/* 2px Solid Glowing Vertical Line */}
                <div 
                  className={`h-full ${
                    guide.isCenter 
                      ? 'w-[2px] bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)]' 
                      : 'w-[2px] bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,1)]'
                  }`}
                  style={{ transform: 'translateX(-50%)' }}
                />
                {/* Crystal-Clear Unscaled Badge */}
                {guide.label && (
                  <div 
                    className={`absolute top-2 whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-bold tracking-tight shadow-2xl border flex items-center gap-1.5 select-none ${
                      guide.isCenter
                        ? 'bg-slate-950 text-cyan-300 border-cyan-400/90 shadow-cyan-500/30'
                        : 'bg-slate-950 text-fuchsia-200 border-fuchsia-400/90 shadow-fuchsia-500/30'
                    }`}
                    style={{ 
                      left: badgeScreenX - screenX, 
                      transform: 'translateX(-50%)' 
                    }}
                  >
                    <span 
                      className="w-2 h-2 rounded-full ring-2 ring-white/40" 
                      style={{ backgroundColor: guide.isCenter ? '#22d3ee' : '#e879f9' }} 
                    />
                    <span>{guide.label}</span>
                  </div>
                )}
              </div>
            );
          } else {
            const screenY = Math.round(guide.pos * scale);
            const totalHeightPx = Math.round(height * scale);
            const badgeScreenY = Math.max(25, Math.min(totalHeightPx - 25, screenY));
            return (
              <div
                key={guide.id}
                className="absolute left-0 right-0 pointer-events-none z-40"
                style={{ top: screenY }}
              >
                {/* 2px Solid Glowing Horizontal Line */}
                <div 
                  className={`w-full ${
                    guide.isCenter 
                      ? 'h-[2px] bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)]' 
                      : 'h-[2px] bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,1)]'
                  }`}
                  style={{ transform: 'translateY(-50%)' }}
                />
                {/* Crystal-Clear Unscaled Badge */}
                {guide.label && (
                  <div 
                    className={`absolute left-2 whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-bold tracking-tight shadow-2xl border flex items-center gap-1.5 select-none ${
                      guide.isCenter
                        ? 'bg-slate-950 text-cyan-300 border-cyan-400/90 shadow-cyan-500/30'
                        : 'bg-slate-950 text-fuchsia-200 border-fuchsia-400/90 shadow-fuchsia-500/30'
                    }`}
                    style={{ 
                      top: badgeScreenY - screenY, 
                      transform: 'translateY(-50%)' 
                    }}
                  >
                    <span 
                      className="w-2 h-2 rounded-full ring-2 ring-white/40" 
                      style={{ backgroundColor: guide.isCenter ? '#22d3ee' : '#e879f9' }} 
                    />
                    <span>{guide.label}</span>
                  </div>
                )}
              </div>
            );
          }
        })}

        {/* ========================================================================= */}
        {/* FLOATING CONTEXTUAL TOOLBAR (Renders directly above selected element)       */}
        {/* ========================================================================= */}
        {!readOnly && selectedElement && (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className={`absolute z-50 flex items-center gap-1.5 p-1.5 bg-slate-900/95 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.65)] ring-1 ring-slate-800 text-white text-xs select-none transition-all duration-150 max-w-[95vw] overflow-x-auto no-scrollbar ${
              draggingId ? 'opacity-30 pointer-events-none' : 'opacity-100'
            }`}
            style={{
              left: toolbarLeft,
              top: toolbarTop,
              transform: isNearTop ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            }}
          >
            {/* Visual Pointer / Triangle */}
            <div 
              className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-slate-700/90 rotate-45 pointer-events-none ${
                isNearTop 
                  ? '-top-1.5 border-t border-l' 
                  : '-bottom-1.5 border-b border-r'
              }`}
            />

            {/* Type Badge */}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase shrink-0 flex items-center gap-1 shadow-sm">
              {selectedElement.type === ElementType.TEXT && <Type size={11} />}
              {selectedElement.type === ElementType.DATE && <Calendar size={11} />}
              {selectedElement.type === ElementType.COMPANY && <Building size={11} />}
              {selectedElement.type === ElementType.TCKN && <ShieldCheck size={11} />}
              {selectedElement.type === ElementType.DROPDOWN && <List size={11} />}
              {selectedElement.type === ElementType.CHOICE_BOX && <CheckCircle2 size={11} />}
              {selectedElement.type === ElementType.QRCODE && <QrCode size={11} />}
              {selectedElement.type === ElementType.SIGNATURE && <PenTool size={11} />}
              {selectedElement.type === ElementType.IMAGE && <ImageIcon size={11} />}
              {selectedElement.type === ElementType.BORDER && <BoxSelect size={11} />}
              {selectedElement.type === ElementType.BADGE && <Award size={11} />}
              {selectedElement.type === ElementType.SHAPE && <Shapes size={11} />}
              <span>
                {selectedElement.type === ElementType.COMPANY ? 'FİRMA' : 
                 selectedElement.type === ElementType.CHOICE_BOX ? 'SEÇİM' : 
                 selectedElement.type === ElementType.DATE ? 'TARİH' : 
                 selectedElement.type === ElementType.TCKN ? 'TC NO' : 
                 selectedElement.type === ElementType.SIGNATURE ? 'İMZA' : 
                 selectedElement.type === ElementType.QRCODE ? 'QR' : 
                 selectedElement.type === ElementType.IMAGE ? 'RESİM' : 
                 selectedElement.type === ElementType.BORDER ? 'ÇERÇEVE' : 
                 selectedElement.type === ElementType.BADGE ? 'MÜHÜR' : 
                 selectedElement.type === ElementType.SHAPE ? 'ŞEKİL' : 
                 selectedElement.type === ElementType.DROPDOWN ? 'LİSTE' : 'METİN'}
              </span>
            </span>

            {/* Label / Name Input */}
            <input 
              value={selectedElement.label || ''} 
              onChange={(e) => onUpdateElement(selectedElement.id, { label: e.target.value })} 
              className="bg-slate-950 border border-slate-750 focus:border-amber-500 rounded-lg px-2 py-1 text-xs text-white w-20 sm:w-24 outline-none font-medium shrink-0 placeholder-slate-500" 
              placeholder="Etiket" 
              title="Bileşen Etiketi / Adı (Örn: Başlık, Ad Soyad)" 
            />

            {/* Direct Text / Content Editor for TEXT */}
            {selectedElement.type === ElementType.TEXT && (
              <>
                <div className="flex items-center gap-1.5 bg-slate-950 border border-amber-500/60 focus-within:border-amber-400 rounded-lg px-2.5 py-1 shrink-0 shadow-inner">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                    <Type size={11} /> Yazı:
                  </span>
                  <input 
                    type="text"
                    value={selectedElement.content || ''} 
                    onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })} 
                    className="bg-transparent border-none text-xs text-white outline-none w-36 sm:w-60 font-semibold placeholder-slate-500" 
                    placeholder="Sertifika metnini yazın..." 
                    title="Sertifika üzerinde görüntülenecek metin" 
                    autoFocus
                  />
                </div>

                {/* Direct On-Canvas Edit Trigger Button */}
                <button
                  type="button"
                  onClick={() => setEditingElementId(selectedElement.id)}
                  className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-semibold shrink-0 transition"
                  title="Sertifika üzerinde doğrudan yazma moduna geç"
                >
                  <Edit3 size={11} />
                  <span>Doğrudan Yaz</span>
                </button>

                {/* Quick Dynamic Variable Chips */}
                <div className="hidden xl:flex items-center gap-1 shrink-0">
                  <button 
                    type="button" 
                    onClick={() => onUpdateElement(selectedElement.id, { content: (selectedElement.content ? selectedElement.content + ' ' : '') + '{Ad Soyad}' })} 
                    className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition whitespace-nowrap"
                    title="{Ad Soyad} değişkeni ekle"
                  >
                    + Ad Soyad
                  </button>
                  <button 
                    type="button" 
                    onClick={() => onUpdateElement(selectedElement.id, { content: (selectedElement.content ? selectedElement.content + ' ' : '') + '{TCKN}' })} 
                    className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition whitespace-nowrap"
                    title="{TCKN} değişkeni ekle"
                  >
                    + TC No
                  </button>
                  <button 
                    type="button" 
                    onClick={() => onUpdateElement(selectedElement.id, { content: (selectedElement.content ? selectedElement.content + ' ' : '') + '{Firma}' })} 
                    className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition whitespace-nowrap"
                    title="{Firma} değişkeni ekle"
                  >
                    + Firma
                  </button>
                  <button 
                    type="button" 
                    onClick={() => onUpdateElement(selectedElement.id, { content: (selectedElement.content ? selectedElement.content + ' ' : '') + '{Tarih}' })} 
                    className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition whitespace-nowrap"
                    title="{Tarih} değişkeni ekle"
                  >
                    + Tarih
                  </button>
                </div>
              </>
            )}

            {/* Direct Content Editor for QRCODE */}
            {selectedElement.type === ElementType.QRCODE && (
              <div className="flex items-center gap-1.5 bg-slate-950 border border-sky-500/50 focus-within:border-sky-400 rounded-lg px-2.5 py-1 shrink-0 shadow-inner">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <QrCode size={11} /> Link:
                </span>
                <input 
                  type="text"
                  value={selectedElement.content || ''} 
                  onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })} 
                  className="bg-transparent border-none text-xs text-white outline-none w-44 sm:w-60 font-mono placeholder-slate-500" 
                  placeholder="https://... veya {Sistem URL}?id={Seri No}" 
                  title="QR Koda gömülecek link" 
                />
              </div>
            )}

            {/* Direct Content Editor for COMPANY and TCKN */}
            {(selectedElement.type === ElementType.COMPANY || selectedElement.type === ElementType.TCKN) && (
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-750 focus-within:border-amber-400 rounded-lg px-2 py-1 shrink-0">
                <span className="text-[10px] text-slate-400 shrink-0">Değer:</span>
                <input 
                  type="text"
                  value={selectedElement.content || ''} 
                  onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })} 
                  className="bg-transparent border-none text-xs text-white outline-none w-28 sm:w-36 placeholder-slate-500" 
                  placeholder="Varsayılan değer..." 
                />
              </div>
            )}

            {/* Direct Content Editor for DATE */}
            {selectedElement.type === ElementType.DATE && (
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-750 focus-within:border-amber-400 rounded-lg px-2 py-1 shrink-0">
                <span className="text-[10px] text-amber-400 shrink-0 font-bold">Şablon / Tarih:</span>
                <input 
                  type="text"
                  value={selectedElement.content || ''} 
                  onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })} 
                  className="bg-transparent border-none text-xs text-white outline-none w-32 sm:w-48 font-mono placeholder-slate-500" 
                  placeholder="{Eğitim Tarihi} veya (12.13/11/2026)" 
                  title="Sertifikada görünecek tarih değeri veya şablonu" 
                />
              </div>
            )}

            {/* Typography Controls */}
            {(selectedElement.type === ElementType.TEXT || 
              selectedElement.type === ElementType.DROPDOWN || 
              selectedElement.type === ElementType.COMPANY || 
              selectedElement.type === ElementType.TCKN || 
              selectedElement.type === ElementType.DATE) && (
              <>
                <div className="w-[1px] h-5 bg-slate-750 shrink-0"></div>

                {/* Font Family */}
                <select 
                  value={selectedElement.fontFamily} 
                  onChange={(e) => onUpdateElement(selectedElement.id, { fontFamily: e.target.value })} 
                  className="bg-slate-950 border border-slate-750 rounded-lg px-2 py-1 text-xs text-white w-28 shrink-0 outline-none focus:border-amber-500 cursor-pointer"
                  title="Yazı Tipi"
                >
                  {FONTS.map(group => (
                    <optgroup key={group.group} label={group.group}>
                      {group.options.map(f => (
                        <option key={f.value} value={f.value}>{f.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                {/* Font Weight */}
                <select 
                  value={selectedElement.fontWeight || 400} 
                  onChange={(e) => onUpdateElement(selectedElement.id, { fontWeight: Number(e.target.value) })} 
                  className="bg-slate-950 border border-slate-750 rounded-lg px-1.5 py-1 text-xs text-white w-20 shrink-0 outline-none focus:border-amber-500 cursor-pointer"
                  title="Yazı Kalınlığı"
                >
                  {FONT_WEIGHTS.map(w => (
                    <option key={w.value} value={w.value}>{w.name}</option>
                  ))}
                </select>

                {/* Font Size with Minus/Plus */}
                <div className="flex items-center bg-slate-950 border border-slate-750 rounded-lg p-0.5 shrink-0" title="Font Boyutu (px)">
                  <button 
                    onClick={() => onUpdateElement(selectedElement.id, { fontSize: Math.max(8, (selectedElement.fontSize || 30) - 2) })} 
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Küçült (-2px)"
                  >
                    <Minus size={11} />
                  </button>
                  <input 
                    type="number" 
                    value={Math.round(selectedElement.fontSize || 0)} 
                    onChange={(e) => onUpdateElement(selectedElement.id, { fontSize: Number(e.target.value) })} 
                    className="w-10 bg-transparent text-xs text-white text-center outline-none font-mono" 
                  />
                  <button 
                    onClick={() => onUpdateElement(selectedElement.id, { fontSize: (selectedElement.fontSize || 30) + 2 })} 
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Büyüt (+2px)"
                  >
                    <Plus size={11} />
                  </button>
                </div>

                {/* Alignment */}
                <div className="flex items-center bg-slate-950 rounded-lg border border-slate-750 p-0.5 shrink-0">
                  <button 
                    onClick={() => onUpdateElement(selectedElement.id, { textAlign: 'left' })} 
                    className={`p-1 rounded ${selectedElement.textAlign === 'left' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`} 
                    title="Sola Hizala"
                  >
                    <AlignLeft size={13} />
                  </button>
                  <button 
                    onClick={() => onUpdateElement(selectedElement.id, { textAlign: 'center' })} 
                    className={`p-1 rounded ${(!selectedElement.textAlign || selectedElement.textAlign === 'center') ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`} 
                    title="Ortala"
                  >
                    <AlignCenter size={13} />
                  </button>
                  <button 
                    onClick={() => onUpdateElement(selectedElement.id, { textAlign: 'right' })} 
                    className={`p-1 rounded ${selectedElement.textAlign === 'right' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`} 
                    title="Sağa Hizala"
                  >
                    <AlignRight size={13} />
                  </button>
                </div>

                {/* Italic */}
                <button 
                  onClick={() => onUpdateElement(selectedElement.id, { fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' })} 
                  className={`p-1.5 rounded-lg border text-xs flex items-center justify-center shrink-0 ${
                    selectedElement.fontStyle === 'italic' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-950 border-slate-750 text-slate-300 hover:text-white'
                  }`} 
                  title="İtalik"
                >
                  <Italic size={13} />
                </button>

                {/* Color Picker */}
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-750 rounded-lg px-2 py-1 shrink-0" title="Yazı Rengi">
                  <input 
                    type="color" 
                    value={selectedElement.color || '#000000'} 
                    onChange={(e) => onUpdateElement(selectedElement.id, { color: e.target.value })} 
                    className="w-4 h-4 rounded cursor-pointer border-none bg-transparent" 
                  />
                  <span className="text-[10px] font-mono text-slate-400 uppercase">{selectedElement.color || '#000000'}</span>
                </div>
              </>
            )}

            {/* Date Role Dropdown */}
            {selectedElement.type === ElementType.DATE && (
              <select 
                value={selectedElement.dateKind || 'training'} 
                onChange={(e) => onUpdateElement(selectedElement.id, { dateKind: e.target.value as any })}
                className="bg-slate-950 border border-slate-750 rounded-lg px-2 py-1 text-xs text-amber-400 outline-none shrink-0 cursor-pointer"
                title="İSG Geçerlilik Rolü"
              >
                <option value="training">📅 Başlangıç Tarihi</option>
                <option value="validity">⌛ Geçerlilik Tarihi</option>
              </select>
            )}

            {/* Dropdown Options Button */}
            {selectedElement.type === ElementType.DROPDOWN && (
              <button 
                onClick={onOpenOptionManager} 
                className="flex items-center gap-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition"
              >
                <List size={13} /> Seçenekler ({selectedElement.options?.length || 0})
              </button>
            )}

            {/* Choice Box Default */}
            {selectedElement.type === ElementType.CHOICE_BOX && selectedElement.options && (
              <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-750 shrink-0">
                <span className="text-[10px] text-slate-400">Varsayılan:</span>
                <select 
                  value={selectedElement.content} 
                  onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })} 
                  className="bg-slate-800 border border-slate-600 rounded px-1.5 py-0.5 text-xs text-white outline-none"
                >
                  {selectedElement.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            )}

            {/* Signature Permissions */}
            {selectedElement.type === ElementType.SIGNATURE && (
              <button 
                onClick={onOpenSigPermissions} 
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 px-2.5 py-1 rounded-lg text-xs text-white border border-slate-700 shrink-0 transition"
              >
                <Filter size={13} /> İmza İzinleri ({selectedElement.allowedSignatureIds?.length || 'Tümü'})
              </button>
            )}

            {/* BORDER CONTROLS */}
            {selectedElement.type === ElementType.BORDER && (
              <>
                <div className="w-[1px] h-5 bg-slate-750 shrink-0"></div>
                <select 
                  value={selectedElement.borderStyle || 'classic_gold'} 
                  onChange={(e) => onUpdateElement(selectedElement.id, { borderStyle: e.target.value as any })}
                  className="bg-slate-950 border border-slate-750 rounded-lg px-2 py-1 text-xs text-amber-400 outline-none shrink-0 cursor-pointer"
                  title="Çerçeve Deseni"
                >
                  <option value="tricolor_lines">🎨 Çankaya 3 İnce Çizgi</option>
                  <option value="classic_gold">🏆 Klasik Altın Varak</option>
                  <option value="modern_double">✨ Modern Çift Çizgi</option>
                  <option value="geometric_isg">🛡️ Geometrik İSG</option>
                  <option value="corner_ornament">⚜️ Köşe Motifli</option>
                </select>

                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-750 rounded-lg px-2 py-1 shrink-0" title="Çerçeve Rengi">
                  <input 
                    type="color" 
                    value={selectedElement.borderColor || '#d97706'} 
                    onChange={(e) => onUpdateElement(selectedElement.id, { borderColor: e.target.value })} 
                    className="w-4 h-4 rounded cursor-pointer border-none bg-transparent" 
                  />
                  <span className="text-[10px] font-mono text-slate-400 uppercase">{selectedElement.borderColor || '#d97706'}</span>
                </div>
              </>
            )}

            {/* BADGE CONTROLS */}
            {selectedElement.type === ElementType.BADGE && (
              <>
                <div className="w-[1px] h-5 bg-slate-750 shrink-0"></div>
                <select 
                  value={selectedElement.badgeStyle || 'isg_approved'} 
                  onChange={(e) => onUpdateElement(selectedElement.id, { badgeStyle: e.target.value as any })}
                  className="bg-slate-950 border border-slate-750 rounded-lg px-2 py-1 text-xs text-amber-400 outline-none shrink-0 cursor-pointer"
                  title="Mühür / Rozet Deseni"
                >
                  <option value="isg_approved">🛡️ İSG Onaylı Damga</option>
                  <option value="achievement_star">⭐ Başarı Rozeti & Kurdele</option>
                  <option value="gold_seal">🎖️ Altın Kabartma Mühür</option>
                </select>

                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-750 rounded-lg px-2 py-1 shrink-0" title="Mühür Rengi">
                  <input 
                    type="color" 
                    value={selectedElement.borderColor || selectedElement.color || '#d97706'} 
                    onChange={(e) => onUpdateElement(selectedElement.id, { borderColor: e.target.value, color: e.target.value })} 
                    className="w-4 h-4 rounded cursor-pointer border-none bg-transparent" 
                  />
                  <span className="text-[10px] font-mono text-slate-400 uppercase">{selectedElement.borderColor || selectedElement.color || '#d97706'}</span>
                </div>
              </>
            )}

            {/* SHAPE CONTROLS */}
            {selectedElement.type === ElementType.SHAPE && (
              <>
                <div className="w-[1px] h-5 bg-slate-750 shrink-0"></div>
                <select 
                  value={selectedElement.shapeType || 'rectangle'} 
                  onChange={(e) => onUpdateElement(selectedElement.id, { shapeType: e.target.value as any })}
                  className="bg-slate-950 border border-slate-750 rounded-lg px-2 py-1 text-xs text-indigo-300 outline-none shrink-0 cursor-pointer"
                  title="Şekil Türü"
                >
                  <option value="rectangle">⬛ Dikdörtgen Kutu</option>
                  <option value="line">➖ Düz Çizgi</option>
                  <option value="divider">〰️ Ayraç</option>
                  <option value="circle">⚪ Daire</option>
                </select>

                {selectedElement.shapeType !== 'line' && selectedElement.shapeType !== 'divider' && (
                  <div className="flex items-center gap-1 bg-slate-950 border border-slate-750 rounded-lg px-2 py-1 shrink-0" title="Dolgu Rengi">
                    <span className="text-[10px] text-slate-400">Dolgu:</span>
                    <input 
                      type="color" 
                      value={selectedElement.fillColor || '#ffffff'} 
                      onChange={(e) => onUpdateElement(selectedElement.id, { fillColor: e.target.value })} 
                      className="w-4 h-4 rounded cursor-pointer border-none bg-transparent" 
                    />
                  </div>
                )}

                <div className="flex items-center gap-1 bg-slate-950 border border-slate-750 rounded-lg px-2 py-1 shrink-0" title="Kenarlık Rengi">
                  <span className="text-[10px] text-slate-400">Kenar:</span>
                  <input 
                    type="color" 
                    value={selectedElement.borderColor || '#d97706'} 
                    onChange={(e) => onUpdateElement(selectedElement.id, { borderColor: e.target.value })} 
                    className="w-4 h-4 rounded cursor-pointer border-none bg-transparent" 
                  />
                </div>

                <select 
                  value={selectedElement.borderWidth || 2} 
                  onChange={(e) => onUpdateElement(selectedElement.id, { borderWidth: Number(e.target.value) })}
                  className="bg-slate-950 border border-slate-750 rounded-lg px-2 py-1 text-xs text-white outline-none shrink-0 cursor-pointer"
                  title="Kenarlık Kalınlığı"
                >
                  <option value="1">1 px</option>
                  <option value="2">2 px</option>
                  <option value="3">3 px</option>
                  <option value="4">4 px</option>
                  <option value="6">6 px</option>
                </select>
              </>
            )}

            {/* Quick Canvas Alignment Tools */}
            <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-750 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onActionStart?.();
                  onUpdateElement(selectedElement.id, { x: Math.round((width - selectedElement.width) / 2) });
                }}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition text-[10px]"
                title="Sayfa Yatay Merkezine Hizala (X)"
              >
                <AlignCenter size={13} />
              </button>
              <button
                type="button"
                onClick={() => {
                  onActionStart?.();
                  const elH = (selectedElement.type === ElementType.TEXT || selectedElement.type === ElementType.DROPDOWN || selectedElement.type === ElementType.COMPANY || selectedElement.type === ElementType.TCKN || selectedElement.type === ElementType.DATE)
                    ? (selectedElement.fontSize ? Math.round(selectedElement.fontSize * 1.3) : (selectedElement.height && selectedElement.height > 10 ? selectedElement.height : 30))
                    : (selectedElement.height || 40);
                  onUpdateElement(selectedElement.id, { y: Math.round((height - elH) / 2) });
                }}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition text-[10px]"
                title="Sayfa Dikey Merkezine Hizala (Y)"
              >
                <div className="flex flex-col items-center justify-center w-3.5 h-3.5">
                  <div className="w-2.5 h-[1.5px] bg-current" />
                  <div className="w-1.5 h-1 border-x border-current my-0.5" />
                  <div className="w-2.5 h-[1.5px] bg-current" />
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  onActionStart?.();
                  onUpdateElement(selectedElement.id, { x: 50 });
                }}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition text-[10px]"
                title="Sola Hizala (Kenar 50px)"
              >
                <AlignLeft size={13} />
              </button>
              <button
                type="button"
                onClick={() => {
                  onActionStart?.();
                  onUpdateElement(selectedElement.id, { x: width - selectedElement.width - 50 });
                }}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition text-[10px]"
                title="Sağa Hizala (Kenar 50px)"
              >
                <AlignRight size={13} />
              </button>
            </div>

            {/* Divider */}
            <div className="w-[1px] h-5 bg-slate-750 shrink-0"></div>

            {/* Duplicate Button */}
            {onDuplicateElement && (
              <button 
                onClick={() => onDuplicateElement(selectedElement.id)}
                className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-750 shrink-0 transition"
                title="Bileşeni Çoğalt (Ctrl+D)"
              >
                <Copy size={13} />
              </button>
            )}

            {/* Delete Button */}
            <button 
              onClick={() => onDeleteElement(selectedElement.id)}
              className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 shrink-0 transition"
              title="Seçili Bileşeni Sil (Delete)"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
    </div>
  );
};

export default CanvasEditor;