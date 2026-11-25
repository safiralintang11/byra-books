'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/cart';
import { useSettings } from '@/lib/useSettings';
import { useI18n } from '@/lib/i18n';
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
  const { t, lang } = useI18n();
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
          <h3>{t('detail.notFound')}</h3>
          <p className="muted">{t('detail.notFoundBody')}</p>
          <Link href="/katalog" className="btn">{t('detail.back')}</Link>
        </div>
      </div>
    );
  }
  if (!b) return <div className="container section"><p className="muted">{t('common.loading')}</p></div>;

  const po = b.status === 'preorder';
  const habis = !po && b.stock <= 0;
  const aktif = hargaAktif(b);
  const diskon = aktif < Number(b.price);
  const wished = wish.includes(b.id);
  const rows = [
    [t('detail.author'), b.author],
    [t('detail.publisher'), b.publisher],
    [t('detail.isbn'), b.isbn],
    [t('detail.category'), b.category],
    [t('detail.pages'), b.pages],
    [t('detail.year'), b.year],
    [t('detail.language'), b.language],
    [t('detail.weight'), b.weight_grams ? t('detail.gram', { n: b.weight_grams }) : ''],
    [t('detail.format'), b.format],
    [t('detail.origin'), b.origin === 'impor' ? t('detail.originImport') : t('detail.originLocal')],
    [t('detail.stock'), po ? t('detail.preorder') : b.stock],
    [t('detail.poClose'), po && b.preorder_close ? tanggal(b.preorder_close, lang) : ''],
  ].filter(([, v]) => v !== '' && v != null);

  return (
    <div className="container">
      <div className="crumbs">
        <Link href="/">{t('detail.home')}</Link><span>/</span>
        <Link href="/katalog">{t('detail.catalog')}</Link><span>/</span>
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
            {b.author || t('detail.authorUnknown')}{b.publisher ? ` · ${b.publisher}` : ''}
          </div>

          <div className="detail-price">
            {rupiah(aktif)} {diskon && <s>{rupiah(b.price)}</s>}
          </div>
          {diskon && (
            <span className="badge b-disc">
              {t('detail.save', { amount: rupiah(Number(b.price) - aktif) })}
            </span>
          )}

          <div className="row" style={{ marginTop: 12, gap: 8 }}>
            {po ? (
              <span className="status st-diproses">
                {b.preorder_close ? t('detail.poUntil', { date: tanggal(b.preorder_close, lang) }) : t('detail.preorder')}
              </span>
            ) : habis ? (
              <span className="status st-dibatalkan">{t('detail.stockOut')}</span>
            ) : (
              <span className="status st-selesai">
                {b.stock <= 3 ? t('detail.stockLeft', { count: b.stock }) : t('detail.stockReady')}
              </span>
            )}
            {b.origin === 'impor' && <span className="status st-dikirim">{t('detail.importBook')}</span>}
          </div>

          <div className="detail-actions">
            <div className="qty">
              <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} aria-label={t('cart.minus')}><IconMinus width={15} height={15} /></button>
              <span>{qty}</span>
              <button
                type="button"
                onClick={() => setQty(po ? qty + 1 : Math.min(b.stock || 1, qty + 1))}
                aria-label={t('cart.plus')}
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
              {habis ? t('detail.outBtn') : po ? t('detail.preorder') : t('detail.addCart')}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => toggleWish(b.id)}
              aria-pressed={wished}
            >
              <IconHeart width={17} height={17} fill={wished ? 'currentColor' : 'none'} />
              {wished ? t('detail.inWishlist') : t('detail.wishlist')}
            </button>
          </div>

          {done && (
            <div className="alert ok">
              {t('detail.added')} <Link href="/keranjang">{t('detail.viewCart')} →</Link>
            </div>
          )}

          <div className="row" style={{ marginBottom: 8 }}>
            {b.shopee_url && (
              <a className="btn btn-sky btn-sm" href={b.shopee_url} target="_blank" rel="noreferrer">
                {t('detail.shopee')}
              </a>
            )}
            {s.wa_number && (
              <a
                className="btn btn-ghost btn-sm"
                target="_blank"
                rel="noreferrer"
                href={waLink(s.wa_number, `${t('wa.general')} "${b.title}"`)}
              >
                <IconWhatsApp width={16} height={16} /> {t('detail.askWa')}
              </a>
            )}
          </div>

          <div className="detail-trust">
            <span className="trust-pill"><IconTruck width={15} height={15} /> {t('detail.trustShip')}</span>
            <span className="trust-pill"><IconCheck width={15} height={15} /> {t('detail.trustTrack')}</span>
            <span className="trust-pill"><IconBox width={15} height={15} /> {t('detail.trustPack')}</span>
          </div>

          {b.synopsis && (
            <>
              <h3 style={{ marginTop: 28 }}>{t('detail.synopsis')}</h3>
              <p className="synopsis">{b.synopsis}</p>
            </>
          )}

          <h3 style={{ marginTop: 24 }}>{t('detail.info')}</h3>
          <ul className="info-list">
            {rows.map(([k, v]) => (
              <li key={k}><span>{k}</span><b>{v}</b></li>
            ))}
          </ul>

          <Link href="/katalog" className="section-link" style={{ marginTop: 8 }}>
            <IconArrowLeft width={16} height={16} /> {t('detail.backCatalog')}
          </Link>
        </div>
      </div>

      {related.length > 0 && (
        <Reveal as="section" className="section">
          <div className="section-head">
            <div>
              <h2>{t('detail.related')}</h2>
              <p className="sub">{t('detail.relatedSub', { category: b.category })}</p>
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
