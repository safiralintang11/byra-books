// Rumus kalkulator fee. Untuk PELANGGAN, perhitungan resmi dilakukan di database (fungsi calc_quote)
// sehingga kurs/fee tidak pernah dikirim ke browser. File ini dipakai di halaman admin (pratinjau rincian)
// dan HARUS identik dengan rumus di supabase/migrations/002_kalkulator.sql.

export const CURRENCIES = ['USD', 'GBP'];
export const CURRENCY_LABEL = { USD: 'USD ($)', GBP: 'GBP (£)' };
export const CURRENCY_SYMBOL = { USD: '$', GBP: '£' };

const idr = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
export const formatIdr = (n) => idr.format(n);

const foreign = {};
export function formatForeign(cur, n) {
  if (!foreign[cur]) {
    foreign[cur] = new Intl.NumberFormat(cur === 'GBP' ? 'en-GB' : 'en-US', { style: 'currency', currency: cur });
  }
  return foreign[cur].format(n);
}

export const isConfigured = (s) =>
  !!s && Number(s.kurs) > 0 && Number(s.quotation_total) > 0 && Number(s.quotation_gram) > 0;

/**
 * s: { kurs, buffer_pct, fee_idr, quotation_total, quotation_gram } (boleh string dari input)
 * Mengembalikan null jika pengaturan/input belum lengkap.
 */
export function computeBreakdown(s, price, qty, weight) {
  const kurs = Number(s?.kurs);
  const buffer = Number(s?.buffer_pct) || 0;
  const fee = Number(s?.fee_idr) || 0;
  const qtotal = Number(s?.quotation_total);
  const qgram = Number(s?.quotation_gram);
  price = Number(price); qty = Number(qty); weight = Number(weight);

  if (!(kurs > 0) || !(qtotal > 0) || !(qgram > 0)) return null;
  if (!(price > 0) || !(qty >= 1) || !Number.isInteger(qty) || !(weight > 0)) return null;

  const kursCust = kurs * (1 + buffer / 100);
  const tarif = (qtotal * kursCust) / qgram; // IDR per gram
  const buku = price * kursCust * qty;
  const ongkir = qty * weight * tarif;
  const jastip = qty * fee;
  // dibulatkan ke atas per Rp1.000 (toleransi 1e-9 agar selisih desimal komputer tidak menaikkan 1.000)
  const total = Math.ceil((buku + ongkir + jastip) / 1000 - 1e-9) * 1000;
  return { kursCust, tarif, buku, ongkir, jastip, total, equivalent: total / kurs };
}
