# Deployment — Web ZIP Archiver

## Ringkas

- **Platform:** Cloudflare Pages (static + Pages Worker).
- **Project:** `web-zip-archiver` → https://web-zip-archiver.pages.dev
- **Yang di-deploy:** isi `out/` (hasil `next build`) — termasuk
  `out/_worker.js`, yang dikirim sebagai `_worker.bundle` (bukan aset statis).
- **Cara deploy:** `~/workspace/github-actions/cf_pages.py` (token API
  Cloudflare via vault — jangan pernah extract/print token).

```bash
# dari repo, setelah npm run build
python3 ~/workspace/github-actions/cf_pages.py create-project web-zip-archiver  # sekali saja
python3 ~/workspace/github-actions/cf_pages.py deploy web-zip-archiver out
```

Perintah `deploy` mencetak URL deployment (production). Verifikasi:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://web-zip-archiver.pages.dev/
curl -s "https://web-zip-archiver.pages.dev/api/clone/status?md5=00000000000000000000000000000000"
# -> {"md5":"_0","isFinished":true,"success":false,"errorText":"not_found",...}
```

Respons `not_found` untuk md5 dummy membuktikan worker hidup dan
meneruskan ke upstream sungguhan.

## Nama project

Nama Pages adalah namespace global — ketersediaannya **tidak bisa** dicek
dengan GET project (404 hanya berarti bukan milik akun kita). Baru ketahuan
saat create: bila subdomain hasil deploy bersufiks (mis.
`web-zip-archiver-abc.pages.dev`), nama sudah dipakai orang lain — lanjut ke
fallback berikutnya:

1. `web-zip-archiver` ✅ (dipakai — nama pertama langsung didapat bersih,
   tanpa sufiks)
2. `ziparchiver` ❌ (sudah dipakai orang lain — saat create, subdomain jadi
   `ziparchiver-1yq.pages.dev`; project tes itu sudah dihapus lagi)
3. `arsip-zip` (belum dicoba — hanya bila nama pertama gagal)

Nama final yang dipakai: **`web-zip-archiver`** (nama pertama dicoba;
langsung didapat bersih, tanpa sufiks — diverifikasi dari URL deployment
`https://web-zip-archiver.pages.dev`).

## Verifikasi end-to-end (dan batasan VM Muse)

POST ke endpoint Worker (`/api/clone/start`) **tidak bisa diselesaikan
dari VM Muse ini**: proxy egress VM (MITM, HTTP/1.1) menggantungkan semua
POST ke project Pages yang memakai `_worker.js` — terbukti dengan worker
minimal yang hanya mengembalikan JSON tetap (GET ke worker yang sama
bekerja, POST ke project Pages statis juga bekerja). Ini keterbatasan
jalur egress VM, bukan kode.

Karena itu verifikasi klik-melalui penuh tinggal di CI sebagai job
`live-smoke` (`.github/workflows/ci.yml`, non-gating): runner GitHub
menjalankan alur lengkap terhadap situs produksi — start → polling →
unduh ZIP. Hasil 18 Nov 2026 (run 44272733706): example.com selesai
dengan 2 file, ZIP 2.790 byte (magic `PK\x03\x04`). Untuk menguji
manual dari laptop/browser sendiri, buka situs live dan arsipkan
`https://example.com` — tombol unduh harus muncul dalam ~10 detik.

## Build

```bash
npm ci
npm run typecheck
npm run lint
npm test        # unit test worker
npm run build   # next build && cp worker/_worker.js out/_worker.js
```

`out/` berisi: `index.html`, `404.html`, `_next/`, `index.txt` (payload RSC
— artefak normal static export Next.js), dan `_worker.js`.

## Tentang `_worker.js`

`cf_pages.py` (sejak 18 Nov 2026) mendukung `_worker.js`: file itu
dikeluarkan dari manifest aset dan dikirim sebagai field `_worker.bundle`
(multipart `metadata` + `worker.mjs`) pada deployment-create — paritas
dengan wrangler. Worker butuh binding `ASSETS` (otomatis tersedia untuk
Pages project dengan `_worker.js`) untuk menyajikan file statis.

## CI

`.github/workflows/ci.yml` — empat job:

| Job | Isi |
|---|---|
| `build` | `npm ci` → typecheck → lint → build → upload artefak `out/` |
| `worker-test` | `node --test worker/_worker.test.mjs` (8 tes, upstream di-mock) |
| `audit` | `npm audit --audit-level=high` (variasi repo ini) |
| `lighthouse` | LHCI atas artefak `out/` (accessibility & best-practices ≥ 0.9, performance ≥ 0.6 warn) |

## Tentang repo (About)

Setelah live, pasang link live di About repo:

```bash
# PATCH /repos/dezzorigin/web-zip-archiver { "homepage": "https://web-zip-archiver.pages.dev" }
```

Lalu verifikasi `homepage` terpasang dengan GET repo.
