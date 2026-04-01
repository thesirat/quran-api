import type { Dirent } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import simdjson from "simdjson";

// Module-level cache: persists across warm Vercel invocations.
const cache = new Map<string, unknown>();
// Separate cache for lazily-parsed large JSON files.
const lazyCache = new Map<string, Record<string, unknown>>();

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

/**
 * Read a large JSON file using simdjson SIMD acceleration.
 * Values are extracted lazily per key and cached to avoid repeated C++ round-trips.
 * The returned object is a Proxy — property access drives the lazy extraction.
 */
export async function loadJsonLazy<T extends Record<string, unknown>>(relPath: string): Promise<T> {
  if (lazyCache.has(relPath)) return lazyCache.get(relPath) as T;
  const abs = path.join(ROOT, relPath);
  const raw = await fs.readFile(abs, "utf-8");
  const tape = simdjson.lazyParse(raw);
  const keyCache = new Map<string, unknown>();
  const proxy = new Proxy({} as T, {
    get(_t, prop: string | symbol) {
      if (typeof prop !== "string") return undefined;
      if (keyCache.has(prop)) return keyCache.get(prop);
      const val = tape.valueForKeyPath(prop) as unknown;
      keyCache.set(prop, val);
      return val;
    },
    has(_t, prop: string | symbol) {
      if (typeof prop !== "string") return false;
      return tape.valueForKeyPath(prop) !== undefined;
    },
  });
  lazyCache.set(relPath, proxy as Record<string, unknown>);
  return proxy;
}

/** loadJsonLazy variant that returns undefined if the file doesn't exist. */
export async function tryLoadJsonLazy<T extends Record<string, unknown>>(relPath: string): Promise<T | undefined> {
  try {
    return await loadJsonLazy<T>(relPath);
  } catch {
    return undefined;
  }
}

/** Clear the in-memory cache (useful for testing). */
export function clearCache(): void {
  cache.clear();
  lazyCache.clear();
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
  WordTranslationCatalogEntry,
  TransliterationCatalogEntry,
  SurahInfo,
  SurahInfoCatalogEntry,
  SimilarAyahPair,
  FontListItem,
  FontManifest,
} from "./types.js";

export const loadVerseMeta = () =>
  loadJson<Record<string, VerseMeta>>("data/verses/meta.json");

export const VALID_SCRIPTS = ["uthmani", "simple", "indopak", "tajweed", "qpc-hafs"] as const;
export type ScriptName = (typeof VALID_SCRIPTS)[number];

export async function loadScript(script: ScriptName): Promise<Record<string, string>> {
  const data = await tryLoadJson<Record<string, string>>(`data/quran/${script}.json`);
  if (data) return data;
  throw new Error(`Script data not available: ${script}. Run scripts/scrape_qul.py --resources quran-scripts.`);
}

export const loadWordsArabic = () =>
  loadJson<Record<string, Omit<WordData, "key">>>("data/words/arabic.json");

export const loadWordTranslation = (lang: string) =>
  tryLoadJson<Record<string, string>>(`data/words/translations/${lang}.json`);

export const loadCorpusMorphology = () =>
  loadJsonLazy<Record<string, { segments: MorphSegment[] }>>("data/morphology/corpus.json");

export const loadQulMorphology = () =>
  tryLoadJson<Record<string, QulMorphWord>>("data/morphology/qul.json");

export const loadRootsIndex = () =>
  loadJsonLazy<Record<string, string[]>>("data/morphology/roots.json");

export const loadLemmasIndex = () =>
  tryLoadJsonLazy<Record<string, string[]>>("data/morphology/lemmas.json");

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

// Each segment entry is [word_position, start_ms, duration_ms, end_ms?]
export const loadAudioSegments = (recitationId: number | string) =>
  tryLoadJson<Record<string, number[][]>>(`data/audio/segments/${recitationId}.json`);

export const loadTopics = () =>
  loadJson<Record<string, TopicEntry>>("data/topics/data.json");

export const loadMutashabihat = () =>
  tryLoadJson<MutashabihatPair[]>("data/mutashabihat/data.json");

export const loadMushafPages = () =>
  tryLoadJson<Record<string, MushafPage>>("data/mushaf/pages.json");

export const loadStructureMeta = () =>
  loadJson<TanzilMeta>("data/structure/meta.json");

export const loadWordTranslationCatalog = () =>
  tryLoadJson<WordTranslationCatalogEntry[]>("data/words/translations/index.json");

export const loadTransliterationCatalog = () =>
  tryLoadJson<TransliterationCatalogEntry[]>("data/transliteration/index.json");

export const loadTransliteration = (lang: string) =>
  tryLoadJson<Record<string, string>>(`data/transliteration/${lang}.json`);

export const loadSurahInfoCatalog = () =>
  tryLoadJson<SurahInfoCatalogEntry[]>("data/surah-info/index.json");

export const loadSurahInfo = (lang: string) =>
  tryLoadJson<Record<string, SurahInfo>>(`data/surah-info/${lang}.json`);

export const loadSimilarAyahs = () =>
  tryLoadJson<SimilarAyahPair[]>("data/similar-ayahs/data.json");

export const loadAyahThemes = () =>
  tryLoadJson<Record<string, string[]>>("data/ayah-themes/data.json");

// ---------------------------------------------------------------------------
// Fonts (data/fonts/<numeric-id>/)
// ---------------------------------------------------------------------------

const fontsRoot = () => path.join(ROOT, "data", "fonts");

/** Safe single-segment filename under a font directory (no path traversal). */
export function assertSafeFontFilename(name: string): string | null {
  if (!name || name === "." || name === "..") return null;
  if (name.includes("/") || name.includes("\\") || name.includes("\0")) return null;
  if (path.basename(name) !== name) return null;
  return name;
}

export function fontMimeType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".woff2")) return "font/woff2";
  if (lower.endsWith(".woff")) return "font/woff";
  if (lower.endsWith(".ttf")) return "font/ttf";
  if (lower.endsWith(".otf")) return "font/otf";
  if (lower.endsWith(".json.bz2")) return "application/x-bzip2";
  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".bz2")) return "application/x-bzip2";
  return "application/octet-stream";
}

async function readFontManifestFile(fontId: string): Promise<FontManifest | undefined> {
  try {
    const raw = await fs.readFile(path.join(fontsRoot(), fontId, "manifest.json"), "utf-8");
    return JSON.parse(raw) as FontManifest;
  } catch {
    return undefined;
  }
}

/** List font resource ids with file counts (from manifest or directory scan). */
export async function listFontResources(): Promise<FontListItem[]> {
  const root = fontsRoot();
  let entries: Dirent[];
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }

  const rows: FontListItem[] = [];
  for (const ent of entries) {
    if (!ent.isDirectory() || !/^\d+$/.test(ent.name)) continue;
    const id = ent.name;
    const manifest = await readFontManifestFile(id);
    let files = manifest?.files?.filter(Boolean) ?? [];
    if (files.length === 0) {
      try {
        const names = await fs.readdir(path.join(root, id));
        files = names.filter((n) => n !== "manifest.json");
      } catch {
        files = [];
      }
    }
    rows.push({
      id,
      file_count: files.length,
      detail_url: manifest?.detail_url,
    });
  }
  rows.sort((a, b) => Number(a.id) - Number(b.id));
  return rows;
}

/** Full manifest + file list for one font id, or null if missing. */
export async function loadFontDetail(fontId: string): Promise<{ id: string; detail_url?: string; files: string[] } | null> {
  if (!/^\d+$/.test(fontId)) return null;
  const dir = path.join(fontsRoot(), fontId);
  try {
    const st = await fs.stat(dir);
    if (!st.isDirectory()) return null;
  } catch {
    return null;
  }

  const manifest = await readFontManifestFile(fontId);
  let files = manifest?.files?.filter(Boolean) ?? [];
  if (files.length === 0) {
    try {
      const names = await fs.readdir(dir);
      files = names.filter((n) => n !== "manifest.json").sort();
    } catch {
      files = [];
    }
  } else {
    files = [...files].sort();
  }

  return {
    id: fontId,
    detail_url: manifest?.detail_url,
    files,
  };
}

/** Read one font asset file; returns null if missing or unsafe. */
export async function readFontFile(fontId: string, filename: string): Promise<Buffer | null> {
  if (!/^\d+$/.test(fontId)) return null;
  const safeName = assertSafeFontFilename(filename);
  if (!safeName) return null;

  const dir = path.resolve(path.join(fontsRoot(), fontId));
  const full = path.resolve(path.join(dir, safeName));
  if (!full.startsWith(dir + path.sep) && full !== dir) return null;

  try {
    const st = await fs.stat(full);
    if (!st.isFile()) return null;
    return await fs.readFile(full);
  } catch {
    return null;
  }
}
