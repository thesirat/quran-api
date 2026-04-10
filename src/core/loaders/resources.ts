import type { Dirent } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { loadJson, tryLoadJson } from "../data-cache.js";
import {
  ROOT,
  assertSafeResourceSegment,
  assertTafsirSurahPathSegment,
  isRemoteData,
  assertLocalCorpusFilesystemAllowed,
  tryReadDataTextFromRemote,
  readDataBufferFromRemote,
} from "../data-io.js";
import { loadVerseMeta, WORD_TRANSLATION_LANG_ALIASES } from "./quran.js";
import { buildStructureFromVerseMeta } from "../structure-from-verses.js";
import type {
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
} from "../types.js";

// ---------------------------------------------------------------------------
// Translations
// ---------------------------------------------------------------------------

interface RawTranslationEntry {
  t?: string;
  text?: string;
  f?: Record<string, string>;
  footnotes?: { id: number; text: string }[];
}

function normalizeTranslation(raw: Record<string, RawTranslationEntry>): Record<string, TranslationEntry> {
  const out: Record<string, TranslationEntry> = {};
  for (const [key, v] of Object.entries(raw)) {
    if (!v || typeof v !== "object") continue;
    const text = v.text ?? v.t ?? "";
    const entry: TranslationEntry = { text };
    if (v.footnotes) {
      entry.footnotes = v.footnotes;
    } else if (v.f) {
      entry.footnotes = Object.entries(v.f).map(([id, ft]) => ({ id: Number(id), text: ft }));
    }
    out[key] = entry;
  }
  return out;
}

export const loadTranslation = async (id: number | string): Promise<Record<string, TranslationEntry> | null> => {
  const seg = typeof id === "number" ? String(id) : id;
  assertSafeResourceSegment(seg, "translation id");
  const raw = await tryLoadJson<Record<string, RawTranslationEntry>>(`data/translations/${seg}.json`);
  return raw ? normalizeTranslation(raw) : null;
};

export const loadTranslationCatalog = async (): Promise<TranslationCatalogEntry[]> => {
  const fromIndex = await tryLoadJson<TranslationCatalogEntry[]>("data/translations/index.json");
  if (fromIndex) return fromIndex;
  if (isRemoteData()) return [];
  const dir = path.join(ROOT, "data/translations");
  let entries: Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".json") && e.name !== "index.json")
    .map((e) => {
      const stem = e.name.replace(/\.json$/, "");
      const num = Number(stem);
      return { id: Number.isFinite(num) ? num : 0, name: stem, language: "unknown" };
    })
    .sort((a, b) => a.id - b.id);
};

// ---------------------------------------------------------------------------
// Tafsirs
// ---------------------------------------------------------------------------

export const loadTafsirChapter = (id: number | string, surah: number) => {
  const idSeg = typeof id === "number" ? String(id) : id;
  assertSafeResourceSegment(idSeg, "tafsir id");
  assertTafsirSurahPathSegment(surah);
  return tryLoadJson<TafsirChapter>(`data/tafsirs/${idSeg}/${surah}.json`);
};

export const loadTafsirCatalog = async (): Promise<TafsirCatalogEntry[]> => {
  const fromIndex = await tryLoadJson<TafsirCatalogEntry[]>("data/tafsirs/index.json");
  if (fromIndex) return fromIndex;
  if (isRemoteData()) return [];
  const dir = path.join(ROOT, "data/tafsirs");
  let entries: Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isDirectory() && /^\d+$/.test(e.name))
    .map((e) => ({ id: Number(e.name), name: e.name, language: "unknown" }))
    .sort((a, b) => a.id - b.id);
};

// ---------------------------------------------------------------------------
// Audio / Recitations
// ---------------------------------------------------------------------------

export const loadRecitations = async (): Promise<RecitationEntry[]> => {
  const fromFile = await tryLoadJson<RecitationEntry[]>("data/audio/recitations.json");
  if (fromFile) return fromFile;
  if (isRemoteData()) return [];
  const dir = path.join(ROOT, "data/recitations");
  let entries: Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const catalog: RecitationEntry[] = [];
  for (const e of entries) {
    if (!e.isDirectory() || !/^\d+$/.test(e.name)) continue;
    const id = Number(e.name);
    let reciter: string | undefined;
    let hasSegments = false;
    try {
      const files = await fs.readdir(path.join(dir, e.name));
      const jsonFile = files.find((f) => f.endsWith(".json"));
      if (jsonFile) {
        reciter = jsonFile
          .replace(/\.json$/, "")
          .replace(/^ayah-recitation-/, "")
          .replace(/-/g, " ");
        const sample = await tryLoadJson<Record<string, { segments?: unknown[] }>>(
          `data/recitations/${e.name}/${jsonFile}`
        );
        if (sample) {
          const first = Object.values(sample)[0];
          hasSegments = Array.isArray(first?.segments) && first.segments.length > 0;
        }
      }
    } catch { /* ignore */ }
    catalog.push({ id, reciter, name: reciter, segments_count: hasSegments ? 1 : 0 });
  }
  return catalog.sort((a, b) => a.id - b.id);
};

export const loadAudioSegments = async (recitationId: number | string) => {
  const seg = typeof recitationId === "number" ? String(recitationId) : recitationId;
  assertSafeResourceSegment(seg, "recitation id");
  const fromAudio = await tryLoadJson<Record<string, number[][]>>(`data/audio/segments/${seg}.json`);
  if (fromAudio) return fromAudio;
  if (isRemoteData()) return undefined;
  const dir = path.join(ROOT, "data/recitations", seg);
  let files: string[];
  try {
    files = await fs.readdir(dir);
  } catch {
    return undefined;
  }
  const jsonFile = files.find((f) => f.endsWith(".json"));
  if (!jsonFile) return undefined;
  const data = await tryLoadJson<Record<string, { segments?: number[][] }>>(
    `data/recitations/${seg}/${jsonFile}`
  );
  if (!data) return undefined;
  const result: Record<string, number[][]> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val.segments) result[key] = val.segments;
  }
  return Object.keys(result).length > 0 ? result : undefined;
};

// ---------------------------------------------------------------------------
// Topics, Mutashabihat, Similar Ayahs, Themes
// ---------------------------------------------------------------------------

export const loadTopics = () =>
  loadJson<Record<string, TopicEntry>>("data/topics/data.json");

export const loadMutashabihat = async (): Promise<MutashabihatPair[] | undefined> => {
  const prebuilt = await tryLoadJson<MutashabihatPair[]>("data/mutashabihat/data.json");
  if (prebuilt) return prebuilt;

  let phrasesRelPath: string | undefined;
  if (isRemoteData()) {
    const candidate = "data/mutashabihat/73/phrases.json";
    const data = await tryLoadJson<Record<string, PhrasesEntry>>(candidate);
    if (data) return phrasesToPairs(data);
    return undefined;
  }
  const dir = path.join(ROOT, "data/mutashabihat");
  let entries: Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return undefined;
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      phrasesRelPath = `data/mutashabihat/${e.name}/phrases.json`;
      break;
    }
  }
  if (!phrasesRelPath) return undefined;
  const raw = await tryLoadJson<Record<string, PhrasesEntry>>(phrasesRelPath);
  if (!raw) return undefined;
  return phrasesToPairs(raw);
};

interface PhrasesEntry {
  source: { key: string; from: number; to: number };
  ayah: Record<string, number[][]>;
  count?: number;
}

function phrasesToPairs(phrases: Record<string, PhrasesEntry>): MutashabihatPair[] {
  const pairs: MutashabihatPair[] = [];
  for (const entry of Object.values(phrases)) {
    const src = entry.source?.key;
    if (!src || !entry.ayah) continue;
    for (const [matchedKey, positions] of Object.entries(entry.ayah)) {
      if (matchedKey === src) continue;
      pairs.push({
        verse_key: src,
        matched_key: matchedKey,
        matched_word_positions: positions[0],
      });
    }
  }
  return pairs;
}

export const loadMushafPages = () =>
  tryLoadJson<Record<string, MushafPage>>("data/mushaf/pages.json");

/** Structural index (Tanzil-shaped bundle) derived from QUL verse metadata. */
export const loadStructureMeta = async () => {
  const verseMeta = await loadVerseMeta();
  return buildStructureFromVerseMeta(verseMeta);
};

export const loadSimilarAyahs = () =>
  tryLoadJson<SimilarAyahPair[]>("data/similar-ayahs/data.json");

export const loadAyahThemes = () =>
  tryLoadJson<Record<string, string[]>>("data/ayah-themes/data.json");

// ---------------------------------------------------------------------------
// Word translations, Transliterations, Surah info
// ---------------------------------------------------------------------------

/**
 * Build the word-by-word translation catalog. Prefers
 * ``data/words/translations/index.json`` (written by the scraper); otherwise
 * falls back to a local directory scan. ISO aliases are appended for every
 * canonical language present on disk so clients can use short codes (``en``,
 * ``ur``, …) interchangeably with full names.
 */
export const loadWordTranslationCatalog = async (): Promise<WordTranslationCatalogEntry[]> => {
  let base = await tryLoadJson<WordTranslationCatalogEntry[]>("data/words/translations/index.json");
  if (!base) {
    if (isRemoteData()) {
      base = [];
    } else {
      const dir = path.join(ROOT, "data/words/translations");
      let entries: Dirent[];
      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch {
        return [];
      }
      base = entries
        .filter((e) => e.isFile() && e.name.endsWith(".json") && e.name !== "index.json")
        .map((e, i) => ({
          lang: e.name.replace(/\.json$/, ""),
          id: i + 1,
          name: e.name.replace(/\.json$/, ""),
          direction: "ltr" as const,
        }))
        .sort((a, b) => a.lang.localeCompare(b.lang));
    }
  }

  // Append ISO-alias rows for every canonical lang we actually have a file for.
  const present = new Set(base.map((e) => e.lang.toLowerCase()));
  const aliasRows: WordTranslationCatalogEntry[] = [];
  for (const [iso, canonical] of Object.entries(WORD_TRANSLATION_LANG_ALIASES)) {
    if (!present.has(canonical)) continue;
    if (present.has(iso)) continue;
    aliasRows.push({ lang: iso, id: 0, name: `alias → ${canonical}`, direction: "ltr" });
  }
  return [...base, ...aliasRows];
};

/**
 * Language → filename stem aliases for verse-level transliterations.
 * Files live at ``data/transliteration/<stem>.json``.
 *
 * Only short ISO codes and human-friendly aliases need to be registered here;
 * any scraped file stem is automatically discoverable via the fuzzy fallback
 * in {@link loadTransliteration}.
 */
const VERSE_TRANSLITERATION_ALIASES: Record<string, string> = {
  // English (multiple renderings)
  en: "english_transliterationtajweed",
  "en-clean": "english_transliterationtajweed",
  "en-tajweed": "english_transliterationtajweed",
  english: "english_transliterationtajweed",
  "english-tajweed": "english_transliterationtajweed",
  "en-rtf": "english_transliterationrtf_updated",
  "english-rtf": "english_transliterationrtf_updated",
  "en-syllables": "syllables_transliteration",
  "english-syllables": "syllables_transliteration",
  syllables: "syllables_transliteration",
  // Turkish
  tr: "turkish_transliteration",
  turkish: "turkish_transliteration",
  // Generic fallback — `transliteration.json` at the root of the resource dir.
  default: "transliteration",
};

/** Language → filename stem aliases for word-by-word transliterations. */
const WORD_TRANSLITERATION_ALIASES: Record<string, string> = {
  en: "english_wbw_transliteration",
  english: "english_wbw_transliteration",
  "en-wbw": "english_wbw_transliteration",
  "english-wbw": "english_wbw_transliteration",
};

function resolveTransliterationStem(lang: string): string {
  // Case-insensitive alias lookup; fallback to the raw lang string.
  const key = lang.toLowerCase();
  return VERSE_TRANSLITERATION_ALIASES[key] ?? lang;
}

function resolveWordTransliterationStem(lang: string): string | undefined {
  return WORD_TRANSLITERATION_ALIASES[lang.toLowerCase()];
}

/** Normalize a transliteration file to `{verseKey: string}`. Accepts either `string` or `{t: string}` shapes. */
function normalizeVerseTransliteration(
  raw: Record<string, string | { t?: string; text?: string }>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") out[k] = v;
    else if (v && typeof v === "object") out[k] = v.text ?? v.t ?? "";
  }
  return out;
}

/**
 * Cache of available transliteration filenames. In local mode this is populated
 * by a one-shot directory scan; in remote mode it falls back to
 * ``data/transliteration/index.json`` entries.
 */
let _transliterationDirListingCache: string[] | undefined;

async function listTransliterationStems(): Promise<string[]> {
  if (_transliterationDirListingCache) return _transliterationDirListingCache;
  if (isRemoteData()) {
    const idx = await tryLoadJson<Array<{ lang?: string; name?: string }>>("data/transliteration/index.json");
    if (idx) {
      const stems = new Set<string>();
      for (const row of idx) {
        if (typeof row.name === "string") stems.add(row.name);
        if (typeof row.lang === "string") stems.add(row.lang);
      }
      _transliterationDirListingCache = [...stems];
    } else {
      _transliterationDirListingCache = [];
    }
    return _transliterationDirListingCache;
  }
  try {
    const dir = path.join(ROOT, "data/transliteration");
    const entries = await fs.readdir(dir, { withFileTypes: true });
    _transliterationDirListingCache = entries
      .filter((e) => e.isFile() && e.name.endsWith(".json") && e.name !== "index.json")
      .map((e) => e.name.replace(/\.json$/, ""));
  } catch {
    _transliterationDirListingCache = [];
  }
  return _transliterationDirListingCache;
}

/** Heuristic: does a filename stem look like word-by-word transliteration data? */
function stemLooksLikeWord(stem: string): boolean {
  const s = stem.toLowerCase();
  return s.includes("wbw") || s.includes("word_by_word") || s.includes("word-by-word") || s.includes("_wbw_");
}

export const loadTransliterationCatalog = async (): Promise<TransliterationCatalogEntry[]> => {
  const fromIndex = await tryLoadJson<TransliterationCatalogEntry[]>("data/transliteration/index.json");
  if (fromIndex) return fromIndex;

  // Prefer a live filesystem scan so every scraped file is discoverable — not
  // just the hand-coded aliases. ``name`` (file stem) is the durable handle;
  // ``lang`` is also set to the stem so existing clients keep working.
  const entries: TransliterationCatalogEntry[] = [];
  const seen = new Set<string>();
  const stems = await listTransliterationStems();
  for (const stem of stems) {
    if (seen.has(stem)) continue;
    seen.add(stem);
    entries.push({
      lang: stem,
      name: stem,
      type: stemLooksLikeWord(stem) ? "word" : "ayah",
    });
  }
  // Append ISO-code aliases so discoverable short codes also show up.
  for (const [lang, stem] of Object.entries(VERSE_TRANSLITERATION_ALIASES)) {
    if (seen.has(lang)) continue;
    seen.add(lang);
    entries.push({ lang, name: stem, type: "ayah" });
  }
  for (const [lang, stem] of Object.entries(WORD_TRANSLITERATION_ALIASES)) {
    const key = `word:${lang}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({ lang, name: stem, type: "word" });
  }
  return entries;
};

/**
 * Load verse-level transliteration. Resolution order:
 *   1. Aliased stem from {@link VERSE_TRANSLITERATION_ALIASES}.
 *   2. Raw input lowercased (supports passing a file stem directly).
 *   3. Substring match against the filesystem listing so unlisted scraped
 *      languages still resolve (e.g. ``?lang=russian`` → ``russian_transliteration.json``).
 */
export const loadTransliteration = async (lang: string): Promise<Record<string, string> | undefined> => {
  const lower = lang.toLowerCase();
  const stems: string[] = [];
  const seen = new Set<string>();
  const push = (s: string | undefined): void => {
    if (!s || seen.has(s)) return;
    seen.add(s);
    stems.push(s);
  };
  push(resolveTransliterationStem(lang));
  push(lower);

  for (const stem of stems) {
    assertSafeResourceSegment(stem, "transliteration lang");
    const raw = await tryLoadJson<Record<string, string | { t?: string; text?: string }>>(
      `data/transliteration/${stem}.json`,
    );
    if (raw) return normalizeVerseTransliteration(raw);
  }

  // Fuzzy fallback: scan for a file whose stem contains the language and is
  // NOT a word-by-word variant.
  const available = await listTransliterationStems();
  const ayahCandidates = available.filter((s) => !stemLooksLikeWord(s));
  const hit =
    ayahCandidates.find((s) => s === lower) ??
    ayahCandidates.find((s) => s.startsWith(`${lower}_`) || s.startsWith(`${lower}-`)) ??
    ayahCandidates.find((s) => s.includes(lower));
  if (!hit) return undefined;
  assertSafeResourceSegment(hit, "transliteration lang");
  const raw = await tryLoadJson<Record<string, string | { t?: string; text?: string }>>(
    `data/transliteration/${hit}.json`,
  );
  return raw ? normalizeVerseTransliteration(raw) : undefined;
};

/**
 * Load word-by-word transliteration map (`surah:ayah:word` → text) for a given lang.
 * Resolution mirrors {@link loadTransliteration} but restricts to stems that look
 * like word-by-word data.
 */
export const loadWordTransliteration = async (lang: string): Promise<Record<string, string> | undefined> => {
  const lower = lang.toLowerCase();
  const aliased = resolveWordTransliterationStem(lang);

  const stems: string[] = [];
  const seen = new Set<string>();
  const push = (s: string | undefined): void => {
    if (!s || seen.has(s)) return;
    seen.add(s);
    stems.push(s);
  };
  push(aliased);
  if (stemLooksLikeWord(lower)) push(lower);

  for (const stem of stems) {
    assertSafeResourceSegment(stem, "word transliteration lang");
    const raw = await tryLoadJson<Record<string, string>>(`data/transliteration/${stem}.json`);
    if (raw) return raw;
  }

  const available = await listTransliterationStems();
  const wbw = available.filter(stemLooksLikeWord);
  const hit = wbw.find((s) => s.includes(lower));
  if (!hit) return undefined;
  assertSafeResourceSegment(hit, "word transliteration lang");
  return tryLoadJson<Record<string, string>>(`data/transliteration/${hit}.json`);
};

export const loadSurahInfoCatalog = () =>
  tryLoadJson<SurahInfoCatalogEntry[]>("data/surah-info/index.json");

export const loadSurahInfo = (lang: string) => {
  assertSafeResourceSegment(lang, "surah info lang");
  return tryLoadJson<Record<string, SurahInfo>>(`data/surah-info/${lang}.json`);
};

// ---------------------------------------------------------------------------
// Fonts
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
