'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { rupiah } from '@/lib/format';
import { IconPlus, IconSearch } from '@/components/Icons';

const EMPTY = {
  title: '', author: '', publisher: '', isbn: '', pages: '', synopsis: '', category: '',
  stock: 0, price: 0, discount_price: '', year: '', weight_grams: '', language: 'Indonesia',
  cover_url: '', format: 'Paperback', origin: 'lokal', status: 'ready', preorder_close: '',
  is_bestseller: false, is_new: false, is_special: false, shopee_url: '', event_id: '', is_active: true,
};
const NUM = ['pages', 'stock', 'price', 'discount_price', 'year', 'weight_grams'];

export default function AdminBuku() {
  const [books, setBooks] = useState([]);
  const [events, setEvents] = useState([]);
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    let query = supabase.from('books').select('*').order('created_at', { ascending: false }).limit(300);
    const s = q.replace(/[,()%"]/g, ' ').trim();
    if (s) query = query.or(`title.ilike.%${s}%,author.ilike.%${s}%,isbn.ilike.%${s}%`);
    const { data } = await query;
    setBooks(data || []);
  }, [q]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => { supabase.from('events').select('id,title').then(({ data }) => setEvents(data || [])); }, []);

  const set = (k, v) => setEdit((p) => ({ ...p, [k]: v }));

  const uploadCover = async (file) => {
    if (!file) return;
    setBusy(true);
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await supabase.storage.from('covers').upload(path, file);
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    set('cover_url', supabase.storage.from('covers').getPublicUrl(path).data.publicUrl);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    const row = { ...edit };
    NUM.forEach((k) => { row[k] = row[k] === '' || row[k] == null ? null : Number(row[k]); });
    row.stock = row.stock ?? 0;
    row.price = row.price ?? 0;
    ['isbn', 'preorder_close', 'event_id', 'author', 'publisher', 'category', 'synopsis', 'cover_url', 'shopee_url', 'language']
      .forEach((k) => { if (row[k] === '') row[k] = null; });
    delete row.created_at;
    const id = row.id;
    delete row.id;
    const { error } = id
      ? await supabase.from('books').update(row).eq('id', id)
      : await supabase.from('books').insert(row);
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    setEdit(null);
    load();
  };

  const quickStock = async (b, val) => {
    await supabase.from('books').update({ stock: Number(val) }).eq('id', b.id);
    load();
  };
  const hapus = async (b) => {
    if (!confirm(`Hapus "${b.title}"? (pesanan lama tetap tersimpan)`)) return;
    const { error } = await supabase.from('books').delete().eq('id', b.id);
    if (error) setMsg(error.message); else load();
  };

  const field = (k, label, type = 'text', rest = {}) => (
    <div className="field" key={k}><label>{label}</label>
      <input type={type} value={edit[k] ?? ''} onChange={(e) => set(k, e.target.value)} {...rest} /></div>
  );

  return (
    <>
      <div className="row between" style={{ marginBottom: 4 }}>
        <div>
          <h1>Buku</h1>
          <p className="muted" style={{ margin: 0 }}>{books.length} buku ditampilkan · kelola stok, harga, dan label.</p>
        </div>
        <button className="btn" onClick={() => setEdit({ ...EMPTY })}>
          <IconPlus width={17} height={17} /> Tambah buku
        </button>
      </div>

      <div className="row" style={{ margin: '16px 0' }}>
        <div className="search-box" style={{ maxWidth: 360 }}>
          <IconSearch width={17} height={17} />
          <input placeholder="Cari judul / penulis / ISBN" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari buku" />
        </div>
      </div>

      {msg && !edit && <div className="alert">{msg}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Buku</th><th>Jenis</th><th>Harga</th><th>Stok</th><th style={{ textAlign: 'right' }}>Aksi</th></tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.id} style={{ opacity: b.is_active ? 1 : 0.5 }}>
                <td>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {b.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.cover_url} alt="" style={{ width: 34, height: 48, objectFit: 'cover', borderRadius: 6, flex: 'none' }} />
                    ) : (
                      <span style={{ width: 34, height: 48, borderRadius: 6, background: 'var(--sky-soft)', flex: 'none' }} />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <b>{b.title}</b>
                      <div className="muted" style={{ fontSize: '.78rem' }}>{b.author || '—'}{b.isbn ? ` · ${b.isbn}` : ''}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${b.status === 'preorder' ? 'b-po' : 'b-new'}`}>{b.status === 'preorder' ? 'PO' : 'Ready'}</span>{' '}
                  <span className="badge b-imp" style={{ marginTop: 4 }}>{b.origin}</span>
                </td>
                <td>
                  {rupiah(b.price)}
                  {b.discount_price ? <div className="muted" style={{ fontSize: '.76rem' }}>disk {rupiah(b.discount_price)}</div> : null}
                </td>
                <td style={{ width: 100 }}>
                  <input type="number" defaultValue={b.stock} onBlur={(e) => Number(e.target.value) !== b.stock && quickStock(b, e.target.value)} />
                </td>
                <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setEdit({ ...EMPTY, ...Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v ?? EMPTY[k] ?? ''])) })}
                  >
                    Edit
                  </button>{' '}
                  <button className="btn btn-danger btn-sm" onClick={() => hapus(b)}>Hapus</button>
                </td>
              </tr>
            ))}
            {books.length === 0 && (
              <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 28 }}>Belum ada buku. Tambah manual atau import Excel.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {edit && (
        <div className="modal-bg" onClick={() => setEdit(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <h2>{edit.id ? 'Edit buku' : 'Tambah buku'}</h2>
            <div className="grid grid-2">
              {field('title', 'Judul *', 'text', { required: true })}
              {field('author', 'Penulis')}
              {field('publisher', 'Penerbit')}
              {field('isbn', 'ISBN')}
              {field('category', 'Kategori')}
              {field('language', 'Bahasa')}
              {field('year', 'Tahun terbit', 'number')}
              {field('pages', 'Jumlah halaman', 'number')}
              {field('weight_grams', 'Berat (gram)', 'number')}
              {field('price', 'Harga (Rp)', 'number')}
              {field('discount_price', 'Harga diskon (opsional)', 'number')}
              {field('stock', 'Stok', 'number')}
              <div className="field"><label>Status</label>
                <select value={edit.status} onChange={(e) => set('status', e.target.value)}>
                  <option value="ready">Ready stock</option><option value="preorder">Pre-Order</option>
                </select></div>
              <div className="field"><label>Asal</label>
                <select value={edit.origin} onChange={(e) => set('origin', e.target.value)}>
                  <option value="lokal">Lokal</option><option value="impor">Impor</option>
                </select></div>
              <div className="field"><label>Varian</label>
                <select value={edit.format} onChange={(e) => set('format', e.target.value)}>
                  <option>Paperback</option><option>Hardcover</option>
                </select></div>
              {field('preorder_close', 'Tutup PO (tanggal)', 'date')}
              <div className="field"><label>Event / PO</label>
                <select value={edit.event_id || ''} onChange={(e) => set('event_id', e.target.value)}>
                  <option value="">— tidak ada —</option>
                  {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                </select></div>
              {field('shopee_url', 'Link Shopee (opsional)')}
            </div>
            <div className="field"><label>Sinopsis</label>
              <textarea rows={4} value={edit.synopsis || ''} onChange={(e) => set('synopsis', e.target.value)} /></div>
            <div className="field"><label>Sampul (upload atau tempel URL)</label>
              <input type="file" accept="image/*" onChange={(e) => uploadCover(e.target.files?.[0])} />
              <input style={{ marginTop: 6 }} placeholder="https://…" value={edit.cover_url || ''} onChange={(e) => set('cover_url', e.target.value)} />
              {edit.cover_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={edit.cover_url} alt="" style={{ height: 100, marginTop: 8, borderRadius: 8, border: '1px solid var(--line)' }} />
              )}
            </div>
            <div className="field">
              {[['is_bestseller', 'Best Seller'], ['is_new', 'Buku Baru'], ['is_special', 'Special Edition'], ['is_active', 'Tampil di toko']].map(([k, l]) => (
                <label key={k} className="check"><input type="checkbox" checked={!!edit[k]} onChange={(e) => set(k, e.target.checked)} />{l}</label>
              ))}
            </div>
            {msg && <div className="alert">{msg}</div>}
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setEdit(null)}>Batal</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
