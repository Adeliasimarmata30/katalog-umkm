"use client";

import Tombol from "@/components/Tombol";

// Tampil jika aksi admin tidak mendapat jawaban yang benar dari server, misalnya
// sesi login habis di tengah jalan atau koneksi terputus. Memuat ulang lewat browser
// supaya proxy.js mengarahkan ke /admin/login bila sesi memang sudah habis.
export default function ErrorAdmin() {
  return (
    <div className="flex flex-col items-start gap-4 py-16">
      <h1 className="text-2xl font-extrabold">Halaman admin belum bisa dimuat</h1>
      <p className="max-w-prose text-teks-lembut">
        Sesi login kamu mungkin sudah berakhir atau koneksi terputus. Perubahan terakhir bisa jadi
        belum tersimpan, jadi periksa lagi setelah halaman dimuat ulang.
      </p>
      <Tombol type="button" onClick={() => window.location.assign("/admin")}>
        Muat ulang halaman admin
      </Tombol>
    </div>
  );
}
