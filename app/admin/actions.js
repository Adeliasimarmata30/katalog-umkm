"use server";

import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";

export async function masuk(prevState, formData) {
  const data = formData instanceof FormData ? formData : prevState;
  const isActionState = formData instanceof FormData;

  const email = data?.get("email");
  const password = data?.get("password");

  if (!email || !password) {
    const errorMsg = "Email dan password wajib diisi.";
    if (isActionState) {
      return { error: errorMsg };
    }
    redirect(`/admin/login?error=${encodeURIComponent(errorMsg)}`);
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(email).trim(),
    password: String(password),
  });

  if (error) {
    const errorMsg =
      error.message === "Invalid login credentials"
        ? "Email atau password salah. Silakan periksa kembali."
        : error.message || "Gagal masuk. Silakan periksa kembali email dan password Anda.";

    if (isActionState) {
      return { error: errorMsg };
    }
    redirect(`/admin/login?error=${encodeURIComponent(errorMsg)}`);
  }

  redirect("/admin");
}

export async function keluar() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export const login = masuk;
export const logout = keluar;

