/**
 * Resolves the display name of an OSM feature.
 *
 * `name` wins when present; `official_name` is used as a fallback so features
 * that only carry the official designation still show a name.
 */
const NAME_KEYS = ["name", "official_name"] as const;

export function getDisplayName(
  properties?: Record<string, unknown> | null,
): string | undefined {
  if (!properties) return undefined;

  for (const key of NAME_KEYS) {
    const value = properties[key];
    if (typeof value === "string" && value.trim() !== "") return value;
  }

  return undefined;
}
