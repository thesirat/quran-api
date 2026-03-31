import { Hono } from "hono";
import { loadMutashabihat } from "../data/loader.js";

const mutashabihat = new Hono();

// ---------------------------------------------------------------------------
// GET /v1/mutashabihat/:key  — similar phrases to a verse key
// ---------------------------------------------------------------------------
mutashabihat.get("/:key", async (c) => {
  const key = c.req.param("key");
  if (!key.match(/^\d+:\d+$/)) {
    return c.json({ status: 400, type: "invalid_key", title: "Key must be surah:ayah" }, 400);
  }

  const all = await loadMutashabihat();
  if (!all) {
    return c.json({ status: 503, type: "unavailable", title: "Mutashabihat data not available" }, 503);
  }

  const pairs = all.filter((p) => p.verse_key === key || p.matched_key === key);
  return c.json({ data: pairs, meta: { verse_key: key, total: pairs.length } });
});

// ---------------------------------------------------------------------------
// GET /v1/mutashabihat  — full list (paginated)
// ---------------------------------------------------------------------------
mutashabihat.get("/", async (c) => {
  const limit = Math.min(Number(c.req.query("limit") ?? 100), 500);
  const offset = Number(c.req.query("offset") ?? 0);

  const all = await loadMutashabihat();
  if (!all) {
    return c.json({ status: 503, type: "unavailable", title: "Mutashabihat data not available" }, 503);
  }

  return c.json({
    data: all.slice(offset, offset + limit),
    meta: { total: all.length, limit, offset },
  });
});

export { mutashabihat };
