"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";
import { buatDeskripsiAI } from "@/app/admin/actions";

const UKURAN_FOTO_MAKSIMAL = 2 * 1024 * 1024;

// Dipakai untuk tambah produk (US-08) dan ubah produk (US-09). Keduanya bonus di jalur offline.
// Nama field sama dengan kolom tabel "produk".
export default function FormProduk({ produk = {}, labelTombol, action, daftarKategori = [] }) {
  const [state, formAction] = useActionState(action || (() => {}), null);
  // Kategori lama yang tidak ada di daftar tetap dipertahankan supaya tidak hilang saat disimpan.
  const pilihanKategori =
    produk.kategori && !daftarKategori.includes(produk.kategori)
      ? [produk.kategori, ...daftarKategori]
      : daftarKategori;
  const formRef = useRef(null);
  const [deskripsi, setDeskripsi] = useState(produk.deskripsi || "");
  const [errorAI, setErrorAI] = useState("");
  const [errorFoto, setErrorFoto] = useState("");
  const [sedangMembuat, mulaiMembuat] = useTransition();

  // US-29: foto yang terlalu besar ditolak sebelum dikirim. Server tetap memeriksa ulang.
  const handlePilihFoto = (e) => {
    const berkas = e.target.files?.[0];
    if (berkas && berkas.size > UKURAN_FOTO_MAKSIMAL) {
      setErrorFoto("Ukuran foto maksimal 2 MB.");
      e.target.value = "";
    } else {
      setErrorFoto("");
    }
  };

  // US-14: hasil AI mengisi kolom deskripsi dan baru tersimpan saat form dikirim.
  const handleBuatDeskripsi = () => {
    const data = new FormData(formRef.current);
    setErrorAI("");
    mulaiMembuat(async () => {
      const hasil = await buatDeskripsiAI(data.get("nama"), data.get("kategori"));
      if (hasil?.deskripsi) {
        setDeskripsi(hasil.deskripsi);
      } else {
        setErrorAI(hasil?.error || "Gagal membuat deskripsi. Silakan coba lagi.");
      }
    });
  };

  // US-34: isian terakhir dipakai kembali saat server menolak. Kunci form berubah supaya
  // kolom pilihan ikut memuat nilai tersebut.
  const nilai = state?.nilai ?? produk;
  const errors = state?.errors ?? {};
  const fotoTambahan = Array.isArray(nilai.foto_tambahan)
    ? nilai.foto_tambahan.join("\n")
    : nilai.foto_tambahan || "";

  return (
    <form
      key={JSON.stringify(state?.nilai ?? null)}
      ref={formRef}
      action={action ? formAction : undefined}
      className="flex max-w-xl flex-col gap-4"
    >
      {produk.id && <input type="hidden" name="id" defaultValue={produk.id} />}
      {state?.error && (
        <p className="rounded-lg border border-garis bg-permukaan p-3 text-sm text-bahaya">
          {state.error}
        </p>
      )}
      <Input label="Nama produk" name="nama" defaultValue={nilai.nama} error={errors.nama} required />
      <Input
        label="Harga (Rp)"
        name="harga"
        type="number"
        min="1"
        defaultValue={nilai.harga}
        error={errors.harga}
        required
      />
      <Input
        label="Harga diskon (Rp, opsional)"
        name="harga_diskon"
        type="number"
        min="0"
        defaultValue={nilai.harga_diskon ?? ""}
        error={errors.harga_diskon}
      />
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Badge (opsional)
        <select
          name="badge"
          defaultValue={nilai.badge || ""}
          className="w-full rounded-lg border border-garis bg-latar px-3 py-2.5 text-base text-teks focus:border-utama focus:outline-none"
        >
          <option value="">Tanpa badge</option>
          <option value="Baru">Baru</option>
          <option value="Terlaris">Terlaris</option>
        </select>
        {errors.badge && <span className="font-normal text-bahaya">{errors.badge}</span>}
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Kategori
        <select
          name="kategori"
          defaultValue={nilai.kategori || ""}
          className="w-full rounded-lg border border-garis bg-latar px-3 py-2.5 text-base text-teks focus:border-utama focus:outline-none"
        >
          <option value="">Tanpa kategori</option>
          {pilihanKategori.map((nama) => (
            <option key={nama} value={nama}>
              {nama}
            </option>
          ))}
        </select>
      </label>
      <Input
        label="Link foto"
        name="foto_url"
        placeholder="https://... atau /produk/nama-file.svg"
        defaultValue={nilai.foto_url}
      />
      <div className="flex flex-col gap-1.5">
        <Input
          label="Unggah foto utama (JPG, PNG, atau WebP, maksimal 2 MB)"
          name="foto_berkas"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePilihFoto}
          error={errorFoto || errors.foto_berkas}
        />
      </div>
      <Input
        label="Foto tambahan (satu link per baris, opsional)"
        name="foto_tambahan"
        textarea
        defaultValue={fotoTambahan}
        error={errors.foto_tambahan}
      />
      <div className="flex flex-col gap-2">
        <Input
          label="Deskripsi"
          name="deskripsi"
          textarea
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
        />
        <Tombol
          type="button"
          varian="garis"
          className="self-start"
          onClick={handleBuatDeskripsi}
          disabled={sedangMembuat}
        >
          {sedangMembuat ? "Membuat deskripsi..." : "Buat deskripsi dengan AI"}
        </Tombol>
        {errorAI && <p className="text-sm text-bahaya">{errorAI}</p>}
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="habis" defaultChecked={Boolean(nilai.habis)} className="h-4 w-4" />
        Stok habis
      </label>
      <div className="flex gap-3">
        <Tombol type="submit">{labelTombol}</Tombol>
        <Tombol href="/admin" varian="garis">
          Batal
        </Tombol>
      </div>
    </form>
  );
}
