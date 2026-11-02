"use client";

import { useEffect } from "react";
import { bacaDaftar, tulisDaftar } from "@/lib/penyimpanan";

const BATAS_TERAKHIR_DILIHAT = 6;

// US-36: produk yang dibuka tersimpan di browser, yang terbaru di depan.
export default function CatatTerakhirDilihat({ produkId }) {
  useEffect(() => {
    const lainnya = bacaDaftar("terakhir-dilihat").filter((id) => id !== produkId);
    tulisDaftar("terakhir-dilihat", [produkId, ...lainnya].slice(0, BATAS_TERAKHIR_DILIHAT));
  }, [produkId]);

  return null;
}
