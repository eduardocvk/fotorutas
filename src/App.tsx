import { useState, useEffect, useRef } from 'react';
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
  Camera, 
  BarChart3, 
  MapPin, 
  ChevronDown,
  ChevronUp,
  Palette
} from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<OverlayConfig>(DEFAULT_CONFIG);
  const [track, setTrack] = useState<TrackStats | null>(SAMPLE_TRACK_COVADONGA);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isGarminModalOpen, setIsGarminModalOpen] = useState(false);

  // Mobile layout state: sheet can be 'expanded' or 'peek' (partially visible)
  const [mobileActiveTab, setMobileActiveTab] = useState<TabType>('templates');
  const [sheetState, setSheetState] = useState<'expanded' | 'peek'>('expanded');

  // Theme state: 'dark' | 'light' (immediate toggle)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('fotorutas-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.getElementById('theme-color-meta')?.setAttribute('content', '#080c14');
    } else {
      document.documentElement.classList.remove('dark');
      document.getElementById('theme-color-meta')?.setAttribute('content', '#f8fafc');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
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
      if (result === 'gallery') {
        showToast('success', '¡Imagen guardada en tu Galería de fotos (álbum Fotorutas)!');
      } else if (result === 'shared') {
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

  const [sheetDragY, setSheetDragY] = useState(0);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const currentDragDelta = useRef<number>(0);

  const handleSheetPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;
    dragStartY.current = e.clientY;
    currentDragDelta.current = 0;
    setIsDraggingSheet(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleSheetPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null) return;
    const deltaY = e.clientY - dragStartY.current;
    currentDragDelta.current = deltaY;
    if (sheetState === 'expanded') {
      if (deltaY > 0) {
        setSheetDragY(deltaY);
      } else {
        setSheetDragY(deltaY * 0.2);
      }
    } else {
      // Peek mode: dragging up moves it up
      if (deltaY < 0) {
        setSheetDragY(deltaY);
      } else {
        setSheetDragY(deltaY * 0.2);
      }
    }
  };

  const handleSheetPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null) return;
    const delta = currentDragDelta.current;
    dragStartY.current = null;
    currentDragDelta.current = 0;
    setIsDraggingSheet(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    // When expanded, dragging downward by > 35px collapses to peek
    if (sheetState === 'expanded' && delta > 35) {
      setSheetState('peek');
    } 
    // When peek, dragging upward by > 25px expands sheet
    else if (sheetState === 'peek' && delta < -25) {
      setSheetState('expanded');
    }
    setSheetDragY(0);
  };

  const handleSheetPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartY.current = null;
    currentDragDelta.current = 0;
    setIsDraggingSheet(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    setSheetDragY(0);
  };

  const handleSelectMobileTab = (tab: TabType) => {
    if (sheetState === 'expanded' && mobileActiveTab === tab) {
      // Tapping the active tab again collapses to peek mode
      setSheetState('peek');
    } else {
      setMobileActiveTab(tab);
      setSheetState('expanded');
    }
  };

  const mobileNavTabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'templates', label: 'Plantillas', icon: <LayoutTemplate className="w-4 h-4" /> },
    { id: 'photo', label: 'Foto', icon: <Camera className="w-4 h-4" /> },
    { id: 'route', label: 'Ruta', icon: <MapPin className="w-4 h-4" /> },
    { id: 'metrics', label: 'Métricas', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'style', label: 'Estilo', icon: <Palette className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 selection:bg-orange-500 selection:text-white transition-colors duration-200">
      {/* Top Header */}
      <Header
        onLoadSample={handleLoadSample}
        onExport={handleExport}
        isExporting={isExporting}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-7xl w-full mx-auto relative">
        {/* Left / Center: Interactive Preview Canvas */}
        <section className={`flex-1 flex flex-col items-center justify-center p-1 sm:p-4 bg-slate-100/50 dark:bg-slate-950/40 relative ${sheetState === 'expanded' ? 'pb-64 lg:pb-4' : 'pb-36 lg:pb-4'}`}>
          <PreviewCanvas
            image={image}
            track={track}
            config={config}
            onChangeAspectRatio={handleChangeAspectRatio}
            onUpdatePositions={handleUpdatePositions}
            onUpdateConfig={handleUpdateConfig}
          />
        </section>

        {/* Desktop Sidebar: Controls Panel */}
        <aside className="hidden lg:flex w-[420px] xl:w-[460px] h-[calc(100vh-55px)] shrink-0 flex-col">
          <ControlsPanel
            config={config}
            track={track}
            onUpdateConfig={handleUpdateConfig}
            onSelectSamplePhoto={loadPhotoFromUrl}
            onLoadPhoto={handleLoadPhoto}
            onLoadTrack={handleLoadTrack}
            onOpenGarminModal={() => setIsGarminModalOpen(true)}
            onLoadSample={handleLoadSample}
          />
        </aside>

        {/* Mobile Interactive Bottom Sheet & Navigation Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex flex-col">
          {/* Collapsible Panel Content: Expanded (max-h-[52vh]) or Peek (partially visible, max-h-[115px]) */}
          <div 
            style={{
              transform: `translateY(${sheetDragY}px)`,
              transition: isDraggingSheet ? 'none' : 'max-height 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className={`bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl rounded-t-3xl flex flex-col overflow-hidden transition-all duration-300 ${
              sheetState === 'expanded' ? 'max-h-[52vh]' : 'max-h-[115px]'
            }`}
          >
            {/* Sheet Drag Handle Bar with smooth pointer drag */}
            <div 
              onPointerDown={handleSheetPointerDown}
              onPointerMove={handleSheetPointerMove}
              onPointerUp={handleSheetPointerUp}
              onPointerCancel={handleSheetPointerCancel}
              onClick={() => {
                if (Math.abs(currentDragDelta.current) < 5) {
                  setSheetState((prev) => (prev === 'expanded' ? 'peek' : 'expanded'));
                }
              }}
              style={{ touchAction: 'none' }}
              className="w-full py-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing border-b border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950/40 select-none touch-none hover:bg-slate-100 dark:hover:bg-slate-800/40 active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
            >
              <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 mb-1" />
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                {sheetState === 'expanded' ? (
                  <>
                    <span>Desliza hacia abajo o toca para minimizar</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span className="text-orange-600 dark:text-orange-400 font-bold">
                      Ajustes ({mobileNavTabs.find((t) => t.id === mobileActiveTab)?.label || 'Panel'})
                    </span>
                    <span>· Toca o desliza para abrir</span>
                    <ChevronUp className="w-3.5 h-3.5 text-orange-500" />
                  </>
                )}
              </div>
            </div>

            {/* Controls inside sheet */}
            <div className="flex-1 overflow-y-auto">
              <ControlsPanel
                config={config}
                track={track}
                onUpdateConfig={handleUpdateConfig}
                onSelectSamplePhoto={loadPhotoFromUrl}
                onLoadPhoto={handleLoadPhoto}
                onLoadTrack={handleLoadTrack}
                onOpenGarminModal={() => setIsGarminModalOpen(true)}
                onLoadSample={handleLoadSample}
                activeTabOverride={mobileActiveTab}
                onChangeTab={setMobileActiveTab}
              />
            </div>
          </div>

          {/* Bottom Navigation Bar - Elevated with safe area to never collide with Android system buttons */}
          <nav 
            style={{ paddingBottom: 'max(0.75rem, calc(0.5rem + env(safe-area-inset-bottom, 0px)))' }}
            className="w-full bg-white/95 dark:bg-slate-950/95 border-t border-slate-200 dark:border-slate-800/80 backdrop-blur-md px-1 pt-1.5 grid grid-cols-5 gap-0.5 shadow-2xl select-none"
          >
            {mobileNavTabs.map((tab) => {
              const isActive = mobileActiveTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectMobileTab(tab.id)}
                  className={`flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all ${
                    isActive
                      ? 'text-orange-500 bg-orange-500/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="shrink-0">{tab.icon}</span>
                  <span className="truncate w-full text-center leading-tight">{tab.label}</span>
                </button>
              );
            })}
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
