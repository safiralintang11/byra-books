'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/cart';
import BookCard from '@/components/BookCard';
import Reveal from '@/components/Reveal';
import { IconHeart, IconArrowRight } from '@/components/Icons';

export default function Wishlist() {
  const { wish, ready } = useCart();
  const [books, setBooks] = useState([]);
  useEffect(() => {
    if (!ready) return;
    if (wish.length === 0) { setBooks([]); return; }
    supabase.from('books').select('*').in('id', wish).eq('is_active', true).then(({ data }) => setBooks(data || []));
  }, [wish, ready]);

  return (
    <div className="container">
      <div className="page-head">
        <span className="eyebrow"><IconHeart width={14} height={14} /> Wishlist</span>
        <h1 style={{ marginTop: 14 }}>Buku yang kamu simpan</h1>
        <p>Kumpulkan judul favorit, lalu pesan kapan saja.</p>
      </div>

      {books.length === 0 ? (
        <div className="empty-state" style={{ marginBottom: 48 }}>
          <div className="icon"><IconHeart width={30} height={30} /></div>
          <h3>Belum ada buku di wishlist</h3>
          <p className="muted">Tekan ikon hati pada buku untuk menyimpannya di sini.</p>
          <Link href="/katalog" className="btn">Jelajahi katalog <IconArrowRight width={16} height={16} /></Link>
        </div>
      ) : (
        <Reveal className="grid grid-books" style={{ paddingBottom: 48 }}>
          {books.map((b) => <BookCard key={b.id} book={b} />)}
        </Reveal>
      )}
    </div>
  );
}
