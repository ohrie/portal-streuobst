'use client';

import { useState } from 'react';
import type mapboxgl from 'mapbox-gl';
import MapControlButton from './MapControlButton';
import { osmIdToJosmObject } from '@/lib/osmId';

interface EditButtonProps {
  map: React.RefObject<mapboxgl.Map | null>;
  onOpenIdEditor: () => void;
}

export default function EditButton({ map, onOpenIdEditor }: EditButtonProps) {
  const [josmData, setJosmData] = useState<{ ids: string[]; tooMany: boolean; zoom: number } | null>(null);
  const [josmError, setJosmError] = useState(false);

  const handleMouseEnter = () => {
    if (!map.current) return;
    const canvas = map.current.getCanvas();
    const features = map.current.queryRenderedFeatures(
      [[0, 0], [canvas.width, canvas.height]],
      { layers: ['wiesen-fill', 'streuobstwiesen-fill'] }
    );
    const seen = new Set<string>();
    for (const f of features) {
      const id = f.properties?.osm_id;
      if (id) seen.add(String(id));
    }
    const ids = Array.from(seen);
    setJosmData({ ids, tooMany: ids.length > 100, zoom: map.current.getZoom() });
  };

  const handleMouseLeave = () => {
    setJosmData(null);
    setJosmError(false);
  };

  // Bei 0 Objekten wird der Kartenausschnitt geladen — das nur ab Zoom 14 erlauben,
  // da darunter der Ausschnitt für JOSM zu groß wäre.
  const MIN_VIEWPORT_ZOOM = 14;
  const viewportTooLarge = !!josmData && josmData.ids.length === 0 && josmData.zoom < MIN_VIEWPORT_ZOOM;
  const josmDisabled = !josmData || josmData.tooMany || viewportTooLarge;

  const openInJosm = async () => {
    if (!josmData || josmDisabled || !map.current) return;

    let url: string;
    if (josmData.ids.length === 0) {
      // Keine Objekte sichtbar: aktuellen Kartenausschnitt in JOSM laden
      const bounds = map.current.getBounds();
      if (!bounds) return;
      const params = new URLSearchParams({
        left: String(bounds.getWest()),
        right: String(bounds.getEast()),
        top: String(bounds.getNorth()),
        bottom: String(bounds.getSouth()),
      });
      url = `http://localhost:8111/load_and_zoom?${params.toString()}`;
    } else {
      const objects = josmData.ids
        .map(osmIdToJosmObject)
        .filter(Boolean)
        .join(',');
      if (!objects) return;
      url = `http://localhost:8111/load_object?objects=${objects}`;
    }

    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(2000),
      });
      if (!res.ok) throw new Error('not ok');
      setJosmError(false);
    } catch {
      setJosmError(true);
    }
  };

  return (
    <div className="relative group" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {/* Hover panel */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-2 pointer-events-none opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-2 w-56 flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide px-2 pt-1 pb-0.5">
            Bearbeiten in…
          </p>

          {/* iD Editor row */}
          <button
            type="button"
            onClick={onOpenIdEditor}
            className="flex items-center gap-2 w-full rounded-lg px-2 py-1.5 text-gray-500 hover:bg-gray-50 cursor-pointer transition-colors text-left"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span className="text-xs text-gray-600 flex-1">iD Editor</span>
            <span className="text-[10px] text-gray-400">Klick</span>
          </button>

          {/* JOSM row */}
          <button
            type="button"
            disabled={josmDisabled}
            onClick={openInJosm}
            title={josmData?.tooMany
              ? `Zu viele Objekte (${josmData.ids.length} > 100) — bitte zoomen`
              : viewportTooLarge
                ? 'Für den Kartenausschnitt bitte näher heranzoomen (ab Zoom 14)'
                : josmData?.ids.length === 0
                  ? 'Aktuellen Kartenausschnitt in JOSM öffnen'
                  : 'In JOSM öffnen'}
            className={`flex items-center gap-2 w-full rounded-lg px-2 py-1.5 text-left transition-colors ${josmDisabled
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:bg-gray-50 cursor-pointer'
              }`}
          >
            <svg className="w-4 h-4 shrink-0 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span className="text-xs text-gray-700 flex-1">JOSM</span>
            {josmData && (
              <span className="text-[10px] text-gray-400">
                {josmData.ids.length === 0 ? 'Ausschnitt' : `${josmData.ids.length} Obj.`}
              </span>
            )}
          </button>

          {josmData?.tooMany && (
            <p className="text-[10px] text-gray-400 px-2 pb-1 leading-tight">
              Zu viele Objekte ({josmData.ids.length} &gt; 100) — bitte zoomen
            </p>
          )}
          {viewportTooLarge && (
            <p className="text-[10px] text-gray-400 px-2 pb-1 leading-tight">
              Für das Öffnen des Kartenausschnitts bitte näher heranzoomen (ab Zoom 14)
            </p>
          )}
          {josmError && (
            <p className="text-[10px] text-red-500 px-2 pb-1">JOSM nicht erreichbar</p>
          )}
        </div>
        {/* Caret */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-2 translate-y-1/2 w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45" />
      </div>

      {/* Main button */}
      <div className="relative">
        <MapControlButton
          isActive={false}
          onClick={onOpenIdEditor}
          title="OpenStreetMap Daten bearbeiten"
          label="Bearbeite"
          isMobile={false}
          eventName="edit-id-editor"
        >
          <svg className="w-5 h-5 text-gray-700 group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </MapControlButton>
        {/* Expand chevron */}
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white border border-gray-200 rounded-full shadow flex items-center justify-center z-10 pointer-events-none">
          <svg className="w-2.5 h-2.5 text-gray-500" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6.5 5 3.5 8 6.5" />
          </svg>
        </span>
      </div>
    </div>
  );
}
