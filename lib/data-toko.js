import { cache } from "react";
import { connection } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { toko as tokoCadangan } from "@/lib/toko";

// US-43: data toko dari database, dengan lib/toko.js sebagai cadangan.
// connection() memastikan halaman selalu memakai data terbaru, bukan data saat build.
export const ambilToko = cache(async () => {
  await connection();

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("pengaturan_toko")
      .select("nama, nomor_whatsapp, alamat, jam_buka")
      .eq("id", 1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return tokoCadangan;

    return {
      ...tokoCadangan,
      nama: data.nama,
      nomorWhatsApp: data.nomor_whatsapp,
      alamat: data.alamat || tokoCadangan.alamat,
      jamBuka: data.jam_buka || tokoCadangan.jamBuka,
    };
  } catch (err) {
    console.error("Gagal memuat pengaturan toko:", err);
    return tokoCadangan;
  }
});
