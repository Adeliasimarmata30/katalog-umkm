"use client";

import Link from "next/link";
import Tombol from "@/components/Tombol";
import { catatKlikWhatsApp } from "@/lib/catat-klik";
import { formatRupiah } from "@/lib/format";
import { useDaftarTersimpan } from "@/lib/penyimpanan";
import { KUNCI_KERANJANG, hapusItem, kunciItem, ubahJumlahItem } from "@/lib/keranjang";

export default function IsiKeranjang({ nomorWhatsApp }) {
  const keranjang = useDaftarTersimpan(KUNCI_KERANJANG);

  if (keranjang.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 py-4">
        <p className="text-teks-lembut">Keranjang masih kosong.</p>
        <Tombol href="/">Lihat produk</Tombol>
      </div>
    );
  }

  const total = keranjang.reduce((jumlah, item) => jumlah + item.harga * item.jumlah, 0);
  const daftarPesanan = keranjang.map((item, urutan) => {
    const varian = item.varian ? ` (Varian: ${item.varian})` : "";
    return `${urutan + 1}. ${item.nama}${varian} sebanyak ${item.jumlah} pcs = ${formatRupiah(item.harga * item.jumlah)}`;
  });
  const pesan = ["Halo, saya ingin memesan:", ...daftarPesanan, `Total: ${formatRupiah(total)}`].join("\n");
  const href = `https://wa.me/${String(nomorWhatsApp).replace(/\D/g, "")}?text=${encodeURIComponent(pesan)}`;

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {keranjang.map((item) => {
          const kunci = kunciItem(item);
          return (
            <li key={kunci} className="flex flex-wrap items-center gap-3 rounded-xl border border-garis p-3">
              <div className="min-w-40 flex-1">
                <Link href={`/produk/${item.id}`} className="font-semibold hover:text-utama">
                  {item.nama}
                </Link>
                {item.varian && <p className="text-sm text-teks-lembut">Varian: {item.varian}</p>}
                <p className="text-sm text-teks-lembut">{formatRupiah(item.harga)}</p>
              </div>
              <div className="flex items-center rounded-lg border border-garis">
                <button
                  type="button"
                  onClick={() => ubahJumlahItem(kunci, item.jumlah - 1)}
                  disabled={item.jumlah <= 1}
                  aria-label={`Kurangi jumlah ${item.nama}`}
                  className="px-3 py-1.5 font-bold disabled:opacity-40"
                >
                  -
                </button>
                <span className="w-8 text-center font-semibold">{item.jumlah}</span>
                <button
                  type="button"
                  onClick={() => ubahJumlahItem(kunci, item.jumlah + 1)}
                  aria-label={`Tambah jumlah ${item.nama}`}
                  className="px-3 py-1.5 font-bold"
                >
                  +
                </button>
              </div>
              <p className="w-28 text-right font-semibold">{formatRupiah(item.harga * item.jumlah)}</p>
              <button
                type="button"
                onClick={() => hapusItem(kunci)}
                aria-label={`Hapus ${item.nama} dari keranjang`}
                className="text-sm text-bahaya underline underline-offset-4"
              >
                Hapus
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-right text-lg font-bold">Total: {formatRupiah(total)}</p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => catatKlikWhatsApp(keranjang.map((item) => item.id))}
        className="inline-flex items-center justify-center self-end rounded-lg bg-utama px-5 py-3 font-semibold text-white transition-colors hover:bg-utama-gelap"
      >
        Pesan semua via WhatsApp
      </a>
    </div>
  );
}
