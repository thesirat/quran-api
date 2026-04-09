import { loadVerseMeta, loadScript } from "./loader.js";
import type { ScriptName } from "./loaders/quran.js";
import type { SortSpec, VerseListItem } from "./types.js";
import { applySorting } from "./sorting.js";

export const ALL_VERSE_FIELDS = new Set(["key", "surah", "ayah", "text", "meta"]);

export function parseFields(raw: string | undefined, allowed: Set<string> = ALL_VERSE_FIELDS): Set<string> | null {
  if (!raw) return null;
  const fields = new Set(raw.split(",").map((f) => f.trim()).filter(Boolean));
  for (const f of fields) {
    if (!allowed.has(f)) return null;
  }
  return fields.size > 0 ? fields : null;
}

/**
 * Build a Map of verse key → VerseListItem.
 * Deduplicates naturally when the same key appears multiple times.
 */
export async function buildVerseMap(
  keys: string[],
  script: ScriptName = "uthmani",
  fields?: Set<string> | null,
): Promise<Map<string, VerseListItem>> {
  const needText = !fields || fields.has("text");
  const needMeta = !fields || fields.has("meta");

  const [meta, text] = await Promise.all([
    loadVerseMeta(),
    needText ? loadScript(script) : Promise.resolve(null),
  ]);

  const map = new Map<string, VerseListItem>();
  for (const key of keys) {
    if (map.has(key)) continue;
    const [s, a] = key.split(":").map(Number);
    const item: VerseListItem = {};
    if (!fields || fields.has("key")) item.key = key;
    if (!fields || fields.has("surah")) item.surah = s;
    if (!fields || fields.has("ayah")) item.ayah = a;
    if (needText) item.text = text?.[key] ?? "";
    if (needMeta) item.meta = meta[key];
    map.set(key, item);
  }
  return map;
}

/**
 * Build an ordered verse list with optional field selection and sorting.
 */
export async function buildVerseList(
  keys: string[],
  script: ScriptName = "uthmani",
  fields?: Set<string> | null,
  sort?: SortSpec | null,
): Promise<VerseListItem[]> {
  const map = await buildVerseMap(keys, script, fields);
  // Preserve insertion order (which matches the keys order)
  let result = [...map.values()];
  if (sort) result = applySorting(result, sort);
  return result;
}
