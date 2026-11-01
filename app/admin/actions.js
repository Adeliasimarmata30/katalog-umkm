"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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

export async function gantiPassword(prevState, formData) {
  const data = formData instanceof FormData ? formData : prevState;

  const passwordBaru = data?.get("password_baru")?.toString() || "";
  const konfirmasi = data?.get("konfirmasi_password")?.toString() || "";

  // 1. Periksa sesi admin di server
  const supabase = await createSessionClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: "Sesi Anda telah berakhir atau belum login. Silakan masuk kembali.",
    };
  }

  // 2. Validasi di server
  if (!passwordBaru || !konfirmasi) {
    return { error: "Password baru dan konfirmasi password wajib diisi." };
  }

  if (passwordBaru.length < 8) {
    return { error: "Password baru minimal 8 karakter." };
  }

  if (passwordBaru !== konfirmasi) {
    return { error: "Password baru dan konfirmasi password tidak sama." };
  }

  // 3. Update password admin dengan Supabase Auth
  const { error: updateError } = await supabase.auth.updateUser({
    password: passwordBaru,
  });

  if (updateError) {
    return {
      error: updateError.message || "Gagal mengganti password. Silakan coba lagi.",
    };
  }

  return { success: "Password berhasil diganti." };
}

export async function tambahProduk(prevState, formData) {
  const data = formData instanceof FormData ? formData : prevState;
  const isActionState = formData instanceof FormData;

  // 1. Lindungi aksi dengan verifikasi sesi admin di server
  const supabase = await createSessionClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const errorMsg = "Tidak diizinkan: Anda harus login terlebih dahulu.";
    if (isActionState) {
      return { error: errorMsg };
    }
    redirect("/admin/login");
  }

  // 2. Ambil dan validasi input
  const nama = data?.get("nama")?.toString().trim();
  const hargaRaw = data?.get("harga")?.toString().trim();
  const kategori = data?.get("kategori")?.toString().trim() || null;
  const foto_url = data?.get("foto_url")?.toString().trim() || null;
  const deskripsi = data?.get("deskripsi")?.toString().trim() || null;

  if (!nama) {
    return { error: "Nama produk wajib diisi." };
  }

  const harga = parseInt(hargaRaw, 10);
  if (isNaN(harga) || harga < 0) {
    return { error: "Harga produk harus berupa angka positif." };
  }

  // 3. Simpan data ke tabel produk di Supabase
  const { error: insertError } = await supabase.from("produk").insert({
    nama,
    harga,
    kategori,
    foto_url,
    deskripsi,
  });

  if (insertError) {
    return {
      error: insertError.message || "Gagal menyimpan produk ke database.",
    };
  }

  // 4. Perbarui cache dan kembali ke /admin
  revalidatePath("/admin");
  revalidatePath("/");

  redirect("/admin");
}

export async function ubahProduk(arg1, arg2, arg3) {
  let id = null;
  let data = null;
  let isActionState = false;

  if (arg3 instanceof FormData) {
    id = arg1;
    data = arg3;
    isActionState = true;
  } else if (arg2 instanceof FormData) {
    if (typeof arg1 === "string" || typeof arg1 === "number") {
      id = arg1;
      data = arg2;
    } else {
      data = arg2;
      isActionState = true;
      id = data.get("id");
    }
  } else if (arg1 instanceof FormData) {
    data = arg1;
    id = data.get("id");
  } else if (typeof arg1 === "string" || typeof arg1 === "number") {
    id = arg1;
    data = arg2;
  }

  if (!id && data) {
    id = data.get("id");
  }

  // 1. Lindungi aksi dengan verifikasi sesi admin di server
  const supabase = await createSessionClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const errorMsg = "Tidak diizinkan: Anda harus login terlebih dahulu.";
    if (isActionState) {
      return { error: errorMsg };
    }
    redirect("/admin/login");
  }

  if (!id) {
    return { error: "ID produk tidak valid." };
  }

  // 2. Ambil dan validasi input
  const nama = data?.get("nama")?.toString().trim();
  const hargaRaw = data?.get("harga")?.toString().trim();
  const kategori = data?.get("kategori")?.toString().trim() || null;
  const foto_url = data?.get("foto_url")?.toString().trim() || null;
  const deskripsi = data?.get("deskripsi")?.toString().trim() || null;

  if (!nama) {
    return { error: "Nama produk wajib diisi." };
  }

  const harga = parseInt(hargaRaw, 10);
  if (isNaN(harga) || harga < 0) {
    return { error: "Harga produk harus berupa angka positif." };
  }

  // 3. Perbarui data di tabel produk Supabase
  const { error: updateError } = await supabase
    .from("produk")
    .update({
      nama,
      harga,
      kategori,
      foto_url,
      deskripsi,
    })
    .eq("id", id);

  if (updateError) {
    return {
      error: updateError.message || "Gagal mengubah produk di database.",
    };
  }

  // 4. Perbarui cache dan kembali ke /admin
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/produk/${id}`);

  redirect("/admin");
}

export async function hapusProduk(arg1, arg2) {
  let id = null;
  if (arg1 instanceof FormData) {
    id = arg1.get("id");
  } else if (arg2 instanceof FormData) {
    id = arg2.get("id") || arg1;
  } else if (typeof arg1 === "string" || typeof arg1 === "number") {
    id = arg1;
  }

  // 1. Lindungi aksi dengan verifikasi sesi admin di server
  const supabase = await createSessionClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Tidak diizinkan: Anda harus login terlebih dahulu." };
  }

  if (!id) {
    return { error: "ID produk tidak valid." };
  }

  // 2. Hapus data dari tabel produk Supabase
  const { error: deleteError } = await supabase
    .from("produk")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return {
      error: deleteError.message || "Gagal menghapus produk dari database.",
    };
  }

  // 3. Perbarui cache rute
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/produk/${id}`);

  return { success: true };
}

export const login = masuk;
export const logout = keluar;
export const ubahPassword = gantiPassword;
export const createProduk = tambahProduk;
export const simpanProduk = tambahProduk;
export const updateProduk = ubahProduk;
export const editProduk = ubahProduk;
export const deleteProduk = hapusProduk;
