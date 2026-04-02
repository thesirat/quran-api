type TryLoadJson = <T>(relPath: string) => Promise<T | undefined>;

/** Same set as `VALID_SCRIPTS` in loader (avoid importing loader → circular). */
type QuranScriptId = "uthmani" | "simple" | "indopak" | "tajweed" | "qpc-hafs";

interface RawWordEntry {
  surah?: string;
  ayah?: string;
  word?: string;
  text?: string;
}

/**
 * QUL quran-script resources save as `data/quran/<id>-raw.json` when the payload is word-keyed.
 * Ordered candidates (first hit wins). Extend if your scrape uses different ids.
 */
export const SCRIPT_QUL_RAW_IDS: Partial<Record<QuranScriptId, string[]>> = {
  uthmani: ["565", "48", "56", "54", "59"],
  simple: ["60", "53"],
  indopak: ["52"],
  tajweed: ["312", "55", "58"],
  "qpc-hafs": ["47", "61", "57"],
};

function isWordLocationKey(k: string): boolean {
  return /^\d+:\d+:\d+$/.test(k);
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
      .map((w) => (typeof w.text === "string" ? w.text.trim() : ""))
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
