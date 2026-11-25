'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSettings } from '@/lib/useSettings';
import { useI18n } from '@/lib/i18n';
import { waLink } from '@/lib/format';
import { IconWhatsApp, IconInstagram, IconMapPin, IconBook } from '@/components/Icons';
import JoinGroup from '@/components/JoinGroup';

export default function Footer() {
  const path = usePathname();
  const s = useSettings();
  const { t } = useI18n();
  if (path.startsWith('/byras')) return null;

  const year = new Date().getFullYear();
  const store = s.store_name || 'Byra Books';
  const showCalc = s.show_calculator === '1' || s.show_calculator === 'true';

  return (
    <>
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo-white.png" alt={store} />
              <p>{t('footer.tagline')}</p>
              <div className="footer-social">
                {s.instagram_url && (
                  <a href={s.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram">
                    <IconInstagram />
                  </a>
                )}
                {s.wa_number && (
                  <a
                    href={waLink(s.wa_number, t('wa.general'))}
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
              <h4>{t('footer.shop')}</h4>
              <Link href="/katalog">{t('footer.allBooks')}</Link>
              <Link href="/katalog?status=ready">{t('footer.ready')}</Link>
              <Link href="/katalog?status=preorder">{t('footer.preorder')}</Link>
              <Link href="/katalog?origin=impor">{t('footer.import')}</Link>
              {showCalc && <Link href="/kalkulator">{t('footer.calculator')}</Link>}
            </div>

            <div className="footer-col">
              <h4>{t('footer.help')}</h4>
              <Link href="/pesanan">{t('footer.track')}</Link>
              <Link href="/keranjang">{t('footer.cart')}</Link>
              <Link href="/wishlist">{t('footer.wishlist')}</Link>
              <Link href="/tentang">{t('footer.about')}</Link>
              <Link href="/tentang#order">{t('footer.howToOrder')}</Link>
            </div>

            <div className="footer-col">
              <h4>{t('footer.contact')}</h4>
              {s.wa_number ? (
                <a href={waLink(s.wa_number, t('wa.general'))} target="_blank" rel="noreferrer">
                  {t('footer.wa')}
                </a>
              ) : (
                <span style={{ display: 'block', fontSize: '.88rem', padding: '4px 0' }}>{t('footer.wa')}</span>
              )}
              {s.shopee_url && <a href={s.shopee_url} target="_blank" rel="noreferrer">{t('footer.shopee')}</a>}
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.82rem', padding: '6px 0' }}>
                <IconMapPin width={15} height={15} /> {t('footer.shipsFrom')}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.82rem', padding: '6px 0' }}>
                <IconBook width={15} height={15} /> {t('footer.hours')}
              </span>
              <JoinGroup size="btn-sm" label={t('nav.joinGroup')} />
            </div>
          </div>

          <div className="footer-bottom">
            <span>© {year} {store}. {t('footer.rights')}</span>
            <span>{t('footer.madeWith')}</span>
          </div>
        </div>
      </footer>

      {s.wa_number && (
        <a
          className="wa-float"
          href={waLink(s.wa_number, t('wa.general'))}
          target="_blank"
          rel="noreferrer"
          aria-label={t('nav.chatAdmin')}
        >
          <IconWhatsApp width={18} height={18} />
          <span>{t('nav.chatAdmin')}</span>
        </a>
      )}
    </>
  );
}
