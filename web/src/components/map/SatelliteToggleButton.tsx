'use client';

import SatelliteIcon from '@/components/icons/SatelliteIcon';
import MapIcon from '@/components/icons/MapIcon';
import MapControlButton from './MapControlButton';

interface SatelliteToggleButtonProps {
    isSatelliteView: boolean;
    onToggle: () => void;
    isMobile: boolean;
}

export default function SatelliteToggleButton({
    isSatelliteView,
    onToggle,
    isMobile,
}: SatelliteToggleButtonProps) {
    const iconClass = 'w-5 h-5';

    return (
        <MapControlButton
            isActive={isSatelliteView}
            onClick={onToggle}
            title={isSatelliteView ? 'Zur Kartenansicht wechseln' : 'Zur Satellitenansicht wechseln'}
            label={isSatelliteView ? 'Straßen' : 'Luftbild'}
            isMobile={isMobile}
        >
            {isSatelliteView ? (
                <MapIcon className={`${iconClass} text-primary transition-colors`} />
            ) : (
                <SatelliteIcon className={`${iconClass} text-gray-700 group-hover:text-primary transition-colors`} />
            )}
        </MapControlButton>
    );
}
