import { Hono } from "hono";
import { loadVerseMeta, loadScript, VALID_SCRIPTS, type ScriptName, loadTafsirChapter, loadTafsirCatalog, loadSurahInfo, loadSurahInfoCatalog } from "../data/loader.js";
import { SURAH_NAMES } from "../data/surah-static.js";
import type { SurahMeta } from "../data/types.js";

const surah = new Hono();

// ---------------------------------------------------------------------------
// GET /v1/surahs
// Optional query: ?revelation_place=mecca|medina
// ---------------------------------------------------------------------------
surah.get("/", async (c) => {
  const rpParam = c.req.query("revelation_place")?.toLowerCase();
  if (rpParam && rpParam !== "mecca" && rpParam !== "medina") {
    return c.json({ status: 400, type: "invalid_param", title: "revelation_place must be 'mecca' or 'medina'" }, 400);
  }

  const verseMeta = await loadVerseMeta();
  const result: SurahMeta[] = [];

  for (let s = 1; s <= 114; s++) {
    const info = SURAH_NAMES[s];
    if (rpParam && info?.type !== rpParam) continue;

    let count = 0;
    let firstPage: number | undefined;
    let lastPage: number | undefined;
    for (let a = 1; a <= 300; a++) {
      const vm = verseMeta[`${s}:${a}`];
      if (!vm) break;
      count++;
      if (!firstPage) firstPage = vm.page;
      lastPage = vm.page;
    }
    result.push({
      id: s,
      name_arabic: info?.arabic ?? "",
      name_simple: info?.transliteration ?? "",
      name_translation: info?.english,
      revelation_place: info?.type as "mecca" | "medina" | undefined,
      verses_count: count,
      pages: firstPage && lastPage ? [firstPage, lastPage] : undefined,
    });
  }

  return c.json({ data: result, meta: { total: result.length } });
});

// ---------------------------------------------------------------------------
// GET /v1/surah/:n  — surah info + verse keys
// ---------------------------------------------------------------------------
surah.get("/:n", async (c) => {
  const n = Number(c.req.param("n"));
  if (!Number.isInteger(n) || n < 1 || n > 114) {
    return c.json({ status: 400, type: "invalid_param", title: "Surah number must be 1–114" }, 400);
  }

  const verseMeta = await loadVerseMeta();
  const info = SURAH_NAMES[n];
  const verse_keys: string[] = [];
  let firstPage: number | undefined;

  for (let a = 1; a <= 300; a++) {
    const key = `${n}:${a}`;
    if (!verseMeta[key]) break;
    verse_keys.push(key);
    if (!firstPage) firstPage = verseMeta[key].page;
  }

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
  const n = Number(c.req.param("n"));
  if (!Number.isInteger(n) || n < 1 || n > 114) {
    return c.json({ status: 400, type: "invalid_param", title: "Surah number must be 1–114" }, 400);
  }

  const limit = Math.min(Number(c.req.query("limit") ?? 286), 286);
  const offset = Number(c.req.query("offset") ?? 0);

  const scriptParam = c.req.query("script") ?? "uthmani";
  if (!(VALID_SCRIPTS as readonly string[]).includes(scriptParam)) {
    return c.json({ status: 400, type: "invalid_param", title: `Unknown script. Valid: ${VALID_SCRIPTS.join(", ")}` }, 400);
  }
  const script = scriptParam as ScriptName;

  const [verseMeta, scriptText] = await Promise.all([loadVerseMeta(), loadScript(script)]);

  const all: string[] = [];
  for (let a = 1; a <= 300; a++) {
    if (!verseMeta[`${n}:${a}`]) break;
    all.push(`${n}:${a}`);
  }

  const page = all.slice(offset, offset + limit);
  const data = page.map((key) => {
    const [s, a] = key.split(":").map(Number);
    return { key, surah: s, ayah: a, text: scriptText[key] ?? "", meta: verseMeta[key] };
  });

  return c.json({ data, meta: { total: all.length, limit, offset } });
});

// ---------------------------------------------------------------------------
// GET /v1/surah/:n/tafsir/:id  — all tafsir entries for a surah
// ---------------------------------------------------------------------------
surah.get("/:n/tafsir/:id", async (c) => {
  const n = Number(c.req.param("n"));
  if (!Number.isInteger(n) || n < 1 || n > 114) {
    return c.json({ status: 400, type: "invalid_param", title: "Surah number must be 1–114" }, 400);
  }

  const tafsirId = c.req.param("id");
  const [chapter, catalog] = await Promise.all([
    loadTafsirChapter(tafsirId, n),
    loadTafsirCatalog(),
  ]);

  if (!chapter) {
    return c.json({ status: 404, type: "not_found", title: "Tafsir not found", detail: `Tafsir ${tafsirId} has no data for surah ${n}` }, 404);
  }

  const meta = catalog.find((t) => String(t.id) === tafsirId);
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
  const n = Number(c.req.param("n"));
  if (!Number.isInteger(n) || n < 1 || n > 114) {
    return c.json({ status: 400, type: "invalid_param", title: "Surah number must be 1–114" }, 400);
  }

  const lang = c.req.query("lang") ?? "english";
  const catalog = await loadSurahInfoCatalog();
  const data = await loadSurahInfo(lang);
  if (!data) {
    const available = catalog ? catalog.map((e) => e.lang) : [];
    return c.json(
      {
        status: 503,
        type: "data_unavailable",
        title: `Surah info for language '${lang}' not available`,
        detail: available.length ? `Available languages: ${available.join(", ")}` : "Run scripts/scrape_qul.py --resources surah-info to generate it",
      },
      503
    );
  }

  const entry = data[String(n)];
  if (!entry) return c.json({ status: 404, type: "not_found", title: `No info found for surah ${n} in language '${lang}'` }, 404);

  return c.json({ data: { surah: n, lang, ...entry } });
});

export { surah };
