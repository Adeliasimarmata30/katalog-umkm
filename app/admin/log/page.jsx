import { redirect } from "next/navigation";
import NavAdmin from "@/components/NavAdmin";
import { createSessionClient } from "@/lib/supabase/server";

const JUMLAH_LOG = 50;

// US-45: halaman ini juga memeriksa login sendiri karena isinya memuat email admin.
export default async function HalamanLog() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/admin/login");
  }

  const { data: daftarLog, error } = await supabase
    .from("log_aktivitas")
    .select("id, admin_email, aksi, target, created_at")
    .order("created_at", { ascending: false })
    .limit(JUMLAH_LOG);

  if (error) {
    console.error("Gagal memuat log:", error);
  }

  const formatWaktu = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  });

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <h1 className="text-2xl font-extrabold">Log aktivitas</h1>
      {error ? (
        <p className="text-bahaya">Log belum bisa dimuat. Muat ulang halaman beberapa saat lagi.</p>
      ) : daftarLog.length === 0 ? (
        <p className="text-teks-lembut">Belum ada aktivitas.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-garis">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-permukaan text-teks-lembut">
              <tr>
                <th className="px-4 py-3 font-semibold">Waktu</th>
                <th className="px-4 py-3 font-semibold">Admin</th>
                <th className="px-4 py-3 font-semibold">Aksi</th>
                <th className="px-4 py-3 font-semibold">Produk</th>
              </tr>
            </thead>
            <tbody>
              {daftarLog.map((log) => (
                <tr key={log.id} className="border-t border-garis">
                  <td className="px-4 py-3 text-teks-lembut">{formatWaktu.format(new Date(log.created_at))}</td>
                  <td className="px-4 py-3">{log.admin_email}</td>
                  <td className="px-4 py-3">{log.aksi}</td>
                  <td className="px-4 py-3">{log.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
