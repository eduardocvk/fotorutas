import React, { useRef } from 'react';
import { 
  Camera, 
  Share2, 
  Sparkles, 
  RotateCcw,
  Activity,
  FileCode2
} from 'lucide-react';

interface HeaderProps {
  onLoadTrack: (file: File) => void;
  onLoadPhoto: (file: File) => void;
  onLoadSample: () => void;
  onExport: () => void;
  isExporting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadTrack,
  onLoadPhoto,
  onLoadSample,
  onExport,
  isExporting,
}) => {
  const trackInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleTrackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadTrack(file);
      e.target.value = '';
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadPhoto(file);
      e.target.value = '';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Activity className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Fotorutas
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Overlays para .fit y .gpx en fotos para RRSS
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Hidden inputs */}
          <input
            ref={trackInputRef}
            type="file"
            accept=".gpx,.fit"
            className="hidden"
            onChange={handleTrackChange}
          />
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />

          {/* Sample Route button */}
          <button
            onClick={onLoadSample}
            title="Cargar ruta y foto de ejemplo"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Ejemplo</span>
          </button>

          {/* Load Track button */}
          <button
            onClick={() => trackInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-sm transition active:scale-95"
          >
            <FileCode2 className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden sm:inline">Track</span>
            <span className="text-[10px] text-slate-400 font-mono">.GPX/.FIT</span>
          </button>

          {/* Load Photo button */}
          <button
            onClick={() => photoInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-sm transition active:scale-95"
          >
            <Camera className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Foto</span>
          </button>

          {/* Export / Share Button */}
          <button
            onClick={onExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 transition active:scale-95 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-white" />
                <span>Exportando...</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-white" />
                <span>Guardar / Compartir</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
