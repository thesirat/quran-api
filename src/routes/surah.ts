import { Hono } from "hono";
import { loadVerseMeta, loadTafsirChapter, loadTafsirCatalog, loadSurahInfo, loadSurahInfoCatalog } from "../core/loader.js";
import { SURAH_NAMES } from "../core/surah-static.js";
import type { SurahMeta, TafsirCatalogEntry, SurahInfoCatalogEntry } from "../core/types.js";
import { apiError } from "../core/errors.js";
import { validateSurah, validateScript, VALID_SCRIPTS } from "../core/validation.js";
import { parsePagination } from "../core/pagination.js";
import { parseFields, buildVerseList, type BuildVerseOptions } from "../core/fields.js";
import { getVerseKeysForSurah } from "../core/verse-indexes.js";
import { parseSortParam, VERSE_SORT_FIELDS } from "../core/sorting.js";

const surah = new Hono();

// ---------------------------------------------------------------------------
// GET /v1/surahs
// Optional query: ?revelation_place=mecca|medina
// ---------------------------------------------------------------------------
surah.get("/", async (c) => {
  const rpParam = c.req.query("revelation_place")?.toLowerCase();
  if (rpParam && rpParam !== "mecca" && rpParam !== "medina") {
    return apiError(c, 400, "invalid_param", "revelation_place must be 'mecca' or 'medina'");
  }

  const verseMeta = await loadVerseMeta();
  const result: SurahMeta[] = [];

  for (let s = 1; s <= 114; s++) {
    const info = SURAH_NAMES[s];
    if (rpParam && info?.type !== rpParam) continue;

    const keys = await getVerseKeysForSurah(s);
    let firstPage: number | undefined;
    let lastPage: number | undefined;
    for (const key of keys) {
      const vm = verseMeta[key];
      if (!firstPage) firstPage = vm?.page;
      lastPage = vm?.page;
    }
    result.push({
      id: s,
      name_arabic: info?.arabic ?? "",
      name_simple: info?.transliteration ?? "",
      name_translation: info?.english,
      revelation_place: info?.type as "mecca" | "medina" | undefined,
      verses_count: keys.length,
      pages: firstPage && lastPage ? [firstPage, lastPage] : undefined,
    });
  }

  return c.json({ data: result, meta: { total: result.length } });
});

// ---------------------------------------------------------------------------
// GET /v1/surah/:n  — surah info + verse keys
// ---------------------------------------------------------------------------
surah.get("/:n", async (c) => {
  const n = validateSurah(c.req.param("n"));
  if (!n) return apiError(c, 400, "invalid_param", "Surah number must be 1-114");

  const info = SURAH_NAMES[n];
  const verse_keys = await getVerseKeysForSurah(n);

  return c.json({
    data: {
      id: n,
      name_arabic: info?.arabic ?? "",
      name_simple: info?.transliteration ?? "",
      name_translation: info?.english,
      revelation_place: info?.type,
      verses_count: verse_keys.length,
      verse_keys,
    },
  });
});

// ---------------------------------------------------------------------------
// GET /v1/surah/:n/verses  — paginated verse list
// ---------------------------------------------------------------------------
surah.get("/:n/verses", async (c) => {
  const n = validateSurah(c.req.param("n"));
  if (!n) return apiError(c, 400, "invalid_param", "Surah number must be 1-114");

  const script = validateScript(c.req.query("script"));
  if (!script) return apiError(c, 400, "invalid_param", `Unknown script. Valid: ${VALID_SCRIPTS.join(", ")}`);

  const { limit, offset } = parsePagination(c, { defaultLimit: 286, maxLimit: 286 });
  const fields = parseFields(c.req.query("fields"));
  const sort = parseSortParam(c.req.query("sort"), VERSE_SORT_FIELDS);
  const all = await getVerseKeysForSurah(n);
  const page = all.slice(offset, offset + limit);

  const options: BuildVerseOptions = {};
  const translationsParam = c.req.query("translations");
  if (translationsParam) {
    options.translationIds = translationsParam.split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (c.req.query("words") === "true") {
    options.words = true;
    const lang = c.req.query("lang");
    if (lang) options.lang = lang;
    const wt = c.req.query("word_translation");
    if (wt) options.wordTranslationLang = wt;
    const wtl = c.req.query("word_transliteration");
    if (wtl) options.wordTransliterationLang = wtl;
  }
  const transliterationLang = c.req.query("transliteration");
  if (transliterationLang) options.transliteration = transliterationLang;

  const data = await buildVerseList(page, script, fields, sort, options);

  return c.json({ data, meta: { total: all.length, limit, offset } });
});

// ---------------------------------------------------------------------------
// GET /v1/surah/:n/tafsir/:id  — all tafsir entries for a surah
// ---------------------------------------------------------------------------
surah.get("/:n/tafsir/:id", async (c) => {
  const n = validateSurah(c.req.param("n"));
  if (!n) return apiError(c, 400, "invalid_param", "Surah number must be 1-114");

  const tafsirId = c.req.param("id");
  const [chapter, catalog] = await Promise.all([
    loadTafsirChapter(tafsirId, n),
    loadTafsirCatalog(),
  ]);

  if (!chapter) {
    return apiError(c, 404, "not_found", "Tafsir not found", `Tafsir ${tafsirId} has no data for surah ${n}`);
  }

  const meta = catalog.find((t: TafsirCatalogEntry) => String(t.id) === tafsirId);
  return c.json({
    data: {
      tafsir: meta ?? { id: tafsirId },
      surah: n,
      ayahs: chapter.ayahs,
    },
    meta: { total: chapter.ayahs.length },
  });
});

// ---------------------------------------------------------------------------
// GET /v1/surah/:n/info  — surah description & themes
// Query: ?lang=english (default "english")
// ---------------------------------------------------------------------------
surah.get("/:n/info", async (c) => {
  const n = validateSurah(c.req.param("n"));
  if (!n) return apiError(c, 400, "invalid_param", "Surah number must be 1-114");

  const lang = c.req.query("lang") ?? "english";
  const catalog = await loadSurahInfoCatalog();
  const data = await loadSurahInfo(lang);
  if (!data) {
    const available = catalog ? catalog.map((e: SurahInfoCatalogEntry) => e.lang) : [];
    return apiError(
      c, 503, "data_unavailable",
      `Surah info for language '${lang}' not available`,
      available.length ? `Available languages: ${available.join(", ")}` : "Run scripts/scrape_qul.py --resources surah-info to generate it",
    );
  }

  const entry = data[String(n)];
  if (!entry) return apiError(c, 404, "not_found", `No info found for surah ${n} in language '${lang}'`);

  return c.json({ data: { surah: n, lang, ...entry } });
});

export { surah };
