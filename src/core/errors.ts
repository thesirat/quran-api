import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * Return a consistent JSON error response.
 * Shape: `{ status, type, title, detail? }`
 */
export function apiError(
  c: Context,
  status: ContentfulStatusCode,
  type: string,
  title: string,
  detail?: string,
) {
  return c.json({ status, type, title, ...(detail ? { detail } : {}) }, status);
}
