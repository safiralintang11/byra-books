'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { parseCsv, downloadCsv } from '@/lib/format';

// nama kolom CSV (Indonesia / Inggris) -> kolom database
const MAP = {
  judul: 'title', title: 'title', penulis: 'author', author: 'author', penerbit: 'publisher', publisher: 'publisher',
  isbn: 'isbn', halaman: 'pages', pages: 'pages', sinopsis: 'synopsis', synopsis: 'synopsis',
  kategori: 'category', category: 'category', stok: 'stock', stock: 'stock', harga: 'price', price: 'price',
  harga_diskon: 'discount_price', discount_price: 'discount_price', tahun: 'year', year: 'year',
  berat: 'weight_grams', weight_grams: 'weight_grams', bahasa: 'language', language: 'language',
  cover_url: 'cover_url', sampul: 'cover_url', format: 'format', varian: 'format', asal: 'origin', origin: 'origin',
  status: 'status', shopee_url: 'shopee_url', tutup_po: 'preorder_close', preorder_close: 'preorder_close',
};
const NUM = ['pages', 'stock', 'price', 'discount_price', 'year', 'weight_grams'];
const COLS = ['judul', 'penulis', 'penerbit', 'isbn', 'halaman', 'sinopsis', 'kategori', 'stok', 'harga', 'harga_diskon', 'tahun', 'berat', 'bahasa', 'cover_url', 'format', 'asal', 'status', 'shopee_url', 'tutup_po'];

export default function Import() {
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const onFile = async (file) => {
    if (!file) return;
    const parsed = parseCsv(await file.text());
    const head = parsed[0].map((h) => MAP[h.trim().toLowerCase().replace(/\s+/g, '_')] || null);
    const out = parsed.slice(1).map((r) => {
      const o = {};
      head.forEach((k, i) => {
        if (!k) return;
        let v = (r[i] ?? '').trim();
        if (v === '') return;
        if (NUM.includes(k)) v = Number(String(v).replace(/[^\d.-]/g, ''));
        if (k === 'origin') v = /impor|import/i.test(v) ? 'impor' : 'lokal';
        if (k === 'status') v = /pre|po/i.test(v) ? 'preorder' : 'ready';
        o[k] = v;
      });
      return o;
    }).filter((o) => o.title);
    setRows(out);
    setMsg(`${out.length} baris siap diimport.`);
  };

  const run = async () => {
    setBusy(true);
    const withIsbn = rows.filter((r) => r.isbn).map((r) => ({ stock: 0, price: 0, ...r }));
    const noIsbn = rows.filter((r) => !r.isbn).map((r) => ({ stock: 0, price: 0, ...r }));
    let err = null;
    if (withIsbn.length) { const { error } = await supabase.from('books').upsert(withIsbn, { onConflict: 'isbn' }); err = error; }
    if (!err && noIsbn.length) { const { error } = await supabase.from('books').insert(noIsbn); err = error; }
    setBusy(false);
    setMsg(err ? `Gagal: ${err.message}` : `Berhasil import ${rows.length} buku ✔ (ISBN yang sama otomatis diperbarui)`);
    if (!err) setRows([]);
  };

  const exportAll = async () => {
    const { data } = await supabase.from('books').select('*').order('title').limit(10000);
    const inv = Object.fromEntries(Object.entries(MAP).filter(([k]) => COLS.includes(k)).map(([k, v]) => [v, k]));
    downloadCsv('buku-byra.csv', [COLS, ...(data || []).map((b) => COLS.map((c) => b[MAP[c]] ?? ''))]);
    void inv;
  };

  const template = () => downloadCsv('template-buku.csv', [COLS, ['Judul Contoh', 'Penulis', 'Penerbit', '9786020000000', 320, 'Sinopsis singkat', 'Novel', 10, 99000, '', 2024, 350, 'Indonesia', '', 'Paperback', 'lokal', 'ready', '', '']]);

  return (
    <>
      <h1>Import / Export Buku (CSV)</h1>
      <div className="card" style={{ maxWidth: 720 }}>
        <p>Bisa dari Excel / Google Sheets: simpan sebagai <b>CSV</b>. Baris dengan ISBN yang sudah ada akan diperbarui (stok &amp; harga ikut terupdate).</p>
        <div className="row">
          <button className="btn btn-ghost btn-sm" onClick={template}>⬇ Unduh template</button>
          <button className="btn btn-ghost btn-sm" onClick={exportAll}>⬇ Export semua buku</button>
        </div>
        <div className="field" style={{ marginTop: 14 }}><label>Pilih file CSV</label>
          <input type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0])} /></div>
        {msg && <div className={`alert ${msg.includes('✔') || msg.includes('siap') ? 'ok' : ''}`}>{msg}</div>}
        {rows.length > 0 && (
          <>
            <div className="table-wrap" style={{ maxHeight: 260 }}><table>
              <thead><tr><th>Judul</th><th>ISBN</th><th>Harga</th><th>Stok</th><th>Status</th></tr></thead>
              <tbody>{rows.slice(0, 50).map((r, i) => <tr key={i}><td>{r.title}</td><td>{r.isbn}</td><td>{r.price}</td><td>{r.stock}</td><td>{r.status || 'ready'}</td></tr>)}</tbody>
            </table></div>
            <button className="btn" style={{ marginTop: 10 }} disabled={busy} onClick={run}>{busy ? 'Mengimport…' : `Import ${rows.length} buku`}</button>
          </>
        )}
      </div>
    </>
  );
}
