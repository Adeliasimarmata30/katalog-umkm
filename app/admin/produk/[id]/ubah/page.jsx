import { notFound } from "next/navigation";
import NavAdmin from "@/components/NavAdmin";
import FormProduk from "@/components/FormProduk";
import { ubahProduk } from "@/app/admin/actions";
import { createServerClient, createSessionClient } from "@/lib/supabase/server";

export default async function HalamanUbahProduk({ params }) {
  const { id } = await params;

  let produk = null;
  try {
    const supabase = await createSessionClient();
    const { data, error } = await supabase
      .from("produk")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!error && data) {
      produk = data;
    } else {
      const adminClient = createServerClient();
      const res = await adminClient
        .from("produk")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!res.error && res.data) {
        produk = res.data;
      }
    }
  } catch (err) {
    try {
      const adminClient = createServerClient();
      const res = await adminClient
        .from("produk")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!res.error && res.data) {
        produk = res.data;
      }
    } catch {
      // Biarkan notFound() menangani jika produk tidak ditemukan
    }
  }

  if (!produk) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <h1 className="text-2xl font-extrabold">Ubah produk</h1>
      <FormProduk produk={produk} labelTombol="Simpan perubahan" action={ubahProduk} />
    </div>
  );
}
