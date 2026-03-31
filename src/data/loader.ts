import fs from "node:fs/promises";
import path from "node:path";

// Module-level cache: persists across warm Vercel invocations.
const cache = new Map<string, unknown>();

const ROOT = process.cwd();

/**
 * Read a JSON file from `data/` (relative to project root) and cache it.
 * Subsequent calls for the same path return the cached value synchronously.
 */
export async function loadJson<T>(relPath: string): Promise<T> {
  if (cache.has(relPath)) return cache.get(relPath) as T;
  const abs = path.join(ROOT, relPath);
  const raw = await fs.readFile(abs, "utf-8");
  const value = JSON.parse(raw) as T;
  cache.set(relPath, value);
  return value;
}

/** Load and return, or return undefined if file doesn't exist. */
export async function tryLoadJson<T>(relPath: string): Promise<T | undefined> {
  try {
    return await loadJson<T>(relPath);
  } catch {
    return undefined;
  }
}

/** Clear the in-memory cache (useful for testing). */
export function clearCache(): void {
  cache.clear();
}

// ---------------------------------------------------------------------------
// Typed helpers
// ---------------------------------------------------------------------------
import type {
  VerseMeta,
  WordData,
  MorphSegment,
  QulMorphWord,
  TranslationEntry,
  TranslationCatalogEntry,
  TafsirChapter,
  TafsirCatalogEntry,
  RecitationEntry,
  TopicEntry,
  MutashabihatPair,
  MushafPage,
  TanzilMeta,
} from "./types.js";

export const loadVerseMeta = () =>
  loadJson<Record<string, VerseMeta>>("data/verses/meta.json");

export const loadUthmani = () =>
  loadJson<Record<string, string>>("data/quran/uthmani.json");

export const loadSimple = () =>
  tryLoadJson<Record<string, string>>("data/quran/simple.json");

export const loadTajweed = () =>
  tryLoadJson<Record<string, string>>("data/quran/tajweed.json");

export const loadWordsArabic = () =>
  loadJson<Record<string, Omit<WordData, "key">>>("data/words/arabic.json");

export const loadWordTranslation = (lang: string) =>
  tryLoadJson<Record<string, string>>(`data/words/translations/${lang}.json`);

export const loadCorpusMorphology = () =>
  loadJson<Record<string, { segments: MorphSegment[] }>>("data/morphology/corpus.json");

export const loadQulMorphology = () =>
  tryLoadJson<Record<string, QulMorphWord>>("data/morphology/qul.json");

export const loadRootsIndex = () =>
  loadJson<Record<string, string[]>>("data/morphology/roots.json");

export const loadLemmasIndex = () =>
  tryLoadJson<Record<string, string[]>>("data/morphology/lemmas.json");

export const loadPauseMarks = () =>
  tryLoadJson<Record<string, string>>("data/morphology/pause-marks.json");

export const loadTranslation = (id: number | string) =>
  tryLoadJson<Record<string, TranslationEntry>>(`data/translations/${id}.json`);

export const loadTranslationCatalog = () =>
  loadJson<TranslationCatalogEntry[]>("data/translations/index.json");

export const loadTafsirChapter = (id: number | string, surah: number) =>
  tryLoadJson<TafsirChapter>(`data/tafsirs/${id}/${surah}.json`);

export const loadTafsirCatalog = () =>
  loadJson<TafsirCatalogEntry[]>("data/tafsirs/index.json");

export const loadRecitations = () =>
  loadJson<RecitationEntry[]>("data/audio/recitations.json");

export const loadAudioSegments = (recitationId: number | string) =>
  tryLoadJson<Record<string, unknown>>(`data/audio/segments/${recitationId}.json`);

export const loadTopics = () =>
  loadJson<Record<string, TopicEntry>>("data/topics/data.json");

export const loadMutashabihat = () =>
  tryLoadJson<MutashabihatPair[]>("data/mutashabihat/data.json");

export const loadMushafPages = () =>
  tryLoadJson<Record<string, MushafPage>>("data/mushaf/pages.json");

export const loadStructureMeta = () =>
  loadJson<TanzilMeta>("data/structure/meta.json");
