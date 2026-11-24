import Link from 'next/link';
import { Poppins } from 'next/font/google';
import CalcForm from '@/components/CalcForm';
import { IconArrowLeft, IconCalculator, IconTruck, IconCreditCard } from '@/components/Icons';

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '800'] });

export const metadata = {
  title: 'Kalkulator Fee Buku Impor',
  description: 'Hitung total bayar buku impor (USD / GBP ke Rupiah) sudah termasuk ongkir dan fee jastip.',
};

export default function KalkulatorPage() {
  return (
    <div className={`calc-bg ${poppins.className}`}>
      <div className="calc-wrap">
        <CalcForm />

        <div className="calc-help">
          <b style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--navy)', marginBottom: 8 }}>
            <IconCalculator width={17} height={17} /> Cara kerja
          </b>
          <ol>
            <li>Masukkan harga buku dalam mata uang asal.</li>
            <li>Tentukan jumlah dan perkiraan berat per buku.</li>
            <li>Total bayar langsung muncul, sudah termasuk ongkir &amp; fee.</li>
          </ol>
          <p>
            <IconTruck width={15} height={15} /> Ongkir dihitung dari quotation terbaru.
            <br />
            <IconCreditCard width={15} height={15} /> Pembayaran dikonfirmasi admin via WhatsApp.
          </p>
        </div>

        <Link href="/katalog" className="section-link" style={{ justifyContent: 'center', marginTop: 20, width: '100%' }}>
          <IconArrowLeft width={16} height={16} /> Kembali ke katalog
        </Link>
      </div>
    </div>
  );
}
