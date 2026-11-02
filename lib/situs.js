// Alamat publik situs untuk metadata dan sitemap, tanpa garis miring di akhir.
export function alamatSitus() {
  const alamat =
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  return alamat.replace(/\/+$/, "");
}
