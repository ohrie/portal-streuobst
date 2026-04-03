import StandardLayout from '@/components/layouts/StandardLayout';

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
