import type { Metadata } from "next";
import StandardLayout from '@/components/layouts/StandardLayout';

export const metadata: Metadata = {
    title: "Datenschutzerklärung",
    description: "Datenschutzerklärung des Streuobstwiesen Portals – Informationen zur Verarbeitung personenbezogener Daten gemäß DSGVO.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function DatenschutzLayout({
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
