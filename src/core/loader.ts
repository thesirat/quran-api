import type { Dirent } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import simdjson from "simdjson";
import type { JSONTape } from "simdjson";

// Module-level cache: persists across warm Vercel invocations.
const cache = new Map<string, unknown>();
// Separate cache for lazily-parsed large JSON files.
const lazyCache = new Map<string, Record<string, unknown>>();

const ROOT = process.cwd();

/** When set (e.g. GitHub raw: https://raw.githubusercontent.com/o/r/abc123), data is fetched over HTTP instead of fs. */
function dataBaseUrl(): string | undefined {
  const u = process.env.DATA_BASE_URL?.trim();
  return u || undefined;
}

function isRemoteData(): boolean {
  return !!dataBaseUrl();
}

/**
 * Deployed Vercel functions do not include repo `data/` (size limits). Reading from disk there always fails unless `vercel dev` (local checkout).
 */
function assertLocalCorpusFilesystemAllowed(): void {
  if (isRemoteData()) return;
  if (process.env.VERCEL !== "1") return;
  if (process.env.VERCEL_ENV === "development") return;
  throw new Error(
    "DATA_BASE_URL is required on Vercel (production/preview). The corpus is not bundled in the serverless function. " +
      "Set DATA_BASE_URL to a pinned base URL whose paths mirror the repo, e.g. " +
      "https://raw.githubusercontent.com/<owner>/<repo>/<commit-or-tag> (no trailing slash). " +
      "See docs/api.md — Deployment and corpus storage."
  );
}

/** Runtime mode for observability (e.g. GET /). */
export function getDataLoadingMeta(): { mode: "local" | "remote"; baseUrl: string | null } {
  const b = dataBaseUrl();
  return { mode: b ? "remote" : "local", baseUrl: b ?? null };
}

function assertSafeDataRelPath(relPath: string): void {
  if (path.isAbsolute(relPath)) {
    throw new Error(`Invalid data path (absolute): ${relPath}`);
  }
  const norm = path.posix.normalize(relPath.replace(/\\/g, "/"));
  if (norm.startsWith("../") || norm === ".." || norm.includes("/../")) {
    throw new Error(`Invalid data path: ${relPath}`);
  }
  if (norm.startsWith("/")) {
    throw new Error(`Invalid data path: ${relPath}`);
  }
  if (!norm.startsWith("data/") && norm !== "data") {
    throw new Error(`Invalid data path (must be under data/): ${relPath}`);
  }
}

/** Single path segment for dynamic resources (translations id, lang codes, etc.). */
function assertSafeResourceSegment(segment: string, label: string): void {
  if (segment.length === 0 || segment.length > 240) {
    throw new Error(`Invalid ${label}`);
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(segment)) {
    throw new Error(`Invalid ${label}`);
  }
}

function assertTafsirSurahPathSegment(surah: number): void {
  if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
    throw new Error("Invalid surah number for tafsir resource path");
  }
}

function isNotFoundError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const err = e as NodeJS.ErrnoException & { status?: number };
  if (err.code === "ENOENT") return true;
  if (err.status === 404) return true;
  const msg = err instanceof Error ? err.message : "";
  if (msg.startsWith("Not found: http")) return true;
  return false;
}

function joinDataUrl(relPath: string): string {
  assertSafeDataRelPath(relPath);
  const base = dataBaseUrl()!.replace(/\/$/, "");
  const p = relPath.split(/[/\\]/).filter(Boolean).join("/");
  return `${base}/${p}`;
}

async function readDataTextFromRemote(relPath: string): Promise<string> {
  const url = joinDataUrl(relPath);
  const res = await fetch(url, {
    headers: { "User-Agent": "quran-api/1.0 (DATA_BASE_URL fetch)" },
  });
  if (res.status === 404) {
    throw Object.assign(new Error(`Not found: ${url}`), { code: "ENOENT" });
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return await res.text();
}

async function tryReadDataTextFromRemote(relPath: string): Promise<string | undefined> {
  try {
    return await readDataTextFromRemote(relPath);
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return undefined;
    throw e;
  }
}

async function readDataBufferFromRemote(relPath: string): Promise<Buffer | null> {
  const url = joinDataUrl(relPath);
  const res = await fetch(url, {
    headers: { "User-Agent": "quran-api/1.0 (DATA_BASE_URL fetch)" },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

/**
 * Read a JSON file from `data/` (relative to project root) and cache it.
 * Subsequent calls for the same path return the cached value synchronously.
 */
export async function loadJson<T>(relPath: string): Promise<T> {
  assertSafeDataRelPath(relPath);
  if (cache.has(relPath)) return cache.get(relPath) as T;
  let raw: string;
  if (isRemoteData()) {
    raw = await readDataTextFromRemote(relPath);
  } else {
    assertLocalCorpusFilesystemAllowed();
    const abs = path.join(ROOT, relPath);
    raw = await fs.readFile(abs, "utf-8");
  }
  const value = JSON.parse(raw) as T;
  cache.set(relPath, value);
  return value;
}

/** Load and return, or return undefined only if the resource is missing (404 / ENOENT). */
export async function tryLoadJson<T>(relPath: string): Promise<T | undefined> {
  try {
    return await loadJson<T>(relPath);
  } catch (e) {
    if (isNotFoundError(e)) return undefined;
    throw e;
  }
}

/**
 * simdjson `valueForKeyPath` uses `.` / `[n]` path syntax; missing keys throw (they do not return
 * undefined). The `in` operator / `JSON.stringify` can invoke `has` and crash. Word keys like
 * `1:1:1` are safe as a single segment, but we still wrap all lookups so proxies never throw.
 */
function simdjsonKeyLookup(tape: JSONTape, prop: string): unknown {
  try {
    return tape.valueForKeyPath(prop) as unknown;
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
  assertSafeDataRelPath(relPath);
  if (lazyCache.has(relPath)) return lazyCache.get(relPath) as T;
  let raw: string;
  if (isRemoteData()) {
    raw = await readDataTextFromRemote(relPath);
  } else {
    assertLocalCorpusFilesystemAllowed();
    const abs = path.join(ROOT, relPath);
    raw = await fs.readFile(abs, "utf-8");
  }
  const tape = simdjson.lazyParse(raw);
  const keyCache = new Map<string, unknown>();
  const proxy = new Proxy({} as T, {
    get(_t, prop: string | symbol) {
      if (typeof prop !== "string") return undefined;
      if (keyCache.has(prop)) return keyCache.get(prop);
      const val = simdjsonKeyLookup(tape, prop);
      keyCache.set(prop, val);
      return val;
    },
    has(_t, prop: string | symbol) {
      if (typeof prop !== "string") return false;
      return simdjsonKeyLookup(tape, prop) !== undefined;
    },
  });
  lazyCache.set(relPath, proxy as Record<string, unknown>);
  return proxy;
}

/** loadJsonLazy variant that returns undefined only if the resource is missing. */
export async function tryLoadJsonLazy<T extends Record<string, unknown>>(relPath: string): Promise<T | undefined> {
  try {
    return await loadJsonLazy<T>(relPath);
  } catch (e) {
    if (isNotFoundError(e)) return undefined;
    throw e;
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
import { buildCorpusFromEnriched } from "./morphology-from-enriched.js";
import type { EnrichedMorphologyRow } from "./morphology-from-enriched.js";
import { buildMorphologySearchIndexesFromCorpus } from "./morphology-search-indexes.js";
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
  WordTranslationCatalogEntry,
  TransliterationCatalogEntry,
  SurahInfo,
  SurahInfoCatalogEntry,
  SimilarAyahPair,
  FontListItem,
  FontManifest,
  FontCatalogEntry,
} from "./types.js";
import { buildStructureFromVerseMeta } from "./structure-from-verses.js";
import { assembleVerseMetaFromMetadata } from "./verse-meta-assembled.js";
import { tryLoadScriptFromQulRaw, tryLoadWordsArabicFromQulRaw } from "./quran-script-from-raw.js";

const VERSE_META_CACHE_KEY = "data/verses/meta.json";

/**
 * Prefer `data/verses/meta.json` when present; otherwise assemble from QUL `data/metadata/*.json`,
 * mushaf layout word ids (`data/mushaf-layout/kfgqpc_v4_layout_1441h_print.json`), and any `data/quran/*-raw.json`.
 */
export async function loadVerseMeta(): Promise<Record<string, VerseMeta>> {
  if (cache.has(VERSE_META_CACHE_KEY)) return cache.get(VERSE_META_CACHE_KEY) as Record<string, VerseMeta>;
  const fromFile = await tryLoadJson<Record<string, VerseMeta>>(VERSE_META_CACHE_KEY);
  if (fromFile) {
    cache.set(VERSE_META_CACHE_KEY, fromFile);
    return fromFile;
  }
  const assembled = await assembleVerseMetaFromMetadata({ tryLoadJson, loadJson });
  cache.set(VERSE_META_CACHE_KEY, assembled);
  return assembled;
}

export const VALID_SCRIPTS = ["uthmani", "simple", "indopak", "tajweed", "qpc-hafs"] as const;
export type ScriptName = (typeof VALID_SCRIPTS)[number];

export async function loadScript(script: ScriptName): Promise<Record<string, string>> {
  const primaryKey = `data/quran/${script}.json`;
  if (cache.has(primaryKey)) return cache.get(primaryKey) as Record<string, string>;
  const data = await tryLoadJson<Record<string, string>>(primaryKey);
  if (data) {
    cache.set(primaryKey, data);
    return data;
  }
  const fromRaw = await tryLoadScriptFromQulRaw({ tryLoadJson }, script);
  if (fromRaw) {
    cache.set(primaryKey, fromRaw);
    return fromRaw;
  }
  throw new Error(
    `Script data not available: ${script}. Add data/quran/${script}.json or a matching QUL word dump (see SCRIPT_QUL_RAW_IDS in quran-script-from-raw.ts), or run scripts/scrape_qul.py --resources quran-scripts.`,
  );
}

const WORDS_ARABIC_RESOLVED_CACHE_KEY = "resolved:words-arabic";
const ENRICHED_MORPH_RESOLVED_CACHE_KEY = "resolved:enriched-morphology";
const MORPH_SEARCH_INDEXES_CACHE_KEY = "resolved:morph-search-indexes";
const ENRICHED_MORPHOLOGY_PATH = "data/morphology/enriched_data.json";

async function readEnrichedMorphologyCorpus(): Promise<Record<string, { segments: MorphSegment[] }> | undefined> {
  assertSafeDataRelPath(ENRICHED_MORPHOLOGY_PATH);
  let raw: string | undefined;
  if (isRemoteData()) {
    raw = await tryReadDataTextFromRemote(ENRICHED_MORPHOLOGY_PATH);
  } else {
    try {
      assertLocalCorpusFilesystemAllowed();
      const abs = path.join(ROOT, ENRICHED_MORPHOLOGY_PATH);
      raw = await fs.readFile(abs, "utf-8");
    } catch (e) {
      if (isNotFoundError(e)) return undefined;
      throw e;
    }
  }
  if (raw === undefined) return undefined;
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed) || parsed.length === 0) return undefined;
  const corpus = buildCorpusFromEnriched(parsed as EnrichedMorphologyRow[]);
  return Object.keys(corpus).length > 0 ? corpus : undefined;
}

/**
 * Prefer `data/words/arabic.json` when present; otherwise build the word map from QUL
 * `data/quran/<id>-raw.json` (same uthmani resource ids as verse scripts — see `SCRIPT_QUL_RAW_IDS`).
 */
export async function loadWordsArabic(): Promise<Record<string, Omit<WordData, "key">>> {
  if (cache.has(WORDS_ARABIC_RESOLVED_CACHE_KEY)) {
    return cache.get(WORDS_ARABIC_RESOLVED_CACHE_KEY) as Record<string, Omit<WordData, "key">>;
  }
  const explicit = await tryLoadJson<Record<string, Omit<WordData, "key">>>("data/words/arabic.json");
  if (explicit && Object.keys(explicit).length > 0) {
    cache.set(WORDS_ARABIC_RESOLVED_CACHE_KEY, explicit);
    return explicit;
  }
  const fromRaw = await tryLoadWordsArabicFromQulRaw({ tryLoadJson });
  if (fromRaw && Object.keys(fromRaw).length > 0) {
    cache.set(WORDS_ARABIC_RESOLVED_CACHE_KEY, fromRaw);
    return fromRaw;
  }
  throw new Error(
    "Word-by-word Arabic data not available. Add data/words/arabic.json or QUL word-keyed dumps under data/quran/ " +
      "(e.g. uthmani *-raw.json per SCRIPT_QUL_RAW_IDS in quran-script-from-raw.ts). Run: python3 scripts/scrape_qul.py --resources quran-scripts",
  );
}

export const loadWordTranslation = (lang: string) => {
  assertSafeResourceSegment(lang, "word translation lang");
  return tryLoadJson<Record<string, string>>(`data/words/translations/${lang}.json`);
};

/**
 * Sub-word morphology from `data/morphology/enriched_data.json` (MASAQ + mustafa segment rows),
 * grouped at load time by `surah:ayah:word`.
 */
export async function loadCorpusMorphology(): Promise<Record<string, { segments: MorphSegment[] }>> {
  if (cache.has(ENRICHED_MORPH_RESOLVED_CACHE_KEY)) {
    return cache.get(ENRICHED_MORPH_RESOLVED_CACHE_KEY) as Record<string, { segments: MorphSegment[] }>;
  }
  const corpus = await readEnrichedMorphologyCorpus();
  if (!corpus) {
    throw new Error(
      "Morphology data not available. Add data/morphology/enriched_data.json (run: python3 scripts/sync_morphology.py).",
    );
  }
  cache.set(ENRICHED_MORPH_RESOLVED_CACHE_KEY, corpus);
  return corpus;
}

/**
 * Root / lemma word-key indexes derived from segment `root` and `lemma` in enriched morphology.
 * Undefined if `enriched_data.json` is missing (same requirement as `loadCorpusMorphology`).
 */
export async function loadMorphologySearchIndexes(): Promise<
  { byRoot: Record<string, string[]>; byLemma: Record<string, string[]> } | undefined
> {
  if (cache.has(MORPH_SEARCH_INDEXES_CACHE_KEY)) {
    return cache.get(MORPH_SEARCH_INDEXES_CACHE_KEY) as {
      byRoot: Record<string, string[]>;
      byLemma: Record<string, string[]>;
    };
  }
  try {
    const corpus = await loadCorpusMorphology();
    const built = buildMorphologySearchIndexesFromCorpus(corpus);
    cache.set(MORPH_SEARCH_INDEXES_CACHE_KEY, built);
    return built;
  } catch {
    return undefined;
  }
}

export const loadQulMorphology = () =>
  tryLoadJson<Record<string, QulMorphWord>>("data/morphology/qul.json");

/** Optional; omit file if you do not ship pause-mark metadata. */
export const loadPauseMarks = () => tryLoadJson<Record<string, string>>("data/morphology/pause-marks.json");

export const loadTranslation = (id: number | string) => {
  const seg = typeof id === "number" ? String(id) : id;
  assertSafeResourceSegment(seg, "translation id");
  return tryLoadJson<Record<string, TranslationEntry>>(`data/translations/${seg}.json`);
};

export const loadTranslationCatalog = () =>
  loadJson<TranslationCatalogEntry[]>("data/translations/index.json");

export const loadTafsirChapter = (id: number | string, surah: number) => {
  const idSeg = typeof id === "number" ? String(id) : id;
  assertSafeResourceSegment(idSeg, "tafsir id");
  assertTafsirSurahPathSegment(surah);
  return tryLoadJson<TafsirChapter>(`data/tafsirs/${idSeg}/${surah}.json`);
};

export const loadTafsirCatalog = () =>
  loadJson<TafsirCatalogEntry[]>("data/tafsirs/index.json");

export const loadRecitations = () =>
  loadJson<RecitationEntry[]>("data/audio/recitations.json");

// Each segment entry is [word_position, start_ms, duration_ms, end_ms?]
export const loadAudioSegments = (recitationId: number | string) => {
  const seg = typeof recitationId === "number" ? String(recitationId) : recitationId;
  assertSafeResourceSegment(seg, "recitation id");
  return tryLoadJson<Record<string, number[][]>>(`data/audio/segments/${seg}.json`);
};

export const loadTopics = () =>
  loadJson<Record<string, TopicEntry>>("data/topics/data.json");

export const loadMutashabihat = () =>
  tryLoadJson<MutashabihatPair[]>("data/mutashabihat/data.json");

export const loadMushafPages = () =>
  tryLoadJson<Record<string, MushafPage>>("data/mushaf/pages.json");

/** Structural index (Tanzil-shaped bundle) derived from QUL verse metadata. */
export const loadStructureMeta = async () => {
  const verseMeta = await loadVerseMeta();
  return buildStructureFromVerseMeta(verseMeta);
};

export const loadWordTranslationCatalog = () =>
  tryLoadJson<WordTranslationCatalogEntry[]>("data/words/translations/index.json");

export const loadTransliterationCatalog = () =>
  tryLoadJson<TransliterationCatalogEntry[]>("data/transliteration/index.json");

export const loadTransliteration = (lang: string) => {
  assertSafeResourceSegment(lang, "transliteration lang");
  return tryLoadJson<Record<string, string>>(`data/transliteration/${lang}.json`);
};

export const loadSurahInfoCatalog = () =>
  tryLoadJson<SurahInfoCatalogEntry[]>("data/surah-info/index.json");

export const loadSurahInfo = (lang: string) => {
  assertSafeResourceSegment(lang, "surah info lang");
  return tryLoadJson<Record<string, SurahInfo>>(`data/surah-info/${lang}.json`);
};

export const loadSimilarAyahs = () =>
  tryLoadJson<SimilarAyahPair[]>("data/similar-ayahs/data.json");

export const loadAyahThemes = () =>
  tryLoadJson<Record<string, string[]>>("data/ayah-themes/data.json");

// ---------------------------------------------------------------------------
// Fonts (data/fonts/<numeric-id>/)
// ---------------------------------------------------------------------------

const fontsRoot = () => path.join(ROOT, "data", "fonts");

/** Safe relative path under a font directory (POSIX segments, no traversal). */
export function assertSafeFontFilename(name: string): string | null {
  if (!name || name === "." || name === "..") return null;
  if (name.includes("\0") || name.includes("\\")) return null;
  const normalized = name.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  for (const p of parts) {
    if (p === "." || p === ".." || p.includes("/")) return null;
  }
  return normalized;
}

async function collectFontFilesLocal(fontId: string): Promise<string[]> {
  const base = path.join(fontsRoot(), fontId);
  const out: string[] = [];
  async function walk(current: string, relFromFont: string): Promise<void> {
    let ents: Dirent[];
    try {
      ents = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of ents) {
      const full = path.join(current, ent.name);
      const rel = relFromFont ? `${relFromFont}/${ent.name}` : ent.name;
      if (ent.isDirectory()) {
        await walk(full, rel);
      } else if (ent.isFile()) {
        if (full === path.join(base, "manifest.json")) continue;
        out.push(rel.split(path.sep).join("/"));
      }
    }
  }
  await walk(base, "");
  return out.sort();
}

export function fontMimeType(filename: string): string {
  const leaf = filename.includes("/") ? (filename.split("/").pop() ?? filename) : filename;
  const lower = leaf.toLowerCase();
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
  const rel = path.posix.join("data", "fonts", fontId, "manifest.json");
  try {
    let raw: string;
    if (isRemoteData()) {
      const got = await tryReadDataTextFromRemote(rel);
      if (got === undefined) return undefined;
      raw = got;
    } else {
      assertLocalCorpusFilesystemAllowed();
      raw = await fs.readFile(path.join(fontsRoot(), fontId, "manifest.json"), "utf-8");
    }
    return JSON.parse(raw) as FontManifest;
  } catch {
    return undefined;
  }
}

async function loadFontCatalog(): Promise<FontCatalogEntry[] | undefined> {
  return tryLoadJson<FontCatalogEntry[]>("data/fonts/catalog.json");
}

/** List font resource ids with file counts (from manifest or directory scan). */
export async function listFontResources(): Promise<FontListItem[]> {
  if (isRemoteData()) {
    const catalog = await loadFontCatalog();
    if (!catalog?.length) return [];
    return catalog
      .map((e) => ({
        id: e.id,
        file_count: e.files.length,
        detail_url: e.detail_url,
      }))
      .sort((a, b) => Number(a.id) - Number(b.id));
  }

  assertLocalCorpusFilesystemAllowed();
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
      files = await collectFontFilesLocal(id);
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

  if (isRemoteData()) {
    const manifest = await readFontManifestFile(fontId);
    const catalog = await loadFontCatalog();
    const entry = catalog?.find((e) => e.id === fontId);
    let files = manifest?.files?.filter(Boolean) ?? [];
    if (files.length === 0 && entry) {
      files = [...entry.files].sort();
    } else {
      files = [...files].sort();
    }
    if (!manifest && !entry) return null;
    return {
      id: fontId,
      detail_url: manifest?.detail_url ?? entry?.detail_url,
      files,
    };
  }

  assertLocalCorpusFilesystemAllowed();
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
    files = await collectFontFilesLocal(fontId);
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

  const rel = path.posix.join("data", "fonts", fontId, ...safeName.split("/"));

  if (isRemoteData()) {
    return readDataBufferFromRemote(rel);
  }

  assertLocalCorpusFilesystemAllowed();
  const dir = path.resolve(path.join(fontsRoot(), fontId));
  const full = path.resolve(path.join(dir, ...safeName.split("/")));
  if (!full.startsWith(dir + path.sep) && full !== dir) return null;

  try {
    const st = await fs.stat(full);
    if (!st.isFile()) return null;
    return await fs.readFile(full);
  } catch {
    return null;
  }
}
