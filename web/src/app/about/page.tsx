import { Leaf, Heart, Globe, Users, TreePine } from 'lucide-react';
import BentoCard from '@/components/BentoCard';
import Section from '@/components/Section';
import Button from '@/components/Button';
import ButtonLink from '@/components/ButtonLink';

export default function AboutPage() {
  return (
    <div className="bg-background">

      {/* Hero Section */}
      <Section className="pt-20 px-4">
        <h1 className="text-5xl md:text-6xl font-bold text-primary font-heading">
          Was sind
          <br />
          <span className="text-accent">Streuobstwiesen?</span>
        </h1>

        <p className="text-xl md:text-2xl text-foreground mb-12 max-w-3xl mx-auto">
          Entdecke die faszinierende Welt traditioneller Obstkultur und ihre Bedeutung für unsere Umwelt.
        </p>
      </Section>

      {/* Content Sections */}
      <Section className="py-20 px-4">
        <div className="bento-grid">
          <BentoCard icon={Leaf} title="Definition">
            <p className="text-foreground mb-4">
              Streuobstwiesen sind traditionelle Formen des Obstbaus mit <strong>hochstämmigen Obstbäumen</strong> in weiträumigen Abständen. Die Fläche wird extensiv bewirtschaftet und das Grünland unter den Bäumen als Wiese oder Weide genutzt.
            </p>
            <p className="text-foreground">
              Der Name "Streuobst" leitet sich von der "gestreuten" Anordnung der Bäume ab, im Gegensatz zu den dichten Reihen moderner Niederstamm-Plantagen.
            </p>
          </BentoCard>

          <BentoCard icon={TreePine} title="Wichtige Merkmale">
            <ul className="text-foreground text-left space-y-2">
              <li>• Hochstämmige Obstbäume (typisch: 1,60m-1,80m Stammhöhe)</li>
              <li>• Großer Pflanzabstand (meist 8-12m)</li>
              <li>• Extensive, naturnahe Bewirtschaftung</li>
              <li>• Unternutzung als Wiese oder Weide</li>
              <li>• Verschiedene Obstsorten und Altersklassen</li>
            </ul>
          </BentoCard>

          <BentoCard icon={Heart} title="Ökologische Bedeutung">
            <p className="text-foreground mb-4">
              Streuobstwiesen gehören zu den artenreichsten Lebensräumen Mitteleuropas. Sie bieten Lebensraum für über 5.000 Tier- und Pflanzenarten.
            </p>
            <ul className="text-foreground text-left space-y-2 mb-4">
              <li>• Brutplätze für seltene Vogelarten</li>
              <li>• Nahrungsquelle für Insekten</li>
              <li>• Schutz vor Bodenerosion</li>
              <li>• Klimaregulierung durch CO₂-Speicherung</li>
            </ul>
          </BentoCard>

          <BentoCard icon={Globe} title="Kulturelle Bedeutung">
            <p className="text-foreground mb-4">
              Streuobstwiesen sind lebendiges Kulturerbe und Zeugnis traditioneller Landwirtschaft. Sie bewahren alte Obstsorten, die genetische Vielfalt und lokales Wissen.
            </p>
            <p className="text-foreground">
              Viele der über 2.000 regionalen Apfelsorten wären ohne Streuobstwiesen bereits verschwunden.
            </p>
          </BentoCard>

          <BentoCard icon={Users} title="Bedrohung & Schutz">
            <p className="text-foreground mb-4">
              Seit den 1950er Jahren sind etwa 80% der Streuobstwiesen verschwunden. Intensivierung der Landwirtschaft, Siedlungsbau und mangelnde Pflege sind die Hauptursachen.
            </p>
            <p className="text-foreground">
              Heute bemühen sich Naturschutzorganisationen, Kommunen und Bürger gemeinsam um den Erhalt dieses wertvollen Lebensraums.
            </p>
          </BentoCard>
        </div>
      </Section>

      {/* Statistics Section */}
      <Section className="py-20 px-4 bg-light">
        <h2 className="text-4xl font-bold text-center mb-16 text-foreground font-heading">
          Streuobstwiesen in Zahlen
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-5xl font-bold text-primary mb-2">2.000+</div>
            <div className="text-foreground">Alte Obstsorten</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-primary mb-2">5.000+</div>
            <div className="text-foreground">Tier- und Pflanzenarten</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-primary mb-2">80%</div>
            <div className="text-foreground">Verlust seit 1950</div>
          </div>
        </div>
      </Section>

      {/* Call to Action */}
      <Section className="py-20 px-4">
        <h2 className="text-4xl font-bold text-foreground mb-6 font-heading">
          Werde aktiv für Streuobstwiesen
        </h2>
        <p className="text-xl text-foreground mb-12 max-w-2xl mx-auto">
          Hilf dabei, dieses wertvolle Kulturgut zu erhalten und für zukünftige Generationen zu bewahren.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button href="/karte/" variant="primary">
            Streuobstwiesen entdecken
          </Button>
          <Button href="/bewirtschaftung/" variant="secondary" icon={TreePine}>
            Bewirtschaftung lernen
          </Button>
        </div>
      </Section>
    </div>
  );
}
