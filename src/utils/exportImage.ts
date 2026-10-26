import confetti from 'canvas-confetti';
import type { TrackStats, OverlayConfig } from '../types';
import { renderComposition, getAspectRatioValue } from './canvasRenderer';

export async function exportHighResImage(
  image: HTMLImageElement | null,
  track: TrackStats | null,
  config: OverlayConfig,
  fileName = 'fotoruta.png'
): Promise<string> {
  // Target high resolution: standard 1080px base width, or 2160px for Ultra HD
  const baseWidth = 1440;
  const ratio = getAspectRatioValue(
    config.aspectRatio,
    image?.naturalWidth || 1080,
    image?.naturalHeight || 1920
  );
  const baseHeight = Math.round(baseWidth / ratio);

  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = baseWidth;
  offscreenCanvas.height = baseHeight;

  renderComposition({
    canvas: offscreenCanvas,
    image,
    track,
    config,
    exportScale: 1, // Normalized to full 1440px canvas
  });

  // Try Web Share API with File (Native Android share sheet for Instagram, WhatsApp, Strava)
  const blob = await new Promise<Blob | null>((resolve) =>
    offscreenCanvas.toBlob(resolve, 'image/png', 0.95)
  );

  if (!blob) {
    throw new Error('No se pudo generar la imagen para exportar.');
  }

  const file = new File([blob], fileName, { type: 'image/png' });

  // If mobile navigator.canShare supports files, offer native share
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: config.title || 'Mi Fotoruta',
        text: `Ruta: ${config.title} - ${track?.distanceKm || 0} km, +${track?.elevationGainM || 0}m D+`,
      });
      triggerConfetti();
      return 'shared';
    } catch (shareErr: any) {
      if (shareErr.name === 'AbortError') {
        return 'aborted';
      }
      // If user cancelled or failed, fall through to download
    }
  }

  // Fallback / Desktop browser download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 10000);
  triggerConfetti();
  return 'downloaded';
}

export function triggerConfetti() {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#FF5500', '#00F0FF', '#10B981', '#F59E0B', '#FFFFFF'],
    });
  } catch (e) {
    // ignore
  }
}
