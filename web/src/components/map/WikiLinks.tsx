"use client";

import Image from "next/image";
import type { MouseEvent } from "react";

interface WikiLinksProps {
  /** OSM `wikipedia` value, e.g. "de:Speierling" */
  wikipedia?: string;
  /** OSM `wikidata` value, e.g. "Q159543" */
  wikidata?: string;
  /** "pill": logo + label, "icon": logo only */
  variant?: "pill" | "icon";
}

function parseWikidataId(value?: string): string | undefined {
  const match = value?.trim().match(/^Q\d+/);
  return match?.[0];
}

/** Resolves an OSM `wikipedia` tag ("lang:Title" or full URL) to a URL. */
function wikipediaUrl(value?: string): string | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;
  if (/^https?:\/\//.test(raw)) return raw;

  const match = raw.match(/^([a-z-]{2,12}):(.+)$/);
  const lang = match ? match[1] : "de";
  const title = (match ? match[2] : raw).trim().replace(/ /g, "_");
  return `https://${lang}.wikipedia.org/wiki/${encodeURI(title)}`;
}

function wikidataUrl(qid: string): string {
  return `https://www.wikidata.org/wiki/${qid}`;
}

/**
 * Opens the Wikipedia article linked to a Wikidata item (German first, then
 * English), falling back to the Wikidata item itself. Wikidata is only queried
 * when the user actually clicks the link.
 */
async function openWikipediaViaWikidata(
  event: MouseEvent<HTMLAnchorElement>,
  qid: string,
) {
  event.preventDefault();
  const tab = window.open("about:blank", "_blank");
  if (tab) tab.opener = null;

  let target = wikidataUrl(qid);
  try {
    const res = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=sitelinks/urls&sitefilter=dewiki|enwiki&format=json&origin=*`,
    );
    const data = await res.json();
    const sitelinks = data?.entities?.[qid]?.sitelinks;
    target = sitelinks?.dewiki?.url ?? sitelinks?.enwiki?.url ?? target;
  } catch {
    // keep Wikidata fallback
  }

  if (tab) tab.location.href = target;
  else window.location.href = target;
}

export function hasWikiLinks(props: WikiLinksProps): boolean {
  return !!wikipediaUrl(props.wikipedia) || !!parseWikidataId(props.wikidata);
}

export default function WikiLinks({
  wikipedia,
  wikidata,
  variant = "pill",
}: WikiLinksProps) {
  const qid = parseWikidataId(wikidata);
  const wpUrl = wikipediaUrl(wikipedia);
  if (!wpUrl && !qid) return null;

  const linkClass =
    variant === "pill"
      ? "inline-flex items-center gap-1.5 rounded-full border border-secondary/15 bg-white px-2.5 py-1 text-xs font-medium text-secondary hover:border-primary/40 hover:text-primary transition-colors"
      : "inline-flex items-center justify-center rounded-md p-1 opacity-70 hover:opacity-100 hover:bg-secondary/10 transition";

  return (
    <span
      className={`inline-flex items-center ${variant === "pill" ? "gap-1.5" : "gap-0.5"}`}
    >
      <a
        href={wpUrl ?? wikidataUrl(qid as string)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={
          wpUrl ? undefined : (e) => openWikipediaViaWikidata(e, qid as string)
        }
        className={linkClass}
        title="Wikipedia-Artikel öffnen"
        aria-label="Wikipedia-Artikel öffnen"
      >
        <Image
          src="/icons/wikipedia.png"
          alt=""
          width={16}
          height={15}
          className="h-3.5 w-auto"
        />
        {variant === "pill" && "Wikipedia"}
      </a>
      {qid && (
        <a
          href={wikidataUrl(qid)}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          title={`Wikidata-Eintrag ${qid} öffnen`}
          aria-label={`Wikidata-Eintrag ${qid} öffnen`}
        >
          <Image
            src="/icons/wikidata.svg"
            alt=""
            width={21}
            height={13}
            className="h-2.5 w-auto"
          />
          {variant === "pill" && "Wikidata"}
        </a>
      )}
    </span>
  );
}
