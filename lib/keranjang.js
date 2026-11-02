"use client";

import { bacaDaftar, tulisDaftar } from "@/lib/penyimpanan";

export const KUNCI_KERANJANG = "keranjang-fashion";

// Keranjang dari katalog lama berisi produk yang sudah tidak dijual.
const KUNCI_KERANJANG_LAMA = "keranjang";
if (typeof window !== "undefined") {
  try {
    window.localStorage.removeItem(KUNCI_KERANJANG_LAMA);
  } catch {
    // Penyimpanan browser bisa diblokir, misalnya di mode privat.
  }
}

// Produk yang sama dengan varian berbeda dihitung sebagai item terpisah.
export const kunciItem = (item) => `${item.id}|${item.varian || ""}`;

export function tambahKeKeranjang(itemBaru) {
  const keranjang = bacaDaftar(KUNCI_KERANJANG);
  const sudahAda = keranjang.some((item) => kunciItem(item) === kunciItem(itemBaru));

  tulisDaftar(
    KUNCI_KERANJANG,
    sudahAda
      ? keranjang.map((item) =>
          kunciItem(item) === kunciItem(itemBaru)
            ? { ...item, jumlah: item.jumlah + itemBaru.jumlah }
            : item
        )
      : [...keranjang, itemBaru]
  );
}

export function ubahJumlahItem(kunci, jumlah) {
  tulisDaftar(
    KUNCI_KERANJANG,
    bacaDaftar(KUNCI_KERANJANG).map((item) => (kunciItem(item) === kunci ? { ...item, jumlah } : item))
  );
}

export function hapusItem(kunci) {
  tulisDaftar(
    KUNCI_KERANJANG,
    bacaDaftar(KUNCI_KERANJANG).filter((item) => kunciItem(item) !== kunci)
  );
}

export function kosongkanKeranjang() {
  tulisDaftar(KUNCI_KERANJANG, []);
}
