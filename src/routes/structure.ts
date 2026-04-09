import { Hono } from "hono";
import { loadStructureMeta } from "../core/loader.js";
import { apiError } from "../core/errors.js";

const structure = new Hono();

// ---------------------------------------------------------------------------
// GET /v1/structure  — juz / hizb quarter / manzil / ruku / page / sajda (from verse meta)
// ---------------------------------------------------------------------------
structure.get("/structure", async (c) => {
  let data;
  try {
    data = await loadStructureMeta();
  } catch {
    return apiError(c, 503, "data_unavailable", "Structure metadata not available", "Requires data/verses/meta.json from QUL (scripts/scrape_qul.py — quran-metadata).");
  }
  return c.json({ data });
});

export { structure };
