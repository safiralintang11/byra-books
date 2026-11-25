'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { useI18n } from '@/lib/i18n';
import { rupiah } from '@/lib/format';
import { Cover } from '@/components/BookCard';
import {
  IconCart, IconArrowRight, IconArrowLeft, IconMinus, IconPlus, IconTruck, IconCheck, IconCreditCard,
} from '@/components/Icons';

export default function Keranjang() {
  const { items, setQty, remove, subtotal } = useCart();
  const { t } = useI18n();
  const [note, setNote] = useState('');
  useEffect(() => {
    const n = sessionStorage.getItem('byra_reorder_note');
    if (n) { setNote(n); sessionStorage.removeItem('byra_reorder_note'); }
  }, []);
  const hasPo = items.some((i) => i.status === 'preorder');

  return (
    <div className="container">
      <div className="page-head">
        <span className="eyebrow"><IconCart width={14} height={14} /> {t('cart.eyebrow')}</span>
        <h1 style={{ marginTop: 14 }}>{t('cart.title')}</h1>
        <p>{t('cart.subtitle')}</p>
      </div>

      {note && <div className="alert info">{note}</div>}

      {items.length === 0 ? (
        <div className="empty-state" style={{ marginBottom: 48 }}>
          <div className="icon"><IconCart width={30} height={30} /></div>
          <h3>{t('cart.empty.title')}</h3>
          <p className="muted">{t('cart.empty.body')}</p>
          <Link href="/katalog" className="btn">{t('cart.empty.cta')} <IconArrowRight width={16} height={16} /></Link>
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
                  {i.status === 'preorder' && <span className="badge b-po" style={{ marginTop: 5 }}>{t('badge.preorder')}</span>}
                  <div className="price" style={{ marginTop: 5 }}>{rupiah(i.price)}</div>
                </div>
                <div className="qty">
                  <button type="button" onClick={() => setQty(i.id, i.qty - 1)} aria-label={t('cart.minus')}><IconMinus width={14} height={14} /></button>
                  <span>{i.qty}</span>
                  <button type="button" onClick={() => setQty(i.id, i.qty + 1)} aria-label={t('cart.plus')}><IconPlus width={14} height={14} /></button>
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
                      {t('cart.remove')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <Link href="/katalog" className="section-link" style={{ marginTop: 6 }}>
              <IconArrowLeft width={16} height={16} /> {t('cart.continue')}
            </Link>
          </div>

          <aside className="summary-card">
            <h2>{t('cart.summary')}</h2>
            <div className="summary-row"><span>{t('common.items')}</span><b>{t('cart.itemCount', { count: items.reduce((n, i) => n + i.qty, 0) })}</b></div>
            <div className="summary-row"><span>{t('cart.subtotal')}</span><b>{rupiah(subtotal)}</b></div>
            <div className="summary-row"><span>{t('cart.shipping')}</span><span>{t('cart.shippingNote')}</span></div>
            <div className="summary-total"><span>{t('cart.total')}</span><b>{rupiah(subtotal)}</b></div>
            <Link href="/checkout" className="btn btn-primary btn-block">
              {t('cart.checkout')} <IconArrowRight width={16} height={16} />
            </Link>
            {hasPo && (
              <p className="muted" style={{ fontSize: '.78rem', margin: '12px 0 0' }}>
                {t('cart.poNote')}
              </p>
            )}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed var(--line-strong)', display: 'grid', gap: 8 }}>
              <span className="trust-pill"><IconCreditCard width={15} height={15} /> {t('cart.trustPayment')}</span>
              <span className="trust-pill"><IconTruck width={15} height={15} /> {t('cart.trustShip')}</span>
              <span className="trust-pill"><IconCheck width={15} height={15} /> {t('cart.trustNoFee')}</span>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
