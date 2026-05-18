import type { Metadata } from "next";
import StandardLayout from '@/components/layouts/StandardLayout';

export const metadata: Metadata = {
    title: "Daten & Mitmachen – Streuobstwiesen kartieren",
    description: "Hilf dabei, alle Streuobstwiesen in Deutschland auf OpenStreetMap zu kartieren. Lerne wie du Obstwiesen einträgst und zum größten Streuobst-Datensatz beiträgst.",
    keywords: "Streuobstwiesen kartieren, OpenStreetMap, Mitmachen, Obstwiesen Daten, Citizen Science",
    alternates: {
        canonical: "/data",
    },
};

export default function DataLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <StandardLayout>
            {children}
        </StandardLayout>
    );
}
