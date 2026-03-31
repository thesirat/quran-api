import { Hono } from "hono";
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

const app = new Hono();

app.use("*", corsMiddleware);
app.use("*", cacheMiddleware);

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
      verse: "/v1/verse/:key",
      surah: "/v1/surah/:n",
      surahs: "/v1/surahs",
      page: "/v1/page/:n",
      juz: "/v1/juz/:n",
      hizb: "/v1/hizb/:n",
      ruku: "/v1/ruku/:n",
      morphology: "/v1/morphology/:word_key",
      search_root: "/v1/search/root/:root",
      search_lemma: "/v1/search/lemma/:lemma",
      search_word: "/v1/search/word/:word",
      topics: "/v1/topics",
      mutashabihat: "/v1/mutashabihat/:key",
      translations: "/v1/translations",
      tafsirs: "/v1/tafsirs",
      recitations: "/v1/recitations",
    },
  })
);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.route("/v1/verse", verse);
app.route("/v1/surahs", surah);       // list all
app.route("/v1/surah", surah);        // /v1/surah/:n + /v1/surah/:n/verses
app.route("/v1", collection);         // /v1/page, /v1/juz, /v1/hizb, /v1/ruku
app.route("/v1/morphology", morphology);
app.route("/v1/search", search);
app.route("/v1/topics", topics);
app.route("/v1/mutashabihat", mutashabihat);
app.route("/v1", catalog);            // /v1/translations, /v1/tafsirs, /v1/recitations

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
