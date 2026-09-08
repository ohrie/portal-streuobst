/**
 * Abdeckung der historischen Luftbilder (LGL-BW) pro Erfassungsjahr.
 *
 * Der WMS meldet in seinen Capabilities nur eine einzige BBox für ganz
 * Baden-Württemberg, obwohl pro Jahr immer nur ein Teil des Landes beflogen
 * wurde. Die tatsächliche Abdeckung wird deshalb offline abgetastet
 * (data-processing/build_historical_aerial_coverage.py) und hier als grobes
 * Raster geladen, damit die Kartenansicht nur Jahre anbietet, die im aktuellen
 * Ausschnitt auch wirklich Bilder liefern.
 */

const COVERAGE_URL = "/data/historical-aerial-coverage.json";

interface CoverageFile {
  bbox: [number, number, number, number]; // EPSG:3857: minx, miny, maxx, maxy
  cellSize: number;
  cols: number;
  rows: number;
  years: Record<string, { endpoint: string; runs: number[] }>;
}

interface YearMask {
  /** Ein Bit pro Rasterzelle, zeilenweise von Nord nach Süd. */
  bits: Uint8Array;
  /** Pro Rasterzeile: enthält sie überhaupt abgedeckte Zellen? */
  rowHasData: Uint8Array;
}

export interface AerialCoverage {
  minX: number;
  maxY: number;
  cellSize: number;
  cols: number;
  rows: number;
  masks: Map<string, YearMask>;
}

export interface LngLatBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

const EARTH_RADIUS = 6378137;
const MAX_LATITUDE = 85.051129;

function lngToMercatorX(lng: number): number {
  return (EARTH_RADIUS * lng * Math.PI) / 180;
}

function latToMercatorY(lat: number): number {
  const clamped = Math.min(MAX_LATITUDE, Math.max(-MAX_LATITUDE, lat));
  return (
    EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + (clamped * Math.PI) / 360))
  );
}

/** Wandelt die Lauflängenkodierung in eine Bitmaske um. */
function decodeRuns(runs: number[], cols: number, rows: number): YearMask {
  const cellCount = cols * rows;
  const bits = new Uint8Array(Math.ceil(cellCount / 8));
  const rowHasData = new Uint8Array(rows);
  let index = 0;
  let covered = false; // erster Lauf ist immer "nicht abgedeckt"

  for (const runLength of runs) {
    if (covered) {
      for (let i = index; i < index + runLength && i < cellCount; i++) {
        bits[i >> 3] |= 1 << (i & 7);
        rowHasData[(i / cols) | 0] = 1;
      }
    }
    index += runLength;
    covered = !covered;
  }

  return { bits, rowHasData };
}

let cached: Promise<AerialCoverage | null> | null = null;

/** Lädt die Abdeckungsdaten einmalig; bei Fehlern wird null geliefert. */
export function loadAerialCoverage(): Promise<AerialCoverage | null> {
  if (cached) return cached;
  cached = fetch(COVERAGE_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<CoverageFile>;
    })
    .then((data) => {
      const masks = new Map<string, YearMask>();
      for (const [year, entry] of Object.entries(data.years)) {
        masks.set(year, decodeRuns(entry.runs, data.cols, data.rows));
      }
      return {
        minX: data.bbox[0],
        maxY: data.bbox[3],
        cellSize: data.cellSize,
        cols: data.cols,
        rows: data.rows,
        masks,
      };
    })
    .catch((err) => {
      console.warn("Abdeckung der historischen Luftbilder nicht geladen:", err);
      cached = null; // späterer Versuch darf es erneut probieren
      return null;
    });
  return cached;
}

/** Rasterausschnitt (inklusive Grenzen) für die gegebenen Kartengrenzen. */
function cellRange(coverage: AerialCoverage, bounds: LngLatBounds) {
  const { minX, maxY, cellSize, cols, rows } = coverage;
  const colStart = Math.floor((lngToMercatorX(bounds.west) - minX) / cellSize);
  const colEnd = Math.floor((lngToMercatorX(bounds.east) - minX) / cellSize);
  const rowStart = Math.floor((maxY - latToMercatorY(bounds.north)) / cellSize);
  const rowEnd = Math.floor((maxY - latToMercatorY(bounds.south)) / cellSize);
  return {
    colStart: Math.max(0, colStart),
    colEnd: Math.min(cols - 1, colEnd),
    rowStart: Math.max(0, rowStart),
    rowEnd: Math.min(rows - 1, rowEnd),
  };
}

function maskIntersects(
  coverage: AerialCoverage,
  mask: YearMask,
  range: ReturnType<typeof cellRange>,
): boolean {
  for (let row = range.rowStart; row <= range.rowEnd; row++) {
    if (!mask.rowHasData[row]) continue;
    const rowOffset = row * coverage.cols;
    for (let col = range.colStart; col <= range.colEnd; col++) {
      const index = rowOffset + col;
      if (mask.bits[index >> 3] & (1 << (index & 7))) return true;
    }
  }
  return false;
}

/**
 * Jahre, die im gegebenen Kartenausschnitt Luftbilder liefern.
 * Liegt der Ausschnitt komplett außerhalb des Rasters, ist das Ergebnis leer.
 */
export function yearsCoveringBounds(
  coverage: AerialCoverage,
  bounds: LngLatBounds,
): Set<string> {
  const range = cellRange(coverage, bounds);
  const available = new Set<string>();
  if (range.colStart > range.colEnd || range.rowStart > range.rowEnd) {
    return available;
  }
  for (const [year, mask] of coverage.masks) {
    if (maskIntersects(coverage, mask, range)) available.add(year);
  }
  return available;
}
