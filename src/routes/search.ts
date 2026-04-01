import { Hono } from "hono";
import {
  loadRootsIndex,
  loadLemmasIndex,
  loadWordsArabic,
} from "../data/loader.js";

const search = new Hono();

function parsePagination(c: { req: { query: (k: string) => string | undefined } }): { limit: number | null; offset: number } {
  const limitRaw = c.req.query("limit");
  const offset = Math.max(0, Number(c.req.query("offset") ?? 0) || 0);
  const limit = limitRaw !== undefined ? Math.max(1, Number(limitRaw) || 1) : null;
  return { limit, offset };
}

function paginate(keys: string[], limit: number | null, offset: number) {
  const total = keys.length;
  const sliced = limit !== null ? keys.slice(offset, offset + limit) : keys.slice(offset);
  return { word_keys: sliced, total, count: sliced.length };
}

// ---------------------------------------------------------------------------
// GET /v1/search/root/:root  — all word keys sharing a 3-letter Arabic root
// Optional: ?limit=50&offset=0
// ---------------------------------------------------------------------------
search.get("/root/:root", async (c) => {
  const root = decodeURIComponent(c.req.param("root")).trim();
  if (!root) return c.json({ status: 400, type: "invalid_param", title: "Root is required" }, 400);

  const roots = await loadRootsIndex();
  const keys = roots[root];
  if (!keys || !keys.length) {
    return c.json({ status: 404, type: "not_found", title: "Root not found", detail: `No words found for root '${root}'` }, 404);
  }

  const { limit, offset } = parsePagination(c);
  const { word_keys, total, count } = paginate(keys, limit, offset);
  return c.json({ data: { root, word_keys, total, count } });
});

// ---------------------------------------------------------------------------
// GET /v1/search/lemma/:lemma  — all word keys sharing a lemma
// Optional: ?limit=50&offset=0
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

  const { limit, offset } = parsePagination(c);
  const { word_keys, total, count } = paginate(keys, limit, offset);
  return c.json({ data: { lemma, word_keys, total, count } });
});

// ---------------------------------------------------------------------------
// GET /v1/search/word/:word  — exact Arabic word match across the Quran
// Optional: ?limit=50&offset=0
// ---------------------------------------------------------------------------
search.get("/word/:word", async (c) => {
  const word = decodeURIComponent(c.req.param("word")).trim();
  if (!word) return c.json({ status: 400, type: "invalid_param", title: "Word is required" }, 400);

  const wordsArabic = await loadWordsArabic();
  const matches = Object.entries(wordsArabic)
    .filter(([, w]) => w.text === word)
    .map(([key]) => key);

  const { limit, offset } = parsePagination(c);
  const { word_keys, total, count } = paginate(matches, limit, offset);
  return c.json({ data: { word, word_keys, total, count } });
});

export { search };
