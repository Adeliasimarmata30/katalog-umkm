"use client";

import { useState } from "react";
import { toko } from "@/lib/toko";
import { formatRupiah } from "@/lib/format";

export default function TombolWhatsApp({ produk }) {
  if (!produk) return null;

  const [jumlah, setJumlah] = useState(1);
  const [varian, setVarian] = useState("");

  const handleKurang = () => {
    if (jumlah > 1) {
      setJumlah(jumlah - 1);
    }
  };

  const handleTambah = () => {
    setJumlah(jumlah + 1);
  };

  const handleJumlahChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1) {
      setJumlah(val);
    } else if (e.target.value === "") {
      setJumlah(1);
    }
  };

  const nomor = toko.nomorWhatsApp
    ? String(toko.nomorWhatsApp).replace(/\D/g, "")
    : "";

  const totalHarga = (produk.harga || 0) * jumlah;
  const teksVarian = varian.trim() ? ` (Varian: ${varian.trim()})` : "";
  const pesan = `Halo, saya ingin memesan ${produk.nama}${teksVarian} sebanyak ${jumlah} pcs seharga ${formatRupiah(totalHarga)}.`;
  const href = `https://wa.me/${nomor}?text=${encodeURIComponent(pesan)}`;

  return (
    <div className="flex flex-col gap-4">
      {/* Pilihan Jumlah */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-teks">Jumlah</label>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-garis bg-latar">
            <button
              type="button"
              onClick={handleKurang}
              disabled={jumlah <= 1}
              className="px-3.5 py-2 text-base font-bold text-teks hover:bg-permukaan disabled:opacity-40 disabled:hover:bg-transparent"
              aria-label="Kurangi jumlah"
            >
              -
            </button>
            <input
              type="number"
              min="1"
              value={jumlah}
              onChange={handleJumlahChange}
              className="w-14 text-center font-semibold text-teks focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Jumlah pesanan"
            />
            <button
              type="button"
              onClick={handleTambah}
              className="px-3.5 py-2 text-base font-bold text-teks hover:bg-permukaan"
              aria-label="Tambah jumlah"
            >
              +
            </button>
          </div>
          {jumlah > 1 && (
            <span className="text-sm text-teks-lembut">
              Total: <strong className="text-teks">{formatRupiah(totalHarga)}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Pilihan Varian (opsional) */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="input-varian" className="text-sm font-semibold text-teks">
          Pilihan varian / catatan <span className="text-xs font-normal text-teks-lembut">(opsional)</span>
        </label>
        <input
          id="input-varian"
          type="text"
          value={varian}
          onChange={(e) => setVarian(e.target.value)}
          placeholder="Contoh: Ukuran M, Pedas sedang, Warna biru..."
          className="w-full rounded-lg border border-garis bg-latar px-3 py-2 text-sm text-teks placeholder:text-teks-lembut focus:border-utama focus:outline-none"
        />
      </div>

      {/* Tombol Pesan via WhatsApp */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center rounded-lg bg-utama px-5 py-3 font-semibold text-white transition-colors hover:bg-utama-gelap sm:w-auto"
      >
        Pesan via WhatsApp
      </a>
    </div>
  );
}
