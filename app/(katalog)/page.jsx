import { redirect } from "next/navigation";
import BannerPromo from "@/components/BannerPromo";
import DaftarProdukTersimpan from "@/components/DaftarProdukTersimpan";
import KartuProduk from "@/components/KartuProduk";
import FilterKatalog from "@/components/FilterKatalog";
import Paginasi from "@/components/Paginasi";
import { ambilTeks, bacaNomorHalaman, polaCari } from "@/lib/format";
import { ambilToko } from "@/lib/data-toko";
import { createServerClient } from "@/lib/supabase/server";

const PESAN_GAGAL_MUAT = "Produk belum bisa dimuat. Muat ulang halaman beberapa saat lagi.";
const PRODUK_PER_HALAMAN = 12;
// Kode PostgREST saat nomor halaman melewati jumlah data
const KODE_HALAMAN_LEWAT_BATAS = "PGRST103";

const URUTAN = {
  termurah: { kolom: "harga", naik: true },
  termahal: { kolom: "harga", naik: false },
  terbaru: { kolom: "created_at", naik: false },
};

export default async function HalamanKatalog({ searchParams }) {
  const toko = await ambilToko();
  const resolvedSearchParams = (await searchParams) || {};
  const keyword = ambilTeks(
    resolvedSearchParams.cari ||
      resolvedSearchParams.q ||
      resolvedSearchParams.search
  );

  const kategoriAktif = ambilTeks(
    resolvedSearchParams.kategori || resolvedSearchParams.category
  );

  const urutAktif = ambilTeks(resolvedSearchParams.urut);

  const halaman = bacaNomorHalaman(resolvedSearchParams.halaman);

  let daftarProduk = null;
  let kategoriTersedia = ["Semua"];
  let errorMsg = null;
  let totalHalaman = 1;
  let halamanLewatBatas = false;

  try {
    const supabase = createServerClient();

    // 1. Ambil seluruh kategori yang ada di tabel produk
    const { data: dataKategori } = await supabase
      .from("produk")
      .select("kategori")
      .eq("aktif", true);

    if (dataKategori) {
      const setKategori = new Set(
        dataKategori.map((p) => p.kategori).filter(Boolean)
      );
      kategoriTersedia = ["Semua", ...Array.from(setKategori)];
    }

    // 2. Query produk dengan filter kategori dan pencarian nama
    // US-32: produk nonaktif tidak tampil di katalog publik
    let query = supabase.from("produk").select("*", { count: "exact" }).eq("aktif", true);

    if (kategoriAktif && kategoriAktif !== "Semua") {
      query = query.eq("kategori", kategoriAktif);
    }

    if (keyword) {
      query = query.ilike("nama", polaCari(keyword));
    }

    // US-15: urutan diterapkan di query, id menjaga urutan tetap stabil
    const urutan = URUTAN[urutAktif];
    if (urutan) {
      query = query.order(urutan.kolom, { ascending: urutan.naik });
    } else {
      // US-47: urutan bawaan mengikuti pengaturan admin
      query = query.order("urutan", { ascending: true, nullsFirst: false });
    }

    // US-16: jumlah produk dibatasi di query database
    const dari = (halaman - 1) * PRODUK_PER_HALAMAN;
    const { data, error, count } = await query
      .order("id", { ascending: true })
      .range(dari, dari + PRODUK_PER_HALAMAN - 1);

    if (error?.code === KODE_HALAMAN_LEWAT_BATAS) {
      halamanLewatBatas = true;
    } else if (error) {
      console.error("Gagal memuat katalog:", error);
      errorMsg = PESAN_GAGAL_MUAT;
    } else {
      daftarProduk = data;
      totalHalaman = Math.ceil((count || 0) / PRODUK_PER_HALAMAN);
    }
  } catch (err) {
    console.error("Gagal memuat katalog:", err);
    errorMsg = PESAN_GAGAL_MUAT;
  }

  if (halamanLewatBatas) {
    const params = new URLSearchParams();
    if (kategoriAktif) params.set("kategori", kategoriAktif);
    if (keyword) params.set("cari", keyword);
    if (urutAktif) params.set("urut", urutAktif);
    const query = params.toString();
    redirect(query ? `/?${query}` : "/");
  }

  return (
    <>
      <BannerPromo />
      <section className="py-10 sm:py-14">
        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          {toko.nama}
        </h1>
        <p className="mt-3 max-w-xl text-lg text-teks-lembut">{toko.tagline}</p>
        <p className="mt-4 text-sm text-teks-lembut">{toko.jamBuka}</p>
      </section>

      <section aria-labelledby="judul-produk" className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <h2 id="judul-produk" className="text-xl font-bold">
            Produk kami
          </h2>
          <FilterKatalog
            kategoriTersedia={kategoriTersedia}
            kategoriAktif={kategoriAktif}
            kataKunci={keyword}
            urutAktif={URUTAN[urutAktif] ? urutAktif : ""}
          />
        </div>

        {errorMsg ? (
          <div className="rounded-xl border border-garis bg-permukaan p-6 text-center">
            <p className="font-semibold text-bahaya">Gagal memuat produk</p>
            <p className="mt-1 text-sm text-teks-lembut">{errorMsg}</p>
          </div>
        ) : !daftarProduk || daftarProduk.length === 0 ? (
          <div className="py-8 text-center text-teks-lembut">
            {keyword || (kategoriAktif && kategoriAktif !== "Semua") ? (
              <p>Belum ada produk yang sesuai dengan filter atau pencarian.</p>
            ) : (
              <p>Belum ada produk</p>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {daftarProduk.map((produk) => (
                <KartuProduk key={produk.id} produk={produk} />
              ))}
            </div>
            <Paginasi
              halaman={halaman}
              totalHalaman={totalHalaman}
              parameter={{
                kategori: kategoriAktif,
                cari: keyword,
                urut: URUTAN[urutAktif] ? urutAktif : "",
              }}
            />
          </>
        )}
      </section>

      {/* US-36: tidak tampil selama masih kosong */}
      <div className="pt-10">
        <DaftarProdukTersimpan kunci="terakhir-dilihat" judul="Terakhir dilihat" />
      </div>
    </>
  );
}
