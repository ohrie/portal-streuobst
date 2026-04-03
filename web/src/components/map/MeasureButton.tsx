'use client';

import MapControlButton from './MapControlButton';

declare global {
    interface Window {
        umami?: { track: (name: string, data?: Record<string, unknown>) => void };
    }
}

interface MeasureButtonProps {
    isMeasureMode: boolean;
    onToggle: () => void;
    isMobile: boolean;
}

export default function MeasureButton({ isMeasureMode, onToggle, isMobile }: MeasureButtonProps) {
    const iconClass = 'w-5 h-5';

    const handleClick = () => {
        window.umami?.track('measure-toggle', { action: isMeasureMode ? 'deactivate' : 'activate' });
        onToggle();
    };

    return (
        <MapControlButton
            isActive={isMeasureMode}
            onClick={handleClick}
            title={isMeasureMode ? 'Messen beenden' : 'Flächen ausmessen'}
            label="Messen"
            isMobile={isMobile}
        >
            <svg
                className={`${iconClass} ${isMeasureMode ? 'text-primary' : 'text-gray-700 group-hover:text-primary'} transition-colors`}
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M8 0h-8v24h24v-24h-16zm-2 22h-4v-4h4v4zm0-18h-2v1h2v2h-2v1h2v2h-2v1h2v2h-2v1h2v2h-4v-14h4v2zm16 18h-14v-4h2v2h1v-2h2v2h1v-2h2v2h1v-2h2v2h1v-2h2v4zm0-6h-14v-14h14v14z" />
            </svg>
        </MapControlButton>
    );
}
