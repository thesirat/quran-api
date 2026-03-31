import { Hono } from "hono";
import {
  loadCorpusMorphology,
  loadQulMorphology,
} from "../data/loader.js";

const morphology = new Hono();

// ---------------------------------------------------------------------------
// GET /v1/morphology/:word_key  e.g. /v1/morphology/2:255:1
// ---------------------------------------------------------------------------
morphology.get("/:word_key", async (c) => {
  const wk = c.req.param("word_key");
  const parts = wk.split(":");
  if (parts.length !== 3 || parts.some((p) => !p || isNaN(Number(p)))) {
    return c.json({ status: 400, type: "invalid_key", title: "Word key must be surah:ayah:word" }, 400);
  }

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
});

export { morphology };
