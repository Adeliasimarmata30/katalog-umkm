"use client";

import { useEffect, useState } from "react";

export const KUNCI_TEMA = "tema";

export default function TombolTema() {
  const [gelap, setGelap] = useState(false);

  // Tema sudah dipasang oleh skrip di layout sebelum halaman tampil.
  useEffect(() => {
    setGelap(document.documentElement.dataset.tema === "dark");
  }, []);

  const handleKlik = () => {
    const temaBaru = gelap ? "light" : "dark";
    document.documentElement.dataset.tema = temaBaru;
    setGelap(!gelap);
    try {
      window.localStorage.setItem(KUNCI_TEMA, temaBaru);
    } catch {
      // Pilihan tetap berlaku di halaman ini walau tidak bisa disimpan.
    }
  };

  return (
    <button type="button" onClick={handleKlik} className="text-sm font-semibold hover:text-utama">
      {gelap ? "Mode terang" : "Mode gelap"}
    </button>
  );
}
