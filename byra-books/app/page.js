'use client';
import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/lib/useSettings';
import { useI18n } from '@/lib/i18n';
import { tanggal, waLink } from '@/lib/format';
import { parseHomeLayout } from '@/lib/homeLayout';
import BookCard from '@/components/BookCard';
import Reveal from '@/components/Reveal';
import JoinGroup from '@/components/JoinGroup';
import {
  IconSparkle, IconArrowRight, IconBook, IconBox, IconTruck, IconCalculator,
  IconTag, IconReceipt, IconWhatsApp, IconHeart, IconGift,
} from '@/components/Icons';

function renderAccent(text) {
  return String(text || '')
    .split(/(\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part, i) =>
      part.startsWith('*') && part.endsWith('*') ? (
        <span className="accent" key={i}>{part.slice(1, -1)}</span>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      )
    );
}

function Row({ title, subtitle, href, books }) {
  const { t } = useI18n();
  if (!books.length) return null;
  return (
    <Reveal as="section" className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p className="sub">{subtitle}</p>}
          </div>
          <Link href={href} className="section-link">
            {t('common.viewAll')} <IconArrowRight width={16} height={16} />
          </Link>
        </div>
        <div className="grid grid-books">
          {books.map((b) => <BookCard key={b.id} book={b} />)}
        </div>
      </div>
    </Reveal>
  );
}

export default function Home() {
  const s = useSettings();
  const { t, lang } = useI18n();
  const [events, setEvents] = useState([]);
  const [data, setData] = useState({ baru: [], best: [], ready: [], po: [] });
  const [hasBooks, setHasBooks] = useState(true);

  useEffect(() => {
    (async () => {
      const base = () => supabase.from('books').select('*').eq('is_active', true);
      const [ev, baru, best, ready, po, total] = await Promise.all([
        supabase.from('events').select('*').eq('is_active', true).order('starts_on', { ascending: true }),
        base().eq('is_new', true).order('created_at', { ascending: false }).limit(6),
        base().order('sold_count', { ascending: false }).limit(6),
        base().eq('status', 'ready').gt('stock', 0).order('created_at', { ascending: false }).limit(6),
        base().eq('status', 'preorder').order('created_at', { ascending: false }).limit(6),
        base().limit(1),
      ]);
      setEvents(ev.data || []);
      setData({
        baru: baru.data || [],
        best: (best.data || []).filter((b) => b.sold_count > 0),
        ready: ready.data || [],
        po: po.data || [],
      });
      setHasBooks((total.data || []).length > 0);
    })();
  }, []);

  const store = s.store_name || 'Byra Books';
  const showCalc = s.show_calculator === '1' || s.show_calculator === 'true';
  const announcement = (lang === 'en' ? s.announcement_en : s.announcement_id) || s.announcement || '';
  const layout = parseHomeLayout(s.home_layout).filter((sec) => sec.visible !== false);

  const pickText = (sec, base, fallback) => {
    const custom = lang === 'en' ? sec[`${base}_en`] : sec[`${base}_id`];
    return (custom || fallback || '').replaceAll('{store}', store);
  };

  const categories = [
    { href: '/katalog?origin=lokal', icon: IconBook, title: t('home.cat.local'), sub: t('home.cat.localSub') },
    { href: '/katalog?origin=impor', icon: IconTruck, title: t('home.cat.import'), sub: t('home.cat.importSub') },
    { href: '/katalog?status=ready', icon: IconBox, title: t('home.cat.ready'), sub: t('home.cat.readySub') },
    { href: '/katalog?status=preorder', icon: IconTag, title: t('home.cat.po'), sub: t('home.cat.poSub') },
    ...(showCalc ? [{ href: '/kalkulator', icon: IconCalculator, title: t('home.cat.calc'), sub: t('home.cat.calcSub') }] : []),
  ];

  const marquee = [
    t('home.marquee.new'), t('home.marquee.import'), t('home.marquee.po'),
    t('home.marquee.event'), ...(showCalc ? [t('home.marquee.calc')] : []), t('home.marquee.track'),
  ];

  const emptyState = (
    <Reveal as="section" className="section" key="empty">
      <div className="container">
        <div className="empty-state">
          <div className="icon"><IconBook width={30} height={30} /></div>
          <h3>{t('home.empty.title')}</h3>
          <p className="muted">{t('home.empty.body')}</p>
          <Link href="/katalog" className="btn btn-ghost">{t('home.empty.cta')}</Link>
        </div>
      </div>
    </Reveal>
  );

  const renderSection = (sec) => {
    if (sec.id === 'hero') {
      const title = pickText(sec, 'title', t('home.title'));
      const subtitle = pickText(sec, 'subtitle', t('home.subtitle'));
      return (
        <section className="hero" key="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="eyebrow"><IconSparkle width={14} height={14} /> {t('home.eyebrow')}</span>
              <h1>{renderAccent(title)}</h1>
              <p className="lead">{subtitle}</p>
              <div className="row hero-actions">
                <Link href="/katalog" className="btn btn-primary btn-lg">
                  {t('home.ctaCatalog')} <IconArrowRight width={18} height={18} />
                </Link>
                <Link href="/katalog?status=preorder" className="btn btn-ghost btn-lg">
                  {t('home.ctaPreorder')}
                </Link>
                <JoinGroup size="btn-lg" label={t('nav.joinGroup')} />
              </div>
              <div className="hero-stats">
                <div className="hero-stat"><b>{t('home.statReady')}</b><span>{t('home.statReadySub')}</span></div>
                <div className="hero-stat"><b>{t('home.statPo')}</b><span>{t('home.statPoSub')}</span></div>
                <div className="hero-stat"><b>{t('home.statTrack')}</b><span>{t('home.statTrackSub')}</span></div>
              </div>
            </div>

            <div className="hero-visual" aria-hidden>
              <span className="blob" />
              <div className="book-stage">
                <div className="book3d">
                  <div className="book3d-pages" />
                  <div className="book3d-cover">
                    <span className="book3d-bookmark" />
                    <div className="book3d-face">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/brand/icon.png" alt="" />
                      <div className="book3d-title">byra <em>books</em></div>
                      <div className="book3d-sub">{t('home.bookTagline')}</div>
                    </div>
                  </div>
                </div>
                <div className="book3d-shadow" />
              </div>
              <span className="float-chip f1"><IconBox width={15} height={15} /> {t('home.statReady')}</span>
              <span className="float-chip f2"><IconTag width={15} height={15} /> {t('home.statPo')}</span>
              <span className="float-chip f3"><IconTruck width={15} height={15} /> {t('home.cat.import')}</span>
            </div>
          </div>
        </section>
      );
    }

    if (sec.id === 'marquee') {
      return (
        <div className="marquee" aria-hidden key="marquee">
          <div className="marquee-track">
            {[...marquee, ...marquee].map((item, i) => (
              <span className="marquee-item" key={`${item}-${i}`}>{item}</span>
            ))}
          </div>
        </div>
      );
    }

    if (sec.id === 'categories') {
      return (
        <Reveal as="section" className="section" key="categories">
          <div className="container">
            <div className="cat-grid">
              {categories.map(({ href, icon: Icon, title, sub }) => (
                <Link key={href} href={href} className="cat-card">
                  <span className="cat-icon"><Icon width={21} height={21} /></span>
                  <b>{title}</b>
                  <span>{sub}</span>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      );
    }

    if (sec.id === 'events') {
      if (events.length === 0) return null;
      return (
        <Reveal as="section" className="section" key="events">
          <div className="container">
            <div className="section-head">
              <div>
                <h2>{pickText(sec, 'title', t('home.events.title'))}</h2>
                <p className="sub">{pickText(sec, 'subtitle', t('home.events.subtitle'))}</p>
              </div>
              <Link href="/katalog" className="section-link">
                {t('home.events.all')} <IconArrowRight width={16} height={16} />
              </Link>
            </div>
            <div className="grid grid-2">
              {events.map((e) => (
                <Link key={e.id} href={`/katalog?event=${e.id}`} className="card event-card">
                  <span className="badge b-po">{e.kind}</span>
                  <h3>{e.title}</h3>
                  <div className="muted" style={{ fontSize: '.82rem', fontWeight: 700 }}>
                    {e.starts_on && tanggal(e.starts_on, lang)} {e.ends_on && `– ${tanggal(e.ends_on, lang)}`}
                  </div>
                  <p style={{ margin: '8px 0 0', color: 'var(--steel)', fontSize: '.9rem' }}>{e.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      );
    }

    const rowMap = {
      new: { books: data.baru, href: '/katalog?label=baru', title: t('home.row.new.title'), subtitle: t('home.row.new.sub') },
      best: { books: data.best, href: '/katalog?sort=terlaris', title: t('home.row.best.title'), subtitle: t('home.row.best.sub') },
      ready: { books: data.ready, href: '/katalog?status=ready', title: t('home.row.ready.title'), subtitle: t('home.row.ready.sub') },
      preorder: { books: data.po, href: '/katalog?status=preorder', title: t('home.row.po.title'), subtitle: t('home.row.po.sub') },
    };
    if (rowMap[sec.id]) {
      const row = rowMap[sec.id];
      return (
        <Row
          key={sec.id}
          title={pickText(sec, 'title', row.title)}
          subtitle={pickText(sec, 'subtitle', row.subtitle)}
          href={row.href}
          books={row.books}
        />
      );
    }

    if (sec.id === 'features') {
      return (
        <Reveal as="section" className="section" key="features">
          <div className="container">
            <div className="feature-band">
              <div className="feature">
                <span className="fi"><IconReceipt width={20} height={20} /></span>
                <div><b>{t('home.feat1.title')}</b><span>{t('home.feat1.desc')}</span></div>
              </div>
              <div className="feature">
                <span className="fi"><IconBox width={20} height={20} /></span>
                <div><b>{t('home.feat2.title')}</b><span>{t('home.feat2.desc')}</span></div>
              </div>
              <div className="feature">
                <span className="fi"><IconHeart width={20} height={20} /></span>
                <div><b>{t('home.feat3.title')}</b><span>{t('home.feat3.desc')}</span></div>
              </div>
            </div>
          </div>
        </Reveal>
      );
    }

    if (sec.id === 'cta') {
      return (
        <Reveal as="section" className="section" key="cta">
          <div className="container">
            <div className="cta-band">
              <div>
                <span className="eyebrow" style={{ background: 'rgba(255,255,255,.12)', borderColor: 'rgba(255,255,255,.2)', color: '#fff' }}>
                  <IconGift width={14} height={14} /> {t('home.cta.eyebrow')}
                </span>
                <h2 style={{ marginTop: 14 }}>{pickText(sec, 'title', t('home.cta.title'))}</h2>
                <p>{pickText(sec, 'subtitle', t('home.cta.body'))}</p>
              </div>
              <div className="row">
                {s.wa_number ? (
                  <a
                    className="btn btn-pink btn-lg"
                    href={waLink(s.wa_number, t('wa.general'))}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <IconWhatsApp width={18} height={18} /> {t('home.cta.chat')}
                  </a>
                ) : (
                  <Link className="btn btn-pink btn-lg" href="/katalog">{t('home.cta.shop')}</Link>
                )}
                {showCalc && (
                  <Link className="btn btn-ghost btn-lg" href="/kalkulator">
                    <IconCalculator width={18} height={18} /> {t('home.cta.calc')}
                  </Link>
                )}
                <JoinGroup size="btn-lg" label={t('nav.joinGroup')} />
              </div>
            </div>
          </div>
        </Reveal>
      );
    }

    return null;
  };

  const rendered = [];
  let emptyPlaced = false;
  layout.forEach((sec) => {
    const node = renderSection(sec);
    if (node) rendered.push(node);
    if (!hasBooks && !emptyPlaced && (sec.id === 'categories' || sec.id === 'hero')) {
      rendered.push(emptyState);
      emptyPlaced = true;
    }
  });
  if (!hasBooks && !emptyPlaced) rendered.push(emptyState);

  return (
    <>
      {announcement && <div className="announce">{announcement}</div>}
      {rendered}
    </>
  );
}
