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
| [QUL — Tarteel AI](https://qul.tarteel.ai) | MIT | Arabic text (28 scripts), 209 translations, 150+ tafsirs (30+ languages), 152 recitations, 77k morphology records, Mutashabihat, topics, Mushaf layouts |
| [corpus.quran.com](https://corpus.quran.com) via [mustafa0x](https://github.com/mustafa0x/quran-morphology) | GPL | Sub-word morphological segmentation: POS tags, case, mood, voice, lemma, root per segment |
| [Tanzil](https://tanzil.net) | Non-commercial | Structural metadata: juz, hizb, ruku, manzil, page boundaries |

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
| `not_found` | 404 | Resource does not exist |
| `invalid_key` | 400 | Malformed verse/word key |
| `invalid_param` | 400 | Out-of-range or invalid query parameter |
| `unavailable` | 503 | Data file not yet synced |
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
- Send `If-None-Match: "<etag>"` to receive `304 Not Modified` when data hasn't changed.
- The cache is invalidated automatically on every weekly data sync (new commit → new ETag).

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
  "sources": ["qul.tarteel.ai (MIT)", "corpus.quran.com (GPL)", "tanzil.net"],
  "endpoints": {
    "verse": "/v1/verse/:key",
    "surah": "/v1/surah/:n",
    ...
  }
}
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
| `morphology` | boolean | `false` | Embed sub-word morphology for all words |
| `tafsir` | number | — | Embed one tafsir by ID, e.g. `?tafsir=169` |
| `lang` | string | — | Word translation language when `words=true`, e.g. `en` |

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

Returns all words of a verse.

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

Returns sub-word morphological segments for every word in the verse (sourced from corpus.quran.com v0.4).

**Response**
```json
{
  "data": {
    "1:1:1": [
      {
        "form": "بِ",
        "pos": "preposition",
        "segment_type": "prefix",
        "root": null,
        "lemma": "بِ"
      },
      {
        "form": "سۡمِ",
        "pos": "noun",
        "segment_type": "stem",
        "case": "genitive",
        "state": "indefinite",
        "root": "سمو",
        "lemma": "اِسم"
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

#### `GET /v1/page/:n`

Returns all verses on a Mushaf page.

**Path parameters**: `n` — page number `1–604`.

**Response**
```json
{
  "data": [ { "key": "1:1", "surah": 1, "ayah": 1, "text": "...", "meta": { ... } } ],
  "meta": { "page": 1, "total": 7 }
}
```

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

**Path parameters**: `n` — ruku number (varies by surah).

All collection endpoints return the same shape as `GET /v1/page/:n`.

---

### Morphology

#### `GET /v1/morphology/:word_key`

Returns full morphological analysis for a single word, combining both the corpus (sub-word segments) and QUL (whole-word POS/root/lemma/stem) sources.

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
        "state": "definite"
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

---

### Search

#### `GET /v1/search/root/:root`

Returns all word keys in the Quran that share a given Arabic 3-letter root.

**Path parameters**: `root` — URL-encoded Arabic root, e.g. `سمو`, `ذكر`, `رحم`.

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

Returns all word keys that share a given lemma (dictionary headword form).

**Path parameters**: `lemma` — URL-encoded Arabic lemma.

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

**Response**
```json
{
  "data": {
    "slug": "prayer",
    "name": "Prayer",
    "verse_keys": ["2:3", "2:43", "2:45", "..."]
  }
}
```

---

### Mutashabihat

Mutashabihat are similar or repeated phrases across the Quran — verses that are nearly identical in wording but differ in small ways.

#### `GET /v1/mutashabihat/:key`

Returns all similar phrase pairs involving a given verse.

**Path parameters**: `key` — verse key, e.g. `2:255`.

**Response**
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

#### `GET /v1/recitations`

Returns the catalog of 152 available audio recitations.

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
}

interface TranslationEntry {
  text: string;
  footnotes?: { id: number; text: string }[];
}
```

---

## Data Sync

Data is refreshed automatically every **Sunday at 06:00 UTC** via GitHub Actions (`sync.yml`).
Each sync fetches the latest data from QUL, corpus.quran.com, and Tanzil, commits to `main`, and triggers a Vercel redeployment — invalidating the edge cache via a new ETag.

You can also trigger a manual sync from the GitHub Actions tab with an optional `sources` input (`qul`, `morphology`, `tanzil`, or `all`).
