import type { MiddlewareHandler } from "hono";
import { apiError } from "../core/errors.js";

const DEFAULT_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS) || 25_000;

export function timeoutMiddleware(ms = DEFAULT_TIMEOUT_MS): MiddlewareHandler {
  return async (c, next) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);

    const onAbort = () => {
      clearTimeout(timer);
    };

    try {
      // Race the handler against the timeout
      const result = await Promise.race([
        next(),
        new Promise<"timeout">((resolve) => {
          controller.signal.addEventListener("abort", () => resolve("timeout"), { once: true });
        }),
      ]);

      if (result === "timeout") {
        return apiError(c, 504, "timeout", "Request timed out");
      }
    } finally {
      clearTimeout(timer);
      controller.signal.removeEventListener("abort", onAbort);
    }
  };
}
