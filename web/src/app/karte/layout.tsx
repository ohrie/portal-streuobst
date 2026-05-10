import type { Metadata } from "next";
import MinimalLayout from '@/components/layouts/MinimalLayout';

export const metadata: Metadata = {
    title: "Interaktive Streuobstwiesen-Karte Deutschland",
    description: "Interaktive Karte aller Streuobstwiesen in Deutschland. Entdecke Obstwiesen in deiner Nähe, zusammen mit Schutzgebieten und und auf historischen Luftbildern.",
    keywords: "Streuobstwiesen Karte, Obstwiesen finden, interaktive Karte, Obstwiesen Deutschland, Karte Hochstamm",
};

export default function MapLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <MinimalLayout noShadow={true}>
            {children}
        </MinimalLayout>
    );
}
