import IsiKeranjang from "@/components/IsiKeranjang";
import { ambilToko } from "@/lib/data-toko";

export async function generateMetadata() {
  const toko = await ambilToko();
  return { title: `Keranjang | ${toko.nama}` };
}

export default async function HalamanKeranjang() {
  const toko = await ambilToko();

  return (
    <div className="flex flex-col gap-6 py-8">
      <h1 className="text-2xl font-extrabold">Keranjang</h1>
      <IsiKeranjang nomorWhatsApp={toko.nomorWhatsApp} />
    </div>
  );
}
