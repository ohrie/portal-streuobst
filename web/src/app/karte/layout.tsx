import MinimalLayout from '@/components/layouts/MinimalLayout';

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
