import { Hono } from "hono";
import {
  loadTranslationCatalog,
  loadTafsirCatalog,
  loadTafsirChapter,
  loadRecitations,
} from "../data/loader.js";

const catalog = new Hono();

// ---------------------------------------------------------------------------
// GET /v1/translations
// ---------------------------------------------------------------------------
catalog.get("/translations", async (c) => {
  const data = await loadTranslationCatalog();
  return c.json({ data, meta: { total: data.length } });
});

// ---------------------------------------------------------------------------
// GET /v1/tafsirs
// Optional query: ?language=turkish  (case-insensitive substring match)
//                 ?type=mukhtasar|detailed
// ---------------------------------------------------------------------------
catalog.get("/tafsirs", async (c) => {
  const all = await loadTafsirCatalog();
  const langFilter = c.req.query("language")?.toLowerCase();
  const typeFilter = c.req.query("type")?.toLowerCase();

  const data = all.filter((t) => {
    if (langFilter && !t.language?.toLowerCase().includes(langFilter)) return false;
    if (typeFilter && t.type !== typeFilter) return false;
    return true;
  });

  return c.json({ data, meta: { total: data.length } });
});

// ---------------------------------------------------------------------------
// GET /v1/tafsirs/:id  — info about one tafsir
// ---------------------------------------------------------------------------
catalog.get("/tafsirs/:id", async (c) => {
  const id = c.req.param("id");
  const all = await loadTafsirCatalog();
  const entry = all.find((t) => String(t.id) === id);
  if (!entry) return c.json({ status: 404, type: "not_found", title: "Tafsir not found" }, 404);
  return c.json({ data: entry });
});

// ---------------------------------------------------------------------------
// GET /v1/tafsirs/:id/surahs  — which surahs have data for this tafsir
// ---------------------------------------------------------------------------
catalog.get("/tafsirs/:id/surahs", async (c) => {
  const id = c.req.param("id");
  const all = await loadTafsirCatalog();
  const entry = all.find((t) => String(t.id) === id);
  if (!entry) return c.json({ status: 404, type: "not_found", title: "Tafsir not found" }, 404);

  const checks = await Promise.all(
    Array.from({ length: 114 }, (_, i) => i + 1).map(async (s) => {
      const ch = await loadTafsirChapter(id, s);
      return ch ? s : null;
    })
  );

  const covered = checks.filter((s): s is number => s !== null);
  return c.json({ data: { id: entry.id, name: entry.name, language: entry.language, covered_surahs: covered }, meta: { total: covered.length } });
});

// ---------------------------------------------------------------------------
// GET /v1/recitations
// ---------------------------------------------------------------------------
catalog.get("/recitations", async (c) => {
  const data = await loadRecitations();
  return c.json({ data, meta: { total: data.length } });
});

export { catalog };
