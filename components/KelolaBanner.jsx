"use client";

import { useActionState } from "react";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";
import { kelolaBanner } from "@/app/admin/actions";

function FormBanner({ banner = {}, formAction, labelTombol }) {
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="aksi" value="simpan" />
      {banner.id && <input type="hidden" name="id" value={banner.id} />}
      <Input label="Judul" name="judul" defaultValue={banner.judul} required />
      <Input label="Teks" name="teks" textarea defaultValue={banner.teks ?? ""} />
      <Input label="Link gambar" name="gambar_url" defaultValue={banner.gambar_url ?? ""} />
      <Input label="Tautan" name="tautan" placeholder="/produk/1 atau https://..." defaultValue={banner.tautan ?? ""} />
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="aktif" defaultChecked={banner.aktif ?? true} className="h-4 w-4" />
        Tampilkan di beranda
      </label>
      <Tombol type="submit" className="self-start">
        {labelTombol}
      </Tombol>
    </form>
  );
}

export default function KelolaBanner({ daftarBanner }) {
  const [state, formAction] = useActionState(kelolaBanner, null);

  const handleHapus = (e, judul) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus banner "${judul}"?`)) {
      e.preventDefault();
    }
  };

  return (
    <div className="flex max-w-xl flex-col gap-6">
      {state?.error && (
        <p role="alert" className="rounded-lg border border-garis bg-permukaan p-3 text-sm text-bahaya">
          {state.error}
        </p>
      )}
      <section className="flex flex-col gap-3 rounded-xl border border-garis p-4">
        <h2 className="font-bold">Banner baru</h2>
        <FormBanner formAction={formAction} labelTombol="Tambah banner" />
      </section>

      {daftarBanner.length === 0 ? (
        <p className="text-teks-lembut">Belum ada banner.</p>
      ) : (
        daftarBanner.map((banner) => (
          <section key={banner.id} className="flex flex-col gap-3 rounded-xl border border-garis p-4">
            <h2 className="font-bold">
              {banner.judul}
              {!banner.aktif && <span className="ml-2 text-sm font-normal text-teks-lembut">(nonaktif)</span>}
            </h2>
            <FormBanner banner={banner} formAction={formAction} labelTombol="Simpan banner" />
            <div className="flex gap-2">
              <form action={formAction}>
                <input type="hidden" name="aksi" value="aktif" />
                <input type="hidden" name="id" value={banner.id} />
                <input type="hidden" name="aktif" value={String(!banner.aktif)} />
                <Tombol type="submit" varian="garis">
                  {banner.aktif ? "Nonaktifkan" : "Aktifkan"}
                </Tombol>
              </form>
              <form action={formAction} onSubmit={(e) => handleHapus(e, banner.judul)}>
                <input type="hidden" name="aksi" value="hapus" />
                <input type="hidden" name="id" value={banner.id} />
                <Tombol type="submit" varian="bahaya">
                  Hapus
                </Tombol>
              </form>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
