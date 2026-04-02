import type { VerseMeta } from "./types.js";

/** KFGQPC v4 print layout: word ids align with QUL corpus word ids in `data/quran/*-raw.json`. */
export const DEFAULT_MUSHAF_LAYOUT_PATH = "data/mushaf-layout/kfgqpc_v4_layout_1441h_print.json";

type LoadJson = <T>(relPath: string) => Promise<T>;
type TryLoadJson = <T>(relPath: string) => Promise<T | undefined>;

interface AyahRow {
  verse_key?: string;
  words_count?: number;
}

interface MappedBucket {
  verse_mapping?: Record<string, string>;
  juz_number?: number;
  hizb_number?: number;
  rub_number?: number;
  ruku_number?: number;
  manzil_number?: number;
}

interface SajdaRow {
  verse_key?: string;
  sajda_type?: string;
}

interface LayoutLine {
  page_number?: number;
  line_type?: string;
  first_word_id?: number | string;
  last_word_id?: number | string;
}

interface RawWordEntry {
  id?: number;
  surah?: string;
  ayah?: string;
  word?: string;
  text?: string;
}

function expandSurahRanges(surah: number, spec: string): string[] {
  const s = spec.trim();
  if (!s) return [];
  const keys: string[] = [];
  for (const part of s.split(",")) {
    const p = part.trim();
    if (!p) continue;
    if (p.includes("-")) {
      const [lo, hi] = p.split("-").map((x) => Number(x.trim()));
      if (!Number.isFinite(lo) || !Number.isFinite(hi)) continue;
      for (let a = lo; a <= hi; a++) keys.push(`${surah}:${a}`);
    } else {
      const n = Number(p);
      if (Number.isFinite(n)) keys.push(`${surah}:${n}`);
    }
  }
  return keys;
}

function applyBucket(
  file: Record<string, MappedBucket>,
  pick: (row: MappedBucket) => number | undefined,
  target: Record<string, VerseMeta>,
  assign: (m: VerseMeta, n: number) => void,
): void {
  for (const row of Object.values(file)) {
    const n = pick(row);
    if (n === undefined || !row.verse_mapping) continue;
    for (const [sk, ranges] of Object.entries(row.verse_mapping)) {
      const surah = Number(sk);
      if (!Number.isFinite(surah)) continue;
      for (const key of expandSurahRanges(surah, ranges)) {
        if (!target[key]) continue;
        assign(target[key], n);
      }
    }
  }
}

function buildWordIdToPage(layout: LayoutLine[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const line of layout) {
    if (line.line_type !== "ayah") continue;
    const lo = line.first_word_id;
    const hi = line.last_word_id;
    const page = line.page_number;
    if (typeof lo !== "number" || typeof hi !== "number" || typeof page !== "number") continue;
    for (let id = lo; id <= hi; id++) map.set(id, page);
  }
  return map;
}

function verseFirstWordIds(raw: Record<string, RawWordEntry>): Map<string, number> {
  const minId = new Map<string, number>();
  for (const w of Object.values(raw)) {
    const sur = w.surah;
    const ay = w.ayah;
    const id = w.id;
    if (sur === undefined || ay === undefined || typeof id !== "number") continue;
    const vk = `${sur}:${ay}`;
    const cur = minId.get(vk);
    if (cur === undefined || id < cur) minId.set(vk, id);
  }
  return minId;
}

const WORD_ID_RAW_CANDIDATES = [
  "data/quran/47-raw.json",
  "data/quran/48-raw.json",
  "data/quran/52-raw.json",
  "data/quran/565-raw.json",
];

/**
 * Build per-verse metadata from scraped QUL buckets under `data/metadata/` plus mushaf layout + any word-level raw JSON.
 * Used when `data/verses/meta.json` is absent (e.g. remote corpus on GitHub raw).
 */
export async function assembleVerseMetaFromMetadata(
  deps: { tryLoadJson: TryLoadJson; loadJson: LoadJson },
  layoutPath: string = DEFAULT_MUSHAF_LAYOUT_PATH,
): Promise<Record<string, VerseMeta>> {
  const ayahFile = await deps.tryLoadJson<Record<string, AyahRow>>("data/metadata/ayah.json");
  if (!ayahFile) {
    throw new Error(
      "Cannot assemble verse meta: missing data/metadata/ayah.json. Add QUL quran-metadata scrape or provide data/verses/meta.json.",
    );
  }

  const juz = await deps.tryLoadJson<Record<string, MappedBucket>>("data/metadata/juz.json");
  const hizb = await deps.tryLoadJson<Record<string, MappedBucket>>("data/metadata/hizb.json");
  const rub = await deps.tryLoadJson<Record<string, MappedBucket>>("data/metadata/rub.json");
  const ruku = await deps.tryLoadJson<Record<string, MappedBucket>>("data/metadata/ruku.json");
  const manzil = await deps.tryLoadJson<Record<string, MappedBucket>>("data/metadata/manzil.json");
  const sajda = await deps.tryLoadJson<Record<string, SajdaRow>>("data/metadata/sajda.json");

  if (!juz || !hizb || !rub || !ruku || !manzil) {
    throw new Error(
      "Cannot assemble verse meta: missing one or more of data/metadata/{juz,hizb,rub,ruku,manzil}.json.",
    );
  }

  const meta: Record<string, VerseMeta> = {};
  for (const row of Object.values(ayahFile)) {
    const vk = row.verse_key;
    if (!vk || !/^\d+:\d+$/.test(vk)) continue;
    const wc = row.words_count;
    meta[vk] = {
      page: 1,
      juz: 1,
      hizb: 1,
      rub_el_hizb: 1,
      ruku: 1,
      manzil: 1,
      words_count: typeof wc === "number" && wc >= 0 ? wc : 0,
    };
  }

  applyBucket(juz, (r) => r.juz_number, meta, (m, n) => {
    m.juz = n;
  });
  applyBucket(hizb, (r) => r.hizb_number, meta, (m, n) => {
    m.hizb = n;
  });
  applyBucket(rub, (r) => r.rub_number, meta, (m, n) => {
    m.rub_el_hizb = n;
  });
  applyBucket(ruku, (r) => r.ruku_number, meta, (m, n) => {
    m.ruku = n;
  });
  applyBucket(manzil, (r) => r.manzil_number, meta, (m, n) => {
    m.manzil = n;
  });

  if (sajda) {
    for (const row of Object.values(sajda)) {
      const vk = row.verse_key;
      if (!vk || !meta[vk]) continue;
      const t = (row.sajda_type || "").toLowerCase();
      if (t === "required" || t === "obligatory") meta[vk].sajdah = "obligatory";
      else if (t === "optional" || t === "recommended") meta[vk].sajdah = "recommended";
    }
  }

  const layout = await deps.tryLoadJson<LayoutLine[]>(layoutPath);
  let wordToPage: Map<number, number> | undefined;
  if (layout?.length) {
    wordToPage = buildWordIdToPage(layout);
  }

  let rawWords: Record<string, RawWordEntry> | undefined;
  for (const path of WORD_ID_RAW_CANDIDATES) {
    rawWords = await deps.tryLoadJson<Record<string, RawWordEntry>>(path);
    if (rawWords && Object.keys(rawWords).length > 0) break;
  }

  if (wordToPage?.size && rawWords) {
    const firstW = verseFirstWordIds(rawWords);
    for (const vk of Object.keys(meta)) {
      const fw = firstW.get(vk);
      if (fw === undefined) continue;
      const p = wordToPage.get(fw);
      if (p !== undefined) meta[vk].page = p;
    }
  }

  return meta;
}
