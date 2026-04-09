import { loadVerseMeta } from "./loader.js";
import type { VerseMeta } from "./types.js";

type IndexField = "page" | "juz" | "hizb" | "rub_el_hizb" | "ruku" | "manzil";

const FIELDS: IndexField[] = ["page", "juz", "hizb", "rub_el_hizb", "ruku", "manzil"];

type StructuralIndex = Record<IndexField, Record<number, string[]>>;

let cachedIndex: StructuralIndex | null = null;

function compareVerseKeys(a: string, b: string): number {
  const [as, aa] = a.split(":").map(Number);
  const [bs, ba] = b.split(":").map(Number);
  return as - bs || aa - ba;
}

async function buildIndex(): Promise<StructuralIndex> {
  if (cachedIndex) return cachedIndex;

  const verseMeta = await loadVerseMeta();
  const index = Object.fromEntries(
    FIELDS.map((f) => [f, {} as Record<number, string[]>]),
  ) as StructuralIndex;

  for (const [key, meta] of Object.entries(verseMeta) as [string, VerseMeta][]) {
    for (const field of FIELDS) {
      const val = meta[field];
      if (val == null) continue;
      const bucket = index[field];
      if (!bucket[val]) bucket[val] = [];
      bucket[val].push(key);
    }
  }

  // Sort each bucket by surah:ayah order.
  for (const field of FIELDS) {
    for (const arr of Object.values(index[field])) {
      arr.sort(compareVerseKeys);
    }
  }

  cachedIndex = index;
  return index;
}

/** O(1) lookup after first build. Returns sorted verse keys for a structural field value. */
export async function getVerseKeysByField(field: IndexField, value: number): Promise<string[]> {
  const index = await buildIndex();
  return index[field][value] ?? [];
}

/** O(1) count without building full verse objects. */
export async function getVerseCountByField(field: IndexField, value: number): Promise<number> {
  const keys = await getVerseKeysByField(field, value);
  return keys.length;
}

/** All verse keys for a surah, sorted by ayah number. */
export async function getVerseKeysForSurah(surah: number): Promise<string[]> {
  const verseMeta = await loadVerseMeta();
  const keys: string[] = [];
  for (let a = 1; a <= 300; a++) {
    const key = `${surah}:${a}`;
    if (!verseMeta[key]) break;
    keys.push(key);
  }
  return keys;
}

/** Clear the cached index (for testing or when verse meta changes). */
export function clearVerseIndexes(): void {
  cachedIndex = null;
}
