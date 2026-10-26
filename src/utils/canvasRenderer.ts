import type { TrackStats, OverlayConfig, AspectRatioType } from '../types';
import { formatDuration, formatPace } from './trackParsers';

export interface RenderCanvasOptions {
  canvas: HTMLCanvasElement;
  image: HTMLImageElement | null;
  track: TrackStats | null;
  config: OverlayConfig;
  exportScale?: number; // 1 for preview, 2-3 for high-res export
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
    // Fallback
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
    // Invert latitude because canvas Y is top-down
    const py = offsetY + ((maxLat - lat) / latSpan) * drawH;
    return [px, py];
  };

  ctx.save();

  // Glow effect
  if (config.trackGlow) {
    ctx.shadowColor = config.trackColor;
    ctx.shadowBlur = 14 * scale;
  }

  ctx.strokeStyle = config.trackColor;
  ctx.lineWidth = Math.max(2, config.trackWidth * scale);
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
    ctx.arc(startX, startY, 6 * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#10B981';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    // Finish point (Red / Finish checkered ring)
    const last = points[points.length - 1];
    const [endX, endY] = mapPoint(last.lat, last.lon);
    ctx.beginPath();
    ctx.arc(endX, endY, 6 * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#EF4444';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2 * scale;
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
  const getY = (ele: number) => y + height - ((ele - minAlt) / altSpan) * (height - 12 * scale);

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
      grad.addColorStop(0, `${config.themeColor}99`);
      grad.addColorStop(1, `${config.themeColor}05`);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = `${config.themeColor}33`;
    }
    ctx.fill(fillPath);
    ctx.restore();
  }

  // Line stroke
  ctx.strokeStyle = config.themeColor;
  ctx.lineWidth = 2.5 * scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Draw Min / Max Altitude labels
  ctx.font = `600 ${10 * scale}px ${getFontFamilyCSS(config.fontFamily)}`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.textAlign = 'right';
  ctx.fillText(`${maxAlt}m`, x + width, y + 10 * scale);
  ctx.fillText(`${minAlt}m`, x + width, y + height);

  ctx.restore();
}

function getFontFamilyCSS(font: OverlayConfig['fontFamily']): string {
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

    // Filters
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

    // Cover crop
    const imgRatio = image.naturalWidth / image.naturalHeight;
    const canvasRatio = width / height;

    let sx = 0, sy = 0, sw = image.naturalWidth, sh = image.naturalHeight;
    if (imgRatio > canvasRatio) {
      sw = image.naturalHeight * canvasRatio;
      sx = (image.naturalWidth - sw) / 2;
    } else {
      sh = image.naturalWidth / canvasRatio;
      sy = (image.naturalHeight - sh) / 2;
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
    // Top shadow for title
    const topGrad = ctx.createLinearGradient(0, 0, 0, height * 0.35);
    topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
    topGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.2)');
    topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, width, height * 0.35);

    // Bottom shadow for stats & profile
    const botGrad = ctx.createLinearGradient(0, height * 0.55, 0, height);
    botGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    botGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.35)');
    botGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, height * 0.55, width, height * 0.45);
    ctx.restore();
  }

  if (!track) return;

  // 3. Render Overlays according to Template
  if (config.template === 'poster') {
    renderPosterTemplate(ctx, track, config, width, height, scale);
  } else if (config.template === 'minimal') {
    renderMinimalTemplate(ctx, track, config, width, height, scale);
  } else if (config.template === 'social_story') {
    renderSocialStoryTemplate(ctx, track, config, width, height, scale);
  } else {
    // Default 'sport' template
    renderSportTemplate(ctx, track, config, width, height, scale);
  }

  // 4. Watermark / Branding (if enabled)
  if (config.showWatermark && config.watermarkText) {
    ctx.save();
    ctx.font = `700 ${11 * scale}px ${getFontFamilyCSS(config.fontFamily)}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.letterSpacing = '2px';
    ctx.textAlign = 'right';
    ctx.fillText(config.watermarkText.toUpperCase(), width - 32 * scale, height - 20 * scale);
    ctx.restore();
  }
}

// ==========================================
// TEMPLATE 1: SPORT PRO (Strava / Athletic HUD)
// ==========================================
function renderSportTemplate(
  ctx: CanvasRenderingContext2D,
  track: TrackStats,
  config: OverlayConfig,
  width: number,
  height: number,
  scale: number
) {
  const pad = 36 * scale;
  const fontFam = getFontFamilyCSS(config.fontFamily);

  // TOP SECTION: Title & Date
  if (config.showTitle || config.showDate) {
    ctx.save();
    let topY = pad + 15 * scale;

    if (config.showDate && config.dateText) {
      ctx.font = `700 ${12 * scale}px ${fontFam}`;
      ctx.fillStyle = config.themeColor;
      ctx.fillText(config.dateText.toUpperCase(), pad, topY);
      topY += 24 * scale;
    }

    if (config.showTitle) {
      ctx.font = `900 ${32 * scale}px ${fontFam}`;
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 10 * scale;
      ctx.fillText(config.title, pad, topY);

      if (config.subtitle) {
        topY += 22 * scale;
        ctx.font = `600 ${14 * scale}px ${fontFam}`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillText(config.subtitle, pad, topY);
      }
    }
    ctx.restore();
  }

  // MIDDLE / CENTER: Track Polyline
  if (config.showTrack) {
    const trackBoxW = width * 0.75;
    const trackBoxH = height * 0.32;
    const trackBoxX = (width - trackBoxW) / 2;
    const trackBoxY = height * 0.28;
    drawTrackPolyline(ctx, track, trackBoxX, trackBoxY, trackBoxW, trackBoxH, config, scale);
  }

  // BOTTOM SECTION: HUD Card with Stats & Elevation Profile
  const cardW = width - pad * 2;
  const cardH = 210 * scale;
  const cardX = pad;
  const cardY = height - cardH - pad;

  ctx.save();
  const cardAlpha = (config.cardOpacity / 100).toFixed(2);
  drawRoundRect(ctx, cardX, cardY, cardW, cardH, 24 * scale);
  ctx.fillStyle = `rgba(15, 23, 42, ${cardAlpha})`;
  ctx.fill();
  ctx.strokeStyle = `rgba(255, 255, 255, 0.15)`;
  ctx.lineWidth = 1 * scale;
  ctx.stroke();

  // Metrics Grid
  if (config.showStats) {
    const metricItems = getSelectedMetricItems(track, config.metrics);
    const colCount = Math.min(metricItems.length, 4);
    const colW = cardW / colCount;

    metricItems.slice(0, colCount).forEach((m, idx) => {
      const mx = cardX + idx * colW + colW / 2;
      const my = cardY + 36 * scale;

      ctx.textAlign = 'center';
      // Label
      ctx.font = `700 ${11 * scale}px ${fontFam}`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText(m.label.toUpperCase(), mx, my);

      // Value
      ctx.font = `900 ${22 * scale}px ${fontFam}`;
      ctx.fillStyle = idx === 0 ? config.themeColor : '#FFFFFF';
      ctx.fillText(m.value, mx, my + 26 * scale);

      // Unit
      if (m.unit) {
        ctx.font = `600 ${11 * scale}px ${fontFam}`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(m.unit, mx, my + 42 * scale);
      }
    });
  }

  // Elevation Profile inside Bottom HUD
  if (config.showProfile) {
    const profW = cardW - 36 * scale;
    const profH = 64 * scale;
    const profX = cardX + 18 * scale;
    const profY = cardY + cardH - profH - 18 * scale;
    drawElevationProfile(ctx, track, profX, profY, profW, profH, config, scale);
  }

  ctx.restore();
}

// ==========================================
// TEMPLATE 2: MINIMALIST CLEAN (Refined Glass)
// ==========================================
function renderMinimalTemplate(
  ctx: CanvasRenderingContext2D,
  track: TrackStats,
  config: OverlayConfig,
  width: number,
  height: number,
  scale: number
) {
  const pad = 36 * scale;
  const fontFam = getFontFamilyCSS(config.fontFamily);

  // TOP: Clean minimal header
  if (config.showTitle) {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.font = `700 ${24 * scale}px ${fontFam}`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(config.title, pad, pad + 20 * scale);

    if (config.showDate && config.dateText) {
      ctx.font = `500 ${12 * scale}px ${fontFam}`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(config.dateText, pad, pad + 38 * scale);
    }
    ctx.restore();
  }

  // CENTER: Subtle, elegant track drawing
  if (config.showTrack) {
    const trackW = width * 0.7;
    const trackH = height * 0.35;
    const trackX = (width - trackW) / 2;
    const trackY = height * 0.28;
    drawTrackPolyline(ctx, track, trackX, trackY, trackW, trackH, config, scale);
  }

  // BOTTOM: Minimalist frosted pill
  const pillW = width - pad * 2;
  const pillH = 150 * scale;
  const pillX = pad;
  const pillY = height - pillH - pad;

  ctx.save();
  const cardAlpha = (config.cardOpacity / 100).toFixed(2);
  drawRoundRect(ctx, pillX, pillY, pillW, pillH, 20 * scale);
  ctx.fillStyle = `rgba(10, 15, 25, ${cardAlpha})`;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1 * scale;
  ctx.stroke();

  // Metrics horizontal clean flow
  if (config.showStats) {
    const metricItems = getSelectedMetricItems(track, config.metrics);
    const count = Math.min(metricItems.length, 4);
    const itemW = pillW / count;

    metricItems.slice(0, count).forEach((m, idx) => {
      const mx = pillX + idx * itemW + itemW / 2;
      const my = pillY + 30 * scale;

      ctx.textAlign = 'center';
      ctx.font = `500 ${10 * scale}px ${fontFam}`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fillText(m.label.toUpperCase(), mx, my);

      ctx.font = `700 ${18 * scale}px ${fontFam}`;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`${m.value} ${m.unit || ''}`.trim(), mx, my + 22 * scale);
    });
  }

  // Profile
  if (config.showProfile) {
    const profW = pillW - 32 * scale;
    const profH = 45 * scale;
    const profX = pillX + 16 * scale;
    const profY = pillY + pillH - profH - 14 * scale;
    drawElevationProfile(ctx, track, profX, profY, profW, profH, config, scale);
  }

  ctx.restore();
}

// ==========================================
// TEMPLATE 3: OUTDOOR POSTER (Editorial / National Geographic style)
// ==========================================
function renderPosterTemplate(
  ctx: CanvasRenderingContext2D,
  track: TrackStats,
  config: OverlayConfig,
  width: number,
  height: number,
  scale: number
) {
  const margin = 28 * scale;
  const fontFam = getFontFamilyCSS(config.fontFamily);

  // Outer Border Frame
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1.5 * scale;
  ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

  // Top Expedition Header
  ctx.textAlign = 'center';
  ctx.font = `700 ${10 * scale}px ${getFontFamilyCSS('inter')}`;
  ctx.fillStyle = config.themeColor;
  ctx.letterSpacing = '3px';
  ctx.fillText('• EXPEDICION & TRAIL •', width / 2, margin + 26 * scale);

  // Center/Top Title
  if (config.showTitle) {
    ctx.font = `800 ${28 * scale}px ${fontFam}`;
    ctx.fillStyle = '#FFFFFF';
    ctx.letterSpacing = '0px';
    ctx.fillText(config.title, width / 2, margin + 58 * scale);

    if (config.subtitle) {
      ctx.font = `italic 500 ${14 * scale}px ${fontFam}`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(config.subtitle, width / 2, margin + 80 * scale);
    }
  }

  // Track polyline in upper-middle
  if (config.showTrack) {
    const trackW = width * 0.65;
    const trackH = height * 0.3;
    const trackX = (width - trackW) / 2;
    const trackY = height * 0.28;
    drawTrackPolyline(ctx, track, trackX, trackY, trackW, trackH, config, scale);
  }

  // Bottom Box with Coordinates & Elevation Profile
  const bY = height - 190 * scale;

  if (config.showProfile) {
    const profW = width - margin * 4;
    const profH = 50 * scale;
    const profX = margin * 2;
    drawElevationProfile(ctx, track, profX, bY, profW, profH, config, scale);
  }

  // Bottom Stats Row with Elegant Divider Lines
  if (config.showStats) {
    const metricItems = getSelectedMetricItems(track, config.metrics);
    const count = Math.min(metricItems.length, 4);
    const step = (width - margin * 4) / count;

    metricItems.slice(0, count).forEach((m, idx) => {
      const mx = margin * 2 + idx * step + step / 2;
      const my = bY + 80 * scale;

      ctx.textAlign = 'center';
      ctx.font = `600 ${10 * scale}px ${getFontFamilyCSS('inter')}`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText(m.label.toUpperCase(), mx, my);

      ctx.font = `700 ${20 * scale}px ${fontFam}`;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(m.value, mx, my + 24 * scale);

      ctx.font = `500 ${10 * scale}px ${getFontFamilyCSS('inter')}`;
      ctx.fillStyle = config.themeColor;
      ctx.fillText(m.unit || '', mx, my + 38 * scale);
    });
  }

  ctx.restore();
}

// ==========================================
// TEMPLATE 4: SOCIAL STORY 9:16 (High Engagement / Cyber Glow)
// ==========================================
function renderSocialStoryTemplate(
  ctx: CanvasRenderingContext2D,
  track: TrackStats,
  config: OverlayConfig,
  width: number,
  height: number,
  scale: number
) {
  const pad = 32 * scale;
  const fontFam = getFontFamilyCSS(config.fontFamily);

  // Big Bold Top Typography
  if (config.showTitle) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = `900 ${36 * scale}px ${fontFam}`;
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = config.themeColor;
    ctx.shadowBlur = 12 * scale;
    ctx.fillText(config.title, width / 2, height * 0.12);

    if (config.subtitle) {
      ctx.shadowBlur = 0;
      ctx.font = `600 ${14 * scale}px ${fontFam}`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText(config.subtitle, width / 2, height * 0.12 + 26 * scale);
    }
    ctx.restore();
  }

  // Giant glowing track in center
  if (config.showTrack) {
    const trackW = width * 0.8;
    const trackH = height * 0.38;
    const trackX = (width - trackW) / 2;
    const trackY = height * 0.22;
    drawTrackPolyline(ctx, track, trackX, trackY, trackW, trackH, config, scale);
  }

  // Dynamic Floating Stat Cards
  if (config.showStats) {
    const metricItems = getSelectedMetricItems(track, config.metrics);
    const count = Math.min(metricItems.length, 3);
    const cardW = (width - pad * 2 - (count - 1) * 12 * scale) / count;
    const cardH = 68 * scale;
    const cardY = height * 0.65;

    metricItems.slice(0, count).forEach((m, idx) => {
      const cx = pad + idx * (cardW + 12 * scale);
      ctx.save();
      drawRoundRect(ctx, cx, cardY, cardW, cardH, 16 * scale);
      ctx.fillStyle = 'rgba(8, 12, 22, 0.8)';
      ctx.fill();
      ctx.strokeStyle = `${config.themeColor}55`;
      ctx.lineWidth = 1 * scale;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = `700 ${10 * scale}px ${fontFam}`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText(m.label.toUpperCase(), cx + cardW / 2, cardY + 22 * scale);

      ctx.font = `900 ${19 * scale}px ${fontFam}`;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`${m.value} ${m.unit || ''}`.trim(), cx + cardW / 2, cardY + 48 * scale);
      ctx.restore();
    });
  }

  // Bottom Elevation Banner
  if (config.showProfile) {
    const profW = width - pad * 2;
    const profH = 75 * scale;
    const profX = pad;
    const profY = height - profH - 36 * scale;

    ctx.save();
    drawRoundRect(ctx, profX, profY - 10 * scale, profW, profH + 10 * scale, 20 * scale);
    ctx.fillStyle = 'rgba(10, 15, 28, 0.75)';
    ctx.fill();
    ctx.restore();

    drawElevationProfile(ctx, track, profX + 16 * scale, profY, profW - 32 * scale, profH - 12 * scale, config, scale);
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
