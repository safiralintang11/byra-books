'use client';
import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/lib/useSettings';
import { useI18n } from '@/lib/i18n';
import { useCart } from '@/lib/cart';
import { rupiah, hargaAktif } from '@/lib/format';
import BookCard, { Badges } from '@/components/BookCard';
import Reveal from '@/components/Reveal';
import JoinGroup from '@/components/JoinGroup';
import {
  IconSearch, IconBook, IconArrowRight, IconGrid, IconList, IconTable, IconPlus,
} from '@/components/Icons';

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
  const s = useSettings();
  const { t } = useI18n();
  const { add } = useCart();
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
  const [userView, setUserView] = useState(null);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const defaultView = ['grid', 'list', 'table'].includes(s.catalog_default_view) ? s.catalog_default_view : 'grid';
  const view = userView || defaultView;
  const showFilters = s.catalog_show_filters !== '0';
  const showCovers = s.catalog_show_covers !== '0';

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
    const term = f.q.replace(/[,()%"]/g, ' ').trim();
    if (term) q = q.or(`title.ilike.%${term}%,author.ilike.%${term}%,isbn.ilike.%${term}%`);
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
        ? t('catalog.error.permission')
        : err.message);
    }
    setBooks((prev) => (from === 0 ? data || [] : [...prev, ...(data || [])]));
    setMore((data || []).length === PAGE);
    setLoading(false);
  }, [f]);

  useEffect(() => {
    const timer = setTimeout(() => run(0), 250);
    return () => clearTimeout(timer);
  }, [run]);

  const sel = (k, label, list) => (
    <select key={k} value={f[k]} onChange={(e) => set(k, e.target.value)} aria-label={label}>
      <option value="">{label}</option>
      {list.map((x) => <option key={x} value={x}>{x}</option>)}
    </select>
  );

  const reset = () => setF({
    q: '', status: '', origin: '', category: '', author: '', publisher: '',
    min: '', max: '', label: '', sort: 'terbaru', event: '',
  });

  return (
    <div className="container">
      <div className="page-head">
        <span className="eyebrow">{t('catalog.eyebrow')}</span>
        <div className="row between" style={{ alignItems: 'flex-end', gap: 16 }}>
          <div>
            <h1 style={{ marginTop: 14 }}>{t('catalog.title')}</h1>
            <p>{t('catalog.subtitle')}</p>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <JoinGroup label={t('catalog.joinGroup')} />
            <div className="view-toggle" role="group" aria-label={t('catalog.viewGrid')}>
              <button type="button" className={view === 'grid' ? 'on' : ''} onClick={() => setUserView('grid')} title={t('catalog.viewGrid')} aria-label={t('catalog.viewGrid')} aria-pressed={view === 'grid'}>
                <IconGrid width={17} height={17} />
              </button>
              <button type="button" className={view === 'list' ? 'on' : ''} onClick={() => setUserView('list')} title={t('catalog.viewList')} aria-label={t('catalog.viewList')} aria-pressed={view === 'list'}>
                <IconList width={17} height={17} />
              </button>
              <button type="button" className={view === 'table' ? 'on' : ''} onClick={() => setUserView('table')} title={t('catalog.viewTable')} aria-label={t('catalog.viewTable')} aria-pressed={view === 'table'}>
                <IconTable width={17} height={17} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="filter-card">
          <div className="filter-row">
            <div className="search-box">
              <IconSearch width={18} height={18} />
              <input
                placeholder={t('catalog.search')}
                value={f.q}
                onChange={(e) => set('q', e.target.value)}
                aria-label={t('catalog.search')}
              />
            </div>
            <div className="row">
              {[['', t('catalog.all')], ['ready', t('catalog.ready')], ['preorder', t('catalog.preorder')]].map(([v, l]) => (
                <button key={v} type="button" className={`chip ${f.status === v ? 'on' : ''}`} onClick={() => set('status', v)}>{l}</button>
              ))}
            </div>
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            {[['', t('catalog.localImport')], ['lokal', t('catalog.local')], ['impor', t('catalog.import')]].map(([v, l]) => (
              <button key={v} type="button" className={`chip ${f.origin === v ? 'on' : ''}`} onClick={() => set('origin', v)}>{l}</button>
            ))}
            {f.event && (
              <button type="button" className="chip on" onClick={() => set('event', '')}>
                {t('catalog.eventFilter')} ✕
              </button>
            )}
          </div>

          <div className="filters">
            {sel('category', t('catalog.category'), opts.category)}
            {sel('author', t('catalog.author'), opts.author)}
            {sel('publisher', t('catalog.publisher'), opts.publisher)}
            <input type="number" placeholder={t('catalog.priceMin')} value={f.min} onChange={(e) => set('min', e.target.value)} aria-label={t('catalog.priceMin')} />
            <input type="number" placeholder={t('catalog.priceMax')} value={f.max} onChange={(e) => set('max', e.target.value)} aria-label={t('catalog.priceMax')} />
            <select value={f.label} onChange={(e) => set('label', e.target.value)} aria-label={t('catalog.label')}>
              <option value="">{t('catalog.label')}</option>
              <option value="bestseller">{t('catalog.labelBest')}</option>
              <option value="diskon">{t('catalog.labelDiscount')}</option>
              <option value="baru">{t('catalog.labelNew')}</option>
              <option value="special">{t('catalog.labelSpecial')}</option>
            </select>
            <select value={f.sort} onChange={(e) => set('sort', e.target.value)} aria-label={t('catalog.sort')}>
              <option value="terbaru">{t('catalog.sortNew')}</option>
              <option value="terlaris">{t('catalog.sortBest')}</option>
              <option value="murah">{t('catalog.sortLow')}</option>
              <option value="mahal">{t('catalog.sortHigh')}</option>
            </select>
          </div>
        </div>
      )}

      {error && <div className="alert">{error}</div>}

      <div className="result-meta">
        <span>{loading && books.length === 0 ? t('catalog.searching') : t('catalog.found', { count: books.length })}</span>
        {f.q && <span>{t('catalog.for', { q: f.q })}</span>}
      </div>

      {loading && books.length === 0 ? (
        <Skeleton />
      ) : !loading && books.length === 0 && !error ? (
        <div className="empty-state">
          <div className="icon"><IconBook width={30} height={30} /></div>
          <h3>{t('catalog.empty.title')}</h3>
          <p className="muted">{t('catalog.empty.body')}</p>
          <button type="button" className="btn btn-ghost" onClick={reset}>{t('catalog.reset')}</button>
        </div>
      ) : view === 'table' ? (
        <div className="table-wrap catalog-table">
          <table>
            <thead>
              <tr>
                <th>{t('catalog.colIsbn')}</th>
                <th>{t('catalog.colTitle')}</th>
                <th>{t('catalog.colAuthor')}</th>
                <th>{t('catalog.colFormat')}</th>
                <th style={{ textAlign: 'right' }}>{t('catalog.colPrice')}</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => {
                const aktif = hargaAktif(b);
                return (
                  <tr key={b.id}>
                    <td className="mono">{b.isbn || '—'}</td>
                    <td><Link href={`/buku/${b.id}`} style={{ fontWeight: 800 }}>{b.title}</Link></td>
                    <td>{b.author || '—'}</td>
                    <td>{b.format || '—'}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <b>{rupiah(aktif)}</b>
                      {aktif < Number(b.price) && <div className="muted" style={{ fontSize: '.76rem' }}><s>{rupiah(b.price)}</s></div>}
                    </td>
                  </tr>
                );
              })}
              {books.length === 0 && (
                <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 28 }}>{t('catalog.empty.title')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : view === 'list' ? (
        <Reveal className="book-list">
          {books.map((b) => {
            const aktif = hargaAktif(b);
            return (
              <div className="book-list-row" key={b.id}>
                {showCovers && b.cover_url && (
                  <Link href={`/buku/${b.id}`} className="book-list-cover">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.cover_url} alt={b.title} loading="lazy" />
                  </Link>
                )}
                <div className="book-list-info">
                  <div className="row" style={{ gap: 6 }}>
                    <Badges book={b} />
                  </div>
                  <Link href={`/buku/${b.id}`} className="book-title" style={{ minHeight: 0 }}>{b.title}</Link>
                  <div className="muted" style={{ fontSize: '.8rem' }}>
                    {b.author || '—'}{b.isbn ? ` · ${b.isbn}` : ''}{b.format ? ` · ${b.format}` : ''}
                  </div>
                </div>
                <div className="book-list-price">
                  <div className="price">{rupiah(aktif)}</div>
                  {aktif < Number(b.price) && <s className="muted" style={{ fontSize: '.78rem' }}>{rupiah(b.price)}</s>}
                </div>
                <button
                  type="button"
                  className="add-btn"
                  onClick={() => add(b, 1)}
                  disabled={b.status === 'ready' && b.stock <= 0}
                  aria-label={b.status === 'ready' && b.stock <= 0 ? t('book.out') : t('book.add')}
                  title={b.status === 'ready' && b.stock <= 0 ? t('book.out') : t('book.add')}
                >
                  <IconPlus width={18} height={18} />
                </button>
              </div>
            );
          })}
        </Reveal>
      ) : (
        <Reveal className="grid grid-books">
          {books.map((b) => <BookCard key={b.id} book={b} />)}
        </Reveal>
      )}

      {more && !loading && (
        <div className="center" style={{ marginTop: 24 }}>
          <button className="btn btn-ghost" onClick={() => run(books.length)}>
            {t('catalog.loadMore')} <IconArrowRight width={16} height={16} />
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
