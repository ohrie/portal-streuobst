import type { Metadata } from "next";
import StandardLayout from '@/components/layouts/StandardLayout';

export const metadata: Metadata = {
    title: "Impressum",
    description: "Impressum des Streuobstwiesen Portals",
    robots: {
        index: false,
        follow: false,
    },
};

export default function ImpressumLayout({
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
