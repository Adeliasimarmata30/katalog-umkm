// Penanda "Habis" (US-19) dan badge "Baru" atau "Terlaris" (US-20).
export default function LabelProduk({ produk, className = "" }) {
  if (!produk.habis && !produk.badge) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {produk.habis && (
        <span className="rounded-md bg-teks px-2 py-0.5 text-xs font-bold text-latar">Habis</span>
      )}
      {produk.badge && (
        <span className="rounded-md bg-utama px-2 py-0.5 text-xs font-bold text-white">{produk.badge}</span>
      )}
    </div>
  );
}
