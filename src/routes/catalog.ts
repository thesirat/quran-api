import { Hono } from "hono";
import {
  loadTranslationCatalog,
  loadTafsirCatalog,
  loadTafsirChapter,
  loadRecitations,
  loadWordTranslationCatalog,
  loadTransliterationCatalog,
  loadAyahThemes,
} from "../core/loader.js";
import type {
  TranslationCatalogEntry,
  TafsirCatalogEntry,
  RecitationEntry,
} from "../core/types.js";
import { apiError } from "../core/errors.js";
import { parsePagination, paginate } from "../core/pagination.js";
import { parseSortParam, applySorting } from "../core/sorting.js";

const CATALOG_SORT_FIELDS: ReadonlySet<string> = new Set(["id", "name", "language"]);

const catalog = new Hono();

// ---------------------------------------------------------------------------
// GET /v1/translations
// Optional query: ?language=english  (case-insensitive substring match)
// ---------------------------------------------------------------------------
catalog.get("/translations", async (c) => {
  const all = await loadTranslationCatalog();
  const langFilter = c.req.query("language")?.toLowerCase();
  let filtered = langFilter
    ? all.filter((t: TranslationCatalogEntry) => t.language?.toLowerCase().includes(langFilter))
    : all;
  const sort = parseSortParam(c.req.query("sort"), CATALOG_SORT_FIELDS);
  if (sort) filtered = applySorting(filtered, sort);
  const { limit, offset } = parsePagination(c, { defaultLimit: 1000, maxLimit: 1000 });
  const { data, meta } = paginate(filtered, limit, offset);
  return c.json({ data, meta });
});

// ---------------------------------------------------------------------------
// GET /v1/tafsirs
// Optional query: ?language=turkish  ?type=mukhtasar|detailed
// ---------------------------------------------------------------------------
catalog.get("/tafsirs", async (c) => {
  const all = await loadTafsirCatalog();
  const langFilter = c.req.query("language")?.toLowerCase();
  const typeFilter = c.req.query("type")?.toLowerCase();

  let filtered = all.filter((t: TafsirCatalogEntry) => {
    if (langFilter && !t.language?.toLowerCase().includes(langFilter)) return false;
    if (typeFilter && t.type !== typeFilter) return false;
    return true;
  });

  const sort = parseSortParam(c.req.query("sort"), CATALOG_SORT_FIELDS);
  if (sort) filtered = applySorting(filtered, sort);
  const { limit, offset } = parsePagination(c, { defaultLimit: 1000, maxLimit: 1000 });
  const { data, meta } = paginate(filtered, limit, offset);
  return c.json({ data, meta });
});

// ---------------------------------------------------------------------------
// GET /v1/tafsirs/:id  — info about one tafsir
// ---------------------------------------------------------------------------
catalog.get("/tafsirs/:id", async (c) => {
  const id = c.req.param("id");
  const all = await loadTafsirCatalog();
  const entry = all.find((t: TafsirCatalogEntry) => String(t.id) === id);
  if (!entry) return apiError(c, 404, "not_found", "Tafsir not found");
  return c.json({ data: entry });
});

// ---------------------------------------------------------------------------
// GET /v1/tafsirs/:id/surahs  — which surahs have data for this tafsir
// ---------------------------------------------------------------------------
catalog.get("/tafsirs/:id/surahs", async (c) => {
  const id = c.req.param("id");
  const all = await loadTafsirCatalog();
  const entry = all.find((t: TafsirCatalogEntry) => String(t.id) === id);
  if (!entry) return apiError(c, 404, "not_found", "Tafsir not found");

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
// Optional query: ?segmented=true
// ---------------------------------------------------------------------------
catalog.get("/recitations", async (c) => {
  const all = await loadRecitations();
  const segmentedOnly = c.req.query("segmented") === "true";
  const filtered = segmentedOnly ? all.filter((r: RecitationEntry) => (r.segments_count ?? 0) > 0) : all;
  const { limit, offset } = parsePagination(c, { defaultLimit: 1000, maxLimit: 1000 });
  const { data, meta } = paginate(filtered, limit, offset);
  return c.json({ data, meta });
});

// ---------------------------------------------------------------------------
// GET /v1/word-translations  — catalog of available word-by-word translation langs
// ---------------------------------------------------------------------------
catalog.get("/word-translations", async (c) => {
  const data = await loadWordTranslationCatalog();
  return c.json({ data, meta: { total: data.length } });
});

// ---------------------------------------------------------------------------
// GET /v1/transliterations  — catalog of available transliteration resources
// ---------------------------------------------------------------------------
catalog.get("/transliterations", async (c) => {
  const data = await loadTransliterationCatalog();
  return c.json({ data, meta: { total: data.length } });
});

// ---------------------------------------------------------------------------
// GET /v1/ayah-themes  — all ayah themes (paginated)
// ---------------------------------------------------------------------------
catalog.get("/ayah-themes", async (c) => {
  const allThemes = await loadAyahThemes();
  if (!allThemes) {
    return apiError(c, 503, "data_unavailable", "Ayah themes not available", "Run scripts/scrape_qul.py --resources ayah-themes to generate it");
  }

  const { limit, offset } = parsePagination(c, { defaultLimit: 200, maxLimit: 1000 });
  const entries = Object.entries(allThemes);
  const { data: page, meta } = paginate(
    entries.map(([verse_key, themes]) => ({ verse_key, themes })),
    limit,
    offset,
  );
  return c.json({ data: page, meta });
});

export { catalog };
