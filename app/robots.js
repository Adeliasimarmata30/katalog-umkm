import { alamatSitus } from "@/lib/situs";

// Dihitung saat diminta supaya mengikuti SITE_URL di lingkungan yang sedang berjalan.
export const dynamic = "force-dynamic";

export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: `${alamatSitus()}/sitemap.xml`,
  };
}
