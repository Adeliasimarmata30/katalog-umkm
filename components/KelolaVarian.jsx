"use client";

import { useActionState } from "react";
import Tombol from "@/components/Tombol";
import { kelolaVarian } from "@/app/admin/actions";

const kelasInput =
  "w-full rounded-lg border border-garis bg-latar px-3 py-2 text-teks focus:border-utama focus:outline-none";

// US-48: varian harga per ukuran.
export default function KelolaVarian({ produkId, daftarVarian }) {
  const [state, formAction] = useActionState(kelolaVarian, null);

  return (
    <section aria-labelledby="judul-varian" className="flex max-w-xl flex-col gap-3">
      <h2 id="judul-varian" className="text-lg font-bold">
        Varian harga
      </h2>
      <p className="text-sm text-teks-lembut">
        Jika ada varian, pengunjung memilih varian dan harganya mengikuti pilihan tersebut.
      </p>
      {state?.error && (
        <p role="alert" className="rounded-lg border border-garis bg-permukaan p-3 text-sm text-bahaya">
          {state.error}
        </p>
      )}

      {daftarVarian.map((varian) => (
        <div key={varian.id} className="flex flex-wrap items-center gap-2">
          <form action={formAction} className="flex flex-1 items-center gap-2">
            <input type="hidden" name="aksi" value="ubah" />
            <input type="hidden" name="id" value={varian.id} />
            <input type="hidden" name="produk_id" value={produkId} />
            <input name="nama" aria-label={`Nama varian ${varian.nama}`} defaultValue={varian.nama} required className={kelasInput} />
            <input
              name="harga"
              type="number"
              min="1"
              aria-label={`Harga varian ${varian.nama}`}
              defaultValue={varian.harga}
              required
              className={kelasInput}
            />
            <Tombol type="submit" varian="garis">
              Simpan
            </Tombol>
          </form>
          <form action={formAction}>
            <input type="hidden" name="aksi" value="hapus" />
            <input type="hidden" name="id" value={varian.id} />
            <input type="hidden" name="produk_id" value={produkId} />
            <Tombol type="submit" varian="bahaya">
              Hapus
            </Tombol>
          </form>
        </div>
      ))}

      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="aksi" value="tambah" />
        <input type="hidden" name="produk_id" value={produkId} />
        <input name="nama" aria-label="Nama varian baru" placeholder="Contoh: Ukuran M" required className={kelasInput} />
        <input
          name="harga"
          type="number"
          min="1"
          aria-label="Harga varian baru"
          placeholder="Harga"
          required
          className={kelasInput}
        />
        <Tombol type="submit">Tambah</Tombol>
      </form>
    </section>
  );
}
