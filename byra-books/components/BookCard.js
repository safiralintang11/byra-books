'use client';
import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { rupiah, hargaAktif } from '@/lib/format';
import { IconHeart, IconPlus, IconBook } from '@/components/Icons';

export function Cover({ book, className = '' }) {
  return book.cover_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={book.cover_url} alt={book.title} className={`cover ${className}`} loading="lazy" />
  ) : (
    <div className={`cover cover-empty ${className}`} aria-hidden>
      <IconBook width={40} height={40} />
    </div>
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
      {book.is_special && <span className="badge b-sp">Special</span>}
      {book.origin === 'impor' && <span className="badge b-imp">Impor</span>}
    </div>
  );
}

export default function BookCard({ book }) {
  const { add, wish, toggleWish } = useCart();
  const habis = book.status === 'ready' && book.stock <= 0;
  const aktif = hargaAktif(book);
  const diskon = aktif < Number(book.price);
  const wished = wish.includes(book.id);

  return (
    <article className="book-card">
      <Link href={`/buku/${book.id}`} className="book-cover-link" aria-label={book.title}>
        <span className="book-glare" />
        <Cover book={book} />
        <Badges book={book} />
      </Link>

      <button
        type="button"
        className={`heart ${wished ? 'on' : ''}`}
        onClick={() => toggleWish(book.id)}
        aria-label={wished ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
        aria-pressed={wished}
      >
        <IconHeart width={17} height={17} fill={wished ? 'currentColor' : 'none'} />
      </button>

      <div className="book-body">
        <div className="book-author">{book.author || 'Byra Books'}</div>
        <Link href={`/buku/${book.id}`} className="book-title">{book.title}</Link>
        <div className="book-bottom">
          <div className="price">
            {rupiah(aktif)} {diskon && <s>{rupiah(book.price)}</s>}
          </div>
          <button
            type="button"
            className="add-btn"
            disabled={habis}
            onClick={() => add(book, 1)}
            aria-label={habis ? 'Stok habis' : book.status === 'preorder' ? 'Tambah pre-order ke keranjang' : 'Tambah ke keranjang'}
            title={habis ? 'Stok habis' : book.status === 'preorder' ? 'Pre-order' : 'Tambah ke keranjang'}
          >
            <IconPlus width={18} height={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
