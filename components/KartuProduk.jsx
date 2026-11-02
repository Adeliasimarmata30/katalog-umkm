import Link from "next/link";
import FotoProduk from "@/components/FotoProduk";
import HargaProduk from "@/components/HargaProduk";
import LabelProduk from "@/components/LabelProduk";
import TombolFavorit from "@/components/TombolFavorit";

export default function KartuProduk({ produk }) {
  return (
    <div className="relative flex">
      <Link
        href={`/produk/${produk.id}`}
        className="group flex w-full flex-col overflow-hidden rounded-2xl border border-garis bg-latar"
      >
        <LabelProduk produk={produk} className="absolute left-2 top-2" />
        <FotoProduk
          src={produk.foto_url}
          alt={produk.nama}
          className="aspect-square w-full bg-permukaan object-cover"
        />
        <div className="flex flex-1 flex-col gap-2 p-3">
          <p className="text-xs text-teks-lembut">{produk.kategori}</p>
          <h3 className="font-semibold leading-snug group-hover:text-utama">{produk.nama}</h3>
          <HargaProduk produk={produk} />
        </div>
      </Link>
      <TombolFavorit produk={produk} className="absolute right-2 top-2" />
    </div>
  );
}
