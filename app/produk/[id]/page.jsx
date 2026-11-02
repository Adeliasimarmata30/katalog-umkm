import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import CatatTerakhirDilihat from "@/components/CatatTerakhirDilihat";
import GaleriProduk from "@/components/GaleriProduk";
import KartuProduk from "@/components/KartuProduk";
import TanyaProduk from "@/components/TanyaProduk";
import TombolBagikan from "@/components/TombolBagikan";
import TombolBandingkan from "@/components/TombolBandingkan";
import TombolFavorit from "@/components/TombolFavorit";
import TombolWhatsApp from "@/components/TombolWhatsApp";
import UlasanProduk from "@/components/UlasanProduk";
import HargaProduk from "@/components/HargaProduk";
import LabelProduk from "@/components/LabelProduk";
import { slugKategori } from "@/lib/format";
import { createServerClient } from "@/lib/supabase/server";
import { ambilToko } from "@/lib/data-toko";

// Kode Postgres untuk id bukan angka (22P02) dan id di luar batas bigint (22003).
// Keduanya berarti produk tidak ada, bukan database bermasalah.
const KODE_ID_TIDAK_VALID = ["22P02", "22003"];
const JUMLAH_PRODUK_TERKAIT = 3;
const PANJANG_DESKRIPSI_META = 160;

// US-17: gagal memuat produk terkait tidak boleh mengganggu halaman detail.
async function ambilProdukTerkait(produk) {
  if (!produk.kategori) return [];
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("produk")
      .select("*")
      .eq("kategori", produk.kategori)
      .eq("aktif", true)
      .neq("id", produk.id)
      .order("id", { ascending: true })
      .limit(JUMLAH_PRODUK_TERKAIT);
    if (error) {
      console.error("Gagal memuat produk terkait:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Gagal memuat produk terkait:", err);
    return [];
  }
}

// US-48: gagal memuat varian tidak boleh mengganggu halaman detail.
async function ambilVarian(produkId) {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("varian_produk")
      .select("id, nama, harga")
      .eq("produk_id", produkId)
      .order("harga", { ascending: true })
      .order("id", { ascending: true });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Gagal memuat varian:", err);
    return [];
  }
}

// Dipakai oleh metadata dan halaman; cache mencegah query ganda dalam satu permintaan.
const ambilProduk = cache(async (id) => {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("produk")
      .select("*")
      .eq("id", id)
      .eq("aktif", true)
      .maybeSingle();

    if (error && !KODE_ID_TIDAK_VALID.includes(error.code)) {
      console.error("Gagal memuat detail produk:", error);
      return { gagalMuat: true };
    }
    return { produk: data };
  } catch (err) {
    console.error("Gagal memuat detail produk:", err);
    return { gagalMuat: true };
  }
});

// US-26: judul, deskripsi, dan Open Graph sesuai produk.
export async function generateMetadata({ params }) {
  const { id } = await params;
  const [{ produk }, toko] = await Promise.all([ambilProduk(id), ambilToko()]);
  if (!produk) return { title: toko.nama };

  const judul = `${produk.nama} | ${toko.nama}`;
  const deskripsi = (produk.deskripsi || toko.tagline).slice(0, PANJANG_DESKRIPSI_META);

  return {
    title: judul,
    description: deskripsi,
    openGraph: {
      title: produk.nama,
      description: deskripsi,
      siteName: toko.nama,
      type: "website",
      url: `/produk/${produk.id}`,
      images: produk.foto_url ? [{ url: produk.foto_url, alt: produk.nama }] : undefined,
    },
  };
}

export default async function HalamanDetailProduk({ params }) {
  const { id } = await params;
  const { produk, gagalMuat } = await ambilProduk(id);

  if (gagalMuat) {
    return (
      <div className="flex flex-col items-start gap-4 py-16">
        <h1 className="text-2xl font-extrabold">Produk belum bisa dimuat</h1>
        <p className="text-teks-lembut">Muat ulang halaman beberapa saat lagi.</p>
        <Link href="/" className="text-sm text-teks-lembut underline underline-offset-4 hover:text-utama">
          Kembali ke katalog
        </Link>
      </div>
    );
  }

  if (!produk) {
    notFound();
  }

  const [produkTerkait, daftarVarian, toko] = await Promise.all([
    ambilProdukTerkait(produk),
    ambilVarian(produk.id),
    ambilToko(),
  ]);

  return (
    <>
    <CatatTerakhirDilihat produkId={produk.id} />
    <article className="grid gap-8 py-8 md:grid-cols-2 md:py-12">
      <GaleriProduk
        fotoUtama={produk.foto_url}
        fotoTambahan={produk.foto_tambahan || []}
        alt={produk.nama}
      />
      <div className="flex flex-col gap-4">
        <Link href="/" className="text-sm text-teks-lembut underline underline-offset-4 hover:text-utama">
          Kembali ke katalog
        </Link>
        {produk.kategori && (
          <Link
            href={`/kategori/${slugKategori(produk.kategori)}`}
            className="self-start text-sm text-teks-lembut underline underline-offset-4 hover:text-utama"
          >
            {produk.kategori}
          </Link>
        )}
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight">{produk.nama}</h1>
          <TombolFavorit produk={produk} className="shrink-0" />
        </div>
        <LabelProduk produk={produk} />
        <HargaProduk produk={produk} besar />
        <p className="max-w-prose leading-relaxed text-teks-lembut">{produk.deskripsi}</p>
        <TombolWhatsApp produk={produk} nomorWhatsApp={toko.nomorWhatsApp} daftarVarian={daftarVarian} />
        <TombolBagikan judul={produk.nama} />
        <TombolBandingkan produkId={produk.id} />
      </div>
    </article>
    <TanyaProduk produkId={produk.id} />
    <UlasanProduk produkId={produk.id} />
    {produkTerkait.length > 0 && (
      <section aria-labelledby="judul-terkait" className="flex flex-col gap-4 py-4">
        <h2 id="judul-terkait" className="text-xl font-bold">
          Produk terkait
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {produkTerkait.map((terkait) => (
            <KartuProduk key={terkait.id} produk={terkait} />
          ))}
        </div>
      </section>
    )}
    </>
  );
}
