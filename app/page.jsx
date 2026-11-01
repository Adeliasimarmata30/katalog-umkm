import KartuProduk from "@/components/KartuProduk";
import FilterKatalog from "@/components/FilterKatalog";
import { toko } from "@/lib/toko";
import { createServerClient } from "@/lib/supabase/server";

export default async function HalamanKatalog({ searchParams }) {
  const resolvedSearchParams = (await searchParams) || {};
  const keyword = (
    resolvedSearchParams.cari ||
    resolvedSearchParams.q ||
    resolvedSearchParams.search ||
    ""
  ).trim();

  const kategoriAktif = (
    resolvedSearchParams.kategori ||
    resolvedSearchParams.category ||
    ""
  ).trim();

  let daftarProduk = null;
  let kategoriTersedia = ["Semua"];
  let errorMsg = null;

  try {
    const supabase = createServerClient();

    // 1. Ambil seluruh kategori yang ada di tabel produk
    const { data: dataKategori } = await supabase
      .from("produk")
      .select("kategori");

    if (dataKategori) {
      const setKategori = new Set(
        dataKategori.map((p) => p.kategori).filter(Boolean)
      );
      kategoriTersedia = ["Semua", ...Array.from(setKategori)];
    }

    // 2. Query produk dengan filter kategori dan pencarian nama
    let query = supabase.from("produk").select("*");

    if (kategoriAktif && kategoriAktif !== "Semua") {
      query = query.eq("kategori", kategoriAktif);
    }

    if (keyword) {
      query = query.ilike("nama", `%${keyword}%`);
    }

    const { data, error } = await query.order("id", { ascending: true });

    if (error) {
      errorMsg = error.message;
    } else {
      daftarProduk = data;
    }
  } catch (err) {
    errorMsg = err.message || "Gagal terhubung ke database.";
  }

  return (
    <>
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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {daftarProduk.map((produk) => (
              <KartuProduk key={produk.id} produk={produk} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
