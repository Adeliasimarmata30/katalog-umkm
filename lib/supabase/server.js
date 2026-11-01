import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabaseUrl() {
  const url = process.env.SUPABASE_URL || "";
  return url.replace(/\/rest\/v1\/?$/, "");
}

function getSupabaseSecretKey() {
  return process.env.SUPABASE_SECRET_KEY || "";
}

function getSupabasePublishableKey() {
  return process.env.SUPABASE_PUBLISHABLE_KEY || "";
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

/**
 * Membuat koneksi Supabase untuk sesi pengguna/admin menggunakan @supabase/ssr dan cookies.
 * Menggunakan SUPABASE_PUBLISHABLE_KEY agar aturan RLS tetap berlaku.
 */
export async function createSessionClient() {
  const cookieStore = await cookies();
  const url = getSupabaseUrl();
  const publishableKey = getSupabasePublishableKey();

  if (!url || !publishableKey) {
    throw new Error(
      "SUPABASE_URL dan SUPABASE_PUBLISHABLE_KEY wajib diatur di environment variable."
    );
  }

  return createSSRServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Dipanggil dari Server Component di mana cookies read-only
        }
      },
    },
  });
}

export const createClient = createServerClient;
export const getSupabaseServer = createServerClient;
export const createAuthClient = createSessionClient;

export default createServerClient;
