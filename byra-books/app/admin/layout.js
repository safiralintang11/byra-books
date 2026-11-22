'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const MENU = [
  ['/admin', '📊 Dashboard'],
  ['/admin/pesanan', '🧾 Pesanan'],
  ['/admin/buku', '📚 Buku'],
  ['/admin/import', '⬆️ Import / Export'],
  ['/admin/event', '🎉 Event & PO'],
  ['/admin/laporan', '📈 Laporan'],
  ['/admin/pengaturan', '⚙️ Pengaturan'],
];

export default function AdminLayout({ children }) {
  const path = usePathname();
  const [state, setState] = useState('loading'); // loading | login | denied | ok
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');

  const check = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setState('login'); return; }
    const { data } = await supabase.rpc('is_admin');
    setState(data ? 'ok' : 'denied');
  };

  useEffect(() => {
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) setErr(error.message);
  };

  if (state === 'loading') return <div className="container section"><p className="muted">Memuat…</p></div>;

  if (state === 'login' || state === 'denied')
    return (
      <div className="container section" style={{ maxWidth: 420 }}>
        <div className="card">
          <h1>🔐 Admin Byra Books</h1>
          {state === 'denied' && (
            <div className="alert">Akun ini bukan admin. Pastikan emailnya terdaftar di tabel <code>admins</code>.</div>
          )}
          {state === 'denied' ? (
            <button className="btn" onClick={() => supabase.auth.signOut()}>Keluar</button>
          ) : (
            <form onSubmit={login}>
              <div className="field"><label>Email</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="field"><label>Password</label><input type="password" required value={pass} onChange={(e) => setPass(e.target.value)} /></div>
              {err && <div className="alert">{err}</div>}
              <button className="btn btn-block">Masuk</button>
            </form>
          )}
        </div>
      </div>
    );

  return (
    <div className="admin-wrap">
      <aside className="admin-side">
        <div className="logo" style={{ color: '#fff', padding: '4px 12px 14px' }}>📚 Byra Admin</div>
        {MENU.map(([href, label]) => (
          <Link key={href} href={href} className={path === href ? 'on' : ''}>{label}</Link>
        ))}
        <Link href="/">🌐 Lihat toko</Link>
        <a href="#" onClick={(e) => { e.preventDefault(); supabase.auth.signOut(); }}>🚪 Keluar</a>
      </aside>
      <section className="admin-main">{children}</section>
    </div>
  );
}
