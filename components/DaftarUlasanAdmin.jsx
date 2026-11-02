"use client";

import { useActionState } from "react";
import Tombol from "@/components/Tombol";
import { kelolaUlasan } from "@/app/admin/actions";

export default function DaftarUlasanAdmin({ daftarUlasan }) {
  const [state, formAction] = useActionState(kelolaUlasan, null);

  const handleHapus = (e) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus ulasan ini?")) {
      e.preventDefault();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {state?.error && (
        <p role="alert" className="rounded-lg border border-garis bg-permukaan p-3 text-sm text-bahaya">
          {state.error}
        </p>
      )}
      {daftarUlasan.length === 0 ? (
        <p className="text-teks-lembut">Belum ada ulasan.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {daftarUlasan.map((ulasan) => (
            <li key={ulasan.id} className="flex flex-col gap-2 rounded-xl border border-garis p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{ulasan.nama}</p>
                <p className="text-sm text-teks-lembut">
                  {ulasan.rating} dari 5 untuk {ulasan.namaProduk}
                </p>
                {ulasan.disembunyikan && (
                  <span className="rounded-md border border-garis px-2 py-0.5 text-xs text-teks-lembut">
                    Disembunyikan
                  </span>
                )}
              </div>
              <p className="whitespace-pre-line text-sm text-teks-lembut">{ulasan.komentar}</p>
              <div className="flex gap-2">
                <form action={formAction}>
                  <input type="hidden" name="id" value={ulasan.id} />
                  <input type="hidden" name="aksi" value={ulasan.disembunyikan ? "tampilkan" : "sembunyikan"} />
                  <Tombol type="submit" varian="garis">
                    {ulasan.disembunyikan ? "Tampilkan" : "Sembunyikan"}
                  </Tombol>
                </form>
                <form action={formAction} onSubmit={handleHapus}>
                  <input type="hidden" name="id" value={ulasan.id} />
                  <input type="hidden" name="aksi" value="hapus" />
                  <Tombol type="submit" varian="bahaya">
                    Hapus
                  </Tombol>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
