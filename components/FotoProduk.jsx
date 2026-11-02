// Kolom foto_url boleh kosong, jadi produk tanpa foto diberi penanda, bukan gambar rusak.
export default function FotoProduk({ src, alt, className = "" }) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={`${alt}, belum ada foto`}
        className={`flex items-center justify-center text-sm text-teks-lembut ${className}`}
      >
        Belum ada foto
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} />;
}
