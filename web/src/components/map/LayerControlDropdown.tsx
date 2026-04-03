'use client';

import { useEffect, useRef, useState } from 'react';
import MapControlButton from './MapControlButton';

export interface LayerItem {
    id: string;
    label: string;
    isActive: boolean;
    legendSrc?: string;
    group?: string;
}

interface LayerControlDropdownProps {
    icon: React.ReactNode;
    label: string;
    isAnyActive: boolean;
    buttonTitle: string;
    /** When true, clicking the main button opens/closes the panel instead of calling onToggleAll */
    mainButtonOpensPanel?: boolean;
    onToggleAll: () => void;
    panelTitle: string;
    attribution: { label: string; href: string };
    layers: LayerItem[];
    onToggleLayer: (id: string) => void;
    /** When provided, a toggle button is shown next to each group header */
    onToggleGroup?: (group: string) => void;
    isMobile: boolean;
    extraNote?: string;
    /** Short info text shown as a banner below the panel header */
    panelNote?: string;
    isDisabled?: boolean;
    disabledMessage?: string;
    /** When true, items are rendered as compact number chips (no legend image, no checkbox) */
    compactItems?: boolean;
}

export default function LayerControlDropdown({
    icon,
    label,
    isAnyActive,
    buttonTitle,
    mainButtonOpensPanel = false,
    onToggleAll,
    panelTitle,
    attribution,
    layers,
    onToggleLayer,
    onToggleGroup,
    isMobile,
    extraNote,
    panelNote,
    isDisabled = false,
    disabledMessage,
    compactItems = false,
}: LayerControlDropdownProps) {
    const [panelOpen, setPanelOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const panelId = `layer-panel-${label.toLowerCase().replace(/\s+/g, '-')}`;

    useEffect(() => {
        if (!panelOpen) return;
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setPanelOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [panelOpen]);

    useEffect(() => {
        if (isDisabled) setPanelOpen(false);
    }, [isDisabled]);

    const handleMainButtonClick = () => {
        if (mainButtonOpensPanel) {
            if (isAnyActive) {
                onToggleAll(); // deactivate all active layers
            } else {
                setPanelOpen(v => !v); // open panel to select layers
            }
        } else {
            onToggleAll();
        }
    };

    // Build grouped structure for compact rendering
    const groups: { name: string; items: LayerItem[] }[] = [];
    if (compactItems) {
        for (const item of layers) {
            const groupName = item.group ?? '';
            const existing = groups.find(g => g.name === groupName);
            if (existing) {
                existing.items.push(item);
            } else {
                groups.push({ name: groupName, items: [item] });
            }
        }
    }

    // For standard rendering: track last group to render headers
    let lastGroup: string | undefined = undefined;

    const panelVisible = panelOpen;

    return (
        <div ref={wrapperRef} className="relative group">
            {/* Dropup panel — only when not disabled */}
            {!isDisabled && (
                <div
                    id={panelId}
                    className={`absolute bottom-full left-1/2 -translate-x-1/2 pb-2 pointer-events-none transition-all duration-200 z-50
                        ${panelVisible
                            ? 'opacity-100 translate-y-0 pointer-events-auto'
                            : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto'
                        }`}
                >
                    <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-2 w-56 flex flex-col gap-0.5 max-h-96 overflow-y-auto">
                        <div className="flex items-center justify-between px-2 pt-1 pb-0.5 sticky top-0 bg-white z-10">
                            <div>
                                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                                    {panelTitle}
                                </p>
                                {extraNote && (
                                    <p className="text-[9px] text-gray-400 leading-tight">{extraNote}</p>
                                )}
                            </div>
                            <a
                                href={attribution.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] text-gray-400 hover:text-primary transition-colors shrink-0 ml-1"
                            >
                                © {attribution.label}
                            </a>
                        </div>

                        {panelNote && (
                            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-2 py-1.5 leading-tight mx-0.5">
                                {panelNote}
                            </p>
                        )}

                        {compactItems ? (
                            /* Compact grid rendering — one group per decade */
                            <div className="flex flex-col gap-1 mt-0.5">
                                {groups.map(({ name, items }) => {
                                    const anyGroupActive = items.some(i => i.isActive);
                                    return (
                                        <div key={name}>
                                            <div className="flex items-center justify-between px-2 py-1">
                                                <span className="text-xs font-semibold text-gray-600">{name}</span>
                                                {onToggleGroup && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); onToggleGroup(name); }}
                                                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded transition-colors cursor-pointer ${anyGroupActive ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                    >
                                                        {anyGroupActive ? 'Alle aus' : 'Alle an'}
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-1 px-2 pb-1">
                                                {items.map(item => (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); onToggleLayer(item.id); }}
                                                        className={`text-xs font-medium px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${item.isActive ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary'}`}
                                                    >
                                                        {item.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* Standard rendering with legend icons and checkboxes */
                            layers.map((layer) => {
                                const showGroupHeader = layer.group !== undefined && layer.group !== lastGroup;
                                if (layer.group !== undefined) lastGroup = layer.group;

                                return (
                                    <div key={layer.id}>
                                        {showGroupHeader && (
                                            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide px-2 pt-2 pb-0.5">
                                                {layer.group}
                                            </p>
                                        )}
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); onToggleLayer(layer.id); }}
                                            className={`flex items-center gap-2 w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-gray-50 cursor-pointer ${layer.isActive ? 'bg-primary/5' : ''}`}
                                        >
                                            {layer.legendSrc && (
                                                <img src={layer.legendSrc} alt="" width={20} height={20} className="w-5 h-5 object-contain shrink-0" />
                                            )}
                                            <span className={`text-xs font-medium flex-1 ${layer.isActive ? 'text-primary' : 'text-gray-700'}`}>
                                                {layer.label}
                                            </span>
                                            <span className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${layer.isActive ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                                                {layer.isActive && (
                                                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                                                        <path d="M1.5 5 4 7.5 8.5 2.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                )}
                                            </span>
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    {/* Caret */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-2 translate-y-1/2 w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45" />
                </div>
            )}

            {/* Disabled info — shown on hover when out of bounds */}
            {isDisabled && disabledMessage && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-2 pointer-events-none z-50
                    opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                    <div className="bg-white rounded-xl shadow-xl border border-gray-200 px-3 py-2 w-48 text-center">
                        <p className="text-xs text-gray-500 leading-snug">{disabledMessage}</p>
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-2 translate-y-1/2 w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45" />
                </div>
            )}

            {/* Main button */}
            <div className="relative">
                <MapControlButton
                    isActive={isAnyActive && !isDisabled}
                    onClick={isDisabled ? () => { } : handleMainButtonClick}
                    title={isDisabled ? (disabledMessage ?? buttonTitle) : buttonTitle}
                    label={label}
                    isMobile={isMobile}
                >
                    <span className={isDisabled ? 'opacity-40' : ''}>
                        {icon}
                    </span>
                </MapControlButton>

                {/* Expand chevron — static indicator, shown whenever not disabled */}
                {!isDisabled && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white border border-gray-200 rounded-full shadow flex items-center justify-center z-10 pointer-events-none">
                        <svg
                            className="w-2.5 h-2.5 text-gray-500"
                            viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
                        >
                            <path d="M2 6.5 5 3.5 8 6.5" />
                        </svg>
                    </span>
                )}
            </div>
        </div>
    );
}
