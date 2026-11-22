'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/cart';
import { useSettings } from '@/lib/useSettings';
import { rupiah } from '@/lib/format';

export default function Checkout() {
  const { items, subtotal, clear, addHistory } = useCart();
  const s = useSettings();
  const router = useRouter();
  const [f, setF] = useState({ customer_name: '', phone: '', email: '', address: '', city: '', courier: 'JNE', notes: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  if (items.length === 0)
    return <div className="container section"><p>Keranjang kosong. <Link href="/katalog">Belanja dulu →</Link></p></div>;

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
    <div className="container section">
      <h1>Checkout</h1>
      <p className="muted">Tidak perlu daftar akun. Isi data pengiriman di bawah ini.</p>
      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <form className="card" onSubmit={submit}>
          <div className="field"><label>Nama penerima *</label><input required value={f.customer_name} onChange={(e) => set('customer_name', e.target.value)} /></div>
          <div className="field"><label>Nomor WhatsApp *</label><input required inputMode="tel" placeholder="08xxxxxxxxxx" value={f.phone} onChange={(e) => set('phone', e.target.value)} /></div>
          <div className="field"><label>Email (opsional)</label><input type="email" value={f.email} onChange={(e) => set('email', e.target.value)} /></div>
          <div className="field"><label>Alamat lengkap *</label><textarea required rows={3} value={f.address} onChange={(e) => set('address', e.target.value)} /></div>
          <div className="field"><label>Kota / Kecamatan *</label><input required value={f.city} onChange={(e) => set('city', e.target.value)} /></div>
          <div className="field">
            <label>Ekspedisi</label>
            <select value={f.courier} onChange={(e) => set('courier', e.target.value)}>
              <option>JNE</option><option>J&amp;T</option><option>Checkout via Shopee</option>
            </select>
          </div>
          <div className="field"><label>Catatan (opsional)</label><textarea rows={2} value={f.notes} onChange={(e) => set('notes', e.target.value)} /></div>
          {error && <div className="alert">{error}</div>}
          <button className="btn btn-block" disabled={busy}>{busy ? 'Memproses…' : 'Buat Pesanan'}</button>
        </form>

        <div className="card">
          <h2>Ringkasan</h2>
          {items.map((i) => (
            <div key={i.id} className="row between" style={{ marginBottom: 6 }}>
              <span>{i.title} × {i.qty}</span><b>{rupiah(i.price * i.qty)}</b>
            </div>
          ))}
          <hr />
          <div className="row between"><span>Subtotal</span><b>{rupiah(subtotal)}</b></div>
          <div className="row between"><span>Ongkir</span><span className="muted">dikonfirmasi admin via WhatsApp</span></div>
          <hr />
          <h3>Pembayaran</h3>
          <p style={{ whiteSpace: 'pre-line' }}>{s.bank_info}</p>
          {s.qris_url && <img src={s.qris_url} alt="QRIS" style={{ maxWidth: 220, borderRadius: 12 }} />}
          <p className="muted">Setelah pesanan dibuat, kamu bisa upload bukti transfer di halaman pelacakan pesanan.</p>
        </div>
      </div>
    </div>
  );
}
