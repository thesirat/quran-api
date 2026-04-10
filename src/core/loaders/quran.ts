import fs from "node:fs/promises";
import path from "node:path";
import { cache, loadJson, tryLoadJson, tryLoadJsonLazy } from "../data-cache.js";
import { ROOT, assertSafeResourceSegment, isRemoteData } from "../data-io.js";
import { getDataReader } from "../upstream/index.js";
import { buildCorpusFromEnriched } from "../morphology-from-enriched.js";
import type { EnrichedMorphologyRow } from "../morphology-from-enriched.js";
import { buildMorphologySearchIndexesFromCorpus } from "../morphology-search-indexes.js";
import { assembleVerseMetaFromMetadata } from "../verse-meta-assembled.js";
import { tryLoadScriptFromQulRaw, tryLoadWordsArabicFromQulRaw } from "../quran-script-from-raw.js";
import type { VerseMeta, WordData, MorphSegment, QulMorphWord } from "../types.js";

// ---------------------------------------------------------------------------
// Verse metadata
// ---------------------------------------------------------------------------

const VERSE_META_CACHE_KEY = "data/verses/meta.json";

/**
 * Prefer `data/verses/meta.json` when present; otherwise assemble from QUL `data/metadata/*.json`,
 * mushaf layout word ids, and any `data/quran/*-raw.json`.
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

// ---------------------------------------------------------------------------
// Script (verse texts)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Words (Arabic)
// ---------------------------------------------------------------------------

const WORDS_ARABIC_RESOLVED_CACHE_KEY = "resolved:words-arabic";
const WORDS_ARABIC_PATH = "data/words/arabic.json";

/**
 * Prefer `data/words/arabic.json` (lazy-parsed via simdjson for per-key extraction);
 * otherwise build the word map from QUL raw.
 */
export async function loadWordsArabic(): Promise<Record<string, Omit<WordData, "key">>> {
  if (cache.has(WORDS_ARABIC_RESOLVED_CACHE_KEY)) {
    return cache.get(WORDS_ARABIC_RESOLVED_CACHE_KEY) as Record<string, Omit<WordData, "key">>;
  }
  // Use lazy parsing so only accessed keys are deserialized (77k+ entries).
  const lazy = await tryLoadJsonLazy<Record<string, Omit<WordData, "key">>>(WORDS_ARABIC_PATH);
  if (lazy) {
    cache.set(WORDS_ARABIC_RESOLVED_CACHE_KEY, lazy);
    return lazy;
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

/**
 * ISO-639-1 short code → scraped-stem canonical filename aliases for
 * word-by-word translations. Files live at ``data/words/translations/<stem>.json``.
 *
 * The scraper slugifies QUL's language chip to lowercase with underscores
 * (e.g. "English" → "english", "Bahasa Indonesia" → "bahasa_indonesia").
 * Multiple aliases can point at the same canonical stem (``fa``/``farsi`` →
 * ``persian``). Unknown codes fall through to the raw input, so any canonical
 * stem written to disk is automatically reachable without registering an alias.
 *
 * Exported so ``loaders/resources.ts`` can synthesize catalog rows in sync.
 */
export const WORD_TRANSLATION_LANG_ALIASES: Record<string, string> = {
  // Primary ISO-639-1 short codes commonly supplied on QUL.
  en: "english",
  ur: "urdu",
  id: "indonesian",
  bn: "bengali",
  ta: "tamil",
  tr: "turkish",
  fa: "persian",
  farsi: "persian",
  ru: "russian",
  fr: "french",
  de: "german",
  es: "spanish",
  it: "italian",
  ms: "malay",
  hi: "hindi",
  pt: "portuguese",
  zh: "chinese",
  ja: "japanese",
  ko: "korean",
  nl: "dutch",
  pl: "polish",
  cs: "czech",
  sv: "swedish",
  no: "norwegian",
  da: "danish",
  fi: "finnish",
  el: "greek",
  he: "hebrew",
  hu: "hungarian",
  ro: "romanian",
  uk: "ukrainian",
  bg: "bulgarian",
  sr: "serbian",
  hr: "croatian",
  bs: "bosnian",
  sq: "albanian",
  mk: "macedonian",
  sl: "slovenian",
  sk: "slovak",
  az: "azerbaijani",
  kk: "kazakh",
  ky: "kyrgyz",
  uz: "uzbek",
  tg: "tajik",
  ug: "uyghur",
  ps: "pashto",
  ku: "kurdish",
  sd: "sindhi",
  pa: "punjabi",
  mr: "marathi",
  gu: "gujarati",
  te: "telugu",
  ml: "malayalam",
  kn: "kannada",
  si: "sinhala",
  ne: "nepali",
  dv: "dhivehi",
  my: "burmese",
  km: "khmer",
  lo: "lao",
  th: "thai",
  vi: "vietnamese",
  tl: "tagalog",
  sw: "swahili",
  ha: "hausa",
  yo: "yoruba",
  am: "amharic",
  so: "somali",
  af: "afrikaans",
  mg: "malagasy",
  mn: "mongolian",
  bo: "tibetan",
  hy: "armenian",
  ka: "georgian",
  is: "icelandic",
  mt: "maltese",
  et: "estonian",
  lt: "lithuanian",
  lv: "latvian",
  be: "belarusian",
  // Convenience long-form aliases so ``?lang=bahasa`` etc. still resolve.
  indo: "indonesian",
  bahasa: "indonesian",
  malaysian: "malay",
  chinese_simplified: "chinese",
  "zh-cn": "chinese",
  "zh-tw": "chinese",
};

export function resolveWordTranslationStem(lang: string): string {
  const key = lang.toLowerCase();
  return WORD_TRANSLATION_LANG_ALIASES[key] ?? key;
}

/**
 * Local-mode cache of available word-translation stems so directory scans only
 * happen once per cold start.
 */
let _wordTranslationDirListingCache: string[] | undefined;

async function listWordTranslationStems(): Promise<string[]> {
  if (_wordTranslationDirListingCache) return _wordTranslationDirListingCache;
  if (isRemoteData()) {
    // Remote mode: rely on the scraper-written index.json (no HTTP directory listing).
    const idx = await tryLoadJson<Array<{ lang?: string }>>("data/words/translations/index.json");
    _wordTranslationDirListingCache = idx
      ? idx.map((e) => e.lang).filter((l): l is string => typeof l === "string")
      : [];
    return _wordTranslationDirListingCache;
  }
  try {
    const dir = path.join(ROOT, "data/words/translations");
    const entries = await fs.readdir(dir, { withFileTypes: true });
    _wordTranslationDirListingCache = entries
      .filter((e) => e.isFile() && e.name.endsWith(".json") && e.name !== "index.json")
      .map((e) => e.name.replace(/\.json$/, ""));
  } catch {
    _wordTranslationDirListingCache = [];
  }
  return _wordTranslationDirListingCache;
}

function normalizeWordTranslationMap(
  raw: Record<string, string | { t?: string; text?: string }>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") out[k] = v;
    else if (v && typeof v === "object") {
      const t = v.text ?? v.t;
      if (typeof t === "string") out[k] = t;
    }
  }
  return out;
}

/**
 * Load word-by-word translations keyed by `surah:ayah:word`. Accepts ISO codes
 * (``en``, ``ur``…) via {@link WORD_TRANSLATION_LANG_ALIASES}, and normalizes
 * both `{wk: string}` and `{wk: {t: string}}` on-disk shapes to plain strings.
 *
 * Resolution order (first hit wins):
 *   1. Aliased stem from {@link WORD_TRANSLATION_LANG_ALIASES}.
 *   2. Raw input, lowercased.
 *   3. Slugified input (hyphens → underscores).
 *   4. Fuzzy match against actual files on disk (or scraper index) whose name
 *      starts with or contains the alias target — tolerates naming variance
 *      like ``bahasa_indonesia`` vs ``indonesian``.
 */
export const loadWordTranslation = async (lang: string): Promise<Record<string, string> | undefined> => {
  const raw = lang.toLowerCase();
  const aliasStem = resolveWordTranslationStem(lang);
  const slugified = raw.replace(/-/g, "_");

  const candidates: string[] = [];
  const seen = new Set<string>();
  for (const s of [aliasStem, raw, slugified]) {
    if (!s || seen.has(s)) continue;
    seen.add(s);
    candidates.push(s);
  }

  for (const stem of candidates) {
    assertSafeResourceSegment(stem, "word translation lang");
    const data = await tryLoadJson<Record<string, string | { t?: string; text?: string }>>(
      `data/words/translations/${stem}.json`,
    );
    if (data) return normalizeWordTranslationMap(data);
  }

  // Fuzzy fallback: scan available stems for the best substring match.
  const available = await listWordTranslationStems();
  if (available.length === 0) return undefined;
  const targets = new Set(candidates);
  const hit =
    available.find((s) => targets.has(s)) ??
    available.find((s) => s.includes(aliasStem) || aliasStem.includes(s)) ??
    available.find((s) => s.includes(raw) || raw.includes(s));
  if (!hit) return undefined;
  assertSafeResourceSegment(hit, "word translation lang");
  const data = await tryLoadJson<Record<string, string | { t?: string; text?: string }>>(
    `data/words/translations/${hit}.json`,
  );
  return data ? normalizeWordTranslationMap(data) : undefined;
};

// ---------------------------------------------------------------------------
// Morphology
// ---------------------------------------------------------------------------

const ENRICHED_MORPH_RESOLVED_CACHE_KEY = "resolved:enriched-morphology";
const MORPH_SEARCH_INDEXES_CACHE_KEY = "resolved:morph-search-indexes";
const ENRICHED_MORPHOLOGY_PATH = "data/morphology/enriched_data.json";

async function readEnrichedMorphologyCorpus(): Promise<Record<string, { segments: MorphSegment[] }> | undefined> {
  const raw = await getDataReader().tryReadText(ENRICHED_MORPHOLOGY_PATH);
  if (raw === undefined) return undefined;
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed) || parsed.length === 0) return undefined;
  const corpus = buildCorpusFromEnriched(parsed as EnrichedMorphologyRow[]);
  return Object.keys(corpus).length > 0 ? corpus : undefined;
}

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
