import { Hono } from "hono";
import {
  loadVerseMeta,
  loadScript,
  VALID_SCRIPTS,
  type ScriptName,
  loadWordsArabic,
  loadWordTranslation,
  loadCorpusMorphology,
  loadTranslation,
  loadTafsirChapter,
  loadPauseMarks,
  loadRecitations,
  loadAudioSegments,
  loadTransliteration,
  loadAyahThemes,
} from "../core/loader.js";
import type { VerseData, WordData, TranslationEntry, TafsirAyah, RecitationEntry } from "../core/types.js";

const verse = new Hono();

// ---------------------------------------------------------------------------
// Parse and validate a verse key like "2:255"
// ---------------------------------------------------------------------------
function parseKey(raw: string): { surah: number; ayah: number } | null {
  const parts = raw.split(":");
  if (parts.length !== 2) return null;
  const [s, a] = parts.map(Number);
  if (!Number.isInteger(s) || !Number.isInteger(a) || s < 1 || s > 114 || a < 1) return null;
  return { surah: s, ayah: a };
}

// ---------------------------------------------------------------------------
// GET /v1/verse/:key
// Query: ?translations=131,85 &words=true &morphology=true &tafsir=140 &script=uthmani
// ---------------------------------------------------------------------------
verse.get("/:key", async (c) => {
  const parsed = parseKey(c.req.param("key"));
  if (!parsed) return c.json({ status: 400, type: "invalid_key", title: "Invalid verse key" }, 400);

  const { surah, ayah } = parsed;
  const key = `${surah}:${ayah}`;

  const scriptParam = c.req.query("script") ?? "uthmani";
  if (!(VALID_SCRIPTS as readonly string[]).includes(scriptParam)) {
    return c.json({ status: 400, type: "invalid_param", title: `Unknown script. Valid: ${VALID_SCRIPTS.join(", ")}` }, 400);
  }
  const script = scriptParam as ScriptName;

  const [verseMeta, scriptText] = await Promise.all([loadVerseMeta(), loadScript(script)]);

  const meta = verseMeta[key];
  const text = scriptText[key];
  if (!meta || text === undefined) {
    return c.json({ status: 404, type: "not_found", title: "Verse not found", detail: `Key '${key}' does not exist` }, 404);
  }

  const result: VerseData = { key, surah, ayah, text, meta };

  // Optional: embed words
  const q = c.req.query();
  if (q.words === "true") {
    result.words = await buildWords(key, meta.words_count, q.lang);
  }

  // Optional: embed translations
  if (q.translations) {
    const ids = q.translations.split(",").map((s) => s.trim()).filter(Boolean);
    const entries = await Promise.all(ids.map((id) => loadTranslation(id)));
    result.translations = {};
    for (let i = 0; i < ids.length; i++) {
      const t = entries[i]?.[key];
      if (t) result.translations[ids[i]] = t;
    }
  }

  // Optional: embed morphology
  if (q.morphology === "true") {
    const corpus = await loadCorpusMorphology();
    result.morphology = {};
    for (let w = 1; w <= meta.words_count; w++) {
      const wk = `${key}:${w}`;
      const entry = corpus[wk];
      if (entry) result.morphology[wk] = entry.segments;
    }
  }

  // Optional: embed one tafsir
  if (q.tafsir) {
    const chapter = await loadTafsirChapter(q.tafsir, surah);
    const ayahEntry = chapter?.ayahs.find((a: TafsirAyah) => a.ayah === ayah);
    if (ayahEntry) {
      (result as unknown as Record<string, unknown>).tafsir = { id: q.tafsir, text: ayahEntry.text };
    }
  }

  return c.json({ data: result });
});

// ---------------------------------------------------------------------------
// GET /v1/verse/:key/words
// ---------------------------------------------------------------------------
verse.get("/:key/words", async (c) => {
  const parsed = parseKey(c.req.param("key"));
  if (!parsed) return c.json({ status: 400, type: "invalid_key", title: "Invalid verse key" }, 400);

  const { surah, ayah } = parsed;
  const key = `${surah}:${ayah}`;
  const meta = (await loadVerseMeta())[key];
  if (!meta) return c.json({ status: 404, type: "not_found", title: "Verse not found" }, 404);

  const lang = c.req.query("lang");
  const words = await buildWords(key, meta.words_count, lang);
  return c.json({ data: words });
});

// ---------------------------------------------------------------------------
// GET /v1/verse/:key/morphology
// ---------------------------------------------------------------------------
verse.get("/:key/morphology", async (c) => {
  const parsed = parseKey(c.req.param("key"));
  if (!parsed) return c.json({ status: 400, type: "invalid_key", title: "Invalid verse key" }, 400);

  const key = `${parsed.surah}:${parsed.ayah}`;
  const [meta, corpus] = await Promise.all([loadVerseMeta(), loadCorpusMorphology()]);
  if (!meta[key]) return c.json({ status: 404, type: "not_found", title: "Verse not found" }, 404);

  const result: Record<string, unknown> = {};
  for (let w = 1; w <= meta[key].words_count; w++) {
    const wk = `${key}:${w}`;
    if (corpus[wk]) result[wk] = corpus[wk].segments;
  }
  return c.json({ data: result });
});

// ---------------------------------------------------------------------------
// GET /v1/verse/:key/translations?ids=131,85
// ---------------------------------------------------------------------------
verse.get("/:key/translations", async (c) => {
  const parsed = parseKey(c.req.param("key"));
  if (!parsed) return c.json({ status: 400, type: "invalid_key", title: "Invalid verse key" }, 400);

  const key = `${parsed.surah}:${parsed.ayah}`;
  const idsParam = c.req.query("ids");

  let ids: string[];
  if (idsParam) {
    ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
  } else {
    return c.json({ data: { message: "Specify ?ids= to retrieve translations", hint: "GET /v1/translations for catalog" } });
  }

  const entries = await Promise.all(ids.map((id) => loadTranslation(id)));
  const result: Record<string, TranslationEntry | null> = {};
  for (let i = 0; i < ids.length; i++) {
    result[ids[i]] = entries[i]?.[key] ?? null;
  }
  return c.json({ data: result });
});

// ---------------------------------------------------------------------------
// GET /v1/verse/:key/tafsir/:id
// ---------------------------------------------------------------------------
verse.get("/:key/tafsir/:id", async (c) => {
  const parsed = parseKey(c.req.param("key"));
  if (!parsed) return c.json({ status: 400, type: "invalid_key", title: "Invalid verse key" }, 400);

  const { surah, ayah } = parsed;
  const tafsirId = c.req.param("id");
  const chapter = await loadTafsirChapter(tafsirId, surah);
  if (!chapter) return c.json({ status: 404, type: "not_found", title: "Tafsir not found", detail: `Tafsir ${tafsirId} has no data for surah ${surah}` }, 404);

  const entry = chapter.ayahs.find((a: TafsirAyah) => a.ayah === ayah);
  if (!entry) return c.json({ status: 404, type: "not_found", title: "Tafsir entry not found" }, 404);

  return c.json({ data: entry });
});

// ---------------------------------------------------------------------------
// GET /v1/verse/:key/audio
// ---------------------------------------------------------------------------
verse.get("/:key/audio", async (c) => {
  const parsed = parseKey(c.req.param("key"));
  if (!parsed) return c.json({ status: 400, type: "invalid_key", title: "Invalid verse key" }, 400);

  const { surah, ayah } = parsed;
  const recitations = await loadRecitations();

  const surahPad = String(surah).padStart(3, "0");
  const ayahPad = String(ayah).padStart(3, "0");
  const filename = `${surahPad}${ayahPad}.mp3`;

  const result = recitations.map((r: RecitationEntry) => ({
    id: r.id,
    name: r.name,
    reciter: r.reciter,
    style: r.style,
    audio_format: r.audio_format,
    files_count: r.files_count,
    url: r.relative_path
      ? `https://audio.qurancdn.com/${r.relative_path}${filename}`
      : `https://everyayah.com/data/${encodeURIComponent(r.reciter ?? "Alafasy_128kbps")}/${filename}`,
    has_timestamps: (r.segments_count ?? 0) > 0,
  }));

  return c.json({ data: result });
});

// ---------------------------------------------------------------------------
// GET /v1/verse/:key/timestamps/:recitationId
// ---------------------------------------------------------------------------
verse.get("/:key/timestamps/:recitationId", async (c) => {
  const parsed = parseKey(c.req.param("key"));
  if (!parsed) return c.json({ status: 400, type: "invalid_key", title: "Invalid verse key" }, 400);

  const key = `${parsed.surah}:${parsed.ayah}`;
  const rid = c.req.param("recitationId");
  const segments = await loadAudioSegments(rid);
  if (!segments) return c.json({ status: 404, type: "not_found", title: "Recitation not found" }, 404);

  const entry = segments[key];
  if (!entry) return c.json({ status: 404, type: "not_found", title: "Timestamps not found for this verse" }, 404);

  return c.json({ data: { verse_key: key, recitation_id: rid, segments: entry } });
});

// ---------------------------------------------------------------------------
// GET /v1/verse/:key/transliteration
// Query: ?lang=en (default "en")
// ---------------------------------------------------------------------------
verse.get("/:key/transliteration", async (c) => {
  const parsed = parseKey(c.req.param("key"));
  if (!parsed) return c.json({ status: 400, type: "invalid_key", title: "Invalid verse key" }, 400);

  const key = `${parsed.surah}:${parsed.ayah}`;
  const lang = c.req.query("lang") ?? "en";
  const data = await loadTransliteration(lang);
  if (!data) {
    return c.json(
      { status: 503, type: "data_unavailable", title: `Transliteration for '${lang}' not available`, detail: "Run scripts/scrape_qul.py --resources transliteration to generate it" },
      503
    );
  }

  const text = data[key];
  if (text === undefined) return c.json({ status: 404, type: "not_found", title: "Transliteration not found for this verse" }, 404);

  return c.json({ data: { verse_key: key, lang, text } });
});

// ---------------------------------------------------------------------------
// GET /v1/verse/:key/theme
// ---------------------------------------------------------------------------
verse.get("/:key/theme", async (c) => {
  const parsed = parseKey(c.req.param("key"));
  if (!parsed) return c.json({ status: 400, type: "invalid_key", title: "Invalid verse key" }, 400);

  const key = `${parsed.surah}:${parsed.ayah}`;
  const allThemes = await loadAyahThemes();
  if (!allThemes) {
    return c.json(
      { status: 503, type: "data_unavailable", title: "Ayah themes not available", detail: "Run scripts/scrape_qul.py --resources ayah-themes to generate it" },
      503
    );
  }

  const themes = allThemes[key] ?? [];
  return c.json({ data: { verse_key: key, themes } });
});

// ---------------------------------------------------------------------------
// Internal helper: build word list for a verse
// ---------------------------------------------------------------------------
async function buildWords(verseKey: string, wordCount: number, lang?: string): Promise<WordData[]> {
  const [wordsArabic, pauseMarks, wordTranslation] = await Promise.all([
    loadWordsArabic(),
    loadPauseMarks(),
    lang ? loadWordTranslation(lang) : Promise.resolve(undefined),
  ]);

  const words: WordData[] = [];
  for (let w = 1; w <= wordCount; w++) {
    const wk = `${verseKey}:${w}`;
    const raw = wordsArabic[wk];
    if (!raw) continue;
    words.push({
      key: wk,
      text: raw.text,
      text_indopak: raw.text_indopak ?? undefined,
      code_v1: raw.code_v1 ?? undefined,
      code_v2: raw.code_v2 ?? undefined,
      position: raw.position ?? w,
      page: raw.page ?? undefined,
      line: raw.line ?? undefined,
      type: raw.type ?? undefined,
      translation: wordTranslation?.[wk],
      pause_mark: pauseMarks?.[wk],
    });
  }
  return words;
}

export { verse };
