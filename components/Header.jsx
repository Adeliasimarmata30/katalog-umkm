import Link from "next/link";
import TautanKeranjang from "@/components/TautanKeranjang";
import TombolTema from "@/components/TombolTema";
import { ambilToko } from "@/lib/data-toko";

export default async function Header() {
  const toko = await ambilToko();

  return (
    <header className="border-b border-garis bg-latar">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-4">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-utama">
          {toko.nama}
        </Link>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/#produk" className="text-sm font-semibold hover:text-utama">
            Tanya AI
          </Link>
          <Link href="/favorit" className="text-sm font-semibold hover:text-utama">
            Favorit
          </Link>
          <TautanKeranjang />
          <TombolTema />
        </div>
      </div>
    </header>
  );
}
