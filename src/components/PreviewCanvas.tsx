import React, { useEffect, useRef } from 'react';
import type { TrackStats, OverlayConfig, AspectRatioType } from '../types';
import { renderComposition, getAspectRatioValue } from '../utils/canvasRenderer';
import { Smartphone, Square, RectangleVertical, RectangleHorizontal } from 'lucide-react';

interface PreviewCanvasProps {
  image: HTMLImageElement | null;
  track: TrackStats | null;
  config: OverlayConfig;
  onChangeAspectRatio: (ratio: AspectRatioType) => void;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  image,
  track,
  config,
  onChangeAspectRatio,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Redraw canvas whenever track, image, or config changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use a comfortable preview resolution (e.g. 720 width for crisp retina preview)
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
  }, [image, track, config]);

  const ratios: { id: AspectRatioType; label: string; icon: React.ReactNode }[] = [
    { id: '9:16', label: '9:16 Historia', icon: <Smartphone className="w-3.5 h-3.5" /> },
    { id: '4:5', label: '4:5 Retrato', icon: <RectangleVertical className="w-3.5 h-3.5" /> },
    { id: '1:1', label: '1:1 Cuadrado', icon: <Square className="w-3.5 h-3.5" /> },
    { id: '16:9', label: '16:9 Paisaje', icon: <RectangleHorizontal className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-2 sm:p-4 select-none">
      {/* Aspect Ratio Quick Selector Chips */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md mb-3 shadow-lg">
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

      {/* Main Canvas Viewport with Shadow Frame */}
      <div className="relative flex items-center justify-center max-w-full max-h-[75vh] rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-slate-800/80 bg-slate-950/50 transition-all">
        <canvas
          ref={canvasRef}
          className="max-h-[74vh] max-w-full w-auto object-contain block rounded-2xl"
        />

        {/* Floating badge info on top-left of preview */}
        <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-black/60 backdrop-blur-md text-slate-300 border border-white/10 uppercase tracking-wider">
            {config.template.replace('_', ' ')}
          </span>
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-black/60 backdrop-blur-md text-orange-400 border border-white/10">
            {config.aspectRatio}
          </span>
        </div>
      </div>
    </div>
  );
};
