'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/cart';
import { useSettings } from '@/lib/useSettings';
import { rupiah } from '@/lib/format';
import {
  IconArrowLeft, IconCheck, IconCreditCard, IconTruck, IconMapPin, IconWhatsApp,
} from '@/components/Icons';

export default function Checkout() {
  const { items, subtotal, clear, addHistory } = useCart();
  const s = useSettings();
  const router = useRouter();
  const [f, setF] = useState({ customer_name: '', phone: '', email: '', address: '', city: '', courier: 'JNE', notes: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  if (items.length === 0) {
    return (
      <div className="container section">
        <div className="empty-state">
          <h3>Keranjang masih kosong</h3>
          <p className="muted">Tambahkan buku dulu sebelum checkout.</p>
          <Link href="/katalog" className="btn">Belanja dulu</Link>
        </div>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { data, error: err } = await supabase.rpc('create_order', {
      p: { ...f, items: items.map((i) => ({ book_id: i.id, qty: i.qty })) },
    });
    setBusy(false);
    if (err) { setError(err.message); return; }
    addHistory(data.code, f.phone);
    clear();
    router.push(`/pesanan?code=${data.code}&phone=${encodeURIComponent(f.phone)}&baru=1`);
  };

  return (
    <div className="container">
      <div className="page-head">
        <span className="eyebrow"><IconMapPin width={14} height={14} /> Checkout</span>
        <h1 style={{ marginTop: 14 }}>Selesaikan pesananmu</h1>
        <p>Tidak perlu daftar akun. Cukup isi data pengiriman di bawah ini.</p>
      </div>

      <div className="step-pills">
        <span className="step-pill done"><IconCheck width={14} height={14} /> Keranjang</span>
        <span className="step-pill on">2. Data pengiriman</span>
        <span className="step-pill">3. Pembayaran</span>
      </div>

      <div className="checkout-grid" style={{ paddingBottom: 48 }}>
        <form className="card" onSubmit={submit}>
          <h2 style={{ fontSize: '1.2rem' }}>Data penerima</h2>
          <div className="grid grid-2">
            <div className="field">
              <label htmlFor="name">Nama penerima *</label>
              <input id="name" required value={f.customer_name} onChange={(e) => set('customer_name', e.target.value)} placeholder="Nama lengkap" />
            </div>
            <div className="field">
              <label htmlFor="phone">Nomor WhatsApp *</label>
              <input id="phone" required inputMode="tel" placeholder="08xxxxxxxxxx" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="email">Email (opsional)</label>
            <input id="email" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="email@contoh.com" />
          </div>
          <div className="field">
            <label htmlFor="address">Alamat lengkap *</label>
            <textarea id="address" required rows={3} value={f.address} onChange={(e) => set('address', e.target.value)} placeholder="Jalan, nomor rumah, RT/RW, kode pos" />
          </div>
          <div className="grid grid-2">
            <div className="field">
              <label htmlFor="city">Kota / Kecamatan *</label>
              <input id="city" required value={f.city} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="courier">Ekspedisi</label>
              <select id="courier" value={f.courier} onChange={(e) => set('courier', e.target.value)}>
                <option>JNE</option><option>J&amp;T</option><option>Checkout via Shopee</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="notes">Catatan (opsional)</label>
            <textarea id="notes" rows={2} value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Contoh: tolong bubble wrap tambahan" />
          </div>

          {error && <div className="alert">{error}</div>}
          <button className="btn btn-primary btn-block btn-lg" disabled={busy}>
            {busy ? 'Memproses…' : 'Buat Pesanan'}
          </button>
          <p className="muted center" style={{ fontSize: '.78rem', margin: '10px 0 0' }}>
            Ongkir dikonfirmasi admin via WhatsApp setelah pesanan dibuat.
          </p>
        </form>

        <aside className="summary-card">
          <h2>Ringkasan</h2>
          <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
            {items.map((i) => (
              <div key={i.id} className="summary-row" style={{ padding: 0 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                  {i.title} × {i.qty}
                </span>
                <b>{rupiah(i.price * i.qty)}</b>
              </div>
            ))}
          </div>
          <div className="summary-total"><span>Subtotal</span><b>{rupiah(subtotal)}</b></div>

          <div className="pay-info">
            <b style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--navy)', marginBottom: 6 }}>
              <IconCreditCard width={16} height={16} /> Pembayaran
            </b>
            {s.bank_info || 'Info rekening akan dikirim admin via WhatsApp.'}
          </div>
          {s.qris_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.qris_url} alt="QRIS" style={{ maxWidth: 190, borderRadius: 12, marginTop: 10, border: '1px solid var(--line)' }} />
          )}
          <p className="muted" style={{ fontSize: '.78rem', marginTop: 12 }}>
            Setelah pesanan dibuat, unggah bukti transfer di halaman pelacakan pesanan.
          </p>

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed var(--line-strong)', display: 'grid', gap: 8 }}>
            <span className="trust-pill"><IconTruck width={15} height={15} /> Dikirim via {f.courier || 'ekspedisi'}</span>
            <span className="trust-pill"><IconWhatsApp width={15} height={15} /> Update via WhatsApp</span>
          </div>

          <Link href="/keranjang" className="section-link" style={{ marginTop: 16 }}>
            <IconArrowLeft width={16} height={16} /> Kembali ke keranjang
          </Link>
        </aside>
      </div>
    </div>
  );
}
