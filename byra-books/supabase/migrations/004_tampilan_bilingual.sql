-- =====================================================================
-- 004 - BILINGUAL, TAMPILAN, JOIN GROUP, DAN PESAN LAGI
-- Aman dijalankan berulang. Jalankan di Supabase > SQL Editor > Run
-- =====================================================================

-- Pengaturan baru
insert into public.settings (key, value) values
  ('announcement_id', 'Selamat datang di Byra Books! Cek section Pre-Order dan Event buku terbaru ya.'),
  ('announcement_en', 'Welcome to Byra Books! Check out our latest pre-orders and book events.'),
  ('join_group_url', ''),
  ('show_calculator', '0'),
  ('catalog_default_view', 'grid'),
  ('catalog_show_filters', '1'),
  ('catalog_show_covers', '1'),
  ('home_layout', ''),
  ('about_sections', '')
on conflict (key) do nothing;

-- Sertakan book_id + info buku di hasil lacak pesanan, supaya fitur "Pesan lagi" bisa
-- menambahkan buku yang masih tersedia ke keranjang.
create or replace function public.track_order(p_code text, p_phone text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders%rowtype;
  digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
begin
  if length(digits) < 6 then return null; end if;
  select * into o from public.orders where upper(code) = upper(trim(p_code));
  if not found then return null; end if;
  if right(regexp_replace(o.phone, '\D', '', 'g'), 8) <> right(digits, 8) then return null; end if;
  return json_build_object(
    'code', o.code, 'customer_name', o.customer_name, 'address', o.address, 'courier', o.courier,
    'subtotal', o.subtotal, 'shipping_cost', o.shipping_cost, 'total', o.total, 'status', o.status,
    'tracking_number', o.tracking_number, 'proof_url', o.proof_url, 'created_at', o.created_at,
    'updated_at', o.updated_at,
    'items', coalesce((select json_agg(json_build_object(
                'book_id', i.book_id, 'title', i.title, 'price', i.price, 'qty', i.qty,
                'is_preorder', i.is_preorder, 'author', b.author, 'cover_url', b.cover_url,
                'book_status', b.status, 'stock', b.stock, 'isbn', b.isbn
              ) order by i.id)
              from public.order_items i left join public.books b on b.id = i.book_id
              where i.order_id = o.id), '[]'::json)
  );
end;
$$;
grant execute on function public.track_order(text, text) to anon, authenticated;

-- Jika masih muncul "permission denied", jalankan juga 003_grants_dan_stok.sql.
