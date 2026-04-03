/**
 * IndexedDB-Cache für erkannte Bäume (GeoJSON pro osm_id).
 * TTL: 7 Tage – ältere Einträge werden beim Lesen ignoriert.
 */

const DB_NAME = 'tree-detection-cache';
const STORE = 'detections';
const DB_VERSION = 1;
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface CacheEntry {
  osm_id: string;
  geojson: GeoJSON.FeatureCollection;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'osm_id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getCachedTrees(osmId: string): Promise<GeoJSON.FeatureCollection | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(osmId);
      req.onsuccess = () => {
        const rec = req.result as CacheEntry | undefined;
        if (!rec) return resolve(null);
        if (Date.now() - rec.timestamp > TTL_MS) return resolve(null);
        resolve(rec.geojson);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function cacheTrees(osmId: string, geojson: GeoJSON.FeatureCollection): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const entry: CacheEntry = { osm_id: osmId, geojson, timestamp: Date.now() };
      tx.objectStore(STORE).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // IndexedDB nicht verfügbar – stilles Fallback
  }
}
