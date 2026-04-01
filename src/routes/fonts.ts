import { Hono } from "hono";
import { fontMimeType, listFontResources, loadFontDetail, readFontFile } from "../data/loader.js";

const fonts = new Hono();

// GET /v1/fonts
fonts.get("/", async (c) => {
  const data = await listFontResources();
  return c.json({ data, meta: { total: data.length } });
});

// GET /v1/fonts/:id
fonts.get("/:id", async (c) => {
  const id = c.req.param("id");
  const detail = await loadFontDetail(id);
  if (!detail) {
    return c.json({ status: 404, type: "not_found", title: "Font resource not found", detail: `No data/fonts/${id}/` }, 404);
  }
  return c.json({ data: detail });
});

// GET /v1/fonts/:id/:filename — binary asset (basename only, no subpaths)
fonts.get("/:id/:filename", async (c) => {
  const id = c.req.param("id");
  const filename = c.req.param("filename");
  const buf = await readFontFile(id, filename);
  if (!buf) {
    return c.json(
      {
        status: 404,
        type: "not_found",
        title: "Font file not found",
        detail: `Missing or invalid file under fonts/${id}/`,
      },
      404
    );
  }
  const mime = fontMimeType(filename);
  return c.newResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
});

export { fonts };
