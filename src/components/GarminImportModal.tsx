import React, { useState, useRef } from 'react';
import { 
  X, 
  ExternalLink, 
  Download, 
  HelpCircle, 
  CheckCircle2, 
  Copy, 
  Compass, 
  FileCode2,
  AlertCircle
} from 'lucide-react';

interface GarminImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTrackFile: (file: File) => void;
}

export const GarminImportModal: React.FC<GarminImportModalProps> = ({
  isOpen,
  onClose,
  onLoadTrackFile,
}) => {
  const [garminUrl, setGarminUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadTrackFile(file);
      onClose();
    }
  };

  // Extract activity ID from Garmin Connect URL
  const extractActivityId = (url: string): string | null => {
    const match = url.match(/activity\/(\d+)/i) || url.match(/(\d{7,12})/);
    return match ? match[1] : null;
  };

  const handleOpenGarminDirectExport = () => {
    setError(null);
    const id = extractActivityId(garminUrl);
    if (!id) {
      setError('No se pudo detectar el número de actividad. Asegúrate de pegar el enlace completo de Garmin Connect.');
      return;
    }

    // Direct Garmin export URL: triggers the browser download of GPX
    const directExportUrl = `https://connect.garmin.com/download-service/files/activity/${id}`;
    window.open(directExportUrl, '_blank');
  };

  const handleOpenGarminWeb = () => {
    const id = extractActivityId(garminUrl);
    const webUrl = id 
      ? `https://connect.garmin.com/modern/activity/${id}`
      : 'https://connect.garmin.com/modern/activities';
    window.open(webUrl, '_blank');
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setGarminUrl(text.trim());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (e) {
      setError('No se pudo leer el portapapeles. Pega el enlace manualmente en la casilla.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Compass className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Importar desde Garmin Connect
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Solución para exportar tracks en móvil fácilmente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {/* Method 1: Paste Activity Link */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Opción 1: Descarga Directa por Enlace
              </span>
              <button
                onClick={handlePasteFromClipboard}
                className="text-[11px] font-semibold text-orange-500 hover:underline flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? '¡Pegado!' : 'Pegar enlace'}</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="url"
                value={garminUrl}
                onChange={(e) => setGarminUrl(e.target.value)}
                placeholder="https://connect.garmin.com/modern/activity/1234567890"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition pr-20"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleOpenGarminDirectExport}
                className="flex-1 py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/20 transition active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar GPX en el móvil</span>
              </button>
              <button
                onClick={handleOpenGarminWeb}
                className="py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1 transition"
                title="Abrir en Garmin Connect Web"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Method 2: Step by step Guide */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              ¿Cómo sacar el track de Garmin en el móvil en 10 segundos?
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <div>
                  <strong className="text-slate-800 dark:text-slate-200">En la app de Garmin Connect:</strong>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                    Entra en tu actividad, pulsa los <strong>tres puntos (⋮)</strong> arriba a la derecha y selecciona <strong>«Compartir» → «Compartir enlace web»</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <div>
                  <strong className="text-slate-800 dark:text-slate-200">En el navegador de tu móvil (Chrome):</strong>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                    Pega el enlace en Chrome. Pulsa el icono del <strong>engranaje (⚙️)</strong> junto al título y elige <strong>«Exportar a GPX»</strong> o «FIT original».
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <div>
                  <strong className="text-slate-800 dark:text-slate-200">En Fotorutas:</strong>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                    Toca <strong>«Cargar Track»</strong> y selecciona el archivo recién descargado de tu carpeta <strong>Descargas</strong>. ¡Listo!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Alternative: Strava / Wikiloc synchronization note */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
            <div>
              <span className="font-bold">¿Tienes Garmin sincronizado con Strava o Wikiloc?</span>
              <p className="text-[11px] text-amber-600 dark:text-amber-300/80 mt-0.5">
                Si sincronizas tus salidas automáticamente con Strava o Wikiloc, también puedes entrar en tu actividad y pulsar «Exportar GPX» directamente en 1 toque.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".gpx,.fit"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-orange-500/20"
          >
            <FileCode2 className="w-4 h-4" />
            <span>Elegir GPX/FIT descargado</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
