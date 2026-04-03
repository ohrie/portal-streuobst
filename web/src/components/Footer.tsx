import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';

const footerLinks = {
    infos: [
        { name: 'Über Streuobstwiesen', href: '/about/' },
        { name: 'Mitmachen & Daten', href: '/data/' },
        { name: 'Streuobstwiesen Karte', href: '/karte/' },
    ],
    legal: [
        { name: 'Impressum', href: '/impressum/' },
        { name: 'Datenschutz', href: '/datenschutz/' },
    ],
};

export default function Footer() {
    return (
        <footer className="bg-secondary text-background">
            <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col items-center">
                {/* Hauptinhalt */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12 text-center md:text-left w-full">
                    {/* Logo und Beschreibung */}
                    <div className="lg:col-span-2 flex flex-col items-center md:items-start">
                        <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                            <img
                                src="/wiese-logo.svg"
                                alt="Streuobstwiesen Portal Logo"
                                className="w-12 h-12"
                            />
                            <div>
                                <h3 className="text-xl font-bold font-heading text-accent">
                                    Streuobstwiesen Portal
                                </h3>
                                <p className="text-sm text-light">
                                    Eine Initiative von{' '}
                                    <Link
                                        href="https://japfel.de"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-accent transition-colors"
                                    >
                                        Japfel
                                    </Link>
                                </p>
                            </div>
                        </div>

                        <p className="text-background mb-4 max-w-md mx-auto md:mx-0 leading-relaxed">
                            Entdecke und erhalte die Vielfalt deutscher Streuobstwiesen.
                            Gemeinsam für den Schutz traditioneller Obstkultur und biologischer Vielfalt.
                        </p>

                        {/* TODO */}
                        {/* <p className="text-background mb-8 max-w-md mx-auto md:mx-0 leading-relaxed">
                            Dieses Portal ist ein gemeinschaftliches Open-Source-Projekt.{' '}
                            <Link
                                href="https://github.com/ohrie/portal-streuobst"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 hover:text-accent transition-colors"
                            >
                                Mitwirken auf GitHub
                                <ExternalLink className="w-3 h-3" />
                            </Link>
                        </p> */}

                        <p className="text-sm text-light">
                            Gemacht mit ❤️ und 🍎 für die Streuobstwiesen
                        </p>
                    </div>

                    {/* Navigation Links */}
                    <div>
                        <h4 className="text-lg font-semibold mb-6 text-accent font-heading">
                            Informationen
                        </h4>
                        <nav className="space-y-3">
                            {footerLinks.infos.map((item) => (
                                <div key={item.name}>
                                    <Link
                                        href={item.href}
                                        className="text-background hover:text-accent transition-colors text-sm block py-1"
                                    >
                                        {item.name}
                                    </Link>
                                </div>
                            ))}
                        </nav>
                    </div>

                    {/* Legal & External Links */}
                    <div>
                        <h4 className="text-lg font-semibold mb-6 text-accent font-heading">
                            Rechtliches
                        </h4>
                        <nav className="space-y-3">
                            {footerLinks.legal.map((item) => (
                                <div key={item.name}>
                                    <Link
                                        href={item.href}
                                        className="text-background hover:text-accent transition-colors text-sm block py-1"
                                    >
                                        {item.name}
                                    </Link>
                                </div>
                            ))}
                            {/* TODO */}
                            {/* <div>
                                <Link
                                    href="https://github.com/ohrie/portal-streuobst"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-background hover:text-accent transition-colors text-sm py-1"
                                >
                                    <Image src="/github.svg" alt="GitHub" width={16} height={16} className="invert opacity-70" />
                                    Quellcode auf GitHub
                                </Link>
                            </div> */}
                        </nav>
                    </div>
                </div>

                {/* Trennlinie */}
                <div className="border-t border-tertiary/30 pt-8 w-full flex justify-center">
                    <div className="text-center">
                        <p className="text-sm text-light">
                            © {new Date().getFullYear()} Japfel |{" "}
                            <Link
                                href="https://www.gnu.org/licenses/agpl-3.0.html"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-accent transition-colors"
                            >
                                AGPL v3
                            </Link>
                            {' '}| {process.env.NEXT_PUBLIC_GIT_SHA}
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
