import type { MorphSegment, MorphSyntax } from "./types.js";

/** One row from `data/morphology/enriched_data.json` (MASAQ + mustafa merge). */
export interface EnrichedMorphologyRow {
  id: string;
  form: string;
  morphology: Record<string, unknown>;
  syntax?: Record<string, unknown>;
}

function parseSegmentId(id: string): { wordKey: string; segIndex: number } | null {
  const parts = id.split(":");
  if (parts.length !== 4) return null;
  if (!parts.every((p) => /^\d+$/.test(p))) return null;
  return {
    wordKey: `${parts[0]}:${parts[1]}:${parts[2]}`,
    segIndex: Number(parts[3]),
  };
}

function cleanSyntax(raw: Record<string, unknown> | undefined): MorphSyntax | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const out: MorphSyntax = {};
  for (const k of ["role_ar", "declinability", "case_mood", "gloss"] as const) {
    const v = raw[k];
    if (typeof v === "string") {
      const t = v.trim();
      if (t.length > 0) out[k] = t;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function rowToSegment(row: EnrichedMorphologyRow): MorphSegment {
  const m = row.morphology;
  const morph = typeof m === "object" && m !== null ? m : {};
  const segment = {
    form: typeof row.form === "string" ? row.form : "",
    pos: typeof morph.pos === "string" ? morph.pos : "unknown",
  } as MorphSegment;
  const copyKeys = [
    "segment_type",
    "root",
    "lemma",
    "gender",
    "number",
    "case",
    "state",
    "aspect",
    "voice",
    "mood",
    "person",
    "verb_form",
  ] as const;
  for (const k of copyKeys) {
    const v = morph[k];
    if (v !== undefined && v !== null) {
      Object.assign(segment, { [k]: v });
    }
  }
  const syntax = cleanSyntax(row.syntax);
  if (syntax) segment.syntax = syntax;
  return segment;
}

/**
 * Group segment rows by word key `surah:ayah:word`, ordered by segment index (4th part of `id`).
 */
export function buildCorpusFromEnriched(rows: EnrichedMorphologyRow[]): Record<string, { segments: MorphSegment[] }> {
  const buckets = new Map<string, { segIndex: number; segment: MorphSegment }[]>();
  for (const row of rows) {
    if (!row || typeof row.id !== "string") continue;
    const parsed = parseSegmentId(row.id);
    if (!parsed) continue;
    const segment = rowToSegment(row);
    let arr = buckets.get(parsed.wordKey);
    if (!arr) {
      arr = [];
      buckets.set(parsed.wordKey, arr);
    }
    arr.push({ segIndex: parsed.segIndex, segment });
  }
  const out: Record<string, { segments: MorphSegment[] }> = {};
  for (const [wk, items] of buckets) {
    items.sort((a, b) => a.segIndex - b.segIndex);
    out[wk] = { segments: items.map((x) => x.segment) };
  }
  return out;
}
