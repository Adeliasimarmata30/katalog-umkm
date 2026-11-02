"use client";

import Link from "next/link";
import { useDaftarTersimpan } from "@/lib/penyimpanan";
import { KUNCI_KERANJANG } from "@/lib/keranjang";

export default function TautanKeranjang() {
  const keranjang = useDaftarTersimpan(KUNCI_KERANJANG);
  const jumlah = keranjang.reduce((total, item) => total + item.jumlah, 0);

  return (
    <Link href="/keranjang" className="text-sm font-semibold hover:text-utama">
      Keranjang{jumlah > 0 ? ` (${jumlah})` : ""}
    </Link>
  );
}
