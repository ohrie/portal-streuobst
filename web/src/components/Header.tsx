'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, Map } from 'lucide-react';
import Button from '@/components/Button';

type NavigationItem = {
    name: string;
} & (
        | { items: { name: string; href: string }[] }
        | { href: string }
    );

const navigation: NavigationItem[] = [
    {
        name: 'Mitmachen',
        href: '/data/'
    },
    {
        name: 'Bewirtschaftung',
        href: '/bewirtschaftung/'
    },
    {
        name: 'Über Wiesen',
        href: '/about/'
    },
];

interface HeaderProps {
    noShadow?: boolean;
}

export default function Header({ noShadow = false }: HeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const isOnMapPage = pathname === '/karte/' || pathname === '/karte';

    return (
        <header className={`bg-background ${noShadow ? '' : 'shadow-sm'}`}>
            <nav className="centered-content" aria-label="Global">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex lg:flex-1">
                        <Link href="/" className="flex items-center gap-3">
                            <img
                                className="h-6 w-auto"
                                src="/wiese-logo.svg"
                                alt="Streuobstwiesen Logo"
                            />
                            <div className="hidden sm:block">
                                <h1 className="text-lg font-bold text-secondary font-heading">
                                    Streuobstwiesen
                                </h1>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex lg:gap-x-8">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={'href' in item ? item.href : '#'}
                                className="text-sm font-semibold leading-6 text-foreground hover:text-primary transition-colors"
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>

                    {/* CTA Button */}
                    <div className="hidden lg:flex lg:flex-1 lg:justify-end">
                        {!isOnMapPage && (
                            <Button
                                href="/karte/"
                                variant="primary"
                                icon={Map}
                                className="shadow-lg"
                            >
                                Zur Karte
                            </Button>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex lg:hidden">
                        <button
                            type="button"
                            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-foreground hover:text-primary transition-colors"
                            onClick={() => setMobileMenuOpen(true)}
                            aria-expanded={mobileMenuOpen}
                            aria-controls="mobile-navigation-menu"
                        >
                            <span className="sr-only">Hauptmenü öffnen</span>
                            <Menu className="h-6 w-6" aria-hidden="true" />
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="lg:hidden">
                        <div className="fixed inset-0 z-50 bg-black bg-opacity-25" onClick={() => setMobileMenuOpen(false)} />
                        <div id="mobile-navigation-menu" className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-background px-6 py-6 sm:max-w-sm">
                            <div className="flex items-center justify-between">
                                <Link href="/" className="flex items-center gap-3">
                                    <img
                                        className="h-8 w-auto"
                                        src="/wiese-logo.svg"
                                        alt="Streuobstwiesen Portal Logo"
                                    />
                                    <span className="text-lg font-bold text-secondary font-heading">
                                        Streuobstwiesen
                                    </span>
                                </Link>
                                <button
                                    type="button"
                                    className="-m-2.5 rounded-md p-2.5 text-foreground hover:text-primary transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <span className="sr-only">Menü schließen</span>
                                    <X className="h-6 w-6" aria-hidden="true" />
                                </button>
                            </div>

                            <div className="mt-8 flow-root">
                                <div className="-my-6 divide-y divide-light">
                                    <div className="space-y-2 py-6">
                                        {navigation.map((item) => (
                                            <Link
                                                key={item.name}
                                                href={'href' in item ? item.href : '#'}
                                                className="block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-foreground hover:bg-light hover:text-primary transition-colors"
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                {item.name}
                                            </Link>
                                        ))}
                                    </div>

                                    <div className="py-6">
                                        <Button
                                            href="/karte/"
                                            variant="primary"
                                            icon={Map}
                                            className="w-full justify-center"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Zur Karte
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
}
