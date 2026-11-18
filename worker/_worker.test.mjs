// Unit tests for worker/_worker.js — run with `npm test` (node --test).
// Upstream (copier.saveweb2zip.com) and the ASSETS binding are both mocked;
// no network is touched.
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import worker from "./_worker.js";

const ORIG_FETCH = globalThis.fetch;

const mockAssets = {
  async fetch(req) {
    return new Response("static:" + new URL(req.url).pathname, {
      headers: { "content-type": "text/plain" },
    });
  },
};
const env = { ASSETS: mockAssets };

function req(path, init) {
  return new Request("https://web-zip-archiver.pages.dev" + path, init);
}

beforeEach(() => {
  globalThis.fetch = async () => {
    throw new Error("unexpected upstream call");
  };
});
afterEach(() => {
  globalThis.fetch = ORIG_FETCH;
});

test("start: menolak URL bukan https (400)", async () => {
  const res = await worker.fetch(
    req("/api/clone/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: "http://example.com" }),
    }),
    env,
  );
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /https:\/\//);
});

test("start: meneruskan payload ke upstream dan mengembalikan md5", async () => {
  let seenUrl, seenBody;
  globalThis.fetch = async (url, init) => {
    seenUrl = url;
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ md5: "abc123", isFinished: false }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  const res = await worker.fetch(
    req("/api/clone/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        url: "https://example.com",
        renameAssets: true,
        saveStructure: true,
        alternativeAlgorithm: false,
        mobileVersion: false,
      }),
    }),
    env,
  );
  assert.equal(res.status, 200);
  assert.equal((await res.json()).md5, "abc123");
  assert.equal(seenUrl, "https://copier.saveweb2zip.com/api/copySite");
  assert.equal(seenBody.url, "https://example.com");
  assert.equal(seenBody.renameAssets, true);
});

test("start: upstream mati -> 502", async () => {
  globalThis.fetch = async () => {
    throw new Error("upstream down");
  };
  const res = await worker.fetch(
    req("/api/clone/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: "https://example.com" }),
    }),
    env,
  );
  assert.equal(res.status, 502);
});

test("start: upstream timeout -> 502", async () => {
  globalThis.fetch = async () => {
    const err = new Error("The operation timed out.");
    err.name = "TimeoutError";
    throw err;
  };
  const res = await worker.fetch(
    req("/api/clone/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: "https://example.com" }),
    }),
    env,
  );
  assert.equal(res.status, 502);
});

test("status: tanpa md5 -> 400", async () => {
  const res = await worker.fetch(req("/api/clone/status"), env);
  assert.equal(res.status, 400);
});

test("status: meneruskan jawaban upstream", async () => {
  let seenUrl;
  globalThis.fetch = async (url) => {
    seenUrl = url;
    return new Response(
      JSON.stringify({ md5: "abc123", isFinished: true, copiedFilesAmount: 42 }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };
  const res = await worker.fetch(req("/api/clone/status?md5=abc123"), env);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.isFinished, true);
  assert.equal(data.copiedFilesAmount, 42);
  assert.equal(seenUrl, "https://copier.saveweb2zip.com/api/getStatus/abc123");
});

test("status: upstream 500 -> 502", async () => {
  globalThis.fetch = async () =>
    new Response("boom", { status: 500, headers: { "content-type": "text/plain" } });
  const res = await worker.fetch(req("/api/clone/status?md5=abc123"), env);
  assert.equal(res.status, 502);
});

test("rute API tak dikenal -> 404 JSON", async () => {
  const res = await worker.fetch(req("/api/nope"), env);
  assert.equal(res.status, 404);
});

test("jalur non-API diteruskan ke ASSETS", async () => {
  const res = await worker.fetch(req("/index.html"), env);
  assert.equal(res.status, 200);
  assert.equal(await res.text(), "static:/index.html");
});
