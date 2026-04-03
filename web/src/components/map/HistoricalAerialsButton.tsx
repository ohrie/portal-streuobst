'use client';

import LayerControlDropdown from './LayerControlDropdown';

export const HISTORICAL_AERIAL_LAYERS = [
    // 1960er – nur 5 Jahre verfügbar
    { id: '1960', label: '1960', group: '1960er', endpoint: '1960-1969' },
    { id: '1961', label: '1961', group: '1960er', endpoint: '1960-1969' },
    { id: '1964', label: '1964', group: '1960er', endpoint: '1960-1969' },
    { id: '1968', label: '1968', group: '1960er', endpoint: '1960-1969' },
    { id: '1969', label: '1969', group: '1960er', endpoint: '1960-1969' },
    // 1970er – alle 10 Jahre
    { id: '1970', label: '1970', group: '1970er', endpoint: '1970-1979' },
    { id: '1971', label: '1971', group: '1970er', endpoint: '1970-1979' },
    { id: '1972', label: '1972', group: '1970er', endpoint: '1970-1979' },
    { id: '1973', label: '1973', group: '1970er', endpoint: '1970-1979' },
    { id: '1974', label: '1974', group: '1970er', endpoint: '1970-1979' },
    { id: '1975', label: '1975', group: '1970er', endpoint: '1970-1979' },
    { id: '1976', label: '1976', group: '1970er', endpoint: '1970-1979' },
    { id: '1977', label: '1977', group: '1970er', endpoint: '1970-1979' },
    { id: '1978', label: '1978', group: '1970er', endpoint: '1970-1979' },
    { id: '1979', label: '1979', group: '1970er', endpoint: '1970-1979' },
    // 1980er – alle 10 Jahre
    { id: '1980', label: '1980', group: '1980er', endpoint: '1980-1989' },
    { id: '1981', label: '1981', group: '1980er', endpoint: '1980-1989' },
    { id: '1982', label: '1982', group: '1980er', endpoint: '1980-1989' },
    { id: '1983', label: '1983', group: '1980er', endpoint: '1980-1989' },
    { id: '1984', label: '1984', group: '1980er', endpoint: '1980-1989' },
    { id: '1985', label: '1985', group: '1980er', endpoint: '1980-1989' },
    { id: '1986', label: '1986', group: '1980er', endpoint: '1980-1989' },
    { id: '1987', label: '1987', group: '1980er', endpoint: '1980-1989' },
    { id: '1988', label: '1988', group: '1980er', endpoint: '1980-1989' },
    { id: '1989', label: '1989', group: '1980er', endpoint: '1980-1989' },
    // 1990er – alle 10 Jahre
    { id: '1990', label: '1990', group: '1990er', endpoint: '1990-1999' },
    { id: '1991', label: '1991', group: '1990er', endpoint: '1990-1999' },
    { id: '1992', label: '1992', group: '1990er', endpoint: '1990-1999' },
    { id: '1993', label: '1993', group: '1990er', endpoint: '1990-1999' },
    { id: '1994', label: '1994', group: '1990er', endpoint: '1990-1999' },
    { id: '1995', label: '1995', group: '1990er', endpoint: '1990-1999' },
    { id: '1996', label: '1996', group: '1990er', endpoint: '1990-1999' },
    { id: '1997', label: '1997', group: '1990er', endpoint: '1990-1999' },
    { id: '1998', label: '1998', group: '1990er', endpoint: '1990-1999' },
    { id: '1999', label: '1999', group: '1990er', endpoint: '1990-1999' },
    // 2010er – ohne 2010 und 2011
    { id: '2012', label: '2012', group: '2010er', endpoint: '2010-2019' },
    { id: '2013', label: '2013', group: '2010er', endpoint: '2010-2019' },
    { id: '2014', label: '2014', group: '2010er', endpoint: '2010-2019' },
    { id: '2015', label: '2015', group: '2010er', endpoint: '2010-2019' },
    { id: '2016', label: '2016', group: '2010er', endpoint: '2010-2019' },
    { id: '2017', label: '2017', group: '2010er', endpoint: '2010-2019' },
    { id: '2018', label: '2018', group: '2010er', endpoint: '2010-2019' },
    { id: '2019', label: '2019', group: '2010er', endpoint: '2010-2019' },
] as const;

interface Props {
    layersVisible: Record<string, boolean>;
    onToggleAll: () => void;
    onToggleLayer: (layerId: string) => void;
    onToggleGroup: (group: string) => void;
    isMobile: boolean;
    isDisabled?: boolean;
}

export default function HistoricalAerialsButton({ layersVisible, onToggleAll, onToggleLayer, onToggleGroup, isMobile, isDisabled }: Props) {
    const isAnyActive = Object.values(layersVisible).some(Boolean);

    const layers = HISTORICAL_AERIAL_LAYERS.map((l) => ({
        id: l.id,
        label: l.label,
        group: l.group,
        isActive: layersVisible[l.id] ?? false,
    }));

    const icon = (
        <svg
            className={`w-5 h-5 transition-colors ${isAnyActive && !isDisabled ? 'text-primary' : 'text-gray-700 group-hover:text-primary'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {/* Clock face */}
            <circle cx="12" cy="12" r="9" />
            {/* Clock hands */}
            <polyline points="12 7 12 12 9 15" />
            {/* Counter-clockwise arrow */}
            <path d="M5.6 5.6 A8.5 8.5 0 0 0 4 10" />
            <polyline points="3 8 4 10 6 9" />
        </svg>
    );

    return (
        <LayerControlDropdown
            icon={icon}
            label="Hist."
            isAnyActive={isAnyActive}
            buttonTitle="Historische Luftbilder"
            mainButtonOpensPanel={true}
            onToggleAll={onToggleAll}
            panelTitle="Historische Luftbilder"
            attribution={{ label: 'LGL-BW', href: 'https://www.lgl-bw.de' }}
            layers={layers}
            onToggleLayer={onToggleLayer}
            onToggleGroup={onToggleGroup}
            isMobile={isMobile}
            extraNote="Nur Baden-Württemberg"
            panelNote="Nicht jedes Gebiet ist durch jedes Erfassungsjahr abgedeckt."
            isDisabled={isDisabled}
            disabledMessage="Historische Luftbilder sind nur für Baden-Württemberg verfügbar"
            compactItems={true}
        />
    );
}
