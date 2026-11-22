'use client';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { rupiah, STATUS, STATUS_PAID, downloadCsv, tanggalJam } from '@/lib/format';

const iso = (d) => d.toISOString().slice(0, 10);

export default function Laporan() {
  const now = new Date();
  const [from, setFrom] = useState(iso(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [to, setTo] = useState(iso(now));
  const [orders, setOrders] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    supabase.from('orders').select('*, order_items(*)')
      .gte('created_at', from + 'T00:00:00')
      .lte('created_at', to + 'T23:59:59')
      .order('created_at', { ascending: false }).limit(5000)
      .then(({ data, error }) => { if (error) setMsg(error.message); setOrders(data || []); });
  }, [from, to]);

  const r = useMemo(() => {
    const paid = orders.filter((o) => STATUS_PAID.includes(o.status));
    const omzet = paid.reduce((s, o) => s + Number(o.total), 0);
    const perStatus = {};
    orders.forEach((o) => (perStatus[o.status] = (perStatus[o.status] || 0) + 1));
    const top = {};
    paid.forEach((o) => o.order_items.forEach((i) => {
      top[i.title] = top[i.title] || { qty: 0, rev: 0 };
      top[i.title].qty += i.qty; top[i.title].rev += i.qty * Number(i.price);
    }));
    return { paid: paid.length, omzet, perStatus, top: Object.entries(top).sort((a, b) => b[1].qty - a[1].qty).slice(0, 15) };
  }, [orders]);

  const exportCsv = () =>
    downloadCsv(`laporan-${from}_${to}.csv`, [
      ['Kode', 'Tanggal', 'Nama', 'WA', 'Status', 'Subtotal', 'Ongkir', 'Total', 'Ekspedisi', 'Resi', 'Item'],
      ...orders.map((o) => [o.code, tanggalJam(o.created_at), o.customer_name, o.phone, STATUS[o.status], o.subtotal, o.shipping_cost, o.total, o.courier, o.tracking_number,
        o.order_items.map((i) => `${i.title} x${i.qty}`).join(' | ')]),
    ]);

  return (
    <>
      <h1>Laporan Penjualan</h1>
      <div className="row" style={{ marginBottom: 12 }}>
        <div><label>Dari</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><label>Sampai</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <button className="btn btn-teal" style={{ alignSelf: 'end' }} onClick={exportCsv}>Export CSV</button>
      </div>
      {msg && <div className="alert">{msg}</div>}
      <div className="grid grid-3">
        <div className="card stat"><b>{orders.length}</b>Total pesanan</div>
        <div className="card stat"><b>{r.paid}</b>Pesanan terbayar</div>
        <div className="card stat"><b>{rupiah(r.omzet)}</b>Omzet (terbayar)</div>
      </div>
      <div className="grid grid-2" style={{ marginTop: 16, alignItems: 'start' }}>
        <div className="card"><h2>Per status</h2>
          <table><tbody>{Object.entries(r.perStatus).map(([k, v]) => <tr key={k}><td>{STATUS[k]}</td><td>{v}</td></tr>)}</tbody></table></div>
        <div className="card"><h2>Buku terlaris</h2>
          <table><thead><tr><th>Judul</th><th>Qty</th><th>Omzet</th></tr></thead>
            <tbody>{r.top.map(([t, v]) => <tr key={t}><td>{t}</td><td>{v.qty}</td><td>{rupiah(v.rev)}</td></tr>)}</tbody></table></div>
      </div>
    </>
  );
}
