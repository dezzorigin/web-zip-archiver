# PRD — Web ZIP Archiver

## 1. Informasi Proyek

| Field | Nilai |
|---|---|
| Nama Proyek | Web ZIP Archiver |
| Repo | github.com/dezzorigin/web-zip-archiver |
| Live | https://web-zip-archiver.pages.dev |
| Tech Stack | Next.js 15 (static export) + Cloudflare Pages Worker |
| Status | Proper — live, CI hijau |
| Penanggung Jawab | Nabil Aulia Dika (dezzorigin) |
| Versi Dokumen | 2.0 (rebuild proper, 18 Nov 2026) |
| Lisensi | MIT |

## 2. Latar Belakang

Tool untuk mengarsipkan website publik menjadi satu file ZIP: halaman HTML,
aset (CSS/JS/gambar), dan struktur foldernya. Crawling + zipping dikerjakan
oleh layanan pihak ketiga saveweb2zip.com (`copier.saveweb2zip.com`); repo ini
menyediakan antarmuka web-nya (form, konfigurasi, pelacak status, tautan
unduhan) dan proxy server yang dibutuhkan browser untuk memanggil layanan itu.

## 3. Tujuan

- Pengguna menempel URL publik (https) dan mendapatkan file ZIP situs itu
  tanpa akun, tanpa instalasi, tanpa bayar.
- Produk benar-benar jalan di Cloudflare Pages: build hijau, API bekerja,
  play-test end-to-end lolos.

## 4. Ruang Lingkup

Dalam ruang lingkup:

- Form arsip: input URL + 4 opsi konfigurasi (Rename Assets, Save Structure,
  Alt Algorithm, Mobile Version).
- Pelacak status: polling tiap 1,5 detik, jumlah file yang dikloning,
  progress, tombol unduh saat selesai.
- Landing ala SaaS: navbar + logo GitHub, hero + contoh isi arsip, fitur,
  cara kerja, footer.
- Proxy server (`worker/_worker.js`) untuk `POST /api/clone/start` dan
  `GET /api/clone/status`.
- Dokumentasi (README + `docs/`), CI, screenshot, video demo.

Di luar ruang lingkup (sengaja tidak dibuat):

- Crawling sendiri — tetap memakai saveweb2zip.com.
- Akun, riwayat arsip, atau penyimpanan file di server sendiri.
- Mengarsipkan situs yang butuh login atau bukan https.

## 5. Fitur & Persyaratan Fungsional

| # | Fitur | Kriteria |
|---|---|---|
| F1 | Input URL + validasi | Menolak URL kosong dan non-https dengan pesan jelas |
| F2 | 4 opsi konfigurasi | Toggle diteruskan apa adanya ke upstream |
| F3 | Mulai cloning | `POST /api/clone/start` mengembalikan md5 task, atau error yang bisa dibaca |
| F4 | Pelacak status | Polling 1,5 dtk; tampil jumlah file; berhenti saat `isFinished` atau `errorText` |
| F5 | Unduh ZIP | Tombol muncul hanya saat selesai; tautan ke `copier.saveweb2zip.com/api/downloadArchive/{md5}` |
| F6 | Penanganan error | Error upstream (mis. situs tidak bisa di-crawl) tampil sebagai pesan, bukan halaman rusak |
| F7 | Landing | Navbar + GitHub, hero, contoh isi arsip, fitur, cara kerja, footer |

## 6. Persyaratan Non-Fungsional

- **Performa:** halaman statis, First Load JS ~160 kB; Lighthouse
  accessibility & best-practices ≥ 0.9 di CI.
- **Keamanan:** tidak ada secret di repo (`.env.example` menyatakan tidak
  ada variabel wajib); tidak ada key upstream (layanan tidak memakai key).
- **Maintainability:** satu sumber logika proxy di `worker/_worker.js` dengan
  unit test (`npm test`); build lokal = build CI (`npm ci` + typecheck +
  lint + build).

## 7. Arsitektur & Tech Stack

Lihat `docs/ARCHITECTURE.md` dan `docs/diagrams/architecture.html`.
Ringkas: Next.js 15 static export (`out/`) + Pages Worker sebagai server
API. Penyebabnya: `output: 'export'` menolak route handler dinamis —
`app/api/clone/*` versi lama membuat `next build` gagal total. Logika rute
dipindah apa adanya ke worker.

## 8. Milestone

| Fase | Status |
|---|---|
| Inisialisasi & scaffolding | ✅ (repo lama) |
| Rebuild proper v1.0.0 | ✅ 18 Nov 2026 |
| Testing & QA (unit worker + play-test live) | ✅ 18 Nov 2026 |
| Deployment (Cloudflare Pages) | ✅ 18 Nov 2026 |
| Dokumentasi | ✅ 18 Nov 2026 |

## 9. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Upstream (saveweb2zip.com) mati/berubah API | Worker mengembalikan 502 + pesan; UI menampilkan error; tidak ada klaim palsu di README — ketergantungan ditulis jujur |
| Upstream menolak situs tertentu (bot protection, ukuran) | `errorText` upstream diteruskan ke pengguna |
| Nama Pages sudah dipakai orang lain | Fallback: `ziparchiver` → `arsip-zip` |
| `npm audit` menemukan vuln di CI | Job audit terpisah di CI; dependensi tak terpakai sudah dibuang |

## 10. Kriteria Keberhasilan

- `next build` (static export) hijau tanpa mengabaikan error type/lint.
- CI hijau: build + worker test + npm audit + Lighthouse.
- Play-test live: arsip `https://example.com` sampai tombol unduh muncul.
- README + `docs/` lengkap dan jujur soal ketergantungan upstream.

## 11. Lisensi

MIT (LICENSE)
