// Berlaku untuk semua halaman /admin, termasuk /admin/login,
// jadi tidak boleh menampilkan menu atau tombol khusus admin.
export default function LoadingAdmin() {
  return (
    <p role="status" className="py-16 text-center text-teks-lembut">
      Memuat...
    </p>
  );
}
