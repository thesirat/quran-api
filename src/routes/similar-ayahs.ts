import { Hono } from "hono";
import { loadSimilarAyahs } from "../core/loader.js";
import type { SimilarAyahPair } from "../core/types.js";

const similarAyahs = new Hono();

const DATA_UNAVAILABLE = {
  status: 503,
  type: "data_unavailable",
  title: "Similar ayahs data not available",
  detail: "Run scripts/scrape_qul.py --resources similar-ayahs to generate it",
} as const;

// ---------------------------------------------------------------------------
// GET /v1/similar-ayahs  — all similar ayah pairs (paginated)
// ---------------------------------------------------------------------------
similarAyahs.get("/", async (c) => {
  const data = await loadSimilarAyahs();
  if (!data) return c.json(DATA_UNAVAILABLE, 503);

  const limit = Math.min(Number(c.req.query("limit") ?? 100), 500);
  const offset = Number(c.req.query("offset") ?? 0);
  const page = data.slice(offset, offset + limit);
  return c.json({ data: page, meta: { total: data.length, limit, offset } });
});

// ---------------------------------------------------------------------------
// GET /v1/similar-ayahs/:key  — similar ayahs for a specific verse
// ---------------------------------------------------------------------------
similarAyahs.get("/:key", async (c) => {
  const key = c.req.param("key");
  const parts = key.split(":");
  if (parts.length !== 2 || parts.some((p: string) => !Number.isInteger(Number(p)))) {
    return c.json({ status: 400, type: "invalid_key", title: "Invalid verse key" }, 400);
  }

  const data = await loadSimilarAyahs();
  if (!data) return c.json(DATA_UNAVAILABLE, 503);

  const matches = data.filter((p: SimilarAyahPair) => p.verse_key === key || p.similar_key === key);
  return c.json({ data: matches, meta: { verse_key: key, total: matches.length } });
});

export { similarAyahs };
