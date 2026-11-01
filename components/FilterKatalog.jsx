"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function FilterKatalog({
  kategoriTersedia = [],
  kategoriAktif = "",
  kataKunci = "",
}) {
  const router = useRouter();
  const [cari, setCari] = useState(kataKunci);

  useEffect(() => {
    setCari(kataKunci);
  }, [kataKunci]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (kategoriAktif && kategoriAktif !== "Semua") {
      params.set("kategori", kategoriAktif);
    }
    if (cari.trim()) {
      params.set("cari", cari.trim());
    }
    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  };

  const handleReset = () => {
    setCari("");
    router.push("/");
  };

  const adaFilter = Boolean(
    (kategoriAktif && kategoriAktif !== "Semua") || kataKunci
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Form Pencarian */}
      <form
        onSubmit={handleSubmit}
        action="/"
        method="GET"
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        {kategoriAktif && kategoriAktif !== "Semua" && (
          <input type="hidden" name="kategori" value={kategoriAktif} />
        )}
        <div className="relative flex-1">
          <input
            type="text"
            name="cari"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama produk..."
            className="w-full rounded-lg border border-garis bg-latar px-3.5 py-2.5 text-sm text-teks placeholder:text-teks-lembut focus:border-utama focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-utama px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-utama-gelap"
          >
            Cari
          </button>
          {adaFilter && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center rounded-lg border border-garis bg-latar px-4 py-2.5 text-sm font-semibold text-teks transition-colors hover:border-utama hover:text-utama"
            >
              Reset
            </button>
          )}
        </div>
      </form>

      {/* Filter Kategori */}
      {kategoriTersedia.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {kategoriTersedia.map((kat) => {
            const isSelected =
              kat === "Semua"
                ? !kategoriAktif || kategoriAktif === "Semua"
                : kategoriAktif === kat;

            const params = new URLSearchParams();
            if (kat !== "Semua") {
              params.set("kategori", kat);
            }
            if (kataKunci) {
              params.set("cari", kataKunci);
            }
            const query = params.toString();
            const href = query ? `/?${query}` : "/";

            return (
              <Link
                key={kat}
                href={href}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  isSelected
                    ? "bg-utama text-white"
                    : "border border-garis bg-permukaan text-teks hover:border-utama hover:text-utama"
                }`}
              >
                {kat}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

