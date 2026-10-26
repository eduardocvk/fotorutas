import type { TrackStats, OverlayConfig, TemplateId, OverlayPositions } from '../types';

export const DEFAULT_POSITIONS_BY_TEMPLATE: Record<TemplateId, OverlayPositions> = {
  sport: {
    title: { x: 50, y: 12, scale: 1.2 },
    track: { x: 50, y: 40, scale: 1.2 },
    stats: { x: 50, y: 77, scale: 1.25 },
    profile: { x: 50, y: 91, scale: 1.15 },
    watermark: { x: 92, y: 98, scale: 1.0 },
  },
  minimal: {
    title: { x: 50, y: 10, scale: 1.15 },
    track: { x: 50, y: 42, scale: 1.15 },
    stats: { x: 50, y: 79, scale: 1.15 },
    profile: { x: 50, y: 92, scale: 1.05 },
    watermark: { x: 92, y: 98, scale: 1.0 },
  },
  poster: {
    title: { x: 50, y: 13, scale: 1.25 },
    track: { x: 50, y: 42, scale: 1.15 },
    stats: { x: 50, y: 88, scale: 1.2 },
    profile: { x: 50, y: 76, scale: 1.1 },
    watermark: { x: 50, y: 96, scale: 1.0 },
  },
  social_story: {
    title: { x: 50, y: 12, scale: 1.35 },
    track: { x: 50, y: 42, scale: 1.3 },
    stats: { x: 50, y: 75, scale: 1.3 },
    profile: { x: 50, y: 90, scale: 1.2 },
    watermark: { x: 50, y: 98, scale: 1.0 },
  },
};

// Preset configurations for the templates
export const TEMPLATE_PRESETS: Record<TemplateId, Partial<OverlayConfig>> = {
  sport: {
    template: 'sport',
    themeColor: '#FF5500', // Strava orange
    secondaryColor: '#FF8A00',
    fontFamily: 'outfit',
    showTrack: true,
    showProfile: true,
    showStats: true,
    showTitle: true,
    showDate: true,
    showWatermark: true,
    watermarkText: 'RUTAGRAM',
    metrics: ['distance', 'time', 'gain', 'speed', 'max_alt'],
    trackColor: '#FF5500',
    trackWidth: 5,
    trackGlow: true,
    trackStartFinishDots: true,
    profileHeight: 70,
    profileFilled: true,
    profileGradient: true,
    cardOpacity: 88,
    glassmorphism: true,
    layoutPosition: 'bottom',
    titleScale: 1.25,
    statsScale: 1.25,
    trackScale: 1.2,
    profileScale: 1.15,
    positions: DEFAULT_POSITIONS_BY_TEMPLATE.sport,
    photoFilter: 'contrast',
    photoBrightness: -5,
    photoContrast: 15,
    photoVignette: true,
  },
  minimal: {
    template: 'minimal',
    themeColor: '#38BDF8', // Sky cyan
    secondaryColor: '#FFFFFF',
    fontFamily: 'inter',
    showTrack: true,
    showProfile: true,
    showStats: true,
    showTitle: true,
    showDate: true,
    showWatermark: false,
    watermarkText: 'Rutagram',
    metrics: ['distance', 'gain', 'time', 'max_alt'],
    trackColor: '#FFFFFF',
    trackWidth: 4,
    trackGlow: false,
    trackStartFinishDots: true,
    profileHeight: 56,
    profileFilled: true,
    profileGradient: false,
    cardOpacity: 72,
    glassmorphism: true,
    layoutPosition: 'bottom',
    titleScale: 1.15,
    statsScale: 1.15,
    trackScale: 1.15,
    profileScale: 1.05,
    positions: DEFAULT_POSITIONS_BY_TEMPLATE.minimal,
    photoFilter: 'none',
    photoBrightness: 0,
    photoContrast: 5,
    photoVignette: false,
  },
  poster: {
    template: 'poster',
    themeColor: '#F59E0B', // Amber gold
    secondaryColor: '#FDE68A',
    fontFamily: 'serif',
    showTrack: true,
    showProfile: true,
    showStats: true,
    showTitle: true,
    showDate: true,
    showWatermark: true,
    watermarkText: 'EXPEDITION SERIES',
    metrics: ['distance', 'gain', 'time', 'max_alt'],
    trackColor: '#F59E0B',
    trackWidth: 4,
    trackGlow: false,
    trackStartFinishDots: true,
    profileHeight: 60,
    profileFilled: true,
    profileGradient: true,
    cardOpacity: 80,
    glassmorphism: true,
    layoutPosition: 'split',
    titleScale: 1.25,
    statsScale: 1.2,
    trackScale: 1.15,
    profileScale: 1.1,
    positions: DEFAULT_POSITIONS_BY_TEMPLATE.poster,
    photoFilter: 'cinematic',
    photoBrightness: -8,
    photoContrast: 12,
    photoVignette: true,
  },
  social_story: {
    template: 'social_story',
    aspectRatio: '9:16',
    themeColor: '#00F0FF', // Neon cyan
    secondaryColor: '#FF007A',
    fontFamily: 'display',
    showTrack: true,
    showProfile: true,
    showStats: true,
    showTitle: true,
    showDate: true,
    showWatermark: true,
    watermarkText: 'rutagram.app',
    metrics: ['distance', 'time', 'gain', 'speed'],
    trackColor: '#00F0FF',
    trackWidth: 6,
    trackGlow: true,
    trackStartFinishDots: true,
    profileHeight: 75,
    profileFilled: true,
    profileGradient: true,
    cardOpacity: 85,
    glassmorphism: true,
    layoutPosition: 'floating',
    titleScale: 1.35,
    statsScale: 1.3,
    trackScale: 1.3,
    profileScale: 1.2,
    positions: DEFAULT_POSITIONS_BY_TEMPLATE.social_story,
    photoFilter: 'vibrant',
    photoBrightness: 0,
    photoContrast: 20,
    photoVignette: true,
  },
};

// Default initial config
export const DEFAULT_CONFIG: OverlayConfig = {
  template: 'sport',
  aspectRatio: '9:16',
  title: 'Subida a Lagos de Covadonga',
  subtitle: 'Picos de Europa, Asturias',
  dateText: '26 OCT 2026',
  themeColor: '#FF5500',
  secondaryColor: '#FF8A00',
  fontFamily: 'outfit',
  showTrack: true,
  showProfile: true,
  showStats: true,
  showTitle: true,
  showDate: true,
  showWatermark: true,
  watermarkText: 'RUTAGRAM',
  metrics: ['distance', 'time', 'gain', 'speed', 'max_alt'],
  trackColor: '#FF5500',
  trackWidth: 5,
  trackGlow: true,
  trackStartFinishDots: true,
  profileHeight: 70,
  profileFilled: true,
  profileGradient: true,
  cardOpacity: 88,
  glassmorphism: true,
  layoutPosition: 'bottom',
  titleScale: 1.25,
  statsScale: 1.25,
  trackScale: 1.2,
  profileScale: 1.15,
  positions: DEFAULT_POSITIONS_BY_TEMPLATE.sport,
  photoFilter: 'contrast',
  photoBrightness: -5,
  photoContrast: 15,
  photoBlur: 0,
  photoVignette: true,
  photoOffsetX: 0,
  photoOffsetY: 0,
};

// Generate realistic mountain climb route (Lagos de Covadonga)
function generateSampleTrack(): TrackStats {
  const points = [];
  const profile = [];
  const baseLat = 43.321;
  const baseLon = -5.045;
  const totalKm = 64.8;
  const numPoints = 320;

  let currentDist = 0;
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    currentDist = t * totalKm;

    // Curved scenic mountain route trajectory
    const angle = t * Math.PI * 3.5;
    const r = 0.08 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2));
    const lat = baseLat + Math.cos(angle) * r + t * 0.04;
    const lon = baseLon + Math.sin(angle) * r * 1.3 + (Math.sin(t * 8) * 0.01);

    // Realistic elevation profile with flat warmup, steep climbs, and final peak
    let ele = 120;
    if (t < 0.25) {
      ele = 120 + t * 240 + Math.sin(t * 40) * 15;
    } else if (t < 0.7) {
      const climbProgress = (t - 0.25) / 0.45;
      ele = 180 + Math.pow(climbProgress, 1.4) * 980 + Math.sin(t * 50) * 25;
    } else {
      const topProgress = (t - 0.7) / 0.3;
      ele = 1160 - Math.pow(topProgress, 1.2) * 800 + Math.sin(t * 20) * 30;
    }

    points.push({
      lat,
      lon,
      ele: Math.round(ele),
      distance: Number(currentDist.toFixed(2)),
    });

    if (i % 2 === 0 || i === numPoints - 1) {
      profile.push({
        distance: Number(currentDist.toFixed(1)),
        elevation: Math.round(ele),
      });
    }
  }

  return {
    title: 'Subida a Lagos de Covadonga',
    date: '26 Oct 2026',
    distanceKm: 64.8,
    movingTimeSec: 2 * 3600 + 48 * 60 + 20, // 2h 48m 20s
    elapsedTimeSec: 3 * 3600 + 12 * 60,
    elevationGainM: 1420,
    elevationLossM: 1390,
    maxAltitudeM: 1150,
    minAltitudeM: 115,
    avgSpeedKmh: 23.1,
    maxSpeedKmh: 68.4,
    points,
    elevationProfile: profile,
    bounds: {
      minLat: 43.23,
      maxLat: 43.41,
      minLon: -5.15,
      maxLon: -4.94,
    },
  };
}

export const SAMPLE_TRACK_COVADONGA = generateSampleTrack();

// Curated high quality outdoor & cycling background images
export interface SamplePhoto {
  id: string;
  name: string;
  category: string;
  url: string;
  aspect: 'vertical' | 'portrait' | 'landscape';
}

export const SAMPLE_PHOTOS: SamplePhoto[] = [
  {
    id: 'cycling-mountain',
    name: 'Ciclista en Carretera de Montaña',
    category: 'Ciclismo',
    url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
    aspect: 'vertical',
  },
  {
    id: 'epic-alps',
    name: 'Pico Nevado & Curvas Panorámicas',
    category: 'Montaña',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    aspect: 'vertical',
  },
  {
    id: 'trail-sunset',
    name: 'Atardecer en Sendero Trail & Gravel',
    category: 'Trail / Aventura',
    url: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1200&q=80',
    aspect: 'vertical',
  },
  {
    id: 'forest-gravel',
    name: 'Pista de Grava Entre Bosques',
    category: 'Gravel',
    url: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
    aspect: 'portrait',
  },
];
