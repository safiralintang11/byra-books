'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/cart';
import { useSettings } from '@/lib/useSettings';
import { useI18n } from '@/lib/i18n';
import { rupiah } from '@/lib/format';
import {
  IconArrowLeft, IconCheck, IconCreditCard, IconTruck, IconMapPin, IconWhatsApp,
} from '@/components/Icons';

export default function Checkout() {
  const { items, subtotal, clear, addHistory } = useCart();
  const s = useSettings();
  const { t } = useI18n();
  const router = useRouter();
  const [f, setF] = useState({ customer_name: '', phone: '', email: '', address: '', city: '', courier: 'JNE', notes: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  if (items.length === 0) {
    return (
      <div className="container section">
        <div className="empty-state">
          <h3>{t('checkout.empty.title')}</h3>
          <p className="muted">{t('checkout.empty.body')}</p>
          <Link href="/katalog" className="btn">{t('checkout.empty.cta')}</Link>
        </div>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { data, error: err } = await supabase.rpc('create_order', {
      p: { ...f, items: items.map((i) => ({ book_id: i.id, qty: i.qty })) },
    });
    setBusy(false);
    if (err) { setError(err.message); return; }
    addHistory(data.code, f.phone);
    clear();
    router.push(`/pesanan?code=${data.code}&phone=${encodeURIComponent(f.phone)}&baru=1`);
  };

  return (
    <div className="container">
      <div className="page-head">
        <span className="eyebrow"><IconMapPin width={14} height={14} /> {t('checkout.eyebrow')}</span>
        <h1 style={{ marginTop: 14 }}>{t('checkout.title')}</h1>
        <p>{t('checkout.subtitle')}</p>
      </div>

      <div className="step-pills">
        <span className="step-pill done"><IconCheck width={14} height={14} /> {t('checkout.stepCart')}</span>
        <span className="step-pill on">2. {t('checkout.stepShipping')}</span>
        <span className="step-pill">3. {t('checkout.stepPayment')}</span>
      </div>

      <div className="checkout-grid" style={{ paddingBottom: 48 }}>
        <form className="card" onSubmit={submit}>
          <h2 style={{ fontSize: '1.2rem' }}>{t('checkout.recipient')}</h2>
          <div className="grid grid-2">
            <div className="field">
              <label htmlFor="name">{t('checkout.name')} *</label>
              <input id="name" required value={f.customer_name} onChange={(e) => set('customer_name', e.target.value)} placeholder={t('checkout.namePlaceholder')} />
            </div>
            <div className="field">
              <label htmlFor="phone">{t('checkout.phone')} *</label>
              <input id="phone" required inputMode="tel" placeholder={t('checkout.phonePlaceholder')} value={f.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="email">{t('checkout.email')} ({t('common.optional')})</label>
            <input id="email" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder={t('checkout.emailPlaceholder')} />
          </div>
          <div className="field">
            <label htmlFor="address">{t('checkout.address')} *</label>
            <textarea id="address" required rows={3} value={f.address} onChange={(e) => set('address', e.target.value)} placeholder={t('checkout.addressPlaceholder')} />
          </div>
          <div className="grid grid-2">
            <div className="field">
              <label htmlFor="city">{t('checkout.city')} *</label>
              <input id="city" required value={f.city} onChange={(e) => set('city', e.target.value)} placeholder={t('checkout.cityPlaceholder')} />
            </div>
            <div className="field">
              <label htmlFor="courier">{t('checkout.courier')}</label>
              <select id="courier" value={f.courier} onChange={(e) => set('courier', e.target.value)}>
                <option>JNE</option><option>J&amp;T</option><option>Shopee</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="notes">{t('checkout.notes')} ({t('common.optional')})</label>
            <textarea id="notes" rows={2} value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder={t('checkout.notesPlaceholder')} />
          </div>

          {error && <div className="alert">{error}</div>}
          <button className="btn btn-primary btn-block btn-lg" disabled={busy}>
            {busy ? t('checkout.processing') : t('checkout.create')}
          </button>
          <p className="muted center" style={{ fontSize: '.78rem', margin: '10px 0 0' }}>
            {t('checkout.shippingNote')}
          </p>
        </form>

        <aside className="summary-card">
          <h2>{t('checkout.summary')}</h2>
          <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
            {items.map((i) => (
              <div key={i.id} className="summary-row" style={{ padding: 0 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                  {i.title} × {i.qty}
                </span>
                <b>{rupiah(i.price * i.qty)}</b>
              </div>
            ))}
          </div>
          <div className="summary-total"><span>{t('cart.subtotal')}</span><b>{rupiah(subtotal)}</b></div>

          <div className="pay-info">
            <b style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--navy)', marginBottom: 6 }}>
              <IconCreditCard width={16} height={16} /> {t('checkout.payment')}
            </b>
            {s.bank_info || t('checkout.paymentFallback')}
          </div>
          {s.qris_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.qris_url} alt="QRIS" style={{ maxWidth: 190, borderRadius: 12, marginTop: 10, border: '1px solid var(--line)' }} />
          )}
          <p className="muted" style={{ fontSize: '.78rem', marginTop: 12 }}>
            {t('checkout.uploadNote')}
          </p>

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed var(--line-strong)', display: 'grid', gap: 8 }}>
            <span className="trust-pill"><IconTruck width={15} height={15} /> {t('checkout.trustShip', { courier: f.courier || 'JNE' })}</span>
            <span className="trust-pill"><IconWhatsApp width={15} height={15} /> {t('checkout.trustWa')}</span>
          </div>

          <Link href="/keranjang" className="section-link" style={{ marginTop: 16 }}>
            <IconArrowLeft width={16} height={16} /> {t('checkout.backCart')}
          </Link>
        </aside>
      </div>
    </div>
  );
}
