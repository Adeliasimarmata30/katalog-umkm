import { createSessionClient } from "@/lib/supabase/server";

const KOLOM = [
  "id",
  "nama",
  "harga",
  "harga_diskon",
  "kategori",
  "deskripsi",
  "foto_url",
  "badge",
  "habis",
  "aktif",
  "created_at",
];

// Koma, kutip, dan baris baru dibungkus kutip. Awalan = + - @ dinetralkan supaya isi sel
// tidak dijalankan sebagai rumus saat dibuka di spreadsheet.
function selCsv(nilai) {
  if (nilai === null || nilai === undefined) return "";
  let teks = String(nilai);
  if (typeof nilai === "string" && /^[=+\-@\t\r]/.test(teks)) {
    teks = `'${teks}`;
  }
  return /[",\r\n]/.test(teks) ? `"${teks.replace(/"/g, '""')}"` : teks;
}

// US-35: ekspor semua produk. Rute ini juga memeriksa login sendiri, tidak hanya lewat proxy.
export async function GET() {
  const supabase = await createSessionClient();
  const {
    data: { user },
    error: errorSesi,
  } = await supabase.auth.getUser();

  if (errorSesi || !user) {
    return new Response("Tidak diizinkan: Anda harus login terlebih dahulu.", { status: 401 });
  }

  const { data, error } = await supabase
    .from("produk")
    .select(KOLOM.join(","))
    .order("id", { ascending: true });

  if (error) {
    console.error("Gagal mengekspor produk:", error);
    return new Response("Gagal mengekspor produk. Silakan coba lagi.", { status: 500 });
  }

  const baris = data.map((produk) => KOLOM.map((kolom) => selCsv(produk[kolom])).join(","));
  // BOM membuat huruf non-ASCII terbaca benar di Excel.
  const isi = `﻿${[KOLOM.join(","), ...baris].join("\r\n")}\r\n`;

  return new Response(isi, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="produk.csv"',
      "Cache-Control": "no-store",
    },
  });
}
