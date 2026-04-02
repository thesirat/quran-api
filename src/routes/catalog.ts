import { Hono } from "hono";
import {
  loadTranslationCatalog,
  loadTafsirCatalog,
  loadTafsirChapter,
  loadRecitations,
  loadWordTranslationCatalog,
  loadTransliterationCatalog,
  loadAyahThemes,
} from "../data/loader.js";
import type {
  RecitationEntry,
  TafsirCatalogEntry,
  TranslationCatalogEntry,
} from "../data/types.js";

const catalog = new Hono();

// ---------------------------------------------------------------------------
// GET /v1/translations
// Optional query: ?language=english  (case-insensitive substring match)
// ---------------------------------------------------------------------------
catalog.get("/translations", async (c) => {
  const all = await loadTranslationCatalog();
  const langFilter = c.req.query("language")?.toLowerCase();
  const data = langFilter
    ? all.filter((t: TranslationCatalogEntry) => t.language?.toLowerCase().includes(langFilter))
    : all;
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

  const data = all.filter((t: TafsirCatalogEntry) => {
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
  const entry = all.find((t: TafsirCatalogEntry) => String(t.id) === id);
  if (!entry) return c.json({ status: 404, type: "not_found", title: "Tafsir not found" }, 404);
  return c.json({ data: entry });
});

// ---------------------------------------------------------------------------
// GET /v1/tafsirs/:id/surahs  — which surahs have data for this tafsir
// ---------------------------------------------------------------------------
catalog.get("/tafsirs/:id/surahs", async (c) => {
  const id = c.req.param("id");
  const all = await loadTafsirCatalog();
  const entry = all.find((t: TafsirCatalogEntry) => String(t.id) === id);
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
// Optional query: ?segmented=true  → only return recitations with timestamps
// ---------------------------------------------------------------------------
catalog.get("/recitations", async (c) => {
  const all = await loadRecitations();
  const segmentedOnly = c.req.query("segmented") === "true";
  const data = segmentedOnly ? all.filter((r: RecitationEntry) => (r.segments_count ?? 0) > 0) : all;
  return c.json({ data, meta: { total: data.length } });
});

// ---------------------------------------------------------------------------
// GET /v1/word-translations  — catalog of available word-by-word translation langs
// ---------------------------------------------------------------------------
catalog.get("/word-translations", async (c) => {
  const data = await loadWordTranslationCatalog();
  if (!data) {
    return c.json(
      { status: 503, type: "data_unavailable", title: "Word translation catalog not available", detail: "Run scripts/scrape_qul.py to generate it" },
      503
    );
  }
  return c.json({ data, meta: { total: data.length } });
});

// ---------------------------------------------------------------------------
// GET /v1/transliterations  — catalog of available transliteration resources
// ---------------------------------------------------------------------------
catalog.get("/transliterations", async (c) => {
  const data = await loadTransliterationCatalog();
  if (!data) {
    return c.json(
      { status: 503, type: "data_unavailable", title: "Transliteration catalog not available", detail: "Run scripts/scrape_qul.py --resources transliteration to generate it" },
      503
    );
  }
  return c.json({ data, meta: { total: data.length } });
});

// ---------------------------------------------------------------------------
// GET /v1/ayah-themes  — all ayah themes (paginated)
// ---------------------------------------------------------------------------
catalog.get("/ayah-themes", async (c) => {
  const allThemes = await loadAyahThemes();
  if (!allThemes) {
    return c.json(
      { status: 503, type: "data_unavailable", title: "Ayah themes not available", detail: "Run scripts/scrape_qul.py --resources ayah-themes to generate it" },
      503
    );
  }

  const limit = Math.min(Number(c.req.query("limit") ?? 200), 1000);
  const offset = Number(c.req.query("offset") ?? 0);

  const entries = Object.entries(allThemes);
  const page = entries.slice(offset, offset + limit).map(([verse_key, themes]) => ({ verse_key, themes }));
  return c.json({ data: page, meta: { total: entries.length, limit, offset } });
});

export { catalog };
