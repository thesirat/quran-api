import { Hono } from "hono";
import { loadTopics } from "../data/loader.js";

const topics = new Hono();

// ---------------------------------------------------------------------------
// GET /v1/topics  — full topic catalog
// ---------------------------------------------------------------------------
topics.get("/", async (c) => {
  const data = await loadTopics();
  const result = Object.entries(data).map(([slug, t]) => ({
    slug,
    name: t.name,
    verse_count: t.verse_keys.length,
  }));
  return c.json({ data: result, meta: { total: result.length } });
});

// ---------------------------------------------------------------------------
// GET /v1/topics/:slug  — verse keys for a topic
// ---------------------------------------------------------------------------
topics.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const data = await loadTopics();
  const topic = data[slug];
  if (!topic) {
    return c.json({ status: 404, type: "not_found", title: "Topic not found" }, 404);
  }
  return c.json({ data: { slug, name: topic.name, verse_keys: topic.verse_keys } });
});

export { topics };
