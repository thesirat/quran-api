import type { VerseMeta } from "./types.js";
import { SURAH_NAMES } from "./surah-static.js";

/** Tanzil-compatible revelation type strings on the Sura table. */
function revelationLabel(type: string): string {
  return type === "medinan" ? "Medinan" : "Meccan";
}

function parseVerseKey(key: string): { sura: number; aya: number } | null {
  const parts = key.split(":");
  if (parts.length < 2) return null;
  const sura = Number(parts[0]);
  const aya = Number(parts[1]);
  if (!Number.isInteger(sura) || !Number.isInteger(aya)) return null;
  return { sura, aya };
}

function compareVerseKeys(a: string, b: string): number {
  const pa = parseVerseKey(a);
  const pb = parseVerseKey(b);
  if (!pa || !pb) return a.localeCompare(b);
  if (pa.sura !== pb.sura) return pa.sura - pb.sura;
  return pa.aya - pb.aya;
}

function countAyahsInSurah(verseMeta: Record<string, VerseMeta>, sura: number): number {
  let c = 0;
  for (let a = 1; a <= 300; a++) {
    if (verseMeta[`${sura}:${a}`]) c++;
    else if (c > 0) break;
  }
  return c;
}

/**
 * Build the same logical bundle Tanzil's quran-data.js exposed: Sura table plus
 * boundary arrays for juz, hizb quarter, manzil, ruku, page, and sajda rows.
 * Source: QUL verse metadata (`data/verses/meta.json`).
 */
export function buildStructureFromVerseMeta(verseMeta: Record<string, VerseMeta>): Record<string, unknown> {
  const keys = Object.keys(verseMeta).sort(compareVerseKeys);

  // Sura: [][], then per surah [start, ayas, order, rukus, name_ar, tname, ename, type]
  const Sura: unknown[] = [[]];
  let globalStart = 0;
  for (let s = 1; s <= 114; s++) {
    const ayas = countAyahsInSurah(verseMeta, s);
    const info = SURAH_NAMES[s];
    Sura.push([
      globalStart,
      ayas,
      info?.order ?? 0,
      info?.rukus ?? 0,
      info?.arabic ?? "",
      info?.transliteration ?? "",
      info?.english ?? "",
      revelationLabel(info?.type ?? "meccan"),
    ]);
    globalStart += ayas;
  }

  const Juz: [number, number][] = [];
  const HizbQaurter: [number, number][] = [];
  const Manzil: [number, number][] = [];
  const Ruku: [number, number][] = [];
  const Page: [number, number][] = [];
  const Sajda: (number | string)[][] = [];

  let prevJuz: number | undefined;
  let prevHizbQuarter: string | undefined;
  let prevManzil: number | undefined;
  let prevRuku: number | undefined;
  let prevPage: number | undefined;

  for (const key of keys) {
    const pos = parseVerseKey(key);
    if (!pos) continue;
    const m = verseMeta[key];
    const { sura, aya } = pos;

    if (m.juz !== prevJuz) {
      Juz.push([sura, aya]);
      prevJuz = m.juz;
    }

    const hq = `${m.hizb}:${m.rub_el_hizb ?? 0}`;
    if (hq !== prevHizbQuarter) {
      HizbQaurter.push([sura, aya]);
      prevHizbQuarter = hq;
    }

    if (m.manzil !== prevManzil) {
      Manzil.push([sura, aya]);
      prevManzil = m.manzil;
    }

    if (m.ruku !== prevRuku) {
      Ruku.push([sura, aya]);
      prevRuku = m.ruku;
    }

    if (m.page !== prevPage) {
      Page.push([sura, aya]);
      prevPage = m.page;
    }

    if (m.sajdah === "obligatory" || m.sajdah === "recommended") {
      Sajda.push([sura, aya, m.sajdah]);
    }
  }

  return { Sura, Juz, HizbQaurter, Manzil, Ruku, Page, Sajda };
}
