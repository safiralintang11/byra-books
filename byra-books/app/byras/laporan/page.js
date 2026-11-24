'use client';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { rupiah, STATUS, STATUS_PAID, downloadCsv, tanggalJam, dbError } from '@/lib/format';
import { IconReceipt, IconCheck, IconChart, IconUpload } from '@/components/Icons';

const iso = (d) => d.toISOString().slice(0, 10);

export default function Laporan() {
  const now = new Date();
  const [from, setFrom] = useState(iso(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [to, setTo] = useState(iso(now));
  const [orders, setOrders] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!from || !to) return;
    const start = new Date(`${from}T00:00:00`).toISOString();
    const end = new Date(`${to}T23:59:59.999`).toISOString();
    supabase.from('orders').select('*, order_items(*)')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false }).limit(5000)
      .then(({ data, error }) => { if (error) setMsg(dbError(error.message)); setOrders(data || []); });
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
      <p className="muted">Pantau performa toko dan unduh data pesanan.</p>

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <div><label>Dari</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><label>Sampai</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <button className="btn btn-sky btn-sm" onClick={exportCsv} style={{ marginBottom: 2 }}>
            <IconUpload width={16} height={16} /> Export CSV
          </button>
        </div>
      </div>

      {msg && <div className="alert">{msg}</div>}

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-icon"><IconReceipt width={20} height={20} /></span>
          <div><b>{orders.length}</b><span>Total pesanan</span></div>
        </div>
        <div className="stat-card">
          <span className="stat-icon"><IconCheck width={20} height={20} /></span>
          <div><b>{r.paid}</b><span>Pesanan terbayar</span></div>
        </div>
        <div className="stat-card">
          <span className="stat-icon"><IconChart width={20} height={20} /></span>
          <div><b style={{ fontSize: '1.15rem' }}>{rupiah(r.omzet)}</b><span>Omzet (terbayar)</span></div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 18, alignItems: 'start' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.05rem' }}>Per status</h2>
          <div className="table-wrap">
            <table>
              <tbody>
                {Object.entries(r.perStatus).map(([k, v]) => (
                  <tr key={k}><td>{STATUS[k]}</td><td style={{ textAlign: 'right' }}><b>{v}</b></td></tr>
                ))}
                {Object.keys(r.perStatus).length === 0 && <tr><td className="muted">Belum ada data.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h2 style={{ fontSize: '1.05rem' }}>Buku terlaris</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Judul</th><th>Qty</th><th style={{ textAlign: 'right' }}>Omzet</th></tr></thead>
              <tbody>
                {r.top.map(([t, v]) => (
                  <tr key={t}><td>{t}</td><td>{v.qty}</td><td style={{ textAlign: 'right' }}>{rupiah(v.rev)}</td></tr>
                ))}
                {r.top.length === 0 && <tr><td colSpan={3} className="muted">Belum ada penjualan terbayar.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
