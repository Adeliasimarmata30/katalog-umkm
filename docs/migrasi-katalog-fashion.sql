-- Migrasi katalog demo EYDELCH FASHION: mengganti seluruh produk lama dengan 60 produk fashion,
-- 8 kategori, dan 165 varian.
-- Cara pakai: Supabase > SQL Editor > New query > tempel seluruh isi file ini > Run.
--
-- Langkah 1: jalankan apa adanya (v_uji_kering = true). Hasil yang benar adalah ERROR yang disengaja
--            berbunyi "UJI KERING LULUS". Data dan sequence tidak berubah.
-- Langkah 2: setelah hasil dan cadangan diperiksa, ubah menjadi false lalu jalankan sekali saja.
--
-- Seluruh isi berada dalam satu blok DO, jadi satu kegagalan membatalkan semuanya.
-- File ini tidak memanggil nextval() atau setval(), karena keduanya tidak ikut batal saat rollback.
-- ID diisi eksplisit dengan OVERRIDING SYSTEM VALUE, lalu sequence disusulkan dengan
-- ALTER SEQUENCE RESTART yang ikut batal saat rollback.
-- File ini tidak mengubah struktur tabel, RLS, policy, Auth, atau Storage.

do $migrasi$
declare
  -- Ubah ke false hanya setelah uji kering lulus.
  v_uji_kering constant boolean := true;

  -- Keadaan yang harus sama dengan isi cadangan. Kalau berbeda, migrasi berhenti:
  -- ambil cadangan baru dulu, baru sesuaikan angka ini.
  v_jumlah_produk_lama constant bigint := 60;
  v_id_maks_lama constant bigint := 61;
  v_jumlah_kategori_lama constant bigint := 8;
  v_jumlah_ulasan_lama constant bigint := 1;
  v_jumlah_klik_lama constant bigint := 0;
  v_jumlah_varian_lama constant bigint := 0;

  v_tabel text;
  v_urutan text;
  v_masalah text;
  v_nilai bigint;
  v_berikutnya bigint;
  v_id_awal_produk bigint;
  v_id_awal_kategori bigint;
  v_id_awal_varian bigint;
  v_id_min_baru bigint;
  v_id_maks_baru bigint;
  v_id_min_varian bigint;
  v_id_maks_varian bigint;
begin
  -- 1. Tahan penulisan selama migrasi. Kalau tabel sedang dipakai, gagal cepat, bukan menunggu lama.
  set local lock_timeout = '5s';
  lock table public.produk, public.ulasan, public.klik_whatsapp, public.varian_produk, public.kategori
    in share row exclusive mode;

  -- 2. Pastikan struktur database sesuai rancangan.
  select string_agg(harus.tabel || '.' || harus.kolom, ', ') into v_masalah
  from (values
    ('produk', 'id', 'bigint'), ('produk', 'nama', 'text'), ('produk', 'harga', 'integer'),
    ('produk', 'deskripsi', 'text'), ('produk', 'foto_url', 'text'), ('produk', 'kategori', 'text'),
    ('produk', 'created_at', 'timestamp with time zone'), ('produk', 'foto_tambahan', 'ARRAY'),
    ('produk', 'habis', 'boolean'), ('produk', 'harga_diskon', 'integer'), ('produk', 'badge', 'text'),
    ('produk', 'aktif', 'boolean'), ('produk', 'urutan', 'integer'),
    ('kategori', 'id', 'bigint'), ('kategori', 'nama', 'text'),
    ('ulasan', 'id', 'bigint'), ('ulasan', 'produk_id', 'bigint'),
    ('klik_whatsapp', 'id', 'bigint'), ('klik_whatsapp', 'produk_id', 'bigint'),
    ('varian_produk', 'id', 'bigint'), ('varian_produk', 'produk_id', 'bigint'),
    ('varian_produk', 'nama', 'text'), ('varian_produk', 'harga', 'integer')
  ) as harus (tabel, kolom, tipe)
  left join information_schema.columns c
    on c.table_schema = 'public'
   and c.table_name = harus.tabel
   and c.column_name = harus.kolom
   and c.data_type = harus.tipe
  where c.column_name is null;
  if v_masalah is not null then
    raise exception 'BATAL: kolom tidak ada atau tipenya berbeda: %.', v_masalah;
  end if;

  foreach v_tabel in array array['produk', 'kategori', 'ulasan', 'klik_whatsapp', 'varian_produk'] loop
    if not exists (
      select 1
      from pg_constraint k
      join pg_attribute a on a.attrelid = k.conrelid and a.attnum = k.conkey[1]
      where k.conrelid = ('public.' || v_tabel)::regclass
        and k.contype = 'p'
        and array_length(k.conkey, 1) = 1
        and a.attname = 'id'
    ) then
      raise exception 'BATAL: primary key %.id tidak ditemukan.', v_tabel;
    end if;

    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = v_tabel and column_name = 'id' and is_identity = 'YES'
    ) then
      raise exception 'BATAL: %.id bukan kolom identity.', v_tabel;
    end if;

    v_urutan := pg_get_serial_sequence('public.' || v_tabel, 'id');
    if v_urutan is null then
      raise exception 'BATAL: sequence %.id tidak ditemukan.', v_tabel;
    end if;
    if (select seqincrement from pg_sequence where seqrelid = v_urutan::regclass) <> 1 then
      raise exception 'BATAL: increment sequence %.id harus 1.', v_tabel;
    end if;
  end loop;

  foreach v_tabel in array array['ulasan', 'klik_whatsapp', 'varian_produk'] loop
    if not exists (
      select 1
      from pg_constraint k
      join pg_attribute a on a.attrelid = k.conrelid and a.attnum = k.conkey[1]
      where k.conrelid = ('public.' || v_tabel)::regclass
        and k.confrelid = 'public.produk'::regclass
        and k.contype = 'f'
        and array_length(k.conkey, 1) = 1
        and a.attname = 'produk_id'
    ) then
      raise exception 'BATAL: foreign key %.produk_id ke produk tidak ditemukan.', v_tabel;
    end if;
  end loop;

  -- 3. Pastikan keadaan masih sama dengan cadangan.
  select count(*) into v_nilai from public.produk;
  if v_nilai <> v_jumlah_produk_lama then
    raise exception 'BATAL: jumlah produk % (harus %). Ambil cadangan baru.', v_nilai, v_jumlah_produk_lama;
  end if;
  select max(id) into v_nilai from public.produk;
  if v_nilai <> v_id_maks_lama then
    raise exception 'BATAL: id produk terbesar % (harus %).', v_nilai, v_id_maks_lama;
  end if;
  select count(*) into v_nilai from public.kategori;
  if v_nilai <> v_jumlah_kategori_lama then
    raise exception 'BATAL: jumlah kategori % (harus %). Ambil cadangan baru.', v_nilai, v_jumlah_kategori_lama;
  end if;
  select count(*) into v_nilai from public.ulasan;
  if v_nilai <> v_jumlah_ulasan_lama then
    raise exception 'BATAL: jumlah ulasan % (harus %). Ambil cadangan baru.', v_nilai, v_jumlah_ulasan_lama;
  end if;
  select count(*) into v_nilai from public.klik_whatsapp;
  if v_nilai <> v_jumlah_klik_lama then
    raise exception 'BATAL: jumlah klik % (harus %). Ambil cadangan baru.', v_nilai, v_jumlah_klik_lama;
  end if;
  select count(*) into v_nilai from public.varian_produk;
  if v_nilai <> v_jumlah_varian_lama then
    raise exception 'BATAL: jumlah varian % (harus %). Ambil cadangan baru.', v_nilai, v_jumlah_varian_lama;
  end if;

  -- 4. Catat id lama. Hanya id di daftar ini yang boleh dihapus.
  create temporary table _produk_lama on commit drop as select id from public.produk;

  -- 5. Hitung ID awal hanya dengan membaca sequence. Tidak ada nomor yang terpakai.
  execute format(
    'select case when is_called then last_value + 1 else last_value end from %s',
    pg_get_serial_sequence('public.produk', 'id')::regclass
  ) into v_berikutnya;
  v_id_awal_produk := greatest(v_id_maks_lama + 1, v_berikutnya);

  execute format(
    'select case when is_called then last_value + 1 else last_value end from %s',
    pg_get_serial_sequence('public.kategori', 'id')::regclass
  ) into v_berikutnya;
  select greatest(coalesce(max(id), 0) + 1, v_berikutnya) into v_id_awal_kategori from public.kategori;

  execute format(
    'select case when is_called then last_value + 1 else last_value end from %s',
    pg_get_serial_sequence('public.varian_produk', 'id')::regclass
  ) into v_berikutnya;
  select greatest(coalesce(max(id), 0) + 1, v_berikutnya) into v_id_awal_varian from public.varian_produk;

  -- 6. Tambah produk baru dengan ID eksplisit. Baris lama masih ada sampai langkah 8.
  insert into public.produk (id, nama, harga, deskripsi, foto_url, kategori, urutan)
  overriding system value
  select v_id_awal_produk + row_number() over (order by urutan) - 1,
         nama, harga, deskripsi, foto_url, kategori, urutan
  from (values
      ( 1, 'Dress Midi Floral Pastel', 289000, 'Dress midi tanpa lengan bermotif bunga warna pastel.', 'https://images.unsplash.com/photo-1762154057377-cc9d3dd6900c?w=800&q=80&fm=jpg', 'Dress'),
      ( 2, 'Long Dress Motif Monokrom', 319000, 'Dress panjang lengan panjang bermotif hitam putih.', 'https://images.unsplash.com/photo-1616313253719-c46514cddee1?w=800&q=80&fm=jpg', 'Dress'),
      ( 3, 'Dress Kuning Kancing Depan', 249000, 'Dress kuning tanpa lengan dengan kancing depan dan tali pinggang.', 'https://images.unsplash.com/photo-1789111161022-1970ba92f3b9?w=800&q=80&fm=jpg', 'Dress'),
      ( 4, 'Dress Tunik Biru Muda', 269000, 'Dress panjang biru muda dengan potongan longgar.', 'https://images.unsplash.com/photo-1759992878772-e83a691a6d8f?w=800&q=80&fm=jpg', 'Dress'),
      ( 5, 'Bodycon Dress Abstrak Oranye', 259000, 'Dress pas badan bermotif abstrak oranye dan ungu.', 'https://images.unsplash.com/photo-1785698548812-a1aa156d0420?w=800&q=80&fm=jpg', 'Dress'),
      ( 6, 'Slit Dress Merah', 339000, 'Dress panjang merah dengan belahan samping.', 'https://images.unsplash.com/photo-1761848572182-ae73d6f1cf7a?w=800&q=80&fm=jpg', 'Dress'),
      ( 7, 'Maxi Dress Hijau Teal', 359000, 'Maxi dress lengan panjang warna hijau teal.', 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&q=80&fm=jpg', 'Dress'),
      ( 8, 'Dress Tali Floral Kuning', 239000, 'Dress bertali bahu dengan motif bunga kuning dan biru.', 'https://images.unsplash.com/photo-1676327478489-ae4f973d0bbe?w=800&q=80&fm=jpg', 'Dress'),
      ( 9, 'Slip Dress Gelap', 279000, 'Dress tanpa lengan warna gelap dengan tampilan mengilap.', 'https://images.unsplash.com/photo-1704775983177-8ae543524081?w=800&q=80&fm=jpg', 'Dress'),
      (10, 'Tiered Maxi Dress Hijau', 349000, 'Maxi dress hijau bersusun dengan lengan panjang.', 'https://images.unsplash.com/photo-1685703203919-0c2cfc893c60?w=800&q=80&fm=jpg', 'Dress'),
      (11, 'Blus Garis Lengan Panjang', 159000, 'Blus longgar bermotif garis putih dan abu.', 'https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?w=800&q=80&fm=jpg', 'Atasan'),
      (12, 'Blus Putih Pita Leher', 179000, 'Blus putih lengan panjang dengan pita hitam di leher.', 'https://images.unsplash.com/photo-1608234807905-4466023792f5?w=800&q=80&fm=jpg', 'Atasan'),
      (13, 'Blus Polkadot Putih', 169000, 'Blus putih lengan pendek bermotif polkadot.', 'https://images.unsplash.com/photo-1579634248246-548d1a6658d3?w=800&q=80&fm=jpg', 'Atasan'),
      (14, 'Kemeja Bordir Bunga', 199000, 'Kemeja putih dengan bordir bunga.', 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800&q=80&fm=jpg', 'Atasan'),
      (15, 'Blus Krem Lengan Balon', 189000, 'Blus krem berkancing dengan lengan balon.', 'https://images.unsplash.com/photo-1595828204607-0d09afb58a71?w=800&q=80&fm=jpg', 'Atasan'),
      (16, 'Kemeja Satin Champagne', 219000, 'Kemeja mengilap warna champagne.', 'https://images.unsplash.com/photo-1612889002991-fbfaf775d231?w=800&q=80&fm=jpg', 'Atasan'),
      (17, 'Sweater Rajut Putih Gading', 229000, 'Sweater rajut longgar warna putih gading.', 'https://images.unsplash.com/photo-1574201635302-388dd92a4c3f?w=800&q=80&fm=jpg', 'Atasan'),
      (18, 'Sweater Rajut Cokelat', 229000, 'Sweater rajut warna cokelat.', 'https://images.unsplash.com/photo-1773747310662-e7cc9e681226?w=800&q=80&fm=jpg', 'Atasan'),
      (19, 'Sweater Rajut Marun', 239000, 'Sweater rajut warna marun.', 'https://images.unsplash.com/photo-1608984361471-ff566593088f?w=800&q=80&fm=jpg', 'Atasan'),
      (20, 'Kemeja Putih Ikat Depan', 189000, 'Kemeja putih lengan panjang dengan ikatan depan.', 'https://images.unsplash.com/photo-1604994183234-a311cba28474?w=800&q=80&fm=jpg', 'Atasan'),
      (21, 'Kulot Krem', 199000, 'Celana kaki lebar warna krem.', 'https://images.unsplash.com/photo-1789110853687-71692f0e86be?w=800&q=80&fm=jpg', 'Bawahan'),
      (22, 'Celana Kuning Mustard', 189000, 'Celana mustard dengan tali pinggang.', 'https://images.unsplash.com/photo-1789110520143-9f54f069b43f?w=800&q=80&fm=jpg', 'Bawahan'),
      (23, 'Celana Lebar Motif Daun Merah', 209000, 'Celana kaki lebar bermotif daun merah putih.', 'https://images.unsplash.com/photo-1789110520665-f07353f0afbe?w=800&q=80&fm=jpg', 'Bawahan'),
      (24, 'Kulot Hijau Tua', 199000, 'Kulot hijau tua berpotongan lebar.', 'https://images.unsplash.com/photo-1789110853466-4a541d4183a3?w=800&q=80&fm=jpg', 'Bawahan'),
      (25, 'Celana Lebar Motif Geometris', 209000, 'Celana kaki lebar hitam bermotif geometris.', 'https://images.unsplash.com/photo-1789110520755-058df30bf9cb?w=800&q=80&fm=jpg', 'Bawahan'),
      (26, 'Rok Susun Putih', 179000, 'Rok panjang putih bersusun.', 'https://images.unsplash.com/photo-1772723347968-33fe581852b7?w=800&q=80&fm=jpg', 'Bawahan'),
      (27, 'Rok Kotak Kuning', 189000, 'Rok panjang bermotif kotak kuning putih.', 'https://images.unsplash.com/photo-1509182469511-7f0b50bfa63e?w=800&q=80&fm=jpg', 'Bawahan'),
      (28, 'Rok Midi Floral', 179000, 'Rok midi bermotif bunga.', 'https://images.unsplash.com/photo-1782786982102-81a4a9332080?w=800&q=80&fm=jpg', 'Bawahan'),
      (29, 'Blazer Kotak Abu', 379000, 'Blazer panjang bermotif kotak abu.', 'https://images.unsplash.com/photo-1608234808654-2a8875faa7fd?w=800&q=80&fm=jpg', 'Outerwear'),
      (30, 'Blazer Hitam Garis', 399000, 'Blazer hitam bergaris halus.', 'https://images.unsplash.com/photo-1604914509335-9001944f23d5?w=800&q=80&fm=jpg', 'Outerwear'),
      (31, 'Kardigan Rajut Mustard', 259000, 'Kardigan rajut mustard berkancing.', 'https://images.unsplash.com/photo-1610288311735-39b7facbd095?w=800&q=80&fm=jpg', 'Outerwear'),
      (32, 'Kardigan Rajut Nordik', 289000, 'Kardigan rajut cokelat dengan motif nordik putih.', 'https://images.unsplash.com/photo-1758981400268-1181291b9503?w=800&q=80&fm=jpg', 'Outerwear'),
      (33, 'Jaket Denim Biru', 329000, 'Jaket denim biru berkancing.', 'https://images.unsplash.com/photo-1587155471946-9e8d4d1132fa?w=800&q=80&fm=jpg', 'Outerwear'),
      (34, 'Coat Panjang Krem', 459000, 'Coat panjang krem dengan tali pinggang.', 'https://images.unsplash.com/photo-1762605135012-56a59a059e60?w=800&q=80&fm=jpg', 'Outerwear'),
      (35, 'Jaket Putih Gading', 339000, 'Jaket pendek putih gading berkancing.', 'https://images.unsplash.com/photo-1762959266278-82ad88f3d827?w=800&q=80&fm=jpg', 'Outerwear'),
      (36, 'Hijab Putih Polos', 79000, 'Hijab putih polos untuk tampilan bersih.', 'https://images.unsplash.com/photo-1585728748176-455ac5eed962?w=800&q=80&fm=jpg', 'Hijab'),
      (37, 'Hijab Abu Polos', 69000, 'Hijab abu polos untuk dipakai sehari-hari.', 'https://images.unsplash.com/photo-1550546094-9835463f9f71?w=800&q=80&fm=jpg', 'Hijab'),
      (38, 'Pashmina Krem', 85000, 'Pashmina krem yang menjuntai lembut.', 'https://images.unsplash.com/photo-1545266241-3516e2a6e016?w=800&q=80&fm=jpg', 'Hijab'),
      (39, 'Scarf Motif Abu', 89000, 'Scarf bermotif gradasi abu dan hitam.', 'https://images.unsplash.com/photo-1581430420317-48eeec37e928?w=800&q=80&fm=jpg', 'Hijab'),
      (40, 'Hijab Panjang Ungu', 99000, 'Hijab panjang warna ungu.', 'https://images.unsplash.com/photo-1693985007521-e08e64770947?w=800&q=80&fm=jpg', 'Hijab'),
      (41, 'Hijab Panjang Pink', 99000, 'Hijab panjang warna pink.', 'https://images.unsplash.com/photo-1688096038129-fefeb1ffc7cc?w=800&q=80&fm=jpg', 'Hijab'),
      (42, 'Pashmina Motif Multiwarna', 95000, 'Pashmina bermotif dengan warna beragam.', 'https://images.unsplash.com/photo-1701308540437-e0a7e7666cbe?w=800&q=80&fm=jpg', 'Hijab'),
      (43, 'Pashmina Warna Cerah', 85000, 'Pashmina polos dengan pilihan warna cerah.', 'https://images.unsplash.com/photo-1701308540609-b35669270b8f?w=800&q=80&fm=jpg', 'Hijab'),
      (44, 'Tote Anyam Cokelat', 349000, 'Tote cokelat bermotif anyam dengan tali rantai.', 'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=800&q=80&fm=jpg', 'Tas'),
      (45, 'Satchel Abu', 329000, 'Satchel abu dengan dua gesper.', 'https://images.unsplash.com/photo-1605733513597-a8f8341084e6?w=800&q=80&fm=jpg', 'Tas'),
      (46, 'Boston Bag Hitam', 359000, 'Tas hitam berbentuk tabung dengan dua pegangan.', 'https://images.unsplash.com/photo-1705909237050-7a7625b47fac?w=800&q=80&fm=jpg', 'Tas'),
      (47, 'Tote Kanvas Cokelat', 129000, 'Tote polos warna cokelat.', 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80&fm=jpg', 'Tas'),
      (48, 'Tote Kanvas Putih', 119000, 'Tote polos warna putih dengan dua pegangan panjang.', 'https://images.unsplash.com/photo-1630381260512-e3fe55c11973?w=800&q=80&fm=jpg', 'Tas'),
      (49, 'Tas Anyam Emas', 189000, 'Tas anyam warna keemasan dengan pegangan cokelat.', 'https://images.unsplash.com/photo-1524679813234-66a389fe1a42?w=800&q=80&fm=jpg', 'Tas'),
      (50, 'Tas Anyam Bulat', 199000, 'Tas anyam berbentuk bulat.', 'https://images.unsplash.com/photo-1771237873540-4e4f4d5b0def?w=800&q=80&fm=jpg', 'Tas'),
      (51, 'Stiletto Motif Bunga', 329000, 'Sepatu hak tinggi bermotif bunga biru dan merah.', 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80&fm=jpg', 'Sepatu'),
      (52, 'Pump Nude', 279000, 'Sepatu pump warna nude dengan ujung runcing.', 'https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=800&q=80&fm=jpg', 'Sepatu'),
      (53, 'Stiletto Hitam', 299000, 'Sepatu hak tinggi hitam dengan ujung runcing.', 'https://images.unsplash.com/photo-1775202192060-b16d3fe9d260?w=800&q=80&fm=jpg', 'Sepatu'),
      (54, 'Sandal Silang Cokelat', 229000, 'Sandal cokelat bertali silang.', 'https://images.unsplash.com/photo-1613662632164-7f2b081a5b46?w=800&q=80&fm=jpg', 'Sepatu'),
      (55, 'Sandal Hak Tali Krem', 249000, 'Sandal hak dengan tali warna krem.', 'https://images.unsplash.com/photo-1770757685173-94df47a52b68?w=800&q=80&fm=jpg', 'Sepatu'),
      (56, 'Anting Hoop Emas', 69000, 'Anting hoop warna emas berbentuk pilin.', 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800&q=80&fm=jpg', 'Aksesori'),
      (57, 'Kalung Liontin Bulan', 99000, 'Kalung warna emas dengan liontin bulan sabit.', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80&fm=jpg', 'Aksesori'),
      (58, 'Kalung Liontin Emas', 89000, 'Kalung warna emas dengan liontin kecil.', 'https://images.unsplash.com/photo-1585960622850-ed33c41d6418?w=800&q=80&fm=jpg', 'Aksesori'),
      (59, 'Kalung Rantai Tipis', 79000, 'Kalung rantai tipis warna emas.', 'https://images.unsplash.com/photo-1782400027969-a4970b076eb1?w=800&q=80&fm=jpg', 'Aksesori'),
      (60, 'Kalung Choker Liontin', 85000, 'Kalung pendek dengan liontin kecil.', 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80&fm=jpg', 'Aksesori')
  ) as baru (urutan, nama, harga, deskripsi, foto_url, kategori)
  order by urutan;

  -- 7. Tambah 165 varian dengan ID eksplisit. Harga varian mengikuti harga produk.
  insert into public.varian_produk (id, produk_id, nama, harga)
  overriding system value
  select v_id_awal_varian + row_number() over (order by p.urutan, ukuran.ke) - 1,
         p.id, ukuran.nama, p.harga
  from public.produk p
  cross join lateral unnest(
    case
      when p.kategori in ('Dress', 'Atasan', 'Bawahan', 'Outerwear') then array['S', 'M', 'L', 'XL']
      when p.kategori = 'Sepatu' then array['36', '37', '38', '39', '40']
      else array[]::text[]
    end
  ) with ordinality as ukuran (nama, ke)
  where p.id not in (select id from _produk_lama)
  order by p.urutan, ukuran.ke;

  -- 8. Hapus turunan produk lama secara eksplisit, lalu produknya. Tidak bergantung pada CASCADE.
  delete from public.ulasan where produk_id in (select id from _produk_lama);
  delete from public.klik_whatsapp where produk_id in (select id from _produk_lama);
  delete from public.varian_produk where produk_id in (select id from _produk_lama);
  delete from public.produk where id in (select id from _produk_lama);

  -- 9. Ganti seluruh kategori dengan ID eksplisit.
  delete from public.kategori;
  insert into public.kategori (id, nama)
  overriding system value
  select v_id_awal_kategori + ke - 1, nama
  from unnest(array['Dress', 'Atasan', 'Bawahan', 'Outerwear', 'Hijab', 'Tas', 'Sepatu', 'Aksesori'])
    with ordinality as daftar (nama, ke);

  -- 10. Validasi. Satu saja gagal, semua perubahan batal.
  select count(*), min(id), max(id) into v_nilai, v_id_min_baru, v_id_maks_baru from public.produk;
  if v_nilai <> 60 then
    raise exception 'VALIDASI: jumlah produk akhir % (harus 60).', v_nilai;
  end if;
  if v_id_min_baru <= v_id_maks_lama then
    raise exception 'VALIDASI: id baru % tidak di atas id lama %.', v_id_min_baru, v_id_maks_lama;
  end if;
  if exists (select 1 from public.produk where id in (select id from _produk_lama)) then
    raise exception 'VALIDASI: masih ada id produk lama.';
  end if;
  if v_id_min_baru <> v_id_awal_produk or v_id_maks_baru <> v_id_awal_produk + 59 then
    raise exception 'VALIDASI: rentang ID produk baru tidak sesuai.';
  end if;

  if exists (
    select 1
    from (values ('Dress', 10), ('Atasan', 10), ('Bawahan', 8), ('Outerwear', 7), ('Hijab', 8), ('Tas', 7), ('Sepatu', 5), ('Aksesori', 5)) as harus (kategori, jumlah)
    left join (select kategori, count(*) as jumlah from public.produk group by kategori) as ada using (kategori)
    where ada.jumlah is distinct from harus.jumlah
  ) then
    raise exception 'VALIDASI: jumlah per kategori tidak sesuai.';
  end if;
  if exists (select 1 from public.produk where kategori is null or kategori not in ('Dress', 'Atasan', 'Bawahan', 'Outerwear', 'Hijab', 'Tas', 'Sepatu', 'Aksesori')) then
    raise exception 'VALIDASI: ada produk di luar 8 kategori.';
  end if;
  select count(*) into v_nilai from public.kategori;
  if v_nilai <> 8 then
    raise exception 'VALIDASI: tabel kategori berisi % baris (harus 8).', v_nilai;
  end if;
  if exists (
    select 1 from unnest(array['Dress', 'Atasan', 'Bawahan', 'Outerwear', 'Hijab', 'Tas', 'Sepatu', 'Aksesori']) as harus (nama)
    where not exists (select 1 from public.kategori k where k.nama = harus.nama)
  ) or exists (
    select 1 from public.produk p where not exists (select 1 from public.kategori k where k.nama = p.kategori)
  ) then
    raise exception 'VALIDASI: tabel kategori tidak cocok dengan produk.';
  end if;

  if exists (
    select 1 from public.produk
    where nama || ' ' || coalesce(deskripsi, '') ~* '(kopi|teh |keripik|sambal|kue|nastar|bumbu|makanan|minuman|camilan|kacang|kerupuk|emping)'
  ) then
    raise exception 'VALIDASI: masih ada produk makanan atau minuman.';
  end if;
  if exists (select 1 from public.produk where foto_url is null or foto_url !~ '^https://images\.unsplash\.com/photo-') then
    raise exception 'VALIDASI: ada foto di luar images.unsplash.com.';
  end if;
  if (select count(distinct foto_url) from public.produk) <> 60
     or (select count(distinct nama) from public.produk) <> 60 then
    raise exception 'VALIDASI: nama atau foto kembar.';
  end if;
  if exists (select 1 from public.produk where not aktif or habis or harga <= 0 or harga_diskon is not null or badge is not null) then
    raise exception 'VALIDASI: status produk baru tidak sesuai.';
  end if;
  if (select count(distinct urutan) from public.produk) <> 60
     or (select min(urutan) from public.produk) <> 1
     or (select max(urutan) from public.produk) <> 60 then
    raise exception 'VALIDASI: urutan harus 1 sampai 60.';
  end if;

  if exists (select 1 from public.ulasan) then
    raise exception 'VALIDASI: ulasan lama masih ada.';
  end if;
  if exists (select 1 from public.klik_whatsapp) then
    raise exception 'VALIDASI: klik lama masih ada.';
  end if;

  select count(*), min(id), max(id) into v_nilai, v_id_min_varian, v_id_maks_varian from public.varian_produk;
  if v_nilai <> 165 then
    raise exception 'VALIDASI: jumlah varian % (harus 165).', v_nilai;
  end if;
  if v_id_min_varian <> v_id_awal_varian or v_id_maks_varian <> v_id_awal_varian + 164 then
    raise exception 'VALIDASI: rentang ID varian tidak sesuai.';
  end if;
  if exists (select 1 from public.varian_produk v left join public.produk p on p.id = v.produk_id where p.id is null or v.harga <> p.harga) then
    raise exception 'VALIDASI: varian tanpa produk atau harga berbeda.';
  end if;
  if exists (
    select 1
    from public.produk p
    left join public.varian_produk v on v.produk_id = p.id
    group by p.id, p.kategori
    having count(v.id) <> case
      when p.kategori in ('Dress', 'Atasan', 'Bawahan', 'Outerwear') then 4
      when p.kategori = 'Sepatu' then 5
      else 0
    end
  ) then
    raise exception 'VALIDASI: jumlah varian per produk tidak sesuai.';
  end if;

  -- 11. Susulkan sequence dan pastikan nomor berikutnya tepat. Sequence ulasan dan klik tidak disentuh
  --     karena tidak ada baris baru di kedua tabel itu. RESTART ikut batal saat rollback.
  foreach v_tabel in array array['produk', 'kategori', 'varian_produk'] loop
    v_urutan := pg_get_serial_sequence('public.' || v_tabel, 'id');
    execute format('select max(id) + 1 from public.%I', v_tabel) into v_nilai;
    execute format('alter sequence %s restart with %s', v_urutan::regclass, v_nilai);
    execute format(
      'select case when is_called then last_value + 1 else last_value end from %s',
      v_urutan::regclass
    ) into v_berikutnya;
    if v_berikutnya <> v_nilai then
      raise exception 'VALIDASI: sequence % harus % (saat ini %).', v_tabel, v_nilai, v_berikutnya;
    end if;
  end loop;

  if v_uji_kering then
    raise exception 'UJI KERING LULUS: semua validasi benar, ID produk % sampai %, ID varian % sampai %, dan seluruh perubahan termasuk sequence DIBATALKAN.',
      v_id_min_baru, v_id_maks_baru, v_id_min_varian, v_id_maks_varian;
  end if;

  raise notice 'MIGRASI BERHASIL: 60 produk, ID % sampai %, 8 kategori, 165 varian.', v_id_min_baru, v_id_maks_baru;
end
$migrasi$;

-- Ringkasan akhir. Hanya tampil kalau blok di atas berhasil.
select p.kategori, count(distinct p.id) as jumlah_produk, count(v.id) as jumlah_varian,
       min(p.id) as id_awal, max(p.id) as id_akhir
from public.produk p
left join public.varian_produk v on v.produk_id = p.id
group by p.kategori
order by min(p.urutan);
