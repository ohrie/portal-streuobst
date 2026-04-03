import StandardLayout from '@/components/layouts/StandardLayout';

export default function WissenLayout({
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
