'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { IconBook, IconCreditCard, IconInstagram, IconCheck } from '@/components/Icons';

const FIELDS = [
  ['store_name', 'Nama toko', 'text'],
  ['wa_number', 'Nomor WhatsApp admin (format 628xxx)', 'text'],
  ['announcement', 'Pengumuman di beranda', 'text'],
  ['bank_info', 'Info transfer (bank, no. rekening, a.n.)', 'area'],
  ['qris_url', 'URL gambar QRIS', 'text'],
  ['instagram_url', 'Link Instagram', 'text'],
  ['shopee_url', 'Link toko Shopee', 'text'],
];

const GROUPS = [
  { title: 'Informasi toko', icon: IconBook, keys: ['store_name', 'wa_number', 'announcement'] },
  { title: 'Pembayaran', icon: IconCreditCard, keys: ['bank_info', 'qris_url'] },
  { title: 'Sosial & marketplace', icon: IconInstagram, keys: ['instagram_url', 'shopee_url'] },
];

const META = Object.fromEntries(FIELDS.map(([k, l, t]) => [k, { label: l, type: t }]));

export default function Pengaturan() {
  const [v, setV] = useState({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from('settings').select('*').then(({ data }) => {
      const o = {}; (data || []).forEach((r) => (o[r.key] = r.value || '')); setV(o);
    });
  }, []);

  const uploadQris = async (file) => {
    if (!file) return;
    setBusy(true);
    const path = `qris-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await supabase.storage.from('covers').upload(path, file);
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    setV((p) => ({ ...p, qris_url: supabase.storage.from('covers').getPublicUrl(path).data.publicUrl }));
  };

  const save = async () => {
    setBusy(true);
    const rows = FIELDS.map(([key]) => ({ key, value: v[key] || '' }));
    const { error } = await supabase.from('settings').upsert(rows);
    setBusy(false);
    setMsg(error ? error.message : 'Pengaturan tersimpan ✔');
  };

  const renderField = (key) => {
    const { label, type } = META[key];
    return (
      <div className="field" key={key}>
        <label>{label}</label>
        {type === 'area'
          ? <textarea rows={3} value={v[key] || ''} onChange={(e) => setV({ ...v, [key]: e.target.value })} />
          : <input value={v[key] || ''} onChange={(e) => setV({ ...v, [key]: e.target.value })} />}
        {key === 'qris_url' && (
          <>
            <input type="file" accept="image/*" style={{ marginTop: 8 }} onChange={(e) => uploadQris(e.target.files?.[0])} disabled={busy} />
            {v.qris_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.qris_url} alt="QRIS" style={{ maxWidth: 180, marginTop: 8, borderRadius: 12, border: '1px solid var(--line)' }} />
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="row between" style={{ marginBottom: 4 }}>
        <div>
          <h1>Pengaturan Toko</h1>
          <p className="muted" style={{ margin: 0 }}>Informasi ini tampil di toko dan halaman checkout.</p>
        </div>
        <button className="btn" onClick={save} disabled={busy}>
          {busy ? 'Menyimpan…' : <><IconCheck width={17} height={17} /> Simpan</>}
        </button>
      </div>

      {msg && <div className={`alert ${msg.includes('✔') ? 'ok' : ''}`}>{msg}</div>}

      <div className="grid grid-2" style={{ alignItems: 'start', marginTop: 16 }}>
        {GROUPS.map(({ title, icon: Icon, keys }) => (
          <div className="card" key={title}>
            <h2 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="stat-icon" style={{ width: 34, height: 34, borderRadius: 10 }}><Icon width={17} height={17} /></span>
              {title}
            </h2>
            {keys.map(renderField)}
          </div>
        ))}
      </div>
    </>
  );
}
