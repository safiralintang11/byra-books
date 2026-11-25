'use client';
import Link from 'next/link';
import { useSettings } from '@/lib/useSettings';
import { useI18n } from '@/lib/i18n';
import { parseAboutSections } from '@/lib/aboutDefaults';
import { waLink } from '@/lib/format';
import JoinGroup from '@/components/JoinGroup';
import { IconWhatsApp, IconInstagram, IconTag, IconArrowRight } from '@/components/Icons';

export default function AboutPage() {
  const s = useSettings();
  const { t, lang } = useI18n();
  const sections = parseAboutSections(s.about_sections).filter((sec) => sec.visible !== false);
  const pick = (sec, base) => (lang === 'en' ? sec[`${base}_en`] : sec[`${base}_id`]) || sec[`${base}_id`] || '';

  return (
    <div className="container">
      <section className="about-hero">
        <div className="about-hero-copy">
          <span className="eyebrow">{t('about.eyebrow')}</span>
          <h1>{t('about.title')}</h1>
          <p>{t('about.subtitle')}</p>
          <div className="row" style={{ marginTop: 18 }}>
            <Link href="/katalog" className="btn btn-primary">
              {t('home.ctaCatalog')} <IconArrowRight width={17} height={17} />
            </Link>
            {s.wa_number && (
              <a className="btn btn-ghost" href={waLink(s.wa_number, t('wa.general'))} target="_blank" rel="noreferrer">
                <IconWhatsApp width={17} height={17} /> {t('about.chat')}
              </a>
            )}
            <JoinGroup label={t('about.joinGroup')} />
          </div>
        </div>
        <div className="about-hero-art" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/icon.png" alt="" />
        </div>
      </section>

      {sections.length === 0 ? (
        <p className="muted" style={{ padding: '20px 0 48px' }}>{t('about.empty')}</p>
      ) : (
        <div className="about-grid">
          {sections.map((sec) => (
            <article className="card about-card" id={sec.id} key={sec.id}>
              <h2>{pick(sec, 'title')}</h2>
              <p className="about-body">{pick(sec, 'body')}</p>
            </article>
          ))}
        </div>
      )}

      <section className="card about-contact" style={{ marginBottom: 48 }}>
        <div>
          <h2>{t('about.contact')}</h2>
          <p className="muted" style={{ marginBottom: 0 }}>{s.store_name || 'Byra Books'}</p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {s.wa_number && (
            <a className="btn btn-sky btn-sm" href={waLink(s.wa_number, t('wa.general'))} target="_blank" rel="noreferrer">
              <IconWhatsApp width={16} height={16} /> {t('about.chat')}
            </a>
          )}
          {s.instagram_url && (
            <a className="btn btn-ghost btn-sm" href={s.instagram_url} target="_blank" rel="noreferrer">
              <IconInstagram width={16} height={16} /> {t('about.instagram')}
            </a>
          )}
          {s.shopee_url && (
            <a className="btn btn-ghost btn-sm" href={s.shopee_url} target="_blank" rel="noreferrer">
              <IconTag width={16} height={16} /> {t('about.shopee')}
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
