// Cloudflare Pages _worker.js — Web ZIP Archiver.
//
// The Next.js app is a static export (`output: 'export'`), so it cannot ship
// API routes: `next build` refuses any dynamic route handler with static
// export (this repo's original `app/api/clone/*` broke the build outright).
// This worker is therefore the production server for the two API routes:
// it proxies them to copier.saveweb2zip.com (the saveweb2zip.com service
// that does the actual crawling + zipping) and serves everything else from
// the static export via the ASSETS binding.
//
// Route logic mirrors the original Next.js route handlers exactly — same
// upstream, same headers, same validation messages — so behaviour is
// unchanged, only the runtime moved.

const UPSTREAM = "https://copier.saveweb2zip.com";

// Upstream sometimes never answers (e.g. bot-protection holding the
// connection). Never hang the UI forever: fail fast so the worker can
// return a 502 the frontend can display.
const UPSTREAM_TIMEOUT_MS = 30_000;

function upstreamFetch(url, init) {
  return fetch(url, { ...init, signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
}

const API_HEADERS = {
  accept: "*/*",
  "content-type": "application/json",
  origin: "https://saveweb2zip.com",
  referer: "https://saveweb2zip.com/",
  "user-agent":
    "Mozilla/5.0 (Linux; Android 14; SM-A225F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
  "accept-language": "en-US,en;q=0.9",
  "cache-control": "no-cache",
  pragma: "no-cache",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

// POST /api/clone/start — { url, renameAssets, saveStructure,
// alternativeAlgorithm, mobileVersion } -> { md5, ... } (upstream).
async function handleStart(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Body harus JSON." }, 400);
  }
  const { url, renameAssets, saveStructure, alternativeAlgorithm, mobileVersion } =
    body ?? {};

  if (!url || !/^https:\/\//i.test(url)) {
    return json(
      { error: "Sertakan URL lengkap yang valid (harus dimulai dengan https://)." },
      400,
    );
  }

  const payload = {
    url,
    renameAssets: !!renameAssets,
    saveStructure: !!saveStructure,
    alternativeAlgorithm: !!alternativeAlgorithm,
    mobileVersion: !!mobileVersion,
  };

  let upstream;
  try {
    upstream = await upstreamFetch(`${UPSTREAM}/api/copySite`, {
      method: "POST",
      headers: API_HEADERS,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return json(
      { error: "Gagal memulai proses cloning: " + (err?.message ?? err) },
      502,
    );
  }

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return json(
      { error: `Gagal memulai proses cloning: upstream merespons ${upstream.status}` },
      502,
    );
  }
  return json(data);
}

// GET /api/clone/status?md5=... -> { isFinished, copiedFilesAmount,
// errorText, errorCode, md5, ... } (upstream).
async function handleStatus(request) {
  const md5 = new URL(request.url).searchParams.get("md5");
  if (!md5) {
    return json({ error: "MD5 hash Task ID tidak ditemukan." }, 400);
  }

  let upstream;
  try {
    upstream = await upstreamFetch(
      `${UPSTREAM}/api/getStatus/${encodeURIComponent(md5)}`,
      { method: "GET", headers: API_HEADERS },
    );
  } catch (err) {
    return json(
      { error: "Gagal mengambil status: " + (err?.message ?? err) },
      502,
    );
  }

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return json(
      { error: `Gagal mengambil status: upstream merespons ${upstream.status}` },
      502,
    );
  }
  return json(data);
}

const worker = {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/clone/start" && request.method === "POST") {
      return handleStart(request);
    }
    if (pathname === "/api/clone/status" && request.method === "GET") {
      return handleStatus(request);
    }
    if (pathname.startsWith("/api/")) {
      return json({ error: "Rute API tidak dikenal." }, 404);
    }
    return env.ASSETS.fetch(request);
  },
};

export default worker;
