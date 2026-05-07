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
  if (isNaN(num)) return null;

  if (type === 'n') return `n${num}`;
  if (type === 'w') return `w${num}`;
  if (type === 'a') return num % 2 === 0 ? `w${num / 2}` : `r${(num - 1) / 2}`;
  return null;
}
