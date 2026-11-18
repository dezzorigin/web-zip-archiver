// Local preview server: serves out/ exactly like Cloudflare Pages would —
// static files via the worker's ASSETS binding, /api/clone/* via the real
// worker code (worker/_worker.js). Requires `npm run build` first.
//
//   npm run preview            # http://127.0.0.1:8788
//
// This is the full-stack local dev path: `next dev` alone cannot serve
// /api/clone/* because the app is a static export (API routes cannot ship
// in `output: 'export'`).
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import worker from "../worker/_worker.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "out");
const PORT = Number(process.env.PORT ?? 8788);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

function toFilePath(pathname) {
  let p = decodeURIComponent(pathname);
  if (p.endsWith("/")) p += "index.html";
  return path.join(ROOT, p);
}

// ASSETS binding backed by the out/ directory on disk.
const assets = {
  async fetch(request) {
    const { pathname } = new URL(request.url);
    try {
      const body = await readFile(toFilePath(pathname));
      return new Response(body, {
        headers: { "content-type": MIME[path.extname(pathname)] ?? "application/octet-stream" },
      });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  },
};

const server = http.createServer(async (req, res) => {
  try {
    const url = `http://127.0.0.1:${PORT}${req.url}`;
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body,
      duplex: "half",
    });
    const out = await worker.fetch(request, { ASSETS: assets });
    res.writeHead(out.status, Object.fromEntries(out.headers.entries()));
    res.end(Buffer.from(await out.arrayBuffer()));
  } catch (err) {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end("preview error: " + (err?.message ?? err));
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`preview: http://127.0.0.1:${PORT}/  (serving ${ROOT})`);
});
