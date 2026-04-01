// ---------------------------------------------------------------------------
// Shared API response envelope
// ---------------------------------------------------------------------------
export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total?: number;
  limit?: number;
  offset?: number;
}

export interface ApiError {
  status: number;
  type: string;
  title: string;
  detail?: string;
}

// ---------------------------------------------------------------------------
// Quran structure
// ---------------------------------------------------------------------------
export interface VerseMeta {
  page: number;
  juz: number;
  hizb: number;
  rub_el_hizb?: number;
  ruku: number;
  manzil: number;
  words_count: number;
  sajdah?: "obligatory" | "recommended" | null;
}

export interface VerseData {
  key: string;
  surah: number;
  ayah: number;
  text: string;
  meta: VerseMeta;
  words?: WordData[];
  morphology?: Record<string, MorphSegment[]>;
  translations?: Record<string, TranslationEntry>;
}

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------
export interface WordData {
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

// ---------------------------------------------------------------------------
// Morphology (corpus.quran.com — sub-word segments)
// ---------------------------------------------------------------------------
export interface MorphSegment {
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

// QUL grammar record (per whole word)
export interface QulMorphWord {
  pos?: string;
  root?: string;
  lemma?: string;
  stem?: string;
}

// ---------------------------------------------------------------------------
// Translations
// ---------------------------------------------------------------------------
export interface TranslationEntry {
  text: string;
  footnotes?: FootnoteEntry[];
}

export interface FootnoteEntry {
  id: number;
  text: string;
}

export interface TranslationCatalogEntry {
  id: number;
  name: string;
  language: string;
  author?: string;
  direction?: "ltr" | "rtl";
}

// ---------------------------------------------------------------------------
// Tafsirs
// ---------------------------------------------------------------------------
export interface TafsirAyah {
  surah: number;
  ayah: number;
  text: string;
  group_from?: string;
  group_to?: string;
}

export interface TafsirChapter {
  ayahs: TafsirAyah[];
}

export interface TafsirCatalogEntry {
  id: number;
  name: string;
  language: string;
  author?: string;
  type?: "mukhtasar" | "detailed";
}

// ---------------------------------------------------------------------------
// Audio
// ---------------------------------------------------------------------------
export interface RecitationEntry {
  id: number;
  name?: string;
  reciter?: string;
  style?: string;
  segments_count: number;
  files_count?: number;
  relative_path?: string;
  audio_format?: string;
}

// ---------------------------------------------------------------------------
// Mushaf layout
// ---------------------------------------------------------------------------
export interface MushafPage {
  verse_mapping?: Record<string, string>;
  lines_count?: number;
  first_verse?: number;
  last_verse?: number;
  words_count?: number;
}

// ---------------------------------------------------------------------------
// Topics
// ---------------------------------------------------------------------------
export interface TopicEntry {
  name: string;
  verse_keys: string[];
}

// ---------------------------------------------------------------------------
// Mutashabihat
// ---------------------------------------------------------------------------
export interface MutashabihatPair {
  verse_key: string;
  matched_key: string;
  score?: number;
  coverage?: number;
  matched_word_positions?: number[];
}

// ---------------------------------------------------------------------------
// Surah
// ---------------------------------------------------------------------------
export interface SurahMeta {
  id: number;
  name_arabic: string;
  name_simple: string;
  name_translation?: string;
  revelation_place?: "mecca" | "medina";
  verses_count: number;
  pages?: [number, number];
}

// ---------------------------------------------------------------------------
// Structural bundle returned by GET /v1/structure (Tanzil quran-data.js shape; built from QUL verse meta).
// ---------------------------------------------------------------------------
export interface TanzilMeta {
  suras?: TanzilSura[];
  juzs?: TanzilBoundary[];
  hizbs?: TanzilBoundary[];
  manzils?: TanzilBoundary[];
  rukus?: TanzilBoundary[];
  pages?: TanzilBoundary[];
  sajdas?: TanzilSajda[];
}

export interface TanzilSura {
  index: number;
  ayas: number;
  start: number;
  name: string;
  tname: string;
  ename: string;
  type: string;
  order: number;
  rukus: number;
}

export interface TanzilBoundary {
  index: number;
  sura: number;
  aya: number;
}

export interface TanzilSajda {
  sura: number;
  aya: number;
  type: "recommended" | "obligatory";
}

// ---------------------------------------------------------------------------
// Word translation catalog
// ---------------------------------------------------------------------------
export interface WordTranslationCatalogEntry {
  /** Filename stem under data/words/translations/{lang}.json */
  lang: string;
  id: number;
  name?: string;
  direction?: "ltr" | "rtl";
}

// ---------------------------------------------------------------------------
// QUL fonts (data/fonts/<id>/)
// ---------------------------------------------------------------------------
export interface FontListItem {
  id: string;
  file_count: number;
  detail_url?: string;
}

/** Parsed data/fonts/<id>/manifest.json */
export interface FontManifest {
  detail_url?: string;
  files?: string[];
}

// ---------------------------------------------------------------------------
// Transliteration
// ---------------------------------------------------------------------------
export interface TransliterationCatalogEntry {
  lang: string;
  id?: string | number;
  name?: string;
  type?: "ayah" | "word";
}

// ---------------------------------------------------------------------------
// Surah information
// ---------------------------------------------------------------------------
export interface SurahInfo {
  name?: string;
  short_intro?: string;
  description?: string;
  language?: string;
}

export interface SurahInfoCatalogEntry {
  lang: string;
  name?: string;
}

// ---------------------------------------------------------------------------
// Similar ayahs
// ---------------------------------------------------------------------------
export interface SimilarAyahPair {
  verse_key: string;
  similar_key: string;
  score?: number;
}
