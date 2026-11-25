import { Poppins } from 'next/font/google';
import CalculatorPage from '@/components/CalculatorPage';

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '800'] });

export const metadata = {
  title: 'Kalkulator Fee Buku Impor',
  description: 'Hitung total bayar buku impor (USD / GBP ke Rupiah) sudah termasuk ongkir dan fee jastip.',
};

export default function Page() {
  return <CalculatorPage className={poppins.className} />;
}
