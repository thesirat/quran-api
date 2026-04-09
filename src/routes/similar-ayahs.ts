import { Hono } from "hono";
import { loadSimilarAyahs } from "../core/loader.js";
import type { SimilarAyahPair, VerseListItem } from "../core/types.js";
import { apiError } from "../core/errors.js";
import { validateVerseKey, validateScript, VALID_SCRIPTS } from "../core/validation.js";
import { parsePagination, paginate } from "../core/pagination.js";
import { buildVerseMap } from "../core/fields.js";
import type { ScriptName } from "../core/loaders/quran.js";

const similarAyahs = new Hono();

// ---------------------------------------------------------------------------
// GET /v1/similar-ayahs  — all similar ayah pairs (paginated)
// ---------------------------------------------------------------------------
similarAyahs.get("/", async (c) => {
  const data = await loadSimilarAyahs();
  if (!data) return apiError(c, 503, "data_unavailable", "Similar ayahs data not available", "Run scripts/scrape_qul.py --resources similar-ayahs to generate it");

  const { limit, offset } = parsePagination(c, { defaultLimit: 100, maxLimit: 500 });
  const { data: page, meta } = paginate(data, limit, offset);
  return c.json({ data: page, meta });
});

// ---------------------------------------------------------------------------
// GET /v1/similar-ayahs/:key  — similar ayahs for a specific verse
// ---------------------------------------------------------------------------
similarAyahs.get("/:key", async (c) => {
  const parsed = validateVerseKey(c.req.param("key"));
  if (!parsed) return apiError(c, 400, "invalid_key", "Invalid verse key");

  const key = `${parsed.surah}:${parsed.ayah}`;
  const data = await loadSimilarAyahs();
  if (!data) return apiError(c, 503, "data_unavailable", "Similar ayahs data not available", "Run scripts/scrape_qul.py --resources similar-ayahs to generate it");

  const matches = data.filter((p: SimilarAyahPair) => p.verse_key === key || p.similar_key === key);

  const expand = c.req.query("expand") === "true";
  if (expand) {
    const script = validateScript(c.req.query("script"));
    if (!script) return apiError(c, 400, "invalid_param", `Unknown script. Valid: ${VALID_SCRIPTS.join(", ")}`);
    const expanded = await expandSimilarPairs(matches, script as ScriptName);
    return c.json({ data: expanded, meta: { verse_key: key, total: expanded.length } });
  }

  return c.json({ data: matches, meta: { verse_key: key, total: matches.length } });
});

async function expandSimilarPairs(
  pairs: SimilarAyahPair[],
  script: ScriptName,
): Promise<(SimilarAyahPair & { verse?: VerseListItem; similar_verse?: VerseListItem })[]> {
  const allKeys = [...new Set(pairs.flatMap((p) => [p.verse_key, p.similar_key]))];
  const verseMap = await buildVerseMap(allKeys, script);
  return pairs.map((p) => ({
    ...p,
    verse: verseMap.get(p.verse_key),
    similar_verse: verseMap.get(p.similar_key),
  }));
}

export { similarAyahs };
