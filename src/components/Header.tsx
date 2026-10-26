import React, { useRef } from 'react';
import { 
  Camera, 
  Share2, 
  Sparkles, 
  RotateCcw,
  Activity,
  FileCode2,
  Compass,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';

interface HeaderProps {
  onLoadTrack: (file: File) => void;
  onLoadPhoto: (file: File) => void;
  onLoadSample: () => void;
  onOpenGarminModal: () => void;
  onExport: () => void;
  isExporting: boolean;
  theme: 'system' | 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadTrack,
  onLoadPhoto,
  onLoadSample,
  onOpenGarminModal,
  onExport,
  isExporting,
  theme,
  onToggleTheme,
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/85 backdrop-blur-md px-3 sm:px-4 py-2 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                Fotorutas
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                PRO
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 hidden md:block">
              Overlays para .fit y .gpx en fotos para RRSS
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
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

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            title={`Tema: ${theme === 'dark' ? 'Oscuro' : theme === 'light' ? 'Claro' : 'Automático del móvil'}`}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition active:scale-95"
          >
            {theme === 'dark' ? (
              <Moon className="w-3.5 h-3.5 text-amber-400" />
            ) : theme === 'light' ? (
              <Sun className="w-3.5 h-3.5 text-orange-500" />
            ) : (
              <Laptop className="w-3.5 h-3.5 text-sky-400" />
            )}
          </button>

          {/* Sample Route button (Desktop only) */}
          <button
            onClick={onLoadSample}
            title="Cargar ruta y foto de ejemplo"
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
            <span>Ejemplo</span>
          </button>

          {/* Garmin Connect button */}
          <button
            onClick={onOpenGarminModal}
            title="Importar track desde Garmin Connect"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30 transition active:scale-95"
          >
            <Compass className="w-3.5 h-3.5 text-sky-500" />
            <span className="hidden sm:inline">Garmin</span>
          </button>

          {/* Load Track button */}
          <button
            onClick={() => trackInputRef.current?.click()}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 shadow-sm transition active:scale-95"
          >
            <FileCode2 className="w-3.5 h-3.5 text-orange-500" />
            <span>Track</span>
          </button>

          {/* Load Photo button */}
          <button
            onClick={() => photoInputRef.current?.click()}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 shadow-sm transition active:scale-95"
          >
            <Camera className="w-3.5 h-3.5 text-sky-500" />
            <span>Foto</span>
          </button>

          {/* Export / Share Button */}
          <button
            onClick={onExport}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 transition active:scale-95 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin text-white" />
                <span className="hidden sm:inline">Exportando...</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">Guardar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
