'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, TreePine, Users, Euro, FileText, Wrench, Heart } from 'lucide-react';
import Section from '@/components/Section';
import Button from '@/components/Button';

interface AccordionItem {
    id: string;
    title: string;
    icon: React.ComponentType<any>;
    description: string;
    content: {
        situation: string;
        solutions: string[];
        resources?: { title: string; link: string }[];
    };
}

const accordionData: AccordionItem[] = [
    {
        id: 'erbschaft',
        title: 'Ich habe eine Streuobstwiese geerbt',
        icon: Heart,
        description: 'Du hast eine Wiese geerbt und weißt nicht, was du damit anfangen sollst?',
        content: {
            situation: 'Eine geerbte Streuobstwiese kann zunächst überwältigend wirken, besonders wenn du keine Erfahrung mit der Bewirtschaftung hast. Viele Erben stehen vor der Frage: Selbst bewirtschaften, verkaufen oder verpachten?',
            solutions: [
                'Bestandsaufnahme machen: Welche Baumarten und wie viele Bäume stehen auf der Wiese?',
                'Lokale Experten, Obstbauvereine oder Gartenbauberater kontaktieren',
                'Landschaftsschutzvereine kontaktieren',
                'Informationen über mögliche Förderungen einholen',
                'Steuerliche Aspekte klären',
                'Entscheidung über zukünftige Nutzung treffen',
            ],
            resources: [
                { title: 'NABU Streuobst-Ratgeber', link: 'https://www.nabu.de/natur-und-landschaft/landnutzung/streuobst/' },
            ]
        }
    },
    {
        id: 'selbstbewirtschaftung',
        title: 'Ich möchte die Wiese selbst bewirtschaften',
        icon: TreePine,
        description: 'Du willst lernen, wie du deine Streuobstwiese richtig pflegst und bewirtschaftest?',
        content: {
            situation: 'Die Selbstbewirtschaftung einer Streuobstwiese ist eine wunderbare, aber auch anspruchsvolle Aufgabe. Sie erfordert Grundkenntnisse in Obstbaumpflege, Wiesenbewirtschaftung und jahreszeitlicher Planung.',
            solutions: [
                'Baumschnitt-Kurs besuchen',
                'Bewirtschaftungsplan erstellen',
                'Grundausstattung besorgen (Säge, Mähgerät)',
                'Wiesenpflege und Mahd planen',
                'Erste Pflegemaßnahmen umsetzen',
            ],
            resources: [
                { title: 'Streuobst-Wiki', link: 'https://streuobst-wiki.eu' },
            ]
        }
    },
    {
        id: 'verkaufen-verpachten',
        title: 'Ich möchte die Wiese verkaufen oder verpachten',
        icon: Euro,
        description: 'Du kannst oder willst die Wiese nicht selbst bewirtschaften?',
        content: {
            situation: 'Nicht jeder hat die Zeit, das Wissen oder die körperlichen Möglichkeiten, eine Streuobstwiese zu bewirtschaften. Verkauf oder Verpachtung können sinnvolle Alternativen sein.',
            solutions: [
                'Gutachten über Zustand und Wert erstellen lassen',
                'Potenzielle Käufer oder Pächter identifizieren (Obstbauvereine, Naturschutzorganisationen, Online-Portale)',
                'Rechtliche Rahmenbedingungen prüfen',
                'Notarielle Abwicklung vorbereiten',
                'Alternative: Kooperationen eingehen',
            ],
            resources: [
                { title: 'Streuobstwiesen-Börse', link: 'https://www.streuobstwiesen-boerse.de/' }
            ]
        }
    },
    {
        id: 'gemeinschaftsnutzung',
        title: 'Ich möchte die Wiese gemeinschaftlich bewirtschaften',
        icon: Users,
        description: 'Du willst deine Wiese der Gemeinschaft zur Verfügung stellen?',
        content: {
            situation: 'Manche Wiesenbesitzer möchten ihre Streuobstwiese für Bildungszwecke, Gemeinschaftsprojekte oder einfach zur gemeinsamen Nutzung öffnen. In der Gemeinschaft kann das gut klappen, erfordert aber gute Planung.',
            solutions: [
                'Prüfen, ob ein lokaler Obstbauverein existiert',
                'Mitstreiter:innen finden',
                'Rechtsform klären',
                'Evtl. Partner-Organisationen finden',
            ],
        }
    },
    {
        id: 'foerderung',
        title: 'Finanzielle Unterstützung und Förderungen',
        icon: Wrench,
        description: 'Welche finanziellen Hilfen gibt es für Streuobstwiesen?',
        content: {
            situation: 'Die Bewirtschaftung von Streuobstwiesen wird oft gefördert, da sie wichtige ökologische und kulturelle Funktionen erfüllen. Es gibt verschiedene Förderprogramme auf Bundes- und Landesebene.',
            solutions: [
                'Bei der zuständigen Landwirtschaftsbehörde über Förderprogramme informieren',
                'Förderfähigkeit prüfen lassen',
                'Baumpflegeförderungen, Landschaftspflegeprogramme oder Naturschutzförderung beantragen',
                'Anträge rechtzeitig stellen und Nachweise sammeln',
            ],
        }
    }
];

export default function BewirtschaftungPage() {
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

    const toggleAccordion = (id: string) => {
        setActiveAccordion(activeAccordion === id ? null : id);
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)]">

            <main>
                {/* Hero Section */}
                <Section className="py-16 text-center">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-foreground)] mb-6">
                            Wie bewirtschafte ich eine Streuobstwiese?
                        </h1>
                        <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                            Du hast eine Streuobstwiese geerbt, gekauft oder möchtest eine bewirtschaften?
                            Hier findest du Antworten auf die häufigsten Fragen und praktische Hilfestellungen
                            für verschiedene Situationen.
                            Streuobstwiesen werden am besten erhalten, wenn sie genutzt werden: &laquo;Erhaltung durch Nutzung&raquo;.
                        </p>
                    </div>
                </Section>

                {/* Accordion Section */}
                <Section className="py-12">
                    <div className="max-w-4xl mx-auto">
                        <div className="space-y-4">
                            {accordionData.map((item) => {
                                const IconComponent = item.icon;
                                const isActive = activeAccordion === item.id;

                                return (
                                    <div
                                        key={item.id}
                                        className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
                                    >
                                        {/* Accordion Header */}
                                        <button
                                            type="button"
                                            onClick={() => toggleAccordion(item.id)}
                                            aria-expanded={isActive}
                                            aria-controls={`accordion-panel-${item.id}`}
                                            className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-[var(--color-light)] rounded-lg">
                                                    <IconComponent className="w-6 h-6 text-[var(--color-secondary)]" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
                                                        {item.title}
                                                    </h3>
                                                    <p className="text-gray-600 text-sm mt-1">
                                                        {item.description}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-[var(--color-secondary)]">
                                                {isActive ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                            </div>
                                        </button>

                                        {/* Accordion Content */}
                                        {isActive && (
                                            <div id={`accordion-panel-${item.id}`} className="px-6 pb-6 border-t border-gray-100">
                                                <div className="pt-4 space-y-6">
                                                    {/* Situation */}
                                                    <div>
                                                        <h4 className="font-semibold text-[var(--color-foreground)] mb-2">
                                                            Deine Situation
                                                        </h4>
                                                        <p className="text-gray-700 leading-relaxed">
                                                            {item.content.situation}
                                                        </p>
                                                    </div>

                                                    {/* Solutions */}
                                                    <div>
                                                        <h4 className="font-semibold text-[var(--color-foreground)] mb-2">
                                                            Lösungsansätze
                                                        </h4>
                                                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                                                            {item.content.solutions.map((solution, index) => (
                                                                <li key={index}>{solution}</li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    {/* Resources */}
                                                    {item.content.resources && item.content.resources.length > 0 && (
                                                        <div>
                                                            <h4 className="font-semibold text-[var(--color-foreground)] mb-2">
                                                                Hilfreiche Ressourcen
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {item.content.resources.map((resource, index) => (
                                                                    <Button
                                                                        key={index}
                                                                        href={resource.link}
                                                                        variant="outline"
                                                                        size="sm"
                                                                        external
                                                                        className="mr-2 mb-2"
                                                                    >
                                                                        {resource.title}
                                                                    </Button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Section>


            </main>
        </div>
    );
}
