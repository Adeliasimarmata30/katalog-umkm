import NavAdmin from "@/components/NavAdmin";
import KelolaBanner from "@/components/KelolaBanner";
import { createSessionClient } from "@/lib/supabase/server";

export default async function HalamanBanner() {
  let daftarBanner = null;

  try {
    const supabase = await createSessionClient();
    const { data, error } = await supabase
      .from("banner")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Gagal memuat banner:", error);
    } else {
      daftarBanner = data;
    }
  } catch (err) {
    console.error("Gagal memuat banner:", err);
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <h1 className="text-2xl font-extrabold">Banner promo</h1>
      {daftarBanner ? (
        <KelolaBanner daftarBanner={daftarBanner} />
      ) : (
        <p className="text-bahaya">Banner belum bisa dimuat. Muat ulang halaman beberapa saat lagi.</p>
      )}
    </div>
  );
}
