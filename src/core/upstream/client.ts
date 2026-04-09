import { circuitBreakerCheck, circuitBreakerSuccess, circuitBreakerFailure, CircuitOpenError } from "../circuit-breaker.js";
import { assertSafeDataRelPath, dataBaseUrl, isNotFoundError } from "../data-io.js";

export interface DataReader {
  readText(relPath: string): Promise<string>;
  tryReadText(relPath: string): Promise<string | undefined>;
  readBuffer(relPath: string): Promise<Buffer | null>;
}

// ---------------------------------------------------------------------------
// Remote implementation
// ---------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = Number(process.env.DATA_FETCH_TIMEOUT_MS) || 10_000;
const MAX_RETRIES = 2;

function joinDataUrl(relPath: string): string {
  assertSafeDataRelPath(relPath);
  const base = dataBaseUrl()!.replace(/\/$/, "");
  const p = relPath.split(/[/\\]/).filter(Boolean).join("/");
  return `${base}/${p}`;
}

async function fetchWithRetry(
  url: string,
  opts: { timeoutMs?: number; maxRetries?: number } = {},
): Promise<Response> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = opts.maxRetries ?? MAX_RETRIES;

  const cbKey = dataBaseUrl() ?? "default";
  const { allowed } = circuitBreakerCheck(cbKey);
  if (!allowed) throw new CircuitOpenError(cbKey);

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const delayMs = 200 * Math.pow(4, attempt - 1);
      await new Promise((r) => setTimeout(r, delayMs));
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "quran-api/1.0 (DATA_BASE_URL fetch)" },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.status >= 400 && res.status < 500) {
        circuitBreakerSuccess(cbKey);
        return res;
      }
      if (res.status >= 500 && attempt < maxRetries) {
        lastError = new Error(`${url}: ${res.status} ${res.statusText}`);
        continue;
      }
      circuitBreakerSuccess(cbKey);
      return res;
    } catch (e) {
      clearTimeout(timer);
      lastError = e;
      if (attempt < maxRetries) continue;
    }
  }
  circuitBreakerFailure(cbKey);
  throw lastError;
}

// In-flight request deduplication for text reads.
const inflightText = new Map<string, Promise<string>>();

async function readTextRemote(relPath: string): Promise<string> {
  const url = joinDataUrl(relPath);
  const existing = inflightText.get(url);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await fetchWithRetry(url);
      if (res.status === 404) {
        throw Object.assign(new Error(`Not found: ${url}`), { code: "ENOENT" });
      }
      if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
      }
      return await res.text();
    } finally {
      inflightText.delete(url);
    }
  })();

  inflightText.set(url, promise);
  return promise;
}

async function tryReadTextRemote(relPath: string): Promise<string | undefined> {
  try {
    return await readTextRemote(relPath);
  } catch (e) {
    if (isNotFoundError(e)) return undefined;
    throw e;
  }
}

async function readBufferRemote(relPath: string): Promise<Buffer | null> {
  const url = joinDataUrl(relPath);
  const res = await fetchWithRetry(url, { timeoutMs: 15_000 });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

export function createRemoteReader(): DataReader {
  return {
    readText: readTextRemote,
    tryReadText: tryReadTextRemote,
    readBuffer: readBufferRemote,
  };
}
