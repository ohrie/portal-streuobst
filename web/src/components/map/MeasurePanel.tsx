'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { formatArea, type SelectedFeature } from '@/lib/geoArea';

interface MeasurePanelProps {
    features: SelectedFeature[];
    onClear: () => void;
    isTreeDetectEnabled: boolean;
    onToggleTreeDetect: () => void;
    loadingTreeIds: Set<string>;
}

export default function MeasurePanel({ features, onClear, isTreeDetectEnabled, onToggleTreeDetect, loadingTreeIds }: MeasurePanelProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const panelContentId = 'measure-panel-content';

    const totalM2 = features.reduce((sum, f) => sum + f.areaM2, 0);
    const countsKnown = features.some(f => f.treeCount != null);
    const totalTrees = countsKnown
        ? features.reduce((sum, f) => sum + (f.treeCount ?? 0), 0)
        : undefined;
    const detectedCountsKnown = features.some(f => f.detectedTreeCount != null);
    const totalDetectedTrees = detectedCountsKnown
        ? features.reduce((sum, f) => sum + (f.detectedTreeCount ?? 0), 0)
        : undefined;

    return (
        <div className="absolute bottom-4 right-4 z-30 bg-white rounded-lg shadow-lg border border-gray-200 w-64 flex flex-col max-h-[min(90dvh,480px)]">
            {/* Main panel content */}
            <div className="p-4 flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between mb-3 shrink-0">
                    <h3 className="font-bold text-nature text-sm">Ausgewählte Flächen</h3>
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                            {features.length}
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsCollapsed(v => !v)}
                            className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title={isCollapsed ? 'Ausklappen' : 'Einklappen'}
                            aria-label={isCollapsed ? 'Messbereich ausklappen' : 'Messbereich einklappen'}
                            aria-expanded={!isCollapsed}
                            aria-controls={panelContentId}
                        >
                            {isCollapsed
                                ? <ChevronDown className="w-4 h-4" />
                                : <ChevronUp className="w-4 h-4" />
                            }
                        </button>
                    </div>
                </div>

                {!isCollapsed && (
                    <div id={panelContentId} className="flex flex-col min-h-0 flex-1">
                        {features.length === 0 ? (
                            <p className="text-sm text-gray-500 mb-3 shrink-0">Klicke auf eine Fläche zum Auswählen</p>
                        ) : (
                            <ul className="space-y-2 mb-3 overflow-y-auto min-h-0 flex-1">
                                {features.map((f, i) => {
                                    const isLoading = loadingTreeIds.has(String(f.id));
                                    return (
                                        <li key={`${f.sourceLayer}:${f.id}`} className="text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-700 truncate mr-2">{f.name || `Fläche ${i + 1}`}</span>
                                                <span className="text-nature font-medium whitespace-nowrap">{formatArea(f.areaM2)}</span>
                                            </div>
                                            {isLoading ? (
                                                <div className="text-xs text-primary mt-0.5 flex items-center gap-1">
                                                    <div className="w-3 h-3 animate-spin rounded-full border border-primary border-t-transparent shrink-0" />
                                                    <span>Bäume werden ermittelt…</span>
                                                </div>
                                            ) : f.treeDetectionFailed ? (
                                                <div className="text-xs text-red-600 mt-0.5">
                                                    Baumerkennung fehlgeschlagen
                                                </div>
                                            ) : f.detectedTreeCount != null ? (
                                                <div className="text-xs text-green-700 mt-0.5">
                                                    🌳 {f.detectedTreeCount.toLocaleString('de-DE')} erkannte Bäume
                                                </div>
                                            ) : f.treeCount != null && f.treeCount > 0 ? (
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    🌳 {f.treeCount.toLocaleString('de-DE')} Bäume
                                                </div>
                                            ) : null}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        {features.length > 0 && (
                            <div className="border-t pt-2 mb-3 space-y-1 shrink-0">
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-nature">Gesamt</span>
                                    <span className="text-nature">{formatArea(totalM2)}</span>
                                </div>
                                {totalDetectedTrees != null && (
                                    <div className="flex justify-between text-sm text-green-700">
                                        <span>🌳 Erkannte Bäume</span>
                                        <span className="font-medium">{totalDetectedTrees.toLocaleString('de-DE')}</span>
                                    </div>
                                )}
                                {totalTrees != null && totalTrees > 0 && totalDetectedTrees == null && (
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>🌳 Bäume gesamt</span>
                                        <span className="font-medium">{totalTrees.toLocaleString('de-DE')}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={onClear}
                            className="w-full text-xs text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-300 rounded px-2 py-1 transition-colors shrink-0"
                        >
                            Auswahl leeren
                        </button>
                    </div>
                )}
            </div>

            {/* Tree Detection Section – always visible */}
            <div className="border-t-2 border-dashed border-gray-200 px-4 py-3 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-gray-700">Bäume automatisch ermitteln</span>
                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 rounded px-1 py-0.5 leading-none">Beta</span>
                        <div className="relative group/info">
                            <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                            <div className="absolute bottom-full right-0 mb-2 w-60 bg-gray-900 text-white text-xs rounded-lg p-2.5 shadow-xl opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">
                                Automatische Ermittlung auf Basis des amtlichen DGM und DOM (Canopy Height Model, CHM). Die Berechnung ist fehlerbehaftet – insbesondere kleinere Bäume werden nicht zuverlässig erkannt.
                                <br /><br />
                                <span className="font-medium">Derzeit nur in Baden-Württemberg verfügbar.</span>
                                <div className="absolute top-full right-2 border-4 border-transparent border-t-gray-900" />
                            </div>
                        </div>
                    </div>
                    {/* Toggle switch */}
                    <button
                        type="button"
                        onClick={onToggleTreeDetect}
                        className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${isTreeDetectEnabled ? 'bg-primary' : 'bg-gray-300'}`}
                        aria-pressed={isTreeDetectEnabled}
                        aria-label={isTreeDetectEnabled ? 'Automatische Baumerkennung deaktivieren' : 'Automatische Baumerkennung aktivieren'}
                        title={isTreeDetectEnabled ? 'Baumerkennung deaktivieren' : 'Baumerkennung aktivieren'}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${isTreeDetectEnabled ? 'translate-x-4' : 'translate-x-0'}`}
                        />
                    </button>
                </div>
                {isTreeDetectEnabled && (
                    <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                        Daten berechnet aus Geobasisdaten des <a
                            href="https://www.lgl-bw.de/Produkte/Open-Data/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-gray-700"
                        >
                            LGL, www.lgl-bw.de
                        </a>
                        <br />Lizenz: {' '}
                        <a
                            href="http://www.govdata.de/dl-de/by-2-0"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-gray-700"
                        >
                            Datenlizenz Deutschland – Namensnennung – Version 2.0
                        </a>{' '}
                    </p>
                )}
            </div>
        </div>
    );
}
