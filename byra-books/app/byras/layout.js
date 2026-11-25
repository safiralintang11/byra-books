'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { dbError } from '@/lib/format';
import {
  IconHome, IconReceipt, IconBook, IconUpload, IconTag, IconCalculator,
  IconChart, IconSettings, IconMenu, IconLogout, IconArrowRight, IconSparkle, IconLayout,
} from '@/components/Icons';

const withTimeout = (promise, ms) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error('Koneksi ke Supabase timeout. Coba lagi.')), ms)),
]);

const MENU = [
  ['/byras', 'Dashboard', IconHome],
  ['/byras/pesanan', 'Pesanan', IconReceipt],
  ['/byras/buku', 'Buku', IconBook],
  ['/byras/import', 'Import / Export', IconUpload],
  ['/byras/event', 'Event & PO', IconTag],
  ['/byras/kalkulator', 'Kalkulator Fee', IconCalculator],
  ['/byras/tampilan', 'Tampilan', IconLayout],
  ['/byras/laporan', 'Laporan', IconChart],
  ['/byras/pengaturan', 'Pengaturan', IconSettings],
];

export default function AdminLayout({ children }) {
  const path = usePathname();
  const [state, setState] = useState('loading'); // loading | login | denied | error | ok
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(false);

  const check = async () => {
    try {
      const { data: { session } } = await withTimeout(supabase.auth.getSession(), 8000);
      if (!session) { setState('login'); return; }
      const { data, error } = await withTimeout(supabase.rpc('is_admin'), 8000);
      if (error) {
        setErr(dbError(error.message));
        setState('error');
        return;
      }
      setErr('');
      setState(data ? 'ok' : 'denied');
    } catch (e) {
      setErr(dbError(e?.message) || 'Tidak bisa terhubung ke Supabase.');
      setState('error');
    }
  };

  useEffect(() => {
    check();
    // Jangan memanggil Supabase langsung di dalam callback: bisa deadlock.
    const { data: sub } = supabase.auth.onAuthStateChange(() => setTimeout(check, 0));
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line
  }, []);

  useEffect(() => { setOpen(false); }, [path]);

  const login = async (e) => {
    e.preventDefault();
    setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) {
      setErr(/invalid login credentials/i.test(error.message)
        ? 'Email atau password salah, atau akun admin belum dibuat di Supabase Authentication → Users.'
        : error.message);
    }
  };

  if (state === 'loading') {
    return (
      <div className="login-screen">
        <p className="muted">Memuat panel admin…</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="login-screen">
        <div className="login-card" style={{ display: 'block', maxWidth: 480, padding: 32 }}>
          <h1 style={{ fontSize: '1.5rem' }}>Tidak bisa terhubung</h1>
          <div className="alert">{err || 'Gagal menghubungi Supabase.'}</div>
          <p className="muted">
            Pastikan <code>NEXT_PUBLIC_SUPABASE_URL</code> dan <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> ada di
            <code> .env.local</code> di folder utama project, lalu restart <code>npm run dev</code>.
          </p>
          <button className="btn" onClick={() => { setState('loading'); check(); }}>Coba lagi</button>
        </div>
      </div>
    );
  }

  if (state === 'login' || state === 'denied') {
    return (
      <div className="login-screen">
        <div className="login-card">
          <aside className="login-aside">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-white.png" alt="Byra Books" />
            <div>
              <span className="eyebrow" style={{ background: 'rgba(255,255,255,.12)', borderColor: 'rgba(255,255,255,.2)', color: '#fff' }}>
                <IconSparkle width={13} height={13} /> Panel admin
              </span>
              <h2>Kelola toko buku dengan tenang.</h2>
              <p>Buku, stok, pesanan, event, laporan penjualan, dan pengaturan toko — semua di satu tempat.</p>
            </div>
            <small style={{ color: 'rgba(255,255,255,.45)', position: 'relative', zIndex: 1 }}>
              © {new Date().getFullYear()} Byra Books
            </small>
          </aside>

          <div className="login-form">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-navy.png" alt="Byra Books" className="brand-mobile" />
            <h1>{state === 'denied' ? 'Akses ditolak' : 'Masuk ke panel'}</h1>
            <p className="sub">
              {state === 'denied'
                ? 'Akun ini bukan admin. Pastikan emailnya terdaftar di tabel admins.'
                : 'Gunakan akun admin yang sudah terdaftar di Supabase.'}
            </p>

            {state === 'denied' ? (
              <button className="btn btn-primary" onClick={() => supabase.auth.signOut()}>
                Keluar &amp; coba akun lain
              </button>
            ) : (
              <form onSubmit={login}>
                <div className="field">
                  <label htmlFor="admin-email">Email</label>
                  <input id="admin-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@byrabooks.id" />
                </div>
                <div className="field">
                  <label htmlFor="admin-pass">Password</label>
                  <input id="admin-pass" type="password" required value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" />
                </div>
                {err && <div className="alert">{err}</div>}
                <button className="btn btn-primary btn-block btn-lg" style={{ marginTop: 8 }}>
                  Masuk <IconArrowRight width={17} height={17} />
                </button>
              </form>
            )}

            <Link href="/" className="section-link" style={{ marginTop: 20, justifyContent: 'center' }}>
              <IconArrowRight width={15} height={15} style={{ transform: 'rotate(180deg)' }} /> Kembali ke toko
            </Link>

            {state === 'login' && (
              <p className="muted" style={{ fontSize: '.76rem', marginTop: 14, lineHeight: 1.6 }}>
                Belum punya akun admin? Buat di Supabase → Authentication → Users (centang Auto Confirm),
                lalu daftarkan emailnya di tabel <code>admins</code>.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isMenuActive = (href) => (href === '/byras' ? path === '/byras' : path === href || path.startsWith(`${href}/`));
  const active = MENU.filter(([href]) => isMenuActive(href)).sort((a, b) => b[0].length - a[0].length)[0] || MENU[0];

  return (
    <div className="admin-wrap">
      <aside className={`admin-side ${open ? 'open' : ''}`}>
        <div className="admin-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-navy.png" alt="Byra Books" />
          <span className="badge b-imp" style={{ fontSize: '.55rem' }}>Admin</span>
        </div>

        <div className="admin-label">Menu utama</div>
        <nav className="admin-nav">
          {MENU.map(([href, label, Icon]) => (
            <Link key={href} href={href} className={isMenuActive(href) ? 'on' : ''}>
              <Icon width={18} height={18} /> {label}
            </Link>
          ))}
        </nav>

        <div className="admin-foot">
          <Link href="/"><IconArrowRight width={18} height={18} style={{ transform: 'rotate(180deg)' }} /> Lihat toko</Link>
          <a href="#" onClick={(e) => { e.preventDefault(); supabase.auth.signOut(); }}>
            <IconLogout width={18} height={18} /> Keluar
          </a>
        </div>
      </aside>

      <div className={`admin-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      <section className="admin-main">
        <div className="admin-top">
          <div className="row">
            <button type="button" className="icon-btn admin-menu-btn" onClick={() => setOpen(true)} aria-label="Buka menu admin">
              <IconMenu />
            </button>
            <div className="crumbs" style={{ gap: 6 }}>
              <span>Admin</span><span>/</span><b style={{ color: 'var(--navy)' }}>{active[1]}</b>
            </div>
          </div>
          <div className="row">
            <Link href="/" className="btn btn-ghost btn-sm">Lihat toko</Link>
            <button
              type="button"
              className="icon-btn"
              onClick={() => supabase.auth.signOut()}
              aria-label="Keluar"
              title="Keluar"
            >
              <IconLogout width={17} height={17} />
            </button>
          </div>
        </div>
        {children}
      </section>
    </div>
  );
}
