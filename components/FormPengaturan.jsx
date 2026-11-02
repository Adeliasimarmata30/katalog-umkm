"use client";

import { useActionState } from "react";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";
import { simpanPengaturan } from "@/app/admin/actions";

export default function FormPengaturan({ pengaturan }) {
  const [state, formAction] = useActionState(simpanPengaturan, null);
  const nilai = state?.nilai ?? pengaturan;
  const errors = state?.errors ?? {};

  return (
    <form key={JSON.stringify(state?.nilai ?? null)} action={formAction} className="flex max-w-xl flex-col gap-4">
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
      <Input label="Nama toko" name="nama" defaultValue={nilai.nama} error={errors.nama} required />
      <Input
        label="Nomor WhatsApp"
        name="nomor_whatsapp"
        inputMode="numeric"
        placeholder="6281234567890"
        defaultValue={nilai.nomor_whatsapp}
        error={errors.nomor_whatsapp}
        required
      />
      <Input label="Alamat" name="alamat" defaultValue={nilai.alamat} />
      <Input label="Jam buka" name="jam_buka" defaultValue={nilai.jam_buka} />
      <Tombol type="submit" className="self-start">
        Simpan pengaturan
      </Tombol>
    </form>
  );
}
