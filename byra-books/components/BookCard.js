'use client';
import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { rupiah, hargaAktif } from '@/lib/format';

export function Cover({ book, className = '' }) {
  return book.cover_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={book.cover_url} alt={book.title} className={`cover ${className}`} loading="lazy" />
  ) : (
    <div className={`cover cover-empty ${className}`}>📖</div>
  );
}

export function Badges({ book }) {
  return (
    <div className="badges">
      {book.status === 'preorder' && <span className="badge b-po">Pre-Order</span>}
      {book.is_bestseller && <span className="badge b-best">Best Seller</span>}
      {book.discount_price && Number(book.discount_price) < Number(book.price) && (
        <span className="badge b-disc">Diskon</span>
      )}
      {book.is_new && <span className="badge b-new">Baru</span>}
      {book.is_special && <span className="badge b-sp">Special Edition</span>}
      {book.origin === 'impor' && <span className="badge b-imp">Impor</span>}
    </div>
  );
}

export default function BookCard({ book }) {
  const { add, wish, toggleWish } = useCart();
  const habis = book.status === 'ready' && book.stock <= 0;
  const aktif = hargaAktif(book);
  const diskon = aktif < Number(book.price);
  return (
    <div className="card book-card">
      <button
        className={`heart ${wish.includes(book.id) ? 'on' : ''}`}
        onClick={() => toggleWish(book.id)}
        aria-label="Wishlist"
      >
        ♥
      </button>
      <Link href={`/buku/${book.id}`}>
        <Cover book={book} />
      </Link>
      <div className="book-body">
        <Badges book={book} />
        <Link href={`/buku/${book.id}`} className="book-title">{book.title}</Link>
        <div className="muted">{book.author || '-'}</div>
        <div className="price">
          {rupiah(aktif)} {diskon && <s>{rupiah(book.price)}</s>}
        </div>
        <button className="btn btn-block" disabled={habis} onClick={() => add(book, 1)}>
          {habis ? 'Stok Habis' : book.status === 'preorder' ? '+ Pre-Order' : '+ Keranjang'}
        </button>
      </div>
    </div>
  );
}
