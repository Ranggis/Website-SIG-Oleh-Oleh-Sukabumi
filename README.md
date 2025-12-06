# SIG Oleh‑Oleh Kota Sukabumi — Web‑GIS Interaktif

<p align="center">
  <img src="https://github.com/Ranggis/Api-Image/blob/main/Logo.png" width="180" alt="SIG Logo"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-brightgreen" />
  <img src="https://img.shields.io/badge/LeafletJS-1.9.4-blue" />
  <img src="https://img.shields.io/badge/Turf.js-6.5.0-yellow" />
  <img src="https://img.shields.io/badge/License-MIT-orange" />
</p>

Sistem Informasi Geografis (SIG) ini dikembangkan untuk memetakan persebaran lokasi oleh‑oleh khas di Kota Sukabumi sekaligus menghadirkan pengalaman eksplorasi yang modern, intuitif, dan relevan untuk pengguna umum maupun praktisi GIS. Proyek ini menekankan aspek visual, keakuratan spasial, serta integrasi analisis geospasial seperti pencarian jarak terdekat, buffer zona, dan validasi wilayah.

Aplikasi ini tidak hanya menampilkan titik di peta, tetapi membangun pengalaman navigasi yang kaya: mulai dari animasi loading, tema light/dark, sistem ulasan pengguna, hingga analisis proximity yang ditata secara visual. Semua dirancang agar peta terasa hidup dan mampu menyampaikan informasi dengan cara yang lebih manusiawi dan menarik.

---

## Desain & Identitas Aplikasi

SIG Oleh‑Oleh Kota Sukabumi dirancang dengan pendekatan visual yang hangat: nuansa krem keemasan, efek glow lembut, ikon kategori yang informatif, serta penggunaan tipografi Poppins agar tampilan tetap bersih dan profesional. Pengguna merasakan pengalaman yang konsisten sejak memuat aplikasi hingga menjelajahi titik‑titik di peta.

Animasi daun, transisi cahaya, dan efek floating glow memberikan sentuhan halus pada keseluruhan antarmuka—menciptakan pengalaman peta yang berbeda dari SIG biasanya yang cenderung statis.

---

## Gambaran Sistem

Aplikasi ini berjalan sebagai Web‑GIS berbasis **Leaflet.js**, diperkuat dengan **Turf.js** untuk operasi geospasial. Data titik dan batas wilayah menggunakan format **GeoJSON**, sehingga mudah dikelola dan konsisten dengan standar data geospasial modern.

Pengguna dapat:

* Menjelajahi lokasi oleh‑oleh berdasarkan kategori.
* Melihat detail tempat melalui popup kaya informasi yang menampilkan gambar, deskripsi, dan rating.
* Menggunakan fitur analisis spasial seperti jarak terdekat atau area buffer.
* Memberikan ulasan dan rating yang tersimpan ke localStorage.
* Menambahkan titik baru secara manual ke peta.

Semua fitur ini berjalan sepenuhnya di browser tanpa backend tambahan.

---

## Arsitektur Interaksi

Pengalaman aplikasi disusun sebagai rangkaian interaksi terstruktur:

**1. Loading → Transition → Peta**
Pengguna disambut dengan animasi pemuatan bertema oleh‑oleh lokal. Setelah semua layer termuat, transisi cahaya membuka tampilan utama peta dengan lembut.

**2. Sidebar Dinamis**
Panel kontrol muncul sebagai sidebar geser yang berisi layer, pencarian, serta fitur analisis. Sidebar dapat dibuka melalui ikon menu atau tombol spasi untuk aksesibilitas.

**3. Marker Interaktif**
Setiap titik menampilkan card mini dengan gambar, kategori, rating, dan tombol tindakan. Ketika diklik, peta melakukan zoom lembut dan memusatkan marker secara otomatis.

**4. Sistem Penambahan Titik**
Pengguna dapat menambahkan lokasi baru hanya ketika mengklik area yang valid di dalam Kota Sukabumi. Klik di luar batas memicu alert dengan efek audio unik.

**5. Mode Tema**
Tema dapat diganti dengan satu tombol—dan pilihan pengguna tersimpan secara permanen.

---

## Implementasi Analisis Spasial

### Jarak ke Toko Terdekat

Aplikasi mengambil posisi pengguna lalu menghitung jarak garis lurus ke titik terdekat menggunakan metode **Haversine** via Turf.js. Garis merah putus-putus ditarik dari pengguna ke toko terdekat, disertai informasi jarak dalam kilometer.

### Buffer 1 km

Aplikasi membentuk zona buffer melingkar dengan radius 1 km dari lokasi pengguna. Semua toko yang berada dalam zona tersebut ditandai dengan ikon khusus. Hasil analisis dirangkum dalam dialog yang tampil elegan.

### Reset Analisis

Semua layer analisis dapat dihapus secara instan agar peta kembali bersih.

Fitur ini menjadikan aplikasi bukan sekadar peta visual, tetapi alat analisis geospasial yang fungsional.

---

## Fondasi Teknologi

SIG ini memanfaatkan teknologi web modern:

* Leaflet.js untuk peta interaktif
* Turf.js untuk perhitungan spasial
* SweetAlert2 untuk pengalaman dialog profesional
* GeoJSON untuk struktur data spasial
* HTML, CSS, JavaScript sebagai pondasi utama

Aplikasi bersifat ringan dan dapat dijalankan hanya dengan browser modern.

---

## Struktur Proyek

```
Proyek SIG Oleh-Oleh/
├── index.html
├── CSS/
│   └── style.css
├── JS/
│   └── main.js
└── Data/
    ├── Kota Sukabumi.geojson
    ├── makanan_khas.geojson
    ├── minuman.geojson
    ├── kuliner_siap_saji.geojson
    ├── dessert_ringan.geojson
    ├── fasilitas_pendukung.geojson
    └── rute.geojson
```

---

## Pengalaman Pengguna yang Dihadirkan

Aplikasi ini berusaha mempertemukan estetika visual dan akurasi teknis. Setiap detail—warna, animasi, hingga perilaku marker—dibuat agar peta terasa menyenangkan sekaligus membantu. Bagi mahasiswa, proyek ini dapat menjadi representasi kuat dalam memahami SIG modern. Bagi pengguna umum, aplikasi menjadi panduan digital untuk menjelajahi cita rasa khas Sukabumi.

---

## Kontributor

Aplikasi ini dikembangkan oleh tim dengan dedikasi penuh dalam membangun pengalaman Web‑GIS yang elegan, fungsional, dan modern. Berikut adalah anggota kelompok yang berkontribusi dalam penelitian, desain, pengolahan data, serta pengembangan fitur analisis:

### 👥 **Tim Pengembang SIG Oleh‑Oleh Kota Sukabumi**

| Nama                          | NIM         |
| ----------------------------- | ----------- |
| **Salwa Aprilia Santi**       | 20230040141 |
| **M Ranggis Refaldi**         | 20230040197 |
| **Rizzi Alpadista**           | 20230040045 |
| **Kayla Puspita Khairiyah**   | 20230040159 |
| **Muhammad Faishal Setiawan** | 20230040146 |

Setiap anggota berperan dalam pengumpulan data, pembuatan peta tematik, implementasi analisis spasial, serta penyusunan dokumentasi proyek. Dengan kolaborasi ini, aplikasi SIG berhasil dibangun secara komprehensif dan terstruktur.
