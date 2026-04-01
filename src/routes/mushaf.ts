import { Hono } from "hono";
import { loadVerseMeta, loadScript, loadMushafPages, VALID_SCRIPTS, type ScriptName } from "../data/loader.js";

const mushaf = new Hono();

// ---------------------------------------------------------------------------
// GET /v1/mushaf/:n  (1–604)
// Query: ?script=uthmani|simple|indopak|tajweed|qpc-hafs
// ---------------------------------------------------------------------------
mushaf.get("/mushaf/:n", async (c) => {
  const n = Number(c.req.param("n"));
  if (!Number.isInteger(n) || n < 1 || n > 604) {
    return c.json({ status: 400, type: "invalid_param", title: "Page must be 1–604" }, 400);
  }

  const scriptParam = c.req.query("script") ?? "uthmani";
  if (!(VALID_SCRIPTS as readonly string[]).includes(scriptParam)) {
    return c.json({ status: 400, type: "invalid_param", title: `Unknown script. Valid: ${VALID_SCRIPTS.join(", ")}` }, 400);
  }
  const script = scriptParam as ScriptName;

  const [mushafPages, verseMeta, scriptText] = await Promise.all([
    loadMushafPages(),
    loadVerseMeta(),
    loadScript(script),
  ]);

  if (!mushafPages) {
    return c.json({ status: 503, type: "data_unavailable", title: "Mushaf page data not available" }, 503);
  }

  const pageLayout = mushafPages[String(n)];
  if (!pageLayout) {
    return c.json({ status: 404, type: "not_found", title: `No mushaf data for page ${n}` }, 404);
  }

  const verseKeys = (Object.entries(verseMeta) as [string, import("../data/types.js").VerseMeta][])
    .filter(([, v]) => v.page === n)
    .sort(([a], [b]) => {
      const [as_, aa] = a.split(":").map(Number);
      const [bs, ba] = b.split(":").map(Number);
      return as_ - bs || aa - ba;
    })
    .map(([key]) => key);

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
