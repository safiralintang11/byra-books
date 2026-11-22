'use client';
import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { rupiah, tanggalJam, STATUS, waLink } from '@/lib/format';

function Pesanan() {
  const sp = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState(sp.get('q') || '');
  const [open, setOpen] = useState(null);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    let query = supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(200);
    if (status) query = query.eq('status', status);
    const s = q.replace(/[,()%]/g, ' ').trim();
    if (s) query = query.or(`code.ilike.%${s}%,customer_name.ilike.%${s}%,phone.ilike.%${s}%`);
    const { data, error } = await query;
    if (error) setMsg(error.message);
    setOrders(data || []);
  }, [status, q]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const update = async (o, patch) => {
    const { error } = await supabase.from('orders').update(patch).eq('id', o.id);
    if (error) { setMsg(error.message); return; }
    setMsg('Tersimpan ✔');
    load();
  };

  const waCustomer = (o) =>
    waLink(
      o.phone,
      `Halo kak ${o.customer_name}, update pesanan ${o.code} di Byra Books: status *${STATUS[o.status]}*.` +
        (o.tracking_number ? ` No. resi ${o.courier || ''}: ${o.tracking_number}.` : '') +
        ` Total ${rupiah(o.total)}. Pantau juga di halaman Lacak Pesanan ya 📚`
    );

  return (
    <>
      <h1>Pesanan</h1>
      <div className="row" style={{ marginBottom: 12 }}>
        <input style={{ maxWidth: 280 }} placeholder="🔍 Kode / nama / no. WA" value={q} onChange={(e) => setQ(e.target.value)} />
        <select style={{ maxWidth: 220 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Semua status</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {msg && <div className={`alert ${msg.includes('✔') ? 'ok' : ''}`}>{msg}</div>}
      {orders.map((o) => (
        <div className="card" key={o.id} style={{ marginBottom: 10 }}>
          <div className="row between" style={{ cursor: 'pointer' }} onClick={() => setOpen(open === o.id ? null : o.id)}>
            <div><b>{o.code}</b> · {o.customer_name}<div className="muted">{tanggalJam(o.created_at)}</div></div>
            <div className="row">
              <b>{rupiah(o.total)}</b>
              <span className={`status st-${o.status}`}>{STATUS[o.status]}</span>
              {o.proof_url && <span title="Ada bukti bayar">🧾</span>}
            </div>
          </div>
          {open === o.id && (
            <div style={{ marginTop: 12 }}>
              <p><b>WA:</b> {o.phone} {o.email && `· ${o.email}`}<br /><b>Alamat:</b> {o.address}, {o.city}<br /><b>Ekspedisi:</b> {o.courier}{o.notes && <><br /><b>Catatan:</b> {o.notes}</>}</p>
              <table><tbody>
                {o.order_items.map((i) => <tr key={i.id}><td>{i.title} {i.is_preorder && <span className="badge b-po">PO</span>}</td><td>{i.qty}</td><td>{rupiah(i.price * i.qty)}</td></tr>)}
                <tr><td colSpan={2}>Subtotal</td><td>{rupiah(o.subtotal)}</td></tr>
              </tbody></table>
              {o.proof_url && <p><a href={o.proof_url} target="_blank" rel="noreferrer">Lihat bukti pembayaran</a></p>}
              <div className="grid grid-3" style={{ marginTop: 10 }}>
                <div><label>Status</label>
                  <select value={o.status} onChange={(e) => update(o, { status: e.target.value })}>
                    {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select></div>
                <div><label>Ongkir (Rp)</label>
                  <input type="number" defaultValue={o.shipping_cost}
                    onBlur={(e) => Number(e.target.value) !== Number(o.shipping_cost) &&
                      update(o, { shipping_cost: Number(e.target.value), total: Number(o.subtotal) + Number(e.target.value) })} /></div>
                <div><label>No. resi</label>
                  <input defaultValue={o.tracking_number || ''} onBlur={(e) => e.target.value !== (o.tracking_number || '') && update(o, { tracking_number: e.target.value || null })} /></div>
              </div>
              <div className="field" style={{ marginTop: 10 }}><label>Catatan admin (internal)</label>
                <input defaultValue={o.admin_note || ''} onBlur={(e) => e.target.value !== (o.admin_note || '') && update(o, { admin_note: e.target.value || null })} /></div>
              <a className="btn btn-teal btn-sm" href={waCustomer(o)} target="_blank" rel="noreferrer">Kabari pelanggan via WhatsApp</a>
              <p className="muted">Membatalkan pesanan otomatis mengembalikan stok.</p>
            </div>
          )}
        </div>
      ))}
      {orders.length === 0 && <p className="muted">Belum ada pesanan.</p>}
    </>
  );
}

export default function Page() {
  return <Suspense fallback={<p className="muted">Memuat…</p>}><Pesanan /></Suspense>;
}
