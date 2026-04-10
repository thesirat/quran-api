import {
  loadVerseMeta,
  loadScript,
  loadTranslation,
  loadWordsArabic,
  loadWordTranslation,
  loadPauseMarks,
  loadWordTransliteration,
  loadTransliteration,
} from "./loader.js";
import type { ScriptName } from "./loaders/quran.js";
import type { SortSpec, TranslationEntry, VerseListItem, WordData } from "./types.js";
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

export interface BuildVerseOptions {
  translationIds?: string[];
  words?: boolean;
  lang?: string;
  /** Embed verse-level transliteration (alias lang, e.g. "en"). */
  transliteration?: string;
}

/**
 * Build a Map of verse key → VerseListItem.
 * Deduplicates naturally when the same key appears multiple times.
 */
export async function buildVerseMap(
  keys: string[],
  script: ScriptName = "uthmani",
  fields?: Set<string> | null,
  options?: BuildVerseOptions,
): Promise<Map<string, VerseListItem>> {
  const needText = !fields || fields.has("text");
  const needMeta = !fields || fields.has("meta");
  const tIds = options?.translationIds;
  const needWords = options?.words === true;
  const wordLang = needWords ? options?.lang : undefined;
  const verseTransliterationLang = options?.transliteration;

  const [meta, text, wordsArabic, pauseMarks, wordTranslation, wordTransliteration, verseTransliteration, ...translationMaps] =
    await Promise.all([
      loadVerseMeta(),
      needText ? loadScript(script) : Promise.resolve(null),
      needWords ? loadWordsArabic() : Promise.resolve(null),
      needWords ? loadPauseMarks() : Promise.resolve(null),
      wordLang ? loadWordTranslation(wordLang) : Promise.resolve(undefined),
      wordLang ? loadWordTransliteration(wordLang) : Promise.resolve(undefined),
      verseTransliterationLang ? loadTransliteration(verseTransliterationLang) : Promise.resolve(undefined),
      ...(tIds ?? []).map((id) => loadTranslation(id).catch(() => null)),
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
    if (needWords && meta[key]) {
      const words: WordData[] = [];
      for (let w = 1; w <= meta[key].words_count; w++) {
        const wk = `${key}:${w}`;
        const raw = wordsArabic?.[wk];
        if (!raw) continue;
        words.push({
          key: wk,
          text: raw.text,
          text_indopak: raw.text_indopak ?? undefined,
          code_v1: raw.code_v1 ?? undefined,
          code_v2: raw.code_v2 ?? undefined,
          position: raw.position ?? w,
          page: raw.page ?? undefined,
          line: raw.line ?? undefined,
          type: raw.type ?? undefined,
          translation: wordTranslation?.[wk],
          transliteration: wordTransliteration?.[wk],
          pause_mark: pauseMarks?.[wk],
        });
      }
      item.words = words;
    }
    if (verseTransliteration) {
      const t = verseTransliteration[key];
      if (t !== undefined) item.transliteration = t;
    }
    if (tIds && tIds.length > 0) {
      const tr: Record<string, TranslationEntry> = {};
      for (let i = 0; i < tIds.length; i++) {
        const entry = translationMaps[i]?.[key];
        if (entry) tr[tIds[i]] = entry;
      }
      if (Object.keys(tr).length > 0) item.translations = tr;
    }
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
  options?: BuildVerseOptions,
): Promise<VerseListItem[]> {
  const map = await buildVerseMap(keys, script, fields, options);
  // Preserve insertion order (which matches the keys order)
  let result = [...map.values()];
  if (sort) result = applySorting(result, sort);
  return result;
}
