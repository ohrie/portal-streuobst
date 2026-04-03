/**
 * Persistiert die Messmodusflächen-Auswahl im localStorage.
 * Erkannte Baumzahlen werden gespeichert; die GeoJSON-Geometrie
 * für den detected-trees-Layer wird beim Wiederherstellen aus
 * dem IndexedDB-Cache (treeDetectionCache) nachgeladen.
 */

import type { SelectedFeature } from '@/lib/geoArea';

const KEY = 'measure-session-v1';

export interface MeasureSession {
  features: SelectedFeature[];
}

export function saveMeasureSession(features: SelectedFeature[]): void {
  try {
    if (features.length === 0) {
      localStorage.removeItem(KEY);
    } else {
      localStorage.setItem(KEY, JSON.stringify({ features } satisfies MeasureSession));
    }
  } catch {
    // localStorage nicht verfügbar oder voll – stilles Fallback
  }
}

export function loadMeasureSession(): MeasureSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MeasureSession;
  } catch {
    return null;
  }
}

export function clearMeasureSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
