'use client';

import Button from '@/components/Button';
import PlusIcon from '@/components/icons/PlusIcon';
import LegendItem from './LegendItem';

interface MapLegendProps {
    onClose?: () => void;
    showCloseButton?: boolean;
    lastUpdated?: string | null;
}

export default function MapLegend({ onClose, showCloseButton = false, lastUpdated }: MapLegendProps) {
    return (
        <div className="p-6 overflow-y-auto flex-1 min-h-0 pb-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-nature">Kartenlegende</h2>
                {showCloseButton && onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Legende schließen"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Legend */}
            <div className="space-y-6">
                <div>
                    {/* Legend Items */}
                    <div className="space-y-3">
                        {/* Streuobstwiesen */}
                        {/* Obstwiesen */}
                        <LegendItem
                            icon={
                                <div className="w-6 h-6 bg-green-700 rounded border border-green-800 opacity-75 shrink-0 mt-0.5"></div>
                            }
                            title="Obstwiesen (allgemein)"
                            description="Kategorisierung unklar"
                            osmTags={[{ key: 'landuse', value: 'orchard' }]}
                            osmWarning="Fehlt noch: orchard=meadow_orchard"
                        />

                        <LegendItem
                            icon={
                                <div className="w-6 h-6 bg-orange-500 rounded border border-orange-600 opacity-75 shrink-0 mt-0.5"></div>
                            }
                            title="Streuobstwiesen"
                            description="Traditionelle Streuobstwiesen"
                            osmTags={[
                                { key: 'landuse', value: 'orchard' },
                                { key: 'orchard', value: 'meadow_orchard' }
                            ]}
                            osmWikiUrl="https://wiki.openstreetmap.org/wiki/Tag:orchard%3Dmeadow_orchard"
                        />


                        {/* Plantagen */}
                        <LegendItem
                            icon={
                                <div className="w-6 h-6 bg-gray-300 rounded border border-gray-400 opacity-50 shrink-0 mt-0.5"></div>
                            }
                            title="Obstplantagen"
                            description="Kommerzielle Plantagen"
                            osmTags={[
                                { key: 'landuse', value: 'orchard' },
                                { key: 'orchard', value: 'plantation' }
                            ]}
                            osmWikiUrl="https://wiki.openstreetmap.org/wiki/Tag:orchard%3Dplantation"
                        />

                        {/* Obstbäume */}
                        <LegendItem
                            icon={
                                <div className="w-6 h-6 bg-green-600 rounded-full border-2 border-green-800 shrink-0 mt-0.5"></div>
                            }
                            title="Obstbäume"
                            description="Einzelne Obstbäume (ab Zoom 10)"
                            osmTags={[{ key: 'natural', value: 'tree' }]}
                        />

                    </div>
                </div>

                {/* Important Notice */}
                <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-orange-600 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="text-left">
                            <h2 className="text-base font-bold text-orange-900 mb-2">Wichtiger Hinweis</h2>
                            <p className="text-sm text-orange-900 leading-relaxed">
                                Bitte beachte: <strong>Obst von Streuobstwiesen darf nicht ohne Erlaubnis geerntet werden.</strong> Ernte nur, wenn du die Erlaubnis hast.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Data Information & Call to Action */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-nature mb-3">Über diese Daten</h3>

                    <p className="text-sm text-gray-600 mb-4">
                        Gemeinsam kartieren wir alle Streuobstwiesen in Deutschland – um erstmals zu ermitteln, wie viele Quadratmeter dieser wertvollen Biotope existieren. Alle Daten stammen aus <strong>OpenStreetMap</strong> und können von jede:r ergänzt werden. <strong>Die Daten sind nicht vollständig und können Fehler enthalten.</strong>
                    </p>

                    {lastUpdated && (
                        <p className="text-xs text-gray-400 mb-4">
                            Datenstand: {new Date(lastUpdated).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                    )}

                    <div className="space-y-3">
                        <Button href="/data/" variant="primary" className="w-full" icon={PlusIcon as any}>
                            Daten in OpenStreetMap ergänzen
                        </Button>
                    </div>
                </div>
            </div>
            {/* Legal Links */}
            <div className="border-t mt-4 pt-4">
                <p className="text-xs text-gray-400 text-center">
                    <a href="/impressum/" className="hover:text-gray-600 transition-colors">Impressum</a>
                    {' · '}
                    <a href="/datenschutz/" className="hover:text-gray-600 transition-colors">Datenschutz</a>
                </p>
            </div>
        </div>
    );
}
