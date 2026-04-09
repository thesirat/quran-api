import { Hono } from "hono";
import { getVerseKeysByField } from "../core/verse-indexes.js";
import { apiError } from "../core/errors.js";
import { validateRange, validateScript, VALID_SCRIPTS } from "../core/validation.js";
import { parseFields, buildVerseList } from "../core/fields.js";
import { parseSortParam, VERSE_SORT_FIELDS } from "../core/sorting.js";

const collection = new Hono();

// ---------------------------------------------------------------------------
// GET /v1/page/:n  (1-604)
// ---------------------------------------------------------------------------
collection.get("/page/:n", async (c) => {
  const n = validateRange(c.req.param("n"), 1, 604);
  if (!n) return apiError(c, 400, "invalid_param", "Page must be 1-604");
  const script = validateScript(c.req.query("script"));
  if (!script) return apiError(c, 400, "invalid_param", `Unknown script. Valid: ${VALID_SCRIPTS.join(", ")}`);
  const fields = parseFields(c.req.query("fields"));
  const sort = parseSortParam(c.req.query("sort"), VERSE_SORT_FIELDS);
  const keys = await getVerseKeysByField("page", n);
  if (!keys.length) return apiError(c, 404, "not_found", `No verses on page ${n}`);
  return c.json({ data: await buildVerseList(keys, script, fields, sort), meta: { page: n, total: keys.length } });
});

// ---------------------------------------------------------------------------
// GET /v1/juz/:n  (1-30)
// ---------------------------------------------------------------------------
collection.get("/juz/:n", async (c) => {
  const n = validateRange(c.req.param("n"), 1, 30);
  if (!n) return apiError(c, 400, "invalid_param", "Juz must be 1-30");
  const script = validateScript(c.req.query("script"));
  if (!script) return apiError(c, 400, "invalid_param", `Unknown script. Valid: ${VALID_SCRIPTS.join(", ")}`);
  const fields = parseFields(c.req.query("fields"));
  const sort = parseSortParam(c.req.query("sort"), VERSE_SORT_FIELDS);
  const keys = await getVerseKeysByField("juz", n);
  if (!keys.length) return apiError(c, 404, "not_found", `No verses in juz ${n}`);
  return c.json({ data: await buildVerseList(keys, script, fields, sort), meta: { juz: n, total: keys.length } });
});

// ---------------------------------------------------------------------------
// GET /v1/hizb/:n  (1-60)
// ---------------------------------------------------------------------------
collection.get("/hizb/:n", async (c) => {
  const n = validateRange(c.req.param("n"), 1, 60);
  if (!n) return apiError(c, 400, "invalid_param", "Hizb must be 1-60");
  const script = validateScript(c.req.query("script"));
  if (!script) return apiError(c, 400, "invalid_param", `Unknown script. Valid: ${VALID_SCRIPTS.join(", ")}`);
  const fields = parseFields(c.req.query("fields"));
  const sort = parseSortParam(c.req.query("sort"), VERSE_SORT_FIELDS);
  const keys = await getVerseKeysByField("hizb", n);
  if (!keys.length) return apiError(c, 404, "not_found", `No verses in hizb ${n}`);
  return c.json({ data: await buildVerseList(keys, script, fields, sort), meta: { hizb: n, total: keys.length } });
});

// ---------------------------------------------------------------------------
// GET /v1/ruku/:n
// ---------------------------------------------------------------------------
collection.get("/ruku/:n", async (c) => {
  const n = validateRange(c.req.param("n"), 1, 556);
  if (!n) return apiError(c, 400, "invalid_param", "Invalid ruku number");
  const script = validateScript(c.req.query("script"));
  if (!script) return apiError(c, 400, "invalid_param", `Unknown script. Valid: ${VALID_SCRIPTS.join(", ")}`);
  const fields = parseFields(c.req.query("fields"));
  const sort = parseSortParam(c.req.query("sort"), VERSE_SORT_FIELDS);
  const keys = await getVerseKeysByField("ruku", n);
  if (!keys.length) return apiError(c, 404, "not_found", `No verses in ruku ${n}`);
  return c.json({ data: await buildVerseList(keys, script, fields, sort), meta: { ruku: n, total: keys.length } });
});

// ---------------------------------------------------------------------------
// GET /v1/manzil/:n  (1-7)
// ---------------------------------------------------------------------------
collection.get("/manzil/:n", async (c) => {
  const n = validateRange(c.req.param("n"), 1, 7);
  if (!n) return apiError(c, 400, "invalid_param", "Manzil must be 1-7");
  const script = validateScript(c.req.query("script"));
  if (!script) return apiError(c, 400, "invalid_param", `Unknown script. Valid: ${VALID_SCRIPTS.join(", ")}`);
  const fields = parseFields(c.req.query("fields"));
  const sort = parseSortParam(c.req.query("sort"), VERSE_SORT_FIELDS);
  const keys = await getVerseKeysByField("manzil", n);
  if (!keys.length) return apiError(c, 404, "not_found", `No verses in manzil ${n}`);
  return c.json({ data: await buildVerseList(keys, script, fields, sort), meta: { manzil: n, total: keys.length } });
});

// ---------------------------------------------------------------------------
// GET /v1/rub-el-hizb/:n  (1-240)
// ---------------------------------------------------------------------------
collection.get("/rub-el-hizb/:n", async (c) => {
  const n = validateRange(c.req.param("n"), 1, 240);
  if (!n) return apiError(c, 400, "invalid_param", "Rub el Hizb must be 1-240");
  const script = validateScript(c.req.query("script"));
  if (!script) return apiError(c, 400, "invalid_param", `Unknown script. Valid: ${VALID_SCRIPTS.join(", ")}`);
  const fields = parseFields(c.req.query("fields"));
  const sort = parseSortParam(c.req.query("sort"), VERSE_SORT_FIELDS);
  const keys = await getVerseKeysByField("rub_el_hizb", n);
  if (!keys.length) return apiError(c, 404, "not_found", `No verses in rub el hizb ${n}`);
  return c.json({ data: await buildVerseList(keys, script, fields, sort), meta: { rub_el_hizb: n, total: keys.length } });
});

export { collection };
