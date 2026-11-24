'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { dbError } from '@/lib/format';
import { IconCalculator } from '@/components/Icons';
import {
  CURRENCIES, CURRENCY_LABEL, CURRENCY_SYMBOL, computeBreakdown, isConfigured, formatIdr, formatForeign,
} from '@/lib/calc';

const FIELDS = [
  ['kurs', 'Kurs pasar ke IDR', 'IDR untuk 1 satuan mata uang asing, contoh 17900', '1'],
  ['buffer_pct', 'Buffer kurs (%)', '3 = kurs untuk customer dinaikkan 3% dari kurs pasar', '0.1'],
  ['fee_idr', 'Fee jastip per buku (IDR)', 'Dikali jumlah buku', '1'],
  ['quotation_total', 'Total quotation ongkir', 'Sesuai mata uang di quotation. Dikonversi ke IDR pakai kurs + buffer', '0.01'],
  ['quotation_gram', 'Berat quotation (gram)', '50 kg = 50000', '1'],
];

const DEFAULT_ROW = (currency) => ({
  currency, kurs: '0', buffer_pct: '3', fee_idr: '20000', quotation_total: '0', quotation_gram: '50000',
});

function CurrencyCard({ initial }) {
  const cur = initial.currency;
  const [v, setV] = useState(() => Object.fromEntries(Object.entries(initial).map(([k, x]) => [k, String(x)])));
  const [test, setTest] = useState({ price: '', qty: '1', weight: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(initial); // nilai yang benar-benar tersimpan di database

  const num = (k) => Number(v[k]);
  const valid =
    v.kurs !== '' && v.buffer_pct !== '' && v.fee_idr !== '' && v.quotation_total !== '' && v.quotation_gram !== '' &&
    num('kurs') >= 0 && num('buffer_pct') >= 0 && num('fee_idr') >= 0 && num('quotation_total') >= 0 && num('quotation_gram') > 0;

  const save = async () => {
    setMsg({ type: '', text: '' });
    if (!valid) { setMsg({ type: 'err', text: 'Semua kolom wajib diisi dengan angka (berat quotation harus lebih dari 0).' }); return; }
    setBusy(true);
    const row = {
      currency: cur, kurs: num('kurs'), buffer_pct: num('buffer_pct'), fee_idr: num('fee_idr'),
      quotation_total: num('quotation_total'), quotation_gram: num('quotation_gram'), updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('calc_settings').upsert(row, { onConflict: 'currency' });
    setBusy(false);
    if (error) { setMsg({ type: 'err', text: dbError(error.message) }); return; }
    setSaved(row);
    setMsg({ type: 'ok', text: 'Tersimpan ✔' });
  };

  const active = isConfigured(saved);
  const dirty = FIELDS.some(([k]) => String(saved[k] ?? '') !== String(v[k] ?? ''));
  const b = valid ? computeBreakdown({ ...v }, test.price, test.qty, test.weight) : null;

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="row between">
        <h2 style={{ margin: 0 }}>{CURRENCY_LABEL[cur]} → IDR</h2>
        <span className={`status ${active ? 'st-selesai' : 'st-menunggu_pembayaran'}`}>
          {active ? 'Aktif untuk pelanggan' : 'Belum aktif (lengkapi kurs & quotation)'}
          {dirty ? ' · belum disimpan' : ''}
        </span>
      </div>

      <div className="grid grid-2" style={{ marginTop: 12 }}>
        {FIELDS.map(([k, label, hint, step]) => (
          <div className="field" key={k}>
            <label htmlFor={`${cur}-${k}`}>{label}</label>
            <input id={`${cur}-${k}`} type="number" min="0" step={step} value={v[k]}
              onChange={(e) => setV({ ...v, [k]: e.target.value })} />
            <div className="muted" style={{ fontSize: '.78rem' }}>{hint}</div>
          </div>
        ))}
      </div>
      {msg.text && <div className={`alert ${msg.type === 'ok' ? 'ok' : ''}`}>{msg.text}</div>}
      <button className="btn btn-sm" disabled={busy} onClick={save}>{busy ? 'Menyimpan…' : `Simpan ${cur}`}</button>

      <hr style={{ margin: '18px 0', border: 0, borderTop: '1px solid var(--line)' }} />
      <h3 style={{ margin: '0 0 8px' }}>Coba hitung (rincian hanya terlihat oleh admin)</h3>
      <div className="grid grid-3">
        <div className="field"><label>Harga buku ({CURRENCY_SYMBOL[cur]})</label>
          <input type="number" min="0" step="0.01" value={test.price} onChange={(e) => setTest({ ...test, price: e.target.value })} /></div>
        <div className="field"><label>Quantity</label>
          <input type="number" min="1" step="1" value={test.qty} onChange={(e) => setTest({ ...test, qty: e.target.value })} /></div>
        <div className="field"><label>Berat per buku (g)</label>
          <input type="number" min="1" value={test.weight} onChange={(e) => setTest({ ...test, weight: e.target.value })} /></div>
      </div>
      {b ? (
        <div className="calc-adm">
          <div className="calc-break">
            Kurs customer: <b>{formatIdr(b.kursCust)}</b> · Tarif ongkir: <b>{formatIdr(b.tarif)}</b>/gram<br />
            Harga buku: {formatIdr(b.buku)}<br />
            Ongkir: {formatIdr(b.ongkir)}<br />
            Fee jastip: {formatIdr(b.jastip)}<br />
            <b>Total bayar (dilihat pelanggan): {formatIdr(b.total)}</b> ≈ {formatForeign(cur, b.equivalent)}
          </div>
          <p className="muted">Pratinjau ini memakai angka yang sedang diketik. Pelanggan baru melihat perubahan setelah kamu klik <b>Simpan</b>.</p>
        </div>
      ) : (
        <p className="muted">Isi pengaturan di atas serta harga, quantity (bilangan bulat), dan berat untuk melihat rincian.</p>
      )}
    </div>
  );
}

export default function AdminKalkulator() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('calc_settings').select('*').then(({ data, error: err }) => {
      if (err) { setError(dbError(err.message)); setRows([]); return; }
      const byCur = Object.fromEntries((data || []).map((r) => [r.currency, r]));
      setRows(CURRENCIES.map((c) => byCur[c] || DEFAULT_ROW(c)));
    });
  }, []);

  return (
    <>
      <h1>Kalkulator Fee</h1>
      <p className="muted" style={{ maxWidth: 760 }}>
        Halaman <b>/kalkulator</b> di toko menampilkan hanya <b>total bayar</b> ke pelanggan. Kurs, buffer, ongkir, dan fee jastip
        di bawah ini tidak pernah terlihat oleh pelanggan. Mata uang baru muncul di kalkulator setelah kurs dan total quotation diisi.
      </p>
      <div className="card" style={{ marginBottom: 18, maxWidth: 760, background: 'linear-gradient(135deg,#fff,var(--sky-mist))' }}>
        <b style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--navy)', marginBottom: 6 }}>
          <IconCalculator width={17} height={17} /> Rumus perhitungan
        </b>
        <div className="muted" style={{ fontSize: '.86rem', lineHeight: 1.7 }}>
          Kurs customer = kurs × (1 + buffer%) · Tarif/gram = total quotation × kurs customer ÷ berat quotation<br />
          Total = (harga × kurs customer × qty) + (qty × berat × tarif/gram) + (qty × fee jastip), dibulatkan ke atas per Rp1.000
        </div>
      </div>
      {error && <div className="alert">{error}. Pastikan migrasi <code>002_kalkulator.sql</code> sudah dijalankan di Supabase.</div>}
      {rows === null && <p className="muted">Memuat…</p>}
      {rows && rows.map((r) => <CurrencyCard key={r.currency} initial={r} />)}
    </>
  );
}
