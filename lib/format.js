export function formatRupiah(angka) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(angka);
}

// Harga yang benar-benar dibayar: harga diskon kalau ada, selain itu harga normal.
export function hargaAkhir(produk) {
  return produk.harga_diskon ?? produk.harga;
}

// Parameter URL yang sama bisa muncul dua kali (?cari=a&cari=b) dan terbaca sebagai array.
// Ambil nilai pertamanya supaya selalu berupa teks.
export function ambilTeks(nilai) {
  const teks = Array.isArray(nilai) ? nilai[0] : nilai;
  return (teks || "").trim();
}

export function bacaNomorHalaman(nilai) {
  const nomor = parseInt(ambilTeks(nilai), 10);
  return nomor >= 1 ? nomor : 1;
}

// US-49: alamat halaman kategori, misalnya "Tas Wanita" menjadi "tas-wanita".
export function slugKategori(nama) {
  return nama
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Tanda % _ dan * adalah wildcard di ilike, jadi di-escape supaya dicari apa adanya.
export function polaCari(teks) {
  return `%${teks.replace(/[\\%_*]/g, "\\$&")}%`;
}
