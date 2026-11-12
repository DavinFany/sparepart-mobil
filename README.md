# CarnivalParts — Website Sparepart KIA Carnival

Website toko sparepart KIA Carnival berbasis **HTML, CSS, dan JavaScript murni** (tanpa framework, tanpa build). Responsif untuk HP, tablet, dan desktop.

## Fitur
- Katalog produk dengan pencarian (nama / nomor part / tahun), filter kategori, dan pengurutan harga
- Detail produk (popup), label diskon, Terlaris, stok menipis / habis
- Keranjang belanja (tersimpan di browser) dan checkout otomatis ke **WhatsApp**
- Tombol "Tanya Kecocokan" & "Tanya Inden" via WhatsApp
- Bagian kategori, keunggulan, cara pesan, FAQ, dan kontak

## Struktur
```
index.html        → halaman utama
css/style.css     → tampilan (warna utama di bagian :root)
js/products.js    → ⭐ DATA TOKO & DAFTAR PRODUK (cukup edit file ini)
js/app.js         → logika website (tidak perlu diubah)
images/           → taruh foto produk di sini
```

## Cara mengatur produk
Buka `js/products.js`.

**Ubah data toko** — nama, nomor WhatsApp (format `62812…` tanpa `+`), alamat, jam buka, dll. di objek `TOKO`.

**Tambah produk** — salin satu blok produk lalu ubah isinya:
```js
{
  id: "KC-021",                 // kode unik
  nama: "Radiator",
  kategori: "mesin",            // id dari daftar KATEGORI
  harga: 2500000,               // angka tanpa titik
  hargaCoret: 0,                // isi harga lama untuk tampilkan diskon
  stok: 3,                      // 0 = habis (tombol berubah jadi "Tanya Inden")
  kondisi: "OEM",               // Original | OEM | Aftermarket | Bekas
  kodePart: "25310-A9000",
  tahun: "Carnival YP 2014–2020",
  gambar: "images/radiator.jpg",// kosongkan "" untuk ikon otomatis
  unggulan: false,              // true = label "Terlaris"
  deskripsi: "Penjelasan singkat produk.",
},
```
**Hapus produk** — hapus bloknya. **Ubah harga/stok** — edit angkanya.

**Tambah kategori** — tambahkan baris di `KATEGORI`, pilih ikon: `mesin, rem, kaki, kelistrikan, filter, body, interior, oli`.

## Menjalankan
Cukup buka `index.html` di browser. Untuk online, upload semua file ke hosting statis apa pun (GitHub Pages, Netlify, Vercel, cPanel).

> Ganti nomor WhatsApp contoh (`6281234567890`) dengan nomor toko Anda sebelum dipublikasikan.
