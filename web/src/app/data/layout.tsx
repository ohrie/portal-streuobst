import StandardLayout from '@/components/layouts/StandardLayout';

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
