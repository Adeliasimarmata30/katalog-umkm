import { alamatPengirim, lewatBatas } from "@/lib/batas-kiriman";
import { createServerClient } from "@/lib/supabase/server";

const BATAS_PRODUK = 50;
const BATAS_KIRIMAN_PER_MENIT = 30;

// US-40: mencatat klik pesan WhatsApp. Yang disimpan hanya produk dan waktu,
// data pengunjung tidak ikut tersimpan.
export async function POST(request) {
  if (lewatBatas(`klik:${alamatPengirim(request.headers)}`, BATAS_KIRIMAN_PER_MENIT, 60000)) {
    return new Response(null, { status: 429 });
  }

  let daftarId;
  try {
    daftarId = JSON.parse(await request.text()).produkIds;
  } catch {
    return new Response(null, { status: 400 });
  }

  const idValid = Array.isArray(daftarId)
    ? [...new Set(daftarId.map(Number))]
        .filter((id) => Number.isSafeInteger(id) && id > 0)
        .slice(0, BATAS_PRODUK)
    : [];
  if (idValid.length === 0) {
    return new Response(null, { status: 400 });
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("produk")
      .select("id")
      .in("id", idValid)
      .eq("aktif", true);
    if (error) throw error;

    if (data.length > 0) {
      const { error: errorSimpan } = await supabase
        .from("klik_whatsapp")
        .insert(data.map((produk) => ({ produk_id: produk.id })));
      if (errorSimpan) throw errorSimpan;
    }
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("Gagal mencatat klik:", err);
    return new Response(null, { status: 500 });
  }
}
