"use client";

import {
  Apple,
  Calendar,
  Cherry,
  ChevronDown,
  CircleDashed,
  Landmark,
  LandPlot,
  type LucideIcon,
  MoveHorizontal,
  MoveVertical,
  Nut,
  Pencil,
  Rows3,
  TreeDeciduous,
  Trees,
  TriangleAlert,
  X,
} from "lucide-react";
import mapboxgl from "mapbox-gl";
import { type ReactNode, useState } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { formatArea } from "@/lib/geoArea";
import { decodeOsmId, osmElementUrl, osmIdEditorUrl } from "@/lib/osmId";
import { getDisplayName } from "@/lib/osmName";
import WikiLinks, { hasWikiLinks } from "./WikiLinks";

export type FeatureKind = "meadow_orchard" | "plantation" | "orchard" | "tree";

type Properties = Record<string, unknown>;

interface FeaturePopupProps {
  kind: FeatureKind;
  osmId?: string | number;
  properties?: Properties | null;
  areaM2?: number;
  treeCount?: number;
  onClose?: () => void;
}

const KIND_STYLE: Record<
  FeatureKind,
  { label: string; icon: LucideIcon; tile: string; dot: string }
> = {
  meadow_orchard: {
    label: "Streuobstwiese",
    icon: Trees,
    tile: "bg-[#FF8C00]/15 text-[#c26a00]",
    dot: "bg-[#FF8C00]",
  },
  plantation: {
    label: "Obstplantage",
    icon: Rows3,
    tile: "bg-gray-400/20 text-gray-600",
    dot: "bg-gray-400",
  },
  orchard: {
    label: "Obstwiese",
    icon: Trees,
    tile: "bg-tertiary/15 text-tertiary",
    dot: "bg-tertiary",
  },
  tree: {
    label: "Obstbaum",
    icon: TreeDeciduous,
    tile: "bg-[#228B22]/15 text-[#1a6b1a]",
    dot: "bg-[#228B22]",
  },
};

// German display names per canonical fruit genus — mirrors GERMAN_NAME in
// data-processing/tree_genera.py (fruit trees carry the canonical genus).
const GENUS_DE: Record<string, string> = {
  Malus: "Apfel",
  Pyrus: "Birne",
  Prunus: "Steinobst",
  Cydonia: "Quitte",
  Mespilus: "Mispel",
  Juglans: "Walnuss",
  Castanea: "Edelkastanie",
  Corylus: "Hasel",
  Sorbus: "Eberesche & Mehlbeere",
  Morus: "Maulbeere",
  Ficus: "Feige",
};

const GENUS_ICON: Record<string, LucideIcon> = {
  Malus: Apple,
  Pyrus: Apple,
  Cydonia: Apple,
  Mespilus: Apple,
  Prunus: Cherry,
  Juglans: Nut,
  Castanea: Nut,
  Corylus: Nut,
};

const ACCESS_DE: Record<string, string> = {
  yes: "öffentlich",
  permissive: "geduldet",
  private: "privat",
  no: "kein Zugang",
  customers: "nur Kund:innen",
  members: "nur Mitglieder",
  destination: "Anlieger",
  agricultural: "Landwirtschaft",
  forestry: "Forstwirtschaft",
};

const YES_NO_DE: Record<string, string> = {
  yes: "erlaubt",
  no: "nicht erlaubt",
};

/** First non-empty value among the given tag keys. */
function tag(props: Properties, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = props[key];
    if (value == null) continue;
    const str = String(value).trim();
    if (str !== "") return str;
  }
  return undefined;
}

function formatLength(value?: string): string | undefined {
  if (!value) return undefined;
  if (!/^\d+([.,]\d+)?$/.test(value)) return value; // already carries a unit
  const meters = Number(value.replace(",", "."));
  return `${meters.toLocaleString("de-DE", { maximumFractionDigits: 1 })} m`;
}

function formatDate(value?: string): string | undefined {
  const iso = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return iso ? `${iso[3]}.${iso[2]}.${iso[1]}` : value;
}

function formatList(value?: string): string | undefined {
  return value
    ?.split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
}

function translate(
  dict: Record<string, string>,
  value?: string,
): string | undefined {
  return value ? (dict[value] ?? value) : undefined;
}

function safeUrl(value?: string): string | undefined {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^www\./i.test(value)) return `https://${value}`;
  return undefined;
}

/** Wikipedia/Wikidata pair of the most specific taxon level that has one. */
function taxonWiki(props: Properties) {
  for (const level of ["species", "taxon", "genus"]) {
    const wikipedia = tag(props, `${level}:wikipedia`);
    const wikidata = tag(props, `${level}:wikidata`);
    if (wikipedia || wikidata) return { wikipedia, wikidata };
  }
  return {};
}

interface Fact {
  icon: LucideIcon;
  label: string;
  value: string;
}

interface Detail {
  label: string;
  value: ReactNode;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-secondary/50">
      {children}
    </p>
  );
}

function FeaturePopup({
  kind,
  osmId,
  properties,
  areaM2,
  treeCount,
  onClose,
}: FeaturePopupProps) {
  const [showTags, setShowTags] = useState(false);
  const props: Properties = properties ?? {};
  const style = KIND_STYLE[kind];
  const isTree = kind === "tree";

  // Identity
  const name = getDisplayName(props);
  const ref = tag(props, "ref", "tree:ref");
  const isNaturalMonument =
    tag(props, "denotation") === "natural_monument" ||
    tag(props, "natural_monument") != null;

  // Taxonomy — trees, but orchards may carry species/genus tags too
  const genus = tag(props, "genus");
  const isFruitTree = !!genus && genus in GENUS_DE;
  const fruitName =
    tag(props, "species:de", "genus:de") ??
    (genus ? GENUS_DE[genus] : undefined);
  const cultivar = tag(
    props,
    "taxon:cultivar:de",
    "taxon:cultivar",
    "cultivar",
  );
  const scientificName = tag(props, "taxon", "species", "genus");
  const cultivarWikidata = tag(props, "cultivar:wikidata");

  const kindLabel = isTree && !isFruitTree ? "Baum" : style.label;
  const KindIcon = isTree
    ? (GENUS_ICON[genus ?? ""] ?? style.icon)
    : style.icon;
  const title = name ?? (isTree ? fruitName : undefined);
  const heading = title ?? kindLabel;

  const showFruitName = !!fruitName && fruitName !== heading;
  const showScientificName =
    !!scientificName &&
    scientificName !== heading &&
    scientificName !== cultivar;
  const taxonLinks = taxonWiki(props);
  // species:/taxon:/genus:wikidata stays linked even without a visible name
  const showTaxonLine = showScientificName || hasWikiLinks(taxonLinks);

  // Eigenschaften
  const facts: Fact[] = [];
  const plantedDate = formatDate(
    tag(props, "start_date", "planted_date", "date:plantation"),
  );
  if (isTree) {
    const height = formatLength(tag(props, "height", "est_height"));
    const circumference = formatLength(tag(props, "circumference"));
    const crown = formatLength(tag(props, "diameter_crown"));
    if (height)
      facts.push({ icon: MoveVertical, label: "Höhe", value: height });
    if (circumference)
      facts.push({
        icon: CircleDashed,
        label: "Stammumfang",
        value: circumference,
      });
    if (crown)
      facts.push({ icon: MoveHorizontal, label: "Krone", value: crown });
  } else {
    if (areaM2 != null)
      facts.push({
        icon: LandPlot,
        label: "Fläche",
        value: formatArea(areaM2),
      });
    // No mapped trees doesn't mean no trees — show a dash instead of 0.
    facts.push({
      icon: TreeDeciduous,
      label: "Bäume",
      value: treeCount ? treeCount.toLocaleString("de-DE") : "–",
    });
  }
  if (plantedDate)
    facts.push({ icon: Calendar, label: "Gepflanzt", value: plantedDate });

  const description = tag(props, "description:de", "description");
  const website = safeUrl(tag(props, "website", "contact:website"));
  const details: Detail[] = [
    { label: "Betreiber", value: tag(props, "operator") },
    { label: "Eigentümer", value: tag(props, "owner") },
    { label: "Zugang", value: translate(ACCESS_DE, tag(props, "access")) },
    {
      label: "Selbsternte",
      value: translate(
        YES_NO_DE,
        tag(props, "self_harvesting", "self_picking", "foraging"),
      ),
    },
    {
      label: "Erzeugnisse",
      value: formatList(tag(props, "produce", "crop", "fruit")),
    },
    {
      label: "Website",
      value: website && (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {website.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "")}
        </a>
      ),
    },
  ].filter((d) => d.value);

  const objectWiki = {
    wikipedia: tag(props, "wikipedia"),
    wikidata: tag(props, "wikidata"),
  };
  const hasProperties =
    facts.length > 0 || details.length > 0 || description != null;

  // OpenStreetMap
  const osmElement = osmId != null ? decodeOsmId(osmId) : null;
  const tagEntries = Object.entries(props)
    .filter(([key]) => key !== "osm_id")
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="w-[19rem] max-w-[calc(100vw-2rem)] text-secondary">
      {/* Header: Art, Name, Ref, Sorte */}
      <div className="relative bg-background px-4 pt-4 pb-3.5">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2.5 right-2.5 rounded-full p-1.5 text-secondary/50 outline-none hover:bg-secondary/10 hover:text-secondary focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors cursor-pointer"
            aria-label="Schließen"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="flex items-start gap-3 pr-6">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.tile}`}
          >
            <KindIcon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            {(title || ref) && (
              <div className="mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                {title && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-secondary/60">
                    <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                    {kindLabel}
                  </span>
                )}
                {ref && (
                  <span className="rounded-md bg-accent/30 px-1.5 py-px text-[11px] font-bold text-secondary">
                    Nr. {ref}
                  </span>
                )}
              </div>
            )}

            <h3 className="text-lg font-bold leading-snug break-words">
              {heading}
            </h3>

            {(showFruitName || cultivar || showTaxonLine) && (
              <div className="mt-1 space-y-1">
                {showFruitName && (
                  <p className="text-sm font-medium">{fruitName}</p>
                )}
                {cultivar && (
                  <p className="w-fit max-w-full rounded-xl bg-primary/10 px-2.5 py-0.5 text-sm leading-snug break-words text-primary">
                    <span className="text-primary/70">Sorte</span>{" "}
                    <span className="font-semibold">{cultivar}</span>{" "}
                    <span className="align-middle">
                      <WikiLinks wikidata={cultivarWikidata} variant="icon" />
                    </span>
                  </p>
                )}
                {showTaxonLine && (
                  <p className="flex items-center gap-1 text-sm text-secondary/70 italic">
                    {showScientificName && (
                      <span className="truncate">{scientificName}</span>
                    )}
                    <WikiLinks {...taxonLinks} variant="icon" />
                  </p>
                )}
              </div>
            )}

            {isNaturalMonument && (
              <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                <Landmark className="h-3 w-3" />
                Naturdenkmal
              </p>
            )}
          </div>
        </div>

        {hasWikiLinks(objectWiki) && (
          <div className="mt-3">
            <WikiLinks {...objectWiki} />
          </div>
        )}
      </div>

      {/* Eigenschaften */}
      {hasProperties && (
        <div className="space-y-2.5 bg-white px-4 pt-3 pb-3.5">
          <SectionLabel>Eigenschaften</SectionLabel>

          {facts.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className="rounded-xl bg-background/70 px-3 py-2"
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-secondary/60">
                    <fact.icon className="h-3.5 w-3.5 text-tertiary" />
                    {fact.label}
                  </div>
                  <div className="mt-0.5 text-base font-semibold tabular-nums">
                    {fact.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {description && (
            <p className="text-sm leading-relaxed text-secondary/90">
              {description}
            </p>
          )}

          {details.length > 0 && (
            <dl className="divide-y divide-secondary/10 text-sm">
              {details.map((detail) => (
                <div
                  key={detail.label}
                  className="flex justify-between gap-4 py-1.5"
                >
                  <dt className="shrink-0 text-secondary/60">{detail.label}</dt>
                  <dd className="min-w-0 break-words text-right font-medium">
                    {detail.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      {/* OpenStreetMap */}
      <div className="border-t border-secondary/10 bg-background px-4 py-2.5">
        {kind === "orchard" && (
          <div className="mb-2.5 flex gap-2 rounded-lg bg-accent/20 px-2.5 py-2 text-xs leading-relaxed">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-dark" />
            <p>
              Die Art dieser Obstwiese ist in OpenStreetMap noch nicht erfasst.
              Ergänze{" "}
              <code className="rounded bg-white/70 px-1">
                orchard=meadow_orchard
              </code>{" "}
              oder{" "}
              <code className="rounded bg-white/70 px-1">
                orchard=plantation
              </code>
              .
            </p>
          </div>
        )}

        <div className="flex items-baseline justify-between gap-2">
          <SectionLabel>OpenStreetMap</SectionLabel>
          {osmElement && (
            <a
              href={osmElementUrl(osmElement)}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 truncate font-mono text-[11px] text-secondary/50 hover:text-primary hover:underline"
              title="Auf openstreetmap.org ansehen"
            >
              {osmElement.type}/{osmElement.id}
            </a>
          )}
        </div>

        <div className="mt-1 flex items-center justify-between gap-2">
          {tagEntries.length > 0 && (
            <button
              type="button"
              onClick={() => setShowTags((open) => !open)}
              aria-expanded={showTags}
              className="flex items-center gap-1 text-[11px] text-secondary/50 hover:text-secondary transition-colors cursor-pointer"
            >
              <ChevronDown
                className={`h-3 w-3 transition-transform ${showTags ? "rotate-180" : ""}`}
              />
              Alle Attribute ({tagEntries.length})
            </button>
          )}
          {osmElement && (
            <a
              href={osmIdEditorUrl(osmElement)}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto -mr-2 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
              title="Im iD-Editor bearbeiten"
            >
              <Pencil className="h-3 w-3" />
              Bearbeiten
            </a>
          )}
        </div>

        {showTags && (
          <dl className="mt-1.5 max-h-40 overflow-y-auto rounded-lg bg-white/70 px-2 py-1.5 font-mono text-[11px] leading-relaxed">
            {tagEntries.map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <dt className="shrink-0 text-secondary/50">{key}</dt>
                <dd className="min-w-0 break-words text-secondary/80">
                  {String(value)}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}

/**
 * Opens the detail popup for an orchard area or tree. The content is a React
 * tree rendered into the popup's DOM node and unmounted when it closes.
 */
export function openFeaturePopup(
  map: mapboxgl.Map,
  lngLat: mapboxgl.LngLatLike,
  props: Omit<FeaturePopupProps, "onClose">,
): mapboxgl.Popup {
  const container = document.createElement("div");
  const root = createRoot(container);
  const popup = new mapboxgl.Popup({
    className: "feature-popup",
    closeButton: false,
    maxWidth: "none",
    offset: 10,
  });

  // Render synchronously so the popup can measure its content when placed.
  flushSync(() => {
    root.render(<FeaturePopup {...props} onClose={() => popup.remove()} />);
  });

  popup.on("close", () => setTimeout(() => root.unmount(), 0));
  return popup.setLngLat(lngLat).setDOMContent(container).addTo(map);
}
