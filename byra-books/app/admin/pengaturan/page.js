'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const FIELDS = [
  ['store_name', 'Nama toko', 'text'],
  ['wa_number', 'Nomor WhatsApp admin (format 628xxx)', 'text'],
  ['announcement', 'Pengumuman di beranda', 'text'],
  ['bank_info', 'Info transfer (bank, no. rekening, a.n.)', 'area'],
  ['qris_url', 'URL gambar QRIS (upload ke bucket covers lalu tempel linknya, atau pakai link lain)', 'text'],
  ['instagram_url', 'Link Instagram', 'text'],
  ['shopee_url', 'Link toko Shopee', 'text'],
];

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
    const rows = FIELDS.map(([key]) => ({ key, value: v[key] || '' }));
    const { error } = await supabase.from('settings').upsert(rows);
    setMsg(error ? error.message : 'Pengaturan tersimpan ✔');
  };

  return (
    <>
      <h1>Pengaturan Toko</h1>
      <div className="card" style={{ maxWidth: 640 }}>
        {FIELDS.map(([k, l, t]) => (
          <div className="field" key={k}>
            <label>{l}</label>
            {t === 'area'
              ? <textarea rows={3} value={v[k] || ''} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
              : <input value={v[k] || ''} onChange={(e) => setV({ ...v, [k]: e.target.value })} />}
            {k === 'qris_url' && (<><input type="file" accept="image/*" style={{ marginTop: 6 }} onChange={(e) => uploadQris(e.target.files?.[0])} disabled={busy} />
              {v.qris_url && <img src={v.qris_url} alt="QRIS" style={{ maxWidth: 180, marginTop: 6 }} />}</>)}
          </div>
        ))}
        {msg && <div className={`alert ${msg.includes('✔') ? 'ok' : ''}`}>{msg}</div>}
        <button className="btn" onClick={save}>Simpan</button>
      </div>
    </>
  );
}
