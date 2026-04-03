'use client';

import { ReactNode } from 'react';
import OSMTagInfo from './OSMTagInfo';

interface LegendItemProps {
    icon: ReactNode;
    title: string;
    description: string;
    osmTags?: Array<{ key: string; value: string }>;
    osmWikiUrl?: string;
    osmWarning?: string;
}

export default function LegendItem({
    icon,
    title,
    description,
    osmTags,
    osmWikiUrl,
    osmWarning
}: LegendItemProps) {
    return (
        <div className="flex items-start gap-3">
            {icon}
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <p className="font-medium text-nature">{title}</p>
                    {osmTags && (
                        <OSMTagInfo
                            tags={osmTags}
                            wikiUrl={osmWikiUrl}
                            warning={osmWarning}
                        />
                    )}
                </div>
                <p className="text-sm text-gray-600">{description}</p>
            </div>
        </div>
    );
}
