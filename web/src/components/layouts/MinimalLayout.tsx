'use client';

import Header from '@/components/Header';

interface MinimalLayoutProps {
    children: React.ReactNode;
    noShadow?: boolean;
}

/**
 * Minimal Layout - Nur Navigation, Gesamthöhe 100vh
 * Verwendet für: Kartenseite (/karte)
 */
export default function MinimalLayout({ children, noShadow = false }: MinimalLayoutProps) {
    return (
        <div className="h-dvh flex flex-col">
            <Header noShadow={noShadow} />
            <main className="flex-1 overflow-hidden">
                {children}
            </main>
        </div>
    );
}
