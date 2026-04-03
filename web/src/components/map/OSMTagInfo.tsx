'use client';

interface OSMTagInfoProps {
    tags: Array<{ key: string; value: string }>;
    wikiUrl?: string;
    warning?: string;
}

export default function OSMTagInfo({ tags, wikiUrl, warning }: OSMTagInfoProps) {
    const showPopup = (e: React.MouseEvent<HTMLButtonElement>) => {
        const target = e.currentTarget;
        const existingPopup = document.querySelector('.osm-info-popup');
        if (existingPopup) {
            existingPopup.remove();
            return;
        }

        const popup = document.createElement('div');
        popup.className = 'osm-info-popup fixed z-[9999] bg-white border-2 border-gray-300 rounded-lg p-3 shadow-2xl max-w-xs';

        const tagsHtml = tags
            .map(tag => `<code class="bg-gray-100 px-1 rounded">${tag.key}=${tag.value}</code>`)
            .join(' + ');

        const warningHtml = warning
            ? `<p class="text-xs mt-2 text-yellow-700">${warning}</p>`
            : '';

        const wikiHtml = wikiUrl
            ? `<p class="text-xs mt-2"><a href="${wikiUrl}" target="_blank" class="underline hover:text-blue-700">OSM Wiki →</a></p>`
            : '';

        popup.innerHTML = `<div class="text-sm text-gray-900"><p class="font-semibold mb-1">OpenStreetMap Tags:</p><p>${tagsHtml}</p>${warningHtml}${wikiHtml}</div>`;

        const rect = target.getBoundingClientRect();
        popup.style.left = rect.left + 'px';
        popup.style.top = (rect.bottom + 5) + 'px';
        document.body.appendChild(popup);

        setTimeout(() => popup.remove(), 5000);
    };

    return (
        <button
            type="button"
            onClick={showPopup}
            className="text-gray-600 hover:text-gray-800 shrink-0"
            title="OSM Tagging anzeigen"
            aria-label="OpenStreetMap Tagging anzeigen"
        >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
        </button>
    );
}
