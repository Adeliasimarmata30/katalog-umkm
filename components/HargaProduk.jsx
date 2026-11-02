import { formatRupiah, hargaAkhir } from "@/lib/format";

// US-20: harga normal dicoret kalau produk punya harga diskon.
export default function HargaProduk({ produk, besar = false }) {
  const kelasHarga = besar ? "px-3 py-1 text-xl" : "px-2 py-0.5 text-sm";
  const adaDiskon = produk.harga_diskon !== null && produk.harga_diskon !== undefined;

  return (
    <div className="mt-auto flex flex-wrap items-center gap-2 self-start">
      <p className={`rounded-md bg-harga-latar font-bold text-harga ${kelasHarga}`}>
        {formatRupiah(hargaAkhir(produk))}
      </p>
      {adaDiskon && (
        <p className="text-sm text-teks-lembut line-through">
          <span className="sr-only">Harga normal </span>
          {formatRupiah(produk.harga)}
        </p>
      )}
    </div>
  );
}
