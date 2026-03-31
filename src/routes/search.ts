import { Hono } from "hono";
import {
  loadRootsIndex,
  loadLemmasIndex,
  loadWordsArabic,
} from "../data/loader.js";

const search = new Hono();

// ---------------------------------------------------------------------------
// GET /v1/search/root/:root  — all word keys sharing a 3-letter Arabic root
// ---------------------------------------------------------------------------
search.get("/root/:root", async (c) => {
  const root = decodeURIComponent(c.req.param("root")).trim();
  if (!root) return c.json({ status: 400, type: "invalid_param", title: "Root is required" }, 400);

  const roots = await loadRootsIndex();
  const keys = roots[root];
  if (!keys || !keys.length) {
    return c.json({ status: 404, type: "not_found", title: "Root not found", detail: `No words found for root '${root}'` }, 404);
  }

  return c.json({ data: { root, word_keys: keys, count: keys.length } });
});

// ---------------------------------------------------------------------------
// GET /v1/search/lemma/:lemma  — all word keys sharing a lemma
// ---------------------------------------------------------------------------
search.get("/lemma/:lemma", async (c) => {
  const lemma = decodeURIComponent(c.req.param("lemma")).trim();
  if (!lemma) return c.json({ status: 400, type: "invalid_param", title: "Lemma is required" }, 400);

  const lemmas = await loadLemmasIndex();
  if (!lemmas) return c.json({ status: 503, type: "unavailable", title: "Lemma index not available" }, 503);

  const keys = lemmas[lemma];
  if (!keys || !keys.length) {
    return c.json({ status: 404, type: "not_found", title: "Lemma not found" }, 404);
  }

  return c.json({ data: { lemma, word_keys: keys, count: keys.length } });
});

// ---------------------------------------------------------------------------
// GET /v1/search/word/:word  — exact Arabic word match across the Quran
// ---------------------------------------------------------------------------
search.get("/word/:word", async (c) => {
  const word = decodeURIComponent(c.req.param("word")).trim();
  if (!word) return c.json({ status: 400, type: "invalid_param", title: "Word is required" }, 400);

  const wordsArabic = await loadWordsArabic();
  const matches = Object.entries(wordsArabic)
    .filter(([, w]) => w.text === word)
    .map(([key]) => key);

  return c.json({ data: { word, word_keys: matches, count: matches.length } });
});

export { search };
