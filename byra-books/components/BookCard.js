'use client';
import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { useI18n } from '@/lib/i18n';
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
  const { t } = useI18n();
  return (
    <div className="badges">
      {book.status === 'preorder' && <span className="badge b-po">{t('badge.preorder')}</span>}
      {book.is_bestseller && <span className="badge b-best">{t('badge.best')}</span>}
      {book.discount_price && Number(book.discount_price) < Number(book.price) && (
        <span className="badge b-disc">{t('badge.discount')}</span>
      )}
      {book.is_new && <span className="badge b-new">{t('badge.new')}</span>}
      {book.is_special && <span className="badge b-sp">{t('badge.special')}</span>}
      {book.origin === 'impor' && <span className="badge b-imp">{t('badge.import')}</span>}
    </div>
  );
}

export default function BookCard({ book }) {
  const { add, wish, toggleWish } = useCart();
  const { t } = useI18n();
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
        aria-label={wished ? t('book.wishlistRemove') : t('book.wishlistAdd')}
        aria-pressed={wished}
      >
        <IconHeart width={17} height={17} fill={wished ? 'currentColor' : 'none'} />
      </button>

      <div className="book-body">
        <div className="book-author">{book.author || t('book.unknownAuthor')}</div>
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
            aria-label={habis ? t('book.out') : book.status === 'preorder' ? t('book.preorder') : t('book.add')}
            title={habis ? t('book.out') : book.status === 'preorder' ? t('book.preorder') : t('book.add')}
          >
            <IconPlus width={18} height={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
