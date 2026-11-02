"use client";

import { useEffect, useState } from "react";
import KartuProduk from "@/components/KartuProduk";
import { useDaftarTersimpan } from "@/lib/penyimpanan";
import { ambilProdukPublik } from "@/app/actions";

// Menampilkan produk dari daftar id yang tersimpan di browser. Datanya tetap dibaca lewat server.
export default function DaftarProdukTersimpan({ kunci, pesanKosong = null, judul = "" }) {
  const daftarId = useDaftarTersimpan(kunci);
  const [produkMuat, setProdukMuat] = useState({ daftar: [], selesai: false });

  useEffect(() => {
    let dibatalkan = false;
    ambilProdukPublik(daftarId).then((daftar) => {
      if (!dibatalkan) setProdukMuat({ daftar, selesai: true });
    });
    return () => {
      dibatalkan = true;
    };
  }, [daftarId]);

  const daftarTampil = produkMuat.daftar.filter((produk) => daftarId.includes(produk.id));

  if (!produkMuat.selesai) return null;

  if (daftarTampil.length === 0) {
    return pesanKosong ? <p className="text-teks-lembut">{pesanKosong}</p> : null;
  }

  return (
    <section className="flex flex-col gap-4">
      {judul && <h2 className="text-xl font-bold">{judul}</h2>}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {daftarTampil.map((produk) => (
          <KartuProduk key={produk.id} produk={produk} />
        ))}
      </div>
    </section>
  );
}
