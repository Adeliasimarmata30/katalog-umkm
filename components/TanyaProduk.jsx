"use client";

import { useActionState } from "react";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";
import { tanyaProduk } from "@/app/actions";

// US-50: kotak tanya tentang produk.
export default function TanyaProduk({ produkId }) {
  const [state, formAction] = useActionState(tanyaProduk, null);

  return (
    <section id="tanya-ai" aria-labelledby="judul-tanya" className="flex max-w-xl scroll-mt-4 flex-col gap-3 py-4">
      <h2 id="judul-tanya" className="text-xl font-bold">
        Tanya AI tentang produk ini
      </h2>
      <form key={state?.pertanyaan ?? ""} action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="produk_id" value={produkId} />
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
