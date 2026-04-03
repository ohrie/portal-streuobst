'use client';

import { useState } from 'react';

interface Tab {
    id: string;
    label: string;
    content: React.ReactNode;
}

interface TabSwitcherProps {
    tabs: Tab[];
    defaultTab?: string;
    className?: string;
}

export default function TabSwitcher({ tabs, defaultTab, className = '' }: TabSwitcherProps) {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

    const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

    return (
        <div className={className}>
            {/* Tab Navigation */}
            <div role="tablist" className="flex flex-wrap border-b border-gray-200 mb-8">
                {tabs.map((tab, index) => (
                    <button
                        type="button"
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        role="tab"
                        id={`tab-${tab.id}`}
                        aria-selected={activeTab === tab.id}
                        aria-controls={`panel-${tab.id}`}
                        className={`px-4 sm:px-6 py-3 font-medium text-sm sm:text-lg border-b-2 transition-colors duration-200 ${activeTab === tab.id
                            ? 'border-primary text-primary'
                            : 'border-transparent text-foreground hover:text-primary hover:border-gray-300'
                            } ${index === 0 ? 'ml-0' : ''}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div
                className="tab-content"
                role="tabpanel"
                id={activeTab ? `panel-${activeTab}` : undefined}
                aria-labelledby={activeTab ? `tab-${activeTab}` : undefined}
            >
                {activeTabContent}
            </div>
        </div>
    );
}