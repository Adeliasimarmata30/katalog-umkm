"use client";

import { useActionState } from "react";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";
import { kelolaKategori } from "@/app/admin/actions";

export default function KelolaKategori({ daftarKategori }) {
  const [state, formAction] = useActionState(kelolaKategori, null);

  const handleHapus = (e, nama) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus kategori "${nama}"?`)) {
      e.preventDefault();
    }
  };

  return (
    <div className="flex max-w-xl flex-col gap-5">
      {state?.error && (
        <p role="alert" className="rounded-lg border border-garis bg-permukaan p-3 text-sm text-bahaya">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="rounded-lg border border-garis bg-permukaan p-3 text-sm font-medium text-utama">
          {state.success}
        </p>
      )}

      <form action={formAction} className="flex items-end gap-3">
        <input type="hidden" name="aksi" value="tambah" />
        <div className="flex-1">
          <Input label="Kategori baru" name="nama" required />
        </div>
        <Tombol type="submit">Tambah kategori</Tombol>
      </form>

      {daftarKategori.length === 0 ? (
        <p className="text-teks-lembut">Belum ada kategori.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {daftarKategori.map((kategori) => (
            <li key={kategori.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-garis p-3">
              <form action={formAction} className="flex min-w-48 flex-1 items-center gap-2">
                <input type="hidden" name="aksi" value="ubah" />
                <input type="hidden" name="id" value={kategori.id} />
                <input
                  name="nama"
                  aria-label={`Nama kategori ${kategori.nama}`}
                  defaultValue={kategori.nama}
                  required
                  className="w-full rounded-lg border border-garis bg-latar px-3 py-2 text-teks focus:border-utama focus:outline-none"
                />
                <Tombol type="submit" varian="garis">
                  Simpan
                </Tombol>
              </form>
              <form action={formAction} onSubmit={(e) => handleHapus(e, kategori.nama)}>
                <input type="hidden" name="aksi" value="hapus" />
                <input type="hidden" name="id" value={kategori.id} />
                <Tombol type="submit" varian="bahaya">
                  Hapus
                </Tombol>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
