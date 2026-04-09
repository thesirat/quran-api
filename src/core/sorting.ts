import type { SortSpec } from "./types.js";

export const VERSE_SORT_FIELDS: ReadonlySet<string> = new Set([
  "surah", "ayah", "meta.page", "meta.juz", "meta.hizb", "meta.ruku",
]);

/**
 * Parse a `sort` query parameter in the format `field:asc` or `field:desc`.
 * Returns null if the value is missing, malformed, or the field is not in the allowed set.
 */
export function parseSortParam(
  raw: string | undefined,
  allowed: ReadonlySet<string> = VERSE_SORT_FIELDS,
): SortSpec | null {
  if (!raw) return null;
  const idx = raw.lastIndexOf(":");
  if (idx < 1) return null;
  const field = raw.slice(0, idx);
  const dir = raw.slice(idx + 1);
  if (dir !== "asc" && dir !== "desc") return null;
  if (!allowed.has(field)) return null;
  return { field, direction: dir };
}

/** Resolve a dot-path (e.g. `meta.page`) on an object. */
function getNestedValue(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const seg of path.split(".")) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

/**
 * Sort an array by a dot-path field. Handles numbers and strings.
 * Returns a new array (does not mutate the input).
 */
export function applySorting<T>(items: T[], spec: SortSpec): T[] {
  const { field, direction } = spec;
  const mul = direction === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    const va = getNestedValue(a, field);
    const vb = getNestedValue(b, field);
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === "number" && typeof vb === "number") return (va - vb) * mul;
    return String(va).localeCompare(String(vb)) * mul;
  });
}
