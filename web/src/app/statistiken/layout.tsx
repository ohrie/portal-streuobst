import type { Metadata } from 'next';
import StandardLayout from '@/components/layouts/StandardLayout';

export const metadata: Metadata = {
    title: 'Statistiken je Bundesland',
    description: 'Wie viele Streuobstwiesen gibt es in Bayern, Baden-Württemberg und den anderen Bundesländern? Alle Zahlen auf einen Blick.',
    keywords: 'Streuobstwiesen Statistik, Bundesland, Bayern, Baden-Württemberg, Hektar, OpenStreetMap',
};

export default function StatistikenLayout({ children }: { children: React.ReactNode }) {
    return (
        <StandardLayout>
            {children}
        </StandardLayout>
    );
}
