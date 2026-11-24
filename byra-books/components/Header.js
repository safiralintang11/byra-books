'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart';
import {
  IconCart, IconHeart, IconMenu, IconX, IconArrowRight, IconWhatsApp,
} from '@/components/Icons';
import { useSettings } from '@/lib/useSettings';
import { waLink } from '@/lib/format';

const NAV = [
  ['/katalog', 'Katalog'],
  ['/katalog?status=ready', 'Ready Stock'],
  ['/katalog?status=preorder', 'Pre-Order'],
  ['/kalkulator', 'Kalkulator Impor'],
  ['/pesanan', 'Lacak Pesanan'],
];

export default function Header() {
  const path = usePathname();
  const { count, wish } = useCart();
  const s = useSettings();
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

  const isActive = (href) => {
    const base = href.split('?')[0];
    if (base === '/katalog') return path === '/katalog' && !href.includes('?');
    return path === base;
  };

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="brand" aria-label="Byra Books — beranda">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-navy.png" alt="Byra Books" />
          </Link>

          <nav className="nav" aria-label="Navigasi utama">
            {NAV.map(([href, label]) => (
              <Link key={href} href={href} className={`nav-link ${isActive(href) ? 'active' : ''}`}>
                {label}
              </Link>
            ))}
          </nav>

          <div className="nav-actions">
            <Link href="/wishlist" className="icon-btn" aria-label="Wishlist" title="Wishlist">
              <IconHeart />
              {wish.length > 0 && <span className="dot" key={wish.length}>{wish.length}</span>}
            </Link>
            <Link href="/keranjang" className="cart-btn">
              <IconCart width={18} height={18} />
              <span>Keranjang</span>
              {count > 0 && <span className="count" key={count}>{count}</span>}
            </Link>
            <button
              type="button"
              className="icon-btn menu-toggle"
              onClick={() => setOpen(true)}
              aria-label="Buka menu"
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
        <aside className="panel" role="dialog" aria-label="Menu navigasi">
          <div className="drawer-head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-navy.png" alt="Byra Books" />
            <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Tutup menu">
              <IconX />
            </button>
          </div>
          <nav className="drawer-nav">
            {NAV.map(([href, label]) => (
              <Link key={href} href={href} className={isActive(href) ? 'active' : ''}>{label}</Link>
            ))}
            <Link href="/wishlist" className={path === '/wishlist' ? 'active' : ''}>
              Wishlist {wish.length > 0 ? `(${wish.length})` : ''}
            </Link>
            <Link href="/keranjang" className={path === '/keranjang' ? 'active' : ''}>
              Keranjang {count > 0 ? `(${count})` : ''}
            </Link>
          </nav>
          <div className="drawer-foot">
            <Link href="/katalog" className="btn btn-block">
              Mulai belanja <IconArrowRight width={17} height={17} />
            </Link>
            {s.wa_number && (
              <a
                href={waLink(s.wa_number, 'Halo Byra Books, saya mau tanya soal buku.')}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost btn-block"
                style={{ marginTop: 8 }}
              >
                <IconWhatsApp width={17} height={17} /> Chat admin
              </a>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
