import { Hono } from "hono";
import type { Context } from "hono";
import { loadCorpusMorphology, loadQulMorphology } from "../core/loader.js";

const morphology = new Hono();

/** Corpus / QUL keys are always `surah:ayah:word` with positive integers (e.g. `1:1:1`, `2:255:3`). */
export function parseMorphologyWordKey(raw: string | undefined): string | null {
  if (raw === undefined) return null;
  let s = raw.trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    /* keep s */
  }
  const parts = s.split(":");
  if (parts.length !== 3) return null;
  if (!parts.every((p) => /^\d+$/.test(p))) return null;
  const surah = Number(parts[0]);
  const ayah = Number(parts[1]);
  const word = Number(parts[2]);
  if (!Number.isInteger(surah) || surah < 1 || surah > 114) return null;
  if (!Number.isInteger(ayah) || ayah < 1 || ayah > 286) return null;
  if (!Number.isInteger(word) || word < 1 || word > 256) return null;
  return `${surah}:${ayah}:${word}`;
}

async function morphologyResponse(c: Context, wk: string) {
  const [corpus, qul] = await Promise.all([loadCorpusMorphology(), loadQulMorphology()]);

  const corpusEntry = corpus[wk];
  const qulEntry = qul?.[wk];

  if (!corpusEntry && !qulEntry) {
    return c.json({ status: 404, type: "not_found", title: "No morphology data for this word" }, 404);
  }

  return c.json({
    data: {
      word_key: wk,
      segments: corpusEntry?.segments ?? [],
      qul: qulEntry ?? null,
    },
  });
}

// ---------------------------------------------------------------------------
// GET /v1/morphology?word_key=1:1:1  (or ?key=) — use when path segments cannot contain ':'
// ---------------------------------------------------------------------------
morphology.get("/", async (c) => {
  const wk = parseMorphologyWordKey(c.req.query("word_key") ?? c.req.query("key"));
  if (!wk) {
    return c.json(
      {
        status: 400,
        type: "invalid_param",
        title: "Query word_key (or key) must be surah:ayah:word with integers (e.g. 1:1:1)",
      },
      400,
    );
  }
  return morphologyResponse(c, wk);
});

// ---------------------------------------------------------------------------
// GET /v1/morphology/:word_key  e.g. /v1/morphology/2:255:1
// ---------------------------------------------------------------------------
morphology.get("/:word_key", async (c) => {
  const wk = parseMorphologyWordKey(c.req.param("word_key"));
  if (!wk) {
    return c.json(
      {
        status: 400,
        type: "invalid_key",
        title: "Word key must be surah:ayah:word with integers (e.g. 1:1:1)",
      },
      400,
    );
  }
  return morphologyResponse(c, wk);
});

export { morphology };
