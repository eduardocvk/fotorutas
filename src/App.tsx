import { useState, useEffect } from 'react';
import type { TrackStats, OverlayConfig, AspectRatioType } from './types';
import { DEFAULT_CONFIG, SAMPLE_TRACK_COVADONGA, SAMPLE_PHOTOS } from './utils/sampleData';
import { parseGPX, parseFIT } from './utils/trackParsers';
import { exportHighResImage } from './utils/exportImage';
import { Header } from './components/Header';
import { PreviewCanvas } from './components/PreviewCanvas';
import { ControlsPanel } from './components/ControlsPanel';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<OverlayConfig>(DEFAULT_CONFIG);
  const [track, setTrack] = useState<TrackStats | null>(SAMPLE_TRACK_COVADONGA);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-orange-500 selection:text-white">
      {/* Top Header */}
      <Header
        onLoadTrack={handleLoadTrack}
        onLoadPhoto={handleLoadPhoto}
        onLoadSample={handleLoadSample}
        onExport={handleExport}
        isExporting={isExporting}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-7xl w-full mx-auto">
        {/* Left / Center: Interactive Preview Canvas */}
        <section className="flex-1 flex items-center justify-center p-2 sm:p-4 bg-slate-950/40 relative">
          <PreviewCanvas
            image={image}
            track={track}
            config={config}
            onChangeAspectRatio={handleChangeAspectRatio}
          />
        </section>

        {/* Right / Bottom: Controls Panel */}
        <aside className="w-full lg:w-[420px] xl:w-[460px] h-[480px] lg:h-[calc(100vh-60px)] shrink-0 flex flex-col">
          <ControlsPanel
            config={config}
            track={track}
            onUpdateConfig={handleUpdateConfig}
            onSelectSamplePhoto={loadPhotoFromUrl}
          />
        </aside>
      </main>

      {/* Floating Notification Toast */}
      {notification && (
        <div
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md border text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            notification.type === 'success'
              ? 'bg-slate-900/90 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10'
              : 'bg-slate-900/90 text-rose-400 border-rose-500/30 shadow-rose-500/10'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  );
}
