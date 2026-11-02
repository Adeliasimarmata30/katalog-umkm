"use client";

import { useState } from "react";
import Link from "next/link";
import { bacaDaftar, tulisDaftar, useDaftarTersimpan } from "@/lib/penyimpanan";

const KUNCI_BANDINGKAN = "bandingkan";
const BATAS_BANDINGKAN = 2;

export const alamatBandingkan = (daftar) =>
  daftar.length === BATAS_BANDINGKAN ? `/bandingkan?a=${daftar[0]}&b=${daftar[1]}` : "/bandingkan";

// US-37: pilihan ketiga menggantikan pilihan terlama.
export default function TombolBandingkan({ produkId }) {
  const pilihan = useDaftarTersimpan(KUNCI_BANDINGKAN);
  const [pesan, setPesan] = useState("");
  const terpilih = pilihan.includes(produkId);

  const handleKlik = () => {
    const daftar = bacaDaftar(KUNCI_BANDINGKAN);
    if (daftar.includes(produkId)) {
      tulisDaftar(KUNCI_BANDINGKAN, daftar.filter((id) => id !== produkId));
      setPesan("");
    } else if (daftar.length >= BATAS_BANDINGKAN) {
      tulisDaftar(KUNCI_BANDINGKAN, [...daftar.slice(1), produkId]);
      setPesan("Maksimal dua produk, pilihan terlama diganti.");
    } else {
      tulisDaftar(KUNCI_BANDINGKAN, [...daftar, produkId]);
      setPesan("");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleKlik}
        aria-pressed={terpilih}
        className="text-sm font-semibold text-teks-lembut underline underline-offset-4 hover:text-utama"
      >
        {terpilih ? "Batal bandingkan" : "Bandingkan produk"}
      </button>
      {pilihan.length === BATAS_BANDINGKAN && (
        <Link href={alamatBandingkan(pilihan)} className="text-sm font-semibold text-utama underline underline-offset-4">
          Lihat perbandingan
        </Link>
      )}
      <span role="status" className="text-sm text-teks-lembut">
        {pesan}
      </span>
    </div>
  );
}
