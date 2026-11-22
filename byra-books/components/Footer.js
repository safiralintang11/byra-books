'use client';
import { usePathname } from 'next/navigation';
import { useSettings } from '@/lib/useSettings';
import { waLink } from '@/lib/format';

export default function Footer() {
  const path = usePathname();
  const s = useSettings();
  if (path.startsWith('/admin')) return null;
  return (
    <>
      <footer className="site-footer">
        <div className="container">
          <b>📚 {s.store_name || 'Byra Books'}</b>
          <p>Buku baru &amp; buku impor. Pesan lewat website, pantau pesananmu kapan saja.</p>
          <p>
            {s.instagram_url && <a href={s.instagram_url} target="_blank" rel="noreferrer">Instagram</a>}
            {s.shopee_url && <> · <a href={s.shopee_url} target="_blank" rel="noreferrer">Shopee</a></>}
          </p>
          <small>© {new Date().getFullYear()} {s.store_name || 'Byra Books'}</small>
        </div>
      </footer>
      {s.wa_number && (
        <a
          className="wa-float"
          href={waLink(s.wa_number, 'Halo Byra Books, saya mau tanya soal buku 📚')}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat WhatsApp"
        >
          💬 Chat
        </a>
      )}
    </>
  );
}
