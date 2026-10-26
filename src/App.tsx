import { useState, useEffect } from 'react';
import type { TrackStats, OverlayConfig, AspectRatioType, OverlayPositions } from './types';
import { DEFAULT_CONFIG, SAMPLE_TRACK_COVADONGA, SAMPLE_PHOTOS } from './utils/sampleData';
import { parseGPX, parseFIT } from './utils/trackParsers';
import { exportHighResImage } from './utils/exportImage';
import { Header } from './components/Header';
import { PreviewCanvas } from './components/PreviewCanvas';
import { ControlsPanel, type TabType } from './components/ControlsPanel';
import { GarminImportModal } from './components/GarminImportModal';
import { 
  AlertCircle, 
  CheckCircle2, 
  LayoutTemplate, 
  Move, 
  BarChart3, 
  MapPin, 
  Sliders, 
  ChevronUp, 
  ChevronDown
} from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<OverlayConfig>(DEFAULT_CONFIG);
  const [track, setTrack] = useState<TrackStats | null>(SAMPLE_TRACK_COVADONGA);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isGarminModalOpen, setIsGarminModalOpen] = useState(false);

  // Mobile layout state
  const [mobileActiveTab, setMobileActiveTab] = useState<TabType>('templates');
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(true);

  // Theme state: 'system' | 'dark' | 'light'
  const [theme, setTheme] = useState<'system' | 'dark' | 'light'>(() => {
    const saved = localStorage.getItem('fotorutas-theme');
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
    return 'system';
  });

  // Apply theme to document
  useEffect(() => {
    const applyTheme = () => {
      let isDark = false;
      if (theme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = theme === 'dark';
      }

      if (isDark) {
        document.documentElement.classList.add('dark');
        document.getElementById('theme-color-meta')?.setAttribute('content', '#080c14');
      } else {
        document.documentElement.classList.remove('dark');
        document.getElementById('theme-color-meta')?.setAttribute('content', '#f8fafc');
      }
    };

    applyTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'system' ? 'dark' : prev === 'dark' ? 'light' : 'system';
      localStorage.setItem('fotorutas-theme', next);
      return next;
    });
  };

  // Initialize with sample photo
  useEffect(() => {
    loadPhotoFromUrl(SAMPLE_PHOTOS[0].url);
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  const loadPhotoFromUrl = (url: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => {
      setImage(img);
    };
    img.onerror = () => {
      showToast('error', 'No se pudo cargar la imagen seleccionada.');
    };
  };

  // Handle loading local GPX or FIT file
  const handleLoadTrack = async (file: File) => {
    const fileName = file.name.toLowerCase();
    try {
      if (fileName.endsWith('.gpx')) {
        const text = await file.text();
        const parsed = parseGPX(text, file.name);
        setTrack(parsed);
        setConfig((prev) => ({
          ...prev,
          title: parsed.title || prev.title,
          dateText: parsed.date || prev.dateText,
        }));
        showToast('success', `Track GPX cargado: ${parsed.distanceKm} km · +${parsed.elevationGainM}m D+`);
      } else if (fileName.endsWith('.fit')) {
        const buffer = await file.arrayBuffer();
        const parsed = await parseFIT(buffer, file.name);
        setTrack(parsed);
        setConfig((prev) => ({
          ...prev,
          title: parsed.title || prev.title,
          dateText: parsed.date || prev.dateText,
        }));
        showToast('success', `Track FIT cargado: ${parsed.distanceKm} km · +${parsed.elevationGainM}m D+`);
      } else {
        showToast('error', 'Formato no soportado. Por favor, selecciona un archivo .gpx o .fit');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error al procesar el archivo de ruta.');
    }
  };

  // Handle loading local photo from device
  const handleLoadPhoto = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Por favor selecciona un archivo de imagen válido (JPG, PNG, HEIC, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        const img = new Image();
        img.src = result;
        img.onload = () => {
          setImage(img);
          showToast('success', 'Foto cargada correctamente.');
        };
      }
    };
    reader.readAsDataURL(file);
  };

  // Reload default sample route
  const handleLoadSample = () => {
    setTrack(SAMPLE_TRACK_COVADONGA);
    setConfig((prev) => ({
      ...DEFAULT_CONFIG,
      template: prev.template,
      aspectRatio: prev.aspectRatio,
    }));
    loadPhotoFromUrl(SAMPLE_PHOTOS[0].url);
    showToast('success', 'Ruta y foto de ejemplo cargadas.');
  };

  // Update partial overlay config
  const handleUpdateConfig = (partial: Partial<OverlayConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  };

  // Change aspect ratio
  const handleChangeAspectRatio = (aspectRatio: AspectRatioType) => {
    setConfig((prev) => ({ ...prev, aspectRatio }));
  };

  const handleUpdatePositions = (positions: OverlayPositions) => {
    setConfig((prev) => ({ ...prev, positions }));
  };

  // Trigger high resolution export
  const handleExport = async () => {
    if (!image) {
      showToast('error', 'Por favor, selecciona una foto antes de exportar.');
      return;
    }
    setIsExporting(true);
    try {
      const cleanTitle = (config.title || 'fotoruta').toLowerCase().replace(/\s+/g, '-');
      const filename = `${cleanTitle}-${config.aspectRatio.replace(':', 'x')}.png`;
      const result = await exportHighResImage(image, track, config, filename);
      if (result === 'shared') {
        showToast('success', '¡Imagen compartida con éxito!');
      } else if (result === 'downloaded') {
        showToast('success', '¡Imagen en alta resolución descargada!');
      }
    } catch (err: any) {
      showToast('error', 'Fallo al exportar la imagen: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectMobileTab = (tab: TabType) => {
    setMobileActiveTab(tab);
    setIsMobileSheetOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 selection:bg-orange-500 selection:text-white transition-colors duration-200">
      {/* Top Header */}
      <Header
        onLoadTrack={handleLoadTrack}
        onLoadPhoto={handleLoadPhoto}
        onLoadSample={handleLoadSample}
        onOpenGarminModal={() => setIsGarminModalOpen(true)}
        onExport={handleExport}
        isExporting={isExporting}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-7xl w-full mx-auto relative">
        {/* Left / Center: Interactive Preview Canvas */}
        <section className={`flex-1 flex flex-col items-center justify-center p-1 sm:p-4 bg-slate-100/50 dark:bg-slate-950/40 relative ${isMobileSheetOpen ? 'pb-52 lg:pb-4' : 'pb-16 lg:pb-4'}`}>
          <PreviewCanvas
            image={image}
            track={track}
            config={config}
            onChangeAspectRatio={handleChangeAspectRatio}
            onUpdatePositions={handleUpdatePositions}
          />
        </section>

        {/* Desktop Sidebar: Controls Panel */}
        <aside className="hidden lg:flex w-[420px] xl:w-[460px] h-[calc(100vh-55px)] shrink-0 flex-col">
          <ControlsPanel
            config={config}
            track={track}
            onUpdateConfig={handleUpdateConfig}
            onSelectSamplePhoto={loadPhotoFromUrl}
          />
        </aside>

        {/* Mobile Interactive Bottom Sheet & Navigation Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex flex-col">
          {/* Collapsible Panel Content */}
          {isMobileSheetOpen && (
            <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl rounded-t-3xl max-h-[50vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
              {/* Sheet Handle */}
              <div 
                onClick={() => setIsMobileSheetOpen(false)}
                className="w-full py-2 flex items-center justify-center cursor-pointer border-b border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950/40"
              >
                <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              </div>

              {/* Controls inside sheet */}
              <div className="flex-1 overflow-y-auto">
                <ControlsPanel
                  config={config}
                  track={track}
                  onUpdateConfig={handleUpdateConfig}
                  onSelectSamplePhoto={loadPhotoFromUrl}
                  activeTabOverride={mobileActiveTab}
                  onChangeTab={setMobileActiveTab}
                />
              </div>
            </div>
          )}

          {/* Bottom Navigation Bar */}
          <nav className="w-full bg-white/95 dark:bg-slate-950/95 border-t border-slate-200 dark:border-slate-800/80 backdrop-blur-md px-2 py-1.5 flex items-center justify-around shadow-lg">
            <button
              onClick={() => handleSelectMobileTab('templates')}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition ${
                isMobileSheetOpen && mobileActiveTab === 'templates'
                  ? 'text-orange-500 bg-orange-500/10'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <LayoutTemplate className="w-4 h-4" />
              <span>Plantillas</span>
            </button>

            <button
              onClick={() => handleSelectMobileTab('position')}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition ${
                isMobileSheetOpen && mobileActiveTab === 'position'
                  ? 'text-orange-500 bg-orange-500/10'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Move className="w-4 h-4" />
              <span>Posición</span>
            </button>

            <button
              onClick={() => handleSelectMobileTab('metrics')}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition ${
                isMobileSheetOpen && mobileActiveTab === 'metrics'
                  ? 'text-orange-500 bg-orange-500/10'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Métricas</span>
            </button>

            <button
              onClick={() => handleSelectMobileTab('route')}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition ${
                isMobileSheetOpen && mobileActiveTab === 'route'
                  ? 'text-orange-500 bg-orange-500/10'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Ruta</span>
            </button>

            <button
              onClick={() => handleSelectMobileTab('photo')}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition ${
                isMobileSheetOpen && mobileActiveTab === 'photo'
                  ? 'text-orange-500 bg-orange-500/10'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Filtros</span>
            </button>

            {/* Toggle Sheet Button */}
            <button
              onClick={() => setIsMobileSheetOpen(!isMobileSheetOpen)}
              className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              title={isMobileSheetOpen ? 'Ocultar panel' : 'Ver opciones'}
            >
              {isMobileSheetOpen ? (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Ocultar</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Editar</span>
                </>
              )}
            </button>
          </nav>
        </div>
      </main>

      {/* Garmin Connect Import Modal */}
      <GarminImportModal
        isOpen={isGarminModalOpen}
        onClose={() => setIsGarminModalOpen(false)}
        onLoadTrackFile={handleLoadTrack}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div
          className={`fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200 ${
            notification.type === 'success'
              ? 'bg-white/95 dark:bg-slate-900/95 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-emerald-500/10'
              : 'bg-white/95 dark:bg-slate-900/95 text-rose-600 dark:text-rose-400 border-rose-500/30 shadow-rose-500/10'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  );
}
