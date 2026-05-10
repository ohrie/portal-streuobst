import type { Metadata } from "next";
import StandardLayout from '@/components/layouts/StandardLayout';

export const metadata: Metadata = {
    title: "Streuobstwiesen bewirtschaften & Initiativen",
    description: "Tipps zur Bewirtschaftung von Streuobstwiesen und Übersicht bundesweiter Initiativen und Förderangebote für Streuobstwiesen-Besitzer.",
    keywords: "Streuobstwiesen bewirtschaften, Streuobst Pflege, Initiativen, Förderung, Hochstamm Pflege",
};

export default function BewirtschaftungLayout({
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
