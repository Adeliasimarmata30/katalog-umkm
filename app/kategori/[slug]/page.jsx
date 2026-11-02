import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import KartuProduk from "@/components/KartuProduk";
import { ambilToko } from "@/lib/data-toko";
import { slugKategori } from "@/lib/format";
import { createServerClient } from "@/lib/supabase/server";

// US-49: nama kategori dicari dari daftar kategori berdasarkan slug di alamat.
const ambilKategori = cache(async (slug) => {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("kategori").select("nama");
  if (error) throw error;
  return data.find((kategori) => slugKategori(kategori.nama) === slug)?.nama ?? null;
});

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const toko = await ambilToko();
  try {
    const nama = await ambilKategori(slug);
    return { title: nama ? `${nama} | ${toko.nama}` : toko.nama };
  } catch {
    return { title: toko.nama };
  }
}

export default async function HalamanKategori({ params }) {
  const { slug } = await params;

  let namaKategori = null;
  let daftarProduk = [];
  let gagalMuat = false;

  try {
    namaKategori = await ambilKategori(slug);

    if (namaKategori) {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("produk")
        .select("*")
        .eq("kategori", namaKategori)
        .eq("aktif", true)
        .order("urutan", { ascending: true, nullsFirst: false })
        .order("id", { ascending: true });
      if (error) throw error;
      daftarProduk = data;
    }
  } catch (err) {
    console.error("Gagal memuat kategori:", err);
    gagalMuat = true;
  }

  if (gagalMuat) {
    return (
      <div className="flex flex-col items-start gap-4 py-16">
        <h1 className="text-2xl font-extrabold">Kategori belum bisa dimuat</h1>
        <p className="text-teks-lembut">Muat ulang halaman beberapa saat lagi.</p>
      </div>
    );
  }

  if (!namaKategori) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <div>
        <Link href="/" className="text-sm text-teks-lembut underline underline-offset-4 hover:text-utama">
          Kembali ke katalog
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold">{namaKategori}</h1>
      </div>
      {daftarProduk.length === 0 ? (
        <p className="text-teks-lembut">Belum ada produk di kategori ini.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {daftarProduk.map((produk) => (
            <KartuProduk key={produk.id} produk={produk} />
          ))}
        </div>
      )}
    </div>
  );
}
