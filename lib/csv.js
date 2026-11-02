// Mengurai teks CSV menjadi baris dan sel. Mendukung kutip, koma, dan baris baru di dalam kutip.
export function uraiCsv(teks) {
  const isi = teks.replace(/^﻿/, "");
  const baris = [];
  let barisIni = [];
  let sel = "";
  let dalamKutip = false;

  for (let i = 0; i < isi.length; i += 1) {
    const huruf = isi[i];

    if (dalamKutip) {
      if (huruf === '"' && isi[i + 1] === '"') {
        sel += '"';
        i += 1;
      } else if (huruf === '"') {
        dalamKutip = false;
      } else {
        sel += huruf;
      }
    } else if (huruf === '"') {
      dalamKutip = true;
    } else if (huruf === ",") {
      barisIni.push(sel);
      sel = "";
    } else if (huruf === "\n" || huruf === "\r") {
      if (huruf === "\r" && isi[i + 1] === "\n") i += 1;
      barisIni.push(sel);
      baris.push(barisIni);
      barisIni = [];
      sel = "";
    } else {
      sel += huruf;
    }
  }

  if (sel !== "" || barisIni.length > 0) {
    barisIni.push(sel);
    baris.push(barisIni);
  }

  return baris;
}
