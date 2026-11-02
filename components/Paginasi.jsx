import Link from "next/link";

// parameter berisi query URL yang harus dipertahankan saat berpindah halaman.
export default function Paginasi({ halaman, totalHalaman, alamat = "/", parameter = {} }) {
  if (totalHalaman <= 1) return null;

  const hrefHalaman = (nomor) => {
    const params = new URLSearchParams();
    Object.entries(parameter).forEach(([kunci, isi]) => {
      if (isi) params.set(kunci, isi);
    });
    if (nomor > 1) params.set("halaman", String(nomor));
    const query = params.toString();
    return query ? `${alamat}?${query}` : alamat;
  };

  const kelas = "rounded-lg border border-garis bg-latar px-3.5 py-2 text-sm font-semibold text-teks hover:border-utama hover:text-utama";

  return (
    <nav aria-label="Halaman" className="flex items-center justify-center gap-3 py-2">
      {halaman > 1 && (
        <Link href={hrefHalaman(halaman - 1)} rel="prev" className={kelas}>
          Sebelumnya
        </Link>
      )}
      <span className="text-sm text-teks-lembut">
        Halaman {halaman} dari {totalHalaman}
      </span>
      {halaman < totalHalaman && (
        <Link href={hrefHalaman(halaman + 1)} rel="next" className={kelas}>
          Berikutnya
        </Link>
      )}
    </nav>
  );
}
