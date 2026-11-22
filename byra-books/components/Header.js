'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart';

export default function Header() {
  const path = usePathname();
  const { count, wish } = useCart();
  if (path.startsWith('/admin')) return null;
  return (
    <header className="site-header">
      <div className="container header-row">
        <Link href="/" className="logo">📚 Byra <span>Books</span></Link>
        <nav className="nav">
          <Link href="/katalog">Katalog</Link>
          <Link href="/katalog?status=ready">Ready Stock</Link>
          <Link href="/katalog?status=preorder">Pre-Order</Link>
          <Link href="/pesanan">Lacak Pesanan</Link>
          <Link href="/wishlist">♥ {wish.length > 0 ? `(${wish.length})` : ''}</Link>
          <Link href="/keranjang" className="btn btn-sm">🛒 Keranjang{count > 0 ? ` (${count})` : ''}</Link>
        </nav>
      </div>
    </header>
  );
}
