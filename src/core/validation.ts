import { VALID_SCRIPTS, type ScriptName } from "./loaders/quran.js";

export { VALID_SCRIPTS, type ScriptName };

export function validateSurah(n: unknown): number | null {
  const v = Number(n);
  if (!Number.isInteger(v) || v < 1 || v > 114) return null;
  return v;
}

export function validateVerseKey(raw: string): { surah: number; ayah: number } | null {
  const parts = raw.split(":");
  if (parts.length !== 2) return null;
  const [s, a] = parts.map(Number);
  if (!Number.isInteger(s) || !Number.isInteger(a) || s < 1 || s > 114 || a < 1) return null;
  return { surah: s, ayah: a };
}

export function validateWordKey(raw: string | undefined): string | null {
  if (raw === undefined) return null;
  let s = raw.trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    /* keep s */
  }
  const parts = s.split(":");
  if (parts.length !== 3) return null;
  if (!parts.every((p) => /^\d+$/.test(p))) return null;
  const surah = Number(parts[0]);
  const ayah = Number(parts[1]);
  const word = Number(parts[2]);
  if (!Number.isInteger(surah) || surah < 1 || surah > 114) return null;
  if (!Number.isInteger(ayah) || ayah < 1 || ayah > 286) return null;
  if (!Number.isInteger(word) || word < 1 || word > 256) return null;
  return `${surah}:${ayah}:${word}`;
}

export function validateScript(raw: string | undefined): ScriptName | null {
  if (!raw) return "uthmani";
  return (VALID_SCRIPTS as readonly string[]).includes(raw) ? (raw as ScriptName) : null;
}

export function validateRange(n: unknown, min: number, max: number): number | null {
  const v = Number(n);
  if (!Number.isInteger(v) || v < min || v > max) return null;
  return v;
}
