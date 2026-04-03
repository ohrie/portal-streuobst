import Link from 'next/link';
import { ExternalLink, LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface ButtonLinkProps {
    href: string;
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    icon?: LucideIcon;
    className?: string;
    external?: boolean;
}

export default function ButtonLink({
    href,
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    className = '',
    external = false,
}: ButtonLinkProps) {
    // Auto-detect external links
    const isExternal = external || href.startsWith('http://') || href.startsWith('https://');

    // Base styles
    const baseStyles = 'inline-flex items-center gap-2 rounded-lg font-semibold transition-all duration-200';

    // Variant styles
    const variantStyles = {
        primary: 'bg-primary hover:bg-primary/90 text-background shadow-sm hover:shadow-md',
        secondary: 'bg-secondary hover:bg-secondary/90 text-background shadow-sm hover:shadow-md',
        outline: 'bg-transparent hover:bg-light border-2 border-secondary text-secondary hover:text-secondary/80',
        ghost: 'bg-transparent hover:bg-light text-foreground',
    };

    // Size styles
    const sizeStyles = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
    };

    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    const content = (
        <>
            {Icon && <Icon className="w-5 h-5" />}
            {children}
            {isExternal && <ExternalLink className="w-4 h-4" />}
        </>
    );

    if (isExternal) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={combinedClassName}
            >
                {content}
            </a>
        );
    }

    return (
        <Link href={href} className={combinedClassName}>
            {content}
        </Link>
    );
}
