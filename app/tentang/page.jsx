import { ambilToko } from "@/lib/data-toko";

export async function generateMetadata() {
  const toko = await ambilToko();
  return { title: `Tentang | ${toko.nama}`, description: toko.tagline };
}

export default async function HalamanTentang() {
  const toko = await ambilToko();
  const nomor = String(toko.nomorWhatsApp).replace(/\D/g, "");

  return (
    <div className="flex max-w-prose flex-col gap-6 py-8">
      <div>
        <h1 className="text-2xl font-extrabold">Tentang {toko.nama}</h1>
        <p className="mt-2 leading-relaxed text-teks-lembut">{toko.tagline}</p>
      </div>
      <dl className="flex flex-col gap-4">
        <div>
          <dt className="text-sm font-semibold">Alamat</dt>
          <dd className="text-teks-lembut">{toko.alamat}</dd>
        </div>
        <div>
          <dt className="text-sm font-semibold">Jam buka</dt>
          <dd className="text-teks-lembut">{toko.jamBuka}</dd>
        </div>
        <div>
          <dt className="text-sm font-semibold">Kontak</dt>
          <dd>
            <a
              href={`https://wa.me/${nomor}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-utama underline underline-offset-4"
            >
              WhatsApp +{nomor}
            </a>
          </dd>
        </div>
      </dl>
    </div>
  );
}
