'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { rupiah, tanggalJam, STATUS, STATUS_PAID } from '@/lib/format';
import {
  IconReceipt, IconBox, IconChart, IconBook, IconArrowRight, IconUpload, IconCalculator, IconTag, IconLayout,
} from '@/components/Icons';

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

  const stats = [
    { icon: IconReceipt, value: d.menunggu, label: 'Menunggu pembayaran' },
    { icon: IconBox, value: d.ordersBulan, label: 'Pesanan bulan ini' },
    { icon: IconChart, value: rupiah(d.omzet), label: 'Omzet bulan ini' },
    { icon: IconBook, value: d.books, label: 'Judul aktif' },
  ];

  return (
    <>
      <h1>Dashboard</h1>
      <p className="muted">Ringkasan toko dan hal yang perlu ditindaklanjuti.</p>

      <div className="stat-grid">
        {stats.map(({ icon: Icon, value, label }, i) => (
          <div className="stat-card" key={label}>
            <span className="stat-icon"><Icon width={20} height={20} /></span>
            <div>
              <b style={{ fontSize: i === 2 ? '1.15rem' : undefined }}>{value}</b>
              <span>{label}</span>
            </div>
            <span className="stat-spark" />
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: '1.05rem' }}>Aksi cepat</h2>
        <div className="quick-grid">
          <Link href="/byras/buku" className="quick-link"><IconBook width={17} height={17} /> Tambah buku</Link>
          <Link href="/byras/import" className="quick-link"><IconUpload width={17} height={17} /> Import Excel</Link>
          <Link href="/byras/pesanan" className="quick-link"><IconReceipt width={17} height={17} /> Proses pesanan</Link>
          <Link href="/byras/kalkulator" className="quick-link"><IconCalculator width={17} height={17} /> Atur kalkulator</Link>
          <Link href="/byras/event" className="quick-link"><IconTag width={17} height={17} /> Buat event</Link>
          <Link href="/byras/tampilan" className="quick-link"><IconLayout width={17} height={17} /> Atur tampilan</Link>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 18, alignItems: 'start' }}>
        <div className="card">
          <div className="row between" style={{ marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Pesanan terbaru</h2>
            <Link href="/byras/pesanan" className="section-link">Semua <IconArrowRight width={15} height={15} /></Link>
          </div>
          <div className="table-wrap">
            <table>
              <tbody>
                {d.recent.map((o) => (
                  <tr key={o.code}>
                    <td>
                      <Link href={`/byras/pesanan?q=${o.code}`} style={{ fontWeight: 800 }}>{o.code}</Link>
                      <div className="muted" style={{ fontSize: '.76rem' }}>{tanggalJam(o.created_at)}</div>
                    </td>
                    <td>{o.customer_name}</td>
                    <td><b>{rupiah(o.total)}</b></td>
                    <td><span className={`status st-${o.status}`}>{STATUS[o.status]}</span></td>
                  </tr>
                ))}
                {d.recent.length === 0 && <tr><td className="muted">Belum ada pesanan.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="row between" style={{ marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Stok menipis (≤ 3)</h2>
            <Link href="/byras/buku" className="section-link">Kelola <IconArrowRight width={15} height={15} /></Link>
          </div>
          {d.low.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>Semua stok aman.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <tbody>
                  {d.low.map((b) => (
                    <tr key={b.id}>
                      <td>{b.title}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`status ${b.stock <= 0 ? 'st-dibatalkan' : 'st-menunggu_pembayaran'}`}>{b.stock}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
