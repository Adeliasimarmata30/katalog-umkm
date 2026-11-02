import { slugKategori } from "@/lib/format";
import { createServerClient } from "@/lib/supabase/server";
import { alamatSitus } from "@/lib/situs";

// Dibuat saat diminta supaya produk baru langsung masuk sitemap.
export const dynamic = "force-dynamic";

// US-27: sitemap dibuat dari database.
export default async function sitemap() {
  const situs = alamatSitus();
  const halamanTetap = [
    { url: `${situs}/`, changeFrequency: "daily", priority: 1 },
    { url: `${situs}/tentang`, changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("produk")
      .select("id, created_at")
      .eq("aktif", true)
      .order("id", { ascending: true });

    if (error) {
      console.error("Gagal membuat sitemap:", error);
      return halamanTetap;
    }

    const { data: kategori } = await supabase.from("kategori").select("nama");

    return [
      ...halamanTetap,
      ...(kategori || []).map((baris) => ({
        url: `${situs}/kategori/${slugKategori(baris.nama)}`,
        changeFrequency: "weekly",
        priority: 0.6,
      })),
      ...data.map((produk) => ({
        url: `${situs}/produk/${produk.id}`,
        lastModified: produk.created_at,
        changeFrequency: "weekly",
        priority: 0.8,
      })),
    ];
  } catch (err) {
    console.error("Gagal membuat sitemap:", err);
    return halamanTetap;
  }
}
