-- Migrasi untuk user story bonus (US-18 sampai US-48).
-- Cara pakai: Supabase > SQL Editor > New query > tempel seluruh isi file ini > Run.
-- Jalankan SESUDAH docs/schema.sql dan SEBELUM kode bonus di-deploy. Aman dijalankan ulang.
-- File ini tidak mengubah aturan di docs/schema.sql dan tidak mengganti nama kolom lama.

-- 1. Kolom tambahan tabel produk
alter table public.produk add column if not exists foto_tambahan text[] not null default '{}'; -- US-18
alter table public.produk add column if not exists habis boolean not null default false;       -- US-19
alter table public.produk add column if not exists harga_diskon integer;                        -- US-20
alter table public.produk add column if not exists badge text;                                  -- US-20
alter table public.produk add column if not exists aktif boolean not null default true;         -- US-32
alter table public.produk add column if not exists urutan integer;                              -- US-47

alter table public.produk drop constraint if exists produk_harga_diskon_valid;
alter table public.produk add constraint produk_harga_diskon_valid
  check (harga_diskon is null or (harga_diskon >= 0 and harga_diskon < harga));

alter table public.produk drop constraint if exists produk_badge_valid;
alter table public.produk add constraint produk_badge_valid
  check (badge is null or badge in ('Baru', 'Terlaris'));

update public.produk set urutan = id where urutan is null;
create index if not exists produk_urutan_idx on public.produk (urutan, id);

-- 2. Kategori (US-31). Daftar awal diambil dari kategori produk yang sudah ada.
create table if not exists public.kategori (
  id bigint generated always as identity primary key,
  nama text not null unique,
  created_at timestamptz not null default now()
);

insert into public.kategori (nama)
select distinct kategori from public.produk where kategori is not null and kategori <> ''
on conflict (nama) do nothing;

-- 3. Ulasan (US-38, US-39)
create table if not exists public.ulasan (
  id bigint generated always as identity primary key,
  produk_id bigint not null references public.produk (id) on delete cascade,
  nama text not null check (char_length(nama) between 1 and 60),
  rating integer not null check (rating between 1 and 5),
  komentar text not null check (char_length(komentar) between 1 and 500),
  disembunyikan boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ulasan_produk_idx on public.ulasan (produk_id);

-- 4. Catatan klik pesan WhatsApp (US-40, US-41). Tidak menyimpan data pengunjung.
create table if not exists public.klik_whatsapp (
  id bigint generated always as identity primary key,
  produk_id bigint not null references public.produk (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists klik_whatsapp_produk_idx on public.klik_whatsapp (produk_id);

create or replace view public.klik_per_produk with (security_invoker = true) as
select produk_id, count(*)::integer as jumlah
from public.klik_whatsapp
group by produk_id;

-- 5. Banner promo (US-42)
create table if not exists public.banner (
  id bigint generated always as identity primary key,
  judul text not null,
  teks text,
  gambar_url text,
  tautan text,
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

-- 6. Pengaturan toko (US-43). Hanya satu baris; lib/toko.js menjadi cadangan.
create table if not exists public.pengaturan_toko (
  id integer primary key default 1 check (id = 1),
  nama text not null,
  nomor_whatsapp text not null,
  alamat text,
  jam_buka text,
  updated_at timestamptz not null default now()
);

-- 7. Log aktivitas admin (US-45)
create table if not exists public.log_aktivitas (
  id bigint generated always as identity primary key,
  admin_email text not null,
  aksi text not null,
  target text,
  created_at timestamptz not null default now()
);

-- 8. Varian harga per ukuran (US-48)
create table if not exists public.varian_produk (
  id bigint generated always as identity primary key,
  produk_id bigint not null references public.produk (id) on delete cascade,
  nama text not null,
  harga integer not null check (harga > 0),
  created_at timestamptz not null default now(),
  unique (produk_id, nama)
);
create index if not exists varian_produk_produk_idx on public.varian_produk (produk_id);

-- 9. Row Level Security: publik ditolak, admin yang login boleh.
--    Pengunjung membaca dan mengirim ulasan atau klik lewat server, bukan langsung dari browser.
alter table public.kategori enable row level security;
alter table public.ulasan enable row level security;
alter table public.klik_whatsapp enable row level security;
alter table public.banner enable row level security;
alter table public.pengaturan_toko enable row level security;
alter table public.log_aktivitas enable row level security;
alter table public.varian_produk enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['kategori', 'ulasan', 'banner', 'pengaturan_toko', 'varian_produk'] loop
    execute format('drop policy if exists "admin_kelola_%1$s" on public.%1$I', t);
    execute format(
      'create policy "admin_kelola_%1$s" on public.%1$I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

-- Klik dan log hanya bisa dibaca admin. Log tidak boleh diubah atau dihapus dari aplikasi.
drop policy if exists "admin_baca_klik" on public.klik_whatsapp;
create policy "admin_baca_klik" on public.klik_whatsapp
  for select to authenticated using (true);

drop policy if exists "admin_baca_log" on public.log_aktivitas;
create policy "admin_baca_log" on public.log_aktivitas
  for select to authenticated using (true);

drop policy if exists "admin_tambah_log" on public.log_aktivitas;
create policy "admin_tambah_log" on public.log_aktivitas
  for insert to authenticated with check (true);

-- 10. Penyimpanan foto (US-29). Bucket privat: foto dibaca lewat server di rute /foto.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('foto-produk', 'foto-produk', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admin_unggah_foto" on storage.objects;
create policy "admin_unggah_foto" on storage.objects
  for insert to authenticated with check (bucket_id = 'foto-produk');
