import React from 'react';
import { 
  Share2, 
  Sparkles, 
  Activity,
  Sun,
  Moon,
  RotateCcw
} from 'lucide-react';

interface HeaderProps {
  onLoadSample: () => void;
  onExport: () => void;
  isExporting: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadSample,
  onExport,
  isExporting,
  theme,
  onToggleTheme,
}) => {
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
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Overlays para tus tracks en fotos
            </p>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Sample Route button (Desktop/Tablet) */}
          <button
            onClick={onLoadSample}
            title="Cargar ruta y foto de ejemplo"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
            <span>Ejemplo</span>
          </button>

          {/* Theme Toggle Button: Direct switch Dark / Light */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-700" />
                <span className="hidden md:inline">Oscuro</span>
              </>
            )}
          </button>

          {/* Export / Share Button */}
          <button
            onClick={onExport}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 transition active:scale-95 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Exportando...</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-white" />
                <span>Guardar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
