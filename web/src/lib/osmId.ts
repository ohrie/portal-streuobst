/**
 * Decodes an osmium type_id string to a JOSM remote-control object identifier.
 *
 * n<id>          → n<id>        (node)
 * w<id>          → w<id>        (way)
 * a<id> even     → w<id/2>      (area from way: osmium encodes as 2*way_id)
 * a<id> odd      → r<(id-1)/2>  (area from relation: osmium encodes as 2*relation_id+1)
 */
export function osmIdToJosmObject(osmId: string): string | null {
  if (!osmId) return null;
  const type = osmId[0];
  const num = parseInt(osmId.slice(1), 10);
  if (Number.isNaN(num)) return null;

  if (type === "n") return `n${num}`;
  if (type === "w") return `w${num}`;
  if (type === "a") return num % 2 === 0 ? `w${num / 2}` : `r${(num - 1) / 2}`;
  return null;
}

export type OsmElementType = "node" | "way" | "relation";

export interface OsmElementRef {
  type: OsmElementType;
  id: string;
}

const JOSM_PREFIX_TO_TYPE: Record<string, OsmElementType> = {
  n: "node",
  w: "way",
  r: "relation",
};

/**
 * Decodes an osmium type_id string (see osmIdToJosmObject) to the original OSM
 * element. A bare number is treated as a way ID.
 */
export function decodeOsmId(osmId: string | number): OsmElementRef | null {
  const raw = String(osmId);
  if (/^\d+$/.test(raw)) return { type: "way", id: raw };

  const josm = osmIdToJosmObject(raw);
  if (!josm) return null;
  return { type: JOSM_PREFIX_TO_TYPE[josm[0]], id: josm.slice(1) };
}

export function osmElementUrl({ type, id }: OsmElementRef): string {
  return `https://www.openstreetmap.org/${type}/${id}`;
}

export function osmIdEditorUrl({ type, id }: OsmElementRef): string {
  return `https://www.openstreetmap.org/edit?editor=id&${type}=${id}`;
}
