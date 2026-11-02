# Skema Database

Skrip dasar ada di `docs/schema.sql`. Fitur bonus membutuhkan `docs/migrasi-bonus.sql`, yang dijalankan sesudahnya. Katalog demo EYDELCH FASHION diisi oleh `docs/migrasi-katalog-fashion.sql`.

## Tabel `produk`

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | bigint | Nomor unik, dibuat otomatis |
| `nama` | text | Nama produk, wajib diisi |
| `harga` | integer | Harga dalam rupiah, tidak boleh negatif |
| `deskripsi` | text | Penjelasan produk |
| `foto_url` | text | Link gambar produk |
| `kategori` | text | Kelompok produk, misalnya "Dress" |
| `created_at` | timestamptz | Waktu dibuat, otomatis |
| `foto_tambahan` | text[] | Foto lain produk (US-18) |
| `habis` | boolean | Stok habis (US-19) |
| `harga_diskon` | integer | Harga promo, lebih kecil dari `harga` (US-20) |
| `badge` | text | "Baru", "Terlaris", atau kosong (US-20) |
| `aktif` | boolean | Produk nonaktif tidak tampil di publik (US-32) |
| `urutan` | integer | Urutan tampil di katalog (US-47) |

## Tabel tambahan

| Tabel | Isi | User story |
| --- | --- | --- |
| `kategori` | Daftar kategori. Nama juga tersimpan sebagai teks di `produk.kategori` | US-31, US-49 |
| `ulasan` | Ulasan dan rating pengunjung | US-38, US-39 |
| `klik_whatsapp` | Produk dan waktu klik pesan, tanpa data pengunjung | US-40, US-41 |
| `banner` | Banner promo di beranda | US-42 |
| `pengaturan_toko` | Satu baris data toko; `lib/toko.js` menjadi cadangan | US-43 |
| `log_aktivitas` | Siapa, aksi, dan kapan | US-45 |
| `varian_produk` | Varian dan harganya per produk | US-48 |

View `klik_per_produk` menghitung jumlah klik per produk. Bucket privat `foto-produk` menyimpan foto unggahan (US-29), yang dibaca lewat rute `/foto` di server.

## Aturan akses (RLS)

Row Level Security aktif di semua tabel.

| Siapa | Baca | Tambah | Ubah | Hapus |
| --- | --- | --- | --- | --- |
| Publik (tanpa login) | Ditolak | Ditolak | Ditolak | Ditolak |
| Admin yang login | Boleh | Boleh | Boleh | Boleh |

Pengecualian: `klik_whatsapp` hanya bisa dibaca admin, dan `log_aktivitas` hanya bisa dibaca dan ditambah, tidak bisa diubah atau dihapus dari aplikasi.

Pengunjung tetap bisa melihat katalog karena data dibaca oleh server memakai kunci rahasia, bukan langsung dari browser. Ulasan (US-38) dan catatan klik (US-40) juga ditulis oleh server memakai kunci rahasia, setelah divalidasi.
