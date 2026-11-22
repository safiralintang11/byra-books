'use client';
import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BookCard from '@/components/BookCard';

const PAGE = 24;

function Katalog() {
  const sp = useSearchParams();
  const [f, setF] = useState({
    q: sp.get('q') || '',
    status: sp.get('status') || '',
    origin: sp.get('origin') || '',
    category: '', author: '', publisher: '', min: '', max: '',
    label: sp.get('label') || '',
    sort: sp.get('sort') || 'terbaru',
    event: sp.get('event') || '',
  });
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [opts, setOpts] = useState({ category: [], author: [], publisher: [] });
  const [error, setError] = useState('');
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    supabase.from('books').select('category,author,publisher').eq('is_active', true).limit(2000).then(({ data }) => {
      const u = (k) => [...new Set((data || []).map((r) => r[k]).filter(Boolean))].sort();
      setOpts({ category: u('category'), author: u('author'), publisher: u('publisher') });
    });
  }, []);

  const run = useCallback(async (from) => {
    setLoading(true);
    setError('');
    let q = supabase.from('books').select('*').eq('is_active', true);
    const s = f.q.replace(/[,()%]/g, ' ').trim();
    if (s) q = q.or(`title.ilike.%${s}%,author.ilike.%${s}%,isbn.ilike.%${s}%`);
    if (f.status) q = q.eq('status', f.status);
    if (f.origin) q = q.eq('origin', f.origin);
    if (f.category) q = q.eq('category', f.category);
    if (f.author) q = q.eq('author', f.author);
    if (f.publisher) q = q.eq('publisher', f.publisher);
    if (f.event) q = q.eq('event_id', f.event);
    if (f.min) q = q.gte('price', Number(f.min));
    if (f.max) q = q.lte('price', Number(f.max));
    if (f.label === 'bestseller') q = q.eq('is_bestseller', true);
    if (f.label === 'diskon') q = q.not('discount_price', 'is', null);
    if (f.label === 'baru') q = q.eq('is_new', true);
    if (f.label === 'special') q = q.eq('is_special', true);
    if (f.sort === 'terlaris') q = q.order('sold_count', { ascending: false });
    else if (f.sort === 'murah') q = q.order('price', { ascending: true });
    else if (f.sort === 'mahal') q = q.order('price', { ascending: false });
    else q = q.order('created_at', { ascending: false });
    const { data, error: err } = await q.range(from, from + PAGE - 1);
    if (err) setError(err.message);
    setBooks((prev) => (from === 0 ? data || [] : [...prev, ...(data || [])]));
    setMore((data || []).length === PAGE);
    setLoading(false);
  }, [f]);

  useEffect(() => {
    const t = setTimeout(() => run(0), 250);
    return () => clearTimeout(t);
  }, [run]);

  const Sel = ({ k, label, list }) => (
    <select value={f[k]} onChange={(e) => set(k, e.target.value)} aria-label={label}>
      <option value="">{label}</option>
      {list.map((x) => <option key={x} value={x}>{x}</option>)}
    </select>
  );

  return (
    <div className="container section">
      <h1>Katalog Buku</h1>
      <div className="row" style={{ marginBottom: 12 }}>
        {[['', 'Semua'], ['ready', '📦 Ready Stock'], ['preorder', '⏳ Pre-Order']].map(([v, l]) => (
          <button key={v} className={`chip ${f.status === v ? 'on' : ''}`} onClick={() => set('status', v)}>{l}</button>
        ))}
        {[['', 'Lokal + Impor'], ['lokal', '🇮🇩 Lokal'], ['impor', '✈️ Impor']].map(([v, l]) => (
          <button key={v} className={`chip ${f.origin === v ? 'on' : ''}`} onClick={() => set('origin', v)}>{l}</button>
        ))}
        {f.event && <button className="chip on" onClick={() => set('event', '')}>Filter event ✕</button>}
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="filters">
          <input placeholder="🔍 Cari judul / penulis / ISBN" value={f.q} onChange={(e) => set('q', e.target.value)} />
          <Sel k="category" label="Semua kategori" list={opts.category} />
          <Sel k="author" label="Semua penulis" list={opts.author} />
          <Sel k="publisher" label="Semua penerbit" list={opts.publisher} />
          <input type="number" placeholder="Harga min" value={f.min} onChange={(e) => set('min', e.target.value)} />
          <input type="number" placeholder="Harga maks" value={f.max} onChange={(e) => set('max', e.target.value)} />
          <select value={f.label} onChange={(e) => set('label', e.target.value)}>
            <option value="">Semua label</option>
            <option value="bestseller">Best Seller</option>
            <option value="diskon">Diskon</option>
            <option value="baru">Buku Baru</option>
            <option value="special">Special Edition</option>
          </select>
          <select value={f.sort} onChange={(e) => set('sort', e.target.value)}>
            <option value="terbaru">Terbaru</option>
            <option value="terlaris">Terlaris</option>
            <option value="murah">Harga terendah</option>
            <option value="mahal">Harga tertinggi</option>
          </select>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}
      <div className="grid grid-books">
        {books.map((b) => <BookCard key={b.id} book={b} />)}
      </div>
      {!loading && books.length === 0 && !error && <p className="center muted">Tidak ada buku yang cocok 😢</p>}
      {loading && <p className="center muted">Memuat…</p>}
      {more && !loading && (
        <div className="center" style={{ marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={() => run(books.length)}>Muat lebih banyak</button>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="center muted">Memuat…</p>}>
      <Katalog />
    </Suspense>
  );
}
