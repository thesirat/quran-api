import type { MiddlewareHandler } from "hono";

// Only import the tracker when running on Vercel
const isVercel = Boolean(process.env.VERCEL_ENV);

let trackFn: ((event: string, data: Record<string, string | number>) => Promise<void>) | null = null;

if (isVercel) {
  // Dynamic import so local dev doesn't fail if the package behaves differently
  import("@vercel/analytics/server")
    .then((mod) => {
      trackFn = mod.track as typeof trackFn;
    })
    .catch(() => {
      // Analytics unavailable — degrade silently
    });
}

/**
 * Fire-and-forget analytics middleware.
 * Tracks each API request with path, method, status code, and duration.
 * Never delays the response; errors are swallowed silently.
 */
export const analyticsMiddleware: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  await next();

  if (!trackFn) return;

  const duration = Date.now() - start;
  void trackFn("api_request", {
    path: c.req.path,
    method: c.req.method,
    status: c.res.status,
    duration_ms: duration,
  }).catch(() => undefined);
};
