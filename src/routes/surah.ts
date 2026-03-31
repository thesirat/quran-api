import { Hono } from "hono";
import { loadVerseMeta, loadUthmani, loadTafsirChapter, loadTafsirCatalog } from "../data/loader.js";
import type { SurahMeta } from "../data/types.js";

const surah = new Hono();

// Pre-built static surah metadata (Arabic names etc.)
// This avoids a separate file — the Tanzil metadata includes enough.
const SURAH_NAMES: Record<number, { arabic: string; transliteration: string; english: string; type: string; order: number; rukus: number }> = {
  1: { arabic: "الفاتحة", transliteration: "Al-Fatihah", english: "The Opening", type: "meccan", order: 5, rukus: 1 },
  2: { arabic: "البقرة", transliteration: "Al-Baqarah", english: "The Cow", type: "medinan", order: 87, rukus: 40 },
  3: { arabic: "آل عمران", transliteration: "Ali 'Imran", english: "Family of Imran", type: "medinan", order: 89, rukus: 20 },
  4: { arabic: "النساء", transliteration: "An-Nisa", english: "The Women", type: "medinan", order: 92, rukus: 24 },
  5: { arabic: "المائدة", transliteration: "Al-Ma'idah", english: "The Table Spread", type: "medinan", order: 112, rukus: 16 },
  6: { arabic: "الأنعام", transliteration: "Al-An'am", english: "The Cattle", type: "meccan", order: 55, rukus: 20 },
  7: { arabic: "الأعراف", transliteration: "Al-A'raf", english: "The Heights", type: "meccan", order: 39, rukus: 24 },
  8: { arabic: "الأنفال", transliteration: "Al-Anfal", english: "The Spoils of War", type: "medinan", order: 88, rukus: 10 },
  9: { arabic: "التوبة", transliteration: "At-Tawbah", english: "The Repentance", type: "medinan", order: 113, rukus: 16 },
  10: { arabic: "يونس", transliteration: "Yunus", english: "Jonah", type: "meccan", order: 51, rukus: 11 },
  11: { arabic: "هود", transliteration: "Hud", english: "Hud", type: "meccan", order: 52, rukus: 10 },
  12: { arabic: "يوسف", transliteration: "Yusuf", english: "Joseph", type: "meccan", order: 53, rukus: 12 },
  13: { arabic: "الرعد", transliteration: "Ar-Ra'd", english: "The Thunder", type: "medinan", order: 96, rukus: 6 },
  14: { arabic: "إبراهيم", transliteration: "Ibrahim", english: "Abraham", type: "meccan", order: 72, rukus: 7 },
  15: { arabic: "الحجر", transliteration: "Al-Hijr", english: "The Rocky Tract", type: "meccan", order: 54, rukus: 6 },
  16: { arabic: "النحل", transliteration: "An-Nahl", english: "The Bee", type: "meccan", order: 70, rukus: 16 },
  17: { arabic: "الإسراء", transliteration: "Al-Isra", english: "The Night Journey", type: "meccan", order: 50, rukus: 12 },
  18: { arabic: "الكهف", transliteration: "Al-Kahf", english: "The Cave", type: "meccan", order: 69, rukus: 12 },
  19: { arabic: "مريم", transliteration: "Maryam", english: "Mary", type: "meccan", order: 44, rukus: 6 },
  20: { arabic: "طه", transliteration: "Ta-Ha", english: "Ta-Ha", type: "meccan", order: 45, rukus: 8 },
  21: { arabic: "الأنبياء", transliteration: "Al-Anbiya", english: "The Prophets", type: "meccan", order: 73, rukus: 7 },
  22: { arabic: "الحج", transliteration: "Al-Hajj", english: "The Pilgrimage", type: "medinan", order: 103, rukus: 10 },
  23: { arabic: "المؤمنون", transliteration: "Al-Mu'minun", english: "The Believers", type: "meccan", order: 74, rukus: 6 },
  24: { arabic: "النور", transliteration: "An-Nur", english: "The Light", type: "medinan", order: 102, rukus: 9 },
  25: { arabic: "الفرقان", transliteration: "Al-Furqan", english: "The Criterion", type: "meccan", order: 42, rukus: 6 },
  26: { arabic: "الشعراء", transliteration: "Ash-Shu'ara", english: "The Poets", type: "meccan", order: 47, rukus: 11 },
  27: { arabic: "النمل", transliteration: "An-Naml", english: "The Ant", type: "meccan", order: 48, rukus: 7 },
  28: { arabic: "القصص", transliteration: "Al-Qasas", english: "The Stories", type: "meccan", order: 49, rukus: 9 },
  29: { arabic: "العنكبوت", transliteration: "Al-'Ankabut", english: "The Spider", type: "meccan", order: 85, rukus: 7 },
  30: { arabic: "الروم", transliteration: "Ar-Rum", english: "The Romans", type: "meccan", order: 84, rukus: 6 },
  31: { arabic: "لقمان", transliteration: "Luqman", english: "Luqman", type: "meccan", order: 57, rukus: 4 },
  32: { arabic: "السجدة", transliteration: "As-Sajdah", english: "The Prostration", type: "meccan", order: 75, rukus: 3 },
  33: { arabic: "الأحزاب", transliteration: "Al-Ahzab", english: "The Combined Forces", type: "medinan", order: 90, rukus: 9 },
  34: { arabic: "سبأ", transliteration: "Saba", english: "Sheba", type: "meccan", order: 58, rukus: 6 },
  35: { arabic: "فاطر", transliteration: "Fatir", english: "Originator", type: "meccan", order: 43, rukus: 5 },
  36: { arabic: "يس", transliteration: "Ya-Sin", english: "Ya Sin", type: "meccan", order: 41, rukus: 5 },
  37: { arabic: "الصافات", transliteration: "As-Saffat", english: "Those who set the Ranks", type: "meccan", order: 56, rukus: 5 },
  38: { arabic: "ص", transliteration: "Sad", english: "The Letter Sad", type: "meccan", order: 38, rukus: 5 },
  39: { arabic: "الزمر", transliteration: "Az-Zumar", english: "The Troops", type: "meccan", order: 59, rukus: 8 },
  40: { arabic: "غافر", transliteration: "Ghafir", english: "The Forgiver", type: "meccan", order: 60, rukus: 9 },
  41: { arabic: "فصلت", transliteration: "Fussilat", english: "Explained in Detail", type: "meccan", order: 61, rukus: 6 },
  42: { arabic: "الشورى", transliteration: "Ash-Shuraa", english: "The Consultation", type: "meccan", order: 62, rukus: 5 },
  43: { arabic: "الزخرف", transliteration: "Az-Zukhruf", english: "The Ornaments of Gold", type: "meccan", order: 63, rukus: 7 },
  44: { arabic: "الدخان", transliteration: "Ad-Dukhan", english: "The Smoke", type: "meccan", order: 64, rukus: 3 },
  45: { arabic: "الجاثية", transliteration: "Al-Jathiyah", english: "The Crouching", type: "meccan", order: 65, rukus: 4 },
  46: { arabic: "الأحقاف", transliteration: "Al-Ahqaf", english: "The Wind-Curved Sandhills", type: "meccan", order: 66, rukus: 4 },
  47: { arabic: "محمد", transliteration: "Muhammad", english: "Muhammad", type: "medinan", order: 95, rukus: 4 },
  48: { arabic: "الفتح", transliteration: "Al-Fath", english: "The Victory", type: "medinan", order: 111, rukus: 4 },
  49: { arabic: "الحجرات", transliteration: "Al-Hujurat", english: "The Rooms", type: "medinan", order: 106, rukus: 2 },
  50: { arabic: "ق", transliteration: "Qaf", english: "The Letter Qaf", type: "meccan", order: 34, rukus: 3 },
  51: { arabic: "الذاريات", transliteration: "Adh-Dhariyat", english: "The Winnowing Winds", type: "meccan", order: 67, rukus: 3 },
  52: { arabic: "الطور", transliteration: "At-Tur", english: "The Mount", type: "meccan", order: 76, rukus: 2 },
  53: { arabic: "النجم", transliteration: "An-Najm", english: "The Star", type: "meccan", order: 23, rukus: 3 },
  54: { arabic: "القمر", transliteration: "Al-Qamar", english: "The Moon", type: "meccan", order: 37, rukus: 3 },
  55: { arabic: "الرحمن", transliteration: "Ar-Rahman", english: "The Beneficent", type: "medinan", order: 97, rukus: 3 },
  56: { arabic: "الواقعة", transliteration: "Al-Waqi'ah", english: "The Inevitable", type: "meccan", order: 46, rukus: 3 },
  57: { arabic: "الحديد", transliteration: "Al-Hadid", english: "The Iron", type: "medinan", order: 94, rukus: 4 },
  58: { arabic: "المجادلة", transliteration: "Al-Mujadila", english: "The Pleading Woman", type: "medinan", order: 105, rukus: 3 },
  59: { arabic: "الحشر", transliteration: "Al-Hashr", english: "The Exile", type: "medinan", order: 101, rukus: 3 },
  60: { arabic: "الممتحنة", transliteration: "Al-Mumtahanah", english: "She that is to be examined", type: "medinan", order: 91, rukus: 2 },
  61: { arabic: "الصف", transliteration: "As-Saf", english: "The Ranks", type: "medinan", order: 109, rukus: 2 },
  62: { arabic: "الجمعة", transliteration: "Al-Jumu'ah", english: "The Congregation, Friday", type: "medinan", order: 110, rukus: 2 },
  63: { arabic: "المنافقون", transliteration: "Al-Munafiqun", english: "The Hypocrites", type: "medinan", order: 104, rukus: 2 },
  64: { arabic: "التغابن", transliteration: "At-Taghabun", english: "Mutual Disillusion", type: "medinan", order: 108, rukus: 2 },
  65: { arabic: "الطلاق", transliteration: "At-Talaq", english: "Divorce", type: "medinan", order: 99, rukus: 2 },
  66: { arabic: "التحريم", transliteration: "At-Tahrim", english: "The Prohibition", type: "medinan", order: 107, rukus: 2 },
  67: { arabic: "الملك", transliteration: "Al-Mulk", english: "The Sovereignty", type: "meccan", order: 77, rukus: 2 },
  68: { arabic: "القلم", transliteration: "Al-Qalam", english: "The Pen", type: "meccan", order: 2, rukus: 2 },
  69: { arabic: "الحاقة", transliteration: "Al-Haqqah", english: "The Reality", type: "meccan", order: 78, rukus: 2 },
  70: { arabic: "المعارج", transliteration: "Al-Ma'arij", english: "The Ascending Stairways", type: "meccan", order: 79, rukus: 2 },
  71: { arabic: "نوح", transliteration: "Nuh", english: "Noah", type: "meccan", order: 71, rukus: 2 },
  72: { arabic: "الجن", transliteration: "Al-Jinn", english: "The Jinn", type: "meccan", order: 40, rukus: 2 },
  73: { arabic: "المزمل", transliteration: "Al-Muzzammil", english: "The Enshrouded One", type: "meccan", order: 3, rukus: 2 },
  74: { arabic: "المدثر", transliteration: "Al-Muddaththir", english: "The Cloaked One", type: "meccan", order: 4, rukus: 2 },
  75: { arabic: "القيامة", transliteration: "Al-Qiyamah", english: "The Resurrection", type: "meccan", order: 31, rukus: 2 },
  76: { arabic: "الإنسان", transliteration: "Al-Insan", english: "The Man", type: "medinan", order: 98, rukus: 2 },
  77: { arabic: "المرسلات", transliteration: "Al-Mursalat", english: "The Emissaries", type: "meccan", order: 33, rukus: 2 },
  78: { arabic: "النبأ", transliteration: "An-Naba", english: "The Tidings", type: "meccan", order: 80, rukus: 2 },
  79: { arabic: "النازعات", transliteration: "An-Nazi'at", english: "Those who drag forth", type: "meccan", order: 81, rukus: 2 },
  80: { arabic: "عبس", transliteration: "'Abasa", english: "He Frowned", type: "meccan", order: 24, rukus: 1 },
  81: { arabic: "التكوير", transliteration: "At-Takwir", english: "The Overthrowing", type: "meccan", order: 7, rukus: 1 },
  82: { arabic: "الانفطار", transliteration: "Al-Infitar", english: "The Cleaving", type: "meccan", order: 82, rukus: 1 },
  83: { arabic: "المطففين", transliteration: "Al-Mutaffifin", english: "The Defrauding", type: "meccan", order: 86, rukus: 1 },
  84: { arabic: "الانشقاق", transliteration: "Al-Inshiqaq", english: "The Sundering", type: "meccan", order: 83, rukus: 1 },
  85: { arabic: "البروج", transliteration: "Al-Buruj", english: "The Mansions of the Stars", type: "meccan", order: 27, rukus: 1 },
  86: { arabic: "الطارق", transliteration: "At-Tariq", english: "The Nightcomer", type: "meccan", order: 36, rukus: 1 },
  87: { arabic: "الأعلى", transliteration: "Al-A'la", english: "The Most High", type: "meccan", order: 8, rukus: 1 },
  88: { arabic: "الغاشية", transliteration: "Al-Ghashiyah", english: "The Overwhelming", type: "meccan", order: 68, rukus: 1 },
  89: { arabic: "الفجر", transliteration: "Al-Fajr", english: "The Dawn", type: "meccan", order: 10, rukus: 1 },
  90: { arabic: "البلد", transliteration: "Al-Balad", english: "The City", type: "meccan", order: 35, rukus: 1 },
  91: { arabic: "الشمس", transliteration: "Ash-Shams", english: "The Sun", type: "meccan", order: 26, rukus: 1 },
  92: { arabic: "الليل", transliteration: "Al-Layl", english: "The Night", type: "meccan", order: 9, rukus: 1 },
  93: { arabic: "الضحى", transliteration: "Ad-Duha", english: "The Morning Hours", type: "meccan", order: 11, rukus: 1 },
  94: { arabic: "الشرح", transliteration: "Ash-Sharh", english: "The Relief", type: "meccan", order: 12, rukus: 1 },
  95: { arabic: "التين", transliteration: "At-Tin", english: "The Fig", type: "meccan", order: 28, rukus: 1 },
  96: { arabic: "العلق", transliteration: "Al-'Alaq", english: "The Clot", type: "meccan", order: 1, rukus: 1 },
  97: { arabic: "القدر", transliteration: "Al-Qadr", english: "The Power", type: "meccan", order: 25, rukus: 1 },
  98: { arabic: "البينة", transliteration: "Al-Bayyinah", english: "The Clear Proof", type: "medinan", order: 100, rukus: 1 },
  99: { arabic: "الزلزلة", transliteration: "Az-Zalzalah", english: "The Earthquake", type: "medinan", order: 93, rukus: 1 },
  100: { arabic: "العاديات", transliteration: "Al-'Adiyat", english: "The Courser", type: "meccan", order: 14, rukus: 1 },
  101: { arabic: "القارعة", transliteration: "Al-Qari'ah", english: "The Calamity", type: "meccan", order: 30, rukus: 1 },
  102: { arabic: "التكاثر", transliteration: "At-Takathur", english: "The Rivalry in world increase", type: "meccan", order: 16, rukus: 1 },
  103: { arabic: "العصر", transliteration: "Al-'Asr", english: "The Declining Day", type: "meccan", order: 13, rukus: 1 },
  104: { arabic: "الهمزة", transliteration: "Al-Humazah", english: "The Traducer", type: "meccan", order: 32, rukus: 1 },
  105: { arabic: "الفيل", transliteration: "Al-Fil", english: "The Elephant", type: "meccan", order: 19, rukus: 1 },
  106: { arabic: "قريش", transliteration: "Quraysh", english: "Quraysh", type: "meccan", order: 29, rukus: 1 },
  107: { arabic: "الماعون", transliteration: "Al-Ma'un", english: "The Small Kindnesses", type: "meccan", order: 17, rukus: 1 },
  108: { arabic: "الكوثر", transliteration: "Al-Kawthar", english: "The Abundance", type: "meccan", order: 15, rukus: 1 },
  109: { arabic: "الكافرون", transliteration: "Al-Kafirun", english: "The Disbelievers", type: "meccan", order: 18, rukus: 1 },
  110: { arabic: "النصر", transliteration: "An-Nasr", english: "The Divine Support", type: "medinan", order: 114, rukus: 1 },
  111: { arabic: "المسد", transliteration: "Al-Masad", english: "The Palm Fibre", type: "meccan", order: 6, rukus: 1 },
  112: { arabic: "الإخلاص", transliteration: "Al-Ikhlas", english: "The Sincerity", type: "meccan", order: 22, rukus: 1 },
  113: { arabic: "الفلق", transliteration: "Al-Falaq", english: "The Daybreak", type: "meccan", order: 20, rukus: 1 },
  114: { arabic: "الناس", transliteration: "An-Nas", english: "Mankind", type: "meccan", order: 21, rukus: 1 },
};

// ---------------------------------------------------------------------------
// GET /v1/surahs
// ---------------------------------------------------------------------------
surah.get("/", async (c) => {
  const verseMeta = await loadVerseMeta();
  const result: SurahMeta[] = [];

  for (let s = 1; s <= 114; s++) {
    const info = SURAH_NAMES[s];
    // Count verses from meta
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

  return c.json({ data: result });
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

  const [verseMeta, uthmani] = await Promise.all([loadVerseMeta(), loadUthmani()]);

  const all: string[] = [];
  for (let a = 1; a <= 300; a++) {
    if (!verseMeta[`${n}:${a}`]) break;
    all.push(`${n}:${a}`);
  }

  const page = all.slice(offset, offset + limit);
  const data = page.map((key) => {
    const [s, a] = key.split(":").map(Number);
    return { key, surah: s, ayah: a, text: uthmani[key] ?? "", meta: verseMeta[key] };
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

export { surah };
