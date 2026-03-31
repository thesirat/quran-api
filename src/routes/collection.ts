import { Hono } from "hono";
import { loadVerseMeta, loadUthmani, loadStructureMeta } from "../data/loader.js";

const collection = new Hono();

// ---------------------------------------------------------------------------
// Build a list of verse keys for a structural grouping
// ---------------------------------------------------------------------------
async function versesByField(
  field: keyof Awaited<ReturnType<typeof loadVerseMeta>>[string],
  value: number
): Promise<string[]> {
  const meta = await loadVerseMeta();
  return Object.entries(meta)
    .filter(([, v]) => v[field] === value)
    .sort(([a], [b]) => {
      const [as_, aa] = a.split(":").map(Number);
      const [bs, ba] = b.split(":").map(Number);
      return as_ - bs || aa - ba;
    })
    .map(([key]) => key);
}

async function buildVerseList(keys: string[]) {
  const [meta, uthmani] = await Promise.all([loadVerseMeta(), loadUthmani()]);
  return keys.map((key) => {
    const [s, a] = key.split(":").map(Number);
    return { key, surah: s, ayah: a, text: uthmani[key] ?? "", meta: meta[key] };
  });
}

// ---------------------------------------------------------------------------
// GET /v1/page/:n  (1–604)
// ---------------------------------------------------------------------------
collection.get("/page/:n", async (c) => {
  const n = Number(c.req.param("n"));
  if (!Number.isInteger(n) || n < 1 || n > 604) {
    return c.json({ status: 400, type: "invalid_param", title: "Page must be 1–604" }, 400);
  }
  const keys = await versesByField("page", n);
  if (!keys.length) return c.json({ status: 404, type: "not_found", title: `No verses on page ${n}` }, 404);
  return c.json({ data: await buildVerseList(keys), meta: { page: n, total: keys.length } });
});

// ---------------------------------------------------------------------------
// GET /v1/juz/:n  (1–30)
// ---------------------------------------------------------------------------
collection.get("/juz/:n", async (c) => {
  const n = Number(c.req.param("n"));
  if (!Number.isInteger(n) || n < 1 || n > 30) {
    return c.json({ status: 400, type: "invalid_param", title: "Juz must be 1–30" }, 400);
  }
  const keys = await versesByField("juz", n);
  if (!keys.length) return c.json({ status: 404, type: "not_found", title: `No verses in juz ${n}` }, 404);
  return c.json({ data: await buildVerseList(keys), meta: { juz: n, total: keys.length } });
});

// ---------------------------------------------------------------------------
// GET /v1/hizb/:n  (1–60)
// ---------------------------------------------------------------------------
collection.get("/hizb/:n", async (c) => {
  const n = Number(c.req.param("n"));
  if (!Number.isInteger(n) || n < 1 || n > 60) {
    return c.json({ status: 400, type: "invalid_param", title: "Hizb must be 1–60" }, 400);
  }
  const keys = await versesByField("hizb", n);
  if (!keys.length) return c.json({ status: 404, type: "not_found", title: `No verses in hizb ${n}` }, 404);
  return c.json({ data: await buildVerseList(keys), meta: { hizb: n, total: keys.length } });
});

// ---------------------------------------------------------------------------
// GET /v1/ruku/:n
// ---------------------------------------------------------------------------
collection.get("/ruku/:n", async (c) => {
  const n = Number(c.req.param("n"));
  if (!Number.isInteger(n) || n < 1) {
    return c.json({ status: 400, type: "invalid_param", title: "Invalid ruku number" }, 400);
  }
  const keys = await versesByField("ruku", n);
  if (!keys.length) return c.json({ status: 404, type: "not_found", title: `No verses in ruku ${n}` }, 404);
  return c.json({ data: await buildVerseList(keys), meta: { ruku: n, total: keys.length } });
});

export { collection };
