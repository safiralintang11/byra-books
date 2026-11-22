'use client';
import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { rupiah } from '@/lib/format';
import { Cover } from '@/components/BookCard';

export default function Keranjang() {
  const { items, setQty, remove, subtotal } = useCart();
  const hasPo = items.some((i) => i.status === 'preorder');
  return (
    <div className="container section">
      <h1>🛒 Keranjang</h1>
      {items.length === 0 ? (
        <div className="card center">
          <p>Keranjangmu masih kosong.</p>
          <Link href="/katalog" className="btn">Mulai belanja</Link>
        </div>
      ) : (
        <div className="card">
          {items.map((i) => (
            <div className="cart-row" key={i.id}>
              <Cover book={i} />
              <div style={{ flex: 1 }}>
                <Link href={`/buku/${i.id}`}><b>{i.title}</b></Link>
                {i.status === 'preorder' && <span className="badge b-po" style={{ marginLeft: 6 }}>Pre-Order</span>}
                <div className="muted">{i.author}</div>
                <div className="price">{rupiah(i.price)}</div>
              </div>
              <div className="qty">
                <button onClick={() => setQty(i.id, i.qty - 1)}>−</button>
                <span>{i.qty}</span>
                <button onClick={() => setQty(i.id, i.qty + 1)}>+</button>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => remove(i.id)}>Hapus</button>
            </div>
          ))}
          <div className="row between" style={{ marginTop: 16 }}>
            <div>
              <div className="muted">Subtotal (belum termasuk ongkir)</div>
              <b style={{ fontSize: '1.4rem' }}>{rupiah(subtotal)}</b>
            </div>
            <Link href="/checkout" className="btn">Checkout →</Link>
          </div>
          {hasPo && <p className="muted">Keranjang berisi buku Pre-Order; estimasi kedatangan akan dikonfirmasi admin.</p>}
        </div>
      )}
    </div>
  );
}
