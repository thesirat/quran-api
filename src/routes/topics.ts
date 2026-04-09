import { Hono } from "hono";
import { loadTopics } from "../core/loader.js";
import type { TopicEntry } from "../core/types.js";
import { apiError } from "../core/errors.js";
import { parsePagination, paginate } from "../core/pagination.js";
import { buildVerseMap } from "../core/fields.js";
import { validateScript, VALID_SCRIPTS } from "../core/validation.js";
import type { ScriptName } from "../core/loaders/quran.js";

const topics = new Hono();

// ---------------------------------------------------------------------------
// GET /v1/topics  — full topic catalog (paginated)
// Optional query: ?name=prayer  (case-insensitive substring match on topic name)
// ---------------------------------------------------------------------------
topics.get("/", async (c) => {
  const data = await loadTopics();
  const nameFilter = c.req.query("name")?.toLowerCase();
  const result = (Object.entries(data) as [string, TopicEntry][])
    .filter(([, t]) => !nameFilter || t.name?.toLowerCase().includes(nameFilter))
    .map(([slug, t]) => ({
      slug,
      name: t.name,
      verse_count: t.verse_keys.length,
    }));

  const { limit, offset } = parsePagination(c, { defaultLimit: 1000, maxLimit: 5000 });
  const { data: page, meta } = paginate(result, limit, offset);
  return c.json({ data: page, meta });
});

// ---------------------------------------------------------------------------
// GET /v1/topics/:slug  — verse keys for a topic
// Optional: ?expand=true&script=uthmani  (inline verse data)
// ---------------------------------------------------------------------------
topics.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const data = await loadTopics();
  const topic = data[slug];
  if (!topic) {
    return apiError(c, 404, "not_found", "Topic not found");
  }

  const expand = c.req.query("expand") === "true";
  if (expand) {
    const script = validateScript(c.req.query("script"));
    if (!script) return apiError(c, 400, "invalid_param", `Unknown script. Valid: ${VALID_SCRIPTS.join(", ")}`);
    const verseMap = await buildVerseMap(topic.verse_keys, script as ScriptName);
    const verses = topic.verse_keys.map((k) => verseMap.get(k)!);
    return c.json({ data: { slug, name: topic.name, verses }, meta: { total: verses.length } });
  }

  return c.json({ data: { slug, name: topic.name, verse_keys: topic.verse_keys } });
});

export { topics };
