'use client';
import { CartProvider } from '@/lib/cart';

export default function Providers({ children }) {
  return <CartProvider>{children}</CartProvider>;
}
