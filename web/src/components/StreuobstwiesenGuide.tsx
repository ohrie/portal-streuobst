'use client';

import StepGuide from './StepGuide';
import TabSwitcher from './TabSwitcher';
import TextLink from './TextLink';

export default function StreuobstwiesenGuide() {
    // Steps for converting existing orchard
    const existingOrchardSteps = [
        {
            number: 1,
            title: "Zur Streuobstwiese navigieren",
            borderColor: "border-primary",
            bgColor: "bg-primary",
            content: (
                <ul className="text-foreground space-y-2">
                    <li>• Gehe zurück zur <TextLink href="/karte/">Streuobstwiesen-Karte</TextLink></li>
                    <li>• Navigiere und klicke auf eine Obstwiese, die du bearbeiten möchtest</li>
                    <li>• Klicke auf die <strong>"OpenStreetMap ID"</strong></li>
                    <li>• Die Website von OpenStreetMap öffnet sich an der gleichen Stelle</li>
                    <li>• Nun kannst du den iD Editor durch klicken auf "Bearbeiten" in der oberen linken Navigation öffnen</li>
                    <li>• Falls du nicht angemeldet bist, melde dich an oder erstelle einen Account</li>
                </ul>
            )
        },
        {
            number: 2,
            title: "Fläche auswählen",
            borderColor: "border-secondary",
            bgColor: "bg-secondary",
            content: (
                <ul className="text-foreground space-y-2">
                    <li>• Klicke auf die bestehende Obstgarten-Fläche</li>
                    <li>• Sie sollte als <code className="bg-light px-1 rounded">landuse=orchard</code> getaggt sein</li>
                    <li>• Die Fläche wird hervorgehoben und das Eigenschaftsfenster öffnet sich rechts</li>
                </ul>
            )
        },
        {
            number: 3,
            title: "Streuobstwiesen-Tag hinzufügen",
            borderColor: "border-tertiary",
            bgColor: "bg-tertiary",
            content: (
                <div>
                    <p className="text-foreground mb-3">Unterscheide zwischen Streuobstwiese und kommerzieller Plantage:</p>
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                        <h5 className="font-bold text-green-900 mb-2">🌳 Streuobstwiese</h5>
                        <p className="text-green-800 text-sm mb-2">
                            Traditionelle Obstwiese mit hochstämmigen Bäumen, extensiv bewirtschaftet,
                            oft mit Unternutzung als Wiese oder Weide.
                        </p>
                        <ul className="text-green-800 text-sm space-y-1">
                            <li>• <strong>Schlüssel:</strong> <code className="bg-green-100 px-2 py-1 rounded">orchard</code></li>
                            <li>• <strong>Wert:</strong> <code className="bg-green-100 px-2 py-1 rounded">meadow_orchard</code></li>
                        </ul>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                        <h5 className="font-bold text-amber-900 mb-2">🏭 Kommerzielle Obstplantage</h5>
                        <p className="text-amber-800 text-sm mb-2">
                            Moderne, intensiv bewirtschaftete Plantage mit niedrigstämmigen Bäumen
                            in Reihen, keine Unternutzung.
                        </p>
                        <ul className="text-amber-800 text-sm space-y-1">
                            <li>• <strong>Schlüssel:</strong> <code className="bg-amber-100 px-2 py-1 rounded">orchard</code></li>
                            <li>• <strong>Wert:</strong> <code className="bg-amber-100 px-2 py-1 rounded">plantation</code></li>
                        </ul>
                        <p className="text-amber-800 text-sm mb-2">
                            Für Wiesen, die nur spärlich mit Bäumen verstreut sind, nutze
                        </p>
                        <ul className="text-amber-800 text-sm space-y-1">
                            <li>• <strong>landuse</strong> = <code className="bg-amber-100 px-2 py-1 rounded">meadow</code></li>
                            <li>• <strong>meadow</strong> = <code className="bg-amber-100 px-2 py-1 rounded">meadow_orchard</code></li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            number: 4,
            title: "Zusätzliche nützliche Tags",
            borderColor: "border-accent",
            bgColor: "bg-accent",
            content: (
                <div>
                    <p className="text-foreground mb-3">Füge weitere hilfreiche Informationen hinzu:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-light p-4 rounded-lg">
                            <h5 className="font-bold text-foreground mb-2">trees (Bäume)</h5>
                            <ul className="text-sm text-foreground space-y-1">
                                <li>• <code>fruit_trees</code> - Obstbäume</li>
                                <li>• <code>apple_trees</code> - Apfelbäume</li>
                                <li>• <code>mixed</code> - Gemischte Sorten</li>
                            </ul>
                        </div>
                        <div className="bg-light p-4 rounded-lg">
                            <h5 className="font-bold text-foreground mb-2">operator (Betreiber)</h5>
                            <ul className="text-sm text-foreground space-y-1">
                                <li>• Name des Vereins/Initiative</li>
                                <li>• z.B. "NABU Ortsgruppe"</li>
                                <li>• "Streuobstinitiative XY"</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )
        },
        {
            number: 5,
            title: "Speichern",
            borderColor: "border-primary",
            bgColor: "bg-primary",
            content: (
                <ul className="text-foreground space-y-2">
                    <li>• Klicke auf "Speichern" (oben rechts)</li>
                    <li>• Füge eine aussagekräftige Änderungsnotiz hinzu, z.B.:</li>
                    <li>• <em>"Obstplantage als Streuobstwiese spezifiziert"</em></li>
                    <li>• Klicke auf "Hochladen" um die Änderungen zu veröffentlichen</li>
                </ul>
            )
        }
    ];

    // Steps for creating new streuobstwiese from scratch
    const newStreuobstwieseSteps = [
        {
            number: 1,
            title: "OpenStreetMap Account erstellen",
            borderColor: "border-primary",
            bgColor: "bg-primary",
            content: (
                <ul className="text-foreground space-y-2">
                    <li>• Gehe zu <TextLink href="https://www.openstreetmap.org/user/new">openstreetmap.org/user/new</TextLink></li>
                    <li>• Fülle das Registrierungsformular aus</li>
                    <li>• Bestätige deine E-Mail-Adresse</li>
                    <li>• Melde dich mit deinen neuen Zugangsdaten an</li>
                </ul>
            )
        },
        {
            number: 2,
            title: "Zur Streuobstwiese navigieren",
            borderColor: "border-secondary",
            bgColor: "bg-secondary",
            content: (
                <ul className="text-foreground space-y-2">
                    <li>• Gehe zurück zur <TextLink href="/karte/">Streuobstwiesen-Karte</TextLink></li>
                    <li>• Verwende die Suchfunktion oder navigiere zur gewünschten Location</li>
                    <li>• Finde die Streuobstwiese, die du eintragen möchtest</li>
                    <li>• Vergewissere dich, dass sie noch nicht eingetragen ist</li>
                </ul>
            )
        },
        {
            number: 3,
            title: "iD Editor öffnen",
            borderColor: "border-tertiary",
            bgColor: "bg-tertiary",
            content: (
                <ul className="text-foreground space-y-2">
                    <li>• Klicke auf eine Wiese und dann auf die <strong>"OSM ID"</strong></li>
                    <li>• Die OSM Website öffnet sich an der Stelle der Wiese</li>
                    <li>• Klicke dann auf "Bearbeiten", der iD Editor öffnet sich</li>
                    <li>• Der Editor lädt und zeigt eine kurze Einführung (empfehlenswert für Erstnutzer)</li>
                    <li>• Schließe die Einführung oder folge ihr für grundlegende Tipps</li>
                </ul>
            )
        },
        {
            number: 4,
            title: "Streuobstwiesen-Fläche zeichnen",
            borderColor: "border-accent",
            bgColor: "bg-accent",
            content: (
                <ul className="text-foreground space-y-2">
                    <li>• Klicke auf das Flächen-Tool (Rechteck-Symbol) in der Toolbar links</li>
                    <li>• Klicke entlang der Grenzen der Streuobstwiese, um eine Fläche zu zeichnen</li>
                    <li>• Schließe die Fläche, indem du zum ersten Punkt zurückklickst</li>
                    <li>• Die Fläche sollte genau die Grenzen der Streuobstwiese abdecken</li>
                </ul>
            )
        },
        {
            number: 5,
            title: "Tags hinzufügen",
            borderColor: "border-primary",
            bgColor: "bg-primary",
            content: (
                <div>
                    <p className="text-foreground mb-3">Füge die wichtigsten Tags für Streuobstwiesen hinzu:</p>
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                        <h5 className="font-bold text-green-900 mb-2">🌳 Streuobstwiese</h5>
                        <ul className="text-green-800 space-y-1">
                            <li>• <strong>landuse:</strong> <code className="bg-green-100 px-2 py-1 rounded">orchard</code></li>
                            <li>• <strong>orchard:</strong> <code className="bg-green-100 px-2 py-1 rounded">meadow_orchard</code></li>
                            <li>• <strong>trees:</strong> <code className="bg-green-100 px-2 py-1 rounded">fruit_trees</code>, falls die Baumgattungen bekannt sind</li>
                        </ul>
                    </div>
                    <p className="text-foreground text-sm mb-2">
                        <strong>Wichtig:</strong> Streuobstwiesen sind traditionelle Obstwiesen mit hochstämmigen Bäumen
                        und extensiver Bewirtschaftung. Für kommerzielle Plantagen verwende stattdessen:
                    </p>
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                        <p className="text-amber-800 text-sm">
                            <code className="bg-amber-100 px-2 py-1 rounded">landuse=orchard</code> +
                            <code className="bg-amber-100 px-2 py-1 rounded ml-1">orchard=plantation</code>
                        </p>
                    </div>
                    <p className="text-foreground text-sm mb-2 mt-5">
                        Für Wiesen mit sehr dünner Bepflanzung verwende:
                    </p>
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                        <p className="text-amber-800 text-sm">
                            <code className="bg-amber-100 px-2 py-1 rounded">landuse=meadow</code> +
                            <code className="bg-amber-100 px-2 py-1 rounded ml-1">meadow=orchard_meadow</code>
                        </p>
                    </div>
                </div>
            )
        },
        {
            number: 6,
            title: "Weitere Details ergänzen (optional)",
            borderColor: "border-secondary",
            bgColor: "bg-secondary",
            content: (
                <div>
                    <p className="text-foreground mb-3">Ergänze weitere nützliche Informationen:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-light p-4 rounded-lg">
                            <h5 className="font-bold text-foreground mb-2">Zusätzliche Tags</h5>
                            <ul className="text-sm text-foreground space-y-1">
                                <li>• <strong>operator:</strong> Name des Betreibers</li>
                                <li>• <strong>access:</strong> Zugang (private, yes, etc.)</li>
                                <li>• <strong>name:</strong> Name der Wiese (falls vorhanden)</li>
                            </ul>
                        </div>
                        <div className="bg-light p-4 rounded-lg">
                            <h5 className="font-bold text-foreground mb-2">Obstarten spezifizieren</h5>
                            <ul className="text-sm text-foreground space-y-1">
                                <li>• <strong>trees:</strong> apple_trees, mixed, etc.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )
        },
        {
            number: 7,
            title: "Speichern und hochladen",
            borderColor: "border-tertiary",
            bgColor: "bg-tertiary",
            content: (
                <ul className="text-foreground space-y-2">
                    <li>• Klicke auf "Speichern" (oben rechts)</li>
                    <li>• Beschreibe deine Änderungen, z.B.: <em>"Neue Streuobstwiese hinzugefügt"</em></li>
                    <li>• Gib an, welche Datenquelle du genutzt hast (Luftbilder, lokales Wissen, etc.)</li>
                    <li>• Klicke auf "Hochladen" um die Änderungen zu veröffentlichen</li>
                </ul>
            )
        }
    ];

    const existingOrchardIntroduction = (
        <>
            <h3 className="text-2xl font-bold text-foreground mb-6 font-heading">
                Bestehende landuse=orchard zur Streuobstwiese machen
            </h3>
            <p className="text-foreground mb-6">
                Viele Obstgärten sind bereits in OpenStreetMap als <code className="bg-light px-2 py-1 rounded">landuse=orchard</code> eingetragen,
                aber nicht spezifisch als Streuobstwiese markiert. So wandelst du sie um:
            </p>
        </>
    );

    const newStreuobstwieseIntroduction = (
        <>
            <h3 className="text-2xl font-bold text-foreground mb-6 font-heading">
                Neue Streuobstwiese von Grund auf erstellen
            </h3>
            <p className="text-foreground mb-6">
                Du hast eine Streuobstwiese entdeckt, die noch nicht in OpenStreetMap eingetragen ist?
                Keine Sorge - auch als Einsteiger kannst du sie ganz einfach hinzufügen:
            </p>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                <p className="text-blue-800 text-sm">
                    <strong>💡 Für Einsteiger:</strong> Keine Angst vor dem ersten Edit! OpenStreetMap ist sehr anfängerfreundlich
                    und die Community hilft gerne bei Fragen.
                </p>
            </div>
        </>
    );

    const sharedTip = (
        <>
            <h4 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                💡 Hinweis
            </h4>
            <p className="text-foreground mb-3">
                Deine Änderungen erscheinen normalerweise innerhalb von 1 Woche auf unserer Streuobstwiesen-Karte.
            </p>
        </>
    );

    const tabs = [
        {
            id: 'existing',
            label: 'Bestehenden Obstgarten umwandeln',
            content: (
                <StepGuide
                    steps={existingOrchardSteps}
                    introduction={existingOrchardIntroduction}
                    tip={sharedTip}
                />
            )
        },
        {
            id: 'new',
            label: 'Neue Streuobstwiese erstellen',
            content: (
                <StepGuide
                    steps={newStreuobstwieseSteps}
                    introduction={newStreuobstwieseIntroduction}
                    tip={sharedTip}
                />
            )
        },
        {
            id: 'trees',
            label: 'Bäume hinzufügen',
            content: (
                <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 mb-8 max-w-4xl">
                        <h3 className="text-lg sm:text-xl font-bold text-blue-900 mb-3">🌳 Warum Bäume einzeln erfassen?</h3>
                        <p className="text-blue-800 leading-relaxed mb-3">
                            Wenn du die einzelnen Bäume innerhalb einer Streuobstwiese mit <code className="bg-blue-100 px-1 rounded">natural=tree</code> markierst,
                            können wir viel genauer abschätzen, wie viele Bäume es auf deutschen Streuobstwiesen gibt.
                        </p>
                        <p className="text-blue-800 leading-relaxed">
                            Ohne einzelne Bäume können wir nur schätzen: z.B. "Eine 1 Hektar Wiese hat vermutlich 50-100 Bäume".
                            Mit erfassten Bäumen wissen wir es genau!
                        </p>
                    </div>
                    <StepGuide
                        steps={[
                            {
                                number: 1,
                                title: "Zur Streuobstwiese navigieren",
                                borderColor: "border-primary",
                                bgColor: "bg-primary",
                                content: (
                                    <ul className="text-foreground space-y-2">
                                        <li>• Öffne die <TextLink href="/karte/">Streuobstwiesen-Karte</TextLink></li>
                                        <li>• Navigiere zu der Wiese, bei der du Bäume hinzufügen möchtest</li>
                                        <li>• Klicke auf eine Wiese und dann auf die "OSM ID"</li>
                                        <li>• Die OpenStreetMap Website öffnet sich an der Stelle</li>
                                        <li>• Jetzt kannst du in den iD Editor wechseln, indem du oben links auf "Bearbeiten" klickst</li>
                                    </ul>
                                )
                            },
                            {
                                number: 2,
                                title: "Satellitenbild aktivieren",
                                borderColor: "border-secondary",
                                bgColor: "bg-secondary",
                                content: (
                                    <ul className="text-foreground space-y-2">
                                        <li>• Falls noch kein Luftbild sichtbar ist, klicke rechts oben auf "Hintergrund"</li>
                                        <li>• Wähle ein hochauflösendes Satellitenbild</li>
                                        <li>• Zoome nah ran, bis du einzelne Bäume erkennst</li>
                                    </ul>
                                )
                            },
                            {
                                number: 3,
                                title: "Bäume als Punkte setzen",
                                borderColor: "border-tertiary",
                                bgColor: "bg-tertiary",
                                content: (
                                    <ul className="text-foreground space-y-2">
                                        <li>• Klicke auf das Punkt-Tool in der Toolbar oben</li>
                                        <li>• Klicke auf jeden sichtbaren Baum in der Streuobstwiese</li>
                                        <li>• Im Eigenschaftsfenster rechts: Suche nach "Baum"</li>
                                        <li>• Wähle "Baum (natural=tree)"</li>
                                    </ul>
                                )
                            },
                            {
                                number: 4,
                                title: "Optionale Details hinzufügen",
                                borderColor: "border-accent",
                                bgColor: "bg-accent",
                                content: (
                                    <div>
                                        <p className="text-foreground mb-3">Wenn du mehr Informationen hast, kannst du hinzufügen:</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-light p-4 rounded-lg">
                                                <h5 className="font-bold text-foreground mb-2">genus (Gattung)</h5>
                                                <ul className="text-sm text-foreground space-y-1">
                                                    <li>• <code>Malus</code> - Apfel</li>
                                                    <li>• <code>Pyrus</code> - Birne</li>
                                                    <li>• <code>Prunus</code> - Kirsche/Pflaume</li>
                                                </ul>
                                            </div>
                                            <div className="bg-light p-4 rounded-lg">
                                                <h5 className="font-bold text-foreground mb-2">leaf_cycle</h5>
                                                <ul className="text-sm text-foreground space-y-1">
                                                    <li>• <code>deciduous</code> - Laubbaum</li>
                                                </ul>
                                            </div>
                                        </div>
                                        <p className="text-sm text-foreground mt-3">
                                            <strong>Tipp:</strong> Wenn du die Baumart nicht kennst, ist das kein Problem -
                                            <code className="bg-light px-1 rounded">natural=tree</code> allein reicht bereits!
                                        </p>
                                    </div>
                                )
                            },
                            {
                                number: 5,
                                title: "Speichern",
                                borderColor: "border-primary",
                                bgColor: "bg-primary",
                                content: (
                                    <ul className="text-foreground space-y-2">
                                        <li>• Klicke auf "Speichern" (oben rechts)</li>
                                        <li>• Füge eine Änderungsnotiz hinzu, z.B.:</li>
                                        <li>• <em>"Einzelne Obstbäume in Streuobstwiese hinzugefügt"</em></li>
                                        <li>• Klicke auf "Hochladen"</li>
                                    </ul>
                                )
                            }
                        ]}
                        introduction={
                            <>
                                <h4 className="text-xl font-bold text-foreground mb-3 font-heading">
                                    Einzelne Bäume erfassen
                                </h4>
                                <p className="text-foreground mb-4 leading-relaxed">
                                    Mit dieser Anleitung kannst du die tatsächlich vorhandenen Bäume innerhalb einer
                                    Streuobstwiese einzeln erfassen. Das hilft uns, genauere Statistiken zu erstellen!
                                </p>
                            </>
                        }
                        tip={sharedTip}
                    />
                </>
            )
        }
    ];

    return (
        <div>
            <h2 className="text-4xl font-bold text-center mb-12 text-foreground font-heading">
                Schritt-für-Schritt: Streuobstwiese hinzufügen
            </h2>
            <TabSwitcher tabs={tabs} defaultTab="existing" />
        </div>
    );
}