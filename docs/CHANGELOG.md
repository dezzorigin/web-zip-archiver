# CHANGELOG — Web ZIP Archiver

## v1.0.0 — 18 Nov 2026 (rebuild proper, program P1 repo #18)

Rebuild total dari repo lama (Next.js, 127 KB, 28 file) yang **tidak bisa
build dan tidak bisa deploy**.

### Perbaikan kritis

- **Build diperbaiki.** `app/api/clone/*` + `output: 'export'` membuat
  `next build` gagal total (`force-dynamic cannot be used with "output:
  export"`). Route handler dinamis tidak bisa di-static-export — logika
  rute dipindah apa adanya (upstream, header, pesan validasi) ke
  `worker/_worker.js` (Cloudflare Pages Worker), dan `app/api/` dihapus.
  Build sekarang hijau penuh, termasuk typecheck + lint di dalam build
  (flag `ignoreBuildErrors`/`ignoreDuringBuilds` dicabut).
- **Deploy benar-benar jalan.** Static export `out/` + `_worker.js`
  di-deploy ke Cloudflare Pages sebagai `web-zip-archiver.pages.dev`.
  Demo lama di README (`d7465d42.web-zip-archiver.pages.dev`) masih
  merespons 200 tapi form-nya tidak pernah bisa bekerja — tidak ada API
  di balik static export.

### UI/UX

- Landing ala SaaS: navbar sticky + logo GitHub kanan (link ke repo),
  hero + panel contoh isi arsip, seksi fitur, cara kerja 5 langkah, footer.
- Logo diganti dari gambar acak `picsum.photos` menjadi mark SVG inline.
- Dihapus: popup sambutan WhatsApp yang muncul otomatis 600 ms setelah
  halaman dibuka (menghalangi form di setiap kunjungan), span nama
  developer yang kosong, badge versi "@" yang tidak bermakna.
- Ditambah: tombol "Coba dengan example.com →" (mengisi contoh untuk
  play-test), `aria-live` pada panel status, tautan unduh dibuka di tab
  baru, metadata lengkap (`lang="id"`, Open Graph).
- Salinan tetap Bahasa Indonesia; isi fitur dan langkah sama seperti versi
  lama (tidak ada fitur yang dikarang).

### Dependensi & kebersihan

- Nama paket `ai-studio-applet` → `web-zip-archiver`; versi 0.1.0 → 1.0.0.
- Next.js 15.4.9 → 15.5.29; `eslint-config-next` 16.0.8 → 16.4.6
  (versi 15.x gagal total dengan ESLint 9.39 karena
  `@rushstack/eslint-patch` 1.16.1 yang sudah usang — lint tidak bisa jalan
  sama sekali; config 16.x tidak lagi memakai patch itu).
- Dibuang 6 dependensi yang tidak pernah diimpor: `@google/genai`,
  `@hookform/resolvers`, `class-variance-authority`,
  `@tailwindcss/typography`, `tw-animate-css`, `firebase-tools`
  (950 → 349 paket terinstal).
- Dihapus: `hooks/use-mobile.ts` yang tidak pernah dipakai. `lib/utils.ts`
  (`cn()`) dipertahankan — dipakai oleh UI baru.
- `.env.example` ditulis ulang jujur: tidak ada secret sama sekali
  (`GEMINI_API_KEY`/`APP_URL` versi lama tidak pernah dipakai aplikasi ini).

### Baru

- `worker/_worker.js` + 9 unit test (`npm test`, upstream di-mock).
- `scripts/preview.mjs` — preview lokal lengkap (`npm run preview`).
- CI (`.github/workflows/ci.yml`): build + worker-test + **npm audit**
  (`--audit-level=high`, variasi repo ini) + Lighthouse.
- `docs/`: PRD v2.0, ARCHITECTURE, API, USER-GUIDE, DEPLOYMENT,
  CHANGELOG ini, `diagrams/architecture.html` (HTML+SVG), screenshot asli,
  video demo.
- README standar repo top (lencana CI, screenshot, video, batasan jujur).

### Verifikasi (18 Nov 2026)

- Build lokal hijau: typecheck + lint + `next build` (static export) +
  9/9 unit test worker.
- Live https://web-zip-archiver.pages.dev HTTP 200; proxy worker
  `GET /api/clone/status` terbukti meneruskan jawaban upstream sungguhan.
- Screenshot asli (desktop + mobile) dan video tur UI di `docs/`.
- **Belum terverifikasi dari VM Muse:** klik-melalui penuh (submit URL →
  Selesai → tombol unduh). POST ke Worker menggantung di jalur egress VM
  (terbukti bukan kode: worker minimal pun menggantung; GET dan POST ke
  Pages statis bekerja). Butuh satu kali uji browser di jaringan normal —
  lihat `docs/DEPLOYMENT.md`.

### Yang sengaja tidak berubah

- Alur inti identik: URL → 4 opsi konfigurasi → start → polling 1,5 dtk →
  unduh ZIP dari `copier.saveweb2zip.com`.
- Crawling tetap milik saveweb2zip.com — tidak ada crawling sendiri.
- Lisensi MIT, copyright Nabil Aulia Dika.

## Sebelumnya (repo lama, pra-rebuild)

- v0.1.0 — scaffolding AI Studio: form + `app/api/clone/*`, README 755
  karakter, PRD v1.0 generik, tanpa CI/docs/screenshot/deploy yang bekerja.
