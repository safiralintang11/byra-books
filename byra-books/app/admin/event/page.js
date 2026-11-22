'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { tanggal } from '@/lib/format';

const EMPTY = { title: '', description: '', kind: 'PO', starts_on: '', ends_on: '', banner_url: '', is_active: true };

export default function AdminEvent() {
  const [list, setList] = useState([]);
  const [edit, setEdit] = useState(null);
  const [msg, setMsg] = useState('');
  const load = useCallback(async () => {
    const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false });
    setList(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);
  const set = (k, v) => setEdit((p) => ({ ...p, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    const row = { ...edit };
    ['starts_on', 'ends_on', 'banner_url', 'description'].forEach((k) => { if (row[k] === '') row[k] = null; });
    const id = row.id; delete row.id; delete row.created_at;
    const { error } = id ? await supabase.from('events').update(row).eq('id', id) : await supabase.from('events').insert(row);
    if (error) { setMsg(error.message); return; }
    setEdit(null); setMsg(''); load();
  };
  const hapus = async (ev) => {
    if (!confirm(`Hapus "${ev.title}"?`)) return;
    await supabase.from('events').delete().eq('id', ev.id);
    load();
  };

  return (
    <>
      <div className="row between"><h1>Event &amp; PO</h1><button className="btn" onClick={() => setEdit({ ...EMPTY })}>+ Tambah</button></div>
      <p className="muted">Setelah dibuat, pilih event ini pada tiap buku (menu Buku → Edit) agar muncul di filter event.</p>
      <div className="grid grid-2">
        {list.map((ev) => (
          <div className="card event-card" key={ev.id} style={{ opacity: ev.is_active ? 1 : 0.5 }}>
            <span className="badge b-po">{ev.kind}</span>
            <h3 style={{ margin: '6px 0' }}>{ev.title}</h3>
            <div className="muted">{tanggal(ev.starts_on)} {ev.ends_on && `– ${tanggal(ev.ends_on)}`}</div>
            <p>{ev.description}</p>
            <button className="btn btn-ghost btn-sm" onClick={() => setEdit({ ...EMPTY, ...Object.fromEntries(Object.entries(ev).map(([k, v]) => [k, v ?? ''])) })}>Edit</button>{' '}
            <button className="btn btn-danger btn-sm" onClick={() => hapus(ev)}>Hapus</button>
          </div>
        ))}
      </div>
      {edit && (
        <div className="modal-bg" onClick={() => setEdit(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <h2>{edit.id ? 'Edit' : 'Tambah'} event</h2>
            <div className="field"><label>Judul *</label><input required value={edit.title} onChange={(e) => set('title', e.target.value)} /></div>
            <div className="field"><label>Jenis</label><select value={edit.kind} onChange={(e) => set('kind', e.target.value)}><option>PO</option><option>Event</option></select></div>
            <div className="grid grid-2">
              <div className="field"><label>Mulai</label><input type="date" value={edit.starts_on || ''} onChange={(e) => set('starts_on', e.target.value)} /></div>
              <div className="field"><label>Selesai</label><input type="date" value={edit.ends_on || ''} onChange={(e) => set('ends_on', e.target.value)} /></div>
            </div>
            <div className="field"><label>Deskripsi</label><textarea rows={3} value={edit.description || ''} onChange={(e) => set('description', e.target.value)} /></div>
            <div className="field"><label>URL banner (opsional)</label><input value={edit.banner_url || ''} onChange={(e) => set('banner_url', e.target.value)} /></div>
            <label className="check"><input type="checkbox" checked={edit.is_active} onChange={(e) => set('is_active', e.target.checked)} />Aktif (tampil di beranda)</label>
            {msg && <div className="alert">{msg}</div>}
            <div className="row" style={{ marginTop: 10 }}><button className="btn">Simpan</button><button type="button" className="btn btn-ghost" onClick={() => setEdit(null)}>Batal</button></div>
          </form>
        </div>
      )}
    </>
  );
}
