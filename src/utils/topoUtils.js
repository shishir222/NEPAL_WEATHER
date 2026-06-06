import * as topojson from 'topojson-client';

/**
 * Convert a TopoJSON file to GeoJSON FeatureCollection.
 * @param {object} topoData - parsed TopoJSON object
 * @param {string} objectName - key inside topoData.objects
 */
export function toGeoJSON(topoData, objectName) {
  return topojson.feature(topoData, topoData.objects[objectName]);
}

/**
 * Compute centroid [lat, lon] from a GeoJSON geometry.
 * Returns Nepal's center as fallback.
 */
export function computeCentroid(geometry) {
  if (!geometry) return [28.2, 84.0];

  let coords = [];

  if (geometry.type === 'Polygon') {
    coords = geometry.coordinates[0];
  } else if (geometry.type === 'MultiPolygon') {
    // Use the largest polygon ring
    let maxLen = 0;
    for (const polygon of geometry.coordinates) {
      if (polygon[0].length > maxLen) {
        maxLen = polygon[0].length;
        coords = polygon[0];
      }
    }
  }

  if (!coords.length) return [28.2, 84.0];

  let sumLon = 0;
  let sumLat = 0;
  for (const [lon, lat] of coords) {
    sumLon += lon;
    sumLat += lat;
  }
  const n = coords.length;
  return [sumLat / n, sumLon / n]; // Leaflet uses [lat, lon]
}

/**
 * Get Leaflet-compatible [[minLat, minLon], [maxLat, maxLon]] bounds
 * from a GeoJSON geometry.
 */
export function getBounds(geometry) {
  if (!geometry) return null;

  const allCoords = [];

  function extract(c) {
    if (typeof c[0] === 'number') {
      allCoords.push(c);
    } else {
      c.forEach(extract);
    }
  }

  extract(geometry.coordinates);

  if (!allCoords.length) return null;

  const lats = allCoords.map((c) => c[1]);
  const lons = allCoords.map((c) => c[0]);

  return [
    [Math.min(...lats), Math.min(...lons)],
    [Math.max(...lats), Math.max(...lons)],
  ];
}

/**
 * Get a deterministic color for a string (e.g. district name).
 */
export function stringToColor(str) {
  const palette = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
    '#e11d48', '#0ea5e9', '#a855f7', '#22c55e',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}
