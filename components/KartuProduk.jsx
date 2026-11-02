import Link from "next/link";
import FotoProduk from "@/components/FotoProduk";
import HargaProduk from "@/components/HargaProduk";
import LabelProduk from "@/components/LabelProduk";
import TombolFavorit from "@/components/TombolFavorit";

export default function KartuProduk({ produk }) {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-garis bg-latar">
      <Link href={`/produk/${produk.id}`} className="group flex w-full flex-1 flex-col">
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
      {/* US-50: Tanya AI menjawab berdasarkan data satu produk. */}
      <Link
        href={`/produk/${produk.id}#tanya-ai`}
        aria-label={`Tanya AI tentang ${produk.nama}`}
        className="border-t border-garis px-3 py-2 text-center text-sm font-semibold text-utama transition-colors hover:bg-permukaan"
      >
        Tanya AI
      </Link>
      <TombolFavorit produk={produk} className="absolute right-2 top-2" />
    </div>
  );
}
