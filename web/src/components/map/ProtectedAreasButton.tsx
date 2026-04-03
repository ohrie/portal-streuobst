'use client';

import LayerControlDropdown from './LayerControlDropdown';

export const PROTECTED_LAYERS = [
    { id: 'Naturschutzgebiete', label: 'Naturschutzgebiete' },
    { id: 'Landschaftsschutzgebiete', label: 'Landschaftsschutzgeb.' },
    { id: 'Nationalparke', label: 'Nationalparke' },
    { id: 'Naturparke', label: 'Naturparke' },
    { id: 'Biosphaerenreservate', label: 'Biosphärenreservate' },
    { id: 'Vogelschutzgebiete', label: 'Vogelschutzgebiete' },
    { id: 'Fauna_Flora_Habitat_Gebiete', label: 'FFH-Gebiete' },
    { id: 'Nationale_Naturmonumente', label: 'Naturmonumente' },
] as const;

const LEGEND_BASE =
    'https://geodienste.bfn.de/ogc/wms/schutzgebiet?SERVICE=WMS&REQUEST=GetLegendGraphic&VERSION=1.3.0&FORMAT=image/png&LAYER=';

interface Props {
    layersVisible: Record<string, boolean>;
    onToggleAll: () => void;
    onToggleLayer: (layerId: string) => void;
    isMobile: boolean;
}

export default function ProtectedAreasButton({ layersVisible, onToggleAll, onToggleLayer, isMobile }: Props) {
    const isAnyActive = Object.values(layersVisible).some(Boolean);

    const layers = PROTECTED_LAYERS.map((layer) => ({
        id: layer.id,
        label: layer.label,
        isActive: layersVisible[layer.id] ?? false,
        legendSrc: `${LEGEND_BASE}${layer.id}`,
    }));

    const icon = (
        <svg
            className={`w-5 h-5 transition-colors ${isAnyActive ? 'text-primary' : 'text-gray-700 group-hover:text-primary'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    );

    return (
        <LayerControlDropdown
            icon={icon}
            label="Schutz"
            isAnyActive={isAnyActive}
            buttonTitle={isAnyActive ? 'Alle Schutzgebiete ausblenden' : 'Alle Schutzgebiete einblenden'}
            onToggleAll={onToggleAll}
            panelTitle="Schutzgebiete"
            panelNote="Offizielle Karten der Schutzgebiete in Deutschland."
            attribution={{ label: 'BfN', href: 'https://www.bfn.de' }}
            layers={layers}
            onToggleLayer={onToggleLayer}
            isMobile={isMobile}
        />
    );
}
