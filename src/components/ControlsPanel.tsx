import React, { useState } from 'react';
import type { OverlayConfig, TemplateId, MetricType, TrackStats } from '../types';
import { TEMPLATE_PRESETS, SAMPLE_PHOTOS } from '../utils/sampleData';
import {
  LayoutTemplate,
  Sliders,
  MapPin,
  BarChart3,
  Palette,
  Flame,
  Sparkles,
  Mountain,
  Compass,
  Check,
  Type
} from 'lucide-react';

interface ControlsPanelProps {
  config: OverlayConfig;
  track: TrackStats | null;
  onUpdateConfig: (partial: Partial<OverlayConfig>) => void;
  onSelectSamplePhoto: (url: string) => void;
}

type TabType = 'templates' | 'photo' | 'route' | 'metrics' | 'style';

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  config,
  track,
  onUpdateConfig,
  onSelectSamplePhoto,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('templates');

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'templates', label: 'Plantillas', icon: <LayoutTemplate className="w-4 h-4" /> },
    { id: 'photo', label: 'Foto', icon: <Sliders className="w-4 h-4" /> },
    { id: 'route', label: 'Ruta & Perfil', icon: <MapPin className="w-4 h-4" /> },
    { id: 'metrics', label: 'Métricas', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'style', label: 'Estilo', icon: <Palette className="w-4 h-4" /> },
  ];

  const handleApplyTemplate = (templateId: TemplateId) => {
    const preset = TEMPLATE_PRESETS[templateId];
    if (preset) {
      onUpdateConfig({
        ...preset,
        template: templateId,
      });
    }
  };

  const toggleMetric = (metric: MetricType) => {
    const current = config.metrics;
    if (current.includes(metric)) {
      if (current.length > 1) {
        onUpdateConfig({ metrics: current.filter((m) => m !== metric) });
      }
    } else {
      onUpdateConfig({ metrics: [...current, metric] });
    }
  };

  const colorPalette = [
    { name: 'Naranja Strava', hex: '#FF5500' },
    { name: 'Cyan Eléctrico', hex: '#00F0FF' },
    { name: 'Esmeralda Volt', hex: '#10B981' },
    { name: 'Amarillo Neón', hex: '#EAB308' },
    { name: 'Blanco Puro', hex: '#FFFFFF' },
    { name: 'Rosa Neón', hex: '#EC4899' },
    { name: 'Ámbar Cálido', hex: '#F59E0B' },
  ];

  return (
    <div className="flex flex-col w-full h-full bg-slate-900/70 backdrop-blur-xl border-l border-slate-800/80 overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-2 border-b border-slate-800/80 bg-slate-950/40 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-800 text-orange-400 border border-slate-700/80 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* TAB 1: PLANTILLAS */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">Elige una Plantilla</h3>
              <p className="text-xs text-slate-400">
                Diseños preconfigurados adaptados para historias y publicaciones en redes sociales.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Template: Sport Pro */}
              <button
                onClick={() => handleApplyTemplate('sport')}
                className={`relative p-3.5 rounded-2xl border text-left transition-all group overflow-hidden ${
                  config.template === 'sport'
                    ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/20 shadow-lg shadow-orange-500/10'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
                    <Flame className="w-5 h-5" />
                  </span>
                  {config.template === 'sport' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white">
                      Activa
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-orange-400 transition">
                  Deportiva (Strava Pro)
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  HUD atlético de alto contraste, acentos en naranja neón, badges de datos destacados.
                </p>
              </button>

              {/* Template: Minimalista Clean */}
              <button
                onClick={() => handleApplyTemplate('minimal')}
                className={`relative p-3.5 rounded-2xl border text-left transition-all group overflow-hidden ${
                  config.template === 'minimal'
                    ? 'border-sky-400 bg-sky-400/10 ring-2 ring-sky-400/20 shadow-lg shadow-sky-400/10'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                    <Sparkles className="w-5 h-5" />
                  </span>
                  {config.template === 'minimal' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500 text-white">
                      Activa
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-sky-400 transition">
                  Minimalista Clean
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Líneas finas, tarjetas traslúcidas estilo cristal y estética sobria y moderna.
                </p>
              </button>

              {/* Template: Outdoor Poster */}
              <button
                onClick={() => handleApplyTemplate('poster')}
                className={`relative p-3.5 rounded-2xl border text-left transition-all group overflow-hidden ${
                  config.template === 'poster'
                    ? 'border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/20 shadow-lg shadow-amber-400/10'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <Compass className="w-5 h-5" />
                  </span>
                  {config.template === 'poster' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                      Activa
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-amber-400 transition">
                  Póster Aventura
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Estilo revista y marco cinematográfico, tipografía con serifa y aire de expedición.
                </p>
              </button>

              {/* Template: Social Story 9:16 */}
              <button
                onClick={() => handleApplyTemplate('social_story')}
                className={`relative p-3.5 rounded-2xl border text-left transition-all group overflow-hidden ${
                  config.template === 'social_story'
                    ? 'border-cyan-400 bg-cyan-400/10 ring-2 ring-cyan-400/20 shadow-lg shadow-cyan-400/10'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                    <Mountain className="w-5 h-5" />
                  </span>
                  {config.template === 'social_story' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500 text-white">
                      Activa
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-cyan-400 transition">
                  Historia Redes (9:16)
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Optimizada para pantalla completa, track central con resplandor neón y título superior.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: FOTO & FILTROS */}
        {activeTab === 'photo' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">Ajustes de la Fotografía</h3>
              <p className="text-xs text-slate-400">
                Mejora la legibilidad de la ruta aplicando filtros y contrastes a la imagen de fondo.
              </p>
            </div>

            {/* Photo Filters */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Filtro Visual
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'none', label: 'Normal' },
                  { id: 'contrast', label: 'Contraste' },
                  { id: 'cinematic', label: 'Cine' },
                  { id: 'vibrant', label: 'Vívido' },
                  { id: 'blackwhite', label: 'B & N' },
                  { id: 'warm', label: 'Cálido' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onUpdateConfig({ photoFilter: f.id as any })}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition ${
                      config.photoFilter === f.id
                        ? 'border-orange-500 bg-orange-500/15 text-orange-400 font-bold'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders: Brightness & Contrast */}
            <div className="space-y-3 bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Brillo de Fondo</span>
                  <span className="text-slate-400">{config.photoBrightness}%</span>
                </div>
                <input
                  type="range"
                  min="-40"
                  max="40"
                  value={config.photoBrightness}
                  onChange={(e) => onUpdateConfig({ photoBrightness: Number(e.target.value) })}
                  className="w-full accent-orange-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Contraste</span>
                  <span className="text-slate-400">{config.photoContrast}%</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="50"
                  value={config.photoContrast}
                  onChange={(e) => onUpdateConfig({ photoContrast: Number(e.target.value) })}
                  className="w-full accent-orange-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Legibility Vignette Toggle */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-300 font-medium">Viñeta Oscura (Legibilidad)</span>
                <input
                  type="checkbox"
                  checked={config.photoVignette}
                  onChange={(e) => onUpdateConfig({ photoVignette: e.target.checked })}
                  className="w-4 h-4 rounded text-orange-500 accent-orange-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Sample Photos Gallery */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                O elige una foto de muestra:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_PHOTOS.map((sp) => (
                  <button
                    key={sp.id}
                    onClick={() => onSelectSamplePhoto(sp.url)}
                    className="relative group rounded-xl overflow-hidden aspect-[4/3] border border-slate-800 hover:border-orange-500 transition text-left"
                  >
                    <img
                      src={sp.url}
                      alt={sp.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                      <span className="text-[11px] font-bold text-white drop-shadow">
                        {sp.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RUTA & PERFIL */}
        {activeTab === 'route' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">Track GPS y Perfil</h3>
              <p className="text-xs text-slate-400">
                Personaliza el color del trazado, grosor, resplandor y altimetría.
              </p>
            </div>

            {/* Track Info Telemetry Card */}
            {track && (
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Telemetría Track</span>
                  <span className="font-extrabold text-white text-sm">{track.distanceKm} km · +{track.elevationGainM}m D+</span>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <div>{track.points.length} puntos GPS</div>
                  <div className="text-emerald-400 font-semibold">{track.minAltitudeM}m - {track.maxAltitudeM}m</div>
                </div>
              </div>
            )}

            {/* Track Color Palette */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Color del Trazado
              </label>
              <div className="flex flex-wrap gap-2 items-center">
                {colorPalette.map((col) => (
                  <button
                    key={col.hex}
                    onClick={() => onUpdateConfig({ trackColor: col.hex, themeColor: col.hex })}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      config.trackColor === col.hex
                        ? 'border-white scale-110 shadow-md ring-2 ring-white/20'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                  />
                ))}
                {/* Custom Color Input */}
                <label className="relative w-7 h-7 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center cursor-pointer hover:border-slate-500">
                  <input
                    type="color"
                    value={config.trackColor}
                    onChange={(e) => onUpdateConfig({ trackColor: e.target.value, themeColor: e.target.value })}
                    className="opacity-0 absolute inset-0 cursor-pointer"
                  />
                  <Palette className="w-3.5 h-3.5 text-slate-400" />
                </label>
              </div>
            </div>

            {/* Track Settings Box */}
            <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800 space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Grosor de Línea</span>
                  <span className="text-slate-400">{config.trackWidth}px</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={config.trackWidth}
                  onChange={(e) => onUpdateConfig({ trackWidth: Number(e.target.value) })}
                  className="w-full accent-orange-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-300 font-medium">Resplandor Neón (Glow)</span>
                <input
                  type="checkbox"
                  checked={config.trackGlow}
                  onChange={(e) => onUpdateConfig({ trackGlow: e.target.checked })}
                  className="w-4 h-4 rounded text-orange-500 accent-orange-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Puntos Salida / Meta</span>
                <input
                  type="checkbox"
                  checked={config.trackStartFinishDots}
                  onChange={(e) => onUpdateConfig({ trackStartFinishDots: e.target.checked })}
                  className="w-4 h-4 rounded text-orange-500 accent-orange-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Elevation Profile Box */}
            <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">Mostrar Gráfico de Perfil</span>
                <input
                  type="checkbox"
                  checked={config.showProfile}
                  onChange={(e) => onUpdateConfig({ showProfile: e.target.checked })}
                  className="w-4 h-4 rounded text-orange-500 accent-orange-500 cursor-pointer"
                />
              </div>

              {config.showProfile && (
                <>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-300 font-medium">Degradado Relleno</span>
                    <input
                      type="checkbox"
                      checked={config.profileGradient}
                      onChange={(e) => onUpdateConfig({ profileGradient: e.target.checked })}
                      className="w-4 h-4 rounded text-orange-500 accent-orange-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium">Altura del Perfil</span>
                      <span className="text-slate-400">{config.profileHeight}px</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="90"
                      value={config.profileHeight}
                      onChange={(e) => onUpdateConfig({ profileHeight: Number(e.target.value) })}
                      className="w-full accent-orange-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MÉTRICAS & TEXTO */}
        {activeTab === 'metrics' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">Textos y Datos Visibles</h3>
              <p className="text-xs text-slate-400">
                Personaliza el título, subtítulo de la ruta y elige las métricas a sobreimpresionar.
              </p>
            </div>

            {/* Title & Subtitle Inputs */}
            <div className="space-y-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Título de la Ruta
                </label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => onUpdateConfig({ title: e.target.value })}
                  placeholder="Ej: Lagos de Covadonga"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-orange-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Subtítulo / Ubicación
                </label>
                <input
                  type="text"
                  value={config.subtitle}
                  onChange={(e) => onUpdateConfig({ subtitle: e.target.value })}
                  placeholder="Ej: Picos de Europa, Asturias"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-orange-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Fecha
                </label>
                <input
                  type="text"
                  value={config.dateText}
                  onChange={(e) => onUpdateConfig({ dateText: e.target.value })}
                  placeholder="Ej: 26 OCT 2026"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-orange-500 transition"
                />
              </div>
            </div>

            {/* Metrics Checklist */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Métricas Visibles
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'distance', label: 'Distancia (km)' },
                  { id: 'time', label: 'Tiempo (h/m)' },
                  { id: 'gain', label: 'Desnivel + (m)' },
                  { id: 'speed', label: 'Velocidad Media' },
                  { id: 'max_alt', label: 'Altitud Máx' },
                  { id: 'pace', label: 'Ritmo (/km)' },
                ].map((m) => {
                  const isChecked = config.metrics.includes(m.id as MetricType);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleMetric(m.id as MetricType)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition ${
                        isChecked
                          ? 'border-orange-500/80 bg-orange-500/10 text-white font-bold'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>{m.label}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-orange-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Watermark Branding */}
            <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">Marca de Agua / Firma</span>
                <input
                  type="checkbox"
                  checked={config.showWatermark}
                  onChange={(e) => onUpdateConfig({ showWatermark: e.target.checked })}
                  className="w-4 h-4 rounded text-orange-500 accent-orange-500 cursor-pointer"
                />
              </div>
              {config.showWatermark && (
                <input
                  type="text"
                  value={config.watermarkText}
                  onChange={(e) => onUpdateConfig({ watermarkText: e.target.value })}
                  placeholder="Fotorutas / Tu usuario de IG"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500 transition"
                />
              )}
            </div>
          </div>
        )}

        {/* TAB 5: ESTILO & TIPOGRAFÍA */}
        {activeTab === 'style' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">Tipografía y Acabado</h3>
              <p className="text-xs text-slate-400">
                Selecciona la tipografía y el nivel de opacidad de las tarjetas superpuestas.
              </p>
            </div>

            {/* Font Family Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Familia Tipográfica
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'outfit', name: 'Outfit (Atlética & Bold)', preview: '64.8 km · 1420m D+' },
                  { id: 'inter', name: 'Inter (Moderna & Clean)', preview: '64.8 km · 1420m D+' },
                  { id: 'serif', name: 'Playfair (Editorial / Serifa)', preview: '64.8 km · 1420m D+' },
                  { id: 'display', name: 'Space Grotesk (Contemporánea)', preview: '64.8 km · 1420m D+' },
                  { id: 'mono', name: 'JetBrains Mono (Tech & GPS)', preview: '64.8 km · 1420m D+' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onUpdateConfig({ fontFamily: f.id as any })}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                      config.fontFamily === f.id
                        ? 'border-orange-500 bg-orange-500/10 text-white font-bold'
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Type className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-xs">{f.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{f.preview}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Card Opacity */}
            <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Opacidad del Fondo de Datos</span>
                <span className="text-slate-400">{config.cardOpacity}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={config.cardOpacity}
                onChange={(e) => onUpdateConfig({ cardOpacity: Number(e.target.value) })}
                className="w-full accent-orange-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
