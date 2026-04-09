import { Hono } from "hono";
import { loadMutashabihat } from "../core/loader.js";
import type { MutashabihatPair, VerseListItem } from "../core/types.js";
import { apiError } from "../core/errors.js";
import { validateVerseKey, validateScript, VALID_SCRIPTS } from "../core/validation.js";
import { parsePagination, paginate } from "../core/pagination.js";
import { buildVerseMap } from "../core/fields.js";
import type { ScriptName } from "../core/loaders/quran.js";

const mutashabihat = new Hono();

// ---------------------------------------------------------------------------
// GET /v1/mutashabihat/:key  — similar phrases to a verse key
// ---------------------------------------------------------------------------
mutashabihat.get("/:key", async (c) => {
  const parsed = validateVerseKey(c.req.param("key"));
  if (!parsed) return apiError(c, 400, "invalid_key", "Key must be surah:ayah");

  const key = `${parsed.surah}:${parsed.ayah}`;
  const all = await loadMutashabihat();
  if (!all) {
    return apiError(c, 503, "unavailable", "Mutashabihat data not available");
  }

  const pairs = all.filter((p) => p.verse_key === key || p.matched_key === key);

  const expand = c.req.query("expand") === "true";
  if (expand) {
    const script = validateScript(c.req.query("script"));
    if (!script) return apiError(c, 400, "invalid_param", `Unknown script. Valid: ${VALID_SCRIPTS.join(", ")}`);
    const expanded = await expandPairs(pairs, script as ScriptName);
    return c.json({ data: expanded, meta: { verse_key: key, total: expanded.length } });
  }

  return c.json({ data: pairs, meta: { verse_key: key, total: pairs.length } });
});

// ---------------------------------------------------------------------------
// GET /v1/mutashabihat  — full list (paginated)
// ---------------------------------------------------------------------------
mutashabihat.get("/", async (c) => {
  const all = await loadMutashabihat();
  if (!all) {
    return apiError(c, 503, "unavailable", "Mutashabihat data not available");
  }

  const { limit, offset } = parsePagination(c, { defaultLimit: 100, maxLimit: 500 });
  const { data, meta } = paginate(all, limit, offset);
  return c.json({ data, meta });
});

async function expandPairs(
  pairs: MutashabihatPair[],
  script: ScriptName,
): Promise<(MutashabihatPair & { verse?: VerseListItem; matched_verse?: VerseListItem })[]> {
  const allKeys = [...new Set(pairs.flatMap((p) => [p.verse_key, p.matched_key]))];
  const verseMap = await buildVerseMap(allKeys, script);
  return pairs.map((p) => ({
    ...p,
    verse: verseMap.get(p.verse_key),
    matched_verse: verseMap.get(p.matched_key),
  }));
}

export { mutashabihat };
