# Quran API — Reference Documentation

## Overview

A high-performance, read-only REST API for the Holy Quran, built on open datasets.
Deployed on Vercel Edge Network with global CDN caching.

**Base URL**
```
https://<your-deployment>.vercel.app
```

**Versioning**
All endpoints are prefixed with `/v1/`. The root `GET /` returns a machine-readable endpoint index.

**Data Sources**

| Source | License | Data |
|---|---|---|
| [QUL — Tarteel AI](https://qul.tarteel.ai/resources/) | MIT | Arabic text (28 scripts), 209 translations, 16 word-by-word translations, 150+ tafsirs (30+ languages), 152 recitations + segment timestamps, Mushaf layouts, Quran fonts (woff/woff2/ttf/otf/json/ligatures per resource), verse-level metadata (page, juz, hizb, rub el hizb, ruku, manzil, sajda) for `/v1/structure`, 77k morphology records, pause marks, 2,512 topics, Mutashabihat (5,277 pairs), similar ayahs (4,001 pairs), ayah themes (1,049), transliteration (9 resources), surah info (9 languages) |
| [mustafa0x/quran-morphology](https://github.com/mustafa0x/quran-morphology) + [MASAQ](https://github.com/umarcodes/masaq-quran-morphology-csv) (merged) | GPL | Sub-word segments: POS, case, mood, voice, lemma, root, plus optional **syntax** (role, declinability, case/mood label, English gloss) from MASAQ. Built by `scripts/sync_morphology.py` into `data/morphology/enriched_data.json` (see [Morphology](#morphology)). |

---

## Response Format

All successful responses use a standard envelope:

```json
{
  "data": { ... },
  "meta": { "total": 6236, "limit": 10, "offset": 0 }
}
```

`meta` is only present on paginated or collection endpoints.

### Error Format (RFC 7807)

```json
{
  "status": 404,
  "type": "not_found",
  "title": "Verse not found",
  "detail": "Key '999:1' does not exist"
}
```

| `type` | HTTP status | Meaning |
|---|---|---|
| `not_found` | 404 | Resource does not exist (verse, font id, font file, etc.) |
| `invalid_key` | 400 | Malformed verse/word key |
| `invalid_param` | 400 | Out-of-range or invalid query parameter |
| `unavailable` | 503 | Data file not yet synced |
| `data_unavailable` | 503 | Optional dataset missing (e.g. catalog not generated yet) |
| `rate_limited` | 429 | Too many requests (see [Rate Limiting](#rate-limiting)) |
| `internal_error` | 500 | Unexpected server error |

---

## Authentication

None. All endpoints are public and require no API key.

---

## Caching

Every `GET` response includes:

```
Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800
ETag: "<commit-sha>"
Vary: Accept-Encoding
```

- Vercel Edge caches responses globally for 24 hours.
- Stale responses are served for up to 7 days while revalidating in the background.
- Send `If-None-Match: "<etag>"` to receive `304 Not Modified` when data hasn't changed. The ETag check runs **before** any handler logic, so cached clients skip all data loading.
- The cache is invalidated automatically on every weekly data sync (new commit → new ETag).

---

## Rate Limiting

The API enforces a per-IP sliding window rate limit:

| Setting | Default | Env var |
|---|---|---|
| Max requests per window | 100 | `RATE_LIMIT_MAX` |
| Window duration | 60 seconds | `RATE_LIMIT_WINDOW_MS` |

When exceeded, the API returns:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 42
```

```json
{ "status": 429, "type": "rate_limited", "title": "Too many requests" }
```

Set `RATE_LIMIT_MAX=0` to disable rate limiting entirely.

> **Note:** Rate limiting is per serverless instance. In Vercel's serverless architecture, each warm function instance maintains its own counter. For strict global rate limiting, use Vercel Edge Middleware or an external store.

---

## Request Logging

Every response includes an `X-Request-Id` header. If the client sends `X-Request-Id` in the request, that value is preserved; otherwise a new UUID is generated. This ID appears in structured JSON logs (Vercel function logs) for tracing.

Set `LOG_REQUESTS=false` to disable request logging.

---

## Deployment and corpus storage

The JSON corpus and font binaries live under the repository’s **`data/`** directory (paths such as `data/verses/meta.json`, `data/fonts/<id>/…`). The API reads them in two ways:

| Mode | When | Behavior |
|---|---|---|
| **Local** | `DATA_BASE_URL` is unset | Files are read from disk relative to the process working directory (typical local dev and `vercel dev` with a full checkout). |
| **Remote** | `DATA_BASE_URL` is set | Each file is fetched over HTTPS from `{DATA_BASE_URL}/{path}` (e.g. a pinned [GitHub raw](https://docs.github.com/en/repositories/working-with-files/using-files/viewing-and-understanding-files) URL: `https://raw.githubusercontent.com/<owner>/<repo>/<commit-or-tag>`). |

**Production on Vercel:** The `data/` tree is large, so it is **not** bundled into the serverless function (see `.vercelignore` / `vercel.json` `excludeFiles`). You should set **`DATA_BASE_URL`** in the project environment to a stable base URL whose tree matches the commit you deploy. After changing corpus layout or fonts, update the ref or regenerate `data/fonts/catalog.json` and push.

**Remote fetch reliability:** All remote data fetches use retry with exponential backoff (up to 2 retries, 200ms/800ms delays), a configurable timeout (default 10s for JSON, 15s for binary; override with `DATA_FETCH_TIMEOUT_MS` env var), and in-flight request deduplication (concurrent requests for the same file share one fetch). 4xx errors are not retried.

**Font listing in remote mode:** HTTP has no directory listing. The API uses **`data/fonts/catalog.json`** (generated by `npm run data:font-catalog` / `scripts/generate_font_catalog.py`) together with per-font `manifest.json` when present.

**Morphology (sub-word):** Segment morphology is read only from **`data/morphology/enriched_data.json`**. The API groups segment rows by word key `surah:ayah:word` at load time. Without this file, morphology endpoints error at runtime (generate it with **`scripts/sync_morphology.py`**). Optional whole-word QUL fields come from **`data/morphology/qul.json`** and are attached only on **`GET /v1/morphology/...`** (not in `GET /v1/verse/:key?morphology=true`).

**Root metadata:** `GET /` includes a `data` object so clients can see how the instance loads corpus files:

```json
"data": {
  "mode": "remote",
  "baseUrl": "https://raw.githubusercontent.com/org/quran-api/abc1234"
}
```

For local mode, `mode` is `"local"` and `baseUrl` is `null`.

---

## Verse Keys

Verses are identified by a colon-separated key:

| Key format | Example | Meaning |
|---|---|---|
| `surah:ayah` | `2:255` | Surah 2, Ayah 255 (Ayat al-Kursi) |
| `surah:ayah:word` | `2:255:1` | First word of 2:255 |

Valid ranges: surah `1–114`, ayah `1–286` (varies by surah).

---

## Endpoints

### Root

#### `GET /`

Returns API metadata and a full endpoint index.

**Response**
```json
{
  "name": "Quran API",
  "version": "1.0.0",
  "docs": "https://github.com/your-repo/quran-api",
  "sources": ["qul.tarteel.ai (MIT)", "mustafa0x/quran-morphology + MASAQ (GPL)"],
  "data": {
    "mode": "local",
    "baseUrl": null
  },
  "endpoints": {
    "verse": "/v1/verse/:key",
    "verse_words": "/v1/verse/:key/words",
    "verse_morphology": "/v1/verse/:key/morphology",
    "verse_translations": "/v1/verse/:key/translations",
    "verse_tafsir": "/v1/verse/:key/tafsir/:id",
    "verse_audio": "/v1/verse/:key/audio",
    "verse_timestamps": "/v1/verse/:key/timestamps/:recitationId",
    "surahs": "/v1/surahs",
    "surah": "/v1/surah/:n",
    "surah_verses": "/v1/surah/:n/verses",
    "surah_tafsir": "/v1/surah/:n/tafsir/:id",
    "page": "/v1/page/:n",
    "juz": "/v1/juz/:n",
    "hizb": "/v1/hizb/:n",
    "ruku": "/v1/ruku/:n",
    "manzil": "/v1/manzil/:n",
    "rub_el_hizb": "/v1/rub-el-hizb/:n",
    "mushaf": "/v1/mushaf/:n",
    "morphology": "/v1/morphology/:word_key",
    "search_root": "/v1/search/root/:root",
    "search_lemma": "/v1/search/lemma/:lemma",
    "search_word": "/v1/search/word/:word",
    "topics": "/v1/topics",
    "topic": "/v1/topics/:slug",
    "mutashabihat_list": "/v1/mutashabihat",
    "mutashabihat": "/v1/mutashabihat/:key",
    "translations": "/v1/translations",
    "tafsirs": "/v1/tafsirs",
    "tafsir_info": "/v1/tafsirs/:id",
    "tafsir_coverage": "/v1/tafsirs/:id/surahs",
    "recitations": "/v1/recitations",
    "word_translations": "/v1/word-translations",
    "fonts": "/v1/fonts",
    "font": "/v1/fonts/:id",
    "font_file": "/v1/fonts/:id/:filename",
    "transliterations": "/v1/transliterations",
    "verse_transliteration": "/v1/verse/:key/transliteration",
    "surah_info": "/v1/surah/:n/info",
    "similar_ayahs_list": "/v1/similar-ayahs",
    "similar_ayahs": "/v1/similar-ayahs/:key",
    "ayah_themes": "/v1/ayah-themes",
    "verse_theme": "/v1/verse/:key/theme",
    "structure": "/v1/structure",
    "health": "/v1/health"
  }
}
```

---

### Health

#### `GET /v1/health`

Returns the health status of the API, including whether data is available.

**Response (healthy)**
```json
{ "status": "ok", "data_mode": "local", "verse_count": 6236 }
```

**Response (unhealthy — 503)**
```json
{ "status": "error", "data_mode": "remote", "verse_count": 0 }
```

---

### Verse

#### `GET /v1/verse/:key`

Returns a single verse with its text and structural metadata.

**Path parameters**

| Parameter | Type | Description |
|---|---|---|
| `key` | string | Verse key, e.g. `1:1`, `2:255` |

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `translations` | string | — | Comma-separated translation IDs to embed, e.g. `131,85,20` |
| `words` | boolean | `false` | Embed word-by-word data |
| `morphology` | boolean | `false` | Embed sub-word morphology for all words (same segment shape as `GET /v1/verse/:key/morphology`; no per-word QUL block) |
| `tafsir` | number | — | Embed one tafsir by ID, e.g. `?tafsir=169` |
| `lang` | string | — | Word translation language when `words=true`, e.g. `en` |
| `script` | string | `uthmani` | Arabic script variant. One of: `uthmani`, `simple`, `indopak`, `tajweed`, `qpc-hafs` |

**Example**
```
GET /v1/verse/2:255?translations=131,85&words=true
```

**Response**
```json
{
  "data": {
    "key": "2:255",
    "surah": 2,
    "ayah": 255,
    "text": "ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلۡحَيُّ ٱلۡقَيُّومُۚ...",
    "meta": {
      "page": 42,
      "juz": 3,
      "hizb": 5,
      "ruku": 35,
      "manzil": 1,
      "words_count": 50,
      "sajdah": null
    },
    "translations": {
      "131": { "text": "Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence..." },
      "85":  { "text": "God, there is no god but He, the Living, the Self-Subsisting..." }
    },
    "words": [
      {
        "key": "2:255:1",
        "text": "ٱللَّهُ",
        "position": 1,
        "page": 42,
        "line": 1,
        "translation": "Allah"
      }
    ]
  }
}
```

---

#### `GET /v1/verse/:key/words`

Returns all words of a verse. The **`pause_mark`** field is set only when optional **`data/morphology/pause-marks.json`** is present; otherwise it is omitted or `null`.

**Query parameters**

| Parameter | Type | Description |
|---|---|---|
| `lang` | string | Word translation language, e.g. `en`, `ur`, `tr` |

**Response**
```json
{
  "data": [
    {
      "key": "1:1:1",
      "text": "بِسۡمِ",
      "text_indopak": "بِسۡمِ",
      "code_v1": "BISM",
      "position": 1,
      "page": 1,
      "line": 2,
      "type": "word",
      "translation": "In (the) name",
      "pause_mark": null
    }
  ]
}
```

---

#### `GET /v1/verse/:key/morphology`

Returns sub-word morphological segments for every word in the verse from **`data/morphology/enriched_data.json`** (MASAQ + mustafa merge). Each segment may include an optional **`syntax`** object from MASAQ (see the **Morphological features** table under [Morphology](#morphology)).

**Response**
```json
{
  "data": {
    "1:1:1": [
      {
        "form": "ب",
        "pos": "preposition",
        "segment_type": "prefix",
        "lemma": "ب",
        "syntax": {
          "role_ar": "PREP",
          "declinability": "INVAR",
          "case_mood": "INVARIABLE",
          "gloss": "in-(the)-name"
        }
      },
      {
        "form": "اسم",
        "pos": "noun",
        "segment_type": "stem",
        "gender": "masculine",
        "case": "genitive",
        "root": "سمو",
        "lemma": "اسْم",
        "syntax": {
          "role_ar": "PREP_OBJ",
          "declinability": "DECLN",
          "case_mood": "GENITIVE",
          "gloss": "in-(the)-name"
        }
      }
    ]
  }
}
```

---

#### `GET /v1/verse/:key/translations`

Returns translations for a verse.

**Query parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `ids` | string | Yes | Comma-separated translation IDs, e.g. `131,85,20` |

Without `?ids=`, returns a hint to use `GET /v1/translations` for the catalog.

**Response**
```json
{
  "data": {
    "131": {
      "text": "Allah - there is no deity except Him...",
      "footnotes": [
        { "id": 1, "text": "The name Allah is the proper name of God in Arabic..." }
      ]
    },
    "85": { "text": "God, there is no god but He..." }
  }
}
```

---

#### `GET /v1/verse/:key/tafsir/:id`

Returns the tafsir (exegesis) for a single verse.

**Path parameters**

| Parameter | Type | Description |
|---|---|---|
| `key` | string | Verse key, e.g. `2:255` |
| `id` | number | Tafsir resource ID (see `GET /v1/tafsirs`) |

**Response**
```json
{
  "data": {
    "surah": 2,
    "ayah": 255,
    "text": "<p>This is the greatest verse in the Quran...</p>",
    "group_from": null,
    "group_to": null
  }
}
```

---

#### `GET /v1/verse/:key/audio`

Returns audio URLs for all available reciters.

**Response**
```json
{
  "data": [
    {
      "id": 7,
      "name": "Mishary Rashid Alafasy",
      "reciter": "Alafasy_128kbps",
      "style": "Murattal",
      "url": "https://audio.qurancdn.com/mishary/002255.mp3",
      "has_timestamps": true
    }
  ]
}
```

---

#### `GET /v1/verse/:key/timestamps/:recitationId`

Returns word-level audio timestamps for a segmented recitation.

**Path parameters**

| Parameter | Type | Description |
|---|---|---|
| `key` | string | Verse key |
| `recitationId` | number | Recitation ID (see `GET /v1/recitations`, filter by `segments_count > 0`) |

**Response**
```json
{
  "data": {
    "verse_key": "2:255",
    "recitation_id": "7",
    "segments": [[0, 980], [980, 1540], [1540, 2300]]
  }
}
```

Each segment is `[start_ms, end_ms]` for the corresponding word.

---

### Surah

#### `GET /v1/surahs`

Returns metadata for all 114 surahs.

**Query parameters**

| Parameter | Type | Description |
|---|---|---|
| `revelation_place` | string | Filter by `mecca` or `medina` |

**Response**
```json
{
  "data": [
    {
      "id": 1,
      "name_arabic": "الفاتحة",
      "name_simple": "Al-Fatihah",
      "name_translation": "The Opening",
      "revelation_place": "meccan",
      "verses_count": 7,
      "pages": [1, 1]
    }
  ]
}
```

---

#### `GET /v1/surah/:n`

Returns surah metadata and all verse keys.

**Path parameters**: `n` — surah number `1–114`.

**Response**
```json
{
  "data": {
    "id": 2,
    "name_arabic": "البقرة",
    "name_simple": "Al-Baqarah",
    "name_translation": "The Cow",
    "revelation_place": "medinan",
    "verses_count": 286,
    "verse_keys": ["2:1", "2:2", "2:3", "..."]
  }
}
```

---

#### `GET /v1/surah/:n/verses`

Returns all verses of a surah. Supports pagination and the same query parameters as `GET /v1/verse/:key`.

**Query parameters**

| Parameter | Type | Default | Max | Description |
|---|---|---|---|---|
| `limit` | number | 286 | 286 | Verses per page |
| `offset` | number | 0 | — | Starting index |
| `translations` | string | — | — | Embed translations |
| `words` | boolean | `false` | — | Embed words |
| `morphology` | boolean | `false` | — | Embed morphology |
| `script` | string | `uthmani` | — | Arabic script variant (`uthmani`, `simple`, `indopak`, `tajweed`, `qpc-hafs`) |
| `fields` | string | all | — | Comma-separated field selection: `key`, `surah`, `ayah`, `text`, `meta`. Omitting `text` skips script loading. |
| `sort` | string | — | — | Sort verses: `field:asc` or `field:desc`. Fields: `surah`, `ayah`, `meta.page`, `meta.juz`, `meta.hizb`, `meta.ruku`. |

**Response**
```json
{
  "data": [
    { "key": "2:1", "surah": 2, "ayah": 1, "text": "الٓمٓ", "meta": { ... } }
  ],
  "meta": { "total": 286, "limit": 286, "offset": 0 }
}
```

---

### Collections

All collection endpoints accept the following optional query parameters and return the same response shape:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `script` | string | `uthmani` | Arabic script variant: `uthmani`, `simple`, `indopak`, `tajweed`, `qpc-hafs` |
| `fields` | string | all | Comma-separated field selection. Valid fields: `key`, `surah`, `ayah`, `text`, `meta`. When `text` is omitted, the script file is not loaded (faster response). |
| `sort` | string | — | Sort verses: `field:asc` or `field:desc`. Fields: `surah`, `ayah`, `meta.page`, `meta.juz`, `meta.hizb`, `meta.ruku`. Default order is surah:ayah. |

**Example:** `GET /v1/juz/1?fields=key,text` returns only `key` and `text` for each verse.

**Example (sorted):** `GET /v1/juz/1?sort=meta.page:desc` returns verses ordered by page descending.

Response shape:

```json
{
  "data": [ { "key": "1:1", "surah": 1, "ayah": 1, "text": "...", "meta": { ... } } ],
  "meta": { "<division>": 1, "total": 7 }
}
```

#### `GET /v1/page/:n`

Returns all verses on a Mushaf page.

**Path parameters**: `n` — page number `1–604`.

---

#### `GET /v1/juz/:n`

Returns all verses in a juz (one of 30 equal divisions).

**Path parameters**: `n` — juz number `1–30`.

---

#### `GET /v1/hizb/:n`

Returns all verses in a hizb (one of 60 equal divisions, 2 per juz).

**Path parameters**: `n` — hizb number `1–60`.

---

#### `GET /v1/ruku/:n`

Returns all verses in a ruku (thematic section used in prayer).

**Path parameters**: `n` — ruku number (positive integer; varies by surah).

---

#### `GET /v1/manzil/:n`

Returns all verses in a manzil (one of 7 weekly portions used for recitation).

**Path parameters**: `n` — manzil number `1–7`.

---

#### `GET /v1/rub-el-hizb/:n`

Returns all verses in a rub el hizb (quarter-hizb; one of 240 equal divisions).

**Path parameters**: `n` — rub el hizb number `1–240`.

---

### Mushaf Layout

#### `GET /v1/mushaf/:n`

Returns full Mushaf layout data for a page — including line/word counts, verse-to-line mapping, and all verse texts. Unlike `GET /v1/page/:n`, this endpoint adds the QPC layout metadata needed to render a visual Mushaf.

**Path parameters**: `n` — page number `1–604`.

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `script` | string | `uthmani` | Arabic script variant (`uthmani`, `simple`, `indopak`, `tajweed`, `qpc-hafs`) |

**Response**
```json
{
  "data": {
    "page": 1,
    "lines_count": 15,
    "words_count": 29,
    "verse_mapping": { "1:1": "1-4", "1:2": "5-7" },
    "first_verse": "1:1",
    "last_verse": "1:7",
    "verses": [
      { "key": "1:1", "surah": 1, "ayah": 1, "text": "...", "meta": { ... } }
    ]
  }
}
```

---

### Structure

#### `GET /v1/structure`

Returns a **Tanzil-shaped** structural index (same key names as classic `quran-data.js`: `Sura`, `Juz`, `HizbQaurter`, `Manzil`, `Ruku`, `Page`, `Sajda`) built from QUL verse metadata (`data/verses/meta.json`). Per-ayah fields remain on each verse via `GET /v1/verse/:key`.

**Response**
```json
{
  "data": { ... }
}
```

Returns `503` if verse metadata has not been synced yet (run `scripts/scrape_qul.py` with **quran-metadata** included, e.g. `--resources all`).

---

### Morphology

Segment morphology is read only from **`data/morphology/enriched_data.json`**. The **`qul`** field in the response below is filled from **`data/morphology/qul.json`** when that file exists.

#### `GET /v1/morphology/:word_key`

Returns full morphological analysis for a single word: **sub-word segments** from the enriched file plus optional **QUL** whole-word fields (`pos`, `root`, `lemma`, `stem`) when `qul.json` is available.

**Path parameters**: `word_key` — three-part key, e.g. `2:255:1`.

**Response**
```json
{
  "data": {
    "word_key": "2:255:1",
    "segments": [
      {
        "form": "ٱللَّهُ",
        "pos": "proper_noun",
        "segment_type": "stem",
        "case": "nominative",
        "state": "definite",
        "syntax": {
          "role_ar": "SUBJ",
          "declinability": "DECLN",
          "case_mood": "NOMINATIVE",
          "gloss": "allah"
        }
      }
    ],
    "qul": {
      "pos": "PN",
      "root": "اله",
      "lemma": "ٱللَّه",
      "stem": "الله"
    }
  }
}
```

**Morphological POS tags**

| Tag | Full name |
|---|---|
| `noun` | Noun |
| `proper_noun` | Proper noun |
| `verb` | Verb |
| `adjective` | Adjective |
| `pronoun` | Pronoun |
| `demonstrative` | Demonstrative pronoun |
| `relative` | Relative pronoun |
| `preposition` | Preposition |
| `conjunction` | Conjunction |
| `negative_particle` | Negation particle |
| `interrogative` | Interrogative particle |
| `future_particle` | Future particle (سَ / سَوْفَ) |
| `conditional` | Conditional particle |
| `vocative_particle` | Vocative particle (يَا) |
| `quranic_initial` | Disconnected letters (حروف مقطعة) |

**Morphological features**

| Feature | Values |
|---|---|
| `gender` | `masculine`, `feminine` |
| `number` | `singular`, `dual`, `plural` |
| `case` | `nominative`, `accusative`, `genitive` |
| `state` | `definite`, `indefinite` |
| `aspect` | `perfect`, `imperfect`, `imperative` |
| `voice` | `active`, `passive` |
| `mood` | `indicative`, `subjunctive`, `jussive` |
| `person` | `first`, `second`, `third` |
| `verb_form` | `I` – `XII` (Arabic verb form) |
| `segment_type` | `prefix`, `stem`, `suffix` |
| `syntax` | Optional MASAQ object: `role_ar`, `declinability`, `case_mood`, `gloss` (strings; any field may be omitted) |

---

### Search

All search endpoints support optional pagination and sorting:

| Parameter | Type | Default | Max | Description |
|---|---|---|---|---|
| `limit` | number | 50 | 1000 | Results per page |
| `offset` | number | 0 | — | Starting index |
| `sort` | string | — | — | Sort results: `word_key:asc` or `word_key:desc`. Default order is surah:ayah:word. |

#### `GET /v1/search/root/:root`

Returns all word keys where **any sub-word segment** in **`data/morphology/enriched_data.json`** carries that **`root`** string (same source as morphology). Word keys are sorted by `surah:ayah:word`.

**Path parameters**: `root` — URL-encoded Arabic root, e.g. `سمو`, `ذكر`, `رحم`. Matching is **exact** on the segment `root` field (normalization is up to the client).

Returns **`503`** with `type: "unavailable"` if **`enriched_data.json`** is not available.

**Response**
```json
{
  "data": {
    "root": "سمو",
    "word_keys": ["1:1:1", "11:41:4", "56:74:1"],
    "count": 3
  }
}
```

---

#### `GET /v1/search/lemma/:lemma`

Returns all word keys where **any segment** has that **`lemma`** value in enriched morphology (same rules as root search: exact string match on segment `lemma`, index built from **`enriched_data.json`**).

**Path parameters**: `lemma` — URL-encoded Arabic lemma.

Returns **`503`** with `type: "unavailable"` if **`enriched_data.json`** is not available.

---

#### `GET /v1/search/word/:word`

Returns all word keys where the Uthmani text is an exact match.

**Path parameters**: `word` — URL-encoded Arabic word.

**Response**
```json
{
  "data": {
    "word": "ٱللَّهُ",
    "word_keys": ["2:255:1", "3:2:1", "..."],
    "count": 980
  }
}
```

---

### Topics

#### `GET /v1/topics`

Returns all 2,512 topics/concepts with verse counts.

**Response**
```json
{
  "data": [
    { "slug": "prophets", "name": "Prophets", "verse_count": 312 },
    { "slug": "prayer", "name": "Prayer", "verse_count": 148 }
  ],
  "meta": { "total": 2512 }
}
```

---

#### `GET /v1/topics/:slug`

Returns all verse keys categorised under a topic.

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `expand` | boolean | `false` | When `true`, inline full verse data (key, surah, ayah, text, meta) instead of bare keys |
| `script` | string | `uthmani` | Arabic script variant (only used when `expand=true`) |

**Response (default)**
```json
{
  "data": {
    "slug": "prayer",
    "name": "Prayer",
    "verse_keys": ["2:3", "2:43", "2:45", "..."]
  }
}
```

**Response (expand=true)**
```json
{
  "data": {
    "slug": "prayer",
    "name": "Prayer",
    "verses": [
      { "key": "2:3", "surah": 2, "ayah": 3, "text": "...", "meta": { ... } }
    ]
  },
  "meta": { "total": 148 }
}
```

---

### Mutashabihat

Mutashabihat are similar or repeated phrases across the Quran — verses that are nearly identical in wording but differ in small ways.

#### `GET /v1/mutashabihat/:key`

Returns all similar phrase pairs involving a given verse.

**Path parameters**: `key` — verse key, e.g. `2:255`.

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `expand` | boolean | `false` | When `true`, inline verse data for both `verse_key` and `matched_key` |
| `script` | string | `uthmani` | Arabic script variant (only used when `expand=true`) |

**Response (default)**
```json
{
  "data": [
    {
      "verse_key": "2:255",
      "matched_key": "3:2",
      "score": 0.92,
      "coverage": 0.88,
      "matched_word_positions": [1, 2, 3]
    }
  ],
  "meta": { "verse_key": "2:255", "total": 1 }
}
```

**Response (expand=true)**
```json
{
  "data": [
    {
      "verse_key": "2:255",
      "matched_key": "3:2",
      "matched_word_positions": [1, 2, 3],
      "verse": { "key": "2:255", "surah": 2, "ayah": 255, "text": "...", "meta": { ... } },
      "matched_verse": { "key": "3:2", "surah": 3, "ayah": 2, "text": "...", "meta": { ... } }
    }
  ],
  "meta": { "verse_key": "2:255", "total": 1 }
}
```

---

#### `GET /v1/mutashabihat`

Returns all 5,277 similar phrase pairs (paginated).

**Query parameters**

| Parameter | Type | Default | Max |
|---|---|---|---|
| `limit` | number | 100 | 500 |
| `offset` | number | 0 | — |

---

### Catalog

#### `GET /v1/translations`

Returns the full catalog of 209 available translations.

**Query parameters**

| Parameter | Type | Description |
|---|---|---|
| `language` | string | Case-insensitive substring filter, e.g. `english`, `urdu`, `turkish` |
| `sort` | string | Sort results: `field:asc` or `field:desc`. Fields: `id`, `name`, `language`. Example: `sort=name:asc` |

**Response**
```json
{
  "data": [
    {
      "id": 131,
      "name": "Saheeh International",
      "language": "english",
      "author": "Saheeh International",
      "direction": "ltr"
    },
    {
      "id": 85,
      "name": "The Quran — A New Translation",
      "language": "english",
      "author": "M.A.S. Abdel Haleem",
      "direction": "ltr"
    }
  ],
  "meta": { "total": 209 }
}
```

Use the `id` field in `?translations=131,85` query parameters.

---

#### `GET /v1/tafsirs`

Returns the full catalog of available tafsirs across all languages.

**Query parameters**

| Parameter | Type | Description |
|---|---|---|
| `language` | string | Case-insensitive substring filter, e.g. `turkish`, `indonesian`, `russian` |
| `type` | string | Filter by type: `mukhtasar` or `detailed` |
| `sort` | string | Sort results: `field:asc` or `field:desc`. Fields: `id`, `name`, `language`. Example: `sort=language:asc` |

**Example**
```
GET /v1/tafsirs?language=turkish
GET /v1/tafsirs?type=mukhtasar
```

**Response**
```json
{
  "data": [
    {
      "id": 306,
      "name": "Tafsir Ibn Kathir",
      "language": "turkish",
      "author": "Ibn Kathir",
      "type": "detailed"
    },
    {
      "id": 258,
      "name": "Al-Mukhtasar",
      "language": "turkish",
      "author": null,
      "type": "mukhtasar"
    }
  ],
  "meta": { "total": 2 }
}
```

**`type` values**: `mukhtasar` (condensed), `detailed`.

**Available languages** include: arabic, english, urdu, bengali, russian, turkish, indonesian, persian, french, spanish, bosnian, italian, chinese, japanese, hindi, tagalog, uzbek, kyrgyz, azerbaijani, uyghur, pashto, malayalam, telugu, tamil, assamese, sinhalese, khmer, thai, vietnamese, serbian, kurdish, and more.

Use the `id` in `GET /v1/verse/:key/tafsir/:id`.

---

#### `GET /v1/tafsirs/:id`

Returns metadata for a single tafsir.

**Path parameters**: `id` — tafsir ID.

**Response**
```json
{
  "data": {
    "id": 306,
    "name": "Tafsir Ibn Kathir",
    "language": "turkish",
    "author": "Ibn Kathir",
    "type": "detailed"
  }
}
```

---

#### `GET /v1/tafsirs/:id/surahs`

Returns which surah numbers have data synced for a tafsir. Useful for tafsirs with sparse coverage (e.g. abridged editions that skip some surahs).

**Path parameters**: `id` — tafsir ID.

**Response**
```json
{
  "data": {
    "id": 258,
    "name": "Al-Mukhtasar",
    "language": "turkish",
    "covered_surahs": [1, 2, 3, 4, 5, "...", 114]
  },
  "meta": { "total": 114 }
}
```

---

#### `GET /v1/surah/:n/tafsir/:id`

Returns all tafsir entries for an entire surah in one request.

**Path parameters**

| Parameter | Type | Description |
|---|---|---|
| `n` | number | Surah number `1–114` |
| `id` | number | Tafsir ID (see `GET /v1/tafsirs`) |

**Response**
```json
{
  "data": {
    "tafsir": {
      "id": 306,
      "name": "Tafsir Ibn Kathir",
      "language": "turkish",
      "author": "Ibn Kathir",
      "type": "detailed"
    },
    "surah": 1,
    "ayahs": [
      { "surah": 1, "ayah": 1, "text": "...", "group_from": null, "group_to": null },
      { "surah": 1, "ayah": 2, "text": "...", "group_from": null, "group_to": null }
    ]
  },
  "meta": { "total": 7 }
}
```

---

#### `GET /v1/recitations`

Returns the catalog of 152 available audio recitations.

**Query parameters**

| Parameter | Type | Description |
|---|---|---|
| `segmented` | boolean | Set `true` to return only recitations that have word-level timestamps |

**Response**
```json
{
  "data": [
    {
      "id": 7,
      "name": "Mishary Rashid Alafasy",
      "reciter": "Mishary Rashid Alafasy",
      "style": "Murattal",
      "segments_count": 6236,
      "audio_format": "mp3"
    }
  ],
  "meta": { "total": 152 }
}
```

`segments_count > 0` means word-level timestamps are available via `GET /v1/verse/:key/timestamps/:recitationId`.

---

#### `GET /v1/word-translations`

Returns the catalog of available word-by-word translation resources (used with `?lang=` on word endpoints). Each `lang` is the filename stem under `data/words/translations/{lang}.json` (synced from QUL).

**Response**
```json
{
  "data": [
    { "lang": "english", "id": 131, "name": "English", "direction": "ltr" },
    { "lang": "urdu", "id": 85, "name": "Urdu", "direction": "rtl" }
  ],
  "meta": { "total": 16 }
}
```

| Field | Type | Description |
|---|---|---|
| `lang` | string | Pass to `?lang=` (matches the JSON file stem) |
| `id` | number | QUL translation resource id |
| `name` | string | Display label when present |
| `direction` | string | `ltr` or `rtl` |

Returns `503` if `data/words/translations/index.json` has not been generated (run `scripts/scrape_qul.py --resources word-translations`).

---

### Fonts

QUL font packages are synced under `data/fonts/<id>/` (see [QUL fonts](https://qul.tarteel.ai/resources/font)). The API lists resources, returns file names (including nested paths under each id), and serves bytes with appropriate `Content-Type` (`font/woff2`, `font/ttf`, `application/json`, `application/x-bzip2` for `.json.bz2`, etc.).

**Listing:** Locally, the server walks each numeric id directory recursively. When **`DATA_BASE_URL`** is set, listing uses **`data/fonts/catalog.json`** (must be present at the remote base; regenerate with `npm run data:font-catalog` after font changes).

#### `GET /v1/fonts`

Lists font resource ids. Returns an empty `data` array if no fonts are available (missing tree locally, or missing/empty `catalog.json` in remote mode).

**Response**
```json
{
  "data": [
    { "id": "459", "file_count": 6, "detail_url": "https://qul.tarteel.ai/resources/font/459" }
  ],
  "meta": { "total": 1 }
}
```

#### `GET /v1/fonts/:id`

Returns `detail_url` (when present in `manifest.json`) and the full `files` list for that id.

**Response**
```json
{
  "data": {
    "id": "459",
    "detail_url": "https://qul.tarteel.ai/resources/font/459",
    "files": ["font.woff2", "font.ttf", "ligatures.json.bz2", "metadata.json"]
  }
}
```

`files` lists assets relative to that id directory (recursive); root `manifest.json` is omitted from listings. When `manifest.json` defines a `files` array, that list is used if non-empty.

Returns `404` if the font id does not exist or is unknown (including remote mode with no catalog entry).

#### `GET /v1/fonts/:id/:filename`

Streams one asset under `data/fonts/:id/`. The route captures **`filename` as a single URL path segment**. For a file in a subdirectory, encode slashes in the segment (e.g. `binaries/ligatures.json.bz2` → `binaries%2Fligatures.json.bz2`). The server applies `decodeURIComponent` to `filename`. Path segments must not contain `..` or null bytes.

Typical names: `*.woff`, `*.woff2`, `*.ttf`, `*.otf`, `*.json`, `*.json.bz2`, or nested paths like `binaries/ligatures.json.bz2`.

**Examples**
```
GET /v1/fonts/459/myfont.woff2
GET /v1/fonts/455/binaries%2Fligatures.json.bz2
```

Returns `404` if the file is missing or the path is unsafe.

---

#### `GET /v1/transliterations`

Returns the catalog of available transliteration resources.

**Response**
```json
{
  "data": [
    { "lang": "en", "name": "English Transliteration", "type": "ayah" },
    { "lang": "wbw_en", "name": "English Word-by-Word Transliteration", "type": "word" }
  ],
  "meta": { "total": 9 }
}
```

`type` is `"ayah"` (verse-level) or `"word"` (word-level). Word-level file names are prefixed with `wbw_`.

---

#### `GET /v1/verse/:key/transliteration`

Returns transliterated text for a verse.

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `lang` | string | `en` | Language code from `/v1/transliterations` catalog |

**Response**
```json
{
  "data": { "verse_key": "1:1", "lang": "en", "text": "Bismi Allahi alrrahmani alrraheemi" }
}
```

---

### Surah Info

#### `GET /v1/surah/:n/info`

Returns a detailed description of a surah including revelation context and themes.

**Path parameters**: `n` — surah number `1–114`.

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `lang` | string | `english` | Language code (see available languages via `/v1/surah/:n/info` error response) |

**Response**
```json
{
  "data": {
    "surah": 1,
    "lang": "english",
    "name": "Al-Fatihah",
    "short_intro": "The Opening chapter...",
    "description": "<p>Surah Al-Fatihah is the first chapter of the Quran...</p>",
    "language": "english"
  }
}
```

Returns `503` with a list of available language codes if the requested language is not synced.

---

### Similar Ayahs

Ayahs that share similarities in meaning, context, or wording (distinct from Mutashabihat, which focuses on near-identical phrasing).

#### `GET /v1/similar-ayahs/:key`

Returns similar ayahs for a given verse.

**Path parameters**: `key` — verse key, e.g. `2:255`.

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `expand` | boolean | `false` | When `true`, inline verse data for both `verse_key` and `similar_key` |
| `script` | string | `uthmani` | Arabic script variant (only used when `expand=true`) |

**Response (default)**
```json
{
  "data": [
    { "verse_key": "2:255", "similar_key": "3:2", "score": 0.85 }
  ],
  "meta": { "verse_key": "2:255", "total": 1 }
}
```

**Response (expand=true)**
```json
{
  "data": [
    {
      "verse_key": "2:255",
      "similar_key": "3:2",
      "score": 0.85,
      "verse": { "key": "2:255", "surah": 2, "ayah": 255, "text": "...", "meta": { ... } },
      "similar_verse": { "key": "3:2", "surah": 3, "ayah": 2, "text": "...", "meta": { ... } }
    }
  ],
  "meta": { "verse_key": "2:255", "total": 1 }
}
```

---

#### `GET /v1/similar-ayahs`

Returns all 4,001 similar ayah pairs (paginated).

**Query parameters**

| Parameter | Type | Default | Max |
|---|---|---|---|
| `limit` | number | 100 | 500 |
| `offset` | number | 0 | — |

---

### Ayah Themes

#### `GET /v1/verse/:key/theme`

Returns the core theme(s) for a specific ayah.

**Response**
```json
{
  "data": { "verse_key": "2:255", "themes": ["Tawhid", "Divine Attributes"] }
}
```

---

#### `GET /v1/ayah-themes`

Returns all ayah themes (paginated).

**Query parameters**

| Parameter | Type | Default | Max |
|---|---|---|---|
| `limit` | number | 200 | 1000 |
| `offset` | number | 0 | — |

**Response**
```json
{
  "data": [
    { "verse_key": "1:1", "themes": ["Basmala"] },
    { "verse_key": "2:255", "themes": ["Tawhid", "Divine Attributes"] }
  ],
  "meta": { "total": 1049, "limit": 200, "offset": 0 }
}
```

---

## TypeScript Types

```typescript
interface ApiResponse<T> {
  data: T;
  meta?: { total?: number; limit?: number; offset?: number };
}

interface VerseData {
  key: string;
  surah: number;
  ayah: number;
  text: string;
  meta: {
    page: number;
    juz: number;
    hizb: number;
    ruku: number;
    manzil: number;
    words_count: number;
    sajdah?: "obligatory" | "recommended" | null;
  };
  words?: WordData[];
  morphology?: Record<string, MorphSegment[]>;
  translations?: Record<string, TranslationEntry>;
}

interface WordData {
  key: string;
  text: string;
  text_indopak?: string;
  code_v1?: string;
  code_v2?: string;
  position: number;
  page?: number;
  line?: number;
  type?: string;
  translation?: string;
  pause_mark?: string;
}

interface MorphSyntax {
  role_ar?: string;
  declinability?: string;
  case_mood?: string;
  gloss?: string;
}

interface MorphSegment {
  form: string;
  pos: string;
  segment_type?: "prefix" | "stem" | "suffix";
  root?: string;
  lemma?: string;
  gender?: "masculine" | "feminine";
  number?: "singular" | "dual" | "plural";
  case?: "nominative" | "accusative" | "genitive";
  state?: "definite" | "indefinite";
  aspect?: "perfect" | "imperfect" | "imperative";
  voice?: "active" | "passive";
  mood?: "indicative" | "subjunctive" | "jussive";
  person?: "first" | "second" | "third";
  verb_form?: string;
  syntax?: MorphSyntax;
}

interface TranslationEntry {
  text: string;
  footnotes?: { id: number; text: string }[];
}
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATA_BASE_URL` | — | Base URL for remote corpus (e.g. GitHub raw). Required on Vercel production. |
| `DATA_FETCH_TIMEOUT_MS` | `10000` | Timeout for remote data fetches (milliseconds). |
| `RATE_LIMIT_MAX` | `100` | Max requests per window per IP. Set to `0` to disable. |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit sliding window duration (milliseconds). |
| `LOG_REQUESTS` | `true` | Set to `false` to disable structured request logging. |
| `REQUEST_TIMEOUT_MS` | `25000` | Handler timeout in milliseconds. Returns 504 if exceeded. |
| `WARM_CACHE_LEVEL` | `standard` | Cache warming depth on cold start. `minimal` = verse meta + uthmani only. `standard` = also preloads structural indexes and topics. |
| `VERCEL_GIT_COMMIT_SHA` | — | Auto-injected by Vercel. Used for ETag generation. |

---

## Data Sync

Data is refreshed automatically every **Sunday at 06:00 UTC** via GitHub Actions (`sync.yml`).
Each successful sync downloads the latest data from QUL (via Playwright scraper) when that job is included, runs **`scripts/sync_morphology.py`** when the **`morphology`** source is included (downloads MASAQ CSV + mustafa morphology text, writes **`data/morphology/enriched_data.json`**), commits any changes under `data/` to `main`, and triggers a Vercel redeployment — invalidating the edge cache via a new ETag.

After sync steps, the workflow runs **`scripts/generate_font_catalog.py`**, which writes **`data/fonts/catalog.json`**. That file is required for font listing when the API loads the corpus via **`DATA_BASE_URL`** (remote mode).

You can trigger a manual sync from the GitHub Actions tab with an optional `sources` input (`qul-scrape`, `morphology`, or `all`). The job **only creates a commit when `git add data/` produces a diff**; if the scraper fails (missing `QUL_EMAIL` / `QUL_PASSWORD`, timeouts, or no file changes), `main` stays unchanged — check the workflow log and the **Show data tree status** step. The scheduled workflow runs **weekly** (Sunday 06:00 UTC), not on every push.

If you use **remote corpus URLs**, point **`DATA_BASE_URL`** at the **same commit** (or tag) as the deployment after each data push, so paths like `data/verses/meta.json` resolve correctly.
