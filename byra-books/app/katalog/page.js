'use client';
import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BookCard from '@/components/BookCard';
import Reveal from '@/components/Reveal';
import { IconSearch, IconBook, IconArrowRight } from '@/components/Icons';

const PAGE = 24;

function Skeleton() {
  return (
    <div className="grid grid-books" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <div className="skeleton-card" key={i}>
          <div className="sk sk-cover" />
          <div className="sk sk-line" />
          <div className="sk sk-line short" />
        </div>
      ))}
    </div>
  );
}

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

  const search = sp.toString();
  useEffect(() => {
    setF((p) => ({
      ...p,
      q: sp.get('q') || '',
      status: sp.get('status') || '',
      origin: sp.get('origin') || '',
      label: sp.get('label') || '',
      sort: sp.get('sort') || 'terbaru',
      event: sp.get('event') || '',
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

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
    const s = f.q.replace(/[,()%"]/g, ' ').trim();
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
    if (err) {
      console.error('[Byra Books] Gagal memuat katalog:', err.message);
      setError(/permission denied/i.test(err.message)
        ? 'Katalog sedang disiapkan. Silakan coba lagi nanti.'
        : err.message);
    }
    setBooks((prev) => (from === 0 ? data || [] : [...prev, ...(data || [])]));
    setMore((data || []).length === PAGE);
    setLoading(false);
  }, [f]);

  useEffect(() => {
    const t = setTimeout(() => run(0), 250);
    return () => clearTimeout(t);
  }, [run]);

  const sel = (k, label, list) => (
    <select key={k} value={f[k]} onChange={(e) => set(k, e.target.value)} aria-label={label}>
      <option value="">{label}</option>
      {list.map((x) => <option key={x} value={x}>{x}</option>)}
    </select>
  );

  return (
    <div className="container">
      <div className="page-head">
        <span className="eyebrow">Katalog Byra Books</span>
        <h1 style={{ marginTop: 14 }}>Temukan buku berikutnya</h1>
        <p>Cari berdasarkan judul, penulis, penerbit, atau ISBN. Filter sesuai kebutuhanmu.</p>
      </div>

      <div className="filter-card">
        <div className="filter-row">
          <div className="search-box">
            <IconSearch width={18} height={18} />
            <input
              placeholder="Cari judul, penulis, atau ISBN…"
              value={f.q}
              onChange={(e) => set('q', e.target.value)}
              aria-label="Cari buku"
            />
          </div>
          <div className="row">
            {[['', 'Semua'], ['ready', 'Ready stock'], ['preorder', 'Pre-order']].map(([v, l]) => (
              <button key={v} type="button" className={`chip ${f.status === v ? 'on' : ''}`} onClick={() => set('status', v)}>{l}</button>
            ))}
          </div>
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          {[['', 'Lokal + impor'], ['lokal', 'Lokal'], ['impor', 'Impor']].map(([v, l]) => (
            <button key={v} type="button" className={`chip ${f.origin === v ? 'on' : ''}`} onClick={() => set('origin', v)}>{l}</button>
          ))}
          {f.event && (
            <button type="button" className="chip on" onClick={() => set('event', '')}>Filter event ✕</button>
          )}
        </div>

        <div className="filters">
          {sel('category', 'Semua kategori', opts.category)}
          {sel('author', 'Semua penulis', opts.author)}
          {sel('publisher', 'Semua penerbit', opts.publisher)}
          <input type="number" placeholder="Harga min" value={f.min} onChange={(e) => set('min', e.target.value)} aria-label="Harga minimum" />
          <input type="number" placeholder="Harga maks" value={f.max} onChange={(e) => set('max', e.target.value)} aria-label="Harga maksimum" />
          <select value={f.label} onChange={(e) => set('label', e.target.value)} aria-label="Label buku">
            <option value="">Semua label</option>
            <option value="bestseller">Best Seller</option>
            <option value="diskon">Diskon</option>
            <option value="baru">Buku Baru</option>
            <option value="special">Special Edition</option>
          </select>
          <select value={f.sort} onChange={(e) => set('sort', e.target.value)} aria-label="Urutkan">
            <option value="terbaru">Terbaru</option>
            <option value="terlaris">Terlaris</option>
            <option value="murah">Harga terendah</option>
            <option value="mahal">Harga tertinggi</option>
          </select>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="result-meta">
        <span>{loading && books.length === 0 ? 'Memuat buku…' : `${books.length} buku ditemukan`}</span>
        {f.q && <span>Hasil untuk “{f.q}”</span>}
      </div>

      {loading && books.length === 0 ? (
        <Skeleton />
      ) : (
        <Reveal className="grid grid-books">
          {books.map((b) => <BookCard key={b.id} book={b} />)}
        </Reveal>
      )}

      {!loading && books.length === 0 && !error && (
        <div className="empty-state">
          <div className="icon"><IconBook width={30} height={30} /></div>
          <h3>Belum ada buku yang cocok</h3>
          <p className="muted">Coba kata kunci lain atau reset filter untuk melihat semua koleksi.</p>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setF({ q: '', status: '', origin: '', category: '', author: '', publisher: '', min: '', max: '', label: '', sort: 'terbaru', event: '' })}
          >
            Reset filter
          </button>
        </div>
      )}

      {more && !loading && (
        <div className="center" style={{ marginTop: 24 }}>
          <button className="btn btn-ghost" onClick={() => run(books.length)}>
            Muat lebih banyak <IconArrowRight width={16} height={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="container section"><Skeleton /></div>}>
      <Katalog />
    </Suspense>
  );
}
