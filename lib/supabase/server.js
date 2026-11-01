import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function getSupabaseUrl() {
  const url = process.env.SUPABASE_URL || "";
  return url.replace(/\/rest\/v1\/?$/, "");
}

function getSupabaseSecretKey() {
  return process.env.SUPABASE_SECRET_KEY || "";
}

/**
 * Membuat koneksi Supabase di sisi server menggunakan SUPABASE_SECRET_KEY.
 * Digunakan untuk membaca data publik (seperti katalog dan detail produk).
 */
export function createServerClient() {
  const url = getSupabaseUrl();
  const secretKey = getSupabaseSecretKey();

  if (!url || !secretKey) {
    throw new Error(
      "SUPABASE_URL dan SUPABASE_SECRET_KEY wajib diatur di environment variable."
    );
  }

  return createSupabaseClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const createClient = createServerClient;
export const getSupabaseServer = createServerClient;

export default createServerClient;

