'use client';

import { Search, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export interface SearchResult {
    properties: {
        name: string;
        city?: string;
        state?: string;
        country?: string;
        osm_type: string;
        osm_key: string;
        osm_value: string;
    };
    geometry: {
        coordinates: [number, number];
    };
}

interface SearchBoxProps {
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
    searchResults: SearchResult[];
    showSearchResults: boolean;
    isSearching: boolean;
    onResultClick: (result: SearchResult) => void;
    onClearSearch: () => void;
    onFocus?: () => void;
}

export default function SearchBox({
    searchQuery,
    onSearchQueryChange,
    searchResults,
    showSearchResults,
    isSearching,
    onResultClick,
    onClearSearch,
    onFocus
}: SearchBoxProps) {
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const resultRefs = useRef<(HTMLButtonElement | null)[]>([]);

    useEffect(() => {
        setHighlightedIndex(-1);
    }, [searchResults]);

    useEffect(() => {
        if (highlightedIndex >= 0 && resultRefs.current[highlightedIndex]) {
            resultRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
        }
    }, [highlightedIndex]);

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (!showSearchResults || searchResults.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(i => Math.min(i + 1, searchResults.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const index = highlightedIndex >= 0 ? highlightedIndex : 0;
            if (searchResults[index]) {
                onResultClick(searchResults[index]);
            }
        }
    }

    return (
        <div>
            <div className="relative">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange(e.target.value)}
                    onFocus={onFocus}
                    onKeyDown={handleKeyDown}
                    placeholder="Ort suchen..."
                    aria-label="Ort suchen"
                    aria-autocomplete="list"
                    aria-controls="search-results-list"
                    className="w-full px-4 py-2 pl-10 pr-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={onClearSearch}
                        aria-label="Suche löschen"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
                <div id="search-results-list" role="listbox" className="mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-y-auto">
                    {isSearching ? (
                        <div className="p-4 text-center text-gray-500">
                            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                        </div>
                    ) : (
                        searchResults.map((result, index) => (
                            <button
                                type="button"
                                key={index}
                                ref={el => { resultRefs.current[index] = el; }}
                                onClick={() => onResultClick(result)}
                                role="option"
                                aria-selected={highlightedIndex === index}
                                className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 transition-colors ${highlightedIndex === index ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                            >
                                <div className="font-medium text-gray-900">{result.properties.name}</div>
                                <div className="text-sm text-gray-500">
                                    {[result.properties.city, result.properties.state, result.properties.country]
                                        .filter(Boolean)
                                        .join(', ')}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
