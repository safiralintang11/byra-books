'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/lib/useSettings';
import { tanggal } from '@/lib/format';
import BookCard from '@/components/BookCard';

function Row({ title, href, books }) {
  if (!books.length) return null;
  return (
    <section className="section">
      <div className="row between">
        <h2>{title}</h2>
        <Link href={href}>Lihat semua →</Link>
      </div>
      <div className="grid grid-books">
        {books.map((b) => <BookCard key={b.id} book={b} />)}
      </div>
    </section>
  );
}

export default function Home() {
  const s = useSettings();
  const [events, setEvents] = useState([]);
  const [data, setData] = useState({ baru: [], best: [], ready: [], po: [] });

  useEffect(() => {
    (async () => {
      const base = () => supabase.from('books').select('*').eq('is_active', true);
      const [ev, baru, best, ready, po] = await Promise.all([
        supabase.from('events').select('*').eq('is_active', true).order('starts_on', { ascending: true }),
        base().eq('is_new', true).order('created_at', { ascending: false }).limit(6),
        base().order('sold_count', { ascending: false }).limit(6),
        base().eq('status', 'ready').gt('stock', 0).order('created_at', { ascending: false }).limit(6),
        base().eq('status', 'preorder').order('created_at', { ascending: false }).limit(6),
      ]);
      setEvents(ev.data || []);
      setData({ baru: baru.data || [], best: (best.data || []).filter((b) => b.sold_count > 0), ready: ready.data || [], po: po.data || [] });
    })();
  }, []);

  return (
    <>
      {s.announcement && <div className="announce">📣 {s.announcement}</div>}
      <section className="hero">
        <div className="container">
          <h1>Temukan buku favoritmu di {s.store_name || 'Byra Books'} 📚</h1>
          <p>Buku baru &amp; buku impor, pre-order, dan event buku seru. Pesan gampang, status pesanan bisa dilacak kapan saja.</p>
          <div className="row">
            <Link href="/katalog" className="btn btn-purple">Lihat Katalog</Link>
            <Link href="/katalog?status=preorder" className="btn btn-ghost">Pre-Order</Link>
            <Link href="/pesanan" className="btn btn-ghost">Lacak Pesanan</Link>
          </div>
        </div>
      </section>

      <div className="container">
        <section className="section">
          <div className="row">
            <Link className="chip" href="/katalog?origin=lokal">🇮🇩 Buku Lokal</Link>
            <Link className="chip" href="/katalog?origin=impor">✈️ Buku Impor</Link>
            <Link className="chip" href="/katalog?status=ready">📦 Ready Stock</Link>
            <Link className="chip" href="/katalog?status=preorder">⏳ Pre-Order</Link>
          </div>
        </section>

        {events.length > 0 && (
          <section className="section">
            <h2>🎉 Event &amp; PO Berjalan</h2>
            <div className="grid grid-2">
              {events.map((e) => (
                <Link key={e.id} href={`/katalog?event=${e.id}`} className="card event-card" style={{ color: 'inherit' }}>
                  <span className="badge b-po">{e.kind}</span>
                  <h3 style={{ margin: '6px 0' }}>{e.title}</h3>
                  <div className="muted">
                    {e.starts_on && tanggal(e.starts_on)} {e.ends_on && `– ${tanggal(e.ends_on)}`}
                  </div>
                  <p>{e.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <Row title="🆕 Buku Baru" href="/katalog?label=baru" books={data.baru} />
        <Row title="🔥 Terlaris" href="/katalog?sort=terlaris" books={data.best} />
        <Row title="📦 Ready Stock" href="/katalog?status=ready" books={data.ready} />
        <Row title="⏳ Pre-Order" href="/katalog?status=preorder" books={data.po} />
      </div>
    </>
  );
}
