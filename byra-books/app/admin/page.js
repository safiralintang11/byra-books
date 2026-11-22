'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { rupiah, tanggalJam, STATUS, STATUS_PAID } from '@/lib/format';

export default function Dashboard() {
  const [d, setD] = useState(null);

  useEffect(() => {
    (async () => {
      const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
      const [menunggu, bulan, low, recent, total] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'menunggu_pembayaran'),
        supabase.from('orders').select('total,status').gte('created_at', start.toISOString()),
        supabase.from('books').select('id,title,stock').eq('status', 'ready').eq('is_active', true).lte('stock', 3).order('stock').limit(10),
        supabase.from('orders').select('code,customer_name,total,status,created_at').order('created_at', { ascending: false }).limit(8),
        supabase.from('books').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);
      const paid = (bulan.data || []).filter((o) => STATUS_PAID.includes(o.status));
      setD({
        menunggu: menunggu.count || 0,
        omzet: paid.reduce((s, o) => s + Number(o.total), 0),
        ordersBulan: (bulan.data || []).length,
        low: low.data || [],
        recent: recent.data || [],
        books: total.count || 0,
      });
    })();
  }, []);

  if (!d) return <p className="muted">Memuat…</p>;
  return (
    <>
      <h1>Dashboard</h1>
      <div className="grid grid-3">
        <div className="card stat"><b>{d.menunggu}</b>Menunggu pembayaran</div>
        <div className="card stat"><b>{d.ordersBulan}</b>Pesanan bulan ini</div>
        <div className="card stat"><b>{rupiah(d.omzet)}</b>Omzet bulan ini</div>
        <div className="card stat"><b>{d.books}</b>Judul aktif</div>
      </div>
      <div className="grid grid-2" style={{ marginTop: 16, alignItems: 'start' }}>
        <div className="card">
          <h2>Pesanan terbaru</h2>
          <div className="table-wrap"><table><tbody>
            {d.recent.map((o) => (
              <tr key={o.code}>
                <td><Link href={`/admin/pesanan?q=${o.code}`}>{o.code}</Link><div className="muted">{tanggalJam(o.created_at)}</div></td>
                <td>{o.customer_name}</td><td>{rupiah(o.total)}</td>
                <td><span className={`status st-${o.status}`}>{STATUS[o.status]}</span></td>
              </tr>
            ))}
          </tbody></table></div>
        </div>
        <div className="card">
          <h2>⚠️ Stok menipis (≤ 3)</h2>
          {d.low.length === 0 ? <p className="muted">Semua stok aman.</p> : (
            <table><tbody>{d.low.map((b) => <tr key={b.id}><td>{b.title}</td><td><b>{b.stock}</b></td></tr>)}</tbody></table>
          )}
        </div>
      </div>
    </>
  );
}
