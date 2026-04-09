import { cache, loadJson, tryLoadJson, tryLoadJsonLazy } from "../data-cache.js";
import { assertSafeResourceSegment } from "../data-io.js";
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

export const loadWordTranslation = (lang: string) => {
  assertSafeResourceSegment(lang, "word translation lang");
  return tryLoadJson<Record<string, string>>(`data/words/translations/${lang}.json`);
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
