'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSettings } from '@/lib/useSettings';
import { waLink } from '@/lib/format';
import { IconWhatsApp, IconInstagram, IconMapPin, IconBook } from '@/components/Icons';

export default function Footer() {
  const path = usePathname();
  const s = useSettings();
  if (path.startsWith('/byras')) return null;

  const year = new Date().getFullYear();
  const store = s.store_name || 'Byra Books';

  return (
    <>
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo-white.png" alt={store} />
              <p>
                Toko buku baru &amp; impor pilihan. Temukan cerita berikutnya, pesan dengan mudah,
                dan pantau pesananmu kapan saja.
              </p>
              <div className="footer-social">
                {s.instagram_url && (
                  <a href={s.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram">
                    <IconInstagram />
                  </a>
                )}
                {s.wa_number && (
                  <a
                    href={waLink(s.wa_number, 'Halo Byra Books, saya mau tanya soal buku.')}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                  >
                    <IconWhatsApp />
                  </a>
                )}
              </div>
            </div>

            <div className="footer-col">
              <h4>Belanja</h4>
              <Link href="/katalog">Semua buku</Link>
              <Link href="/katalog?status=ready">Ready stock</Link>
              <Link href="/katalog?status=preorder">Pre-order</Link>
              <Link href="/katalog?origin=impor">Buku impor</Link>
              <Link href="/kalkulator">Kalkulator fee</Link>
            </div>

            <div className="footer-col">
              <h4>Bantuan</h4>
              <Link href="/pesanan">Lacak pesanan</Link>
              <Link href="/keranjang">Keranjang</Link>
              <Link href="/wishlist">Wishlist</Link>
              <Link href="/checkout">Cara pemesanan</Link>
            </div>

            <div className="footer-col">
              <h4>Hubungi kami</h4>
              {s.wa_number ? (
                <a href={waLink(s.wa_number, 'Halo Byra Books, saya mau tanya soal buku.')} target="_blank" rel="noreferrer">
                  WhatsApp admin
                </a>
              ) : (
                <span style={{ display: 'block', fontSize: '.88rem', padding: '4px 0' }}>WhatsApp admin</span>
              )}
              {s.shopee_url && <a href={s.shopee_url} target="_blank" rel="noreferrer">Toko Shopee</a>}
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.82rem', padding: '6px 0' }}>
                <IconMapPin width={15} height={15} /> Dikirim dari Indonesia
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.82rem', padding: '6px 0' }}>
                <IconBook width={15} height={15} /> Senin–Sabtu, 09.00–18.00
              </span>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© {year} {store}. Semua hak dilindungi.</span>
            <span>Dibuat dengan ♥ untuk para pembaca.</span>
          </div>
        </div>
      </footer>

      {s.wa_number && (
        <a
          className="wa-float"
          href={waLink(s.wa_number, 'Halo Byra Books, saya mau tanya soal buku.')}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat WhatsApp"
        >
          <IconWhatsApp width={18} height={18} />
          <span>Chat admin</span>
        </a>
      )}
    </>
  );
}
