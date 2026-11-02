import NavAdmin from "@/components/NavAdmin";
import FormProduk from "@/components/FormProduk";
import { tambahProduk } from "@/app/admin/actions";
import { ambilNamaKategori } from "@/lib/kategori";
import { createSessionClient } from "@/lib/supabase/server";

// US-08 (bonus di jalur offline): tambah produk.
export default async function HalamanTambahProduk() {
  const supabase = await createSessionClient();
  const daftarKategori = await ambilNamaKategori(supabase);

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <h1 className="text-2xl font-extrabold">Tambah produk</h1>
      <FormProduk labelTombol="Simpan produk" action={tambahProduk} daftarKategori={daftarKategori} />
    </div>
  );
}
