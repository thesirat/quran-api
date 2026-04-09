import fs from "node:fs/promises";
import path from "node:path";

export const ROOT = process.cwd();

// ---------------------------------------------------------------------------
// Environment helpers
// ---------------------------------------------------------------------------

/** When set (e.g. GitHub raw), data is fetched over HTTP instead of fs. */
export function dataBaseUrl(): string | undefined {
  const u = process.env.DATA_BASE_URL?.trim();
  return u || undefined;
}

export function isRemoteData(): boolean {
  return !!dataBaseUrl();
}

/**
 * Deployed Vercel functions do not include repo `data/` (size limits).
 * Reading from disk there always fails unless `vercel dev` (local checkout).
 */
export function assertLocalCorpusFilesystemAllowed(): void {
  if (isRemoteData()) return;
  if (process.env.VERCEL !== "1") return;
  if (process.env.VERCEL_ENV === "development") return;
  throw new Error(
    "DATA_BASE_URL is required on Vercel (production/preview). The corpus is not bundled in the serverless function. " +
      "Set DATA_BASE_URL to a pinned base URL whose paths mirror the repo, e.g. " +
      "https://raw.githubusercontent.com/<owner>/<repo>/<commit-or-tag> (no trailing slash). " +
      "See docs/api.md — Deployment and corpus storage."
  );
}

/** Runtime mode for observability (e.g. GET /). */
export function getDataLoadingMeta(): { mode: "local" | "remote"; baseUrl: string | null } {
  const b = dataBaseUrl();
  return { mode: b ? "remote" : "local", baseUrl: b ?? null };
}

// ---------------------------------------------------------------------------
// Path security
// ---------------------------------------------------------------------------

export function assertSafeDataRelPath(relPath: string): void {
  if (path.isAbsolute(relPath)) {
    throw new Error(`Invalid data path (absolute): ${relPath}`);
  }
  const norm = path.posix.normalize(relPath.replace(/\\/g, "/"));
  if (norm.startsWith("../") || norm === ".." || norm.includes("/../")) {
    throw new Error(`Invalid data path: ${relPath}`);
  }
  if (norm.startsWith("/")) {
    throw new Error(`Invalid data path: ${relPath}`);
  }
  if (!norm.startsWith("data/") && norm !== "data") {
    throw new Error(`Invalid data path (must be under data/): ${relPath}`);
  }
}

/** Single path segment for dynamic resources (translations id, lang codes, etc.). */
export function assertSafeResourceSegment(segment: string, label: string): void {
  if (segment.length === 0 || segment.length > 240) {
    throw new Error(`Invalid ${label}`);
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(segment)) {
    throw new Error(`Invalid ${label}`);
  }
}

export function assertTafsirSurahPathSegment(surah: number): void {
  if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
    throw new Error("Invalid surah number for tafsir resource path");
  }
}

export function isNotFoundError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const err = e as NodeJS.ErrnoException & { status?: number };
  if (err.code === "ENOENT") return true;
  if (err.status === 404) return true;
  const msg = err instanceof Error ? err.message : "";
  if (msg.startsWith("Not found: http")) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Backward-compatible re-exports (used by loaders/quran.ts, loaders/resources.ts)
// Prefer importing from upstream/ directly in new code.
// ---------------------------------------------------------------------------

export async function readDataTextFromRemote(relPath: string): Promise<string> {
  const { createRemoteReader } = await import("./upstream/client.js");
  return createRemoteReader().readText(relPath);
}

export async function tryReadDataTextFromRemote(relPath: string): Promise<string | undefined> {
  const { createRemoteReader } = await import("./upstream/client.js");
  return createRemoteReader().tryReadText(relPath);
}

export async function readDataBufferFromRemote(relPath: string): Promise<Buffer | null> {
  const { createRemoteReader } = await import("./upstream/client.js");
  return createRemoteReader().readBuffer(relPath);
}

export async function readLocalFile(absPath: string): Promise<string> {
  assertLocalCorpusFilesystemAllowed();
  return fs.readFile(absPath, "utf-8");
}

export async function readLocalBuffer(absPath: string): Promise<Buffer> {
  assertLocalCorpusFilesystemAllowed();
  return fs.readFile(absPath);
}

export { fs, path };
