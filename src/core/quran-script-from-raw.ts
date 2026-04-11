import type { WordData } from "./types.js";

type TryLoadJson = <T>(relPath: string) => Promise<T | undefined>;

/** Same set as `VALID_SCRIPTS` in loader (avoid importing loader → circular). */
type QuranScriptId = "uthmani" | "simple" | "indopak" | "tajweed" | "qpc-hafs";

export interface RawWordEntry {
  surah?: string;
  ayah?: string;
  word?: string;
  text?: string;
  code_v1?: string;
  code_v2?: string;
  page?: number;
  line?: number;
  char_type_name?: string;
}

/**
 * QUL quran-script resources save as `data/quran/<id>-raw.json` when the payload is word-keyed.
 * Ordered candidates (first hit wins). Extend if your scrape uses different ids.
 *
 * For `uthmani` we prefer `48` (QPC Hafs Uthmani — canonical: ~2555/2557 occurrences of U+0671
 * ALIF WASLA in "Allah", clean per-word text without stray end-of-ayah markers). Resource `565`
 * is kept only as a last-resort fallback because it ships IndoPak-shaped orthography (no wasla)
 * and bleeds end-of-ayah decoration (RLO bidi + U+08E2 ARABIC DISPUTED END OF AYAH + pause mark)
 * onto the previous word — see `cleanRawWordText` below for the defensive sanitizer.
 */
export const SCRIPT_QUL_RAW_IDS: Partial<Record<QuranScriptId, string[]>> = {
  uthmani: ["48", "56", "54", "59", "565"],
  simple: ["60", "53"],
  indopak: ["52"],
  tajweed: ["312", "55", "58"],
  "qpc-hafs": ["47", "61", "57"],
};

function isWordLocationKey(k: string): boolean {
  return /^\d+:\d+:\d+$/.test(k);
}

/**
 * Strip end-of-ayah decoration that some QUL word-text dumps splice onto the
 * previous word's tail. The two characters we never want inside a word body:
 *
 *   • U+202E RIGHT-TO-LEFT OVERRIDE — a bidi control with no orthographic role
 *     in Quranic text; QUL uses it to wrap ayah-end glyph clusters.
 *   • U+08E2 ARABIC DISPUTED END OF AYAH — a scholarly-dispute sentinel with
 *     no rendered glyph in any Quran font (Uthmani-Hafs, IndoPak, Nastaleeq,
 *     Noto Naskh, Amiri all lack it). Anything trailing it (Arabic-Indic
 *     digit, U+06D9/U+06DA/U+06DB pause mark) is part of the same cluster.
 *
 * Both occur exclusively as ayah-end decoration that should live on the
 * `type:end` sentinel word, not glued to the preceding lexical word.
 */
export function cleanRawWordText(text: string): string {
  if (!text) return text;
  let cut = text.length;
  const idxRlo = text.indexOf("\u202e");
  if (idxRlo !== -1) cut = Math.min(cut, idxRlo);
  const idx08e2 = text.indexOf("\u08e2");
  if (idx08e2 !== -1) cut = Math.min(cut, idx08e2);
  return (cut === text.length ? text : text.slice(0, cut)).trim();
}

/** Join per-word `text` into full ayah strings; drops image-URL “words”. */
export function aggregateAyahsFromWordRaw(raw: Record<string, RawWordEntry>): Record<string, string> {
  const groups = new Map<string, RawWordEntry[]>();
  for (const [key, w] of Object.entries(raw)) {
    if (!isWordLocationKey(key)) continue;
    const sur = w.surah;
    const ay = w.ayah;
    if (sur === undefined || ay === undefined) continue;
    const vk = `${sur}:${ay}`;
    let g = groups.get(vk);
    if (!g) {
      g = [];
      groups.set(vk, g);
    }
    g.push(w);
  }
  const out: Record<string, string> = {};
  for (const [vk, words] of groups) {
    words.sort((a, b) => Number(a.word) - Number(b.word));
    const parts = words
      .map((w) => (typeof w.text === "string" ? cleanRawWordText(w.text) : ""))
      .filter((t) => t.length > 0 && !t.startsWith("http"));
    out[vk] = parts.join(" ").trim();
  }
  return out;
}

export async function tryLoadScriptFromQulRaw(
  deps: { tryLoadJson: TryLoadJson },
  script: QuranScriptId,
): Promise<Record<string, string> | undefined> {
  const ids = SCRIPT_QUL_RAW_IDS[script];
  if (!ids?.length) return undefined;
  for (const id of ids) {
    const path = `data/quran/${id}-raw.json`;
    const raw = await deps.tryLoadJson<Record<string, RawWordEntry>>(path);
    if (!raw || Object.keys(raw).length === 0) continue;
    const verses = aggregateAyahsFromWordRaw(raw);
    if (Object.keys(verses).length > 0) return verses;
  }
  return undefined;
}

export type WordsArabicMap = Record<string, Omit<WordData, "key">>;

function qulRawRowToWordShape(key: string, row: RawWordEntry): WordsArabicMap[string] | null {
  if (!isWordLocationKey(key)) return null;
  const text = typeof row.text === "string" ? row.text : "";
  const trimmed = cleanRawWordText(text);
  if (!trimmed || trimmed.startsWith("http")) return null;
  let position = 1;
  if (row.word !== undefined) {
    const n = Number(row.word);
    if (Number.isFinite(n) && n >= 1) position = n;
  }
  const out: WordsArabicMap[string] = { text: trimmed, position };
  if (typeof row.code_v1 === "string" && row.code_v1) out.code_v1 = row.code_v1;
  if (typeof row.code_v2 === "string" && row.code_v2) out.code_v2 = row.code_v2;
  if (typeof row.page === "number" && Number.isFinite(row.page)) out.page = row.page;
  if (typeof row.line === "number" && Number.isFinite(row.line)) out.line = row.line;
  const t = row.char_type_name;
  if (typeof t === "string" && t) out.type = t;
  return out;
}

function buildWordsMapFromRaw(raw: Record<string, RawWordEntry>): WordsArabicMap {
  const out: WordsArabicMap = {};
  for (const [key, row] of Object.entries(raw)) {
    const shaped = qulRawRowToWordShape(key, row);
    if (shaped) out[key] = shaped;
  }
  return out;
}

/**
 * Load per-word Arabic (and optional glyphs/layout fields) from QUL `data/quran/<id>-raw.json`.
 * Uses the same uthmani resource id list as `tryLoadScriptFromQulRaw` so keys match `verse.meta.words_count`.
 * Optionally merges `text_indopak` from the indopak raw dump when the same `surah:ayah:word` exists there.
 */
export async function tryLoadWordsArabicFromQulRaw(deps: {
  tryLoadJson: TryLoadJson;
}): Promise<WordsArabicMap | undefined> {
  const uthmaniIds = SCRIPT_QUL_RAW_IDS.uthmani;
  if (!uthmaniIds?.length) return undefined;

  let base: Record<string, RawWordEntry> | undefined;
  for (const id of uthmaniIds) {
    const p = `data/quran/${id}-raw.json`;
    const raw = await deps.tryLoadJson<Record<string, RawWordEntry>>(p);
    if (raw && Object.keys(raw).length > 0) {
      base = raw;
      break;
    }
  }
  if (!base) return undefined;

  const map = buildWordsMapFromRaw(base);
  if (Object.keys(map).length === 0) return undefined;

  const indopakIds = SCRIPT_QUL_RAW_IDS.indopak;
  if (!indopakIds?.length) return map;

  let indoRaw: Record<string, RawWordEntry> | undefined;
  for (const id of indopakIds) {
    const p = `data/quran/${id}-raw.json`;
    const raw = await deps.tryLoadJson<Record<string, RawWordEntry>>(p);
    if (raw && Object.keys(raw).length > 0) {
      indoRaw = raw;
      break;
    }
  }
  if (!indoRaw) return map;

  for (const key of Object.keys(map)) {
    const alt = indoRaw[key];
    const t = alt && typeof alt.text === "string" ? cleanRawWordText(alt.text) : "";
    if (t) map[key] = { ...map[key], text_indopak: t };
  }
  return map;
}
