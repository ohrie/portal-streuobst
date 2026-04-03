import { Database, Map, BookOpen, Users, ExternalLink } from 'lucide-react';
import Section from '@/components/Section';
import BentoCard from '@/components/BentoCard';
import Button from '@/components/Button';
import ButtonLink from '@/components/ButtonLink';
import StreuobstwiesenGuide from '@/components/StreuobstwiesenGuide';

export default function DataPage() {
    return (
        <div className="bg-background">
            {/* Hero Section */}
            <Section className="pt-20 pb-8 px-4 text-center flex flex-col items-center justify-center">
                <h1 className="text-5xl md:text-6xl font-bold mb-6 text-primary font-heading">
                    Daten &
                    <br />
                    <span className="text-accent">Mitmachen</span>
                </h1>

                <p className="text-xl md:text-2xl text-foreground mb-6 max-w-4xl mx-auto leading-relaxed">
                    Hilf mit eine umfassende Karte aller Streuobstwiesen in Deutschland zu erstellen. Damit der Impact dieser Biotope sichtbar wird. Dafür nutzen wir OpenStreetMap, das Wikipedia der Karten.
                </p>

                <div className="bg-accent/10 border-2 border-accent rounded-xl p-6 mb-8 max-w-3xl mx-auto">
                    <div className="flex items-start gap-3">
                        <Database className="w-6 h-6 text-accent shrink-0 mt-1" />
                        <div className="text-left">
                            <h2 className="text-lg font-bold text-foreground mb-2">Warum ist deine Hilfe wichtig?</h2>
                            <p className="text-foreground leading-relaxed">
                                Aktuell ist <strong>nicht bekannt, wie viele Quadratmeter Streuobstwiesen es in Deutschland gibt</strong>. Durch deine Kartierung in OpenStreetMap hilfst du, diese wichtige Datenbasis zu schaffen – für Naturschutz, Forschung und Förderpolitik. Lerne hier, wie du selbst Streuobstwiesen kartieren und zu diesem Projekt beitragen kannst.
                            </p>
                        </div>
                    </div>
                </div>

            </Section>

            {/* How it works */}
            <Section className="pt-8 pb-20 px-4">
                <div className="bento-grid">
                    <BentoCard icon={Database} title="OpenStreetMap als Basis">
                        <p className="text-foreground mb-4">
                            Alle Streuobstwiesen-Daten stammen aus OpenStreetMap (OSM), der freien Wiki-Weltkarte. OSM wird von Millionen von Freiwilligen weltweit gepflegt und ist frei verfügbar.
                        </p>
                        <p className="text-foreground">
                            Die Daten werden regelmäßig automatisch aktualisiert und in unsere Karte importiert.
                        </p>
                    </BentoCard>

                    <BentoCard icon={Map} title="Streuobstwiesen taggen">
                        <p className="text-foreground mb-4">
                            In OpenStreetMap werden Streuobstwiesen mit spezifischen Tags markiert:
                        </p>
                        <ul className="text-foreground text-left space-y-2 mb-4">
                            <li>• <code className="bg-background px-1 rounded">landuse=orchard</code> - markiert alle Obstgärten</li>
                            <li>• <code className="bg-background px-1 rounded">orchard=meadow_orchard</code> - spezifiziert es als Streuobstwiese</li>
                            <li>• <code className="bg-background px-1 rounded">trees=apple_trees</code> - optionale Baumart-Angabe</li>
                        </ul>
                        <p className="text-foreground mb-4">
                            <strong>Wichtig:</strong> Ohne das Tag <code className="bg-background px-1 rounded">orchard=meadow_orchard</code> wird ein Obstgarten nicht als Streuobstwiese erkannt! Mehr Infos im <a href="https://wiki.openstreetmap.org/wiki/Tag:orchard%3Dmeadow_orchard" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OSM Wiki →</a>
                        </p>
                        <p className="text-foreground mb-4">
                            Darüber hinaus können auch einzelne Bäume getaggt werden, um die Genauigkeit noch zu erhöhen.
                        </p>
                    </BentoCard>
                </div>
            </Section>



            {/* Detaillierte Schritt-für-Schritt Anleitung */}
            <Section className="py-20 px-4 bg-light flex flex-col items-center">
                <StreuobstwiesenGuide />
            </Section>

            {/* Resources Section */}
            <Section className="py-20 px-4 bg-light flex flex-col items-center">
                <h2 className="text-4xl font-bold text-center mb-16 text-foreground font-heading">
                    Nützliche Ressourcen
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    <div className="bg-background p-6 rounded-xl text-center">
                        <h3 className="text-xl font-bold text-foreground mb-4 font-heading">OpenStreetMap</h3>
                        <p className="text-foreground mb-4">
                            Die freie Wiki-Weltkarte, die Grundlage für alle unsere Daten.
                        </p>
                        <Button
                            href="https://www.openstreetmap.org"
                            variant="primary"
                            external
                            icon={ExternalLink}
                            className="w-full"
                        >
                            OSM besuchen
                        </Button>
                    </div>

                    <div className="bg-background p-6 rounded-xl text-center">
                        <h3 className="text-xl font-bold text-foreground mb-4 font-heading">iD Editor</h3>
                        <p className="text-foreground mb-4">
                            Der einfache Web-Editor für OpenStreetMap, perfekt für Einsteiger.
                        </p>
                        <Button
                            href="https://www.openstreetmap.org/edit"
                            variant="primary"
                            external
                            icon={ExternalLink}
                            className="w-full"
                        >
                            Editor öffnen
                        </Button>
                    </div>

                    <div className="bg-background p-6 rounded-xl text-center">
                        <h3 className="text-xl font-bold text-foreground mb-4 font-heading">LearnOSM</h3>
                        <p className="text-foreground mb-4">
                            Umfassende Tutorials und Anleitungen für OpenStreetMap.
                        </p>
                        <Button
                            href="https://learnosm.org/de/"
                            variant="primary"
                            external
                            icon={ExternalLink}
                            className="w-full"
                        >
                            Tutorials ansehen
                        </Button>
                    </div>
                </div>
            </Section>

            {/* Call to Action */}
            <Section className="py-20 px-4 text-center flex flex-col items-center justify-center">
                <h2 className="text-4xl font-bold text-foreground mb-6 font-heading">
                    Starte jetzt mit dem Kartieren!
                </h2>
                <p className="text-xl text-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
                    Jeder kann zu OpenStreetMap beitragen. Beginne heute und hilf dabei, die Karte der Streuobstwiesen zu vervollständigen.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <ButtonLink href="https://www.openstreetmap.org/user/new" variant="primary">
                        OSM-Account erstellen
                    </ButtonLink>
                </div>
            </Section>
        </div>
    );
}
