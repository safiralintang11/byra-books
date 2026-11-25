'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { rupiah, hargaAktif, dbError } from '@/lib/format';
import {
  IconPlus, IconUpload, IconCheck, IconArrowLeft, IconReceipt,
} from '@/components/Icons';

async function loadXlsx() {
  const mod = await import('xlsx');
  return mod.default && mod.default.read ? mod.default : mod;
}

const STATUS_KEYS = ['menunggu_pembayaran', 'dibayar', 'diproses', 'dikirim', 'selesai', 'dibatalkan'];
const STATUS_LABEL = {
  menunggu_pembayaran: 'Menunggu Pembayaran',
  dibayar: 'Pembayaran Diterima',
  diproses: 'Sedang Diproses',
  dikirim: 'Dikirim',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
};
const STATUS_ALIAS = {
  'menunggu pembayaran': 'menunggu_pembayaran',
  'pembayaran diterima': 'dibayar',
  'sedang diproses': 'diproses',
  'dikirim': 'dikirim',
  'selesai': 'selesai',
  'dibatalkan': 'dibatalkan',
  'completed': 'selesai',
  'shipped': 'dikirim',
  'processing': 'diproses',
  'paid': 'dibayar',
  'cancelled': 'dibatalkan',
  'canceled': 'dibatalkan',
  'pending': 'menunggu_pembayaran',
};

const randomCode = () => 'BYRA-' + Math.random().toString(36).slice(2, 8).toUpperCase();
const normIsbn = (v) => String(v || '').replace(/[^0-9Xx]/g, '').toUpperCase();
const normalizeStatus = (v) => {
  const raw = String(v || '').trim().toLowerCase();
  if (STATUS_KEYS.includes(raw)) return raw;
  return STATUS_ALIAS[raw] || 'selesai';
};

function newItem() {
  return { key: `${Date.now()}-${Math.random()}`, book_id: '', title: '', price: '', qty: 1 };
}

async function insertOrder(o) {
  const items = o.items.map((i) => ({
    book_id: i.book_id || null,
    title: String(i.title || '').trim(),
    price: Number(i.price) || 0,
    qty: Math.max(1, Number(i.qty) || 1),
    is_preorder: !!i.is_preorder,
  }));
  if (items.length === 0) throw new Error('Pesanan tidak punya item.');
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const shipping = Number(o.shipping_cost) || 0;
  const payload = {
    code: (o.code || '').trim().toUpperCase() || randomCode(),
    customer_name: String(o.customer_name || '').trim(),
    phone: String(o.phone || '').trim(),
    email: o.email ? String(o.email).trim() : null,
    address: String(o.address || '').trim(),
    city: o.city ? String(o.city).trim() : null,
    courier: o.courier ? String(o.courier).trim() : null,
    notes: o.notes ? String(o.notes).trim() : null,
    status: normalizeStatus(o.status),
    shipping_cost: shipping,
    subtotal,
    total: subtotal + shipping,
    tracking_number: o.tracking_number ? String(o.tracking_number).trim() : null,
    admin_note: o.admin_note ? String(o.admin_note).trim() : null,
  };
  if (o.created_at) {
    const d = new Date(o.created_at);
    if (!Number.isNaN(d.getTime())) payload.created_at = d.toISOString();
  }
  const { data, error } = await supabase.from('orders').insert(payload).select('id,code').single();
  if (error) throw error;
  const rows = items.map((i) => ({ ...i, order_id: data.id }));
  const { error: itemErr } = await supabase.from('order_items').insert(rows);
  if (itemErr) {
    await supabase.from('orders').delete().eq('id', data.id);
    throw itemErr;
  }
  return data;
}

export default function ImportOrders() {
  const [tab, setTab] = useState('manual');
  const [books, setBooks] = useState([]);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    code: '', customer_name: '', phone: '', email: '', address: '', city: '',
    courier: 'JNE', status: 'selesai', shipping_cost: '0', tracking_number: '',
    admin_note: '', created_at: '',
    items: [newItem()],
  });

  const [fileName, setFileName] = useState('');
  const [fileOrders, setFileOrders] = useState(null);
  const [fileMsg, setFileMsg] = useState('');

  useEffect(() => {
    supabase.from('books').select('id,title,isbn,price,discount_price,status,stock').order('title').limit(3000)
      .then(({ data }) => setBooks(data || []));
  }, []);

  const bookMap = useMemo(() => {
    const byId = Object.fromEntries(books.map((b) => [b.id, b]));
    const byIsbn = {};
    books.forEach((b) => { if (b.isbn) byIsbn[normIsbn(b.isbn)] = b; });
    return { byId, byIsbn };
  }, [books]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setItem = (index, key, value) => {
    setForm((p) => ({
      ...p,
      items: p.items.map((it, i) => (i === index ? { ...it, [key]: value } : it)),
    }));
  };

  const pickBook = (index, id) => {
    const b = bookMap.byId[id];
    setForm((p) => ({
      ...p,
      items: p.items.map((it, i) => {
        if (i !== index) return it;
        if (!b) return { ...it, book_id: id };
        return {
          ...it,
          book_id: b.id,
          title: b.title,
          price: String(hargaAktif(b)),
          is_preorder: b.status === 'preorder',
        };
      }),
    }));
  };

  const subtotal = form.items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);
  const total = subtotal + (Number(form.shipping_cost) || 0);

  const saveManual = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    const items = form.items.filter((i) => i.title && Number(i.qty) > 0);
    if (items.length === 0) { setMsg({ type: 'err', text: 'Tambahkan minimal satu item buku.' }); return; }
    if (!form.customer_name.trim() || !form.phone.trim() || !form.address.trim()) {
      setMsg({ type: 'err', text: 'Nama, nomor WhatsApp, dan alamat wajib diisi.' });
      return;
    }
    setBusy(true);
    try {
      const data = await insertOrder({ ...form, items });
      setMsg({ type: 'ok', text: `Pesanan ${data.code} tersimpan ✔` });
      setForm({
        code: '', customer_name: '', phone: '', email: '', address: '', city: '',
        courier: 'JNE', status: 'selesai', shipping_cost: '0', tracking_number: '',
        admin_note: '', created_at: '',
        items: [newItem()],
      });
    } catch (err) {
      setMsg({ type: 'err', text: dbError(err.message) });
    }
    setBusy(false);
  };

  const parseItemList = (raw) => {
    return String(raw || '')
      .split('|')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const m = part.match(/^(.+?)\s*(?:[:xX])\s*(\d+)$/);
        if (!m) return null;
        return { isbn: m[1].trim(), qty: Math.max(1, parseInt(m[2], 10)) };
      })
      .filter(Boolean);
  };

  const onFile = async (file) => {
    setFileOrders(null);
    setFileMsg('');
    if (!file) return;
    setFileName(file.name);
    try {
      const XLSX = await loadXlsx();
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) { setFileMsg('File tidak punya sheet.'); return; }
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '', blankrows: false });
      if (rows.length < 2) { setFileMsg('File kosong atau tidak punya data.'); return; }
      const headers = rows[0].map((h) => String(h).trim().toLowerCase());
      const col = (name) => headers.indexOf(name);
      const required = ['customer_name', 'phone', 'address', 'items'];
      const missing = required.filter((h) => col(h) === -1);
      if (missing.length) { setFileMsg(`Kolom wajib tidak ditemukan: ${missing.join(', ')}`); return; }
      const get = (row, name) => {
        const idx = col(name);
        if (idx === -1) return '';
        const value = row[idx];
        if (value instanceof Date) return value.toISOString().slice(0, 10);
        return String(value ?? '').trim();
      };

      const parsed = rows.slice(1).map((row, i) => {
        const errors = [];
        const name = get(row, 'customer_name');
        const phone = get(row, 'phone');
        const address = get(row, 'address');
        if (!name) errors.push('Nama kosong');
        if (!phone) errors.push('No. WA kosong');
        if (!address) errors.push('Alamat kosong');
        const rawItems = get(row, 'items');
        const parsedItems = parseItemList(rawItems);
        if (parsedItems.length === 0) errors.push('Format items tidak valid');
        const items = [];
        parsedItems.forEach((it) => {
          const b = bookMap.byIsbn[normIsbn(it.isbn)];
          if (!b) { errors.push(`ISBN ${it.isbn} tidak ditemukan`); return; }
          items.push({
            book_id: b.id, title: b.title, price: hargaAktif(b), qty: it.qty,
            is_preorder: b.status === 'preorder',
          });
        });
        const created = get(row, 'created_at');
        if (created && Number.isNaN(new Date(created).getTime())) errors.push('Tanggal created_at tidak valid');
        return {
          line: i + 2,
          code: get(row, 'code'),
          customer_name: name,
          phone,
          email: get(row, 'email'),
          address,
          city: get(row, 'city'),
          courier: get(row, 'courier'),
          status: normalizeStatus(get(row, 'status')),
          shipping_cost: Number(get(row, 'shipping_cost')) || 0,
          tracking_number: get(row, 'tracking_number'),
          admin_note: get(row, 'admin_note'),
          created_at: created,
          items,
          errors,
          subtotal: items.reduce((sum, it) => sum + it.price * it.qty, 0),
        };
      });
      setFileOrders(parsed);
    } catch (err) {
      setFileMsg(dbError(err.message));
    }
  };

  const runImport = async () => {
    if (!fileOrders) return;
    const valid = fileOrders.filter((o) => o.errors.length === 0);
    if (valid.length === 0) { setFileMsg('Tidak ada baris valid untuk diimport.'); return; }
    setBusy(true);
    let ok = 0;
    const failures = [];
    for (const o of valid) {
      try {
        await insertOrder(o);
        ok += 1;
      } catch (err) {
        failures.push(`${o.code || o.customer_name}: ${dbError(err.message)}`);
      }
    }
    setBusy(false);
    setFileMsg(`Berhasil import ${ok} pesanan${failures.length ? `, ${failures.length} gagal` : ''}.`);
    if (failures.length) {
      setMsg({ type: 'err', text: failures.slice(0, 5).join(' | ') });
    } else {
      setMsg({ type: 'ok', text: `Import selesai: ${ok} pesanan ✔` });
      setFileOrders(null);
      setFileName('');
    }
  };

  const downloadTemplate = async () => {
    const XLSX = await loadXlsx();
    const headers = ['code', 'customer_name', 'phone', 'email', 'address', 'city', 'courier', 'status', 'shipping_cost', 'tracking_number', 'created_at', 'items', 'admin_note'];
    const sample = ['BYRA-CONTOH1', 'Nama Pelanggan', '08123456789', 'email@contoh.com', 'Alamat lengkap', 'Bandung', 'JNE', 'selesai', 20000, 'RESI123', '2025-01-31', '9781234567890:1|9789876543210:2', 'Order lama'];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
    ws['!cols'] = [14, 22, 16, 24, 34, 16, 10, 14, 12, 18, 14, 34, 24].map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(wb, ws, 'Order');

    const guide = [
      ['Kolom', 'Keterangan'],
      ['code', 'Opsional. Kosongkan untuk generate otomatis.'],
      ['customer_name', 'Wajib diisi.'],
      ['phone', 'Wajib diisi. Nomor WhatsApp pelanggan.'],
      ['email', 'Opsional.'],
      ['address', 'Wajib diisi. Alamat lengkap.'],
      ['city', 'Opsional.'],
      ['courier', 'Opsional. Contoh: JNE, J&T.'],
      ['status', 'menunggu_pembayaran / dibayar / diproses / dikirim / selesai / dibatalkan. Default: selesai.'],
      ['shipping_cost', 'Angka rupiah tanpa titik. Contoh: 20000.'],
      ['tracking_number', 'Opsional. Nomor resi.'],
      ['created_at', 'Opsional. Format YYYY-MM-DD.'],
      ['items', 'Wajib. Format ISBN:qty|ISBN:qty. Contoh: 9781234567890:1|9789876543210:2. Harga diambil dari katalog. Format kolom sebagai Text agar ISBN tidak berubah.'],
      ['admin_note', 'Opsional. Catatan internal admin.'],
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(guide);
    ws2['!cols'] = [{ wch: 22 }, { wch: 95 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Petunjuk');
    XLSX.writeFile(wb, 'template-order-byra.xlsx');
  };

  return (
    <>
      <div className="row between" style={{ marginBottom: 4 }}>
        <div>
          <h1>Import Order Lama</h1>
          <p className="muted" style={{ margin: 0 }}>Masukkan pesanan yang masuk sebelum website aktif agar bisa dilacak dan dipesan lagi.</p>
        </div>
        <Link href="/byras/pesanan" className="btn btn-ghost btn-sm">
          <IconArrowLeft width={16} height={16} /> Kembali ke pesanan
        </Link>
      </div>

      <div className="row" style={{ margin: '16px 0' }}>
        <button type="button" className={`chip ${tab === 'manual' ? 'on' : ''}`} onClick={() => setTab('manual')}>Form manual</button>
        <button type="button" className={`chip ${tab === 'excel' ? 'on' : ''}`} onClick={() => setTab('excel')}>Import Excel</button>
      </div>

      {msg.text && <div className={`alert ${msg.type === 'ok' ? 'ok' : ''}`}>{msg.text}</div>}

      {tab === 'manual' ? (
        <form className="card" onSubmit={saveManual}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="stat-icon" style={{ width: 34, height: 34, borderRadius: 10 }}><IconReceipt width={17} height={17} /></span>
            Data pesanan
          </h2>
          <div className="grid grid-2">
            <div className="field"><label>Kode pesanan (opsional)</label><input value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="Kosongkan untuk generate otomatis" /></div>
            <div className="field"><label>Tanggal pesanan (opsional)</label><input type="date" value={form.created_at} onChange={(e) => set('created_at', e.target.value)} /></div>
            <div className="field"><label>Nama penerima *</label><input required value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} /></div>
            <div className="field"><label>Nomor WhatsApp *</label><input required value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="08xxxxxxxxxx" /></div>
            <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
            <div className="field"><label>Kota</label><input value={form.city} onChange={(e) => set('city', e.target.value)} /></div>
            <div className="field"><label>Ekspedisi</label><input value={form.courier} onChange={(e) => set('courier', e.target.value)} /></div>
            <div className="field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)}>
                {STATUS_KEYS.map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
              </select>
            </div>
            <div className="field"><label>Ongkir (Rp)</label><input type="number" min="0" value={form.shipping_cost} onChange={(e) => set('shipping_cost', e.target.value)} /></div>
            <div className="field"><label>No. resi</label><input value={form.tracking_number} onChange={(e) => set('tracking_number', e.target.value)} /></div>
          </div>
          <div className="field"><label>Alamat lengkap *</label><textarea required rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} /></div>
          <div className="field"><label>Catatan internal</label><input value={form.admin_note} onChange={(e) => set('admin_note', e.target.value)} /></div>

          <div className="row between" style={{ margin: '18px 0 10px' }}>
            <h3 style={{ margin: 0 }}>Item pesanan</h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm((p) => ({ ...p, items: [...p.items, newItem()] }))}>
              <IconPlus width={16} height={16} /> Tambah item
            </button>
          </div>

          <div className="order-items">
            {form.items.map((it, i) => (
              <div className="order-item-row" key={it.key}>
                <div className="field">
                  <label>Buku dari katalog</label>
                  <select value={it.book_id || ''} onChange={(e) => pickBook(i, e.target.value)}>
                    <option value="">— manual / tidak di katalog —</option>
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>{b.title}{b.isbn ? ` · ${b.isbn}` : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="field"><label>Judul</label><input value={it.title} onChange={(e) => setItem(i, 'title', e.target.value)} /></div>
                <div className="field"><label>Harga</label><input type="number" min="0" value={it.price} onChange={(e) => setItem(i, 'price', e.target.value)} /></div>
                <div className="field"><label>Qty</label><input type="number" min="1" value={it.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} /></div>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => setForm((p) => ({ ...p, items: p.items.length > 1 ? p.items.filter((_, idx) => idx !== i) : p.items }))}
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>

          <div className="summary-total" style={{ maxWidth: 320, marginLeft: 'auto' }}>
            <span>Total</span><b>{rupiah(total)}</b>
          </div>
          <p className="muted" style={{ fontSize: '.78rem' }}>Stok tidak diubah untuk order lama. Item yang terhubung ke katalog bisa dipakai fitur “Pesan lagi”.</p>
          <button className="btn" disabled={busy}>{busy ? 'Menyimpan…' : <><IconCheck width={17} height={17} /> Simpan pesanan</>}</button>
        </form>
      ) : (
        <div className="card">
          <div className="row" style={{ marginBottom: 14 }}>
            <button type="button" className="btn btn-sky btn-sm" onClick={downloadTemplate}>
              <IconUpload width={16} height={16} /> Unduh template Excel
            </button>
            <span className="muted" style={{ fontSize: '.8rem' }}>Format items: <code>ISBN:qty|ISBN:qty</code> · harga diambil dari katalog.</span>
          </div>
          <div className="field">
            <label>Pilih file Excel (.xlsx / .xls)</label>
            <input type="file" accept=".xlsx,.xls" onChange={(e) => onFile(e.target.files?.[0])} />
          </div>
          {fileName && <p className="muted">File: <b>{fileName}</b></p>}
          {fileMsg && <div className="alert info">{fileMsg}</div>}

          {fileOrders && (
            <>
              <div className="table-wrap" style={{ maxHeight: 360 }}>
                <table>
                  <thead><tr><th>Baris</th><th>Kode</th><th>Nama</th><th>Item</th><th>Total</th><th>Status</th></tr></thead>
                  <tbody>
                    {fileOrders.map((o) => (
                      <tr key={o.line} style={{ opacity: o.errors.length ? 0.55 : 1 }}>
                        <td>{o.line}</td>
                        <td>{o.code || '(otomatis)'}</td>
                        <td>{o.customer_name || '—'}<div className="muted" style={{ fontSize: '.76rem' }}>{o.phone}</div></td>
                        <td>{o.items.length} item{o.errors.length > 0 && <div className="alert" style={{ margin: '4px 0 0', padding: '4px 8px' }}>{o.errors.join(', ')}</div>}</td>
                        <td>{rupiah(o.subtotal + o.shipping_cost)}</td>
                        <td>{STATUS_LABEL[o.status]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="row" style={{ marginTop: 14 }}>
                <button type="button" className="btn" onClick={runImport} disabled={busy || fileOrders.every((o) => o.errors.length > 0)}>
                  {busy ? 'Mengimport…' : <><IconUpload width={17} height={17} /> Import {fileOrders.filter((o) => o.errors.length === 0).length} pesanan</>}
                </button>
                <span className="muted" style={{ fontSize: '.8rem' }}>
                  {fileOrders.filter((o) => o.errors.length > 0).length} baris bermasalah akan dilewati.
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
