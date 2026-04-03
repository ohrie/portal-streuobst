'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface RecentSearch {
    name: string;
    coordinates: [number, number];
}

interface RecentSearchesProps {
    onSearchClick: (search: RecentSearch) => void;
}

const MAX_RECENT_SEARCHES = 5;
const STORAGE_KEY = 'streuobst_recent_searches';

export default function RecentSearches({ onSearchClick }: RecentSearchesProps) {
    const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        const loadSearches = () => {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    setRecentSearches(JSON.parse(stored));
                }
            } catch (error) {
                console.error('Failed to load recent searches:', error);
            }
        };

        loadSearches();

        // Listen for updates from other components
        const handleUpdate = () => loadSearches();
        window.addEventListener('recentSearchesUpdated', handleUpdate);

        return () => {
            window.removeEventListener('recentSearchesUpdated', handleUpdate);
        };
    }, []);

    const removeSearch = (index: number) => {
        const updated = recentSearches.filter((_, i) => i !== index);
        setRecentSearches(updated);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (error) {
            console.error('Failed to save recent searches:', error);
        }
    };

    if (recentSearches.length === 0) {
        return null;
    }

    return (
        <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2 font-medium">Letzte Suchen</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
                {recentSearches.map((search, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-1.5 transition-colors group shrink-0"
                    >
                        <button
                            type="button"
                            onClick={() => onSearchClick(search)}
                            className="text-sm text-gray-700 font-medium whitespace-nowrap"
                        >
                            {search.name}
                        </button>
                        <button
                            type="button"
                            onClick={() => removeSearch(index)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 shrink-0"
                            title="Entfernen"
                            aria-label={`Suche ${search.name} entfernen`}
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Export function to add a new recent search
export function addRecentSearch(name: string, coordinates: [number, number]) {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const existing: RecentSearch[] = stored ? JSON.parse(stored) : [];

        // Remove duplicate if exists (by name)
        const filtered = existing.filter(s => s.name !== name);

        // Add to the beginning
        const updated = [{ name, coordinates }, ...filtered].slice(0, MAX_RECENT_SEARCHES);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        // Dispatch custom event to notify all RecentSearches components
        window.dispatchEvent(new CustomEvent('recentSearchesUpdated'));
    } catch (error) {
        console.error('Failed to add recent search:', error);
    }
}
