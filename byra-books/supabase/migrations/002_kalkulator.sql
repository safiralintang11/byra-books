-- =====================================================================
-- KALKULATOR FEE (USD / GBP -> IDR)
-- Aman dijalankan berulang. Jalankan di Supabase > SQL Editor > Run
-- (atau sudah otomatis ada di supabase/schema.sql untuk instalasi baru)
-- =====================================================================

-- Pengaturan owner. HANYA admin yang bisa baca/ubah: pelanggan tidak pernah melihat angka ini.
create table if not exists public.calc_settings (
  currency text primary key check (currency in ('USD', 'GBP')),
  kurs numeric not null default 0 check (kurs >= 0),                 -- kurs pasar, IDR per 1 mata uang asing
  buffer_pct numeric not null default 0 check (buffer_pct >= 0),    -- buffer kurs untuk customer (%)
  fee_idr numeric not null default 0 check (fee_idr >= 0),          -- fee jastip per buku (IDR)
  quotation_total numeric not null default 0 check (quotation_total >= 0), -- total quotation ongkir, dalam mata uang asing
  quotation_gram numeric not null default 50000 check (quotation_gram > 0), -- berat quotation (gram), 50 kg = 50000
  updated_at timestamptz not null default now()
);

alter table public.calc_settings enable row level security;
drop policy if exists calc_settings_admin on public.calc_settings;
create policy calc_settings_admin on public.calc_settings for all
  using (public.is_admin()) with check (public.is_admin());

-- nilai awal (kurs USD dari file owner; GBP & quotation diisi admin di /admin/kalkulator)
insert into public.calc_settings (currency, kurs, buffer_pct, fee_idr, quotation_total, quotation_gram) values
  ('USD', 17900, 3, 20000, 0, 50000),
  ('GBP', 0, 3, 20000, 0, 50000)
on conflict (currency) do nothing;

-- Rumus inti (internal, tidak bisa dipanggil dari browser)
-- kurs customer = kurs * (1 + buffer/100)
-- tarif per gram = quotation_total * kurs customer / quotation_gram
-- total = harga * kurs customer * qty + qty * berat * tarif + qty * fee  -> dibulatkan ke atas per Rp1.000
create or replace function public._calc_total(
  p_kurs numeric, p_buffer numeric, p_fee numeric, p_qtotal numeric, p_qgram numeric,
  p_price numeric, p_qty numeric, p_weight numeric
) returns numeric
language sql
immutable
as $$
  select ceil(
    (
      p_price * (p_kurs * (1 + p_buffer / 100)) * p_qty
      + p_qty * p_weight * (p_qtotal * (p_kurs * (1 + p_buffer / 100)) / p_qgram)
      + p_qty * p_fee
    ) / 1000
  ) * 1000;
$$;
revoke all on function public._calc_total(numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric)
  from public, anon, authenticated;

-- Mata uang yang sudah siap dipakai pelanggan (kurs, quotation & berat quotation sudah diisi)
create or replace function public.calc_currencies()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(json_agg(currency order by currency), '[]'::json)
  from public.calc_settings
  where kurs > 0 and quotation_total > 0 and quotation_gram > 0;
$$;
grant execute on function public.calc_currencies() to anon, authenticated;

-- Hitung untuk pelanggan: HANYA mengembalikan total (dan perkiraan dalam mata uang asing).
create or replace function public.calc_quote(p_currency text, p_price numeric, p_qty numeric, p_weight numeric)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  s public.calc_settings%rowtype;
  cur text := upper(coalesce(trim(p_currency), ''));
  v_total numeric;
begin
  select * into s from public.calc_settings where currency = cur;
  if not found or s.kurs <= 0 or s.quotation_total <= 0 or s.quotation_gram <= 0 then
    raise exception 'Kalkulator untuk % belum tersedia. Silakan hubungi admin.', cur;
  end if;
  if p_price is null or p_price <= 0 or p_price > 100000 then
    raise exception 'Harga buku tidak valid';
  end if;
  if p_qty is null or p_qty < 1 or p_qty > 1000 or p_qty <> trunc(p_qty) then
    raise exception 'Quantity harus bilangan bulat 1 sampai 1000';
  end if;
  if p_weight is null or p_weight <= 0 or p_weight > 100000 then
    raise exception 'Berat tidak valid';
  end if;

  v_total := public._calc_total(s.kurs, s.buffer_pct, s.fee_idr, s.quotation_total, s.quotation_gram,
                                p_price, p_qty, p_weight);
  return json_build_object('currency', cur, 'total', v_total, 'equivalent', round(v_total / s.kurs, 2));
end;
$$;
grant execute on function public.calc_quote(text, numeric, numeric, numeric) to anon, authenticated;
