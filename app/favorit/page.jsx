import DaftarProdukTersimpan from "@/components/DaftarProdukTersimpan";
import { ambilToko } from "@/lib/data-toko";

export async function generateMetadata() {
  const toko = await ambilToko();
  return { title: `Favorit | ${toko.nama}` };
}

export default function HalamanFavorit() {
  return (
    <div className="flex flex-col gap-6 py-8">
      <h1 className="text-2xl font-extrabold">Produk favorit</h1>
      <DaftarProdukTersimpan kunci="favorit" pesanKosong="Belum ada produk favorit." />
    </div>
  );
}
