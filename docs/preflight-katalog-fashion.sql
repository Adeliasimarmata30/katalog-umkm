
-- PREFLIGHT EYDELCH FASHION
-- Pemeriksaan read-only sebelum migrasi.

-- 1. Jumlah data saat ini
SELECT 'produk' AS tabel, COUNT(*) AS jumlah
FROM public.produk
UNION ALL
SELECT 'ulasan', COUNT(*) FROM public.ulasan
UNION ALL
SELECT 'klik_whatsapp', COUNT(*) FROM public.klik_whatsapp
UNION ALL
SELECT 'varian_produk', COUNT(*) FROM public.varian_produk
UNION ALL
SELECT 'kategori', COUNT(*) FROM public.kategori;

-- 2. Rentang ID produk
SELECT MIN(id) AS id_minimum, MAX(id) AS id_maksimum
FROM public.produk;

-- 3. Pemeriksaan sequence
SELECT
  t.table_name,
  t.column_name,
  pg_get_serial_sequence(
    format('%I.%I', t.table_schema, t.table_name),
    t.column_name
  ) AS sequence_name
FROM information_schema.columns t
WHERE t.table_schema = 'public'
  AND (
    (t.table_name = 'produk' AND t.column_name = 'id')
    OR (t.table_name = 'kategori' AND t.column_name = 'id')
    OR (t.table_name = 'ulasan' AND t.column_name = 'id')
  );

-- 4. Foreign key terkait katalog
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.constraint_schema = kcu.constraint_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
 AND ccu.constraint_schema = tc.constraint_schema
JOIN information_schema.referential_constraints rc
  ON rc.constraint_name = tc.constraint_name
 AND rc.constraint_schema = tc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.constraint_schema = 'public'
  AND (
    tc.table_name IN (
      'produk', 'kategori', 'ulasan',
      'klik_whatsapp', 'varian_produk'
    )
    OR ccu.table_name IN ('produk', 'kategori')
  );
