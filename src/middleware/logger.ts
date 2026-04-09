import type { MiddlewareHandler } from "hono";
import { randomUUID } from "node:crypto";

const ENABLED = process.env.LOG_REQUESTS !== "false";

export const loggerMiddleware: MiddlewareHandler = async (c, next) => {
  if (!ENABLED) {
    await next();
    return;
  }

  const requestId = c.req.header("X-Request-Id") ?? randomUUID();
  c.set("requestId", requestId);
  c.header("X-Request-Id", requestId);

  const start = performance.now();
  await next();
  const duration = Math.round(performance.now() - start);

  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      duration_ms: duration,
      request_id: requestId,
    }),
  );
};
