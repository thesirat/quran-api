import type { Context } from "hono";
import type { PaginatedResponse, SortSpec } from "./types.js";
import { applySorting } from "./sorting.js";

export interface PaginationOpts {
  defaultLimit?: number;
  maxLimit?: number;
}

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
}

export function parsePagination(
  c: Context,
  opts?: PaginationOpts,
): { limit: number; offset: number } {
  const maxLimit = opts?.maxLimit ?? 500;
  const defaultLimit = opts?.defaultLimit ?? 100;
  const limit = Math.min(Math.max(1, Number(c.req.query("limit") ?? defaultLimit) || defaultLimit), maxLimit);
  const offset = Math.max(0, Number(c.req.query("offset") ?? 0) || 0);
  return { limit, offset };
}

export function paginate<T>(
  items: T[],
  limit: number,
  offset: number,
): PaginatedResponse<T> {
  return {
    data: items.slice(offset, offset + limit),
    meta: { total: items.length, limit, offset },
  };
}

/** Sort first (if spec provided), then paginate. */
export function paginateAndSort<T>(
  items: T[],
  limit: number,
  offset: number,
  sort?: SortSpec | null,
): PaginatedResponse<T> {
  const sorted = sort ? applySorting(items, sort) : items;
  return paginate(sorted, limit, offset);
}
