// Pencocokan nama produk untuk Tanya AI. Dilakukan di server supaya tidak bergantung pada model.
const BATAS_PRODUK_DISEBUT = 3;
const POLA_MINTA_REKOMENDASI =
  /\b(lain|lainnya|rekomendasi|rekomendasikan|alternatif|mirip|sejenis|serupa|selain|sarankan|termurah|termahal|lebih murah|lebih mahal|paling murah|paling mahal)\b/i;

// Spasi di awal dan akhir menjaga pencarian tetap per kata, bukan potongan kata.
const normalkan = (teks) => ` ${String(teks).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
const awalanNama = (nama) => normalkan(nama).trim().split(" ").slice(0, 2).join(" ");
const jumlahKata = (nama) => normalkan(nama).trim().split(" ").length;

// Produk katalog lain yang disebut pengunjung, dengan nama lengkap atau dua kata pertamanya.
// Dua kata pertama yang sama dengan produk yang dibuka dianggap menunjuk produk yang dibuka.
export function cariProdukDisebut(pertanyaan, katalog, produkDibuka) {
  const teks = normalkan(pertanyaan);
  const awalanDibuka = awalanNama(produkDibuka.nama);

  return (katalog || [])
    .filter((produk) => produk.id !== produkDibuka.id)
    .filter((produk) => {
      if (teks.includes(normalkan(produk.nama))) return true;
      const awalan = awalanNama(produk.nama);
      return jumlahKata(produk.nama) > 2 && awalan !== awalanDibuka && teks.includes(` ${awalan} `);
    })
    .slice(0, BATAS_PRODUK_DISEBUT);
}

// Daftar produk lain hanya dikirim ke AI kalau pengunjung memintanya,
// termasuk pertanyaan lanjutan dari permintaan rekomendasi sebelumnya.
export function mintaRekomendasi(pertanyaan, pertanyaanSebelumnya = "") {
  return POLA_MINTA_REKOMENDASI.test(pertanyaan) || POLA_MINTA_REKOMENDASI.test(pertanyaanSebelumnya);
}

// Pagar terakhir: jawaban hanya boleh memuat produk dan harga yang memang dikirim dari database.
export function jawabanSesuaiData(jawaban, { katalog, namaBoleh, hargaBoleh }) {
  const teks = normalkan(jawaban);
  const boleh = new Set(namaBoleh.map(normalkan));
  const sebutProdukLain = (katalog || []).some(
    (produk) => !boleh.has(normalkan(produk.nama)) && teks.includes(normalkan(produk.nama))
  );
  if (sebutProdukLain) return false;

  const hargaTerdaftar = new Set(hargaBoleh.map(Number));
  return [...String(jawaban).matchAll(/Rp\.?\s?(\d[\d.,]*)/gi)].every((hasil) =>
    hargaTerdaftar.has(Number(hasil[1].replace(/\D/g, "")))
  );
}
