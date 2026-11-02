"use client";

import { useState } from "react";
import { formatRupiah, hargaAkhir } from "@/lib/format";
import { catatKlikWhatsApp } from "@/lib/catat-klik";
import { tambahKeKeranjang } from "@/lib/keranjang";

export default function TombolWhatsApp({ produk, nomorWhatsApp, daftarVarian = [] }) {
  // Isi kolom boleh kosong ("") selama pengunjung mengetik.
  const [isiJumlah, setIsiJumlah] = useState(1);
  const [varian, setVarian] = useState("");
  const [idVarian, setIdVarian] = useState(daftarVarian[0]?.id ?? null);
  const [ditambahkan, setDitambahkan] = useState(false);

  if (!produk) return null;

  // US-19: produk habis tidak bisa dipesan.
  if (produk.habis) {
    return (
      <p className="rounded-lg border border-garis bg-permukaan p-3 text-sm font-semibold text-teks-lembut">
        Stok habis. Produk ini belum bisa dipesan.
      </p>
    );
  }

  const jumlah = isiJumlah === "" ? 1 : isiJumlah;

  // US-48: varian dengan harga sendiri menggantikan kolom catatan dan harga produk.
  const varianTerpilih = daftarVarian.find((pilihan) => pilihan.id === idVarian);
  const hargaSatuan = varianTerpilih ? varianTerpilih.harga : hargaAkhir(produk) || 0;
  const namaVarian = varianTerpilih ? varianTerpilih.nama : varian.trim();

  const handleKurang = () => {
    if (jumlah > 1) {
      setIsiJumlah(jumlah - 1);
    }
  };

  const handleTambah = () => {
    setIsiJumlah(jumlah + 1);
  };

  const handleJumlahChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1) {
      setIsiJumlah(val);
    } else if (e.target.value === "") {
      setIsiJumlah("");
    }
  };

  const handleJumlahBlur = () => {
    setIsiJumlah(jumlah);
  };

  const handleTambahKeranjang = () => {
    tambahKeKeranjang({
      id: produk.id,
      nama: produk.nama,
      harga: hargaSatuan,
      jumlah,
      varian: namaVarian,
    });
    setDitambahkan(true);
  };

  const nomor = nomorWhatsApp ? String(nomorWhatsApp).replace(/\D/g, "") : "";

  const totalHarga = hargaSatuan * jumlah;
  const teksVarian = varianTerpilih
    ? ` (Varian: ${namaVarian}, ${formatRupiah(hargaSatuan)})`
    : namaVarian
      ? ` (Varian: ${namaVarian})`
      : "";
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
              value={isiJumlah}
              onChange={handleJumlahChange}
              onBlur={handleJumlahBlur}
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

      {daftarVarian.length > 0 ? (
        /* US-48: pilihan varian dari database */
        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-sm font-semibold text-teks">Pilih varian</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {daftarVarian.map((pilihan) => (
              <label
                key={pilihan.id}
                className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold ${
                  pilihan.id === idVarian ? "border-utama text-utama" : "border-garis text-teks"
                }`}
              >
                <input
                  type="radio"
                  name="varian"
                  value={pilihan.id}
                  checked={pilihan.id === idVarian}
                  onChange={() => setIdVarian(pilihan.id)}
                  className="sr-only"
                />
                {pilihan.nama}
              </label>
            ))}
          </div>
          <p className="text-sm text-teks-lembut">
            Harga varian: <strong className="text-teks">{formatRupiah(hargaSatuan)}</strong>
          </p>
        </fieldset>
      ) : (
        /* Pilihan Varian (opsional) */
        <div className="flex flex-col gap-1.5">
          <label htmlFor="input-varian" className="text-sm font-semibold text-teks">
            Pilihan varian / catatan <span className="text-xs font-normal text-teks-lembut">(opsional)</span>
          </label>
          <input
            id="input-varian"
            type="text"
            value={varian}
            onChange={(e) => setVarian(e.target.value)}
            placeholder="Contoh: Ukuran M, Warna biru..."
            className="w-full rounded-lg border border-garis bg-latar px-3 py-2 text-sm text-teks placeholder:text-teks-lembut focus:border-utama focus:outline-none"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {/* Tombol Pesan via WhatsApp */}
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => catatKlikWhatsApp([produk.id])}
          className="inline-flex w-full items-center justify-center rounded-lg bg-utama px-5 py-3 font-semibold text-white transition-colors hover:bg-utama-gelap sm:w-auto"
        >
          Pesan via WhatsApp
        </a>
        {/* US-21: tambah ke keranjang */}
        <button
          type="button"
          onClick={handleTambahKeranjang}
          className="inline-flex w-full items-center justify-center rounded-lg border border-garis bg-latar px-5 py-3 font-semibold text-teks transition-colors hover:border-utama hover:text-utama sm:w-auto"
        >
          Tambah ke keranjang
        </button>
        <span role="status" className="text-sm font-medium text-utama">
          {ditambahkan ? "Ditambahkan ke keranjang" : ""}
        </span>
      </div>
    </div>
  );
}
