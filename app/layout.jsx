import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { alamatSitus } from "@/lib/situs";
import { ambilToko } from "@/lib/data-toko";

export async function generateMetadata() {
  const toko = await ambilToko();
  return {
    metadataBase: new URL(alamatSitus()),
    title: toko.nama,
    description: toko.tagline,
    icons: { apple: "/icons/icon-192.png" },
  };
}

export const viewport = {
  themeColor: "#1f6b4f",
};

// Dijalankan sebelum halaman tampil supaya mode gelap tidak berkedip saat dimuat ulang.
const SKRIP_TEMA = `try{document.documentElement.dataset.tema=localStorage.getItem("tema")==="dark"?"dark":"light"}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SKRIP_TEMA }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap"
        />
      </head>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
