import { Hono } from "hono";
import { analyticsMiddleware } from "./middleware/analytics.js";
import { cacheMiddleware } from "./middleware/cache.js";
import { corsMiddleware } from "./middleware/cors.js";
import { verse } from "./routes/verse.js";
import { surah } from "./routes/surah.js";
import { collection } from "./routes/collection.js";
import { morphology } from "./routes/morphology.js";
import { search } from "./routes/search.js";
import { topics } from "./routes/topics.js";
import { mutashabihat } from "./routes/mutashabihat.js";
import { catalog } from "./routes/catalog.js";
import { mushaf } from "./routes/mushaf.js";
import { structure } from "./routes/structure.js";
import { similarAyahs } from "./routes/similar-ayahs.js";

const app = new Hono();

app.use("*", corsMiddleware);
app.use("*", cacheMiddleware);
app.use("*", analyticsMiddleware);

// ---------------------------------------------------------------------------
// Health + meta
// ---------------------------------------------------------------------------
app.get("/", (c) =>
  c.json({
    name: "Quran API",
    version: "1.0.0",
    docs: "https://github.com/your-repo/quran-api",
    sources: ["qul.tarteel.ai (MIT)", "corpus.quran.com (GPL)", "tanzil.net"],
    endpoints: {
      // Verse
      verse: "/v1/verse/:key",
      verse_words: "/v1/verse/:key/words",
      verse_morphology: "/v1/verse/:key/morphology",
      verse_translations: "/v1/verse/:key/translations",
      verse_tafsir: "/v1/verse/:key/tafsir/:id",
      verse_audio: "/v1/verse/:key/audio",
      verse_timestamps: "/v1/verse/:key/timestamps/:recitationId",
      // Surah
      surahs: "/v1/surahs",
      surah: "/v1/surah/:n",
      surah_verses: "/v1/surah/:n/verses",
      surah_tafsir: "/v1/surah/:n/tafsir/:id",
      // Structural collections
      page: "/v1/page/:n",
      juz: "/v1/juz/:n",
      hizb: "/v1/hizb/:n",
      ruku: "/v1/ruku/:n",
      manzil: "/v1/manzil/:n",
      rub_el_hizb: "/v1/rub-el-hizb/:n",
      mushaf: "/v1/mushaf/:n",
      // Morphology & search
      morphology: "/v1/morphology/:word_key",
      search_root: "/v1/search/root/:root",
      search_lemma: "/v1/search/lemma/:lemma",
      search_word: "/v1/search/word/:word",
      // Topics
      topics: "/v1/topics",
      topic: "/v1/topics/:slug",
      // Mutashabihat
      mutashabihat_list: "/v1/mutashabihat",
      mutashabihat: "/v1/mutashabihat/:key",
      // Similar ayahs
      similar_ayahs_list: "/v1/similar-ayahs",
      similar_ayahs: "/v1/similar-ayahs/:key",
      // Transliteration
      transliterations: "/v1/transliterations",
      verse_transliteration: "/v1/verse/:key/transliteration",
      // Surah info
      surah_info: "/v1/surah/:n/info",
      // Ayah themes
      ayah_themes: "/v1/ayah-themes",
      verse_theme: "/v1/verse/:key/theme",
      // Catalogs
      translations: "/v1/translations",
      tafsirs: "/v1/tafsirs",
      tafsir_info: "/v1/tafsirs/:id",
      tafsir_coverage: "/v1/tafsirs/:id/surahs",
      recitations: "/v1/recitations",
      word_translations: "/v1/word-translations",
      // Structure
      structure: "/v1/structure",
    },
  })
);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.route("/v1/verse", verse);
app.route("/v1/surahs", surah);       // list all
app.route("/v1/surah", surah);        // /v1/surah/:n + /v1/surah/:n/verses
app.route("/v1", collection);         // /v1/page, /v1/juz, /v1/hizb, /v1/ruku, /v1/manzil, /v1/rub-el-hizb
app.route("/v1", mushaf);             // /v1/mushaf/:n
app.route("/v1/morphology", morphology);
app.route("/v1/search", search);
app.route("/v1/topics", topics);
app.route("/v1/mutashabihat", mutashabihat);
app.route("/v1/similar-ayahs", similarAyahs);
app.route("/v1", catalog);            // /v1/translations, /v1/tafsirs, /v1/recitations, /v1/word-translations, /v1/transliterations, /v1/ayah-themes
app.route("/v1", structure);          // /v1/structure

// ---------------------------------------------------------------------------
// 404 catch-all
// ---------------------------------------------------------------------------
app.notFound((c) =>
  c.json({ status: 404, type: "not_found", title: "Endpoint not found" }, 404)
);

app.onError((err, c) => {
  console.error(err);
  return c.json({ status: 500, type: "internal_error", title: "Internal server error" }, 500);
});

export default app;
