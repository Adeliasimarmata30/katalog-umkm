"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";

const gaya = {
  utama: "bg-utama text-white hover:bg-utama-gelap",
  garis: "border border-garis bg-latar text-teks hover:border-utama hover:text-utama",
  bahaya: "border border-garis bg-latar text-bahaya hover:border-bahaya",
};

export default function Tombol({ href, varian = "utama", className = "", children, ...props }) {
  // Nonaktif selama form diproses. Di luar form, pending selalu false.
  const { pending } = useFormStatus();
  const sedangDikirim = props.type === "submit" && pending;

  const kelas = `inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${gaya[varian]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={kelas}>
        {children}
      </Link>
    );
  }

  return (
    <button className={kelas} {...props} disabled={props.disabled || sedangDikirim} aria-busy={sedangDikirim}>
      {children}
    </button>
  );
}
