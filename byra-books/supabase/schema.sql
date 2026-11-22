-- =====================================================================
-- BYRA BOOKS - Skema database Supabase
-- Jalankan seluruh file ini di Supabase > SQL Editor > New query > Run
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- ADMIN ----------
create table if not exists public.admins (
  email text primary key
);

-- GANTI email di bawah dengan email admin (harus sama dengan user di Authentication > Users)
insert into public.admins (email) values ('GANTI_DENGAN_EMAIL_ADMIN@gmail.com')
on conflict do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- EVENT / PO ----------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  kind text not null default 'Event' check (kind in ('Event','PO')),
  starts_on date,
  ends_on date,
  banner_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- BUKU ----------
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  publisher text,
  isbn text unique,
  pages int,
  synopsis text,
  category text,
  stock int not null default 0,
  price numeric(12,0) not null default 0,
  discount_price numeric(12,0),
  year int,
  weight_grams int,
  language text,
  cover_url text,
  format text default 'Paperback',          -- varian: Paperback / Hardcover
  origin text not null default 'lokal' check (origin in ('lokal','impor')),
  status text not null default 'ready' check (status in ('ready','preorder')),
  preorder_close date,
  is_bestseller boolean not null default false,
  is_new boolean not null default false,
  is_special boolean not null default false,
  shopee_url text,
  event_id uuid references public.events(id) on delete set null,
  sold_count int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists books_status_idx on public.books(status);
create index if not exists books_category_idx on public.books(category);

-- ---------- PESANAN ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  customer_name text not null,
  phone text not null,
  email text,
  address text not null,
  city text,
  courier text,
  notes text,
  subtotal numeric(12,0) not null default 0,
  shipping_cost numeric(12,0) not null default 0,
  total numeric(12,0) not null default 0,
  status text not null default 'menunggu_pembayaran'
    check (status in ('menunggu_pembayaran','dibayar','diproses','dikirim','selesai','dibatalkan')),
  tracking_number text,
  proof_url text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  book_id uuid references public.books(id) on delete set null,
  title text not null,
  price numeric(12,0) not null,
  qty int not null check (qty > 0),
  is_preorder boolean not null default false
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- ---------- PENGATURAN TOKO ----------
create table if not exists public.settings (
  key text primary key,
  value text
);
insert into public.settings (key, value) values
  ('store_name', 'Byra Books'),
  ('wa_number', '6288225998135'),
  ('bank_info', 'Transfer ke: BANK ... a.n. ... No. Rek ...'),
  ('qris_url', ''),
  ('announcement', 'Selamat datang di Byra Books! Cek section Pre-Order dan Event buku terbaru ya.'),
  ('instagram_url', ''),
  ('shopee_url', '')
on conflict (key) do nothing;

-- ---------- ROW LEVEL SECURITY ----------
alter table public.admins enable row level security;
alter table public.events enable row level security;
alter table public.books enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.settings enable row level security;

drop policy if exists admins_admin on public.admins;
create policy admins_admin on public.admins for select using (public.is_admin());

drop policy if exists events_read on public.events;
create policy events_read on public.events for select using (is_active or public.is_admin());
drop policy if exists events_admin on public.events;
create policy events_admin on public.events for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists books_read on public.books;
create policy books_read on public.books for select using (is_active or public.is_admin());
drop policy if exists books_admin on public.books;
create policy books_admin on public.books for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists settings_read on public.settings;
create policy settings_read on public.settings for select using (true);
drop policy if exists settings_admin on public.settings;
create policy settings_admin on public.settings for all using (public.is_admin()) with check (public.is_admin());

-- pesanan: hanya admin yang boleh baca/ubah langsung. Pelanggan lewat fungsi RPC di bawah.
drop policy if exists orders_admin on public.orders;
create policy orders_admin on public.orders for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists order_items_admin on public.order_items;
create policy order_items_admin on public.order_items for all using (public.is_admin()) with check (public.is_admin());

-- ---------- FUNGSI: BUAT PESANAN (checkout tamu) ----------
create or replace function public.create_order(p jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_items jsonb := p -> 'items';
  v_item jsonb;
  v_book public.books%rowtype;
  v_qty int;
  v_price numeric;
  v_subtotal numeric := 0;
  v_code text;
  v_order_id uuid;
begin
  if coalesce(trim(p ->> 'customer_name'), '') = '' or coalesce(trim(p ->> 'phone'), '') = ''
     or coalesce(trim(p ->> 'address'), '') = '' then
    raise exception 'Nama, nomor WhatsApp, dan alamat wajib diisi';
  end if;
  if v_items is null or jsonb_array_length(v_items) = 0 then
    raise exception 'Keranjang kosong';
  end if;

  v_code := 'BYRA-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
  while exists (select 1 from public.orders where code = v_code) loop
    v_code := 'BYRA-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
  end loop;

  insert into public.orders (code, customer_name, phone, email, address, city, courier, notes)
  values (v_code, trim(p ->> 'customer_name'), trim(p ->> 'phone'), nullif(trim(p ->> 'email'), ''),
          trim(p ->> 'address'), nullif(trim(p ->> 'city'), ''), nullif(trim(p ->> 'courier'), ''),
          nullif(trim(p ->> 'notes'), ''))
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(v_items) loop
    v_qty := greatest((v_item ->> 'qty')::int, 1);
    select * into v_book from public.books
      where id = (v_item ->> 'book_id')::uuid and is_active for update;
    if not found then
      raise exception 'Buku tidak ditemukan atau sudah tidak dijual';
    end if;
    if v_book.status = 'ready' then
      if v_book.stock < v_qty then
        raise exception 'Stok "%" tidak cukup (sisa %)', v_book.title, v_book.stock;
      end if;
      update public.books set stock = stock - v_qty, sold_count = sold_count + v_qty where id = v_book.id;
    else
      update public.books set sold_count = sold_count + v_qty where id = v_book.id;
    end if;
    v_price := case when v_book.discount_price is not null and v_book.discount_price < v_book.price
                    then v_book.discount_price else v_book.price end;
    insert into public.order_items (order_id, book_id, title, price, qty, is_preorder)
    values (v_order_id, v_book.id, v_book.title, v_price, v_qty, v_book.status = 'preorder');
    v_subtotal := v_subtotal + v_price * v_qty;
  end loop;

  update public.orders set subtotal = v_subtotal, total = v_subtotal where id = v_order_id;
  return json_build_object('code', v_code, 'total', v_subtotal);
end;
$$;
grant execute on function public.create_order(jsonb) to anon, authenticated;

-- ---------- FUNGSI: LACAK PESANAN (kode + 4+ digit akhir nomor WA) ----------
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
    'items', coalesce((select json_agg(json_build_object('title', i.title, 'price', i.price, 'qty', i.qty,
                'is_preorder', i.is_preorder)) from public.order_items i where i.order_id = o.id), '[]'::json)
  );
end;
$$;
grant execute on function public.track_order(text, text) to anon, authenticated;

-- ---------- FUNGSI: LAMPIRKAN BUKTI BAYAR ----------
create or replace function public.attach_proof(p_code text, p_phone text, p_url text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders%rowtype;
  digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
begin
  if length(digits) < 6 then return false; end if;
  select * into o from public.orders where upper(code) = upper(trim(p_code));
  if not found then return false; end if;
  if right(regexp_replace(o.phone, '\D', '', 'g'), 8) <> right(digits, 8) then return false; end if;
  update public.orders set proof_url = p_url, updated_at = now() where id = o.id;
  return true;
end;
$$;
grant execute on function public.attach_proof(text, text, text) to anon, authenticated;

-- ---------- TRIGGER: kembalikan stok jika pesanan dibatalkan ----------
create or replace function public.orders_after_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.orders_restore_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'dibatalkan' and old.status <> 'dibatalkan' then
    update public.books b
       set stock = case when i.is_preorder then b.stock else b.stock + i.qty end,
           sold_count = greatest(b.sold_count - i.qty, 0)
      from public.order_items i
     where i.order_id = new.id and i.book_id = b.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_touch on public.orders;
create trigger trg_orders_touch before update on public.orders
  for each row execute function public.orders_after_update();
drop trigger if exists trg_orders_restore on public.orders;
create trigger trg_orders_restore after update of status on public.orders
  for each row execute function public.orders_restore_stock();

-- ---------- STORAGE (sampul buku & bukti bayar) ----------
insert into storage.buckets (id, name, public) values ('covers', 'covers', true), ('proofs', 'proofs', true)
on conflict (id) do nothing;

drop policy if exists covers_read on storage.objects;
create policy covers_read on storage.objects for select using (bucket_id = 'covers');
drop policy if exists covers_admin on storage.objects;
create policy covers_admin on storage.objects for all
  using (bucket_id = 'covers' and public.is_admin()) with check (bucket_id = 'covers' and public.is_admin());

drop policy if exists proofs_read on storage.objects;
create policy proofs_read on storage.objects for select using (bucket_id = 'proofs');
drop policy if exists proofs_insert on storage.objects;
create policy proofs_insert on storage.objects for insert with check (bucket_id = 'proofs');
