import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Map, Database, Info, TreePine, Eye, Network, BookOpen, MapPin, Mail } from 'lucide-react';
import Button from '@/components/Button';
import BentoCard from '@/components/BentoCard';
import StandardLayout from '@/components/layouts/StandardLayout';
import StatsDisplay from '@/components/StatsDisplay';

export default function Home() {
  return (
    <StandardLayout>
      <div className="bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-12 px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-4 md:gap-12 text-center md:text-left">
            <div className="flex-1">
              <h1 className="text-5xl md:text-7xl font-black mb-2 text-secondary font-heading">
                Streuobstwiesen Portal
              </h1>

              {/* Handgezeichnete Unterstreichung */}
              {/* <div className="flex justify-center md:justify-start mb-8 -translate-y-12">
              <HanddrawnUnderline />
            </div> */}

              <p className="text-xl md:text-2xl text-foreground mb-8 max-w-4xl leading-relaxed">
                Interaktive Karte mit allen Streuobstwiesen in Deutschland und
                Informationen zu Bewirtschaftung, Erhalt und Kartierung.
              </p>

              {/* Button mit größerer Schrift und besseren Abständen */}
              <div className="mb-16 flex flex-col items-center md:items-start">
                <Link
                  href="/karte/"
                  prefetch={false}
                  className="inline-flex items-center gap-4 bg-primary hover:bg-primary/90 text-background px-8 py-4 rounded-lg text-xl font-semibold transition-all duration-200 hover:shadow-lg"
                >
                  <Map className="w-7 h-7" />
                  Zur interaktiven Karte
                  <ArrowRight className="w-7 h-7" />
                </Link>
                <p className="text-sm text-gray-600 mt-2">
                  Alle Streuobstwiesen & Obstgärten in Deutschland
                </p>
              </div>
            </div>

            {/* Hero image on the right - square, rounded corners */}
            <div className="flex-none md:ml-8 relative w-full md:w-96 h-40 sm:h-52 md:h-96">
              <Image
                src="/hero_image.avif"
                alt="Eine Streuobstwiese im Sonnenuntergang"
                fill
                priority
                sizes="(max-width: 767px) 100vw, 384px"
                className="rounded-2xl object-cover shadow-lg"
              />
            </div>
          </div>

          {/* Statistics Section */}
          <StatsDisplay />
        </section>

        {/* Einführung Section */}
        <section className="py-16 px-4 bg-light">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-heading">
                Worum geht&apos;s hier?
              </h2>
              <p className="text-lg text-foreground/80 max-w-3xl mx-auto leading-relaxed">
                Diese Plattform ist dein zentraler Einstiegspunkt in die Welt der Streuobstwiesen –
                egal ob du Neuling bist oder bereits Erfahrung hast.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Einstieg für Neulinge */}
              <div className="bg-background rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Einstieg für Neulinge
                </h3>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  Du möchtest Anfangen eine Streuobstwiese zu bewirtschaften oder hast eine geerbt und fragst dich, was du jetzt machst? Wir geben dir einen Überblick.
                </p>
              </div>

              {/* Interaktive Übersichtskarte */}
              <div className="bg-background rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <div className="w-12 h-12 bg-tertiary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Map className="w-6 h-6 text-tertiary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Interaktive Karte
                </h3>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  Visualisierung wo Streuobstwiesen in Deutschland konzentriert sind
                  und wo noch Potenzial besteht.
                </p>
              </div>

              {/* OpenStreetMap Sichtbarkeit */}
              <div className="bg-background rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  OSM Sichtbarkeit
                </h3>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  Förderung der Kartierung von Streuobstwiesen in OpenStreetMap
                  für bessere Datenverfügbarkeit.
                </p>
              </div>

              {/* Initiativen bündeln */}
              <div className="bg-background rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Network className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Initiativen bündeln
                </h3>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  Vernetzung verschiedener Streuobst-Initiativen für eine
                  stärkere gemeinsame Stimme.
                </p>
              </div>
            </div>

            {/* Zentrale Botschaft */}
            <div className="mt-12 bg-background rounded-lg p-8 text-center border border-primary/20">
              <MapPin className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Gemeinsam für den Erhalt unserer Kulturlandschaft
              </h3>
              <p className="text-foreground/80 leading-relaxed max-w-2xl mx-auto">
                Streuobstwiesen sind nicht nur ökologisch wertvoll, sondern auch ein wichtiger Teil
                unserer Kulturgeschichte. Diese Plattform soll alle zusammen bringen, die sich für ihren
                Erhalt einsetzen – von Privatpersonen bis hin zu großen Naturschutzorganisationen.
              </p>
            </div>
          </div>
        </section>

        {/* Bento Grid Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto flex flex-col items-center">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-foreground font-heading">
              Entdecke die Welt der Streuobstwiesen
            </h2>

            <div className="bento-grid">
              {/* Large Map Card - spans full width on mobile, 2 cols on larger screens */}
              <BentoCard className=" bg-secondary text-secondary" icon={Map} title="Interaktive Karte">
                <p className="text-lg mb-6">
                  Erkunde über 100.000 Obstgärten in ganz Deutschland.

                </p>
                <Button href="/karte/" variant="primary" icon={Map}>
                  Karte öffnen
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </BentoCard>

              {/* Info Card */}
              <BentoCard icon={Info} title="Was sind Streuobstwiesen?">
                <p className="text-foreground mb-6">
                  Erfahre mehr über die Bedeutung und den ökologischen Wert von Streuobstwiesen.
                </p>
                <Button href="/about/" variant="outline">
                  Mehr erfahren <ArrowRight className="w-4 h-4" />
                </Button>
              </BentoCard>

              {/* Bewirtschaftung Card */}
              <BentoCard icon={TreePine} title="Bewirtschaftung lernen">
                <p className="text-foreground mb-6">
                  Du hast eine Streuobstwiese geerbt oder möchtest eine bewirtschaften? Hier findest du Hilfe!
                </p>
                <Button href="/bewirtschaftung/" variant="outline">
                  Ratgeber öffnen <ArrowRight className="w-4 h-4" />
                </Button>
              </BentoCard>


              {/* Data Card */}
              <BentoCard icon={Database} title="Daten & Mitmachen">
                <p className="text-foreground mb-6">
                  Alle Daten basieren auf OpenStreetMap. Lerne, wie du selbst Streuobstwiesen kartieren kannst.
                </p>
                <Button href="/data/" variant="outline">
                  Mitmachen <ArrowRight className="w-4 h-4" />
                </Button>
              </BentoCard>

            </div>
          </div>
        </section>

        {/* Mitgestaltung Block */}
        <section className="py-20 px-4 bg-secondary/10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6 font-heading text-center">Mitgestaltung</h2>
            <p className="text-foreground/80 leading-relaxed text-lg">
              Ob im Code, bei Daten oder mit eigenen Streuobstwiesen vor Ort: Das Streuobst Portal ist offen für Menschen und Organisationen, die sich einbringen möchten. Besonders OGVs und weitere Initiativen können gemeinsam mit uns daran arbeiten, Streuobstwiesen in ganz Deutschland sichtbarer zu machen — etwa, indem eigene Flächen, Projekte und regionale Informationen auf der Plattform und der Karte erscheinen. Wenn du oder ihr Interesse an einer Zusammenarbeit habt, meldet euch gerne und wir bringen die Streuobstwiesen in das digitale Zeitalter.
            </p>
            <div className="mt-8 text-center">
              <Button href="mailto:hallo@portal-streuobst.de" icon={Mail}>
                Kontakt aufnehmen
              </Button>
            </div>
          </div>
        </section>

        {/* Japfel Initiator Block */}
        <section className="py-16 px-4 bg-light">
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-xl font-semibold uppercase tracking-widest text-foreground mb-8">
              Eine Initiative von
            </p>
            <div className="bg-background rounded-2xl p-8 md:p-12 shadow-sm border border-gray-200">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-none">
                  <img
                    src="/partner/Japfel_Logo.png"
                    alt="Japfel Logo"
                    className="h-24 w-auto"
                  />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold text-foreground mb-3 font-heading">
                    Japfel
                  </h2>
                  <p className="text-foreground/80 leading-relaxed mb-6">
                    Unsere Baum-Patenschaften helfen Streuobstwiesen im
                    baden-württembergischen Jagsttal zu erhalten. Wir lieben unsere Heimat und
                    möchten die biologisch Vielfältigkeit der Wiesen erhalten und ausbauen.
                    Dafür pflanzen wir neue Bäume und stellen leckeren Apfelmus und Cider her.
                  </p>
                  <a
                    href="https://www.japfel.de"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-background px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                  >
                    Mehr über Japfel erfahren
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </StandardLayout>
  );
}
