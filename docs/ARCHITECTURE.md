# Arsitektur — Web ZIP Archiver

Diagram visual: `diagrams/architecture.html` (buka di browser).

## Gambaran

```
Browser ──GET──▶ Cloudflare Pages (static export out/)
   │                 │
   │                 └─▶ ASSETS: index.html, _next/*, ...
   │
   ├──POST /api/clone/start ──▶ Pages Worker (worker/_worker.js)
   │                              │ POST copier.saveweb2zip.com/api/copySite
   │                              └─▶ { md5 }
   │
   ├──GET /api/clone/status?md5=… ──▶ Worker
   │                              │ GET copier.saveweb2zip.com/api/getStatus/{md5}
   │                              └─▶ { isFinished, copiedFilesAmount, errorText, … }
   │
   └──Unduh ZIP ──▶ langsung ke copier.saveweb2zip.com/api/downloadArchive/{md5}
                   (file di-host upstream, tidak lewat Pages)
```

## Kenapa ada Worker

Repo versi lama punya `app/api/clone/start/route.ts` dan
`app/api/clone/status/route.ts` di dalam aplikasi Next.js — dengan
`next.config.ts` berisi `output: 'export'`. Kombinasi itu **tidak bisa
build**:

```
Error: export const dynamic = "force-dynamic" on page "/api/clone/status"
cannot be used with "output: export".
```

Route handler yang membaca request body / query param bersifat dinamis dan
tidak bisa di-static-export. Menghapus `force-dynamic` pun tetap gagal
(route GET-nya dinamis karena memakai `searchParams`).

Solusi yang dipakai: hapus `app/api/` dari aplikasi Next.js, dan implementasi
rute yang sama persis (upstream, header, pesan validasi) di
`worker/_worker.js` — sebuah Cloudflare Pages Worker yang di-deploy bersama
`out/` sebagai `_worker.bundle`. `npm run build` menyalin worker ke
`out/_worker.js`; `cf_pages.py` mendeteksinya dan mengirimkannya sebagai
bundle worker, bukan sebagai aset statis.

## Komponen

| Komponen | Isi | Peran |
|---|---|---|
| `app/page.tsx` | Landing + form + pelacak status | Satu-satunya halaman (client component) |
| `app/layout.tsx` | Metadata, font Inter + Space Grotesk | Shell HTML, `lang="id"` |
| `worker/_worker.js` | Proxy `POST /api/clone/start`, `GET /api/clone/status`, fallback `env.ASSETS` | Satu-satunya server |
| `worker/_worker.test.mjs` | 8 unit test (upstream + ASSETS di-mock) | `npm test` |
| `scripts/preview.mjs` | Server preview lokal (out/ + worker) | `npm run preview` → http://127.0.0.1:8788 |
| `out/` | Hasil `next build` + `_worker.js` | Yang di-deploy ke Pages |

## Alur data

1. Pengguna isi URL (harus `https://`) + 4 opsi konfigurasi, tekan
   "Mulai Proses Kloning".
2. Browser `POST /api/clone/start` → worker validasi → `POST
   https://copier.saveweb2zip.com/api/copySite` dengan header yang
   meniru `saveweb2zip.com` (origin/referer/user-agent) → upstream
   mengembalikan `{ md5 }`.
3. Browser polling `GET /api/clone/status?md5=…` tiap 1,5 detik → worker
   meneruskan ke `/api/getStatus/{md5}` → `{ isFinished,
   copiedFilesAmount, errorText, … }`.
4. Saat `isFinished`, tombol "Unduh Archive ZIP" muncul, mengarah ke
   `https://copier.saveweb2zip.com/api/downloadArchive/{md5}`.

## Yang tidak ada

- **Tanpa database, tanpa akun, tanpa penyimpanan.** Tidak ada state
  server: task hidup di upstream, diidentifikasi md5.
- **Tanpa API key.** Upstream tidak memakai key; `.env.example`
  menyatakan tidak ada variabel wajib.
- **Tanpa crawling sendiri.** Seluruh pekerjaan berat milik
  saveweb2zip.com — lihat `docs/API.md` untuk batasan jujurnya.

## Dependensi runtime

Hanya yang dipakai: `next`, `react`, `react-dom`, `lucide-react`,
`motion`, `clsx`, `tailwind-merge`. Enam dependensi tak terpakai dibuang
saat rebuild (`@google/genai`, `@hookform/resolvers`,
`class-variance-authority`, `@tailwindcss/typography`, `tw-animate-css`,
`firebase-tools`) — lihat `docs/CHANGELOG.md`.

## Keamanan

- Input URL divalidasi `https://` di UI dan di worker (400 bila tidak).
- `md5` di-`encodeURIComponent` sebelum masuk path upstream.
- Worker mengembalikan `502` (bukan 500 generik) bila upstream tidak
  merespons, supaya kegagalan upstream tidak disamarkan sebagai
  kegagalan aplikasi.
- Tidak ada secret di repo; `.gitignore` menutup `.env*` (kecuali
  `.env.example`), `node_modules/`, `.next/`, `out/`.
