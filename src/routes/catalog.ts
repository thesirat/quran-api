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
// ---------------------------------------------------------------------------
catalog.get("/tafsirs", async (c) => {
  const data = await loadTafsirCatalog();
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
