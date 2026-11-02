"use client";

import { useState } from "react";

// US-23: memakai menu bagikan bawaan perangkat, atau menyalin link jika tidak tersedia.
export default function TombolBagikan({ judul }) {
  const [pesan, setPesan] = useState("");

  const handleBagikan = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: judul, url });
        setPesan("Link dibagikan");
      } catch (err) {
        // Pengunjung menutup menu bagikan: bukan kesalahan.
        if (err.name !== "AbortError") {
          setPesan("Link belum bisa dibagikan");
        }
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setPesan("Link tersalin");
    } catch {
      setPesan("Link belum bisa disalin");
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleBagikan}
        className="text-sm font-semibold text-teks-lembut underline underline-offset-4 hover:text-utama"
      >
        Bagikan produk
      </button>
      <span role="status" className="text-sm font-medium text-utama">
        {pesan}
      </span>
    </div>
  );
}
