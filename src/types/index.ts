export interface TrackPoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: Date;
  distance?: number; // cumulative distance in km
  speed?: number; // km/h
}

export interface ElevationPoint {
  distance: number; // km
  elevation: number; // meters
}

export interface TrackStats {
  title: string;
  date: string;
  distanceKm: number;
  movingTimeSec: number;
  elapsedTimeSec: number;
  elevationGainM: number;
  elevationLossM: number;
  maxAltitudeM: number;
  minAltitudeM: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  points: TrackPoint[];
  elevationProfile: ElevationPoint[];
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
}

export type TemplateId = 'sport' | 'minimal' | 'poster' | 'social_story';

export type AspectRatioType = '9:16' | '4:5' | '1:1' | '16:9' | 'original';

export type FontFamilyType = 'outfit' | 'inter' | 'serif' | 'mono' | 'display';

export type LayoutPosition = 'bottom' | 'top' | 'split' | 'floating' | 'custom';

export type MetricType = 'distance' | 'time' | 'gain' | 'speed' | 'max_alt' | 'pace';

export type MovableElementId = 'title' | 'track' | 'stats' | 'profile' | 'watermark';

export interface ElementPosition {
  x: number; // percentage (0 to 100) of canvas width (reference center or anchor)
  y: number; // percentage (0 to 100) of canvas height
  scale: number; // 0.5 to 2.5
}

export interface OverlayPositions {
  title: ElementPosition;
  track: ElementPosition;
  stats: ElementPosition;
  profile: ElementPosition;
  watermark: ElementPosition;
}

export interface OverlayConfig {
  template: TemplateId;
  aspectRatio: AspectRatioType;
  title: string;
  subtitle: string;
  dateText: string;
  themeColor: string; // Accent color hex
  secondaryColor: string;
  fontFamily: FontFamilyType;
  
  // Element toggles
  showTrack: boolean;
  showProfile: boolean;
  showStats: boolean;
  showTitle: boolean;
  showDate: boolean;
  showWatermark: boolean;
  watermarkText: string;

  // Selected metrics
  metrics: MetricType[];
  
  // Customization sliders & options
  trackColor: string;
  trackWidth: number;
  trackGlow: boolean;
  trackStartFinishDots: boolean;
  profileHeight: number;
  profileFilled: boolean;
  profileGradient: boolean;
  cardOpacity: number; // 0 - 100
  glassmorphism: boolean;
  layoutPosition: LayoutPosition;

  // Scaling multipliers for typography and components
  titleScale: number; // 0.6 to 2.5 (makes titles clearly legible)
  statsScale: number; // 0.6 to 2.5 (makes numbers large and bold)
  trackScale: number; // 0.5 to 2.5
  profileScale: number; // 0.5 to 2.5

  // Free manual positioning
  positions: OverlayPositions;
  
  // Photo adjustments & crop pan
  photoFilter: 'none' | 'cinematic' | 'contrast' | 'vibrant' | 'blackwhite' | 'warm';
  photoBrightness: number; // -50 to 50
  photoContrast: number; // -50 to 50
  photoBlur: number; // 0 to 20
  photoVignette: boolean;
  photoOffsetX?: number; // -100 to 100 percentage of available pan
  photoOffsetY?: number; // -100 to 100 percentage of available pan
}
