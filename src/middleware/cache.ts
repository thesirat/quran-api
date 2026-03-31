import type { Context, MiddlewareHandler } from "hono";

const COMMIT_SHA = process.env.VERCEL_GIT_COMMIT_SHA ?? "dev";

/**
 * Attach caching headers to all GET responses.
 *   s-maxage=86400    — Vercel Edge caches for 1 day
 *   stale-while-revalidate=604800 — serve stale for 7 days while revalidating
 *   ETag based on the current git commit SHA (changes on every deploy)
 */
export const cacheMiddleware: MiddlewareHandler = async (c: Context, next) => {
  await next();
  if (c.req.method !== "GET") return;

  c.header("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
  c.header("ETag", `"${COMMIT_SHA}"`);
  c.header("Vary", "Accept-Encoding");

  // Support conditional requests: 304 Not Modified
  const ifNoneMatch = c.req.header("If-None-Match");
  if (ifNoneMatch === `"${COMMIT_SHA}"`) {
    return c.body(null, 304);
  }
};
