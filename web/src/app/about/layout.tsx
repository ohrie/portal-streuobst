import StandardLayout from '@/components/layouts/StandardLayout';

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
