'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/cart';
import { useSettings } from '@/lib/useSettings';
import { rupiah, hargaAktif, tanggal, waLink } from '@/lib/format';
import { Cover, Badges } from '@/components/BookCard';
import BookCard from '@/components/BookCard';
import Reveal from '@/components/Reveal';
import {
  IconMinus, IconPlus, IconHeart, IconCart, IconTruck, IconCheck,
  IconWhatsApp, IconArrowLeft, IconBox,
} from '@/components/Icons';

export default function BukuDetail() {
  const { id } = useParams();
  const { add, wish, toggleWish } = useCart();
  const s = useSettings();
  const [b, setB] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [done, setDone] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    supabase.from('books').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      if (data) setB(data); else setMissing(true);
    });
  }, [id]);

  useEffect(() => {
    if (!b?.category) return;
    supabase.from('books').select('*')
      .eq('is_active', true)
      .eq('category', b.category)
      .neq('id', b.id)
      .limit(5)
      .then(({ data }) => setRelated(data || []));
  }, [b?.id, b?.category]);

  if (missing) {
    return (
      <div className="container section">
        <div className="empty-state">
          <div className="icon"><IconBox width={30} height={30} /></div>
          <h3>Buku tidak ditemukan</h3>
          <p className="muted">Mungkin judul ini sudah tidak tersedia.</p>
          <Link href="/katalog" className="btn">Kembali ke katalog</Link>
        </div>
      </div>
    );
  }
  if (!b) return <div className="container section"><p className="muted">Memuat…</p></div>;

  const po = b.status === 'preorder';
  const habis = !po && b.stock <= 0;
  const aktif = hargaAktif(b);
  const diskon = aktif < Number(b.price);
  const wished = wish.includes(b.id);
  const rows = [
    ['Penulis', b.author], ['Penerbit', b.publisher], ['ISBN', b.isbn], ['Kategori', b.category],
    ['Halaman', b.pages], ['Tahun terbit', b.year], ['Bahasa', b.language], ['Berat', b.weight_grams ? `${b.weight_grams} gram` : ''],
    ['Varian', b.format], ['Asal', b.origin === 'impor' ? 'Impor' : 'Lokal'],
    ['Stok', po ? 'Pre-Order' : b.stock], ['Penutupan PO', po && b.preorder_close ? tanggal(b.preorder_close) : ''],
  ].filter(([, v]) => v !== '' && v != null);

  return (
    <div className="container">
      <div className="crumbs">
        <Link href="/">Beranda</Link><span>/</span>
        <Link href="/katalog">Katalog</Link><span>/</span>
        <span>{b.title}</span>
      </div>

      <div className="detail" style={{ paddingBottom: 24 }}>
        <div className="detail-cover-wrap">
          <Cover book={b} />
        </div>

        <div className="detail-info">
          <Badges book={b} />
          <h1>{b.title}</h1>
          <div className="muted" style={{ fontWeight: 700 }}>
            {b.author || 'Penulis tidak diketahui'}{b.publisher ? ` · ${b.publisher}` : ''}
          </div>

          <div className="detail-price">
            {rupiah(aktif)} {diskon && <s>{rupiah(b.price)}</s>}
          </div>
          {diskon && (
            <span className="badge b-disc">
              Hemat {rupiah(Number(b.price) - aktif)}
            </span>
          )}

          <div className="row" style={{ marginTop: 12, gap: 8 }}>
            {po ? (
              <span className="status st-diproses">Pre-Order{b.preorder_close ? ` · tutup ${tanggal(b.preorder_close)}` : ''}</span>
            ) : habis ? (
              <span className="status st-dibatalkan">Stok habis</span>
            ) : (
              <span className="status st-selesai">Ready stock{b.stock <= 3 ? ` · sisa ${b.stock}` : ''}</span>
            )}
            {b.origin === 'impor' && <span className="status st-dikirim">Buku impor</span>}
          </div>

          <div className="detail-actions">
            <div className="qty">
              <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Kurangi jumlah"><IconMinus width={15} height={15} /></button>
              <span>{qty}</span>
              <button
                type="button"
                onClick={() => setQty(po ? qty + 1 : Math.min(b.stock || 1, qty + 1))}
                aria-label="Tambah jumlah"
              >
                <IconPlus width={15} height={15} />
              </button>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={habis}
              onClick={() => { add(b, qty); setDone(true); }}
            >
              <IconCart width={17} height={17} />
              {habis ? 'Stok Habis' : po ? 'Pre-Order Sekarang' : 'Tambah ke Keranjang'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => toggleWish(b.id)}
              aria-pressed={wished}
            >
              <IconHeart width={17} height={17} fill={wished ? 'currentColor' : 'none'} />
              {wished ? 'Di wishlist' : 'Wishlist'}
            </button>
          </div>

          {done && (
            <div className="alert ok">
              Ditambahkan ke keranjang. <Link href="/keranjang">Lihat keranjang →</Link>
            </div>
          )}

          <div className="row" style={{ marginBottom: 8 }}>
            {b.shopee_url && (
              <a className="btn btn-sky btn-sm" href={b.shopee_url} target="_blank" rel="noreferrer">
                Checkout via Shopee
              </a>
            )}
            {s.wa_number && (
              <a
                className="btn btn-ghost btn-sm"
                target="_blank"
                rel="noreferrer"
                href={waLink(s.wa_number, `Halo, saya mau tanya buku "${b.title}"`)}
              >
                <IconWhatsApp width={16} height={16} /> Tanya via WhatsApp
              </a>
            )}
          </div>

          <div className="detail-trust">
            <span className="trust-pill"><IconTruck width={15} height={15} /> Dikirim dari Indonesia</span>
            <span className="trust-pill"><IconCheck width={15} height={15} /> Pesanan bisa dilacak</span>
            <span className="trust-pill"><IconBox width={15} height={15} /> Dikemas aman</span>
          </div>

          {b.synopsis && (
            <>
              <h3 style={{ marginTop: 28 }}>Sinopsis</h3>
              <p className="synopsis">{b.synopsis}</p>
            </>
          )}

          <h3 style={{ marginTop: 24 }}>Detail buku</h3>
          <ul className="info-list">
            {rows.map(([k, v]) => (
              <li key={k}><span>{k}</span><b>{v}</b></li>
            ))}
          </ul>

          <Link href="/katalog" className="section-link" style={{ marginTop: 8 }}>
            <IconArrowLeft width={16} height={16} /> Kembali ke katalog
          </Link>
        </div>
      </div>

      {related.length > 0 && (
        <Reveal as="section" className="section">
          <div className="section-head">
            <div>
              <h2>Kamu mungkin suka</h2>
              <p className="sub">Masih dari kategori {b.category}.</p>
            </div>
          </div>
          <div className="grid grid-books">
            {related.map((r) => <BookCard key={r.id} book={r} />)}
          </div>
        </Reveal>
      )}
    </div>
  );
}
