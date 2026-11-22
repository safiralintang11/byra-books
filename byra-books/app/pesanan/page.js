'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/cart';
import { useSettings } from '@/lib/useSettings';
import { rupiah, tanggalJam, STATUS, STATUS_FLOW, waLink } from '@/lib/format';

function Lacak() {
  const sp = useSearchParams();
  const { history } = useCart();
  const s = useSettings();
  const [code, setCode] = useState(sp.get('code') || '');
  const [phone, setPhone] = useState(sp.get('phone') || '');
  const [order, setOrder] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const baru = sp.get('baru');

  const cari = async (c = code, p = phone) => {
    setBusy(true);
    setMsg('');
    const { data, error } = await supabase.rpc('track_order', { p_code: c, p_phone: p });
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    if (!data) { setOrder(null); setMsg('Pesanan tidak ditemukan. Cek kode pesanan & nomor WhatsApp.'); return; }
    setOrder(data);
  };

  useEffect(() => { if (sp.get('code') && sp.get('phone')) cari(sp.get('code'), sp.get('phone')); /* eslint-disable-next-line */ }, []);

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${order.code}-${Date.now()}.${ext}`;
    const up = await supabase.storage.from('proofs').upload(path, file, { upsert: false });
    if (up.error) { setBusy(false); setMsg(up.error.message); return; }
    const url = supabase.storage.from('proofs').getPublicUrl(path).data.publicUrl;
    const { data } = await supabase.rpc('attach_proof', { p_code: order.code, p_phone: phone, p_url: url });
    setBusy(false);
    if (data) { setMsg('Bukti pembayaran terkirim ✔'); cari(); } else setMsg('Gagal menyimpan bukti pembayaran.');
  };

  const idx = order ? STATUS_FLOW.indexOf(order.status) : -1;

  return (
    <div className="container section">
      <h1>🔎 Lacak Pesanan</h1>
      {baru && order && (
        <div className="alert ok">
          Pesanan berhasil dibuat! Simpan kode pesananmu: <b>{order.code}</b>. Lanjutkan pembayaran lalu upload bukti transfer di bawah.
        </div>
      )}
      <div className="card">
        <div className="grid grid-3">
          <div><label>Kode pesanan</label><input placeholder="BYRA-XXXXXX" value={code} onChange={(e) => setCode(e.target.value)} /></div>
          <div><label>Nomor WhatsApp pemesan</label><input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div style={{ alignSelf: 'end' }}><button className="btn btn-block" disabled={busy} onClick={() => cari()}>Cari</button></div>
        </div>
        {history.length > 0 && (
          <p className="muted" style={{ marginTop: 10 }}>
            Riwayat di perangkat ini:{' '}
            {history.map((h) => (
              <button key={h.code} className="chip" style={{ marginRight: 6, cursor: 'pointer' }}
                onClick={() => { setCode(h.code); setPhone(h.phone); cari(h.code, h.phone); }}>{h.code}</button>
            ))}
          </p>
        )}
      </div>
      {msg && <div className={`alert ${msg.includes('✔') ? 'ok' : ''}`}>{msg}</div>}

      {order && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="row between">
            <h2 style={{ margin: 0 }}>{order.code}</h2>
            <span className={`status st-${order.status}`}>{STATUS[order.status]}</span>
          </div>
          <p className="muted">Dipesan {tanggalJam(order.created_at)} · diperbarui {tanggalJam(order.updated_at)}</p>
          {order.status !== 'dibatalkan' && (
            <div className="timeline">
              {STATUS_FLOW.map((st, i) => (
                <div key={st} className={`step ${i < idx ? 'done' : i === idx ? 'now' : ''}`}>{STATUS[st]}</div>
              ))}
            </div>
          )}
          {order.tracking_number && <p>No. resi ({order.courier}): <b>{order.tracking_number}</b></p>}
          <table>
            <thead><tr><th>Buku</th><th>Qty</th><th>Harga</th></tr></thead>
            <tbody>
              {order.items.map((i, k) => (
                <tr key={k}><td>{i.title} {i.is_preorder && <span className="badge b-po">PO</span>}</td><td>{i.qty}</td><td>{rupiah(i.price * i.qty)}</td></tr>
              ))}
              <tr><td colSpan={2}>Subtotal</td><td>{rupiah(order.subtotal)}</td></tr>
              <tr><td colSpan={2}>Ongkir</td><td>{Number(order.shipping_cost) > 0 ? rupiah(order.shipping_cost) : 'menunggu konfirmasi admin'}</td></tr>
              <tr><th colSpan={2}>Total</th><th>{rupiah(order.total)}</th></tr>
            </tbody>
          </table>
          <p><b>Dikirim ke:</b> {order.customer_name}, {order.address}</p>

          {order.status === 'menunggu_pembayaran' && (
            <div style={{ marginTop: 12 }}>
              <h3>Pembayaran</h3>
              <p style={{ whiteSpace: 'pre-line' }}>{s.bank_info}</p>
              {s.qris_url && <img src={s.qris_url} alt="QRIS" style={{ maxWidth: 220, borderRadius: 12 }} />}
              <div className="field" style={{ marginTop: 10 }}>
                <label>Upload bukti transfer</label>
                <input type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0])} />
              </div>
              {order.proof_url && <p className="muted">Bukti sudah diterima, menunggu verifikasi admin. <a href={order.proof_url} target="_blank" rel="noreferrer">Lihat</a></p>}
            </div>
          )}
          {s.wa_number && (
            <a className="btn btn-teal btn-sm" target="_blank" rel="noreferrer"
              href={waLink(s.wa_number, `Halo Byra Books, saya mau konfirmasi pesanan ${order.code} a.n. ${order.customer_name}.`)}>
              Hubungi admin via WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<p className="center muted">Memuat…</p>}><Lacak /></Suspense>;
}
