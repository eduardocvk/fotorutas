import type { TrackStats, OverlayConfig, AspectRatioType, MovableElementId } from '../types';
import { formatDuration, formatPace } from './trackParsers';

export interface RenderCanvasOptions {
  canvas: HTMLCanvasElement;
  image: HTMLImageElement | null;
  track: TrackStats | null;
  config: OverlayConfig;
  exportScale?: number; // 1 for preview, 2-3 for high-res export
}

export interface BoundingBox {
  id: MovableElementId;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Convert aspect ratio type to numeric width/height ratio
export function getAspectRatioValue(aspect: AspectRatioType, imgWidth = 1080, imgHeight = 1920): number {
  switch (aspect) {
    case '9:16':
      return 9 / 16;
    case '4:5':
      return 4 / 5;
    case '1:1':
      return 1;
    case '16:9':
      return 16 / 9;
    case 'original':
      return imgWidth / imgHeight;
    default:
      return 9 / 16;
  }
}

// Helper to draw rounded rectangle
export function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number | number[]
) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    const r = typeof radius === 'number' ? radius : radius[0] || 0;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

// Draw the track polyline onto a target box
export function drawTrackPolyline(
  ctx: CanvasRenderingContext2D,
  track: TrackStats,
  x: number,
  y: number,
  width: number,
  height: number,
  config: OverlayConfig,
  scale: number
) {
  const points = track.points;
  if (!points || points.length < 2) return;

  const { minLat, maxLat, minLon, maxLon } = track.bounds;
  const latSpan = maxLat - minLat || 0.0001;
  const lonSpan = maxLon - minLon || 0.0001;

  // Preserve aspect ratio of real world GPS coordinates (corrected for latitude)
  const avgLat = ((minLat + maxLat) / 2) * (Math.PI / 180);
  const cosLat = Math.cos(avgLat);
  const geoAspect = (lonSpan * cosLat) / latSpan;

  const boxAspect = width / height;

  let drawW = width;
  let drawH = height;
  let offsetX = x;
  let offsetY = y;

  if (geoAspect > boxAspect) {
    drawH = width / geoAspect;
    offsetY = y + (height - drawH) / 2;
  } else {
    drawW = height * geoAspect;
    offsetX = x + (width - drawW) / 2;
  }

  // Map lat/lon to canvas coordinates
  const mapPoint = (lat: number, lon: number): [number, number] => {
    const px = offsetX + ((lon - minLon) / lonSpan) * drawW;
    const py = offsetY + ((maxLat - lat) / latSpan) * drawH;
    return [px, py];
  };

  ctx.save();

  // Glow effect
  if (config.trackGlow) {
    ctx.shadowColor = config.trackColor;
    ctx.shadowBlur = 18 * scale;
  }

  ctx.strokeStyle = config.trackColor;
  ctx.lineWidth = Math.max(3, config.trackWidth * scale);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  const [firstX, firstY] = mapPoint(points[0].lat, points[0].lon);
  ctx.moveTo(firstX, firstY);

  for (let i = 1; i < points.length; i++) {
    const [px, py] = mapPoint(points[i].lat, points[i].lon);
    ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Draw start and finish markers
  if (config.trackStartFinishDots) {
    ctx.shadowBlur = 0;

    // Start point (Green dot)
    const [startX, startY] = mapPoint(points[0].lat, points[0].lon);
    ctx.beginPath();
    ctx.arc(startX, startY, 8 * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#10B981';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3 * scale;
    ctx.stroke();

    // Finish point (Red ring)
    const last = points[points.length - 1];
    const [endX, endY] = mapPoint(last.lat, last.lon);
    ctx.beginPath();
    ctx.arc(endX, endY, 8 * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#EF4444';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3 * scale;
    ctx.stroke();
  }

  ctx.restore();
}

// Draw smooth elevation profile
export function drawElevationProfile(
  ctx: CanvasRenderingContext2D,
  track: TrackStats,
  x: number,
  y: number,
  width: number,
  height: number,
  config: OverlayConfig,
  scale: number
) {
  const profile = track.elevationProfile;
  if (!profile || profile.length < 2) return;

  const minAlt = track.minAltitudeM;
  const maxAlt = track.maxAltitudeM;
  const altSpan = Math.max(50, maxAlt - minAlt);
  const totalDist = track.distanceKm || profile[profile.length - 1].distance || 1;

  ctx.save();

  // Coordinates mapping
  const getX = (dist: number) => x + (dist / totalDist) * width;
  const getY = (ele: number) => y + height - ((ele - minAlt) / altSpan) * (height - 18 * scale);

  // Profile curve
  ctx.beginPath();
  ctx.moveTo(getX(profile[0].distance), getY(profile[0].elevation));

  for (let i = 1; i < profile.length; i++) {
    const p1 = profile[i - 1];
    const p2 = profile[i];
    const mx = (getX(p1.distance) + getX(p2.distance)) / 2;
    const my = (getY(p1.elevation) + getY(p2.elevation)) / 2;
    ctx.quadraticCurveTo(getX(p1.distance), getY(p1.elevation), mx, my);
  }
  const lastP = profile[profile.length - 1];
  ctx.lineTo(getX(lastP.distance), getY(lastP.elevation));

  // Area Fill
  if (config.profileFilled) {
    ctx.save();
    const fillPath = new Path2D();
    fillPath.moveTo(getX(profile[0].distance), getY(profile[0].elevation));

    for (let i = 1; i < profile.length; i++) {
      const p1 = profile[i - 1];
      const p2 = profile[i];
      const mx = (getX(p1.distance) + getX(p2.distance)) / 2;
      const my = (getY(p1.elevation) + getY(p2.elevation)) / 2;
      fillPath.quadraticCurveTo(getX(p1.distance), getY(p1.elevation), mx, my);
    }
    fillPath.lineTo(getX(lastP.distance), getY(lastP.elevation));
    fillPath.lineTo(x + width, y + height);
    fillPath.lineTo(x, y + height);
    fillPath.closePath();

    if (config.profileGradient) {
      const grad = ctx.createLinearGradient(0, y, 0, y + height);
      grad.addColorStop(0, `${config.themeColor}cc`);
      grad.addColorStop(1, `${config.themeColor}10`);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = `${config.themeColor}44`;
    }
    ctx.fill(fillPath);
    ctx.restore();
  }

  // Line stroke
  ctx.strokeStyle = config.themeColor;
  ctx.lineWidth = 3.5 * scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Draw Min / Max Altitude labels (Much larger font for clear readability)
  ctx.font = `700 ${15 * scale}px ${getFontFamilyCSS(config.fontFamily)}`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.textAlign = 'right';
  ctx.fillText(`${maxAlt}m`, x + width, y + 14 * scale);
  ctx.fillText(`${minAlt}m`, x + width, y + height - 2 * scale);

  ctx.restore();
}

export function getFontFamilyCSS(font: OverlayConfig['fontFamily']): string {
  switch (font) {
    case 'outfit':
      return "'Outfit', sans-serif";
    case 'serif':
      return "'Playfair Display', serif";
    case 'mono':
      return "'JetBrains Mono', monospace";
    case 'display':
      return "'Space Grotesk', sans-serif";
    case 'inter':
    default:
      return "'Inter', sans-serif";
  }
}

// Compute dynamic bounding boxes of elements for hit-testing and dragging
export function getElementBoundingBoxes(
  width: number,
  height: number,
  config: OverlayConfig
): BoundingBox[] {
  const scale = width / 1080;
  const boxes: BoundingBox[] = [];

  const pos = config.positions;

  // Title Box
  if (config.showTitle) {
    const tScale = (config.titleScale || 1.25) * (pos.title?.scale || 1.0);
    const boxW = width * 0.88 * Math.min(1.2, tScale);
    const boxH = 110 * scale * tScale;
    const cx = (pos.title.x / 100) * width;
    const cy = (pos.title.y / 100) * height;
    boxes.push({
      id: 'title',
      label: 'Título y Fecha',
      x: cx - boxW / 2,
      y: cy - boxH / 2,
      width: boxW,
      height: boxH,
    });
  }

  // Track Box
  if (config.showTrack) {
    const trScale = (config.trackScale || 1.2) * (pos.track?.scale || 1.0);
    const boxW = width * 0.78 * trScale;
    const boxH = height * 0.32 * trScale;
    const cx = (pos.track.x / 100) * width;
    const cy = (pos.track.y / 100) * height;
    boxes.push({
      id: 'track',
      label: 'Trazado Track',
      x: cx - boxW / 2,
      y: cy - boxH / 2,
      width: boxW,
      height: boxH,
    });
  }

  // Stats Card Box
  if (config.showStats) {
    const stScale = (config.statsScale || 1.25) * (pos.stats?.scale || 1.0);
    const boxW = (width - 60 * scale) * Math.min(1.1, stScale);
    const boxH = 130 * scale * stScale;
    const cx = (pos.stats.x / 100) * width;
    const cy = (pos.stats.y / 100) * height;
    boxes.push({
      id: 'stats',
      label: 'Tarjeta de Métricas',
      x: cx - boxW / 2,
      y: cy - boxH / 2,
      width: boxW,
      height: boxH,
    });
  }

  // Profile Box
  if (config.showProfile) {
    const prScale = (config.profileScale || 1.15) * (pos.profile?.scale || 1.0);
    const boxW = (width - 60 * scale) * Math.min(1.1, prScale);
    const boxH = (config.profileHeight || 70) * scale * prScale + 30 * scale;
    const cx = (pos.profile.x / 100) * width;
    const cy = (pos.profile.y / 100) * height;
    boxes.push({
      id: 'profile',
      label: 'Perfil de Altimetría',
      x: cx - boxW / 2,
      y: cy - boxH / 2,
      width: boxW,
      height: boxH,
    });
  }

  return boxes;
}

// Master Canvas Rendering Function
export function renderComposition({
  canvas,
  image,
  track,
  config,
  exportScale = 1,
}: RenderCanvasOptions) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const scale = exportScale * (width / 1080); // normalized to 1080px base

  ctx.clearRect(0, 0, width, height);

  // 1. Draw Photo / Background
  if (image && image.complete && image.naturalWidth > 0) {
    ctx.save();

    let filters: string[] = [];
    if (config.photoBrightness !== 0) {
      filters.push(`brightness(${100 + config.photoBrightness}%)`);
    }
    if (config.photoContrast !== 0) {
      filters.push(`contrast(${100 + config.photoContrast}%)`);
    }
    if (config.photoBlur > 0) {
      filters.push(`blur(${config.photoBlur * scale}px)`);
    }

    if (config.photoFilter === 'cinematic') {
      filters.push('contrast(115%) saturate(85%) sepia(15%)');
    } else if (config.photoFilter === 'contrast') {
      filters.push('contrast(125%) saturate(110%)');
    } else if (config.photoFilter === 'vibrant') {
      filters.push('saturate(140%) contrast(108%)');
    } else if (config.photoFilter === 'blackwhite') {
      filters.push('grayscale(100%) contrast(120%)');
    } else if (config.photoFilter === 'warm') {
      filters.push('sepia(25%) saturate(115%)');
    }

    if (filters.length > 0) {
      ctx.filter = filters.join(' ');
    }

    // Cover crop with pan offset support
    const imgRatio = image.naturalWidth / image.naturalHeight;
    const canvasRatio = width / height;

    let sx = 0, sy = 0, sw = image.naturalWidth, sh = image.naturalHeight;
    if (imgRatio > canvasRatio) {
      sw = image.naturalHeight * canvasRatio;
      const maxPanX = image.naturalWidth - sw;
      // Normal center is maxPanX / 2. Offset ranges from -100 (left) to +100 (right)
      const offsetFactorX = Math.max(-1, Math.min(1, (config.photoOffsetX ?? 0) / 100));
      sx = (maxPanX / 2) + (offsetFactorX * (maxPanX / 2));
      sx = Math.max(0, Math.min(maxPanX, sx));
    } else {
      sh = image.naturalWidth / canvasRatio;
      const maxPanY = image.naturalHeight - sh;
      // Normal center is maxPanY / 2. Offset ranges from -100 (top) to +100 (bottom)
      const offsetFactorY = Math.max(-1, Math.min(1, (config.photoOffsetY ?? 0) / 100));
      sy = (maxPanY / 2) + (offsetFactorY * (maxPanY / 2));
      sy = Math.max(0, Math.min(maxPanY, sy));
    }

    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
    ctx.restore();
  } else {
    // Elegant fallback gradient when no photo is loaded
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#1e1b4b');
    bgGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Photo Vignette / Dimmer overlay for readability
  if (config.photoVignette) {
    ctx.save();
    const topGrad = ctx.createLinearGradient(0, 0, 0, height * 0.35);
    topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    topGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.25)');
    topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, width, height * 0.35);

    const botGrad = ctx.createLinearGradient(0, height * 0.5, 0, height);
    botGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    botGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.45)');
    botGrad.addColorStop(1, 'rgba(0, 0, 0, 0.88)');
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, height * 0.5, width, height * 0.5);
    ctx.restore();
  }

  if (!track) return;

  // 3. Render Overlays with dynamic positioning
  renderCustomizableComposition(ctx, track, config, width, height, scale);

  // 4. Watermark / Branding (if enabled)
  if (config.showWatermark && config.watermarkText) {
    ctx.save();
    const wX = (config.positions.watermark?.x ?? 92) / 100 * width;
    const wY = (config.positions.watermark?.y ?? 98) / 100 * height;
    ctx.font = `700 ${15 * scale}px ${getFontFamilyCSS(config.fontFamily)}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.letterSpacing = '2px';
    ctx.textAlign = 'right';
    ctx.fillText(config.watermarkText.toUpperCase(), wX, wY);
    ctx.restore();
  }
}

// Master Customizable Composition (Handles all templates + manual position overrides)
function renderCustomizableComposition(
  ctx: CanvasRenderingContext2D,
  track: TrackStats,
  config: OverlayConfig,
  width: number,
  height: number,
  scale: number
) {
  const fontFam = getFontFamilyCSS(config.fontFamily);
  const pos = config.positions;

  // 1. POSTER TEMPLATE FRAME
  if (config.template === 'poster') {
    const margin = 28 * scale;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

    ctx.textAlign = 'center';
    ctx.font = `700 ${14 * scale}px ${getFontFamilyCSS('inter')}`;
    ctx.fillStyle = config.themeColor;
    ctx.letterSpacing = '3px';
    ctx.fillText('• EXPEDICIÓN & RUTA •', width / 2, margin + 28 * scale);
    ctx.restore();
  }

  // 2. TITLE BLOCK (Positioned by pos.title)
  if (config.showTitle) {
    ctx.save();
    const tScale = (config.titleScale || 1.25) * (pos.title?.scale || 1.0);
    const titleX = (pos.title.x / 100) * width;
    const titleY = (pos.title.y / 100) * height;

    ctx.textAlign = 'center';

    // Date (comfortably above title to prevent any overlap)
    if (config.showDate && config.dateText) {
      ctx.font = `700 ${18 * tScale * scale}px ${fontFam}`;
      ctx.fillStyle = config.themeColor;
      ctx.fillText(config.dateText.toUpperCase(), titleX, titleY - 56 * tScale * scale);
    }

    // Main Title (MUCH LARGER: 48px scaled base)
    ctx.font = `900 ${48 * tScale * scale}px ${fontFam}`;
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 14 * scale;
    ctx.fillText(config.title, titleX, titleY);

    // Subtitle (comfortably below title)
    if (config.subtitle) {
      ctx.shadowBlur = 0;
      ctx.font = `600 ${22 * tScale * scale}px ${fontFam}`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.fillText(config.subtitle, titleX, titleY + 40 * tScale * scale);
    }
    ctx.restore();
  }

  // 3. TRACK POLYLINE (Positioned by pos.track)
  if (config.showTrack) {
    const trScale = (config.trackScale || 1.2) * (pos.track?.scale || 1.0);
    const trackW = width * 0.78 * trScale;
    const trackH = height * 0.32 * trScale;
    const trackX = (pos.track.x / 100) * width - trackW / 2;
    const trackY = (pos.track.y / 100) * height - trackH / 2;
    drawTrackPolyline(ctx, track, trackX, trackY, trackW, trackH, config, scale);
  }

  // 4. STATS CARD BLOCK (Positioned by pos.stats)
  if (config.showStats) {
    const stScale = (config.statsScale || 1.25) * (pos.stats?.scale || 1.0);
    const cardW = Math.min(width - 48 * scale, (width - 48 * scale) * stScale);
    const cardH = 120 * scale * stScale;
    const cardX = (pos.stats.x / 100) * width - cardW / 2;
    const cardY = (pos.stats.y / 100) * height - cardH / 2;

    ctx.save();
    if (config.cardOpacity > 0) {
      const cardAlpha = (config.cardOpacity / 100).toFixed(2);
      drawRoundRect(ctx, cardX, cardY, cardW, cardH, 24 * scale);
      ctx.fillStyle = `rgba(15, 23, 42, ${cardAlpha})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(0.25, (config.cardOpacity / 100) * 0.3)})`;
      ctx.lineWidth = 1.5 * scale;
      ctx.stroke();
    }

    const metricItems = getSelectedMetricItems(track, config.metrics);
    const count = Math.min(metricItems.length, 4);
    const colW = cardW / count;

    metricItems.slice(0, count).forEach((m, idx) => {
      const mx = cardX + idx * colW + colW / 2;
      const my = cardY + 38 * scale * stScale;

      ctx.textAlign = 'center';
      // Label (Larger font for readability)
      ctx.font = `700 ${15 * scale * stScale}px ${fontFam}`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fillText(m.label.toUpperCase(), mx, my);

      // Value (BIGGER, BOLDER NUMBERS: 38px base)
      ctx.font = `900 ${36 * scale * stScale}px ${fontFam}`;
      ctx.fillStyle = idx === 0 ? config.themeColor : '#FFFFFF';
      ctx.fillText(m.value, mx, my + 40 * scale * stScale);

      // Unit
      if (m.unit) {
        ctx.font = `700 ${15 * scale * stScale}px ${fontFam}`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText(m.unit, mx, my + 64 * scale * stScale);
      }
    });

    ctx.restore();
  }

  // 5. ELEVATION PROFILE BLOCK (Positioned by pos.profile)
  if (config.showProfile) {
    const prScale = (config.profileScale || 1.15) * (pos.profile?.scale || 1.0);
    const profW = (width - 64 * scale) * Math.min(1.05, prScale);
    const profH = (config.profileHeight || 70) * scale * prScale;
    const profX = (pos.profile.x / 100) * width - profW / 2;
    const profY = (pos.profile.y / 100) * height - profH / 2;

    if (config.cardOpacity > 0) {
      ctx.save();
      // Glass backdrop for profile
      drawRoundRect(ctx, profX - 10 * scale, profY - 10 * scale, profW + 20 * scale, profH + 20 * scale, 18 * scale);
      ctx.fillStyle = `rgba(10, 15, 28, ${(config.cardOpacity / 100 * 0.8).toFixed(2)})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(0.2, (config.cardOpacity / 100) * 0.25)})`;
      ctx.lineWidth = 1 * scale;
      ctx.stroke();
      ctx.restore();
    }

    drawElevationProfile(ctx, track, profX, profY, profW, profH, config, scale);
  }
}

// Helpers for metric values formatting
interface MetricItem {
  id: string;
  label: string;
  value: string;
  unit?: string;
}

function getSelectedMetricItems(track: TrackStats, metricKeys: string[]): MetricItem[] {
  const all: Record<string, MetricItem> = {
    distance: {
      id: 'distance',
      label: 'Distancia',
      value: track.distanceKm.toFixed(1),
      unit: 'km',
    },
    time: {
      id: 'time',
      label: 'Tiempo',
      value: formatDuration(track.movingTimeSec || track.elapsedTimeSec),
    },
    gain: {
      id: 'gain',
      label: 'Desnivel +',
      value: `+${track.elevationGainM.toLocaleString('es-ES')}`,
      unit: 'm',
    },
    speed: {
      id: 'speed',
      label: 'Vel. Media',
      value: track.avgSpeedKmh.toFixed(1),
      unit: 'km/h',
    },
    max_alt: {
      id: 'max_alt',
      label: 'Alt. Máxima',
      value: track.maxAltitudeM.toLocaleString('es-ES'),
      unit: 'm',
    },
    pace: {
      id: 'pace',
      label: 'Ritmo',
      value: formatPace(track.avgSpeedKmh),
    },
  };

  return metricKeys.map((key) => all[key] || all.distance);
}
