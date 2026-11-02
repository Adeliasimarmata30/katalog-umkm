import FormUlasan from "@/components/FormUlasan";
import { createServerClient } from "@/lib/supabase/server";

// Ulasan yang disembunyikan admin tidak ikut tampil maupun dihitung.
async function ambilUlasan(produkId) {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("ulasan")
      .select("id, nama, rating, komentar, created_at")
      .eq("produk_id", produkId)
      .eq("disembunyikan", false)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Gagal memuat ulasan:", err);
    return [];
  }
}

// US-38: daftar ulasan dan rata-rata rating.
export default async function UlasanProduk({ produkId }) {
  const daftarUlasan = await ambilUlasan(produkId);
  const rataRata =
    daftarUlasan.length > 0
      ? daftarUlasan.reduce((jumlah, ulasan) => jumlah + ulasan.rating, 0) / daftarUlasan.length
      : 0;

  return (
    <section aria-labelledby="judul-ulasan" className="flex flex-col gap-4 py-4">
      <div>
        <h2 id="judul-ulasan" className="text-xl font-bold">
          Ulasan
        </h2>
        <p className="text-sm text-teks-lembut">
          {daftarUlasan.length > 0
            ? `Rata-rata ${rataRata.toFixed(1).replace(".", ",")} dari 5 (${daftarUlasan.length} ulasan)`
            : "Belum ada ulasan."}
        </p>
      </div>
      {daftarUlasan.length > 0 && (
        <ul className="flex max-w-2xl flex-col gap-3">
          {daftarUlasan.map((ulasan) => (
            <li key={ulasan.id} className="rounded-xl border border-garis p-3">
              <p className="text-sm font-semibold">
                {ulasan.nama} <span className="font-normal text-teks-lembut">({ulasan.rating} dari 5)</span>
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-teks-lembut">{ulasan.komentar}</p>
            </li>
          ))}
        </ul>
      )}
      <FormUlasan produkId={produkId} />
    </section>
  );
}
