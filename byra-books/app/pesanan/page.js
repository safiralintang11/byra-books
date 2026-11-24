'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/cart';
import { useSettings } from '@/lib/useSettings';
import { rupiah, tanggalJam, STATUS, STATUS_FLOW, waLink } from '@/lib/format';
import {
  IconSearch, IconReceipt, IconTruck, IconMapPin, IconCreditCard, IconWhatsApp, IconCheck,
} from '@/components/Icons';

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

  useEffect(() => {
    if (sp.get('code') && sp.get('phone')) cari(sp.get('code'), sp.get('phone'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className="container">
      <div className="page-head">
        <span className="eyebrow"><IconSearch width={14} height={14} /> Lacak pesanan</span>
        <h1 style={{ marginTop: 14 }}>Di mana pesananku?</h1>
        <p>Masukkan kode pesanan dan nomor WhatsApp yang kamu pakai saat checkout.</p>
      </div>

      {baru && order && (
        <div className="alert ok">
          Pesanan berhasil dibuat! Simpan kode pesananmu: <b>{order.code}</b>. Lanjutkan pembayaran lalu unggah bukti transfer di bawah.
        </div>
      )}

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="track-search">
          <div>
            <label htmlFor="code">Kode pesanan</label>
            <input id="code" placeholder="BYRA-XXXXXX" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div>
            <label htmlFor="phone">Nomor WhatsApp pemesan</label>
            <input id="phone" placeholder="08xxxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => cari()}>
            <IconSearch width={17} height={17} /> {busy ? 'Mencari…' : 'Cari pesanan'}
          </button>
        </div>

        {history.length > 0 && (
          <div className="row" style={{ marginTop: 14 }}>
            <span className="muted" style={{ fontSize: '.8rem', fontWeight: 700 }}>Riwayat di perangkat ini:</span>
            {history.map((h) => (
              <button
                key={h.code}
                type="button"
                className="chip"
                onClick={() => { setCode(h.code); setPhone(h.phone); cari(h.code, h.phone); }}
              >
                {h.code}
              </button>
            ))}
          </div>
        )}
      </div>

      {msg && <div className={`alert ${msg.includes('✔') ? 'ok' : ''}`}>{msg}</div>}

      {order && (
        <div className="card order-card" style={{ marginTop: 18 }}>
          <div className="order-head">
            <div>
              <div className="muted" style={{ fontSize: '.78rem', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>Kode pesanan</div>
              <h2>{order.code}</h2>
            </div>
            <span className={`status st-${order.status}`}>{STATUS[order.status]}</span>
          </div>
          <p className="muted" style={{ fontSize: '.84rem' }}>
            Dipesan {tanggalJam(order.created_at)} · diperbarui {tanggalJam(order.updated_at)}
          </p>

          {order.status !== 'dibatalkan' && (
            <div className="timeline">
              {STATUS_FLOW.map((st, i) => (
                <div key={st} className={`step ${i < idx ? 'done' : i === idx ? 'now' : ''}`}>{STATUS[st]}</div>
              ))}
            </div>
          )}

          {order.tracking_number && (
            <div className="alert info" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconTruck width={17} height={17} />
              No. resi ({order.courier}): <b>{order.tracking_number}</b>
            </div>
          )}

          <div className="table-wrap" style={{ margin: '16px 0' }}>
            <table>
              <thead><tr><th>Buku</th><th>Qty</th><th style={{ textAlign: 'right' }}>Harga</th></tr></thead>
              <tbody>
                {order.items.map((i, k) => (
                  <tr key={k}>
                    <td>{i.title} {i.is_preorder && <span className="badge b-po">PO</span>}</td>
                    <td>{i.qty}</td>
                    <td style={{ textAlign: 'right' }}>{rupiah(i.price * i.qty)}</td>
                  </tr>
                ))}
                <tr><td colSpan={2}>Subtotal</td><td style={{ textAlign: 'right' }}>{rupiah(order.subtotal)}</td></tr>
                <tr><td colSpan={2}>Ongkir</td><td style={{ textAlign: 'right' }}>{Number(order.shipping_cost) > 0 ? rupiah(order.shipping_cost) : 'menunggu konfirmasi admin'}</td></tr>
                <tr><th colSpan={2}>Total</th><th style={{ textAlign: 'right' }}>{rupiah(order.total)}</th></tr>
              </tbody>
            </table>
          </div>

          <p style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
            <IconMapPin width={17} height={17} style={{ marginTop: 3, flex: 'none' }} />
            <span><b>Dikirim ke:</b> {order.customer_name}, {order.address}</span>
          </p>

          {order.status === 'menunggu_pembayaran' && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed var(--line-strong)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconCreditCard width={19} height={19} /> Pembayaran
              </h3>
              <p className="pay-info">{s.bank_info || 'Hubungi admin untuk informasi pembayaran.'}</p>
              {s.qris_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.qris_url} alt="QRIS" style={{ maxWidth: 210, borderRadius: 12, marginTop: 10, border: '1px solid var(--line)' }} />
              )}
              <div className="field" style={{ marginTop: 14 }}>
                <label htmlFor="proof">Unggah bukti transfer</label>
                <input id="proof" type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0])} disabled={busy} />
              </div>
              {order.proof_url && (
                <p className="muted" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <IconCheck width={16} height={16} /> Bukti sudah diterima, menunggu verifikasi admin.{' '}
                  <a href={order.proof_url} target="_blank" rel="noreferrer">Lihat</a>
                </p>
              )}
            </div>
          )}

          {s.wa_number && (
            <a
              className="btn btn-sky btn-sm"
              target="_blank"
              rel="noreferrer"
              style={{ marginTop: 14 }}
              href={waLink(s.wa_number, `Halo Byra Books, saya mau konfirmasi pesanan ${order.code} a.n. ${order.customer_name}.`)}
            >
              <IconWhatsApp width={16} height={16} /> Hubungi admin via WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<p className="center muted" style={{ padding: 60 }}>Memuat…</p>}><Lacak /></Suspense>;
}
