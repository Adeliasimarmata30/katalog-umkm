"use client";

import { bacaDaftar, tulisDaftar, useDaftarTersimpan } from "@/lib/penyimpanan";

export const KUNCI_FAVORIT = "favorit";

// US-24: favorit tersimpan di browser pengunjung.
export default function TombolFavorit({ produk, className = "" }) {
  const favorit = useDaftarTersimpan(KUNCI_FAVORIT);
  const aktif = favorit.includes(produk.id);

  const handleKlik = () => {
    const daftar = bacaDaftar(KUNCI_FAVORIT);
    tulisDaftar(
      KUNCI_FAVORIT,
      daftar.includes(produk.id) ? daftar.filter((id) => id !== produk.id) : [...daftar, produk.id]
    );
  };

  return (
    <button
      type="button"
      onClick={handleKlik}
      aria-pressed={aktif}
      aria-label={`${aktif ? "Hapus" : "Simpan"} ${produk.nama} ${aktif ? "dari" : "ke"} favorit`}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-garis bg-latar text-lg leading-none ${
        aktif ? "text-bahaya" : "text-teks-lembut"
      } ${className}`}
    >
      {aktif ? "♥" : "♡"}
    </button>
  );
}
