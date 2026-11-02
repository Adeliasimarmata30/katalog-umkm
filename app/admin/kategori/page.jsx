import NavAdmin from "@/components/NavAdmin";
import KelolaKategori from "@/components/KelolaKategori";
import { createSessionClient } from "@/lib/supabase/server";

export default async function HalamanKategori() {
  let daftarKategori = null;

  try {
    const supabase = await createSessionClient();
    const { data, error } = await supabase
      .from("kategori")
      .select("id, nama")
      .order("nama", { ascending: true });

    if (error) {
      console.error("Gagal memuat kategori:", error);
    } else {
      daftarKategori = data;
    }
  } catch (err) {
    console.error("Gagal memuat kategori:", err);
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <h1 className="text-2xl font-extrabold">Kategori</h1>
      {daftarKategori ? (
        <KelolaKategori daftarKategori={daftarKategori} />
      ) : (
        <p className="text-bahaya">Kategori belum bisa dimuat. Muat ulang halaman beberapa saat lagi.</p>
      )}
    </div>
  );
}
