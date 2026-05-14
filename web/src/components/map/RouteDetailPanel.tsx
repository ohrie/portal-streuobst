'use client';

import { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, ExternalLink, MoveDown, MoveUp, Ruler } from 'lucide-react';
import type { RouteFeature } from '@/types/routes';

interface Props {
  route: RouteFeature;
  onClose: () => void;
}

function formatLength(meters: number | null): string {
  if (meters == null) return '—';
  return (meters / 1000).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' km';
}

function formatElevation(meters: number | null): string {
  if (meters == null) return '—';
  return Math.round(meters).toLocaleString('de-DE') + ' m';
}

function downloadGpx(route: RouteFeature) {
  const trkpts = route.geometry
    .map(([lon, lat]) => `      <trkpt lat="${lat}" lon="${lon}"/>`)
    .join('\n');
  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Streuobst-Portal" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${route.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
  const url = URL.createObjectURL(new Blob([gpx], { type: 'application/gpx+xml' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = route.name.replace(/[^a-zA-Z0-9äöüÄÖÜß\- ]/g, '_').trim() + '.gpx';
  a.click();
  URL.revokeObjectURL(url);
}

export default function RouteDetailPanel({ route, onClose }: Props) {
  const [imageIndex, setImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const images = route.image_urls ?? [];

  const prevImage = () => { setImageLoaded(false); setImageIndex(i => (i - 1 + images.length) % images.length); };
  const nextImage = () => { setImageLoaded(false); setImageIndex(i => (i + 1) % images.length); };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-3 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Übersicht
        </button>
        <h2 className="text-lg font-semibold text-gray-900 leading-snug">{route.name}</h2>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* Stats row — only shown if at least one value is present */}
        {(route.length_m != null || route.uphill_m != null || route.downhill_m != null) && (
          <div className="grid grid-cols-3 gap-2 px-4 py-4 border-b border-gray-100">
            <div className="flex flex-col items-center gap-1 bg-gray-50 rounded-lg p-3">
              <Ruler className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-800">{formatLength(route.length_m)}</span>
              <span className="text-xs text-gray-500">Länge</span>
            </div>
            <div className="flex flex-col items-center gap-1 bg-gray-50 rounded-lg p-3">
              <MoveUp className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-800">{formatElevation(route.uphill_m)}</span>
              <span className="text-xs text-gray-500">Aufstieg</span>
            </div>
            <div className="flex flex-col items-center gap-1 bg-gray-50 rounded-lg p-3">
              <MoveDown className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-800">{formatElevation(route.downhill_m)}</span>
              <span className="text-xs text-gray-500">Abstieg</span>
            </div>
          </div>
        )}

        {/* GPX download */}
        <div className="px-4 py-3 border-b border-gray-100">
          <button
            type="button"
            onClick={() => downloadGpx(route)}
            className="flex items-center justify-center gap-2 w-full text-sm font-medium text-primary border border-primary/30 rounded-lg py-2 hover:bg-primary/5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Als GPX herunterladen
          </button>
        </div>

        {/* Image slideshow */}
        {images.length > 0 && (
          <div className="relative bg-gray-100 aspect-[4/3]">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={images[imageIndex]}
              src={images[imageIndex]}
              alt={`${route.name} – Bild ${imageIndex + 1}`}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-colors cursor-pointer"
                  aria-label="Vorheriges Bild"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-colors cursor-pointer"
                  aria-label="Nächstes Bild"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                  {imageIndex + 1} / {images.length}
                </span>
              </>
            )}
          </div>
        )}

        {/* Description */}
        {route.description_html && (
          <div
            className="px-4 py-4 border-b border-gray-100 text-sm text-gray-700 leading-relaxed route-description"
            dangerouslySetInnerHTML={{ __html: route.description_html }}
          />
        )}

        {/* Link to original tour */}
        {route.url && (
          <div className="px-4 py-3 border-b border-gray-100">
            <a
              href={route.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Zur Originaltour
            </a>
          </div>
        )}

        {/* Copyright / license / author */}
        <div className="px-4 py-4 text-xs text-gray-500 space-y-1">
          <div>
            <span className="font-medium text-gray-600">Quelle: </span>
            {route.publisher_url ? (
              <a href={route.publisher_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {route.publisher_name}
              </a>
            ) : (
              <span>{route.publisher_name}</span>
            )}
          </div>
          {route.license && (
            <div>
              <span className="font-medium text-gray-600">Lizenz: </span>
              {route.license_url ? (
                <a href={route.license_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {route.license}
                </a>
              ) : (
                <span>{route.license}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
