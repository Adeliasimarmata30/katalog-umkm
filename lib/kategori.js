// Daftar kategori untuk form produk. Gagal memuat tidak boleh menghalangi form.
export async function ambilNamaKategori(supabase) {
  const { data, error } = await supabase
    .from("kategori")
    .select("nama")
    .order("nama", { ascending: true });

  if (error) {
    console.error("Gagal memuat kategori:", error);
    return [];
  }
  return data.map((baris) => baris.nama);
}
