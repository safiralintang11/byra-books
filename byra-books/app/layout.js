import './globals.css';
import { Nunito, Fredoka } from 'next/font/google';
import Providers from '@/components/Providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const nunito = Nunito({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-head', display: 'swap' });

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  ),
  title: { default: 'Byra Books | Toko Buku Baru & Impor', template: '%s | Byra Books' },
  description:
    'Byra Books — toko buku online: buku baru, buku impor, pre-order, dan event buku. Pesan mudah, lacak pesanan transparan.',
  applicationName: 'Byra Books',
  keywords: ['toko buku online', 'buku impor', 'buku baru', 'pre-order buku', 'byra books'],
  openGraph: {
    title: 'Byra Books',
    description: 'Toko buku online: buku baru, buku impor, pre-order, dan event buku.',
    type: 'website',
    locale: 'id_ID',
    siteName: 'Byra Books',
    images: [{ url: '/brand/banner.jpg', width: 1600, height: 422, alt: 'Byra Books' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Byra Books',
    description: 'Toko buku online: buku baru, buku impor, pre-order, dan event buku.',
    images: ['/brand/banner.jpg'],
  },
};

export const viewport = {
  themeColor: '#2a4a70',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={`${nunito.variable} ${fredoka.variable}`}>
        <Providers>
          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
        {/* Google Analytics: ganti G-XXXXXXX lalu hapus komentar ini
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX" />
        <script dangerouslySetInnerHTML={{ __html: "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-XXXXXXX');" }} />
        */}
      </body>
    </html>
  );
}
