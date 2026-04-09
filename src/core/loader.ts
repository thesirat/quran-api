/**
 * Barrel re-export — all route imports continue to use `../core/loader.js`.
 * Actual implementations are split across focused modules:
 *   - data-io.ts      — path security, remote/local I/O, retry logic
 *   - data-cache.ts   — module-level cache + loadJson / loadJsonLazy
 *   - loaders/quran.ts     — verse meta, scripts, words, morphology
 *   - loaders/resources.ts — translations, tafsirs, audio, fonts, topics, etc.
 */
export { getDataLoadingMeta } from "./data-io.js";
export { loadJson, tryLoadJson, loadJsonLazy, tryLoadJsonLazy, clearCache } from "./data-cache.js";
export {
  loadVerseMeta,
  VALID_SCRIPTS,
  type ScriptName,
  loadScript,
  loadWordsArabic,
  loadWordTranslation,
  loadCorpusMorphology,
  loadMorphologySearchIndexes,
  loadQulMorphology,
  loadPauseMarks,
} from "./loaders/quran.js";
export {
  loadTranslation,
  loadTranslationCatalog,
  loadTafsirChapter,
  loadTafsirCatalog,
  loadRecitations,
  loadAudioSegments,
  loadTopics,
  loadMutashabihat,
  loadMushafPages,
  loadStructureMeta,
  loadSimilarAyahs,
  loadAyahThemes,
  loadWordTranslationCatalog,
  loadTransliterationCatalog,
  loadTransliteration,
  loadSurahInfoCatalog,
  loadSurahInfo,
  assertSafeFontFilename,
  fontMimeType,
  listFontResources,
  loadFontDetail,
  readFontFile,
} from "./loaders/resources.js";
