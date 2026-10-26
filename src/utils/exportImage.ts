import confetti from 'canvas-confetti';
import type { TrackStats, OverlayConfig } from '../types';
import { renderComposition, getAspectRatioValue } from './canvasRenderer';

export type ExportResult = 'gallery' | 'shared' | 'downloaded' | 'aborted';

export async function exportHighResImage(
  image: HTMLImageElement | null,
  track: TrackStats | null,
  config: OverlayConfig,
  fileName = 'rutagram.png'
): Promise<ExportResult> {
  // Ultra HD high resolution: 1440px base width
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

  // 1. Android Native App: Save directly to Android Gallery (MediaStore Pictures/Rutagram)
  const androidGallery = (window as any).AndroidGallery;
  if (androidGallery && typeof androidGallery.saveImageToGallery === 'function') {
    try {
      const dataUrl = offscreenCanvas.toDataURL('image/png', 0.95);
      const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      const success = androidGallery.saveImageToGallery(base64Data, fileName);
      if (success) {
        triggerConfetti();
        return 'gallery';
      }
    } catch (err) {
      console.warn('Native Android Gallery save error, trying web fallback:', err);
    }
  }

  // 2. Try Web Share API with File (e.g. mobile Safari / Chrome)
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
        title: config.title || 'Mi Rutagram',
        text: `Ruta: ${config.title} - ${track?.distanceKm || 0} km, +${track?.elevationGainM || 0}m D+`,
      });
      triggerConfetti();
      return 'shared';
    } catch (shareErr: any) {
      if (shareErr.name === 'AbortError') {
        return 'aborted';
      }
    }
  }

  // 3. Fallback / Desktop browser download
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
