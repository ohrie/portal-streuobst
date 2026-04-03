import area from '@turf/area';
import bbox from '@turf/bbox';
import centerOfMass from '@turf/center-of-mass';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import type { Geometry, Polygon, MultiPolygon, Point } from 'geojson';
import type mapboxgl from 'mapbox-gl';

export interface SelectedFeature {
  id: string | number;
  sourceLayer: 'wiesen' | 'streuobstwiesen';
  areaM2: number;
  center: [number, number];
  name?: string;
  treeCount?: number; // undefined = zoom too low to count
  detectedTreeCount?: number; // from API tree detection
  treeDetectionFailed?: boolean; // API call returned an error
}

export function calculateAreaM2(geometry: Geometry): number {
  return area({ type: 'Feature', geometry, properties: {} });
}

export function getFeatureCenter(geometry: Geometry): [number, number] {
  if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
    const result = centerOfMass({ type: 'Feature', geometry: geometry as Polygon | MultiPolygon, properties: {} });
    return result.geometry.coordinates as [number, number];
  }
  // Fallback for non-polygon geometries
  const [minLng, minLat, maxLng, maxLat] = bbox({ type: 'Feature', geometry, properties: {} });
  return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
}

export function formatArea(m2: number): string {
  if (m2 < 10000) {
    return `${Math.round(m2).toLocaleString('de-DE')} m²`;
  }
  return `${(m2 / 10000).toLocaleString('de-DE', { maximumFractionDigits: 2 })} ha`;
}

/**
 * Counts trees from the 'baeume-circle' layer that are inside the given polygon.
 * Returns undefined if the tree layer isn't loaded yet (zoom < 10).
 */
export function countTreesInPolygon(
  map: mapboxgl.Map,
  geometry: Geometry
): number | undefined {
  if (map.getZoom() < 10) return undefined;

  const [minLng, minLat, maxLng, maxLat] = bbox({ type: 'Feature', geometry, properties: {} });
  const sw = map.project([minLng, minLat]);
  const ne = map.project([maxLng, maxLat]);

  const trees = map.queryRenderedFeatures(
    [[Math.min(sw.x, ne.x), Math.min(sw.y, ne.y)], [Math.max(sw.x, ne.x), Math.max(sw.y, ne.y)]],
    { layers: ['baeume-circle'] }
  );

  if (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon') return trees.length;

  const polygon = { type: 'Feature' as const, geometry: geometry as Polygon | MultiPolygon, properties: {} };
  return trees.filter(tree => booleanPointInPolygon(tree.geometry as Point, polygon)).length;
}
