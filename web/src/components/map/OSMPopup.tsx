import OSMIcon from '@/components/icons/OSMIcon';
import { formatArea } from '@/lib/geoArea';

interface OSMPopupProps {
    title: string;
    description?: string;
    osmId?: string | number;
    additionalContent?: string;
    showOSMTags?: boolean;
    properties?: Record<string, any>;
    areaM2?: number;
    treeCount?: number;
}

// Helper function to create iD editor URL from type_id format
function createIdEditorUrl(osmId: string): string | null {
    if (!osmId) return null;

    const firstChar = osmId.charAt(0);
    const numericId = osmId.slice(1);

    if (firstChar === 'n') {
        return `https://www.openstreetmap.org/edit?editor=id&node=${numericId}`;
    } else if (firstChar === 'w') {
        return `https://www.openstreetmap.org/edit?editor=id&way=${numericId}`;
    } else if (firstChar === 'a') {
        const areaId = parseInt(numericId);
        if (isNaN(areaId)) return null;

        if (areaId % 2 === 0) {
            const originalWayId = areaId / 2;
            return `https://www.openstreetmap.org/edit?editor=id&way=${originalWayId}`;
        } else {
            const originalRelationId = (areaId - 1) / 2;
            return `https://www.openstreetmap.org/edit?editor=id&relation=${originalRelationId}`;
        }
    }

    return `https://www.openstreetmap.org/edit?editor=id&way=${osmId}`;
}

// Helper function to create OSM URL from type_id format
function createOsmUrl(osmId: string): string | null {
    if (!osmId) return null;

    // osmium export with type_id creates IDs like "n123456", "w123456", or "a123456"
    const firstChar = osmId.charAt(0);
    const numericId = osmId.slice(1);

    if (firstChar === 'n') {
        // Node: ID is identical to original node ID
        return `https://www.openstreetmap.org/node/${numericId}`;
    } else if (firstChar === 'w') {
        // Way linestring: ID is identical to original way ID
        return `https://www.openstreetmap.org/way/${numericId}`;
    } else if (firstChar === 'a') {
        // Area: ID is calculated from original ID
        // For ways: area ID = 2 * way ID
        // For relations: area ID = 2 * relation ID + 1
        const areaId = parseInt(numericId);
        if (isNaN(areaId)) return null;

        if (areaId % 2 === 0) {
            // Even number: way area (divide by 2 to get original way ID)
            const originalWayId = areaId / 2;
            return `https://www.openstreetmap.org/way/${originalWayId}`;
        } else {
            // Odd number: relation area (subtract 1 and divide by 2 to get original relation ID)
            const originalRelationId = (areaId - 1) / 2;
            return `https://www.openstreetmap.org/relation/${originalRelationId}`;
        }
    }

    // Fallback: assume it's a way ID
    return `https://www.openstreetmap.org/way/${osmId}`;
}

// Helper function to get display OSM ID and type
function getDisplayOsmId(osmId: string): { displayId: string; type: string } | null {
    if (!osmId) return null;

    const firstChar = osmId.charAt(0);
    const numericId = osmId.slice(1);

    if (firstChar === 'n') {
        return { displayId: numericId, type: 'node' };
    } else if (firstChar === 'w') {
        return { displayId: numericId, type: 'way' };
    } else if (firstChar === 'a') {
        const areaId = parseInt(numericId);
        if (isNaN(areaId)) return null;

        if (areaId % 2 === 0) {
            const originalWayId = areaId / 2;
            return { displayId: String(originalWayId), type: 'way' };
        } else {
            const originalRelationId = (areaId - 1) / 2;
            return { displayId: String(originalRelationId), type: 'relation' };
        }
    }

    return { displayId: osmId, type: 'way' };
}

export function createOSMPopupHTML(props: OSMPopupProps): string {
    const osmUrl = props.osmId ? createOsmUrl(String(props.osmId)) : null;
    const idEditorUrl = props.osmId ? createIdEditorUrl(String(props.osmId)) : null;
    const displayOsmData = props.osmId ? getDisplayOsmId(String(props.osmId)) : null;

    // Build properties HTML if showOSMTags is true
    let propsHtml = '';
    if (props.showOSMTags && props.properties) {
        const propsKeys = Object.keys(props.properties).filter((k) => k !== 'osm_id');
        propsHtml = propsKeys.length
            ? `<ul class="text-sm space-y-1">${propsKeys
                .map((k) => `<li><strong>${k}:</strong> ${String(props.properties![k])}</li>`)
                .join('')}</ul>`
            : '<em class="text-sm">Keine Eigenschaften</em>';
    }

    return `
    <div class="p-3 ${props.showOSMTags ? 'max-w-xs' : ''}">
      <h3 class="text-lg font-bold text-nature mb-2">${props.title}${props.areaM2 != null ? ` <span class="text-sm font-normal text-gray-500">(${formatArea(props.areaM2)})</span>` : ''}</h3>
      ${props.description ? `<p class="text-sm text-warm${props.showOSMTags ? ' mb-2' : ''}">${props.description}</p>` : ''}
      ${props.treeCount != null && props.treeCount > 0 ? `<p class="text-sm text-gray-600 mb-1">Anzahl Bäume 🌳: <strong>${props.treeCount.toLocaleString('de-DE')}</strong></p>` : ''}
      ${props.additionalContent || ''}
      ${displayOsmData && osmUrl ? `
        <div class="mt-2 pt-2 border-t border-gray-200">
          <p class="text-xs font-semibold text-gray-500 mb-1">OpenStreetMap</p>
          <div class="flex items-center justify-between gap-2">
            <a href="${osmUrl}" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm font-mono">
              ${displayOsmData.type}/${displayOsmData.displayId}
            </a>
            ${idEditorUrl ? `
            <a href="${idEditorUrl}" target="_blank" title="In iD Editor bearbeiten" class="text-gray-500 hover:text-blue-600 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </a>
            ` : ''}
          </div>
        </div>
      ` : ''}
      ${props.showOSMTags && propsHtml ? `
        <div class="overflow-auto max-h-40 mt-2 pt-2 border-t border-gray-200">
          <p class="text-xs font-semibold text-gray-500 mb-1">OSM Attribute</p>
          ${propsHtml}
        </div>
      ` : ''}
    </div>
  `;
}
