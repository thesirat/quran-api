import { Hono } from "hono";
import {
  loadVerseMeta,
  loadScript,
  loadWordsArabic,
  loadWordTranslation,
  loadCorpusMorphology,
  loadTranslation,
  loadTafsirChapter,
  loadPauseMarks,
  loadRecitations,
  loadAudioSegments,
  loadTransliteration,
  loadTransliterationCatalog,
  loadWordTransliteration,
  loadAyahThemes,
} from "../core/loader.js";
import type { VerseData, WordData, TranslationEntry, TafsirAyah, RecitationEntry } from "../core/types.js";
import { apiError } from "../core/errors.js";
import { validateVerseKey, validateScript, VALID_SCRIPTS } from "../core/validation.js";

const verse = new Hono();

// ---------------------------------------------------------------------------
// GET /v1/verse/:key
// Query: ?translations=131,85 &words=true &morphology=true &tafsir=140 &script=uthmani
// ---------------------------------------------------------------------------
verse.get("/:key", async (c) => {
  const parsed = validateVerseKey(c.req.param("key"));
  if (!parsed) return apiError(c, 400, "invalid_key", "Invalid verse key");

  const { surah, ayah } = parsed;
  const key = `${surah}:${ayah}`;

  const script = validateScript(c.req.query("script"));
  if (!script) {
    return apiError(c, 400, "invalid_param", `Unknown script. Valid: ${VALID_SCRIPTS.join(", ")}`);
  }

  const [verseMeta, scriptText] = await Promise.all([loadVerseMeta(), loadScript(script)]);

  const meta = verseMeta[key];
  const text = scriptText[key];
  if (!meta || text === undefined) {
    return apiError(c, 404, "not_found", "Verse not found", `Key '${key}' does not exist`);
  }

  const result: VerseData = { key, surah, ayah, text, meta };

  const q = c.req.query();

  // Optional: embed words
  if (q.words === "true") {
    result.words = await buildWords(key, meta.words_count, {
      translationLang: q.word_translation ?? q.lang,
      transliterationLang: q.word_transliteration ?? q.lang,
    });
  }

  // Optional: embed verse-level transliteration (alias lang, e.g. ?transliteration=en)
  if (q.transliteration) {
    const tMap = await loadTransliteration(q.transliteration);
    const text = tMap?.[key];
    if (text !== undefined) result.transliteration = text;
  }

  // Optional: embed translations (graceful partial on failure)
  if (q.translations) {
    const ids = q.translations.split(",").map((s) => s.trim()).filter(Boolean);
    result.translations = {};
    const entries = await Promise.allSettled(ids.map((id) => loadTranslation(id)));
    for (let i = 0; i < ids.length; i++) {
      const entry = entries[i];
      if (entry.status === "fulfilled") {
        const t = entry.value?.[key];
        if (t) result.translations[ids[i]] = t;
      } else {
        result.translations[ids[i]] = { text: "", _error: "unavailable" } as unknown as TranslationEntry;
      }
    }
  }

  // Optional: embed morphology (graceful on failure)
  if (q.morphology === "true") {
    try {
      const corpus = await loadCorpusMorphology();
      result.morphology = {};
      for (let w = 1; w <= meta.words_count; w++) {
        const wk = `${key}:${w}`;
        const entry = corpus[wk];
        if (entry) result.morphology[wk] = entry.segments;
      }
    } catch {
      // morphology unavailable — omit silently
    }
  }

  // Optional: embed one tafsir (graceful on failure)
  if (q.tafsir) {
    try {
      const chapter = await loadTafsirChapter(q.tafsir, surah);
      const ayahEntry = chapter?.ayahs.find((a: TafsirAyah) => a.ayah === ayah);
      if (ayahEntry) {
        (result as unknown as Record<string, unknown>).tafsir = { id: q.tafsir, text: ayahEntry.text };
      }
    } catch {
      // tafsir unavailable — omit silently
    }
  }

  return c.json({ data: result });
});

// ---------------------------------------------------------------------------
// GET /v1/verse/:key/words
// ---------------------------------------------------------------------------
verse.get("/:key/words", async (c) => {
  const parsed = validateVerseKey(c.req.param("key"));
  if (!parsed) return apiError(c, 400, "invalid_key", "Invalid verse key");

  const { surah, ayah } = parsed;
  const key = `${surah}:${ayah}`;
  const meta = (await loadVerseMeta())[key];
  if (!meta) return apiError(c, 404, "not_found", "Verse not found");

  const lang = c.req.query("lang");
  const words = await buildWords(key, meta.words_count, {
    translationLang: c.req.query("word_translation") ?? lang,
    transliterationLang: c.req.query("word_transliteration") ?? lang,
  });
  return c.json({ data: words });
});

// ---------------------------------------------------------------------------
// GET /v1/verse/:key/morphology
// ---------------------------------------------------------------------------
verse.get("/:key/morphology", async (c) => {
  const parsed = validateVerseKey(c.req.param("key"));
  if (!parsed) return apiError(c, 400, "invalid_key", "Invalid verse key");

  const key = `${parsed.surah}:${parsed.ayah}`;
  const [meta, corpus] = await Promise.all([loadVerseMeta(), loadCorpusMorphology()]);
  if (!meta[key]) return apiError(c, 404, "not_found", "Verse not found");

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
  const parsed = validateVerseKey(c.req.param("key"));
  if (!parsed) return apiError(c, 400, "invalid_key", "Invalid verse key");

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
  const parsed = validateVerseKey(c.req.param("key"));
  if (!parsed) return apiError(c, 400, "invalid_key", "Invalid verse key");

  const { surah, ayah } = parsed;
  const tafsirId = c.req.param("id");
  const chapter = await loadTafsirChapter(tafsirId, surah);
  if (!chapter) return apiError(c, 404, "not_found", "Tafsir not found", `Tafsir ${tafsirId} has no data for surah ${surah}`);

  const entry = chapter.ayahs.find((a: TafsirAyah) => a.ayah === ayah);
  if (!entry) return apiError(c, 404, "not_found", "Tafsir entry not found");

  return c.json({ data: entry });
});

// ---------------------------------------------------------------------------
// GET /v1/verse/:key/audio
// ---------------------------------------------------------------------------
verse.get("/:key/audio", async (c) => {
  const parsed = validateVerseKey(c.req.param("key"));
  if (!parsed) return apiError(c, 400, "invalid_key", "Invalid verse key");

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
  const parsed = validateVerseKey(c.req.param("key"));
  if (!parsed) return apiError(c, 400, "invalid_key", "Invalid verse key");

  const key = `${parsed.surah}:${parsed.ayah}`;
  const rid = c.req.param("recitationId");
  const segments = await loadAudioSegments(rid);
  if (!segments) return apiError(c, 404, "not_found", "Recitation not found");

  const entry = segments[key];
  if (!entry) return apiError(c, 404, "not_found", "Timestamps not found for this verse");

  return c.json({ data: { verse_key: key, recitation_id: rid, segments: entry } });
});

// ---------------------------------------------------------------------------
// GET /v1/verse/:key/transliteration
// Query: ?lang=en (default "en")
// ---------------------------------------------------------------------------
verse.get("/:key/transliteration", async (c) => {
  const parsed = validateVerseKey(c.req.param("key"));
  if (!parsed) return apiError(c, 400, "invalid_key", "Invalid verse key");

  const key = `${parsed.surah}:${parsed.ayah}`;
  const lang = c.req.query("lang") ?? "en";
  const data = await loadTransliteration(lang);
  if (!data) {
    const catalog = await loadTransliterationCatalog();
    const available = catalog.filter((e) => e.type !== "word").map((e) => e.lang).join(", ");
    return apiError(
      c,
      404,
      "not_found",
      `Transliteration for '${lang}' not available`,
      available ? `Available languages: ${available}` : "Run scripts/scrape_qul.py --resources transliteration to generate it",
    );
  }

  const text = data[key];
  if (text === undefined) return apiError(c, 404, "not_found", "Transliteration not found for this verse");

  return c.json({ data: { verse_key: key, lang, text } });
});

// ---------------------------------------------------------------------------
// GET /v1/verse/:key/theme
// ---------------------------------------------------------------------------
verse.get("/:key/theme", async (c) => {
  const parsed = validateVerseKey(c.req.param("key"));
  if (!parsed) return apiError(c, 400, "invalid_key", "Invalid verse key");

  const key = `${parsed.surah}:${parsed.ayah}`;
  const allThemes = await loadAyahThemes();
  if (!allThemes) {
    return apiError(c, 503, "data_unavailable", "Ayah themes not available", "Run scripts/scrape_qul.py --resources ayah-themes to generate it");
  }

  const themes = allThemes[key] ?? [];
  return c.json({ data: { verse_key: key, themes } });
});

// ---------------------------------------------------------------------------
// Internal helper: build word list for a verse
// ---------------------------------------------------------------------------
interface BuildWordsOptions {
  translationLang?: string;
  transliterationLang?: string;
}

async function buildWords(
  verseKey: string,
  wordCount: number,
  opts: BuildWordsOptions = {},
): Promise<WordData[]> {
  const [wordsArabic, pauseMarks, wordTranslation, wordTransliteration] = await Promise.all([
    loadWordsArabic(),
    loadPauseMarks(),
    opts.translationLang ? loadWordTranslation(opts.translationLang) : Promise.resolve(undefined),
    opts.transliterationLang ? loadWordTransliteration(opts.transliterationLang) : Promise.resolve(undefined),
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
      transliteration: wordTransliteration?.[wk],
      pause_mark: pauseMarks?.[wk],
    });
  }
  return words;
}

export { verse };
