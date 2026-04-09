import type { MiddlewareHandler } from "hono";
import { apiError } from "../core/errors.js";

const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX) || 100;
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;

interface Entry {
  timestamps: number[];
}

const store = new Map<string, Entry>();
let requestCount = 0;

function getClientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  return (
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function pruneStaleEntries(now: number): void {
  for (const [ip, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);
    if (entry.timestamps.length === 0) store.delete(ip);
  }
}

/**
 * Per-instance sliding window rate limiter.
 * Note: In serverless (Vercel), each instance has its own counter.
 * For global rate limiting, use Vercel Edge Middleware or an external store.
 */
export const rateLimitMiddleware: MiddlewareHandler = async (c, next) => {
  if (MAX_REQUESTS <= 0) {
    await next();
    return;
  }

  const now = Date.now();
  const ip = getClientIp(c);

  // Prune every 100 requests to bound memory.
  if (++requestCount % 100 === 0) pruneStaleEntries(now);

  let entry = store.get(ip);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(ip, entry);
  }

  // Drop timestamps outside the current window.
  entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);

  if (entry.timestamps.length >= MAX_REQUESTS) {
    const oldest = entry.timestamps[0];
    const retryAfter = Math.ceil((oldest + WINDOW_MS - now) / 1000);
    c.header("Retry-After", String(retryAfter));
    return apiError(c, 429, "rate_limited", "Too many requests");
  }

  entry.timestamps.push(now);
  await next();
};
