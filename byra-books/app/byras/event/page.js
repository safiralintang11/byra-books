'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { tanggal, dbError } from '@/lib/format';
import { IconPlus, IconTag } from '@/components/Icons';

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
    if (error) { setMsg(dbError(error.message)); return; }
    setEdit(null); setMsg(''); load();
  };
  const hapus = async (ev) => {
    if (!confirm(`Hapus "${ev.title}"?`)) return;
    await supabase.from('events').delete().eq('id', ev.id);
    load();
  };

  return (
    <>
      <div className="row between" style={{ marginBottom: 4 }}>
        <div>
          <h1>Event &amp; PO</h1>
          <p className="muted" style={{ margin: 0 }}>{list.length} event terdaftar.</p>
        </div>
        <button className="btn" onClick={() => setEdit({ ...EMPTY })}>
          <IconPlus width={17} height={17} /> Tambah event
        </button>
      </div>
      <p className="muted">Setelah dibuat, pilih event ini pada tiap buku (menu Buku → Edit) agar muncul di filter event.</p>

      <div className="grid grid-2">
        {list.map((ev) => (
          <div className="card event-card" key={ev.id} style={{ opacity: ev.is_active ? 1 : 0.55 }}>
            <div className="row between">
              <span className="badge b-po">{ev.kind}</span>
              <span className={`status ${ev.is_active ? 'st-selesai' : 'st-dibatalkan'}`}>{ev.is_active ? 'Aktif' : 'Nonaktif'}</span>
            </div>
            <h3>{ev.title}</h3>
            <div className="muted" style={{ fontSize: '.8rem', fontWeight: 700 }}>
              {tanggal(ev.starts_on)} {ev.ends_on && `– ${tanggal(ev.ends_on)}`}
            </div>
            <p style={{ color: 'var(--steel)', fontSize: '.88rem' }}>{ev.description}</p>
            <div className="row" style={{ marginTop: 'auto' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setEdit({ ...EMPTY, ...Object.fromEntries(Object.entries(ev).map(([k, v]) => [k, v ?? ''])) })}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => hapus(ev)}>Hapus</button>
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 34 }}>
            <span className="stat-icon" style={{ margin: '0 auto 12px' }}><IconTag width={20} height={20} /></span>
            <h3 style={{ marginBottom: 4 }}>Belum ada event</h3>
            <p className="muted" style={{ marginBottom: 12 }}>Buat event atau pre-order untuk ditampilkan di beranda.</p>
            <button className="btn btn-sm" onClick={() => setEdit({ ...EMPTY })}>Buat event pertama</button>
          </div>
        )}
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
