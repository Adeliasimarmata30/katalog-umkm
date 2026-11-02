"use client";

import { useActionState } from "react";
import { formatRupiah } from "@/lib/format";
import Tombol from "@/components/Tombol";
import { geserProduk, hapusProduk, ubahAktifProduk } from "@/app/admin/actions";

export default function TabelProduk({ daftarProduk = [], pesanKosong = "Belum ada produk" }) {
  const [state, formAction] = useActionState(hapusProduk, null);
  const [stateAktif, formAktif] = useActionState(ubahAktifProduk, null);
  const [stateGeser, formGeser] = useActionState(geserProduk, null);
  const pesanError = state?.error || stateAktif?.error || stateGeser?.error;

  const handleHapus = (e, nama) => {
    const konfirmasi = window.confirm(`Apakah Anda yakin ingin menghapus produk "${nama}"?`);
    if (!konfirmasi) {
      e.preventDefault();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {pesanError && (
        <p role="alert" className="rounded-lg border border-garis bg-permukaan p-3 text-sm text-bahaya">
          {pesanError}
        </p>
      )}
      <div className="relative overflow-x-auto rounded-2xl border border-garis">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-permukaan text-teks-lembut">
            <tr>
              <th className="px-4 py-3 font-semibold">Produk</th>
              <th className="px-4 py-3 font-semibold">Kategori</th>
              <th className="px-4 py-3 font-semibold">Harga</th>
              <th className="px-4 py-3 font-semibold">
                <span className="sr-only">Aksi</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {daftarProduk.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-teks-lembut">
                  {pesanKosong}
                </td>
              </tr>
            ) : (
              daftarProduk.map((produk) => (
                <tr key={produk.id} className="border-t border-garis">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={produk.foto_url} alt="" className="h-10 w-10 rounded-md object-cover" />
                      <span className="font-semibold">{produk.nama}</span>
                      {produk.aktif === false && (
                        <span className="rounded-md border border-garis px-2 py-0.5 text-xs text-teks-lembut">
                          Nonaktif
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-teks-lembut">{produk.kategori}</td>
                  <td className="px-4 py-3">{formatRupiah(produk.harga)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {/* US-09 dan US-10 (bonus): ubah dan hapus produk */}
                      <Tombol href={`/admin/produk/${produk.id}/ubah`} varian="garis">
                        Ubah
                      </Tombol>
                      {/* US-47: atur urutan tampil */}
                      <form action={formGeser} className="flex gap-1">
                        <input type="hidden" name="id" value={produk.id} />
                        <Tombol type="submit" name="arah" value="naik" varian="garis" aria-label={`Naikkan ${produk.nama}`}>
                          ↑
                        </Tombol>
                        <Tombol type="submit" name="arah" value="turun" varian="garis" aria-label={`Turunkan ${produk.nama}`}>
                          ↓
                        </Tombol>
                      </form>
                      {/* US-32: aktif atau nonaktifkan produk */}
                      <form action={formAktif}>
                        <input type="hidden" name="id" value={produk.id} />
                        <input type="hidden" name="aktif" value={String(produk.aktif === false)} />
                        <Tombol type="submit" varian="garis">
                          {produk.aktif === false ? "Aktifkan" : "Nonaktifkan"}
                        </Tombol>
                      </form>
                      <form action={formAction} onSubmit={(e) => handleHapus(e, produk.nama)}>
                        <input type="hidden" name="id" value={produk.id} />
                        <Tombol type="submit" varian="bahaya">
                          Hapus
                        </Tombol>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
