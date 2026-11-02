import { notFound } from "next/navigation";
import NavAdmin from "@/components/NavAdmin";
import FormProduk from "@/components/FormProduk";
import KelolaVarian from "@/components/KelolaVarian";
import { ubahProduk } from "@/app/admin/actions";
import { ambilNamaKategori } from "@/lib/kategori";
import { createSessionClient } from "@/lib/supabase/server";

export default async function HalamanUbahProduk({ params }) {
  const { id } = await params;

  let produk = null;
  let daftarKategori = [];
  let daftarVarian = [];
  try {
    // Halaman admin hanya memakai koneksi sesi supaya RLS tetap berlaku.
    const supabase = await createSessionClient();
    const { data, error } = await supabase
      .from("produk")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!error && data) {
      produk = data;
      daftarKategori = await ambilNamaKategori(supabase);

      const { data: varian, error: errorVarian } = await supabase
        .from("varian_produk")
        .select("id, nama, harga")
        .eq("produk_id", id)
        .order("harga", { ascending: true });
      if (errorVarian) {
        console.error("Gagal memuat varian:", errorVarian);
      } else {
        daftarVarian = varian;
      }
    }
  } catch {
    // Biarkan notFound() menangani jika produk tidak ditemukan
  }

  if (!produk) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <h1 className="text-2xl font-extrabold">Ubah produk</h1>
      <FormProduk
        produk={produk}
        labelTombol="Simpan perubahan"
        action={ubahProduk}
        daftarKategori={daftarKategori}
      />
      <KelolaVarian produkId={produk.id} daftarVarian={daftarVarian} />
    </div>
  );
}
