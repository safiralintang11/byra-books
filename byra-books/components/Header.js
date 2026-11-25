'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart';
import {
  IconCart, IconHeart, IconMenu, IconX, IconArrowRight, IconWhatsApp,
} from '@/components/Icons';
import { useSettings } from '@/lib/useSettings';
import { useI18n } from '@/lib/i18n';
import { waLink } from '@/lib/format';
import LanguageToggle from '@/components/LanguageToggle';
import JoinGroup from '@/components/JoinGroup';

export default function Header() {
  const path = usePathname();
  const { count, wish } = useCart();
  const s = useSettings();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => { setOpen(false); }, [path]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (path.startsWith('/byras')) return null;

  const showCalc = s.show_calculator === '1' || s.show_calculator === 'true';
  const nav = [
    ['/katalog', t('nav.catalog')],
    ['/katalog?status=ready', t('nav.ready')],
    ['/katalog?status=preorder', t('nav.preorder')],
    ['/tentang', t('nav.about')],
    ...(showCalc ? [['/kalkulator', t('nav.calculator')]] : []),
    ['/pesanan', t('nav.track')],
  ];

  const isActive = (href) => {
    const base = href.split('?')[0];
    if (base === '/katalog') return path === '/katalog' && !href.includes('?');
    return path === base;
  };

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="brand" aria-label="Byra Books">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-navy.png" alt="Byra Books" />
          </Link>

          <nav className="nav" aria-label="Main navigation">
            {nav.map(([href, label]) => (
              <Link key={href} href={href} className={`nav-link ${isActive(href) ? 'active' : ''}`}>
                {label}
              </Link>
            ))}
          </nav>

          <div className="nav-actions">
            <LanguageToggle className="nav-lang" />
            <Link href="/wishlist" className="icon-btn" aria-label={t('nav.wishlist')} title={t('nav.wishlist')}>
              <IconHeart />
              {wish.length > 0 && <span className="dot" key={wish.length}>{wish.length}</span>}
            </Link>
            <Link href="/keranjang" className="cart-btn">
              <IconCart width={18} height={18} />
              <span>{t('nav.cart')}</span>
              {count > 0 && <span className="count" key={count}>{count}</span>}
            </Link>
            <button
              type="button"
              className="icon-btn menu-toggle"
              onClick={() => setOpen(true)}
              aria-label={t('nav.openMenu')}
              aria-expanded={open}
            >
              <IconMenu />
            </button>
          </div>
        </div>
        <span className="scroll-progress" style={{ width: `${progress}%` }} />
      </header>

      <div className={`mobile-drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="scrim" onClick={() => setOpen(false)} />
        <aside className="panel" role="dialog" aria-label={t('nav.menu')}>
          <div className="drawer-head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-navy.png" alt="Byra Books" />
            <div className="row" style={{ gap: 8 }}>
              <LanguageToggle />
              <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label={t('nav.closeMenu')}>
                <IconX />
              </button>
            </div>
          </div>
          <nav className="drawer-nav">
            {nav.map(([href, label]) => (
              <Link key={href} href={href} className={isActive(href) ? 'active' : ''}>{label}</Link>
            ))}
            <Link href="/wishlist" className={path === '/wishlist' ? 'active' : ''}>
              {t('nav.wishlist')} {wish.length > 0 ? `(${wish.length})` : ''}
            </Link>
            <Link href="/keranjang" className={path === '/keranjang' ? 'active' : ''}>
              {t('nav.cart')} {count > 0 ? `(${count})` : ''}
            </Link>
          </nav>
          <div className="drawer-foot">
            <Link href="/katalog" className="btn btn-block">
              {t('home.ctaCatalog')} <IconArrowRight width={17} height={17} />
            </Link>
            <JoinGroup className="btn-block" size="btn-sm" label={t('nav.joinGroup')} />
            {s.wa_number && (
              <a
                href={waLink(s.wa_number, t('wa.general'))}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost btn-block"
                style={{ marginTop: 8 }}
              >
                <IconWhatsApp width={17} height={17} /> {t('nav.chatAdmin')}
              </a>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
