import { Hono } from "hono";
import { loadStructureMeta } from "../core/loader.js";

const structure = new Hono();

// ---------------------------------------------------------------------------
// GET /v1/structure  — juz / hizb quarter / manzil / ruku / page / sajda (from verse meta)
// ---------------------------------------------------------------------------
structure.get("/structure", async (c) => {
  let data;
  try {
    data = await loadStructureMeta();
  } catch {
    return c.json(
      {
        status: 503,
        type: "data_unavailable",
        title: "Structure metadata not available",
        detail: "Requires data/verses/meta.json from QUL (scripts/scrape_qul.py — quran-metadata).",
      },
      503
    );
  }
  return c.json({ data });
});

export { structure };
