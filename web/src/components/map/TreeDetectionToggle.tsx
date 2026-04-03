'use client';

declare global {
    interface Window {
        umami?: { track: (name: string, data?: Record<string, unknown>) => void };
    }
}

interface TreeDetectionToggleProps {
    isActive: boolean;
    loadingCount: number;
    onToggle: () => void;
    isMobile: boolean;
}

export default function TreeDetectionToggle({ isActive, loadingCount, onToggle, isMobile }: TreeDetectionToggleProps) {
    const widthClass = isMobile ? 'min-w-[52px]' : 'min-w-[80px]';
    const paddingClass = isMobile ? 'p-1.5' : 'p-2';
    const iconClass = isMobile ? 'w-5 h-5' : 'w-6 h-6';
    const baseClasses = `bg-white hover:bg-gray-50 rounded-lg shadow-lg border transition-all duration-200 hover:shadow-xl flex flex-col items-center justify-center ${paddingClass} gap-1 group cursor-pointer`;
    const borderClass = isActive ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200';
    const isLoading = loadingCount > 0;

    return (
        <div className={widthClass}>
            <button
                type="button"
                onClick={() => {
                    window.umami?.track('tree-detection-toggle', { action: isActive ? 'deactivate' : 'activate' });
                    onToggle();
                }}
                className={`${baseClasses} ${borderClass}`}
                title={isActive ? 'Baumerkennung beenden' : 'Bäume erkennen'}
                aria-pressed={isActive}
                aria-label={isActive ? 'Baumerkennung beenden' : 'Baumerkennung starten'}
            >
                {isLoading ? (
                    <div className={`${iconClass} animate-spin rounded-full border-2 border-primary border-t-transparent`} />
                ) : (
                    <svg
                        className={`${iconClass} text-gray-700 group-hover:text-primary transition-colors`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M12 2C10.9 2 10 2.9 10 4c0 .7.4 1.4 1 1.7V7c-2.8.5-5 3-5 5.9V20h2v-7.1c0-2.2 1.6-4.1 3.8-4.4.1 0 .2 0 .2 0V5.7c.6-.3 1-1 1-1.7 0-1.1-.9-2-2-2zm-4 20v2h8v-2H8z" />
                        <circle cx="12" cy="14" r="3" opacity="0.4" />
                    </svg>
                )}
                <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-gray-700'}`}>
                    {isLoading ? `${loadingCount}…` : 'Bäume'}
                </span>
            </button>
        </div>
    );
}
