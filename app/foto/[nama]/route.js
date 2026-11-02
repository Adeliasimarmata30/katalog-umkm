import { createServerClient } from "@/lib/supabase/server";

const TIPE_BERKAS = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };
const POLA_NAMA = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

// US-29: menyajikan foto dari bucket privat lewat server.
export async function GET(request, { params }) {
  const { nama } = await params;
  const cocok = nama.match(POLA_NAMA);
  if (!cocok) {
    return new Response("Foto tidak ditemukan", { status: 404 });
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase.storage.from("foto-produk").download(nama);
    if (error) {
      return new Response("Foto tidak ditemukan", { status: 404 });
    }

    return new Response(data, {
      headers: {
        "Content-Type": TIPE_BERKAS[cocok[1]],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("Gagal membaca foto:", err);
    return new Response("Foto belum bisa dimuat", { status: 500 });
  }
}
