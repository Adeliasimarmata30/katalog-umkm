// US-28: tampilan sementara untuk halaman publik yang sedang mengambil data.
export default function LoadingHalaman() {
  return (
    <div className="flex flex-col gap-6 py-10">
      <p role="status" className="text-teks-lembut">
        Memuat produk...
      </p>
      <div aria-hidden="true" className="grid animate-pulse grid-cols-2 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((nomor) => (
          <div key={nomor} className="aspect-square rounded-2xl bg-permukaan" />
        ))}
      </div>
    </div>
  );
}
