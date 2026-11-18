# API — Web ZIP Archiver

Dua rute, keduanya dilayani **Pages Worker** (`worker/_worker.js`) di
produksi — bukan oleh Next.js (static export tidak bisa membawa route
handler; lihat `docs/ARCHITECTURE.md`). Untuk pengembangan lokal, rute yang
sama dilayani `scripts/preview.mjs` (`npm run preview`).

Basis URL produksi: `https://web-zip-archiver.pages.dev`

## POST /api/clone/start

Memulai task cloning di upstream (saveweb2zip.com).

**Request** — `Content-Type: application/json`:

```json
{
  "url": "https://example.com",
  "renameAssets": true,
  "saveStructure": true,
  "alternativeAlgorithm": false,
  "mobileVersion": false
}
```

| Field | Tipe | Keterangan |
|---|---|---|
| `url` | string | Wajib. Harus diawali `https://` |
| `renameAssets` | boolean | Atur ulang nama file aset |
| `saveStructure` | boolean | Pertahankan struktur folder |
| `alternativeAlgorithm` | boolean | Mode kloning lambat |
| `mobileVersion` | boolean | Simulasi viewport mobile |

**Respons sukses (200)** — diteruskan dari upstream:

```json
{ "md5": "9f86d081884c7d659a2feaa0c55ad015", "isFinished": false }
```

**Respons error:**

| Status | Arti | Contoh body |
|---|---|---|
| 400 | Input tidak valid | `{ "error": "Sertakan URL lengkap yang valid (harus dimulai dengan https://)." }` |
| 400 | Body bukan JSON | `{ "error": "Body harus JSON." }` |
| 502 | Upstream tidak merespons / merespons non-2xx | `{ "error": "Gagal memulai proses cloning: …" }` |

## GET /api/clone/status?md5=…

Menanyakan status task yang sedang berjalan.

**Query:**

| Param | Keterangan |
|---|---|
| `md5` | Wajib. ID task dari `/api/clone/start` |

**Respons sukses (200)** — diteruskan dari upstream:

```json
{
  "md5": "9f86d081884c7d659a2feaa0c55ad015",
  "isFinished": true,
  "success": true,
  "copiedFilesAmount": 42,
  "startedAt": 1763433600000,
  "url": "https://example.com"
}
```

Bila task gagal di upstream, respons tetap 200 dengan field error:

```json
{
  "md5": "_0",
  "isFinished": true,
  "success": false,
  "errorText": "not_found",
  "errorCode": 404,
  "copiedFilesAmount": 0
}
```

UI menampilkan `errorText` itu sebagai pesan error dan menghentikan polling.

**Respons error:**

| Status | Arti |
|---|---|
| 400 | `md5` tidak ada |
| 502 | Upstream tidak merespons / merespons non-2xx |

## Unduhan ZIP (bukan rute API repo ini)

```
GET https://copier.saveweb2zip.com/api/downloadArchive/{md5}
```

Tautan unduhan dibuat langsung oleh UI ke host upstream — file ZIP tidak
pernah lewat Pages Worker. Artinya tautan unduhan hanya berlaku selama
upstream masih menyimpan arsipnya (penyimpanan sementara di sisi mereka).

## Batasan yang diketahui (jujur)

- **Ketergantungan penuh pada upstream.** Bila `copier.saveweb2zip.com`
  mati, berubah API, atau memblokir, kedua rute mengembalikan 502 dan
  produk tidak bisa mengarsipkan apa pun. Tidak ada fallback crawling
  sendiri.
- **Hanya situs publik https.** Situs yang butuh login, memblokir bot,
  atau sangat besar bisa gagal dengan `errorText` dari upstream.
- **Tidak ada autentikasi.** Siapa pun yang tahu URL worker bisa memulai
  task — sama seperti situs aslinya (gratis, tanpa akun).
