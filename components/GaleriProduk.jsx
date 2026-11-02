"use client";

import { useState } from "react";
import FotoProduk from "@/components/FotoProduk";

// US-18: foto utama dengan gambar kecil. Produk dengan satu foto tampil tanpa gambar kecil.
export default function GaleriProduk({ fotoUtama, fotoTambahan = [], alt }) {
  const daftarFoto = [fotoUtama, ...fotoTambahan].filter(Boolean);
  const [terpilih, setTerpilih] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      <FotoProduk
        src={daftarFoto[terpilih]}
        alt={alt}
        className="aspect-square w-full rounded-2xl border border-garis bg-permukaan object-cover"
      />
      {daftarFoto.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {daftarFoto.map((foto, urutan) => (
            <button
              key={`${foto}-${urutan}`}
              type="button"
              onClick={() => setTerpilih(urutan)}
              aria-label={`Lihat foto ${urutan + 1}`}
              aria-pressed={urutan === terpilih}
              className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${
                urutan === terpilih ? "border-utama" : "border-garis"
              }`}
            >
              <img src={foto} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
