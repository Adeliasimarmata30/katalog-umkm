"use client";

import { useActionState } from "react";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";
import { imporProduk } from "@/app/admin/actions";

export default function FormImpor() {
  const [state, formAction] = useActionState(imporProduk, null);

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <p className="text-sm text-teks-lembut">
        Baris pertama berisi nama kolom. Kolom nama dan harga wajib ada; kategori, deskripsi, dan foto_url
        boleh disertakan.
      </p>
      {state?.error && (
        <p role="alert" className="rounded-lg border border-garis bg-permukaan p-3 text-sm text-bahaya">
          {state.error}
        </p>
      )}
      {state?.berhasil !== undefined && (
        <section aria-label="Ringkasan impor" className="rounded-lg border border-garis bg-permukaan p-3 text-sm">
          <p className="font-semibold">
            {state.berhasil} produk berhasil, {state.gagal.length} baris gagal.
          </p>
          {state.gagal.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1 text-bahaya">
              {state.gagal.map((baris) => (
                <li key={baris.baris}>
                  Baris {baris.baris}: {baris.pesan}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      <form action={formAction} className="flex flex-col gap-4">
        <Input label="Berkas CSV" name="berkas" type="file" accept=".csv,text/csv" required />
        <Tombol type="submit" className="self-start">
          Impor produk
        </Tombol>
      </form>
    </div>
  );
}
