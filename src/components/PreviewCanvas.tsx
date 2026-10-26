import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { TrackStats, OverlayConfig, AspectRatioType, MovableElementId, OverlayPositions } from '../types';
import { renderComposition, getAspectRatioValue, getElementBoundingBoxes, type BoundingBox } from '../utils/canvasRenderer';
import { DEFAULT_POSITIONS_BY_TEMPLATE } from '../utils/sampleData';
import { 
  Smartphone, 
  Square, 
  RectangleVertical, 
  RectangleHorizontal, 
  RotateCcw,
  Move,
  Plus,
  Minus,
  Maximize2
} from 'lucide-react';

interface PreviewCanvasProps {
  image: HTMLImageElement | null;
  track: TrackStats | null;
  config: OverlayConfig;
  onChangeAspectRatio: (ratio: AspectRatioType) => void;
  onUpdatePositions: (positions: OverlayPositions) => void;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  image,
  track,
  config,
  onChangeAspectRatio,
  onUpdatePositions,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeElement, setActiveElement] = useState<MovableElementId | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const [pinchScaleDisplay, setPinchScaleDisplay] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; originX: number; originY: number } | null>(null);
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([]);

  // Multi-touch tracking
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartDistance = useRef<number | null>(null);
  const initialScaleOnPinch = useRef<number>(1.0);

  // Update canvas & calculate bounding boxes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const previewWidth = 720;
    const ratio = getAspectRatioValue(
      config.aspectRatio,
      image?.naturalWidth || 720,
      image?.naturalHeight || 1280
    );
    const previewHeight = Math.round(previewWidth / ratio);

    if (canvas.width !== previewWidth || canvas.height !== previewHeight) {
      canvas.width = previewWidth;
      canvas.height = previewHeight;
    }

    renderComposition({
      canvas,
      image,
      track,
      config,
      exportScale: 720 / 1080,
    });

    const boxes = getElementBoundingBoxes(previewWidth, previewHeight, config);
    setBoundingBoxes(boxes);
  }, [image, track, config]);

  // Convert client pointer coordinates to canvas coordinates
  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Register active pointer
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch (2 fingers) -> Initialize Pinch to Scale
    if (activePointers.current.size === 2) {
      const pts = Array.from(activePointers.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      pinchStartDistance.current = dist;

      // Target element to scale: current activeElement, or default to 'track' or 'title'
      const target = activeElement || 'track';
      setActiveElement(target);
      initialScaleOnPinch.current = config.positions[target]?.scale || 1.0;
      setIsPinching(true);
      setIsDragging(false);
      return;
    }

    // Single touch (1 finger) -> Hit-test for drag
    if (activePointers.current.size === 1) {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);

      for (let i = boundingBoxes.length - 1; i >= 0; i--) {
        const b = boundingBoxes[i];
        if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
          setActiveElement(b.id);
          setIsDragging(true);
          const currentPos = config.positions[b.id] || { x: 50, y: 50, scale: 1 };
          setDragStart({
            x: e.clientX,
            y: e.clientY,
            originX: currentPos.x,
            originY: currentPos.y,
          });
          try {
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
          } catch (err) {}
          return;
        }
      }

      // Tapped background
      setActiveElement(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activePointers.current.has(e.pointerId)) return;
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // 1. Handle Two-Finger Pinch-to-Scale
    if (activePointers.current.size >= 2 && pinchStartDistance.current && activeElement) {
      const pts = Array.from(activePointers.current.values());
      const currentDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const ratio = currentDist / pinchStartDistance.current;

      const newScale = Number(Math.max(0.5, Math.min(2.5, initialScaleOnPinch.current * ratio)).toFixed(2));
      setPinchScaleDisplay(Math.round(newScale * 100));

      onUpdatePositions({
        ...config.positions,
        [activeElement]: {
          ...config.positions[activeElement],
          scale: newScale,
        },
      });
      return;
    }

    // 2. Handle Single-Finger Drag
    if (isDragging && activeElement && dragStart && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();

      const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

      const newX = Math.round(Math.max(5, Math.min(95, dragStart.originX + deltaX)));
      const newY = Math.round(Math.max(5, Math.min(95, dragStart.originY + deltaY)));

      onUpdatePositions({
        ...config.positions,
        [activeElement]: {
          ...config.positions[activeElement],
          x: newX,
          y: newY,
        },
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId);

    if (activePointers.current.size < 2) {
      setIsPinching(false);
      pinchStartDistance.current = null;
      setTimeout(() => setPinchScaleDisplay(null), 1000);
    }

    if (activePointers.current.size === 0) {
      setIsDragging(false);
      setDragStart(null);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  const handleScaleElement = (id: MovableElementId, delta: number) => {
    const current = config.positions[id] || { x: 50, y: 50, scale: 1.0 };
    const newScale = Number(Math.max(0.5, Math.min(2.5, current.scale + delta)).toFixed(2));
    onUpdatePositions({
      ...config.positions,
      [id]: {
        ...current,
        scale: newScale,
      },
    });
  };

  const handleResetPositions = () => {
    const defaults = DEFAULT_POSITIONS_BY_TEMPLATE[config.template] || DEFAULT_POSITIONS_BY_TEMPLATE.sport;
    onUpdatePositions(defaults);
    setActiveElement(null);
  };

  const activeBox = boundingBoxes.find((b) => b.id === activeElement);

  const ratios: { id: AspectRatioType; label: string; icon: React.ReactNode }[] = [
    { id: '9:16', label: '9:16 Historia', icon: <Smartphone className="w-3.5 h-3.5" /> },
    { id: '4:5', label: '4:5 Retrato', icon: <RectangleVertical className="w-3.5 h-3.5" /> },
    { id: '1:1', label: '1:1 Cuadrado', icon: <Square className="w-3.5 h-3.5" /> },
    { id: '16:9', label: '16:9 Paisaje', icon: <RectangleHorizontal className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-1 sm:p-2 select-none">
      {/* Top Bar: Quick Aspect Ratio Chips + Reset */}
      <div className="flex items-center justify-between w-full max-w-xl gap-2 mb-2 px-1">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md shadow-sm">
          {ratios.map((r) => {
            const isActive = config.aspectRatio === r.id;
            return (
              <button
                key={r.id}
                onClick={() => onChangeAspectRatio(r.id)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {r.icon}
                <span className="hidden sm:inline">{r.label}</span>
                <span className="sm:hidden">{r.id}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleResetPositions}
          title="Restablecer posición de elementos a la plantilla original"
          className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold backdrop-blur-md shadow-sm transition active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5 text-orange-500" />
          <span className="hidden sm:inline">Restablecer</span>
        </button>
      </div>

      {/* Main Canvas Viewport with Touch Gestures */}
      <div
        ref={containerRef}
        className="relative flex items-center justify-center max-w-full max-h-[60vh] sm:max-h-[72vh] rounded-2xl overflow-hidden shadow-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-100 dark:bg-slate-950/60 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <canvas
          ref={canvasRef}
          className="max-h-[58vh] sm:max-h-[70vh] max-w-full w-auto object-contain block rounded-2xl pointer-events-none"
        />

        {/* Visual Box Indicator for Selected/Active Element */}
        {activeBox && canvasRef.current && (
          <div
            className="absolute pointer-events-none border-2 border-dashed border-orange-500 rounded-xl transition-all shadow-md shadow-orange-500/20"
            style={{
              left: `${(activeBox.x / canvasRef.current.width) * 100}%`,
              top: `${(activeBox.y / canvasRef.current.height) * 100}%`,
              width: `${(activeBox.width / canvasRef.current.width) * 100}%`,
              height: `${(activeBox.height / canvasRef.current.height) * 100}%`,
            }}
          >
            {/* Element Label Badge */}
            <div className="absolute -top-7 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500 text-white text-[10px] font-bold shadow-md">
              <Move className="w-3 h-3" />
              <span>{activeBox.label}</span>
            </div>
          </div>
        )}

        {/* Live Pinch Zoom HUD Badge (Shows when pinching with 2 fingers) */}
        {pinchScaleDisplay !== null && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/85 backdrop-blur-md border border-white/20 text-white shadow-2xl animate-in zoom-in-75 duration-150">
            <Maximize2 className="w-5 h-5 text-orange-400 animate-pulse" />
            <span className="font-extrabold text-lg tracking-wider font-mono">
              {pinchScaleDisplay}%
            </span>
          </div>
        )}

        {/* Mini Floating Scale Toolbar for Active Element */}
        {activeElement && !isPinching && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-300 dark:border-slate-700/80 backdrop-blur-md shadow-xl z-20">
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 pl-1">
              Tamaño:
            </span>
            <button
              onClick={() => handleScaleElement(activeElement, -0.1)}
              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
              title="Reducir"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-orange-500 font-bold min-w-8 text-center">
              {Math.round((config.positions[activeElement]?.scale || 1.0) * 100)}%
            </span>
            <button
              onClick={() => handleScaleElement(activeElement, 0.1)}
              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
              title="Aumentar"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top-left Info Tags */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-black/60 backdrop-blur-md text-white border border-white/10 uppercase tracking-wider">
            {config.template.replace('_', ' ')}
          </span>
          <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded-md bg-black/60 backdrop-blur-md text-orange-400 border border-white/10">
            {config.aspectRatio}
          </span>
        </div>
      </div>

      {/* Helpful Touch Hint */}
      <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-1.5 flex items-center justify-center gap-1">
        <Move className="w-3 h-3 text-orange-500 inline" />
        <span><strong>1 dedo:</strong> mover. <strong>2 dedos (pellizco):</strong> redimensionar.</span>
      </p>
    </div>
  );
};
