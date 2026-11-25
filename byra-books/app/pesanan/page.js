'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/cart';
import { useSettings } from '@/lib/useSettings';
import { useI18n } from '@/lib/i18n';
import { rupiah, tanggalJam, STATUS_FLOW, waLink } from '@/lib/format';
import JoinGroup from '@/components/JoinGroup';
import Loading from '@/components/Loading';
import {
  IconSearch, IconTruck, IconMapPin, IconCreditCard, IconWhatsApp, IconCheck, IconCart,
} from '@/components/Icons';

function Lacak() {
  const sp = useSearchParams();
  const router = useRouter();
  const { history, add } = useCart();
  const s = useSettings();
  const { t, lang } = useI18n();
  const [code, setCode] = useState(sp.get('code') || '');
  const [phone, setPhone] = useState(sp.get('phone') || '');
  const [order, setOrder] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [reorderBusy, setReorderBusy] = useState(false);
  const baru = sp.get('baru');

  const cari = async (c = code, p = phone) => {
    setBusy(true);
    setMsg('');
    const { data, error } = await supabase.rpc('track_order', { p_code: c, p_phone: p });
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    if (!data) { setOrder(null); setMsg(t('track.notFound')); return; }
    setOrder(data);
  };

  useEffect(() => {
    if (sp.get('code') && sp.get('phone')) cari(sp.get('code'), sp.get('phone'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${order.code}-${Date.now()}.${ext}`;
    const up = await supabase.storage.from('proofs').upload(path, file, { upsert: false });
    if (up.error) { setBusy(false); setMsg(up.error.message); return; }
    const url = supabase.storage.from('proofs').getPublicUrl(path).data.publicUrl;
    const { data } = await supabase.rpc('attach_proof', { p_code: order.code, p_phone: phone, p_url: url });
    setBusy(false);
    if (data) { setMsg(t('track.proofSent')); cari(); } else setMsg(t('track.proofFailed'));
  };

  const orderAgain = async () => {
    if (!order) return;
    setReorderBusy(true);
    const ids = [...new Set(order.items.map((i) => i.book_id).filter(Boolean))];
    if (ids.length === 0) {
      setReorderBusy(false);
      setMsg(t('track.orderAgainEmpty'));
      return;
    }
    const { data } = await supabase.from('books').select('*').in('id', ids).eq('is_active', true);
    const map = Object.fromEntries((data || []).map((b) => [b.id, b]));
    let added = 0;
    let skipped = 0;
    order.items.forEach((i) => {
      const b = map[i.book_id];
      if (!b) { skipped += 1; return; }
      add(b, i.qty);
      added += 1;
    });
    setReorderBusy(false);
    if (added === 0) {
      setMsg(t('track.orderAgainEmpty'));
      return;
    }
    if (skipped > 0) sessionStorage.setItem('byra_reorder_note', t('track.orderAgainPartial', { count: skipped }));
    router.push('/keranjang');
  };

  const idx = order ? STATUS_FLOW.indexOf(order.status) : -1;

  return (
    <div className="container">
      <div className="page-head">
        <span className="eyebrow"><IconSearch width={14} height={14} /> {t('track.eyebrow')}</span>
        <div className="row between" style={{ alignItems: 'flex-end', gap: 16 }}>
          <div>
            <h1 style={{ marginTop: 14 }}>{t('track.title')}</h1>
            <p>{t('track.subtitle')}</p>
          </div>
          <JoinGroup label={t('track.joinGroup')} />
        </div>
      </div>

      {baru && order && (
        <div className="alert ok">
          {t('track.success', { code: order.code })}
        </div>
      )}

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="track-search">
          <div>
            <label htmlFor="code">{t('track.code')}</label>
            <input id="code" placeholder={t('track.codePlaceholder')} value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div>
            <label htmlFor="phone">{t('track.phone')}</label>
            <input id="phone" placeholder={t('track.phonePlaceholder')} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => cari()}>
            <IconSearch width={17} height={17} /> {busy ? t('track.searching') : t('track.search')}
          </button>
        </div>

        {history.length > 0 && (
          <div className="row" style={{ marginTop: 14 }}>
            <span className="muted" style={{ fontSize: '.8rem', fontWeight: 700 }}>{t('track.history')}</span>
            {history.map((h) => (
              <button
                key={h.code}
                type="button"
                className="chip"
                onClick={() => { setCode(h.code); setPhone(h.phone); cari(h.code, h.phone); }}
              >
                {h.code}
              </button>
            ))}
          </div>
        )}
      </div>

      {msg && <div className={`alert ${msg.includes('✔') || msg === t('track.proofSent') ? 'ok' : ''}`}>{msg}</div>}

      {order && (
        <div className="card order-card" style={{ marginTop: 18 }}>
          <div className="order-head">
            <div>
              <div className="muted" style={{ fontSize: '.78rem', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>{t('track.codeLabel')}</div>
              <h2>{order.code}</h2>
            </div>
            <span className={`status st-${order.status}`}>{t(`status.${order.status}`)}</span>
          </div>
          <p className="muted" style={{ fontSize: '.84rem' }}>
            {t('track.created', { date: tanggalJam(order.created_at, lang) })} · {t('track.updated', { date: tanggalJam(order.updated_at, lang) })}
          </p>

          {order.status !== 'dibatalkan' && (
            <div className="timeline">
              {STATUS_FLOW.map((st, i) => (
                <div key={st} className={`step ${i < idx ? 'done' : i === idx ? 'now' : ''}`}>{t(`status.${st}`)}</div>
              ))}
            </div>
          )}

          {order.tracking_number && (
            <div className="alert info" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconTruck width={17} height={17} />
              {t('track.resi', { courier: order.courier || '' })} <b>{order.tracking_number}</b>
            </div>
          )}

          <div className="table-wrap" style={{ margin: '16px 0' }}>
            <table>
              <thead><tr><th>{t('track.book')}</th><th>{t('track.qty')}</th><th style={{ textAlign: 'right' }}>{t('track.price')}</th></tr></thead>
              <tbody>
                {order.items.map((i, k) => (
                  <tr key={k}>
                    <td>{i.title} {i.is_preorder && <span className="badge b-po">{t('badge.preorder')}</span>}</td>
                    <td>{i.qty}</td>
                    <td style={{ textAlign: 'right' }}>{rupiah(i.price * i.qty)}</td>
                  </tr>
                ))}
                <tr><td colSpan={2}>{t('track.subtotal')}</td><td style={{ textAlign: 'right' }}>{rupiah(order.subtotal)}</td></tr>
                <tr><td colSpan={2}>{t('track.shipping')}</td><td style={{ textAlign: 'right' }}>{Number(order.shipping_cost) > 0 ? rupiah(order.shipping_cost) : t('track.shippingPending')}</td></tr>
                <tr><th colSpan={2}>{t('track.total')}</th><th style={{ textAlign: 'right' }}>{rupiah(order.total)}</th></tr>
              </tbody>
            </table>
          </div>

          <p style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
            <IconMapPin width={17} height={17} style={{ marginTop: 3, flex: 'none' }} />
            <span><b>{t('track.shipTo')}</b> {order.customer_name}, {order.address}</span>
          </p>

          <div className="row" style={{ marginBottom: 12 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={orderAgain} disabled={reorderBusy}>
              <IconCart width={16} height={16} /> {reorderBusy ? t('common.loading') : t('track.orderAgain')}
            </button>
            <span className="muted" style={{ fontSize: '.76rem' }}>{t('track.orderAgainNote')}</span>
          </div>

          {order.status === 'menunggu_pembayaran' && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed var(--line-strong)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconCreditCard width={19} height={19} /> {t('track.payment')}
              </h3>
              <p className="pay-info">{s.bank_info || t('track.paymentFallback')}</p>
              {s.qris_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.qris_url} alt="QRIS" style={{ maxWidth: 210, borderRadius: 12, marginTop: 10, border: '1px solid var(--line)' }} />
              )}
              <div className="field" style={{ marginTop: 14 }}>
                <label htmlFor="proof">{t('track.upload')}</label>
                <input id="proof" type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0])} disabled={busy} />
              </div>
              {order.proof_url && (
                <p className="muted" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <IconCheck width={16} height={16} /> {t('track.proofReceived')}{' '}
                  <a href={order.proof_url} target="_blank" rel="noreferrer">{t('track.view')}</a>
                </p>
              )}
            </div>
          )}

          {s.wa_number && (
            <a
              className="btn btn-sky btn-sm"
              target="_blank"
              rel="noreferrer"
              style={{ marginTop: 14 }}
              href={waLink(s.wa_number, `${t('wa.general')} ${order.code} - ${order.customer_name}.`)}
            >
              <IconWhatsApp width={16} height={16} /> {t('track.contact')}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<Loading style={{ padding: 60 }} />}><Lacak /></Suspense>;
}
