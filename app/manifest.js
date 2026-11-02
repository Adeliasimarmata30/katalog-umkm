import { ambilToko } from "@/lib/data-toko";

// US-13: Next.js otomatis menautkan file ini di setiap halaman sebagai web app manifest.
export default async function manifest() {
  const toko = await ambilToko();

  return {
    name: toko.nama,
    short_name: toko.nama,
    description: toko.tagline,
    lang: "id",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1f6b4f",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
