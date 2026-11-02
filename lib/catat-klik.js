"use client";

// US-40: sendBeacon tidak menunggu jawaban server dan tetap terkirim saat halaman berpindah,
// jadi WhatsApp terbuka tanpa hambatan. Kegagalan pencatatan tidak mengganggu pengunjung.
export function catatKlikWhatsApp(produkIds) {
  try {
    navigator.sendBeacon("/api/klik", JSON.stringify({ produkIds }));
  } catch {
    // Pencatatan bersifat tambahan.
  }
}
