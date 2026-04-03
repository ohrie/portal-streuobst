import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { ReactNode } from 'react';

interface TextLinkProps {
    href: string;
    children: ReactNode;
    className?: string;
    external?: boolean;
    showIcon?: boolean;
}

export default function TextLink({
    href,
    children,
    className = '',
    external = false,
    showIcon = true,
}: TextLinkProps) {
    // Auto-detect external links
    const isExternal = external || href.startsWith('http://') || href.startsWith('https://');

    const baseClassName = `text-primary hover:underline inline-flex items-center gap-1 ${className}`;

    const content = (
        <>
            {children}
            {isExternal && showIcon && <ExternalLink className="w-4 h-4 inline" />}
        </>
    );

    if (isExternal) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={baseClassName}
            >
                {content}
            </a>
        );
    }

    return (
        <Link href={href} className={baseClassName}>
            {content}
        </Link>
    );
}
