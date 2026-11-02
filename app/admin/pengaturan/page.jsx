import NavAdmin from "@/components/NavAdmin";
import FormPengaturan from "@/components/FormPengaturan";
import { ambilToko } from "@/lib/data-toko";

export default async function HalamanPengaturan() {
  const toko = await ambilToko();

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <h1 className="text-2xl font-extrabold">Pengaturan toko</h1>
      <FormPengaturan
        pengaturan={{
          nama: toko.nama,
          nomor_whatsapp: toko.nomorWhatsApp,
          alamat: toko.alamat,
          jam_buka: toko.jamBuka,
        }}
      />
    </div>
  );
}
