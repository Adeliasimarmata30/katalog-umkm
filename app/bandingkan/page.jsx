import Link from "next/link";
import { notFound } from "next/navigation";
import FotoProduk from "@/components/FotoProduk";
import HargaProduk from "@/components/HargaProduk";
import Tombol from "@/components/Tombol";
import { ambilProdukPublik } from "@/app/actions";
import { ambilTeks } from "@/lib/format";
import { ambilToko } from "@/lib/data-toko";

export async function generateMetadata() {
  const toko = await ambilToko();
  return { title: `Bandingkan produk | ${toko.nama}` };
}

export default async function HalamanBandingkan({ searchParams }) {
  const parameter = (await searchParams) || {};
  const idA = ambilTeks(parameter.a);
  const idB = ambilTeks(parameter.b);

  if (!idA || !idB || idA === idB) {
    return (
      <div className="flex flex-col items-start gap-4 py-8">
        <h1 className="text-2xl font-extrabold">Bandingkan produk</h1>
        <p className="text-teks-lembut">Pilih dua produk berbeda dari halaman detail produk.</p>
        <Tombol href="/">Lihat produk</Tombol>
      </div>
    );
  }

  const daftarProduk = await ambilProdukPublik([idA, idB]);
  if (daftarProduk.length !== 2) {
    notFound();
  }

  const baris = [
    { label: "Kategori", isi: (produk) => produk.kategori || "-" },
    { label: "Harga", isi: (produk) => <HargaProduk produk={produk} /> },
    { label: "Deskripsi", isi: (produk) => produk.deskripsi || "-" },
  ];

  return (
    <div className="flex flex-col gap-6 py-8">
      <h1 className="text-2xl font-extrabold">Bandingkan produk</h1>
      <div className="grid grid-cols-2 gap-4">
        {daftarProduk.map((produk) => (
          <div key={produk.id} className="flex flex-col gap-3">
            <FotoProduk
              src={produk.foto_url}
              alt={produk.nama}
              className="aspect-square w-full rounded-2xl border border-garis bg-permukaan object-cover"
            />
            <Link href={`/produk/${produk.id}`} className="font-semibold hover:text-utama">
              {produk.nama}
            </Link>
          </div>
        ))}
        {baris.map(({ label, isi }) =>
          daftarProduk.map((produk) => (
            <div key={`${label}-${produk.id}`} className="border-t border-garis pt-3">
              <p className="text-xs font-semibold text-teks-lembut">{label}</p>
              <div className="mt-1 text-sm">{isi(produk)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
