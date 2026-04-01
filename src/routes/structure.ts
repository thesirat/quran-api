import { Hono } from "hono";
import { loadStructureMeta } from "../data/loader.js";

const structure = new Hono();

// ---------------------------------------------------------------------------
// GET /v1/structure  — full Tanzil structural metadata
// ---------------------------------------------------------------------------
structure.get("/structure", async (c) => {
  let data;
  try {
    data = await loadStructureMeta();
  } catch {
    return c.json(
      { status: 503, type: "data_unavailable", title: "Structure metadata not available", detail: "Run scripts/sync_tanzil.py to generate it" },
      503
    );
  }
  return c.json({ data });
});

export { structure };
