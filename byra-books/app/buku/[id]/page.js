'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/cart';
import { useSettings } from '@/lib/useSettings';
import { rupiah, hargaAktif, tanggal, waLink } from '@/lib/format';
import { Cover, Badges } from '@/components/BookCard';

export default function BukuDetail() {
  const { id } = useParams();
  const { add, wish, toggleWish } = useCart();
  const s = useSettings();
  const [b, setB] = useState(null);
  const [qty, setQty] = useState(1);
  const [done, setDone] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    supabase.from('books').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      if (data) setB(data); else setMissing(true);
    });
  }, [id]);

  if (missing) return <div className="container section"><p>Buku tidak ditemukan. <Link href="/katalog">Kembali ke katalog</Link></p></div>;
  if (!b) return <div className="container section"><p className="muted">Memuat…</p></div>;

  const po = b.status === 'preorder';
  const habis = !po && b.stock <= 0;
  const aktif = hargaAktif(b);
  const rows = [
    ['Penulis', b.author], ['Penerbit', b.publisher], ['ISBN', b.isbn], ['Kategori', b.category],
    ['Halaman', b.pages], ['Tahun terbit', b.year], ['Bahasa', b.language], ['Berat', b.weight_grams ? `${b.weight_grams} gram` : ''],
    ['Varian', b.format], ['Asal', b.origin === 'impor' ? 'Impor' : 'Lokal'],
    ['Stok', po ? 'Pre-Order' : b.stock], ['Penutupan PO', po && b.preorder_close ? tanggal(b.preorder_close) : ''],
  ].filter(([, v]) => v !== '' && v != null);

  return (
    <div className="container section">
      <p><Link href="/katalog">← Katalog</Link></p>
      <div className="detail">
        <Cover book={b} />
        <div>
          <Badges book={b} />
          <h1>{b.title}</h1>
          <div className="price" style={{ fontSize: '1.5rem' }}>
            {rupiah(aktif)} {aktif < Number(b.price) && <s>{rupiah(b.price)}</s>}
          </div>
          <div className="row" style={{ margin: '12px 0' }}>
            <div className="qty">
              <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(po ? qty + 1 : Math.min(b.stock || 1, qty + 1))}>+</button>
            </div>
            <button className="btn" disabled={habis} onClick={() => { add(b, qty); setDone(true); }}>
              {habis ? 'Stok Habis' : po ? 'Pre-Order Sekarang' : 'Tambah ke Keranjang'}
            </button>
            <button className="btn btn-ghost" onClick={() => toggleWish(b.id)}>{wish.includes(b.id) ? '♥ Di wishlist' : '♡ Wishlist'}</button>
          </div>
          {done && <div className="alert ok">Ditambahkan ke keranjang. <Link href="/keranjang">Lihat keranjang →</Link></div>}
          <div className="row" style={{ marginBottom: 12 }}>
            {b.shopee_url && <a className="btn btn-teal btn-sm" href={b.shopee_url} target="_blank" rel="noreferrer">Checkout via Shopee</a>}
            {s.wa_number && (
              <a className="btn btn-ghost btn-sm" target="_blank" rel="noreferrer"
                href={waLink(s.wa_number, `Halo, saya mau tanya buku "${b.title}"`)}>Tanya via WhatsApp</a>
            )}
          </div>
          {b.synopsis && (<><h3>Sinopsis</h3><p style={{ whiteSpace: 'pre-line' }}>{b.synopsis}</p></>)}
          <table><tbody>{rows.map(([k, v]) => <tr key={k}><th style={{ width: 140 }}>{k}</th><td>{v}</td></tr>)}</tbody></table>
        </div>
      </div>
    </div>
  );
}
