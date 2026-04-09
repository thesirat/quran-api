import { Hono } from "hono";
import { loadVerseMeta, loadScript, loadMushafPages } from "../core/loader.js";
import { getVerseKeysByField } from "../core/verse-indexes.js";
import { apiError } from "../core/errors.js";
import { validateRange, validateScript, VALID_SCRIPTS } from "../core/validation.js";

const mushaf = new Hono();

// ---------------------------------------------------------------------------
// GET /v1/mushaf/:n  (1-604)
// Query: ?script=uthmani|simple|indopak|tajweed|qpc-hafs
// ---------------------------------------------------------------------------
mushaf.get("/mushaf/:n", async (c) => {
  const n = validateRange(c.req.param("n"), 1, 604);
  if (!n) return apiError(c, 400, "invalid_param", "Page must be 1-604");

  const script = validateScript(c.req.query("script"));
  if (!script) return apiError(c, 400, "invalid_param", `Unknown script. Valid: ${VALID_SCRIPTS.join(", ")}`);

  const [mushafPages, verseMeta, scriptText, verseKeys] = await Promise.all([
    loadMushafPages(),
    loadVerseMeta(),
    loadScript(script),
    getVerseKeysByField("page", n),
  ]);

  if (!mushafPages) {
    return apiError(c, 503, "data_unavailable", "Mushaf page data not available");
  }

  const pageLayout = mushafPages[String(n)];
  if (!pageLayout) {
    return apiError(c, 404, "not_found", `No mushaf data for page ${n}`);
  }

  const verses = verseKeys.map((key) => {
    const [s, a] = key.split(":").map(Number);
    return { key, surah: s, ayah: a, text: scriptText[key] ?? "", meta: verseMeta[key] };
  });

  return c.json({
    data: {
      page: n,
      lines_count: pageLayout.lines_count,
      words_count: pageLayout.words_count,
      verse_mapping: pageLayout.verse_mapping,
      first_verse: pageLayout.first_verse,
      last_verse: pageLayout.last_verse,
      verses,
    },
  });
});

export { mushaf };
