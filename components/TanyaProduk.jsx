"use client";

import { useActionState } from "react";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";
import { tanyaProduk } from "@/app/actions";

// US-50: kotak tanya tentang produk, dengan ingatan beberapa pertanyaan terakhir.
export default function TanyaProduk({ produkId }) {
  const [state, formAction] = useActionState(tanyaProduk, null);
  const riwayat = state?.riwayat ?? [];
  const riwayatLama = state?.jawaban ? riwayat.slice(0, -1) : riwayat;

  return (
    <section id="tanya-ai" aria-labelledby="judul-tanya" className="flex max-w-xl scroll-mt-4 flex-col gap-3 py-4">
      <h2 id="judul-tanya" className="text-xl font-bold">
        Tanya AI tentang produk ini
      </h2>
      <p className="text-sm text-teks-lembut">
        Contoh: Cocok untuk acara apa? Ada pilihan lain yang lebih murah? Toko buka jam berapa?
      </p>
      {riwayatLama.length > 0 && (
        <ul className="flex flex-col gap-2 text-sm">
          {riwayatLama.map((item, urutan) => (
            <li key={urutan} className="rounded-lg border border-garis p-3">
              <p className="font-semibold">{item.pertanyaan}</p>
              <p className="mt-1 whitespace-pre-line text-teks-lembut">{item.jawaban}</p>
            </li>
          ))}
        </ul>
      )}
      <form key={state?.pertanyaan ?? ""} action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="produk_id" value={produkId} />
        <input type="hidden" name="riwayat" value={JSON.stringify(riwayat)} />
        <Input
          label="Pertanyaan"
          name="pertanyaan"
          maxLength={300}
          defaultValue={state?.pertanyaan}
          error={state?.error}
          required
        />
        <Tombol type="submit" className="self-start">
          Tanyakan
        </Tombol>
      </form>
      {state?.jawaban && (
        <div role="status" className="rounded-lg border border-garis bg-permukaan p-3 text-sm">
          <p className="whitespace-pre-line">{state.jawaban}</p>
          <p className="mt-2 text-xs text-teks-lembut">Jawaban dibuat AI dari data produk.</p>
        </div>
      )}
    </section>
  );
}
