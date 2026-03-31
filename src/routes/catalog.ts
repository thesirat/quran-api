import { Hono } from "hono";
import {
  loadTranslationCatalog,
  loadTafsirCatalog,
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
// GET /v1/recitations
// ---------------------------------------------------------------------------
catalog.get("/recitations", async (c) => {
  const data = await loadRecitations();
  return c.json({ data, meta: { total: data.length } });
});

export { catalog };
