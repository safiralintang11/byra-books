-- =====================================================================
-- 003 - HAK AKSES DATA API + PERBAIKAN TRIGGER STOK
-- Aman dijalankan berulang. Jalankan di Supabase > SQL Editor > Run
-- =====================================================================
-- Penyebab utama "permission denied for table ..." di project Supabase baru:
-- role anon/authenticated belum diberi GRANT ke tabel public.
-- RLS tetap membatasi baris yang boleh diakses.

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated;

-- Fungsi RPC yang dipakai aplikasi
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.create_order(jsonb) to anon, authenticated;
grant execute on function public.track_order(text, text) to anon, authenticated;
grant execute on function public.attach_proof(text, text, text) to anon, authenticated;
grant execute on function public.calc_currencies() to anon, authenticated;
grant execute on function public.calc_quote(text, numeric, numeric, numeric) to anon, authenticated;

-- Fungsi internal tetap tertutup
revoke all on function public._calc_total(numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric)
  from public, anon, authenticated;

-- Akun admin default (user harus sudah ada di Authentication > Users)
insert into public.admins (email) values ('admin@byra-books.com')
on conflict do nothing;

-- Trigger stok: saat pesanan dibatalkan stok dikembalikan, dan saat pesanan
-- dibatalkan lalu diaktifkan kembali stok dipotong lagi (tidak bisa minus).
create or replace function public.orders_restore_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  i record;
  b public.books%rowtype;
begin
  if new.status = 'dibatalkan' and old.status <> 'dibatalkan' then
    update public.books b
       set stock = case when i.is_preorder then b.stock else b.stock + i.qty end,
           sold_count = greatest(b.sold_count - i.qty, 0)
      from public.order_items i
     where i.order_id = new.id and i.book_id = b.id;
  elsif old.status = 'dibatalkan' and new.status <> 'dibatalkan' then
    for i in select * from public.order_items where order_id = new.id loop
      if i.book_id is null then continue; end if;
      select * into b from public.books where id = i.book_id for update;
      if not found then continue; end if;
      if not i.is_preorder then
        if b.stock < i.qty then
          raise exception 'Stok "%" tidak cukup (%) untuk mengaktifkan kembali pesanan ini', b.title, b.stock;
        end if;
        update public.books set stock = stock - i.qty, sold_count = sold_count + i.qty where id = b.id;
      else
        update public.books set sold_count = sold_count + i.qty where id = b.id;
      end if;
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_restore on public.orders;
create trigger trg_orders_restore after update of status on public.orders
  for each row execute function public.orders_restore_stock();
