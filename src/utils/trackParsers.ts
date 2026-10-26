import type { TrackStats, TrackPoint, ElevationPoint } from '../types';
// @ts-ignore
import FitParser from 'fit-file-parser';

// Haversine formula to compute distance in km between two lat/lon pairs
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Format duration into hh:mm:ss or mm:ss
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
  }
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}

export function formatTimeDigital(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatPace(avgSpeedKmh: number): string {
  if (!avgSpeedKmh || avgSpeedKmh <= 0) return "--:--";
  const paceMinutes = 60 / avgSpeedKmh;
  const mins = Math.floor(paceMinutes);
  const secs = Math.round((paceMinutes - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')} /km`;
}

// Downsample points to keep polyline rendering fast & smooth
export function simplifyPoints(points: TrackPoint[], maxTarget = 1500): TrackPoint[] {
  if (points.length <= maxTarget) return points;
  const step = Math.ceil(points.length / maxTarget);
  const sampled: TrackPoint[] = [];
  for (let i = 0; i < points.length; i += step) {
    sampled.push(points[i]);
  }
  // Ensure the very last point is kept
  if (sampled[sampled.length - 1] !== points[points.length - 1]) {
    sampled.push(points[points.length - 1]);
  }
  return sampled;
}

// Process raw points into full TrackStats
export function processRawPoints(
  rawPoints: { lat: number; lon: number; ele?: number; time?: Date }[],
  title = 'Ruta',
  fileDate?: Date
): TrackStats {
  if (rawPoints.length === 0) {
    throw new Error('El archivo no contiene puntos de track válidos.');
  }

  let totalDistanceKm = 0;
  let elevationGainM = 0;
  let elevationLossM = 0;
  let maxAlt = -Infinity;
  let minAlt = Infinity;
  let movingTimeSec = 0;

  const points: TrackPoint[] = [];
  const elevationProfile: ElevationPoint[] = [];

  let minLat = 90;
  let maxLat = -90;
  let minLon = 180;
  let maxLon = -180;

  let lastEle: number | undefined;

  for (let i = 0; i < rawPoints.length; i++) {
    const pt = rawPoints[i];
    minLat = Math.min(minLat, pt.lat);
    maxLat = Math.max(maxLat, pt.lat);
    minLon = Math.min(minLon, pt.lon);
    maxLon = Math.max(maxLon, pt.lon);

    if (i > 0) {
      const prev = rawPoints[i - 1];
      const dist = haversineDistance(prev.lat, prev.lon, pt.lat, pt.lon);
      totalDistanceKm += dist;

      // Time difference & moving time calculation
      if (pt.time && prev.time) {
        const timeDiffSec = (pt.time.getTime() - prev.time.getTime()) / 1000;
        if (timeDiffSec > 0 && timeDiffSec < 120) {
          const speed = (dist / timeDiffSec) * 3600;
          if (speed > 1.2) {
            // Only count if moving faster than 1.2 km/h
            movingTimeSec += timeDiffSec;
          }
        }
      }
    }

    if (pt.ele !== undefined && !isNaN(pt.ele)) {
      maxAlt = Math.max(maxAlt, pt.ele);
      minAlt = Math.min(minAlt, pt.ele);

      if (lastEle !== undefined) {
        const diff = pt.ele - lastEle;
        // Threshold filter of 1.5m to avoid GPS jitter false gain
        if (diff > 1.5) {
          elevationGainM += diff;
          lastEle = pt.ele;
        } else if (diff < -1.5) {
          elevationLossM += Math.abs(diff);
          lastEle = pt.ele;
        }
      } else {
        lastEle = pt.ele;
      }

      elevationProfile.push({
        distance: totalDistanceKm,
        elevation: Math.round(pt.ele),
      });
    }

    points.push({
      lat: pt.lat,
      lon: pt.lon,
      ele: pt.ele,
      time: pt.time,
      distance: totalDistanceKm,
    });
  }

  // Fallbacks if no elevation data found
  if (minAlt === Infinity) minAlt = 0;
  if (maxAlt === -Infinity) maxAlt = 0;

  // Calculate total elapsed time from start and finish timestamps
  const startTime = rawPoints[0].time;
  const endTime = rawPoints[rawPoints.length - 1].time;
  let elapsedTimeSec = 0;
  if (startTime && endTime) {
    elapsedTimeSec = Math.max(0, (endTime.getTime() - startTime.getTime()) / 1000);
  }
  if (movingTimeSec === 0 && elapsedTimeSec > 0) {
    movingTimeSec = elapsedTimeSec;
  }

  // Average speed
  const activeHours = (movingTimeSec > 0 ? movingTimeSec : elapsedTimeSec) / 3600;
  const avgSpeedKmh = activeHours > 0 ? totalDistanceKm / activeHours : 0;

  // Downsample profile for performance (keep around 200-300 points)
  const sampledProfile: ElevationPoint[] = [];
  if (elevationProfile.length > 250) {
    const step = Math.ceil(elevationProfile.length / 250);
    for (let i = 0; i < elevationProfile.length; i += step) {
      sampledProfile.push(elevationProfile[i]);
    }
    sampledProfile.push(elevationProfile[elevationProfile.length - 1]);
  } else {
    sampledProfile.push(...elevationProfile);
  }

  const effectiveDate = startTime || fileDate || new Date();
  const dateFormatted = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(effectiveDate);

  return {
    title,
    date: dateFormatted,
    distanceKm: Number(totalDistanceKm.toFixed(2)),
    movingTimeSec: Math.round(movingTimeSec),
    elapsedTimeSec: Math.round(elapsedTimeSec),
    elevationGainM: Math.round(elevationGainM),
    elevationLossM: Math.round(elevationLossM),
    maxAltitudeM: Math.round(maxAlt),
    minAltitudeM: Math.round(minAlt),
    avgSpeedKmh: Number(avgSpeedKmh.toFixed(1)),
    maxSpeedKmh: Number((avgSpeedKmh * 1.6).toFixed(1)), // Estimated max speed
    points: simplifyPoints(points, 2000),
    elevationProfile: sampledProfile,
    bounds: {
      minLat,
      maxLat,
      minLon,
      maxLon,
    },
  };
}

// Parse GPX text
export function parseGPX(gpxContent: string, fileName?: string): TrackStats {
  const parser = new DOMParser();
  const xml = parser.parseFromString(gpxContent, 'application/xml');

  const parserError = xml.querySelector('parsererror');
  if (parserError) {
    throw new Error('Error al analizar el archivo XML de GPX.');
  }

  // Get route title
  let title = 'Mi Ruta';
  const nameNode = xml.querySelector('trk > name') || xml.querySelector('metadata > name');
  if (nameNode && nameNode.textContent?.trim()) {
    title = nameNode.textContent.trim();
  } else if (fileName) {
    title = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  }

  // Extract points (from trkpt or rtept or wpt)
  let ptNodes = Array.from(xml.querySelectorAll('trkpt'));
  if (ptNodes.length === 0) {
    ptNodes = Array.from(xml.querySelectorAll('rtept'));
  }
  if (ptNodes.length === 0) {
    ptNodes = Array.from(xml.querySelectorAll('wpt'));
  }

  if (ptNodes.length === 0) {
    throw new Error('No se encontraron coordenadas GPS en este archivo GPX.');
  }

  const rawPoints = ptNodes.map((node) => {
    const lat = parseFloat(node.getAttribute('lat') || '0');
    const lon = parseFloat(node.getAttribute('lon') || '0');
    const eleNode = node.querySelector('ele');
    const timeNode = node.querySelector('time');

    const ele = eleNode && eleNode.textContent ? parseFloat(eleNode.textContent) : undefined;
    const time = timeNode && timeNode.textContent ? new Date(timeNode.textContent) : undefined;

    return { lat, lon, ele, time };
  });

  return processRawPoints(rawPoints, title);
}

// Parse FIT ArrayBuffer using fit-file-parser
export function parseFIT(buffer: ArrayBuffer, fileName?: string): Promise<TrackStats> {
  return new Promise((resolve, reject) => {
    try {
      const fitParser = new FitParser({
        force: true,
        speedUnit: 'km/h',
        lengthUnit: 'km',
        temperatureUnit: 'celsius',
        elapsedRecordField: true,
        mode: 'cascade',
      });

      fitParser.parse(buffer, (error: any, data: any) => {
        if (error) {
          reject(new Error(`Error al leer el archivo FIT: ${error}`));
          return;
        }

        if (!data || !data.records || data.records.length === 0) {
          reject(new Error('El archivo FIT no contiene registros de posición válidos.'));
          return;
        }

        const rawPoints: { lat: number; lon: number; ele?: number; time?: Date }[] = [];

        for (const record of data.records) {
          let lat = record.position_lat;
          let lon = record.position_long;

          // Convert semicircles to degrees if needed (semicircles are integers > 180)
          if (lat !== undefined && lon !== undefined) {
            if (Math.abs(lat) > 180) {
              lat = lat * (180 / 2147483648);
            }
            if (Math.abs(lon) > 180) {
              lon = lon * (180 / 2147483648);
            }

            rawPoints.push({
              lat,
              lon,
              ele: record.altitude,
              time: record.timestamp ? new Date(record.timestamp) : undefined,
            });
          }
        }

        if (rawPoints.length === 0) {
          reject(new Error('El archivo FIT no tiene puntos GPS (latitud/longitud).'));
          return;
        }

        let title = fileName ? fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : 'Ruta FIT';
        if (data.activity && data.activity.sessions && data.activity.sessions[0]?.sport) {
          const sport = data.activity.sessions[0].sport;
          title = `${sport.charAt(0).toUpperCase() + sport.slice(1)} Route`;
        }

        const stats = processRawPoints(rawPoints, title);

        // If session summary is present in FIT, use exact values recorded by device
        const session = data.activity?.sessions?.[0] || data.sessions?.[0];
        if (session) {
          if (session.total_distance !== undefined && session.total_distance > 0) {
            // in km or meters depending on parser unit
            stats.distanceKm = Number((session.total_distance > 100 ? session.total_distance / 1000 : session.total_distance).toFixed(2));
          }
          if (session.total_ascent !== undefined && session.total_ascent > 0) {
            stats.elevationGainM = Math.round(session.total_ascent);
          }
          if (session.total_timer_time !== undefined && session.total_timer_time > 0) {
            stats.movingTimeSec = Math.round(session.total_timer_time);
          }
          if (session.total_elapsed_time !== undefined && session.total_elapsed_time > 0) {
            stats.elapsedTimeSec = Math.round(session.total_elapsed_time);
          }
          if (session.avg_speed !== undefined && session.avg_speed > 0) {
            stats.avgSpeedKmh = Number((session.avg_speed > 50 ? session.avg_speed * 3.6 : session.avg_speed).toFixed(1));
          }
        }

        resolve(stats);
      });
    } catch (err: any) {
      reject(new Error(`Fallo al procesar el archivo .FIT: ${err?.message || err}`));
    }
  });
}
