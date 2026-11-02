import NavAdmin from "@/components/NavAdmin";
import DaftarUlasanAdmin from "@/components/DaftarUlasanAdmin";
import { createSessionClient } from "@/lib/supabase/server";

// US-39: semua ulasan, termasuk yang disembunyikan.
async function ambilSemuaUlasan() {
  const supabase = await createSessionClient();
  const { data: ulasan, error } = await supabase
    .from("ulasan")
    .select("id, produk_id, nama, rating, komentar, disembunyikan, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const idProduk = [...new Set(ulasan.map((baris) => baris.produk_id))];
  const { data: produk, error: errorProduk } = idProduk.length
    ? await supabase.from("produk").select("id, nama").in("id", idProduk)
    : { data: [] };
  if (errorProduk) throw errorProduk;

  const namaProduk = Object.fromEntries(produk.map((baris) => [baris.id, baris.nama]));
  return ulasan.map((baris) => ({ ...baris, namaProduk: namaProduk[baris.produk_id] || "Produk" }));
}

export default async function HalamanUlasan() {
  let daftarUlasan = null;
  try {
    daftarUlasan = await ambilSemuaUlasan();
  } catch (err) {
    console.error("Gagal memuat ulasan:", err);
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <h1 className="text-2xl font-extrabold">Ulasan</h1>
      {daftarUlasan ? (
        <DaftarUlasanAdmin daftarUlasan={daftarUlasan} />
      ) : (
        <p className="text-bahaya">Ulasan belum bisa dimuat. Muat ulang halaman beberapa saat lagi.</p>
      )}
    </div>
  );
}
