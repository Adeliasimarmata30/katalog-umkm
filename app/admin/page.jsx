import { redirect } from "next/navigation";
import NavAdmin from "@/components/NavAdmin";
import Paginasi from "@/components/Paginasi";
import TabelProduk from "@/components/TabelProduk";
import Tombol from "@/components/Tombol";
import { ambilTeks, bacaNomorHalaman, polaCari } from "@/lib/format";
import { createSessionClient } from "@/lib/supabase/server";

const PESAN_GAGAL_MUAT = "Data produk belum bisa dimuat. Muat ulang halaman beberapa saat lagi.";
const PRODUK_PER_HALAMAN = 20;
const JUMLAH_PRODUK_TERLARIS = 5;
// Kode PostgREST saat nomor halaman melewati jumlah data
const KODE_HALAMAN_LEWAT_BATAS = "PGRST103";

// US-30: ringkasan dihitung dari seluruh produk di database.
async function ambilRingkasan(supabase) {
  const { data, error, count } = await supabase
    .from("produk")
    .select("kategori", { count: "exact" });

  if (error) {
    console.error("Gagal memuat ringkasan:", error);
    return null;
  }

  const perKategori = {};
  data.forEach(({ kategori }) => {
    const nama = kategori || "Tanpa kategori";
    perKategori[nama] = (perKategori[nama] || 0) + 1;
  });

  return {
    jumlahProduk: count ?? data.length,
    perKategori: Object.entries(perKategori).sort(([a], [b]) => a.localeCompare(b, "id")),
  };
}

// US-41: lima produk dengan klik pesan terbanyak dari tabel pencatatan klik.
async function ambilProdukTerlaris(supabase) {
  const { data: klik, error } = await supabase
    .from("klik_per_produk")
    .select("produk_id, jumlah")
    .order("jumlah", { ascending: false })
    .limit(JUMLAH_PRODUK_TERLARIS);

  if (error) {
    console.error("Gagal memuat produk terlaris:", error);
    return null;
  }
  if (klik.length === 0) return [];

  const { data: produk, error: errorProduk } = await supabase
    .from("produk")
    .select("id, nama")
    .in("id", klik.map((baris) => baris.produk_id));

  if (errorProduk) {
    console.error("Gagal memuat nama produk terlaris:", errorProduk);
    return null;
  }

  const namaProduk = Object.fromEntries(produk.map((baris) => [baris.id, baris.nama]));
  return klik.map((baris) => ({ ...baris, nama: namaProduk[baris.produk_id] || "Produk" }));
}

export default async function HalamanAdmin({ searchParams }) {
  const parameter = (await searchParams) || {};
  const cari = ambilTeks(parameter.cari);
  const halaman = bacaNomorHalaman(parameter.halaman);

  let daftarProduk = null;
  let errorMsg = null;
  let ringkasan = null;
  let produkTerlaris = null;
  let totalHalaman = 1;
  let halamanLewatBatas = false;

  try {
    // Halaman admin hanya memakai koneksi sesi supaya RLS tetap berlaku.
    const supabase = await createSessionClient();

    // US-33: pencarian dan pembatasan jumlah dilakukan di query database.
    let query = supabase.from("produk").select("*", { count: "exact" });
    if (cari) {
      query = query.ilike("nama", polaCari(cari));
    }

    const dari = (halaman - 1) * PRODUK_PER_HALAMAN;
    const { data, error, count } = await query
      .order("urutan", { ascending: true, nullsFirst: false })
      .order("id", { ascending: true })
      .range(dari, dari + PRODUK_PER_HALAMAN - 1);

    if (error?.code === KODE_HALAMAN_LEWAT_BATAS) {
      halamanLewatBatas = true;
    } else if (error) {
      console.error("Gagal memuat produk admin:", error);
      errorMsg = PESAN_GAGAL_MUAT;
    } else {
      daftarProduk = data;
      totalHalaman = Math.ceil((count || 0) / PRODUK_PER_HALAMAN);
    }

    ringkasan = await ambilRingkasan(supabase);
    produkTerlaris = await ambilProdukTerlaris(supabase);
  } catch (err) {
    console.error("Gagal memuat produk admin:", err);
    errorMsg = PESAN_GAGAL_MUAT;
  }

  if (halamanLewatBatas) {
    redirect(cari ? `/admin?cari=${encodeURIComponent(cari)}` : "/admin");
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      {ringkasan && (
        <section aria-labelledby="judul-ringkasan" className="flex flex-col gap-3">
          <h2 id="judul-ringkasan" className="text-lg font-bold">
            Ringkasan toko
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-garis bg-permukaan p-4">
              <p className="text-sm text-teks-lembut">Jumlah produk</p>
              <p className="text-2xl font-extrabold">{ringkasan.jumlahProduk}</p>
            </div>
            {ringkasan.perKategori.map(([nama, jumlah]) => (
              <div key={nama} className="rounded-xl border border-garis p-4">
                <p className="text-sm text-teks-lembut">{nama}</p>
                <p className="text-2xl font-extrabold">{jumlah}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      {produkTerlaris && (
        <section aria-labelledby="judul-terlaris" className="flex flex-col gap-3">
          <h2 id="judul-terlaris" className="text-lg font-bold">
            Produk terlaris
          </h2>
          {produkTerlaris.length === 0 ? (
            <p className="text-sm text-teks-lembut">Belum ada data klik pesan.</p>
          ) : (
            <ol className="flex flex-col gap-1 text-sm">
              {produkTerlaris.map((produk) => (
                <li key={produk.produk_id} className="flex justify-between gap-4 border-b border-garis py-1.5">
                  <span>{produk.nama}</span>
                  <span className="text-teks-lembut">{produk.jumlah} klik</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Produk</h1>
        <div className="flex flex-wrap gap-2">
          {/* US-35: unduhan berkas memakai tautan biasa, bukan navigasi Next.js */}
          <a
            href="/admin/ekspor"
            className="inline-flex items-center justify-center rounded-lg border border-garis bg-latar px-4 py-2.5 text-sm font-semibold text-teks transition-colors hover:border-utama hover:text-utama"
          >
            Ekspor CSV
          </a>
          {/* US-08 (bonus): tambah produk */}
          <Tombol href="/admin/produk/baru">Tambah produk</Tombol>
        </div>
      </div>

      {/* US-33: kata kunci tersimpan di URL */}
      <form action="/admin" className="flex flex-wrap gap-2">
        <input
          type="search"
          name="cari"
          defaultValue={cari}
          aria-label="Cari nama produk"
          placeholder="Cari nama produk..."
          className="min-w-48 flex-1 rounded-lg border border-garis bg-latar px-3 py-2 text-sm text-teks placeholder:text-teks-lembut focus:border-utama focus:outline-none"
        />
        <Tombol varian="garis">Cari</Tombol>
      </form>

      {errorMsg ? (
        <div className="rounded-xl border border-garis bg-permukaan p-6 text-center">
          <p className="font-semibold text-bahaya">Gagal memuat produk</p>
          <p className="mt-1 text-sm text-teks-lembut">{errorMsg}</p>
        </div>
      ) : (
        <>
          <TabelProduk
            daftarProduk={daftarProduk || []}
            pesanKosong={cari ? "Tidak ada produk yang cocok dengan pencarian." : "Belum ada produk"}
          />
          <Paginasi halaman={halaman} totalHalaman={totalHalaman} alamat="/admin" parameter={{ cari }} />
        </>
      )}
    </div>
  );
}
