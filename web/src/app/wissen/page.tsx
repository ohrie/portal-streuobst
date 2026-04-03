import Section from '@/components/Section';
import Button from '@/components/Button';
import TextLink from '@/components/TextLink';

interface BundeslandInfo {
    id: string;
    name: string;
    icon: string;
    description: string;
    resources: { title: string; link: string; description?: string }[];
}

const bundeslaenderData: BundeslandInfo[] = [
    {
        id: 'baden-wuerttemberg',
        name: 'Baden-Württemberg',
        icon: '/icons/bundeslaender/baden-wuerttemberg.svg',
        description:
            'Als eines der größten Streuobstgebiete Deutschlands bietet BW umfangreiche Landesinfos, Sortendatenbanken und Förderhinweise.',
        resources: [
            {
                title: 'Streuobstportal BW',
                link: 'https://streuobst.landwirtschaft-bw.de/,Lde/Startseite',
                description:
                    'Landesministerium: Hintergrund, Schutzmaßnahmen und politische Ziele zum Erhalt von Streuobstwiesen.'
            },
            {
                title: 'Streuobstportal Baden-Württemberg (Infodienst Landwirtschaft)',
                link: 'https://streuobst.landwirtschaft-bw.de/',
                description:
                    'Zentrales Portal mit Praxisinfos, Sortenbestimmungen, Veranstaltungen und Ansprechpartnern im Land.'
            },
            {
                title: 'LUBW – Streuobst (Landesanstalt Umwelt BW)',
                link: 'https://www.lubw.baden-wuerttemberg.de/natur-und-landschaft/streuobst',
                description:
                    'Ökologische Informationen zu Streuobstbeständen, Artenvielfalt und Naturschutzaspekten.'
            }
        ]
    },
    {
        id: 'bayern',
        name: 'Bayern',
        icon: '/icons/bundeslaender/bayern.svg',
        description:
            'Bayern koordiniert Streuobstförderung über Fachstellen (LfL) und den „Streuobstpakt“ zur Bestandssicherung und Neuanlage.',
        resources: [
            {
                title: 'LfL Bayern – Streuobst (Landesanstalt für Landwirtschaft)',
                link: 'https://www.lfl.bayern.de/streuobst',
                description:
                    'Fachinfos, Projekte und der operative Part des bayerischen Streuobstpakts; Hinweise zu Pflanzung und Pflege.'
            },
            {
                title: 'Streuobst in Bayern – Portal/Netzwerk',
                link: 'https://www.streuobst-in-bayern.de/',
                description:
                    'Regional vernetzte Infos zu Veranstaltungen, Beratung und lokalen Initiativen in Bayern.'
            },
            {
                title: 'Bayerischer Streuobstpakt – Informationen & Ziele',
                link: 'https://www.lfl.bayern.de/iab/kulturlandschaft/030830/',
                description:
                    'Beschreibung des Pakt-Programms (Erhalt, Zielpflanzungen bis 2035, Kooperationspartner).'
            }
        ]
    },
    {
        id: 'berlin',
        name: 'Berlin',
        icon: '/icons/bundeslaender/berlin.svg',
        description:
            'In der Stadt dominieren kommunale Projekte, Umweltbildung und Einsätze von BUND/NABU; Streuobst findet sich in Parks und Naturschutzflächen.',
        resources: [
            {
                title: 'Erlebnis StadtNatur / Senat Berlin – Streuobstinfos',
                link: 'https://www.berlin.de/projekte-mh/netzwerke/erlebnisstadtnatur/natur-erleben/erlebnisraeume/artikel.150331.php',
                description:
                    'Senatsnahe Seite zu Stadtnatur mit Hinweisen zu Streuobstwiesen, Erhalt und Bildungsangeboten.'
            },
            {
                title: 'BUND Berlin – Obstgärten & Streuobstwiesen',
                link: 'https://www.bund-berlin.de/themen/obstgaerten/',
                description:
                    'BUND-Projekte, Pflegeinseln und lokale Aktionen rund um städtische Streuobstwiesen.'
            },
            {
                title: 'Stadtnatur Berlin (Netzwerk/Initiativen)',
                link: 'https://www.stadtnatur-berlin.com/',
                description:
                    'Vernetzung, Veranstaltungen und Praxisinfos zur Stadtnatur inkl. Streuobst-Angeboten.'
            }
        ]
    },
    {
        id: 'brandenburg',
        name: 'Brandenburg',
        icon: '/icons/bundeslaender/brandenburg.svg',
        description:
            'Brandenburg arbeitet stark mit lokalen Kompetenzstellen (z. B. „Äpfel & Konsorten“) und NABU-Leitfäden für Förderung und Anlage von Streuobstwiesen.',
        resources: [
            {
                title: 'Äpfel & Konsorten (Kompetenzstelle Brandenburg/Berlin)',
                link: 'https://aepfelundkonsorten.org/',
                description:
                    'Regionaler Verein/Netzwerk: Beratung, Projektarbeit, Schulungen und Sortenpflege (Kompetenzstelle für Brandenburg).'
            },
            {
                title: 'NABU – Leitfaden und Förderinfos für Brandenburg (PDF & Seiten)',
                link: 'https://www.nabu.de/imperia/md/content/nabude/streuobst/f__rderung_von_streuobstwiesen_in_brandenburg_-_ein_leitfaden_-_digitale_version.pdf',
                description:
                    'NABU-Leitfaden: Förderwege, Ansprechpartner und Praxishinweise speziell für Brandenburg.'
            },
            {
                title: 'Pomologen (Regionalgruppe Brandenburg/Berlin) – Infos & Kurse',
                link: 'https://www.pomologen-verein.de/landes-und-regionalgruppen/lg-brandenburg-berlin/',
                description:
                    'Pomologen-Verein: Sortenbestimmung, Erhalt alter Sorten und regionale Veranstaltungen.'
            }
        ]
    },
    {
        id: 'bremen',
        name: 'Bremen',
        icon: '/icons/bundeslaender/bremen.svg',
        description:
            'Bremen arbeitet über kommunale Grünflächenbetriebe und ehrenamtliche BUND/NABU-Gruppen an städtischen Streuobstflächen (z. B. Große Dunge).',
        resources: [
            {
                title: 'Umweltbetrieb Bremen – Infos zu Streuobstwiesen & Pflege',
                link: 'https://www.umweltbetrieb-bremen.de/unser-betrieb/aktuelles/streuobstwiesen-und-obstbaeume-19702',
                description:
                    'Kommunaler Betrieb: Pflegekonzepte, städtische Obstbäume und Aktionen zur Nutzung öffentlicher Streuobstflächen.'
            },
            {
                title: 'BUND Bremen – Arbeitskreis Streuobstwiesen / Große Dunge',
                link: 'https://www.bund-bremen.net/mitmachen/aktiv-im-bund/arbeitskreise/arbeitskreis-streuobstwiesen/',
                description:
                    'BUND-Seite zu Pflegeeinsätzen, Besichtigungen und Freiwilligenarbeit an Bremer Streuobstwiesen.'
            },
            {
                title: 'Große Dunge – BUND Obstwiesen (Projektseite)',
                link: 'https://www.bund-bremen.net/obstwiesen/unsere-obstwiesen/',
                description:
                    'Konkretes BUND-Projekt mit Streuobstwiesen, Sortenvielfalt und Besuchsinformationen.'
            }
        ]
    },
    {
        id: 'hamburg',
        name: 'Hamburg',
        icon: '/icons/bundeslaender/hamburg.svg',
        description:
            'Hamburg fokussiert auf städtische Pflegeprojekte und Naturschutzinitiativen (BUND, NABU) zur Erhaltung einzelner Streuobstflächen.',
        resources: [
            {
                title: 'BUND Hamburg – Projekt Streuobstwiesen',
                link: 'https://www.bund-hamburg.de/themen/naturschutz/streuobstwiesen/projekt-hamburger-streuobstwiesen/',
                description:
                    'Projektseite mit Informationen zu Pflege, Patenschaften und Spenden für Hamburger Streuobstwiesen.'
            },
            {
                title: 'NABU Hamburg – Streuobstwiesen & Betreuung',
                link: 'https://hamburg.nabu.de/natur-und-landschaft/gewaesser/seebek/18542.html',
                description:
                    'NABU-Infos zu Streuobstwert, betreuten Flächen und lokalen Aktionen.'
            }
        ]
    },
    {
        id: 'hessen',
        name: 'Hessen',
        icon: '/icons/bundeslaender/hessen.svg',
        description:
            'Hessen verfügt über ein eigenes Streuobstzentrum, eine Landesstrategie und vielfältige Beratung/Publikationen.',
        resources: [
            {
                title: 'Streuobstzentrum Hessen (Beratung & Netzwerk)',
                link: 'https://streuobstzentrum-hessen.de/',
                description:
                    'Zentrum für Wissenstransfer: Praxiswissen, Fortbildungen, Börse für Flächen und Kontakte.'
            },
            {
                title: 'Hessische Landesregierung – Streuobstwiesenstrategie',
                link: 'https://landwirtschaft.hessen.de/naturschutz/streuobstwiesenstrategie',
                description:
                    'Offizielle Strategie mit Zielen, Förderansätzen und Handlungsempfehlungen des Landes.'
            },
            {
                title: 'Streuobstwissen (Streuobstzentrum) – Hintergrund & Pflege',
                link: 'https://streuobstzentrum-hessen.de/streuobstwissen/',
                description:
                    'Thematische Sammlung: Pflanzung, Pflege, Ökologie und Bildungsangebote.'
            }
        ]
    },
    {
        id: 'mecklenburg-vorpommern',
        name: 'Mecklenburg-Vorpommern',
        icon: '/icons/bundeslaender/mecklenburg-vorpommern.svg',
        description:
            'MV arbeitet mit einem landesweiten Streuobstnetzwerk und NABU-Projekten, um Bestände zu dokumentieren und zu revitalisieren.',
        resources: [
            {
                title: 'NABU Mecklenburg-Vorpommern – Streuobstinfos',
                link: 'https://mecklenburg-vorpommern.nabu.de/natur-und-landschaft/landnutzung/streuobst/',
                description:
                    'NABU-Landesseite mit Projektübersicht, Bildungsangeboten und Förderhinweisen.'
            },
            {
                title: 'Streuobstnetzwerk Mecklenburg-Vorpommern',
                link: 'https://streuobstnetzwerk-mv.de/',
                description:
                    'Netzwerkseite: Praxisleitfäden, Pflanzempfehlungen, Kontakte und regionale Aktionen.'
            }
        ]
    },
    {
        id: 'niedersachsen',
        name: 'Niedersachsen',
        icon: '/icons/bundeslaender/niedersachsen.svg',
        description:
            'In Niedersachsen gibt es ein aktives Streuobstwiesen-Bündnis, ein Kataster und starke BUND/NABU-Arbeitsgruppen.',
        resources: [
            {
                title: 'Streuobstwiesen-Bündnis Niedersachsen (Kataster & Infos)',
                link: 'https://streuobstwiesen-buendnis-niedersachsen.de/',
                description:
                    'Interaktive Karte/Kataster, Veranstaltungskalender und Mitmach-Formulare für Besitzer:innen.'
            },
            {
                title: 'BUND Niedersachsen – Streuobstwiesen (Projekte & Kataster)',
                link: 'https://www.bund-niedersachsen.de/natur-landwirtschaft/streuobstwiesen/projekte/streuobstwiesen-kataster/',
                description:
                    'BUND-Projektseite mit Kataster-Infos, Kartierungsergebnissen und Praxisprojekten.'
            },
            {
                title: 'NABU Niedersachsen – Streuobstwissen',
                link: 'https://niedersachsen.nabu.de/natur-und-landschaft/landnutzung/streuobst/',
                description:
                    'NABU-Seite mit Hintergrund, Projektbeispielen und lokalen Kontakten.'
            }
        ]
    },
    {
        id: 'nordrhein-westfalen',
        name: 'Nordrhein-Westfalen',
        icon: '/icons/bundeslaender/nrw.svg',
        description:
            'NRW bündelt Maßnahmen über NABU, die Landwirtschaftskammer und ein (bis 2024 gefördertes) Netzwerk Streuobstwiesenschutz.',
        resources: [
            {
                title: 'NABU NRW – Streuobst & Schutzmaßnahmen',
                link: 'https://nrw.nabu.de/natur-und-landschaft/landnutzung/streuobst/',
                description:
                    'Landesweiter NABU-Überblick: Schutzprojekte, Ausbildungen und regionale Gruppen.'
            },
            {
                title: 'Landwirtschaftskammer NRW – Obstwiesenschutz & Koordination',
                link: 'https://www.landwirtschaftskammer.de/gartenbau/beratung/obstbau/artikel/obstwiesenschutz.htm',
                description:
                    'Informationen zur Koordination des Obstwiesenschutzes, Fördermaßnahmen und Beratung.'
            }
        ]
    },
    {
        id: 'rheinland-pfalz',
        name: 'Rheinland-Pfalz',
        icon: '/icons/bundeslaender/rheinland-pfalz.svg',
        description:
            'RLP ist stark vernetzt (IG Streuobst) und bietet regionale Beratung, Sortenempfehlungen und Kurse.',
        resources: [
            {
                title: 'IG Streuobst RLP – Streuobst verbindet',
                link: 'https://www.streuobst-verbindet.de/',
                description:
                    'Offenes Netzwerk/Interessengemeinschaft mit Projekten, Sorteninfos und regionaler Vernetzung.'
            },
            {
                title: 'NABU Rheinland-Pfalz – Streuobstseiten',
                link: 'https://rlp.nabu.de/natur-und-landschaft/streuobst/',
                description:
                    'Landes-NABU: Informationen zu Pflege, Schutz und lokalen Aktionen.'
            }
        ]
    },
    {
        id: 'saarland',
        name: 'Saarland',
        icon: '/icons/bundeslaender/saarland.svg',
        description:
            'Im Saarland spielen NABU-Initiativen und kommunale Projekte (z. B. Merzig) eine zentrale Rolle zum Erhalt der Kulturlandschaft Streuobst.',
        resources: [
            {
                title: 'NABU Saarland – Streuobstinfos',
                link: 'https://nabu-saar.de/natur-landschaft/streuobst',
                description:
                    'NABU-Landesseite mit Praxisinfos, Förderhinweisen und Aktionen zur Sortenerhaltung.'
            },
            {
                title: 'Streuobstwiesen Merzig – lokale Infoseite',
                link: 'https://www.merzig.de/leben-in-merzig/umwelt-und-klimaschutz/natur-und-landschaft/streuobstwiesen/',
                description:
                    'Kommunale Seite: Bedeutung der Streuobstwiesen und lokales Engagement (Apfelstadt Merzig).'
            }
        ]
    },
    {
        id: 'sachsen',
        name: 'Sachsen',
        icon: '/icons/bundeslaender/sachsen.svg',
        description:
            'Sachsen betreibt Landesportale und lokale Initiativen (u.a. Länderseiten, Pomologen und NABU-Projekte) zur Sortenpflege und Flächenrevitalisierung.',
        resources: [
            {
                title: 'NABU Sachsen – Streuobstinfos & Projekte',
                link: 'https://sachsen.nabu.de/naturundlandschaft/streuobst/index.html',
                description:
                    'NABU-Landesseite: Projekte, Sorteninfos und konkrete Maßnahmen zur Pflege von Streuobstwiesen.'
            },
            {
                title: 'Streuobst in Sachsen – Regionalportal / Initiativen',
                link: 'https://www.streuobst-in-sachsen.de/',
                description:
                    'Regionalportal mit Initiativen, Sortenheften, Veranstaltungen und Kontaktadressen.'
            }
        ]
    },
    {
        id: 'sachsen-anhalt',
        name: 'Sachsen-Anhalt',
        icon: '/icons/bundeslaender/sachsen-anhalt.svg',
        description:
            'Sachsen-Anhalt bietet NABU-Gruppen, Förderleitfäden und Landesförderprogramme zur Unterstützung von Streuobstwiesen.',
        resources: [
            {
                title: 'NABU Sachsen-Anhalt – Streuobst (Wissen & Aktionen)',
                link: 'https://sachsen-anhalt.nabu.de/natur-und-landschaft/streuobst/',
                description:
                    'NABU-Seite mit Hintergrundwissen, lokalen Aktionen und Kontakten zu Gruppen vor Ort.'
            },
            {
                title: 'Förderleitfaden Streuobstwiesen (Land Sachsen-Anhalt, PDF)',
                link: 'https://lvwa.sachsen-anhalt.de/fileadmin/Bibliothek/Politik_und_Verwaltung/MWU/Umwelt/Naturschutz/Foerderung/210427_Foerderleitlinie_Streuobstwiesen_bf.pdf',
                description:
                    'Amtliche Förderrichtlinie / Leitfaden für Maßnahmen und finanzielle Unterstützung.'
            }
        ]
    },
    {
        id: 'schleswig-holstein',
        name: 'Schleswig-Holstein',
        icon: '/icons/bundeslaender/schleswig-holstein.svg',
        description:
            'SH nutzt NABU-Programme und ein BUND-Netzwerk, um Pflanzungen, Förderung und fachliche Begleitung zu organisieren.',
        resources: [
            {
                title: 'NABU Schleswig-Holstein – Streuobstwiesen & Projekte',
                link: 'https://schleswig-holstein.nabu.de/natur-und-landschaft/streuobstwiesen/29963.html',
                description:
                    'Projekt- und Förderberichte, Pflanzaktionen und fachliche Begleitung durch NABU SH.'
            },
            {
                title: 'BUND Schleswig-Holstein – Netzwerk Streuobstwiesen',
                link: 'https://www.bund-sh.de/streuobstwiesen/',
                description:
                    'Netzwerkseite mit Praxisempfehlungen, Veranstaltungen und lokalen Akteuren.'
            }
        ]
    },
    {
        id: 'thueringen',
        name: 'Thüringen',
        icon: '/icons/bundeslaender/thueringen.svg',
        description:
            'Thüringen hat ein aktives Streuobst-Netzwerk, listet Kleinmostereien und bietet Handlungskonzepte und Förderinfos.',
        resources: [
            {
                title: 'Streuobst-Netzwerk Thüringen – Landesportal',
                link: 'https://streuobst-thueringen.de/',
                description:
                    'Netzwerkseite mit Handlungskonzept, Mostereiliste, Förderinfos und Fortbildungsangeboten.'
            },
            {
                title: 'NABU Thüringen – Streuobstinfos & Projekte',
                link: 'https://thueringen.nabu.de/natur-und-landschaft/landwirtschaft/streuobst/index.html',
                description:
                    'NABU-Seite mit Projektbeispielen, Bildungsangeboten und praktischen Hilfen.'
            }
        ]
    }
];

interface Resource {
    title: string;
    link: string;
    description?: string;
    article?: 'Zur' | 'Zum';
}
const bundesweiteResources: Resource[] = [
    {
        title: 'Hochstamm Deutschland e.V.',
        link: 'https://www.hochstamm-deutschland.de/',
        article: 'Zum',
        description:
            'Bundesweit tätiger Verein für den Erhalt von Streuobstwiesen. Bietet Fachinformationen, Netzwerke, Marketingideen, Kampagnen und setzt sich für den Schutz der Streuobstkultur als Immaterielles Kulturerbe ein.'
    },
    {
        title: 'Pomologen-Verein e.V.',
        link: 'https://www.pomologen-verein.de/',
        article: 'Zum',
        description:
            'Verein zur Förderung der Obstsortenkunde und Erhaltung alter Sorten. Aktiv in Sortenbestimmung, Beratung, Pflege von Obstgehölzen und Bildung. Starker Bezug zum Thema Streuobst durch Sortenvielfalt und Landschaftspflege.'
    },
    {
        title: 'NABU Bundesfachausschuss Streuobst',
        link: 'https://www.nabu.de/natur-und-landschaft/landnutzung/streuobst/',
        article: 'Zum',
        description:
            'Der NABU bündelt bundesweite Infos zu Streuobstwiesen: Schutz, Nutzung, Sortenerhalt, Förderungen und Mitmachmöglichkeiten. Schwerpunkt ist die ökologische und kulturelle Bedeutung von Streuobst.'
    },
    {
        title: 'Kleinmoster-Plattform',
        link: 'https://www.kleinmoster.de/',
        article: 'Zur',
        description:
            'Digitale Plattform für kleine Mostereien, Streuobstwiesenbesitzer:innen und Verbraucher:innen. Bietet Austausch, Vermarktung, Karten von Mostereien und Informationen zur Verarbeitung von Streuobst.'
    },
    {
        title: 'Fairpachten-Initiative',
        link: 'https://www.fairpachten.org/',
        article: 'Zur',
        description:
            'Initiative, die bundesweit Beratung für ökologische, faire Verpachtung von landwirtschaftlichen Flächen bietet. Streuobstwiesen sind ein Kernthema, da durch Verträge naturnahe Nutzung und Erhalt gefördert werden.'
    }
];


export default function WissenPage() {
    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            <main>
                <Section className="py-16">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h1 className="text-3xl font-bold text-foreground mb-4">Wissen</h1>
                            <p className="text-xl text-gray-700 leading-relaxed max-w-4xl mx-auto">
                                Detaillierte Informationen zu regionalen Ressourcen, Programmen und Förderungen für Streuobstwiesen.
                            </p>
                        </div>

                        <h2 className='text-foreground text-2xl mb-3 text-left font-bold'>Übersicht der Bundesländer</h2>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {bundeslaenderData.map((bundesland) => (
                                <div key={bundesland.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                                    <div className="flex items-center gap-3 mb-3">
                                        <img src={bundesland.icon} alt={`${bundesland.name} Wappen`} className="w-8 h-10" />
                                        <h3 className="text-xl font-semibold text-[var(--color-foreground)]">{bundesland.name}</h3>
                                    </div>
                                    <p className="text-gray-600 mb-4 text-sm">{bundesland.description}</p>
                                    <div className="space-y-2">
                                        {bundesland.resources.map((resource, index) => (
                                            <Button key={index} href={resource.link} variant="outline" size="sm" external className="w-full justify-start">
                                                {resource.title}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 bg-light rounded-lg p-6 text-left">
                            <h3 className="text-xl font-semibold text-foreground mb-3">Bundesweite Ressourcen</h3>
                            <p className="text-gray-700 mb-4">Neben den länderspezifischen Angeboten gibt es auch bundesweite Initiativen und Plattformen:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {bundesweiteResources.map((res, idx) => (
                                    <div key={idx} className="bg-white rounded-md p-4 border border-gray-200 flex flex-col justify-between h-full">
                                        <div>
                                            <a href={res.link} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[var(--color-foreground)] hover:underline">
                                                {res.title}
                                            </a>
                                            {res.description && (
                                                <p className="text-gray-700 mt-2 text-sm">{res.description}</p>
                                            )}
                                        </div>
                                        <div className="mt-4">
                                            <Button href={res.link} variant="outline" size="sm" external className="w-full">
                                                {`${res.article ?? 'Zur'} ${res.title}`}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Section>
            </main>
        </div>
    );
}
