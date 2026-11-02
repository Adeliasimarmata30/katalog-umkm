"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSessionClient } from "@/lib/supabase/server";
import { uraiCsv } from "@/lib/csv";
import { GeminiError, tanyaGemini } from "@/lib/gemini";

// Batas kolom harga (integer) di tabel produk
const HARGA_MAKSIMAL = 2147483647;
const BATAS_FOTO_TAMBAHAN = 8;
const DAFTAR_BADGE = ["Baru", "Terlaris"];
const UKURAN_FOTO_MAKSIMAL = 2 * 1024 * 1024;
const PANJANG_NAMA_KATEGORI = 60;
const POLA_NOMOR_WHATSAPP = /^62\d{8,13}$/;
const UKURAN_CSV_MAKSIMAL = 1024 * 1024;
const BATAS_BARIS_IMPOR = 500;
const PESAN_HARGA_SALAH =
  "Harga harus berupa angka bulat lebih dari 0, tanpa titik atau huruf, maksimal 2147483647.";

// Hanya menerima digit, supaya nilai seperti "1e5" tidak terbaca sebagai 1 oleh parseInt.
function bacaHarga(teks) {
  if (!/^\d+$/.test(teks || "")) return null;
  const harga = Number(teks);
  return harga <= HARGA_MAKSIMAL ? harga : null;
}

// Pemeriksaan login di server untuk aksi admin yang mengubah data.
async function sesiAdmin() {
  const supabase = await createSessionClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ditolak: { error: "Tidak diizinkan: Anda harus login terlebih dahulu." } };
  }
  return { supabase, user };
}

// US-47: produk baru ditempatkan di urutan paling akhir.
async function urutanBerikutnya(supabase) {
  const { data, error } = await supabase
    .from("produk")
    .select("urutan")
    .order("urutan", { ascending: false, nullsFirst: false })
    .limit(1);

  if (error) {
    console.error("Gagal membaca urutan produk:", error);
    return null;
  }
  return (data[0]?.urutan ?? 0) + 1;
}

// US-45: gagal mencatat log tidak boleh membatalkan aksi yang sudah berhasil.
async function catatLog(supabase, user, aksi, target) {
  const { error } = await supabase
    .from("log_aktivitas")
    .insert({ admin_email: user.email, aksi, target });
  if (error) {
    console.error("Gagal mencatat log:", error);
  }
}

// Menolak alamat seperti javascript:... yang bisa dijalankan saat diklik.
function alamatAman(alamat) {
  return !alamat || /^(https?:\/\/|\/(?!\/))/i.test(alamat);
}

function pesanGagalKategori(error, nama) {
  if (error.code === "23505") {
    return { error: `Kategori "${nama}" sudah ada.` };
  }
  console.error("Gagal menyimpan kategori:", error);
  return { error: "Gagal menyimpan kategori. Silakan coba lagi." };
}

// Tanda awal berkas gambar, supaya berkas lain yang diberi tipe gambar tetap ditolak.
function jenisGambar(bita) {
  if (bita[0] === 0xff && bita[1] === 0xd8 && bita[2] === 0xff) return { tipe: "image/jpeg", akhiran: "jpg" };
  if (bita.subarray(0, 4).toString("hex") === "89504e47") return { tipe: "image/png", akhiran: "png" };
  if (bita.subarray(0, 4).toString("latin1") === "RIFF" && bita.subarray(8, 12).toString("latin1") === "WEBP") {
    return { tipe: "image/webp", akhiran: "webp" };
  }
  return null;
}

// US-29: foto diunggah dari server dan dibaca kembali lewat rute /foto, jadi browser
// tidak pernah berhubungan langsung dengan Supabase.
async function unggahFotoProduk(supabase, berkas) {
  if (!(berkas instanceof File) || berkas.size === 0) return {};

  if (berkas.size > UKURAN_FOTO_MAKSIMAL) {
    return { error: "Ukuran foto maksimal 2 MB." };
  }

  const bita = Buffer.from(await berkas.arrayBuffer());
  const jenis = jenisGambar(bita);
  if (!jenis) {
    return { error: "File foto harus berupa gambar JPG, PNG, atau WebP." };
  }

  const namaBerkas = `${crypto.randomUUID()}.${jenis.akhiran}`;
  const { error } = await supabase.storage
    .from("foto-produk")
    .upload(namaBerkas, bita, { contentType: jenis.tipe });

  if (error) {
    console.error("Gagal mengunggah foto:", error);
    return { error: "Gagal mengunggah foto. Silakan coba lagi." };
  }
  return { url: `/foto/${namaBerkas}` };
}

// Membaca isian form produk. Dipakai oleh tambah dan ubah produk.
// US-34: semua kolom diperiksa sekaligus, pesannya tampil di bawah kolom yang salah.
function bacaFormProduk(data) {
  const errors = {};

  const nama = data?.get("nama")?.toString().trim();
  if (!nama) {
    errors.nama = "Nama produk wajib diisi.";
  }

  const harga = bacaHarga(data?.get("harga")?.toString().trim());
  if (harga === null || harga <= 0) {
    errors.harga = PESAN_HARGA_SALAH;
  }

  const hargaDiskonRaw = data?.get("harga_diskon")?.toString().trim();
  const hargaDiskon = hargaDiskonRaw ? bacaHarga(hargaDiskonRaw) : null;
  if (hargaDiskonRaw && (hargaDiskon === null || (harga !== null && hargaDiskon >= harga))) {
    errors.harga_diskon = "Harga diskon harus berupa angka bulat dan lebih kecil dari harga normal.";
  }

  const badge = data?.get("badge")?.toString() || null;
  if (badge && !DAFTAR_BADGE.includes(badge)) {
    errors.badge = "Badge harus Baru, Terlaris, atau kosong.";
  }

  const fotoTambahan = (data?.get("foto_tambahan")?.toString() || "")
    .split("\n")
    .map((baris) => baris.trim())
    .filter(Boolean);
  if (fotoTambahan.length > BATAS_FOTO_TAMBAHAN) {
    errors.foto_tambahan = `Foto tambahan maksimal ${BATAS_FOTO_TAMBAHAN} link.`;
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    isian: {
      nama,
      harga,
      kategori: data?.get("kategori")?.toString().trim() || null,
      foto_url: data?.get("foto_url")?.toString().trim() || null,
      deskripsi: data?.get("deskripsi")?.toString().trim() || null,
      foto_tambahan: fotoTambahan,
      habis: data?.get("habis") === "on",
      harga_diskon: hargaDiskon,
      badge,
    },
  };
}

// US-34: isian dikembalikan ke form supaya tidak hilang saat terjadi error.
function nilaiFormProduk(data) {
  const teks = (nama) => data?.get(nama)?.toString() ?? "";
  return {
    nama: teks("nama"),
    harga: teks("harga"),
    harga_diskon: teks("harga_diskon"),
    badge: teks("badge"),
    kategori: teks("kategori"),
    foto_url: teks("foto_url"),
    foto_tambahan: teks("foto_tambahan"),
    habis: data?.get("habis") === "on",
  };
}

function pesanGagalMasuk(error) {
  if (error.message === "Invalid login credentials") {
    return "Email atau password salah. Silakan periksa kembali.";
  }
  if (error.status === 429) {
    return "Terlalu banyak percobaan masuk. Tunggu beberapa menit, lalu coba lagi.";
  }
  console.error("Gagal masuk:", error);
  return "Gagal masuk. Periksa koneksi internet, lalu coba lagi.";
}

function pesanGagalGantiPassword(error) {
  if (error.code === "same_password") {
    return "Password baru harus berbeda dari password lama.";
  }
  if (error.code === "weak_password") {
    return "Password baru terlalu lemah. Gunakan kombinasi yang lebih sulit ditebak.";
  }
  console.error("Gagal mengganti password:", error);
  return "Gagal mengganti password. Silakan coba lagi.";
}

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
    const errorMsg = pesanGagalMasuk(error);

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
    return { error: pesanGagalGantiPassword(updateError) };
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
  const { isian, errors } = bacaFormProduk(data);
  if (errors) {
    return { errors, nilai: nilaiFormProduk(data) };
  }

  const hasilFoto = await unggahFotoProduk(supabase, data?.get("foto_berkas"));
  if (hasilFoto.error) {
    return { errors: { foto_berkas: hasilFoto.error }, nilai: nilaiFormProduk(data) };
  }
  if (hasilFoto.url) {
    isian.foto_url = hasilFoto.url;
  }

  // 3. Simpan data ke tabel produk di Supabase
  const urutan = await urutanBerikutnya(supabase);
  const { error: insertError } = await supabase.from("produk").insert({ ...isian, urutan });

  if (insertError) {
    console.error("Gagal menyimpan produk:", insertError);
    return { error: "Gagal menyimpan produk. Silakan coba lagi.", nilai: nilaiFormProduk(data) };
  }

  await catatLog(supabase, user, "tambah produk", isian.nama);

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
  const { isian, errors } = bacaFormProduk(data);
  if (errors) {
    return { errors, nilai: nilaiFormProduk(data) };
  }

  const hasilFoto = await unggahFotoProduk(supabase, data?.get("foto_berkas"));
  if (hasilFoto.error) {
    return { errors: { foto_berkas: hasilFoto.error }, nilai: nilaiFormProduk(data) };
  }
  if (hasilFoto.url) {
    isian.foto_url = hasilFoto.url;
  }

  // 3. Perbarui data di tabel produk Supabase
  const { error: updateError } = await supabase.from("produk").update(isian).eq("id", id);

  if (updateError) {
    console.error("Gagal mengubah produk:", updateError);
    return { error: "Gagal mengubah produk. Silakan coba lagi.", nilai: nilaiFormProduk(data) };
  }

  await catatLog(supabase, user, "ubah produk", isian.nama);

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
  const { data: produkTerhapus, error: deleteError } = await supabase
    .from("produk")
    .delete()
    .eq("id", id)
    .select("id, nama");

  if (deleteError) {
    console.error("Gagal menghapus produk:", deleteError);
    return { error: "Gagal menghapus produk. Silakan coba lagi." };
  }

  // 3. Perbarui cache rute
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/produk/${id}`);

  // Menghapus 0 baris tidak dianggap error oleh Supabase, jadi diperiksa di sini
  if (!produkTerhapus || produkTerhapus.length === 0) {
    return { error: "Produk tidak ditemukan atau sudah dihapus." };
  }

  await catatLog(supabase, user, "hapus produk", produkTerhapus[0].nama);

  return { success: true };
}

// US-14: membuat deskripsi produk dengan AI. Hasilnya hanya mengisi form, belum disimpan.
export async function buatDeskripsiAI(nama, kategori) {
  const supabase = await createSessionClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Tidak diizinkan: Anda harus login terlebih dahulu." };
  }

  const namaBersih = String(nama || "").trim().slice(0, 200);
  const kategoriBersih = String(kategori || "").trim().slice(0, 100);
  if (!namaBersih) {
    return { error: "Isi nama produk dulu supaya AI bisa membuat deskripsi." };
  }

  try {
    const deskripsi = await tanyaGemini({
      instruksi:
        "Kamu penulis katalog toko online di Indonesia. Tulis deskripsi produk dalam bahasa Indonesia, " +
        "2 sampai 3 kalimat, jujur dan menarik. Jangan mengarang ukuran, bahan, atau harga. " +
        "Tulis deskripsinya saja, tanpa judul, tanpa tanda bintang.",
      pesan: `Nama produk: ${namaBersih}\nKategori: ${kategoriBersih || "-"}`,
    });
    return { deskripsi };
  } catch (err) {
    if (err instanceof GeminiError) return { error: err.message };
    console.error("Gagal membuat deskripsi:", err);
    return { error: "Gagal membuat deskripsi. Silakan coba lagi." };
  }
}

// US-32: menyembunyikan atau menampilkan produk tanpa menghapusnya.
export async function ubahAktifProduk(prevState, formData) {
  const { supabase, ditolak } = await sesiAdmin();
  if (ditolak) return ditolak;

  const id = formData.get("id");
  const aktif = formData.get("aktif") === "true";

  const { data, error } = await supabase.from("produk").update({ aktif }).eq("id", id).select("id");
  if (error) {
    console.error("Gagal mengubah status produk:", error);
    return { error: "Gagal mengubah status produk. Silakan coba lagi." };
  }

  revalidatePath("/", "layout");

  if (!data || data.length === 0) {
    return { error: "Produk tidak ditemukan atau sudah dihapus." };
  }
  return { success: true };
}

// US-39: menyembunyikan, menampilkan kembali, atau menghapus ulasan.
export async function kelolaUlasan(prevState, formData) {
  const { supabase, ditolak } = await sesiAdmin();
  if (ditolak) return ditolak;

  const id = formData.get("id");
  const aksi = formData.get("aksi");

  let hasil;
  if (aksi === "hapus") {
    hasil = await supabase.from("ulasan").delete().eq("id", id).select("id");
  } else if (aksi === "sembunyikan" || aksi === "tampilkan") {
    hasil = await supabase
      .from("ulasan")
      .update({ disembunyikan: aksi === "sembunyikan" })
      .eq("id", id)
      .select("id");
  } else {
    return { error: "Aksi tidak dikenal." };
  }

  if (hasil.error) {
    console.error("Gagal mengelola ulasan:", hasil.error);
    return { error: "Gagal memproses ulasan. Silakan coba lagi." };
  }

  revalidatePath("/produk/[id]", "page");
  revalidatePath("/admin/ulasan");

  if (!hasil.data || hasil.data.length === 0) {
    return { error: "Ulasan tidak ditemukan atau sudah dihapus." };
  }
  return { success: true };
}

// US-42: membuat, mengubah, mengaktifkan, dan menghapus banner promo.
export async function kelolaBanner(prevState, formData) {
  const { supabase, ditolak } = await sesiAdmin();
  if (ditolak) return ditolak;

  const aksi = formData.get("aksi");
  const id = formData.get("id");
  let hasil;

  if (aksi === "simpan") {
    const judul = formData.get("judul")?.toString().trim();
    const tautan = formData.get("tautan")?.toString().trim() || null;
    const gambar_url = formData.get("gambar_url")?.toString().trim() || null;

    if (!judul) return { error: "Judul banner wajib diisi." };
    if (!alamatAman(tautan)) return { error: "Tautan harus diawali / atau http(s)://." };
    if (!alamatAman(gambar_url)) return { error: "Link gambar harus diawali / atau http(s)://." };

    const isian = {
      judul,
      teks: formData.get("teks")?.toString().trim() || null,
      tautan,
      gambar_url,
      aktif: formData.get("aktif") === "on",
    };
    hasil = id
      ? await supabase.from("banner").update(isian).eq("id", id).select("id")
      : await supabase.from("banner").insert(isian).select("id");
  } else if (aksi === "aktif") {
    hasil = await supabase
      .from("banner")
      .update({ aktif: formData.get("aktif") === "true" })
      .eq("id", id)
      .select("id");
  } else if (aksi === "hapus") {
    hasil = await supabase.from("banner").delete().eq("id", id).select("id");
  } else {
    return { error: "Aksi tidak dikenal." };
  }

  if (hasil.error) {
    console.error("Gagal mengelola banner:", hasil.error);
    return { error: "Gagal menyimpan banner. Silakan coba lagi." };
  }

  revalidatePath("/", "layout");

  if (!hasil.data || hasil.data.length === 0) {
    return { error: "Banner tidak ditemukan atau sudah dihapus." };
  }
  return { success: "Banner tersimpan." };
}

// US-43: data toko tersimpan di database, jadi tidak perlu mengedit kode.
export async function simpanPengaturan(prevState, formData) {
  const { supabase, ditolak } = await sesiAdmin();
  if (ditolak) return ditolak;

  const nama = formData.get("nama")?.toString().trim() ?? "";
  const nomor = formData.get("nomor_whatsapp")?.toString().replace(/[\s+-]/g, "") ?? "";
  const alamat = formData.get("alamat")?.toString().trim() ?? "";
  const jam_buka = formData.get("jam_buka")?.toString().trim() ?? "";

  const errors = {};
  if (!nama) errors.nama = "Nama toko wajib diisi.";
  if (!POLA_NOMOR_WHATSAPP.test(nomor)) {
    errors.nomor_whatsapp = "Nomor WhatsApp harus berformat internasional, contoh 6281234567890.";
  }

  const nilai = { nama, nomor_whatsapp: nomor, alamat, jam_buka };
  if (Object.keys(errors).length > 0) return { errors, nilai };

  const { error } = await supabase.from("pengaturan_toko").upsert({
    id: 1,
    nama,
    nomor_whatsapp: nomor,
    alamat: alamat || null,
    jam_buka: jam_buka || null,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Gagal menyimpan pengaturan:", error);
    return { error: "Gagal menyimpan pengaturan. Silakan coba lagi.", nilai };
  }

  revalidatePath("/", "layout");
  return { success: "Pengaturan toko tersimpan.", nilai };
}

// US-47: menukar posisi produk dengan produk di atas atau di bawahnya.
export async function geserProduk(prevState, formData) {
  const { supabase, ditolak } = await sesiAdmin();
  if (ditolak) return ditolak;

  const id = Number(formData.get("id"));
  const langkah = formData.get("arah") === "naik" ? -1 : 1;

  const { data, error } = await supabase
    .from("produk")
    .select("id, urutan")
    .order("urutan", { ascending: true, nullsFirst: false })
    .order("id", { ascending: true });

  if (error) {
    console.error("Gagal membaca urutan produk:", error);
    return { error: "Gagal mengubah urutan. Silakan coba lagi." };
  }

  const posisi = data.findIndex((produk) => produk.id === id);
  if (posisi === -1) {
    return { error: "Produk tidak ditemukan atau sudah dihapus." };
  }

  const tetangga = data[posisi + langkah];
  if (!tetangga) return { success: true };

  const urutanIni = data[posisi].urutan ?? data[posisi].id;
  const urutanTetangga = tetangga.urutan ?? tetangga.id;

  const { error: errorSatu } = await supabase.from("produk").update({ urutan: urutanTetangga }).eq("id", id);
  const { error: errorDua } = errorSatu
    ? { error: errorSatu }
    : await supabase.from("produk").update({ urutan: urutanIni }).eq("id", tetangga.id);

  if (errorDua) {
    console.error("Gagal mengubah urutan produk:", errorDua);
    return { error: "Gagal mengubah urutan. Muat ulang halaman, lalu coba lagi." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

// US-48: tambah, ubah, dan hapus varian harga per produk.
export async function kelolaVarian(prevState, formData) {
  const { supabase, ditolak } = await sesiAdmin();
  if (ditolak) return ditolak;

  const aksi = formData.get("aksi");
  const id = formData.get("id");
  const produkId = formData.get("produk_id");
  let hasil;

  if (aksi === "hapus") {
    hasil = await supabase.from("varian_produk").delete().eq("id", id).select("id");
  } else if (aksi === "tambah" || aksi === "ubah") {
    const nama = formData.get("nama")?.toString().trim();
    const harga = bacaHarga(formData.get("harga")?.toString().trim());

    if (!nama) return { error: "Nama varian wajib diisi." };
    if (harga === null || harga <= 0) return { error: PESAN_HARGA_SALAH };

    hasil =
      aksi === "tambah"
        ? await supabase.from("varian_produk").insert({ produk_id: produkId, nama, harga }).select("id")
        : await supabase.from("varian_produk").update({ nama, harga }).eq("id", id).select("id");

    if (hasil.error?.code === "23505") {
      return { error: `Varian "${nama}" sudah ada di produk ini.` };
    }
  } else {
    return { error: "Aksi tidak dikenal." };
  }

  if (hasil.error) {
    console.error("Gagal mengelola varian:", hasil.error);
    return { error: "Gagal menyimpan varian. Silakan coba lagi." };
  }

  revalidatePath(`/produk/${produkId}`);
  revalidatePath(`/admin/produk/${produkId}/ubah`);

  if (!hasil.data || hasil.data.length === 0) {
    return { error: "Varian tidak ditemukan atau sudah dihapus." };
  }
  return { success: "Varian tersimpan." };
}

// US-46: baris valid disimpan sekaligus, baris yang salah dilaporkan beserta nomor barisnya.
export async function imporProduk(prevState, formData) {
  const { supabase, user, ditolak } = await sesiAdmin();
  if (ditolak) return ditolak;

  const berkas = formData.get("berkas");
  if (!(berkas instanceof File) || berkas.size === 0) {
    return { error: "Pilih berkas CSV terlebih dahulu." };
  }
  if (berkas.size > UKURAN_CSV_MAKSIMAL) {
    return { error: "Ukuran berkas CSV maksimal 1 MB." };
  }

  const baris = uraiCsv(await berkas.text());
  const header = (baris[0] || []).map((kolom) => kolom.trim().toLowerCase());
  const kolom = Object.fromEntries(header.map((nama, urutan) => [nama, urutan]));

  if (kolom.nama === undefined || kolom.harga === undefined) {
    return { error: "Baris pertama CSV harus memuat kolom nama dan harga." };
  }

  const dataBaris = baris
    .slice(1)
    .map((sel, urutan) => ({ sel, nomor: urutan + 2 }))
    .filter(({ sel }) => sel.some((isi) => isi.trim() !== ""));

  if (dataBaris.length === 0) {
    return { error: "Berkas CSV belum berisi produk." };
  }
  if (dataBaris.length > BATAS_BARIS_IMPOR) {
    return { error: `Impor maksimal ${BATAS_BARIS_IMPOR} produk sekali unggah.` };
  }

  const valid = [];
  const gagal = [];
  const ambil = (sel, nama) => (kolom[nama] === undefined ? "" : (sel[kolom[nama]] || "").trim());

  dataBaris.forEach(({ sel, nomor }) => {
    const nama = ambil(sel, "nama");
    const harga = bacaHarga(ambil(sel, "harga"));

    if (!nama) {
      gagal.push({ baris: nomor, pesan: "Nama produk wajib diisi." });
    } else if (harga === null || harga <= 0) {
      gagal.push({ baris: nomor, pesan: "Harga harus berupa angka bulat lebih dari 0." });
    } else {
      valid.push({
        nama,
        harga,
        kategori: ambil(sel, "kategori") || null,
        deskripsi: ambil(sel, "deskripsi") || null,
        foto_url: ambil(sel, "foto_url") || null,
      });
    }
  });

  if (valid.length > 0) {
    const urutanAwal = await urutanBerikutnya(supabase);
    const { error } = await supabase
      .from("produk")
      .insert(valid.map((produk, urutan) => ({ ...produk, urutan: urutanAwal + urutan })));

    if (error) {
      console.error("Gagal mengimpor produk:", error);
      return { error: "Gagal menyimpan produk. Tidak ada produk yang tersimpan, silakan coba lagi." };
    }

    await catatLog(supabase, user, "impor produk", `${valid.length} produk`);
    revalidatePath("/", "layout");
  }

  return { berhasil: valid.length, gagal };
}

// US-31: tambah, ubah nama, dan hapus kategori lewat satu form per baris.
export async function kelolaKategori(prevState, formData) {
  const { supabase, ditolak } = await sesiAdmin();
  if (ditolak) return ditolak;

  const aksi = formData.get("aksi");
  const id = formData.get("id");
  const nama = formData.get("nama")?.toString().trim();

  if (aksi !== "hapus" && !nama) {
    return { error: "Nama kategori wajib diisi." };
  }
  if (nama && nama.length > PANJANG_NAMA_KATEGORI) {
    return { error: `Nama kategori maksimal ${PANJANG_NAMA_KATEGORI} karakter.` };
  }

  let lama = null;
  if (aksi !== "tambah") {
    const { data, error } = await supabase.from("kategori").select("nama").eq("id", id).maybeSingle();
    if (error || !data) {
      if (error) console.error("Gagal membaca kategori:", error);
      return { error: "Kategori tidak ditemukan. Muat ulang halaman." };
    }
    lama = data.nama;
  }

  if (aksi === "tambah") {
    const { error } = await supabase.from("kategori").insert({ nama });
    if (error) return pesanGagalKategori(error, nama);
  } else if (aksi === "ubah") {
    const { error } = await supabase.from("kategori").update({ nama }).eq("id", id);
    if (error) return pesanGagalKategori(error, nama);

    // Kolom kategori di produk berupa teks, jadi nama barunya ikut diperbarui.
    const { error: errorProduk } = await supabase.from("produk").update({ kategori: nama }).eq("kategori", lama);
    if (errorProduk) {
      console.error("Gagal memperbarui kategori produk:", errorProduk);
      return { error: "Nama kategori berubah, tetapi produknya gagal diperbarui. Simpan sekali lagi." };
    }
  } else if (aksi === "hapus") {
    const { count, error: errorHitung } = await supabase
      .from("produk")
      .select("id", { count: "exact", head: true })
      .eq("kategori", lama);
    if (errorHitung) {
      console.error("Gagal memeriksa pemakaian kategori:", errorHitung);
      return { error: "Gagal memeriksa kategori. Silakan coba lagi." };
    }
    if (count > 0) {
      return { error: `Kategori "${lama}" masih dipakai ${count} produk. Pindahkan produknya dulu.` };
    }

    const { error } = await supabase.from("kategori").delete().eq("id", id);
    if (error) return pesanGagalKategori(error, lama);
  } else {
    return { error: "Aksi tidak dikenal." };
  }

  revalidatePath("/", "layout");
  return { success: "Kategori tersimpan." };
}

export const login = masuk;
export const logout = keluar;
export const ubahPassword = gantiPassword;
export const createProduk = tambahProduk;
export const simpanProduk = tambahProduk;
export const updateProduk = ubahProduk;
export const editProduk = ubahProduk;
export const deleteProduk = hapusProduk;
