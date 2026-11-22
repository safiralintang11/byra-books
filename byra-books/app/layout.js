import './globals.css';
import { Nunito, Fredoka } from 'next/font/google';
import Providers from '@/components/Providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const nunito = Nunito({ subsets: ['latin'], variable: '--font-body' });
const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-head' });

export const metadata = {
  title: { default: 'Byra Books | Toko Buku Baru & Impor', template: '%s | Byra Books' },
  description:
    'Byra Books - toko buku online: buku baru, buku impor, pre-order, dan event buku. Pesan mudah, lacak pesanan transparan.',
  openGraph: {
    title: 'Byra Books',
    description: 'Toko buku online: buku baru, buku impor, pre-order, dan event buku.',
    type: 'website',
    locale: 'id_ID',
  },
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
