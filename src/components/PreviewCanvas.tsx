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
  Minus
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
  const [dragStart, setDragStart] = useState<{ x: number; y: number; originX: number; originY: number } | null>(null);
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([]);

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
  const getCanvasCoords = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    const { x, y } = getCanvasCoords(e);

    // Hit-test bounding boxes in reverse (top-most elements first)
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
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }
    }

    // Clicked empty area
    setActiveElement(null);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !activeElement || !dragStart || !canvasRef.current) return;

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
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }
  };

  const handleScaleElement = (id: MovableElementId, delta: number) => {
    const current = config.positions[id] || { x: 50, y: 50, scale: 1.0 };
    const newScale = Number(Math.max(0.6, Math.min(2.5, current.scale + delta)).toFixed(2));
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
    <div className="flex flex-col items-center justify-center w-full h-full p-2 select-none">
      {/* Top Bar: Aspect Ratio + Reset Positions */}
      <div className="flex items-center justify-between w-full max-w-xl gap-2 mb-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-lg">
          {ratios.map((r) => {
            const isActive = config.aspectRatio === r.id;
            return (
              <button
                key={r.id}
                onClick={() => onChangeAspectRatio(r.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
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
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold backdrop-blur-md shadow-lg transition active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
          <span className="hidden sm:inline">Restablecer</span>
        </button>
      </div>

      {/* Main Canvas Viewport with Interactive Drag Layer */}
      <div
        ref={containerRef}
        className="relative flex items-center justify-center max-w-full max-h-[75vh] rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-slate-800/80 bg-slate-950/50 cursor-crosshair touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <canvas
          ref={canvasRef}
          className="max-h-[74vh] max-w-full w-auto object-contain block rounded-2xl pointer-events-none"
        />

        {/* Visual Box Indicator for Selected/Active Element */}
        {activeBox && canvasRef.current && (
          <div
            className="absolute pointer-events-none border-2 border-dashed border-orange-400 rounded-xl transition-all shadow-lg shadow-orange-500/20"
            style={{
              left: `${(activeBox.x / canvasRef.current.width) * 100}%`,
              top: `${(activeBox.y / canvasRef.current.height) * 100}%`,
              width: `${(activeBox.width / canvasRef.current.width) * 100}%`,
              height: `${(activeBox.height / canvasRef.current.height) * 100}%`,
            }}
          >
            {/* Element Label Badge */}
            <div className="absolute -top-7 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-orange-500 text-white text-[10px] font-bold shadow-md">
              <Move className="w-3 h-3" />
              <span>{activeBox.label} (Arrastra)</span>
            </div>
          </div>
        )}

        {/* Mini Floating Scale Toolbar for Active Element */}
        {activeElement && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-xl bg-slate-900/95 border border-slate-700/80 backdrop-blur-md shadow-2xl z-20">
            <span className="text-[11px] font-bold text-slate-300 pl-1.5">
              Tamaño:
            </span>
            <button
              onClick={() => handleScaleElement(activeElement, -0.1)}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
              title="Reducir tamaño"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-orange-400 font-bold min-w-8 text-center">
              {Math.round((config.positions[activeElement]?.scale || 1.0) * 100)}%
            </span>
            <button
              onClick={() => handleScaleElement(activeElement, 0.1)}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
              title="Aumentar tamaño"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top-left Info Tags */}
        <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-black/60 backdrop-blur-md text-slate-300 border border-white/10 uppercase tracking-wider">
            {config.template.replace('_', ' ')}
          </span>
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-black/60 backdrop-blur-md text-orange-400 border border-white/10">
            {config.aspectRatio}
          </span>
        </div>
      </div>

      {/* Helpful Hint */}
      <p className="text-[11px] text-slate-400 text-center mt-2 flex items-center justify-center gap-1.5">
        <Move className="w-3 h-3 text-orange-400 inline" />
        <span>Puedes <strong>tocar o arrastrar</strong> el título, track, métricas y perfil directamente en la foto.</span>
      </p>
    </div>
  );
};
