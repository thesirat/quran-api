import simdjson from "simdjson";
import type { JSONTape } from "simdjson";
import { assertSafeDataRelPath, isNotFoundError } from "./data-io.js";
import { getDataReader } from "./upstream/index.js";

// Module-level cache: persists across warm Vercel invocations.
export const cache = new Map<string, unknown>();
// Separate cache for lazily-parsed large JSON files.
const lazyCache = new Map<string, Record<string, unknown>>();

/**
 * Read a JSON file from `data/` (relative to project root) and cache it.
 * Subsequent calls for the same path return the cached value synchronously.
 */
export async function loadJson<T>(relPath: string): Promise<T> {
  assertSafeDataRelPath(relPath);
  if (cache.has(relPath)) return cache.get(relPath) as T;
  const raw = await getDataReader().readText(relPath);
  const value = JSON.parse(raw) as T;
  cache.set(relPath, value);
  return value;
}

/** Load and return, or return undefined only if the resource is missing (404 / ENOENT). */
export async function tryLoadJson<T>(relPath: string): Promise<T | undefined> {
  try {
    return await loadJson<T>(relPath);
  } catch (e) {
    if (isNotFoundError(e)) return undefined;
    throw e;
  }
}

/**
 * simdjson `valueForKeyPath` uses `.` / `[n]` path syntax; missing keys throw (they do not return
 * undefined). The `in` operator / `JSON.stringify` can invoke `has` and crash. Word keys like
 * `1:1:1` are safe as a single segment, but we still wrap all lookups so proxies never throw.
 */
function simdjsonKeyLookup(tape: JSONTape, prop: string): unknown {
  try {
    return tape.valueForKeyPath(prop) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * Read a large JSON file using simdjson SIMD acceleration.
 * Values are extracted lazily per key and cached to avoid repeated C++ round-trips.
 * The returned object is a Proxy — property access drives the lazy extraction.
 */
export async function loadJsonLazy<T extends Record<string, unknown>>(relPath: string): Promise<T> {
  assertSafeDataRelPath(relPath);
  if (lazyCache.has(relPath)) return lazyCache.get(relPath) as T;
  const raw = await getDataReader().readText(relPath);
  const tape = simdjson.lazyParse(raw);
  const keyCache = new Map<string, unknown>();
  const proxy = new Proxy({} as T, {
    get(_t, prop: string | symbol) {
      if (typeof prop !== "string") return undefined;
      if (keyCache.has(prop)) return keyCache.get(prop);
      const val = simdjsonKeyLookup(tape, prop);
      keyCache.set(prop, val);
      return val;
    },
    has(_t, prop: string | symbol) {
      if (typeof prop !== "string") return false;
      return simdjsonKeyLookup(tape, prop) !== undefined;
    },
  });
  lazyCache.set(relPath, proxy as Record<string, unknown>);
  return proxy;
}

/** loadJsonLazy variant that returns undefined only if the resource is missing. */
export async function tryLoadJsonLazy<T extends Record<string, unknown>>(relPath: string): Promise<T | undefined> {
  try {
    return await loadJsonLazy<T>(relPath);
  } catch (e) {
    if (isNotFoundError(e)) return undefined;
    throw e;
  }
}

/** Clear the in-memory cache (useful for testing). */
export function clearCache(): void {
  cache.clear();
  lazyCache.clear();
}
