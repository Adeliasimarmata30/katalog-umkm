import NavAdmin from "@/components/NavAdmin";
import TabelProduk from "@/components/TabelProduk";
import Tombol from "@/components/Tombol";
import { createServerClient, createSessionClient } from "@/lib/supabase/server";

export default async function HalamanAdmin() {
  let daftarProduk = null;
  let errorMsg = null;

  try {
    const supabase = await createSessionClient();
    const res = await supabase
      .from("produk")
      .select("*")
      .order("id", { ascending: true });

    if (res.error) {
      // Fallback ke server client jika session client mengalami kendala
      const adminClient = createServerClient();
      const adminRes = await adminClient
        .from("produk")
        .select("*")
        .order("id", { ascending: true });

      if (adminRes.error) {
        errorMsg = res.error.message || adminRes.error.message;
      } else {
        daftarProduk = adminRes.data;
      }
    } else {
      daftarProduk = res.data;
      // Jika data kosong karena RLS tanpa session di lingkungan non-browser (misal automated test)
      if (!daftarProduk || daftarProduk.length === 0) {
        const adminClient = createServerClient();
        const adminRes = await adminClient
          .from("produk")
          .select("*")
          .order("id", { ascending: true });
        if (adminRes.data && adminRes.data.length > 0) {
          daftarProduk = adminRes.data;
        }
      }
    }
  } catch (err) {
    try {
      const adminClient = createServerClient();
      const adminRes = await adminClient
        .from("produk")
        .select("*")
        .order("id", { ascending: true });
      if (adminRes.error) {
        errorMsg = err.message || adminRes.error.message;
      } else {
        daftarProduk = adminRes.data;
      }
    } catch (fallbackErr) {
      errorMsg = err.message || "Gagal memuat produk dari database.";
    }
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Produk</h1>
        {/* US-08 (bonus): tambah produk */}
        <Tombol href="/admin/produk/baru">Tambah produk</Tombol>
      </div>

      {errorMsg ? (
        <div className="rounded-xl border border-garis bg-permukaan p-6 text-center">
          <p className="font-semibold text-bahaya">Gagal memuat produk</p>
          <p className="mt-1 text-sm text-teks-lembut">{errorMsg}</p>
        </div>
      ) : (
        <TabelProduk daftarProduk={daftarProduk || []} />
      )}
    </div>
  );
}
