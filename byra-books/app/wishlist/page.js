'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/cart';
import BookCard from '@/components/BookCard';

export default function Wishlist() {
  const { wish, ready } = useCart();
  const [books, setBooks] = useState([]);
  useEffect(() => {
    if (!ready) return;
    if (wish.length === 0) { setBooks([]); return; }
    supabase.from('books').select('*').in('id', wish).eq('is_active', true).then(({ data }) => setBooks(data || []));
  }, [wish, ready]);
  return (
    <div className="container section">
      <h1>♥ Wishlist</h1>
      {books.length === 0 ? (
        <p>Belum ada buku di wishlist. <Link href="/katalog">Jelajahi katalog →</Link></p>
      ) : (
        <div className="grid grid-books">{books.map((b) => <BookCard key={b.id} book={b} />)}</div>
      )}
    </div>
  );
}
