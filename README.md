# Website Toko Sparepart Mobil

Website toko sparepart (baru & bekas) untuk **Kia Carnival, Kia Carens 1, dan Chevrolet / Opel Blazer**.
Dibuat dengan HTML, CSS, dan JavaScript murni, tanpa build, dan responsif untuk HP.

- `index.html`: website toko. Pengunjung memilih **mobil**, lalu **jenis produk** (rem, mesin, dll.), dan bisa memfilter kondisi Baru/Bekas.
- `admin.html`: **panel admin** untuk mengelola semua isi toko lewat formulir, tanpa mengedit kode.

## Mengelola produk lewat Panel Admin

Buka `https://<alamat-website-anda>/admin.html` (mis. `https://sparepart-mobil.vercel.app/admin.html`).

| Yang ingin diubah | Caranya |
|---|---|
| Harga & stok | Langsung di daftar produk (tombol − / + untuk stok) |
| Sembunyikan produk sementara | Matikan tombol **Tampil** |
| Foto, deskripsi, spesifikasi, berat, Baru/Bekas, mobil, jenis | Klik **Edit** pada produk |
| Produk baru | **+ Tambah Produk** (atau ⧉ untuk menduplikat produk mirip) |
| Daftar mobil & jenis produk | Tab **Mobil & Jenis Produk** |
| Nama toko, WhatsApp, alamat | Tab **Info Toko** |

Setelah selesai, klik **Publikasikan**. Vercel memperbarui website dalam ±1 menit.

### Atur publikasi otomatis (sekali saja)
Agar tombol **Publikasikan** langsung memperbarui website tanpa upload manual:

1. **Buat token GitHub**: GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
   - *Repository access*: **Only select repositories**, lalu pilih repo website ini.
   - *Permissions → Repository permissions*: **Contents: Read and write**.
   - Generate, lalu salin token.
2. **Simpan di Vercel**: Project → **Settings → Environment Variables**, tambahkan:
   - `GITHUB_TOKEN`: token dari langkah 1
   - `ADMIN_PASSWORD`: password untuk masuk panel admin
3. Vercel → **Deployments** → ⋯ pada deployment teratas → **Redeploy**.

Selesai. Buka `/admin.html` dari HP atau laptop mana pun, masukkan password, ubah produk, lalu klik **Publikasikan**.
Token tersimpan aman di Vercel (tidak pernah dikirim ke browser), dan proses publikasi ditangani oleh `api/admin.js`.

> Repo & branch terdeteksi otomatis dari Vercel. Jika perlu, atur manual dengan `GITHUB_REPO` (`username/nama-repo`) dan `GITHUB_BRANCH`.

Alternatif tanpa pengaturan Vercel: masukkan token langsung di tab **Koneksi & Publikasi** (per perangkat), atau gunakan **Unduh data.js & foto baru** lalu upload manual.

## Struktur
```
index.html        → website toko
admin.html        → panel admin
api/admin.js      → fungsi server Vercel untuk login password & publikasi otomatis
api/foto.js       → halaman foto produk (/foto/ID) untuk link di chat WhatsApp
vercel.json       → mengarahkan /foto/ID ke api/foto.js
data/data.js      → ⭐ semua data toko, mobil, jenis produk & produk (diubah oleh panel admin)
images/produk/    → foto produk (diunggah otomatis oleh panel admin)
images/mobil/     → foto mobil (opsional)
css/style.css     → tampilan website (warna utama di :root)
css/admin.css     → tampilan panel admin
js/app.js         → logika website
js/admin.js       → logika panel admin
js/icons.js       → ikon & ilustrasi mobil
```

## Format data produk (jika ingin edit manual `data/data.js`)
```json
{
  "id": "P-0001",
  "nama": "Kampas Rem Depan",
  "mobil": ["kia-carnival"],
  "kategori": "rem",
  "harga": 850000,
  "hargaCoret": 975000,
  "stok": 24,
  "berat": 1200,
  "kondisi": "Baru",
  "kualitas": "Original",
  "kodePart": "58101-A9A70",
  "foto": ["images/produk/kampas-rem.jpg"],
  "deskripsi": "…",
  "spesifikasi": [{ "label": "Posisi", "nilai": "Depan" }],
  "unggulan": true,
  "aktif": true
}
```
`berat` dalam gram · `kondisi`: `Baru` / `Bekas` · `kualitas`: `Original` / `OEM` / `Aftermarket` / kosong · `stok: 0` = habis (tombol berubah jadi "Tanya Inden") · `aktif: false` = disembunyikan.

## Menjalankan di komputer
Buka `index.html` atau `admin.html` langsung di browser. Upload semua file ke hosting statis (Vercel, Netlify, GitHub Pages).

> Data toko & produk saat ini masih **contoh**. Ganti nomor WhatsApp, alamat, dan produk lewat panel admin.
