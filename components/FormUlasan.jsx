"use client";

import { useActionState } from "react";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";
import { kirimUlasan } from "@/app/actions";

export default function FormUlasan({ produkId }) {
  const [state, formAction] = useActionState(kirimUlasan, null);
  const nilai = state?.nilai ?? {};
  const errors = state?.errors ?? {};

  return (
    <form
      key={JSON.stringify(state?.nilai ?? null)}
      action={formAction}
      className="relative flex max-w-xl flex-col gap-3"
    >
      <h3 className="font-bold">Tulis ulasan</h3>
      {state?.error && <p className="text-sm text-bahaya">{state.error}</p>}
      {state?.success && <p className="text-sm font-medium text-utama">{state.success}</p>}
      <input type="hidden" name="produk_id" value={produkId} />
      {/* US-38: honeypot, disembunyikan dari pengunjung dan hanya diisi bot */}
      <input
        type="text"
        name="situs"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px opacity-0"
      />
      <Input label="Nama" name="nama" maxLength={60} defaultValue={nilai.nama} error={errors.nama} required />
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Rating
        <select
          name="rating"
          defaultValue={nilai.rating ?? ""}
          required
          className="w-full rounded-lg border border-garis bg-latar px-3 py-2.5 text-base text-teks focus:border-utama focus:outline-none"
        >
          <option value="">Pilih rating</option>
          {[5, 4, 3, 2, 1].map((angka) => (
            <option key={angka} value={angka}>
              {angka} dari 5
            </option>
          ))}
        </select>
        {errors.rating && <span className="font-normal text-bahaya">{errors.rating}</span>}
      </label>
      <Input
        label="Komentar"
        name="komentar"
        textarea
        maxLength={500}
        defaultValue={nilai.komentar}
        error={errors.komentar}
        required
      />
      <Tombol type="submit" className="self-start">
        Kirim ulasan
      </Tombol>
    </form>
  );
}
