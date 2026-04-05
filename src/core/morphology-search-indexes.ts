import type { MorphSegment } from "./types.js";

function compareWordKey(a: string, b: string): number {
  const pa = a.split(":").map((x) => Number(x));
  const pb = b.split(":").map((x) => Number(x));
  for (let i = 0; i < 3; i++) {
    const da = pa[i] - pb[i];
    if (da !== 0) return da;
  }
  return 0;
}

function mapSetsToSortedRecords(m: Map<string, Set<string>>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [k, set] of m) {
    out[k] = [...set].sort(compareWordKey);
  }
  return out;
}

/**
 * Build root → word_keys and lemma → word_keys from grouped segment morphology
 * (`enriched_data.json` after `buildCorpusFromEnriched`). Any segment may contribute
 * `root` / `lemma`; a word appears once per key even if multiple segments match.
 */
export function buildMorphologySearchIndexesFromCorpus(
  corpus: Record<string, { segments: MorphSegment[] }>,
): { byRoot: Record<string, string[]>; byLemma: Record<string, string[]> } {
  const rootMap = new Map<string, Set<string>>();
  const lemmaMap = new Map<string, Set<string>>();

  for (const [wordKey, entry] of Object.entries(corpus)) {
    for (const seg of entry.segments) {
      if (typeof seg.root === "string") {
        const r = seg.root.trim();
        if (r) {
          let s = rootMap.get(r);
          if (!s) {
            s = new Set();
            rootMap.set(r, s);
          }
          s.add(wordKey);
        }
      }
      if (typeof seg.lemma === "string") {
        const l = seg.lemma.trim();
        if (l) {
          let s = lemmaMap.get(l);
          if (!s) {
            s = new Set();
            lemmaMap.set(l, s);
          }
          s.add(wordKey);
        }
      }
    }
  }

  return {
    byRoot: mapSetsToSortedRecords(rootMap),
    byLemma: mapSetsToSortedRecords(lemmaMap),
  };
}
