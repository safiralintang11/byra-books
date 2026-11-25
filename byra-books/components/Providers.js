'use client';
import { CartProvider } from '@/lib/cart';
import { LanguageProvider } from '@/lib/i18n';
import { SettingsProvider } from '@/lib/useSettings';

export default function Providers({ children }) {
  return (
    <SettingsProvider>
      <LanguageProvider>
        <CartProvider>{children}</CartProvider>
      </LanguageProvider>
    </SettingsProvider>
  );
}
