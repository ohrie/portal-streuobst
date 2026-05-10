import type { Metadata } from "next";
import StandardLayout from '@/components/layouts/StandardLayout';

export const metadata: Metadata = {
    title: "Was sind Streuobstwiesen?",
    description: "Erfahre alles über Streuobstwiesen: ihre Bedeutung für Artenvielfalt, Klima und Kulturlandschaft in Deutschland. Hochstamm-Obstbäume und ihre ökologische Rolle.",
    keywords: "Streuobstwiesen Bedeutung, Hochstamm Obstbäume, Artenvielfalt, Kulturlandschaft, Obstwiesen Ökologie",
};

export default function AboutLayout({
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
