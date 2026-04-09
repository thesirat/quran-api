import { Hono } from "hono";
import type { Context } from "hono";
import { loadCorpusMorphology, loadQulMorphology } from "../core/loader.js";
import { apiError } from "../core/errors.js";
import { validateWordKey } from "../core/validation.js";

const morphology = new Hono();

async function morphologyResponse(c: Context, wk: string) {
  const [corpus, qul] = await Promise.all([loadCorpusMorphology(), loadQulMorphology()]);

  const corpusEntry = corpus[wk];
  const qulEntry = qul?.[wk];

  if (!corpusEntry && !qulEntry) {
    return apiError(c, 404, "not_found", "No morphology data for this word");
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
  const wk = validateWordKey(c.req.query("word_key") ?? c.req.query("key"));
  if (!wk) {
    return apiError(c, 400, "invalid_param", "Query word_key (or key) must be surah:ayah:word with integers (e.g. 1:1:1)");
  }
  return morphologyResponse(c, wk);
});

// ---------------------------------------------------------------------------
// GET /v1/morphology/:word_key  e.g. /v1/morphology/2:255:1
// ---------------------------------------------------------------------------
morphology.get("/:word_key", async (c) => {
  const wk = validateWordKey(c.req.param("word_key"));
  if (!wk) {
    return apiError(c, 400, "invalid_key", "Word key must be surah:ayah:word with integers (e.g. 1:1:1)");
  }
  return morphologyResponse(c, wk);
});

export { morphology };
