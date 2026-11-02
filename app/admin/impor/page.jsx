import NavAdmin from "@/components/NavAdmin";
import FormImpor from "@/components/FormImpor";

export default function HalamanImpor() {
  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <h1 className="text-2xl font-extrabold">Impor produk dari CSV</h1>
      <FormImpor />
    </div>
  );
}
