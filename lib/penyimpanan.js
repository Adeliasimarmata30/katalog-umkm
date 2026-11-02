"use client";

import { useSyncExternalStore } from "react";

// Daftar yang tersimpan di browser pengunjung: keranjang, favorit, terakhir dilihat, bandingkan.
const KOSONG = [];
const PERISTIWA = "daftar-tersimpan";
const cache = new Map();

export function bacaDaftar(kunci) {
  let mentah = null;
  try {
    mentah = window.localStorage.getItem(kunci);
  } catch {
    return KOSONG;
  }

  const tersimpan = cache.get(kunci);
  if (tersimpan?.mentah === mentah) return tersimpan.daftar;

  let daftar = KOSONG;
  try {
    const hasil = JSON.parse(mentah);
    if (Array.isArray(hasil)) daftar = hasil;
  } catch {
    daftar = KOSONG;
  }
  cache.set(kunci, { mentah, daftar });
  return daftar;
}

export function tulisDaftar(kunci, daftar) {
  try {
    window.localStorage.setItem(kunci, JSON.stringify(daftar));
  } catch {
    // Penyimpanan browser bisa diblokir, misalnya di mode privat.
  }
  window.dispatchEvent(new Event(PERISTIWA));
}

function berlangganan(ubah) {
  window.addEventListener("storage", ubah);
  window.addEventListener(PERISTIWA, ubah);
  return () => {
    window.removeEventListener("storage", ubah);
    window.removeEventListener(PERISTIWA, ubah);
  };
}

export function useDaftarTersimpan(kunci) {
  return useSyncExternalStore(
    berlangganan,
    () => bacaDaftar(kunci),
    () => KOSONG
  );
}
