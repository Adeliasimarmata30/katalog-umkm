import Link from "next/link";
import { ambilToko } from "@/lib/data-toko";

export default async function Footer() {
  const toko = await ambilToko();

  return (
    <footer className="mt-16 border-t border-garis bg-permukaan">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-teks-lembut sm:flex-row sm:justify-between">
        <div>
          <p className="font-bold text-teks">{toko.nama}</p>
          <p>{toko.alamat}</p>
          <p>{toko.jamBuka}</p>
        </div>
        <div className="flex flex-col items-start gap-2">
          <Link href="/tentang" className="underline underline-offset-4 hover:text-utama">
            Tentang toko
          </Link>
          <Link href="/admin" className="underline underline-offset-4 hover:text-utama">
            Masuk sebagai admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
