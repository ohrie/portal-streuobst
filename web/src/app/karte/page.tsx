'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Sheet, SheetRef } from 'react-modal-sheet';
import { useTransform } from 'motion/react';
import { Menu, X, AlertCircle } from 'lucide-react';
import MapLegend from '@/components/map/MapLegend';
import SearchBox, { SearchResult } from '@/components/map/SearchBox';
import RecentSearches, { addRecentSearch, RecentSearch } from '@/components/map/RecentSearches';
import SatelliteToggleButton from '@/components/map/SatelliteToggleButton';
import ProtectedAreasButton from '@/components/map/ProtectedAreasButton';
import HistoricalAerialsButton, { HISTORICAL_AERIAL_LAYERS } from '@/components/map/HistoricalAerialsButton';
import MeasureButton from '@/components/map/MeasureButton';
import MapControlButton from '@/components/map/MapControlButton';
import MeasurePanel from '@/components/map/MeasurePanel';
import { createOSMPopupHTML } from '@/components/map/OSMPopup';
import { calculateAreaM2, countTreesInPolygon, getFeatureCenter, type SelectedFeature } from '@/lib/geoArea';
import { getCachedTrees, cacheTrees } from '@/lib/treeDetectionCache';
import { saveMeasureSession, loadMeasureSession, clearMeasureSession } from '@/lib/measureSession';
import partnerOrchards from '../../data/partner-orchards.json';

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

const TILE_SERVER_URL = process.env.NEXT_PUBLIC_TILE_SERVER_URL ?? 'https://tiles.portal-streuobst.de';

// Label marker helpers
type LabelDatum = { el: HTMLDivElement; feature: SelectedFeature; index: number };

function applyLabelStyle(datum: LabelDatum) {
  const { el, feature, index } = datum;
  el.textContent = feature.name || `Fläche ${index + 1}`;
  el.style.cssText = `background:#3B82F6;color:#fff;padding:2px 7px;border-radius:12px;font-size:10px;font-weight:600;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.3);pointer-events:none;`;
}

// Helper function to create OSM iD editor URL with coordinates and zoom
function createOsmEditorUrl(lng: number, lat: number, zoom: number): string {
  return `https://www.openstreetmap.org/edit?editor=id#map=${Math.round(zoom)}/${lat.toFixed(5)}/${lng.toFixed(5)}`;
}

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isSatelliteView, setIsSatelliteView] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [protectedLayersVisible, setProtectedLayersVisible] = useState<Record<string, boolean>>({
    Naturschutzgebiete: false,
    Landschaftsschutzgebiete: false,
    Nationalparke: false,
    Naturparke: false,
    Biosphaerenreservate: false,
    Vogelschutzgebiete: false,
    Fauna_Flora_Habitat_Gebiete: false,
    Nationale_Naturmonumente: false,
  });
  const [aerialLayersVisible, setAerialLayersVisible] = useState<Record<string, boolean>>(
    () => Object.fromEntries(HISTORICAL_AERIAL_LAYERS.map(l => [l.id, false]))
  );
  // BW bounding box for historical aerials (all WMS services are BW-only)
  const BW_BOUNDS = { west: 7.20, east: 10.70, south: 47.40, north: 50.00 };
  const [isInBWBounds, setIsInBWBounds] = useState(true);
  const [isLayerLoading, setIsLayerLoading] = useState(true);
  const [isMeasureMode, setIsMeasureMode] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<SelectedFeature[]>([]);
  const isMeasureModeRef = useRef(false);
  const selectedFeatureIds = useRef<Set<string>>(new Set());
  const labelMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const labelDataRef = useRef<LabelDatum[]>([]);

  // Toast notifications
  const [toasts, setToasts] = useState<Array<{ id: number; message: string }>>([]);
  const addToast = (message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
  };

  // Tree detection state
  const [isTreeAutoDetect, setIsTreeAutoDetect] = useState(false);
  const [loadingTreeIds, setLoadingTreeIds] = useState<Set<string>>(new Set());
  const isTreeAutoDetectRef = useRef(false);
  const detectedTreeFeatures = useRef<GeoJSON.Feature[]>([]);

  // Sheet ref for scrollStyle paddingBottom fix
  const sheetRef = useRef<SheetRef>(null);
  const sheetPaddingBottom = useTransform(() => sheetRef.current?.y.get() ?? 0);

  // Full-screen snap point (85% of viewport height)
  const [fullSnapPoint, setFullSnapPoint] = useState(580);
  useEffect(() => {
    const update = () => setFullSnapPoint(Math.round(window.innerHeight * 0.85));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Sidebar resize state
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

  // Fetch processing date from tileserver TileJSON
  useEffect(() => {
    fetch(`${TILE_SERVER_URL}/data/streuobstwiesen.json`)
      .then((res) => res.json())
      .then((data) => {
        if (data.last_updated) setLastUpdated(data.last_updated);
      })
      .catch(() => { /* silently ignore if tileserver is unavailable */ });
  }, []);

  // Detect mobile device
  useEffect(() => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    if (mobile) setSidebarOpen(false);

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle sidebar resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - resizeStartX.current;
      const newWidth = Math.max(300, Math.min(800, resizeStartWidth.current + delta));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = sidebarWidth;
  };

  // Handle ESC key to close sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  // Sync isMeasureMode into ref so map event handlers (created once) can read current value
  useEffect(() => {
    isMeasureModeRef.current = isMeasureMode;
  }, [isMeasureMode]);

  // Sync isTreeAutoDetect into ref
  useEffect(() => {
    isTreeAutoDetectRef.current = isTreeAutoDetect;
  }, [isTreeAutoDetect]);

  // Search functionality using Photon API
  const searchLocation = async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      // Use Photon API (Komoot) - free, no API key needed
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=de`
      );
      const data = await response.json();

      setSearchResults(data.features || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        searchLocation(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Handle search result selection
  const handleSearchResultClick = (result: SearchResult) => {
    const [lng, lat] = result.geometry.coordinates;

    if (map.current) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: 14,
        duration: 2000
      });

      // Add a marker
      new mapboxgl.Marker({ color: '#FF8C00' })
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup().setHTML(`
            <div class="p-2">
              <h3 class="font-bold">${result.properties.name}</h3>
              ${result.properties.city ? `<p class="text-sm">${result.properties.city}</p>` : ''}
              ${result.properties.state ? `<p class="text-sm">${result.properties.state}</p>` : ''}
            </div>
          `)
        )
        .addTo(map.current);
    }

    // Add to recent searches
    addRecentSearch(result.properties.name, [lng, lat]);

    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Handle recent search click
  const handleRecentSearchClick = (search: RecentSearch) => {
    const [lng, lat] = search.coordinates;

    if (map.current) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: 14,
        duration: 2000
      });

      // Add a marker
      new mapboxgl.Marker({ color: '#FF8C00' })
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup().setHTML(`
            <div class="p-2">
              <h3 class="font-bold">${search.name}</h3>
            </div>
          `)
        )
        .addTo(map.current);
    }
  };

  useEffect(() => {
    // Re-run initialization when `isMobile` changes to ensure the map attaches to the correct container/layout
    if (map.current) return;
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      hash: true,
      center: [10.4515, 51.1657], // Center of Germany
      zoom: 6,
      minZoom: 5,
      maxZoom: 22,
      language: "de"
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      // Add satellite raster source
      map.current?.addSource('satellite', {
        type: 'raster',
        url: 'mapbox://mapbox.satellite',
        tileSize: 256
      });

      // Add satellite layer (initially hidden)
      map.current?.addLayer({
        id: 'satellite-layer',
        type: 'raster',
        source: 'satellite',
        layout: {
          visibility: 'none'
        }
      });

      // Add individual BfN protected area WMS sources and layers (initially hidden)
      const bfnLayers = [
        'Naturschutzgebiete',
        'Landschaftsschutzgebiete',
        'Nationalparke',
        'Naturparke',
        'Biosphaerenreservate',
        'Vogelschutzgebiete',
        'Fauna_Flora_Habitat_Gebiete',
        'Nationale_Naturmonumente',
      ];
      for (const layerId of bfnLayers) {
        map.current?.addSource(`pa-${layerId}`, {
          type: 'raster',
          tiles: [
            `https://geodienste.bfn.de/ogc/wms/schutzgebiet?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=${layerId}&CRS=EPSG:3857&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}`
          ],
          tileSize: 256,
          attribution: '© <a href="https://www.bfn.de" target="_blank">Bundesamt für Naturschutz (BfN)</a>'
        });
        map.current?.addLayer({
          id: `pa-layer-${layerId}`,
          type: 'raster',
          source: `pa-${layerId}`,
          layout: { visibility: 'none' },
          paint: { 'raster-opacity': 0.6 }
        });
      }

      // Add historical aerial photo WMS sources and layers (LGL-BW, BW only, initially hidden)
      for (const layer of HISTORICAL_AERIAL_LAYERS) {
        map.current?.addSource(`hist-${layer.id}`, {
          type: 'raster',
          tiles: [
            `https://owsproxy.lgl-bw.de/owsproxy/ows/WMS_LGL-BW_HIST_DOP_${layer.endpoint}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=${layer.id}&CRS=EPSG:3857&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}`
          ],
          tileSize: 256,
          attribution: '© <a href="https://www.lgl-bw.de" target="_blank">LGL-BW</a>, <a href="https://www.govdata.de/dl-de/by-2-0" target="_blank">dl-de/by-2-0</a>'
        });
        map.current?.addLayer({
          id: `hist-layer-${layer.id}`,
          type: 'raster',
          source: `hist-${layer.id}`,
          layout: { visibility: 'none' },
          paint: { 'raster-opacity': 1.0 }
        });
      }

      // Track loading state for overlay WMS layers (aerial + protected areas)
      map.current?.on('sourcedata', (e) => {
        if (e.sourceId && (e.sourceId.startsWith('hist-') || e.sourceId.startsWith('pa-'))) {
          if (!e.isSourceLoaded) setIsLayerLoading(true);
        }
      });
      map.current?.on('idle', () => {
        setIsLayerLoading(false);
      });

      // Add Mapterhorn terrain source for hillshading (Terrarium-encoded DEM)
      map.current?.addSource('mapterhorn-terrain', {
        type: 'raster-dem',
        tiles: ['https://tiles.mapterhorn.com/{z}/{x}/{y}.webp'],
        tileSize: 512,
        encoding: 'terrarium',
        maxzoom: 12
      });

      // Terrain initially disabled — activated via 3D button

      // Add hillshade layer below data layers (initially hidden — activated via 3D button)
      map.current?.addLayer({
        id: 'hillshade',
        type: 'hillshade',
        source: 'mapterhorn-terrain',
        layout: { visibility: 'none' },
        paint: {
          'hillshade-exaggeration': 0.5,
          'hillshade-illumination-anchor': 'viewport'
        }
      });

      // Add streuobstwiesen vector tiles source
      map.current?.addSource('streuobstwiesen', {
        type: 'vector',
        tiles: [`${TILE_SERVER_URL}/data/streuobstwiesen/{z}/{x}/{y}.pbf`],
        minzoom: 0,
        maxzoom: 16,
        promoteId: { wiesen: 'osm_id', streuobstwiesen: 'osm_id', baeume: 'osm_id' }
      });

      // Add wiesen (meadows) layer - yellowish color, orange for meadow_orchard
      map.current?.addLayer({
        id: 'wiesen-fill',
        type: 'fill',
        source: 'streuobstwiesen',
        'source-layer': 'wiesen',
        paint: {
          // Color based on orchard attribute - use case at top level
          'fill-color': [
            'case',
            ['==', ['get', 'orchard'], 'meadow_orchard'], '#FF8C00', // Orange for meadow_orchard
            ['==', ['get', 'orchard'], 'plantation'], '#9CA3AF', // Grey for plantation
            '#667302' // Default color for other wiesen
          ],
          'fill-opacity': [
            'case',
            ['==', ['get', 'orchard'], 'meadow_orchard'], 0.6, // Same opacity as streuobstwiesen
            0.5 // Default opacity for other wiesen
          ]
        }
      });

      // Add streuobstwiesen layer - orange color
      map.current?.addLayer({
        id: 'streuobstwiesen-fill',
        type: 'fill',
        source: 'streuobstwiesen',
        'source-layer': 'streuobstwiesen',
        paint: {
          'fill-color': '#FF8C00', // Orange color (dark orange)
          'fill-opacity': 0.5
        }
      });

      // Blue selection highlight layers for the measure mode.
      // Rendered on top of the base fill layers (wiesen-fill / streuobstwiesen-fill).
      // Opacity is 0 by default and switches to the active value when the feature's
      // `selected` state is set to true (via setFeatureState on click in measure mode).
      map.current?.addLayer({
        id: 'wiesen-selected-outline',
        type: 'line',
        source: 'streuobstwiesen',
        'source-layer': 'wiesen',
        paint: {
          'line-color': '#3B82F6',
          'line-width': 3,
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            1,
            0
          ] as any
        }
      });

      map.current?.addLayer({
        id: 'streuobstwiesen-selected-outline',
        type: 'line',
        source: 'streuobstwiesen',
        'source-layer': 'streuobstwiesen',
        paint: {
          'line-color': '#3B82F6',
          'line-width': 3,
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            1,
            0
          ] as any
        }
      });

      // Add baeume (trees) layer - green circles
      map.current?.addLayer({
        id: 'baeume-circle',
        type: 'circle',
        source: 'streuobstwiesen',
        'source-layer': 'baeume',
        minzoom: 10,
        paint: {
          'circle-color': '#228B22', // Green color (forest green)
          'circle-radius': [
            'interpolate',
            ['exponential', 1.3],
            ['zoom'],
            10, 1,  // small at zoom 10
            15, 2,  // visible at mid zooms
            20, 15  // larger at high zooms
          ],
          'circle-stroke-width': [
            'interpolate',
            ['exponential', 1.3],
            ['zoom'],
            10, 0.5,
            20, 2
          ],
          'circle-stroke-color': '#006400'
        }
      });

      // Add partner orchards data
      map.current?.addSource('partner-orchards', {
        type: 'geojson',
        data: partnerOrchards as GeoJSON.FeatureCollection
      });

      // Load partner logos as map images
      const loadImage = (url: string, id: string) => {
        return new Promise<void>((resolve, reject) => {
          map.current?.loadImage(url, (error, image) => {
            if (error) {
              console.warn(`Failed to load image ${id}:`, error);
              resolve(); // Continue even if image fails to load
            } else if (image) {
              map.current?.addImage(id, image);
              resolve();
            } else {
              resolve();
            }
          });
        });
      };

      // Load all partner logos
      const logoPromises = [
        loadImage('/partner/Japfel_Logo.png', 'japfel-logo')
      ];

      // Add partner circle layer (visible below zoom 10)
      map.current?.addLayer({
        id: 'partner-circles',
        type: 'circle',
        source: 'partner-orchards',
        minzoom: 7,
        maxzoom: 10,
        paint: {
          'circle-color': '#860100',
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Wait for all logos to load, then add layers
      Promise.all(logoPromises).then(() => {
        // Add partner logo layer (visible from zoom 10)
        map.current?.addLayer({
          id: 'partner-logos',
          type: 'symbol',
          source: 'partner-orchards',
          minzoom: 10,
          layout: {
            'icon-image': 'japfel-logo',
            'icon-size': 0.5,
            'icon-allow-overlap': true
          }
        });
      });

      // Shared popup builder for partner orchards
      const openPartnerPopup = (feature: mapboxgl.GeoJSONFeature) => {
        const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
        const properties = feature.properties;

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div class="p-4">
              <div class="flex items-center gap-3 mb-3">
                <img src="${properties?.logo}" alt="${properties?.partner} Logo" class="w-8 h-8" />
                <h3 class="font-bold text-lg text-nature">${properties?.name}</h3>
              </div>
              <p class="text-warm mb-2">${properties?.partner}</p>
              <p class="text-sm text-nature mb-3">${properties?.description}</p>
              <a href="${properties?.website}" target="_blank" class="text-accent hover:text-accent-hover text-sm font-medium">
                Website besuchen →
              </a>
            </div>
          `)
          .addTo(map.current!);
      };

      // Add click events for partner logos and circles
      map.current?.on('click', 'partner-logos', (e: mapboxgl.MapMouseEvent) => {
        if (!e.features || !e.features[0]) return;
        openPartnerPopup(e.features[0]);
      });

      map.current?.on('click', 'partner-circles', (e: mapboxgl.MapMouseEvent) => {
        if (!e.features || !e.features[0]) return;
        openPartnerPopup(e.features[0]);
      });

      // Detected trees layer (initially empty, filled by tree detection API)
      map.current?.addSource('detected-trees', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        attribution: '<a href="https://www.lgl-bw.de/Produkte/Open-Data/" target="_blank">LGL, www.lgl-bw.de</a>, dl-de/by-2-0',
      });
      map.current?.addLayer({
        id: 'detected-trees-circle',
        type: 'circle',
        source: 'detected-trees',
        paint: {
          'circle-color': '#16a34a',
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 3, 16, 8, 20, 12],
          'circle-opacity': 0.85,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#14532d',
        },
      });

      // Add click events for streuobstwiesen layers
      map.current?.on('click', 'wiesen-fill', (e: mapboxgl.MapMouseEvent) => {
        if (!e.features || !e.features[0]) return;

        // Only activate click events at zoom level 10 and above
        const currentZoom = map.current?.getZoom() || 0;
        if (currentZoom < 10) return;

        // If a tree was clicked at this point, the tree popup has priority.
        if (!isMeasureModeRef.current) {
          const treeFeatures = map.current?.queryRenderedFeatures(e.point, { layers: ['baeume-circle'] }) ?? [];
          if (treeFeatures.length > 0) return;
        }

        const feature = e.features[0];
        const coordinates = e.lngLat;
        const properties = feature.properties || {};
        const propsObj: Record<string, any> = properties as Record<string, any>;
        const featureId = feature.id ?? propsObj?.osm_id;

        // Measure mode: toggle selection instead of showing popup
        if (isMeasureModeRef.current && featureId != null) {
          const key = `wiesen:${featureId}`;
          if (selectedFeatureIds.current.has(key)) {
            selectedFeatureIds.current.delete(key);
            map.current?.setFeatureState(
              { source: 'streuobstwiesen', sourceLayer: 'wiesen', id: featureId },
              { selected: false }
            );
            setSelectedFeatures(prev => prev.filter(f => `${f.sourceLayer}:${f.id}` !== key));
          } else {
            selectedFeatureIds.current.add(key);
            map.current?.setFeatureState(
              { source: 'streuobstwiesen', sourceLayer: 'wiesen', id: featureId },
              { selected: true }
            );
            const areaM2 = calculateAreaM2(feature.geometry as GeoJSON.Geometry);
            const center = getFeatureCenter(feature.geometry as GeoJSON.Geometry);
            const treeCount = map.current ? countTreesInPolygon(map.current, feature.geometry as GeoJSON.Geometry) : undefined;
            const name = propsObj?.name as string | undefined;
            setSelectedFeatures(prev => [...prev, { id: featureId, sourceLayer: 'wiesen', areaM2, center, name, treeCount }]);
            if (isTreeAutoDetectRef.current) handleDetectTrees(String(featureId));
          }
          return;
        }

        const isMeadowOrchard = propsObj?.orchard === 'meadow_orchard';
        const isPlantation = propsObj?.orchard === 'plantation';
        const osmId = propsObj?.osm_id;  // tippecanoe uses osm_id property
        const areaM2 = calculateAreaM2(feature.geometry as GeoJSON.Geometry);
        const treeCount = map.current ? countTreesInPolygon(map.current, feature.geometry as GeoJSON.Geometry) : undefined;

        const additionalContent = isMeadowOrchard
          ? ''
          : isPlantation
            ? '<p class="text-sm text-gray-500 mb-2">Kommerzielle Obstplantage</p>'
            : `<div class="bg-yellow-50 border border-yellow-300 rounded p-2 mb-2">
              <p class="text-sm text-yellow-800 font-medium mb-1">⚠️ Tag fehlt noch</p>
              <p class="text-xs text-yellow-700 mb-2">Dieser Obstgarten ist noch nicht in OSM kategorisiert.</p>
              <p class="text-xs text-yellow-700 mb-2">Füge den Key <code class="bg-yellow-100 px-1 rounded">orchard=*</code> hinzu, um die Art festzulegen.</p>
            </div>`;

        const title = isMeadowOrchard ? 'Streuobstwiese' : isPlantation ? 'Obstplantage' : 'Obstgarten';

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(createOSMPopupHTML({
            title: title,
            osmId: osmId,
            additionalContent: additionalContent,
            showOSMTags: true,
            properties: propsObj,
            areaM2,
            treeCount
          }))
          .addTo(map.current!);
      });

      map.current?.on('click', 'streuobstwiesen-fill', (e: mapboxgl.MapMouseEvent) => {
        if (!e.features || !e.features[0]) return;

        // Disable clicks at low zoom where tiles show aggregated/buffered shapes
        const currentZoom = map.current?.getZoom() || 0;
        if (currentZoom < 8) return;

        // If a tree was clicked at this point, the tree popup has priority.
        if (!isMeasureModeRef.current) {
          const treeFeatures = map.current?.queryRenderedFeatures(e.point, { layers: ['baeume-circle'] }) ?? [];
          if (treeFeatures.length > 0) return;
        }

        const feature = e.features[0];
        const coordinates = e.lngLat;
        const osmId = feature.id;  // osmium export uses top-level id field with type_id format
        const propsObj = feature.properties as Record<string, any> | null;

        // Measure mode: toggle selection instead of showing popup
        if (isMeasureModeRef.current && osmId != null) {
          const key = `streuobstwiesen:${osmId}`;
          if (selectedFeatureIds.current.has(key)) {
            selectedFeatureIds.current.delete(key);
            map.current?.setFeatureState(
              { source: 'streuobstwiesen', sourceLayer: 'streuobstwiesen', id: osmId },
              { selected: false }
            );
            setSelectedFeatures(prev => prev.filter(f => `${f.sourceLayer}:${f.id}` !== key));
          } else {
            selectedFeatureIds.current.add(key);
            map.current?.setFeatureState(
              { source: 'streuobstwiesen', sourceLayer: 'streuobstwiesen', id: osmId },
              { selected: true }
            );
            const areaM2 = calculateAreaM2(feature.geometry as GeoJSON.Geometry);
            const center = getFeatureCenter(feature.geometry as GeoJSON.Geometry);
            const treeCount = map.current ? countTreesInPolygon(map.current, feature.geometry as GeoJSON.Geometry) : undefined;
            const name = propsObj?.name as string | undefined;
            setSelectedFeatures(prev => [...prev, { id: osmId, sourceLayer: 'streuobstwiesen', areaM2, center, name, treeCount }]);
            if (isTreeAutoDetectRef.current) handleDetectTrees(String(osmId));
          }
          return;
        }

        const areaM2 = calculateAreaM2(feature.geometry as GeoJSON.Geometry);
        const treeCount = map.current ? countTreesInPolygon(map.current, feature.geometry as GeoJSON.Geometry) : undefined;

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(createOSMPopupHTML({
            title: 'Streuobstwiese',
            description: 'Traditionelle Streuobstwiese mit verschiedenen Obstsorten',
            osmId: osmId ? String(osmId) : undefined,
            areaM2,
            treeCount
          }))
          .addTo(map.current!);
      });

      map.current?.on('click', 'baeume-circle', (e: mapboxgl.MapMouseEvent) => {
        if (!e.features || !e.features[0]) return;

        // Only activate click events at zoom level 11 and above
        const currentZoom = map.current?.getZoom() || 0;
        if (currentZoom < 11) return;

        const feature = e.features[0];
        const coordinates = e.lngLat;
        const osmId = feature.id;  // osmium export uses top-level id field with type_id format
        const propsObj = feature.properties as Record<string, any> | null;

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(createOSMPopupHTML({
            title: 'Obstbaum',
            description: 'Einzelner Obstbaum in der Streuobstwiese',
            osmId: osmId ? String(osmId) : undefined,
            showOSMTags: true,
            properties: propsObj ?? undefined,
          }))
          .addTo(map.current!);
      });

      // Change cursor on hover for streuobstwiesen layers
      map.current?.on('mouseenter', 'wiesen-fill', () => {
        // Only show cursor at zoom level 11 and above
        const currentZoom = map.current?.getZoom() || 0;
        if (currentZoom >= 11) {
          map.current!.getCanvas().style.cursor = isMeasureModeRef.current ? 'crosshair' : 'pointer';
        }
      });

      map.current?.on('mouseleave', 'wiesen-fill', () => {
        map.current!.getCanvas().style.cursor = isMeasureModeRef.current ? 'crosshair' : '';
      });

      map.current?.on('mouseenter', 'streuobstwiesen-fill', () => {
        const currentZoom = map.current?.getZoom() || 0;
        if (currentZoom < 8) return;
        map.current!.getCanvas().style.cursor = isMeasureModeRef.current ? 'crosshair' : 'pointer';
      });

      map.current?.on('mouseleave', 'streuobstwiesen-fill', () => {
        map.current!.getCanvas().style.cursor = isMeasureModeRef.current ? 'crosshair' : '';
      });

      map.current?.on('mouseenter', 'baeume-circle', () => {
        // Only show pointer cursor at zoom level 11 and above
        const currentZoom = map.current?.getZoom() || 0;
        if (currentZoom >= 11) {
          map.current!.getCanvas().style.cursor = 'pointer';
        }
      });

      map.current?.on('mouseleave', 'baeume-circle', () => {
        map.current!.getCanvas().style.cursor = '';
      });

      // Change cursor on hover for partner logos and circles
      map.current?.on('mouseenter', 'partner-logos', () => {
        map.current!.getCanvas().style.cursor = 'pointer';
      });
      map.current?.on('mouseleave', 'partner-logos', () => {
        map.current!.getCanvas().style.cursor = '';
      });
      map.current?.on('mouseenter', 'partner-circles', () => {
        map.current!.getCanvas().style.cursor = 'pointer';
      });
      map.current?.on('mouseleave', 'partner-circles', () => {
        map.current!.getCanvas().style.cursor = '';
      });

      // Bounds check for historical aerials (BW only)
      const checkBWBounds = () => {
        if (!map.current) return;
        const b = map.current.getBounds();
        if (!b) return;
        const overlaps = !(
          b.getEast() < BW_BOUNDS.west || b.getWest() > BW_BOUNDS.east ||
          b.getNorth() < BW_BOUNDS.south || b.getSouth() > BW_BOUNDS.north
        );
        setIsInBWBounds(overlaps);
      };
      map.current?.on('moveend', checkBWBounds);
      checkBWBounds();
    });

    return () => {
      // Remove map instance on unmount only
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Empty dependency array - initialize only once

  // Function to open OSM iD editor at current map location
  const openOSMEditor = () => {
    if (!map.current) return;

    const center = map.current.getCenter();
    const zoom = map.current.getZoom();
    const editorUrl = createOsmEditorUrl(center.lng, center.lat, zoom);
    window.open(editorUrl, '_blank');
  };

  // Shared helper: update vector layer colors based on active overlay layers
  const updateVectorLayerColors = (satActive: boolean, aerialActive: boolean) => {
    if (!map.current) return;
    const overlayActive = satActive || aerialActive;

    const wiesenLayer = map.current.getLayer('wiesen-fill');
    if (wiesenLayer) {
      const wiesenColor = aerialActive
        ? [
          'case',
          ['==', ['get', 'orchard'], 'meadow_orchard'], '#E2A8FB', // Purple for orchards over aerial
          ['==', ['get', 'orchard'], 'plantation'], '#9CA3AF',
          '#FF8C00' // Orange for others over aerial
        ] as any
        : overlayActive
          ? [
            'case',
            ['==', ['get', 'orchard'], 'meadow_orchard'], '#FF8C00',
            ['==', ['get', 'orchard'], 'plantation'], '#9CA3AF',
            '#E2A8FB' // Purple for others over satellite
          ] as any
          : [
            'case',
            ['==', ['get', 'orchard'], 'meadow_orchard'], '#FF8C00',
            ['==', ['get', 'orchard'], 'plantation'], '#9CA3AF',
            '#667302' // Original
          ] as any;

      map.current.setPaintProperty('wiesen-fill', 'fill-color', wiesenColor);

      const wiesenOpacity = overlayActive
        ? ['interpolate', ['linear'], ['zoom'], 11, 1.0, 12, 0.55] as any
        : ['case', ['==', ['get', 'orchard'], 'meadow_orchard'], 0.6, 0.5] as any;
      map.current.setPaintProperty('wiesen-fill', 'fill-opacity', wiesenOpacity);
    }

    const streuobstLayer = map.current.getLayer('streuobstwiesen-fill');
    if (streuobstLayer) {
      map.current.setPaintProperty('streuobstwiesen-fill', 'fill-color', aerialActive ? '#E2A8FB' : '#FF8C00');
      const streuobstOpacity = overlayActive
        ? ['interpolate', ['linear'], ['zoom'], 11, 1.0, 12, 0.6] as any
        : 0.6;
      map.current.setPaintProperty('streuobstwiesen-fill', 'fill-opacity', streuobstOpacity);
    }
  };

  // Function to toggle satellite view
  const toggleSatelliteView = () => {
    if (!map.current) return;

    const satelliteLayer = map.current.getLayer('satellite-layer');
    if (!satelliteLayer) return;

    const currentVisibility = map.current.getLayoutProperty('satellite-layer', 'visibility');
    const newSatActive = currentVisibility !== 'visible';

    map.current.setLayoutProperty('satellite-layer', 'visibility', newSatActive ? 'visible' : 'none');
    setIsSatelliteView(newSatActive);

    const anyAerialActive = Object.values(aerialLayersVisible).some(Boolean);
    updateVectorLayerColors(newSatActive, anyAerialActive);
  };

  // Clear all measure selections
  const clearMeasureSelection = (clearSession = false) => {
    selectedFeatureIds.current.forEach(key => {
      const colonIdx = key.indexOf(':');
      const sourceLayer = key.slice(0, colonIdx);
      const id = key.slice(colonIdx + 1);
      const numId = Number(id);
      map.current?.setFeatureState(
        { source: 'streuobstwiesen', sourceLayer, id: isNaN(numId) ? id : numId },
        { selected: false }
      );
    });
    selectedFeatureIds.current.clear();
    setSelectedFeatures([]);
    detectedTreeFeatures.current = [];
    updateDetectedTreesLayer([]);
    if (clearSession) clearMeasureSession();
  };

  // Toggle measure mode
  const toggleMeasureMode = async () => {
    const entering = !isMeasureMode;
    setIsMeasureMode(entering);
    isMeasureModeRef.current = entering;

    if (!entering) {
      // Save current selection before clearing
      saveMeasureSession(selectedFeatures);
      clearMeasureSelection();
    } else {
      // Restore previous session if available
      const session = loadMeasureSession();
      if (session && session.features.length > 0) {
        // Re-apply feature highlight states and selection set
        session.features.forEach(f => {
          const key = `${f.sourceLayer}:${f.id}`;
          selectedFeatureIds.current.add(key);
          map.current?.setFeatureState(
            { source: 'streuobstwiesen', sourceLayer: f.sourceLayer, id: f.id },
            { selected: true }
          );
        });
        setSelectedFeatures(session.features);

        // Re-load detected tree geometries from IndexedDB for the map layer
        const featuresWithDetection = session.features.filter(f => f.detectedTreeCount != null);
        if (featuresWithDetection.length > 0) {
          const treeFeatures: GeoJSON.Feature[] = [];
          await Promise.all(
            featuresWithDetection.map(async f => {
              const cached = await getCachedTrees(String(f.id));
              if (cached) treeFeatures.push(...cached.features);
            })
          );
          if (treeFeatures.length > 0) {
            detectedTreeFeatures.current = treeFeatures;
            updateDetectedTreesLayer(treeFeatures);
          }
        }
      }
    }

    if (map.current) {
      map.current.getCanvas().style.cursor = entering ? 'crosshair' : '';
    }
  };

  // Tree detection helpers
  const updateDetectedTreesLayer = (features: GeoJSON.Feature[]) => {
    const src = map.current?.getSource('detected-trees') as mapboxgl.GeoJSONSource | undefined;
    src?.setData({ type: 'FeatureCollection', features });
  };

  const handleDetectTrees = async (osmId: string) => {
    // Check IndexedDB cache first
    const cached = await getCachedTrees(osmId);
    if (cached) {
      detectedTreeFeatures.current = [
        ...detectedTreeFeatures.current,
        ...cached.features,
      ];
      updateDetectedTreesLayer(detectedTreeFeatures.current);
      setSelectedFeatures(prev => prev.map(f =>
        String(f.id) === osmId ? { ...f, detectedTreeCount: cached.features.length } : f
      ));
      return;
    }

    setLoadingTreeIds(prev => new Set(prev).add(osmId));
    try {
      const controller = new AbortController();
      const abortTimer = setTimeout(() => controller.abort(), 200_000);
      let resp: Response;
      try {
        resp = await fetch(`/api/trees/${osmId}`, { signal: controller.signal });
      } finally {
        clearTimeout(abortTimer);
      }
      if (!resp.ok) {
        setSelectedFeatures(prev => prev.map(f =>
          String(f.id) === osmId ? { ...f, treeDetectionFailed: true } : f
        ));
        let detail = '';
        try { detail = (await resp.json()).detail ?? ''; } catch { /* ignore */ }
        if (resp.status === 404) {
          addToast('Fläche nicht gefunden – die OSM-ID ist im System nicht bekannt.');
        } else if (resp.status === 422 && detail.includes('außerhalb Baden-Württembergs')) {
          addToast('Diese Fläche liegt außerhalb Baden-Württembergs. Die automatische Baumerkennung ist derzeit nur für BW verfügbar.');
        } else if (resp.status === 422) {
          addToast('Berechnung fehlgeschlagen: Keine Höhendaten für diese Fläche verfügbar.');
        } else if (resp.status === 429) {
          addToast('Zu viele Anfragen. Bitte warte kurz und versuche es erneut.');
        } else if (resp.status === 504) {
          addToast('Zeitüberschreitung – die Fläche ist möglicherweise zu groß oder der Server ausgelastet.');
        } else {
          addToast(`Baumerkennung fehlgeschlagen (Fehler ${resp.status}).`);
        }
        return;
      }
      const geojson: GeoJSON.FeatureCollection = await resp.json();
      await cacheTrees(osmId, geojson);
      detectedTreeFeatures.current = [
        ...detectedTreeFeatures.current,
        ...geojson.features,
      ];
      updateDetectedTreesLayer(detectedTreeFeatures.current);
      setSelectedFeatures(prev => prev.map(f =>
        String(f.id) === osmId ? { ...f, detectedTreeCount: geojson.features.length, treeDetectionFailed: false } : f
      ));
    } catch (err) {
      console.error('Tree detection failed:', err);
      setSelectedFeatures(prev => prev.map(f =>
        String(f.id) === osmId ? { ...f, treeDetectionFailed: true } : f
      ));
      if (err instanceof DOMException) {
        addToast('Zeitüberschreitung – die Fläche ist möglicherweise zu groß oder der Server ausgelastet.');
      } else {
        addToast('Verbindung zur Baumerkennung fehlgeschlagen. Bitte später erneut versuchen.');
      }
    } finally {
      setLoadingTreeIds(prev => {
        const s = new Set(prev);
        s.delete(osmId);
        return s;
      });
    }
  };

  // Toggle 3D terrain mode
  const toggle3DMode = () => {
    const entering = !is3DMode;
    setIs3DMode(entering);
    if (!map.current) return;
    if (entering) {
      map.current.setTerrain({ source: 'mapterhorn-terrain', exaggeration: 1.5 });
      map.current.setLayoutProperty('hillshade', 'visibility', 'visible');
      // Only set pitch if the user hasn't already tilted the map and zoom is close enough
      if (map.current.getPitch() === 0 && map.current.getZoom() > 11) {
        map.current.easeTo({ pitch: 45, duration: 600 });
      }
    } else {
      map.current.setTerrain(null);
      map.current.setLayoutProperty('hillshade', 'visibility', 'none');
      map.current.easeTo({ pitch: 0, duration: 600 });
    }
  };

  const toggleProtectedLayer = (layerId: string) => {
    if (!map.current) return;
    const mapLayerId = `pa-layer-${layerId}`;
    if (!map.current.getLayer(mapLayerId)) return;
    const current = map.current.getLayoutProperty(mapLayerId, 'visibility');
    const next = current === 'visible' ? 'none' : 'visible';
    map.current.setLayoutProperty(mapLayerId, 'visibility', next);
    setProtectedLayersVisible(prev => ({ ...prev, [layerId]: next === 'visible' }));
  };

  const toggleAllProtectedLayers = () => {
    if (!map.current) return;
    const anyVisible = Object.values(protectedLayersVisible).some(Boolean);
    const next = anyVisible ? 'none' : 'visible';
    const update: Record<string, boolean> = {};
    for (const layerId of Object.keys(protectedLayersVisible)) {
      const mapLayerId = `pa-layer-${layerId}`;
      if (map.current.getLayer(mapLayerId)) {
        map.current.setLayoutProperty(mapLayerId, 'visibility', next);
      }
      update[layerId] = next === 'visible';
    }
    setProtectedLayersVisible(update);
  };

  const toggleAerialLayer = (year: string) => {
    if (!map.current) return;
    const mapLayerId = `hist-layer-${year}`;
    if (!map.current.getLayer(mapLayerId)) return;
    const current = map.current.getLayoutProperty(mapLayerId, 'visibility');
    const next = current === 'visible' ? 'none' : 'visible';
    map.current.setLayoutProperty(mapLayerId, 'visibility', next);
    setAerialLayersVisible(prev => {
      const updated = { ...prev, [year]: next === 'visible' };
      updateVectorLayerColors(isSatelliteView, Object.values(updated).some(Boolean));
      return updated;
    });
  };

  const toggleAllAerialLayers = () => {
    if (!map.current) return;
    const anyVisible = Object.values(aerialLayersVisible).some(Boolean);
    const next = anyVisible ? 'none' : 'visible';
    const update: Record<string, boolean> = {};
    for (const year of Object.keys(aerialLayersVisible)) {
      const mapLayerId = `hist-layer-${year}`;
      if (map.current.getLayer(mapLayerId)) {
        map.current.setLayoutProperty(mapLayerId, 'visibility', next);
      }
      update[year] = next === 'visible';
    }
    setAerialLayersVisible(update);
    updateVectorLayerColors(isSatelliteView, next === 'visible');
  };

  const toggleGroupAerialLayers = (group: string) => {
    if (!map.current) return;
    const groupYears = HISTORICAL_AERIAL_LAYERS.filter(l => l.group === group).map(l => l.id);
    const anyGroupVisible = groupYears.some(y => aerialLayersVisible[y]);
    const next = anyGroupVisible ? 'none' : 'visible';
    const update: Record<string, boolean> = { ...aerialLayersVisible };
    for (const year of groupYears) {
      const mapLayerId = `hist-layer-${year}`;
      if (map.current.getLayer(mapLayerId)) {
        map.current.setLayoutProperty(mapLayerId, 'visibility', next);
      }
      update[year] = next === 'visible';
    }
    setAerialLayersVisible(update);
    updateVectorLayerColors(isSatelliteView, Object.values(update).some(Boolean));
  };

  const toggleTreeAutoDetect = () => {
    const entering = !isTreeAutoDetect;
    setIsTreeAutoDetect(entering);
    isTreeAutoDetectRef.current = entering;
    if (!entering) {
      detectedTreeFeatures.current = [];
      updateDetectedTreesLayer([]);
      setSelectedFeatures(prev => prev.map(f => ({ ...f, detectedTreeCount: undefined, treeDetectionFailed: false })));
    } else {
      // Trigger detection for already-selected features
      setSelectedFeatures(prev => {
        prev.forEach(f => {
          if (f.detectedTreeCount == null) handleDetectTrees(String(f.id));
        });
        return prev;
      });
    }
  };

  // Sync label markers on the map with selected features
  useEffect(() => {
    labelMarkersRef.current.forEach(m => m.remove());
    labelMarkersRef.current = [];
    labelDataRef.current = [];

    if (!isMeasureMode || !map.current) return;

    selectedFeatures.forEach((f, i) => {
      const el = document.createElement('div');
      const datum: LabelDatum = { el, feature: f, index: i };
      applyLabelStyle(datum);

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat(f.center)
        .addTo(map.current!);
      labelMarkersRef.current.push(marker);
      labelDataRef.current.push(datum);
    });

    return () => {
      labelMarkersRef.current.forEach(m => m.remove());
      labelMarkersRef.current = [];
      labelDataRef.current = [];
    };
  }, [selectedFeatures, isMeasureMode]);


  // Clear search helper
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };



  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Mobile Layout */}
      {isMobile ? (
        <div className="flex-1 relative min-h-0">
          {/* Map Container - Full Screen on Mobile */}
          <div ref={mapContainer} className="w-full h-full" />


          {/* Mobile Toggle Button - Top Left */}
          <div className="absolute top-4 left-4 z-20">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="bg-white hover:bg-gray-50 rounded-lg shadow-lg border border-gray-200 transition-all duration-200 hover:shadow-xl p-3 group cursor-pointer"
              title="Kartenlegende öffnen"
              aria-label="Kartenlegende öffnen"
              aria-expanded={sidebarOpen}
              aria-controls="map-sidebar-mobile"
            >
              <Menu className="w-6 h-6 text-gray-700 group-hover:text-primary" />
            </button>
          </div>

          {/* Mobile Bottom Sheet */}
          <Sheet
            ref={sheetRef}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            snapPoints={[400, fullSnapPoint]}
            initialSnap={1}
          >
            <Sheet.Container id="map-sidebar-mobile">
              <Sheet.Header />
              <Sheet.Content disableDrag scrollStyle={{ paddingBottom: sheetPaddingBottom }}>
                {/* Search in Sheet */}
                <div className="px-6 pt-4 pb-3 border-b border-gray-200">
                  <SearchBox
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                    searchResults={searchResults}
                    showSearchResults={showSearchResults}
                    isSearching={isSearching}
                    onResultClick={(result) => {
                      handleSearchResultClick(result);
                      setSidebarOpen(false);
                    }}
                    onClearSearch={handleClearSearch}
                    onFocus={() => sheetRef.current?.snapTo(2)}
                  />
                  <RecentSearches onSearchClick={handleRecentSearchClick} />
                </div>

                <MapLegend onClose={() => setSidebarOpen(false)} showCloseButton={true} lastUpdated={lastUpdated} />
              </Sheet.Content>
            </Sheet.Container>
            <Sheet.Backdrop onTap={() => setSidebarOpen(false)} />
          </Sheet>

          {/* Mobile Button Group: Satellite + 3D + Measure */}
          <div className="absolute bottom-4 left-4 z-10 flex gap-2 items-end">
            <SatelliteToggleButton
              isSatelliteView={isSatelliteView}
              onToggle={toggleSatelliteView}
              isMobile={true}
            />
            <HistoricalAerialsButton
              layersVisible={aerialLayersVisible}
              onToggleAll={toggleAllAerialLayers}
              onToggleLayer={toggleAerialLayer}
              onToggleGroup={toggleGroupAerialLayers}
              isMobile={true}
              isDisabled={!isInBWBounds}
            />
            <ProtectedAreasButton
              layersVisible={protectedLayersVisible}
              onToggleAll={toggleAllProtectedLayers}
              onToggleLayer={toggleProtectedLayer}
              isMobile={true}
            />
            <MapControlButton
              isActive={is3DMode}
              onClick={toggle3DMode}
              title={is3DMode ? '3D-Ansicht deaktivieren' : '3D-Ansicht aktivieren'}
              label="Gelände"
              isMobile={true}
            >
              <span className={`text-sm font-bold leading-none ${is3DMode ? 'text-primary' : 'text-gray-700 group-hover:text-primary'} transition-colors`}>3D</span>
            </MapControlButton>
            <MeasureButton
              isMeasureMode={isMeasureMode}
              onToggle={toggleMeasureMode}
              isMobile={true}
            />
            {isLayerLoading && (
              <div className="flex items-center justify-center self-center w-8 h-8">
                <div className="w-5 h-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
          </div>

          {/* Measure Panel */}
          {isMeasureMode && (
            <MeasurePanel
              features={selectedFeatures}
              onClear={() => clearMeasureSelection(true)}
              isTreeDetectEnabled={isTreeAutoDetect}
              onToggleTreeDetect={toggleTreeAutoDetect}
              loadingTreeIds={loadingTreeIds}
            />
          )}
        </div>
      ) : (
        /* Desktop Layout - Full Width Map with Overlay Sidebar */
        <div className="flex-1 relative min-h-0">
          {/* Map Container - Full Width */}
          <div ref={mapContainer} className="w-full h-full" />


          {/* Desktop Toggle Button - Top Left (only visible when sidebar is closed) */}
          {!sidebarOpen && (
            <div className="absolute top-4 left-4 z-30">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="bg-white hover:bg-gray-50 rounded-lg shadow-lg border border-gray-200 transition-all duration-200 hover:shadow-xl p-3 group cursor-pointer"
                title="Kartenlegende öffnen"
                aria-label="Kartenlegende öffnen"
                aria-expanded={sidebarOpen}
                aria-controls="map-sidebar-desktop"
              >
                <Menu className="w-6 h-6 text-gray-700 group-hover:text-primary transition-colors" />
              </button>
            </div>
          )}

          {/* Desktop Sidebar - Overlay from Left */}
          <div
            id="map-sidebar-desktop"
            className={`absolute top-0 left-0 h-full z-20 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            style={{ width: `${sidebarWidth}px` }}
          >
            <div className={`bg-white h-full flex transition-shadow duration-300 ${sidebarOpen ? 'shadow-2xl' : 'shadow-none'
              }`}>
              {/* Sidebar Content */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Close Button - Top Right within Sidebar */}
                <div className="flex justify-end p-4 pb-0">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Schließen"
                    aria-label="Kartenlegende schließen"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Search Box */}
                <div className="px-6 pb-3">
                  <SearchBox
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                    searchResults={searchResults}
                    showSearchResults={showSearchResults}
                    isSearching={isSearching}
                    onResultClick={handleSearchResultClick}
                    onClearSearch={handleClearSearch}
                  />
                  <RecentSearches onSearchClick={handleRecentSearchClick} />
                </div>

                <MapLegend lastUpdated={lastUpdated} />
              </div>

              {/* Resize Handle */}
              <div
                onMouseDown={handleResizeStart}
                className="w-1 bg-gray-200 hover:bg-primary cursor-col-resize relative group"
              >
                {/* Visual Handle Indicator */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-gray-400 rounded-full group-hover:bg-primary transition-colors"></div>
              </div>
            </div>
          </div>

          {/* Desktop Button Group: Satellite + 3D + Measure */}
          <div
            className="absolute bottom-6 z-10 flex gap-2 items-end transition-all duration-300"
            style={{ left: sidebarOpen ? `${sidebarWidth + 24}px` : '24px' }}
          >
            <SatelliteToggleButton
              isSatelliteView={isSatelliteView}
              onToggle={toggleSatelliteView}
              isMobile={false}
            />
            <HistoricalAerialsButton
              layersVisible={aerialLayersVisible}
              onToggleAll={toggleAllAerialLayers}
              onToggleLayer={toggleAerialLayer}
              onToggleGroup={toggleGroupAerialLayers}
              isMobile={false}
              isDisabled={!isInBWBounds}
            />
            <ProtectedAreasButton
              layersVisible={protectedLayersVisible}
              onToggleAll={toggleAllProtectedLayers}
              onToggleLayer={toggleProtectedLayer}
              isMobile={false}
            />
            <MapControlButton
              isActive={is3DMode}
              onClick={toggle3DMode}
              title={is3DMode ? '3D-Ansicht deaktivieren' : '3D-Ansicht aktivieren'}
              label="Gelände"
              isMobile={false}
            >
              <span className={`text-base font-bold leading-none ${is3DMode ? 'text-primary' : 'text-gray-700 group-hover:text-primary'} transition-colors`}>3D</span>
            </MapControlButton>
            <MeasureButton
              isMeasureMode={isMeasureMode}
              onToggle={toggleMeasureMode}
              isMobile={false}
            />
            {isLayerLoading && (
              <div className="flex items-center justify-center self-center w-8 h-8">
                <div className="w-5 h-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
          </div>

          {/* Measure Panel */}
          {isMeasureMode && (
            <MeasurePanel
              features={selectedFeatures}
              onClear={() => clearMeasureSelection(true)}
              isTreeDetectEnabled={isTreeAutoDetect}
              onToggleTreeDetect={toggleTreeAutoDetect}
              loadingTreeIds={loadingTreeIds}
            />
          )}
        </div>
      )}

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
          {toasts.map(t => (
            <div
              key={t.id}
              className="flex items-start gap-2 bg-gray-900 text-white text-sm rounded-lg px-4 py-3 shadow-xl max-w-sm pointer-events-auto animate-in fade-in slide-in-from-bottom-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{t.message}</span>
              <button
                type="button"
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                className="ml-1 shrink-0 text-gray-400 hover:text-white transition-colors"
                aria-label="Hinweis schließen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
