# Panduan Pengguna — Web ZIP Archiver

Live: https://web-zip-archiver.pages.dev

## Yang dilakukan tool ini

Mengubah satu situs web publik menjadi satu file ZIP berisi halaman HTML,
aset (CSS, JavaScript, gambar), dan struktur foldernya — supaya bisa dibaca
offline, dipelajari strukturnya, atau disimpan sebagai cadangan sementara.

## Cara memakai

1. Buka https://web-zip-archiver.pages.dev.
2. Tempel URL lengkap situs target di kolom **Target URL** — harus diawali
   `https://`, misalnya `https://example.com`. (Tombol "Coba dengan
   example.com →" mengisi contoh untuk dicoba.)
3. Atur **Konfigurasi Lanjutan** bila perlu — biarkan default bila ragu:
   - **Rename Assets** — atur ulang nama file aset.
   - **Save Structure** — pertahankan struktur folder asli.
   - **Alt Algorithm** — mode kloning lambat (coba ini bila mode normal gagal).
   - **Mobile Version** — arsipkan versi mobile situs (simulasi viewport mobile).
4. Tekan **Mulai Proses Kloning**.
5. Pantau **Status Task**: jumlah file yang berhasil dikloning dan progress bar.
6. Saat status **Selesai**, tekan **Unduh Archive ZIP**. File ZIP diunduh
   dari server penyedia (saveweb2zip.com).

## Yang bisa dan tidak bisa diarsipkan

Bisa:

- Situs publik yang bisa dibuka tanpa login.
- Halaman statis maupun situs biasa (blog, landing page, dokumentasi).

Tidak bisa / sering gagal:

- Situs yang wajib login (dashboard, akun, dsb.).
- Situs yang memblokir crawler/bot.
- URL `http://` (tidak aman) — tool menolaknya sejak awal.

Bila gagal, pesan error dari penyedia akan tampil di bawah form
(misalnya situs tidak ditemukan atau tidak bisa di-crawl). Coba lagi dengan
opsi **Alt Algorithm**, atau coba URL lain.

## Catatan

- Layanan ini **100% gratis**, tanpa akun.
- Arsip disimpan **sementara** di server penyedia — unduh segera setelah
  selesai; tautan unduhan bisa kedaluwarsa.
- File ZIP hasil arsip berisi salinan situs **untuk keperluan pribadi**
  (baca offline, belajar struktur, backup). Hormati hak cipta dan
  ketentuan situs yang diarsipkan — jangan mengunggah ulang atau
  memperjualbelikan hasil arsip situs orang lain.

## Menjalankan sendiri (opsional)

```bash
npm install
npm run dev      # UI saja (http://localhost:3000) — /api/* belum aktif
npm run build    # static export ke out/ + salin worker
npm run preview  # preview lengkap (out/ + worker) di http://127.0.0.1:8788
npm test         # unit test worker
```

Deploy produksi memakai `github-actions/cf_pages.py` ke Cloudflare Pages —
lihat `docs/DEPLOYMENT.md`.
