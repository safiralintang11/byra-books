'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/lib/useSettings';
import { tanggal, waLink } from '@/lib/format';
import BookCard from '@/components/BookCard';
import Reveal from '@/components/Reveal';
import {
  IconSparkle, IconArrowRight, IconBook, IconBox, IconTruck, IconCalculator,
  IconTag, IconReceipt, IconWhatsApp, IconHeart, IconGift,
} from '@/components/Icons';

function Row({ title, subtitle, href, books }) {
  if (!books.length) return null;
  return (
    <Reveal as="section" className="section">
      <div className="section-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p className="sub">{subtitle}</p>}
        </div>
        <Link href={href} className="section-link">
          Lihat semua <IconArrowRight width={16} height={16} />
        </Link>
      </div>
      <div className="grid grid-books">
        {books.map((b) => <BookCard key={b.id} book={b} />)}
      </div>
    </Reveal>
  );
}

const CATEGORIES = [
  { href: '/katalog?origin=lokal', icon: IconBook, title: 'Buku Lokal', sub: 'Penulis Indonesia' },
  { href: '/katalog?origin=impor', icon: IconTruck, title: 'Buku Impor', sub: 'Judul mancanegara' },
  { href: '/katalog?status=ready', icon: IconBox, title: 'Ready Stock', sub: 'Siap dikirim' },
  { href: '/katalog?status=preorder', icon: IconTag, title: 'Pre-Order', sub: 'PO terbatas' },
  { href: '/kalkulator', icon: IconCalculator, title: 'Kalkulator Fee', sub: 'Hitung buku impor' },
];

const MARQUEE = ['Buku baru', 'Buku impor', 'Pre-order', 'Event buku', 'Kalkulator fee', 'Lacak pesanan'];

export default function Home() {
  const s = useSettings();
  const [events, setEvents] = useState([]);
  const [data, setData] = useState({ baru: [], best: [], ready: [], po: [] });
  const [hasBooks, setHasBooks] = useState(true);

  useEffect(() => {
    (async () => {
      const base = () => supabase.from('books').select('*').eq('is_active', true);
      const [ev, baru, best, ready, po, total] = await Promise.all([
        supabase.from('events').select('*').eq('is_active', true).order('starts_on', { ascending: true }),
        base().eq('is_new', true).order('created_at', { ascending: false }).limit(6),
        base().order('sold_count', { ascending: false }).limit(6),
        base().eq('status', 'ready').gt('stock', 0).order('created_at', { ascending: false }).limit(6),
        base().eq('status', 'preorder').order('created_at', { ascending: false }).limit(6),
        base().limit(1),
      ]);
      setEvents(ev.data || []);
      setHasBooks((total.data || []).length > 0);
      setData({
        baru: baru.data || [],
        best: (best.data || []).filter((b) => b.sold_count > 0),
        ready: ready.data || [],
        po: po.data || [],
      });
    })();
  }, []);

  return (
    <>
      {s.announcement && <div className="announce">{s.announcement}</div>}

      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow"><IconSparkle width={14} height={14} /> Toko buku baru &amp; impor</span>
            <h1>
              Temukan buku, buka <span className="accent">cerita</span> barumu.
            </h1>
            <p className="lead">
              {s.store_name || 'Byra Books'} merangkum buku baru, judul impor, dan pre-order pilihan.
              Pesan tanpa ribet, lalu lacak pesananmu kapan saja.
            </p>
            <div className="row hero-actions">
              <Link href="/katalog" className="btn btn-primary btn-lg">
                Jelajahi katalog <IconArrowRight width={18} height={18} />
              </Link>
              <Link href="/katalog?status=preorder" className="btn btn-ghost btn-lg">
                Lihat pre-order
              </Link>
            </div>
            <div className="hero-stats">
              <div className="hero-stat"><b>Ready stock</b><span>siap dikirim</span></div>
              <div className="hero-stat"><b>Pre-order</b><span>judul terbatas</span></div>
              <div className="hero-stat"><b>Lacak</b><span>status transparan</span></div>
            </div>
          </div>

          <div className="hero-visual" aria-hidden>
            <span className="blob" />
            <div className="book-stage">
              <div className="book3d">
                <div className="book3d-pages" />
                <div className="book3d-cover">
                  <span className="book3d-bookmark" />
                  <div className="book3d-face">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/brand/icon.png" alt="" />
                    <div className="book3d-title">byra <em>books</em></div>
                    <div className="book3d-sub">baca · temukan · tumbuh</div>
                  </div>
                </div>
              </div>
              <div className="book3d-shadow" />
            </div>
            <span className="float-chip f1"><IconBox width={15} height={15} /> Ready stock</span>
            <span className="float-chip f2"><IconTag width={15} height={15} /> Pre-order</span>
            <span className="float-chip f3"><IconTruck width={15} height={15} /> Buku impor</span>
          </div>
        </div>
      </section>

      <div className="marquee" aria-hidden>
        <div className="marquee-track">
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span className="marquee-item" key={`${item}-${i}`}>{item}</span>
          ))}
        </div>
      </div>

      <div className="container">
        <Reveal as="section" className="section">
          <div className="cat-grid">
            {CATEGORIES.map(({ href, icon: Icon, title, sub }) => (
              <Link key={href} href={href} className="cat-card">
                <span className="cat-icon"><Icon width={21} height={21} /></span>
                <b>{title}</b>
                <span>{sub}</span>
              </Link>
            ))}
          </div>
        </Reveal>

        {!hasBooks && (
          <Reveal as="section" className="section">
            <div className="empty-state">
              <div className="icon"><IconBook width={30} height={30} /></div>
              <h3>Rak buku sedang disiapkan</h3>
              <p className="muted">Koleksi pertama akan segera tampil di sini. Sementara itu, kamu bisa menjelajahi katalog.</p>
              <Link href="/katalog" className="btn btn-ghost">Buka katalog</Link>
            </div>
          </Reveal>
        )}

        {events.length > 0 && (
          <Reveal as="section" className="section">
            <div className="section-head">
              <div>
                <h2>Event &amp; pre-order berjalan</h2>
                <p className="sub">Ikuti PO terbatas dan event buku terbaru.</p>
              </div>
              <Link href="/katalog" className="section-link">
                Semua buku <IconArrowRight width={16} height={16} />
              </Link>
            </div>
            <div className="grid grid-2">
              {events.map((e) => (
                <Link key={e.id} href={`/katalog?event=${e.id}`} className="card event-card">
                  <span className="badge b-po">{e.kind}</span>
                  <h3>{e.title}</h3>
                  <div className="muted" style={{ fontSize: '.82rem', fontWeight: 700 }}>
                    {e.starts_on && tanggal(e.starts_on)} {e.ends_on && `– ${tanggal(e.ends_on)}`}
                  </div>
                  <p style={{ margin: '8px 0 0', color: 'var(--steel)', fontSize: '.9rem' }}>{e.description}</p>
                </Link>
              ))}
            </div>
          </Reveal>
        )}

        <Row
          title="Baru di rak"
          subtitle="Tambahan terbaru untuk koleksimu."
          href="/katalog?label=baru"
          books={data.baru}
        />
        <Row
          title="Paling dicari"
          subtitle="Judul favorit yang paling sering dipesan."
          href="/katalog?sort=terlaris"
          books={data.best}
        />
        <Row
          title="Ready stock"
          subtitle="Stok ada di tangan, tinggal checkout."
          href="/katalog?status=ready"
          books={data.ready}
        />
        <Row
          title="Pre-order"
          subtitle="Amankan judul terbatas sebelum tutup PO."
          href="/katalog?status=preorder"
          books={data.po}
        />

        <Reveal as="section" className="section">
          <div className="feature-band">
            <div className="feature">
              <span className="fi"><IconReceipt width={20} height={20} /></span>
              <div>
                <b>Pesan tanpa akun</b>
                <span>Isi data pengiriman, pesanan langsung dibuat.</span>
              </div>
            </div>
            <div className="feature">
              <span className="fi"><IconBox width={20} height={20} /></span>
              <div>
                <b>Status pesanan jelas</b>
                <span>Lacak lewat kode pesanan dan nomor WhatsApp.</span>
              </div>
            </div>
            <div className="feature">
              <span className="fi"><IconHeart width={20} height={20} /></span>
              <div>
                <b>Dikurasi dengan teliti</b>
                <span>Buku lokal dan impor dipilih satu per satu.</span>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal as="section" className="section">
          <div className="cta-band">
            <div>
              <span className="eyebrow" style={{ background: 'rgba(255,255,255,.12)', borderColor: 'rgba(255,255,255,.2)', color: '#fff' }}>
                <IconGift width={14} height={14} /> Butuh rekomendasi?
              </span>
              <h2 style={{ marginTop: 14 }}>Bingung pilih buku berikutnya?</h2>
              <p>Ceritakan genre atau judul yang kamu cari, admin kami bantu carikan. Bisa juga hitung dulu biaya buku impor.</p>
            </div>
            <div className="row">
              {s.wa_number ? (
                <a
                  className="btn btn-pink btn-lg"
                  href={waLink(s.wa_number, 'Halo Byra Books, saya mau minta rekomendasi buku.')}
                  target="_blank"
                  rel="noreferrer"
                >
                  <IconWhatsApp width={18} height={18} /> Chat admin
                </a>
              ) : (
                <Link className="btn btn-pink btn-lg" href="/katalog">Mulai belanja</Link>
              )}
              <Link className="btn btn-ghost btn-lg" href="/kalkulator">
                <IconCalculator width={18} height={18} /> Kalkulator
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </>
  );
}
