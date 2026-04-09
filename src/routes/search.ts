import { Hono } from "hono";
import { loadMorphologySearchIndexes, loadWordsArabic } from "../core/loader.js";
import { apiError } from "../core/errors.js";
import { parsePagination } from "../core/pagination.js";
import { parseSortParam, applySorting } from "../core/sorting.js";

const SEARCH_SORT_FIELDS: ReadonlySet<string> = new Set(["word_key"]);

const search = new Hono();

function paginateKeys(keys: string[], limit: number, offset: number, sort?: ReturnType<typeof parseSortParam>) {
  const sorted = sort ? applySorting(keys.map((k) => ({ word_key: k })), sort).map((o) => o.word_key) : keys;
  const sliced = sorted.slice(offset, offset + limit);
  return { word_keys: sliced, total: keys.length, count: sliced.length };
}

// ---------------------------------------------------------------------------
// GET /v1/search/root/:root  — all word keys sharing a 3-letter Arabic root
// Optional: ?limit=50&offset=0
// ---------------------------------------------------------------------------
search.get("/root/:root", async (c) => {
  const root = decodeURIComponent(c.req.param("root")).trim();
  if (!root) return apiError(c, 400, "invalid_param", "Root is required");

  const indexes = await loadMorphologySearchIndexes();
  if (!indexes) {
    return apiError(c, 503, "unavailable", "Morphology search not available", "Requires data/morphology/enriched_data.json (run: python3 scripts/sync_morphology.py).");
  }
  const keys = indexes.byRoot[root];
  if (!keys || !keys.length) {
    return apiError(c, 404, "not_found", "Root not found", `No words found for root '${root}'`);
  }

  const { limit, offset } = parsePagination(c, { defaultLimit: 50, maxLimit: 1000 });
  const sort = parseSortParam(c.req.query("sort"), SEARCH_SORT_FIELDS);
  const { word_keys, total, count } = paginateKeys(keys, limit, offset, sort);
  return c.json({ data: { root, word_keys, total, count } });
});

// ---------------------------------------------------------------------------
// GET /v1/search/lemma/:lemma  — all word keys sharing a lemma
// Optional: ?limit=50&offset=0&sort=word_key:asc
// ---------------------------------------------------------------------------
search.get("/lemma/:lemma", async (c) => {
  const lemma = decodeURIComponent(c.req.param("lemma")).trim();
  if (!lemma) return apiError(c, 400, "invalid_param", "Lemma is required");

  const indexes = await loadMorphologySearchIndexes();
  if (!indexes) {
    return apiError(c, 503, "unavailable", "Morphology search not available", "Requires data/morphology/enriched_data.json (run: python3 scripts/sync_morphology.py).");
  }

  const keys = indexes.byLemma[lemma];
  if (!keys || !keys.length) {
    return apiError(c, 404, "not_found", "Lemma not found");
  }

  const { limit, offset } = parsePagination(c, { defaultLimit: 50, maxLimit: 1000 });
  const sort = parseSortParam(c.req.query("sort"), SEARCH_SORT_FIELDS);
  const { word_keys, total, count } = paginateKeys(keys, limit, offset, sort);
  return c.json({ data: { lemma, word_keys, total, count } });
});

// ---------------------------------------------------------------------------
// GET /v1/search/word/:word  — exact Arabic word match across the Quran
// Optional: ?limit=50&offset=0&sort=word_key:asc
// ---------------------------------------------------------------------------
search.get("/word/:word", async (c) => {
  const word = decodeURIComponent(c.req.param("word")).trim();
  if (!word) return apiError(c, 400, "invalid_param", "Word is required");

  const wordsArabic = await loadWordsArabic();
  const matches = Object.entries(wordsArabic)
    .filter(([, w]) => w.text === word)
    .map(([key]) => key);

  const { limit, offset } = parsePagination(c, { defaultLimit: 50, maxLimit: 1000 });
  const sort = parseSortParam(c.req.query("sort"), SEARCH_SORT_FIELDS);
  const { word_keys, total, count } = paginateKeys(matches, limit, offset, sort);
  return c.json({ data: { word, word_keys, total, count } });
});

export { search };
