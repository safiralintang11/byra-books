'use client';
import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { rupiah } from '@/lib/format';
import { Cover } from '@/components/BookCard';
import {
  IconCart, IconArrowRight, IconArrowLeft, IconMinus, IconPlus, IconTruck, IconCheck, IconCreditCard,
} from '@/components/Icons';

export default function Keranjang() {
  const { items, setQty, remove, subtotal } = useCart();
  const hasPo = items.some((i) => i.status === 'preorder');

  return (
    <div className="container">
      <div className="page-head">
        <span className="eyebrow"><IconCart width={14} height={14} /> Keranjang</span>
        <h1 style={{ marginTop: 14 }}>Keranjang belanja</h1>
        <p>Periksa kembali pilihanmu sebelum checkout.</p>
      </div>

      {items.length === 0 ? (
        <div className="empty-state" style={{ marginBottom: 48 }}>
          <div className="icon"><IconCart width={30} height={30} /></div>
          <h3>Keranjangmu masih kosong</h3>
          <p className="muted">Mulai dari rak buku terbaru atau cari judul favoritmu.</p>
          <Link href="/katalog" className="btn">Mulai belanja <IconArrowRight width={16} height={16} /></Link>
        </div>
      ) : (
        <div className="cart-grid" style={{ paddingBottom: 48 }}>
          <div className="cart-list">
            {items.map((i) => (
              <div className="cart-item" key={i.id}>
                <Cover book={i} />
                <div className="cart-item-info">
                  <Link href={`/buku/${i.id}`} className="book-title">{i.title}</Link>
                  <div className="book-author">{i.author}</div>
                  {i.status === 'preorder' && <span className="badge b-po" style={{ marginTop: 5 }}>Pre-Order</span>}
                  <div className="price" style={{ marginTop: 5 }}>{rupiah(i.price)}</div>
                </div>
                <div className="qty">
                  <button type="button" onClick={() => setQty(i.id, i.qty - 1)} aria-label="Kurangi jumlah"><IconMinus width={14} height={14} /></button>
                  <span>{i.qty}</span>
                  <button type="button" onClick={() => setQty(i.id, i.qty + 1)} aria-label="Tambah jumlah"><IconPlus width={14} height={14} /></button>
                </div>
                <div style={{ textAlign: 'right', minWidth: 100 }}>
                  <b style={{ color: 'var(--navy)' }}>{rupiah(i.price * i.qty)}</b>
                  <div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => remove(i.id)}
                      style={{ marginTop: 6, padding: '6px 10px' }}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <Link href="/katalog" className="section-link" style={{ marginTop: 6 }}>
              <IconArrowLeft width={16} height={16} /> Lanjut belanja
            </Link>
          </div>

          <aside className="summary-card">
            <h2>Ringkasan pesanan</h2>
            <div className="summary-row"><span>Jumlah buku</span><b>{items.reduce((n, i) => n + i.qty, 0)} item</b></div>
            <div className="summary-row"><span>Subtotal</span><b>{rupiah(subtotal)}</b></div>
            <div className="summary-row"><span>Ongkir</span><span>dikonfirmasi admin</span></div>
            <div className="summary-total"><span>Total sementara</span><b>{rupiah(subtotal)}</b></div>
            <Link href="/checkout" className="btn btn-primary btn-block">
              Checkout <IconArrowRight width={16} height={16} />
            </Link>
            {hasPo && (
              <p className="muted" style={{ fontSize: '.78rem', margin: '12px 0 0' }}>
                Keranjang berisi pre-order. Estimasi kedatangan akan dikonfirmasi admin via WhatsApp.
              </p>
            )}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed var(--line-strong)', display: 'grid', gap: 8 }}>
              <span className="trust-pill"><IconCreditCard width={15} height={15} /> Transfer bank / QRIS</span>
              <span className="trust-pill"><IconTruck width={15} height={15} /> Dikirim via ekspedisi pilihan</span>
              <span className="trust-pill"><IconCheck width={15} height={15} /> Tanpa biaya tersembunyi</span>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
