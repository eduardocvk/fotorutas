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

export type LayoutPosition = 'bottom' | 'top' | 'split' | 'floating';

export type MetricType = 'distance' | 'time' | 'gain' | 'speed' | 'max_alt' | 'pace';

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
  
  // Photo adjustments
  photoFilter: 'none' | 'cinematic' | 'contrast' | 'vibrant' | 'blackwhite' | 'warm';
  photoBrightness: number; // -50 to 50
  photoContrast: number; // -50 to 50
  photoBlur: number; // 0 to 20
  photoVignette: boolean;
}
