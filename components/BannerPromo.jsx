import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";

async function ambilBannerAktif() {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("banner")
      .select("id, judul, teks, gambar_url, tautan")
      .eq("aktif", true)
      .order("id", { ascending: false });
    if (error) throw error;
    return data;
  } catch (err) {
    // Banner bersifat tambahan, jadi gagal dimuat tidak boleh mengganggu katalog.
    console.error("Gagal memuat banner:", err);
    return [];
  }
}

// US-42: banner aktif dari database di beranda.
export default async function BannerPromo() {
  const daftarBanner = await ambilBannerAktif();
  if (daftarBanner.length === 0) return null;

  return (
    <section aria-label="Promo" className="flex flex-col gap-3 pt-6">
      {daftarBanner.map((banner) => {
        const isi = (
          <>
            {banner.gambar_url && (
              <img src={banner.gambar_url} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
            )}
            <div>
              <p className="font-bold">{banner.judul}</p>
              {banner.teks && <p className="text-sm text-teks-lembut">{banner.teks}</p>}
            </div>
          </>
        );
        const kelas = "flex items-center gap-4 rounded-2xl border border-garis bg-permukaan p-4";

        return banner.tautan ? (
          <Link key={banner.id} href={banner.tautan} className={`${kelas} hover:border-utama`}>
            {isi}
          </Link>
        ) : (
          <div key={banner.id} className={kelas}>
            {isi}
          </div>
        );
      })}
    </section>
  );
}
