// Pembatasan kiriman dasar di memori server. Tidak disimpan ke database, jadi tidak ada data
// pengunjung yang tertinggal. Di Vercel, tiap instance server menghitung sendiri-sendiri.
const catatan = new Map();
const BATAS_KUNCI = 5000;

export function lewatBatas(kunci, batas, jendelaMs) {
  const sekarang = Date.now();
  const riwayat = (catatan.get(kunci) || []).filter((waktu) => sekarang - waktu < jendelaMs);

  if (riwayat.length >= batas) {
    catatan.set(kunci, riwayat);
    return true;
  }

  if (catatan.size >= BATAS_KUNCI) catatan.clear();
  catatan.set(kunci, [...riwayat, sekarang]);
  return false;
}

export function alamatPengirim(headers) {
  return headers.get("x-forwarded-for")?.split(",")[0].trim() || "tidak-diketahui";
}
