export const rupiah = (n) => 'Rp' + Number(n || 0).toLocaleString('id-ID');

export function dbError(message) {
  const m = String(message || '');
  if (/permission denied/i.test(m)) {
    return 'Akses database ditolak. Jalankan file supabase/migrations/003_grants_dan_stok.sql di Supabase → SQL Editor, lalu refresh halaman.';
  }
  if (/relation .* does not exist/i.test(m)) {
    return 'Tabel database belum dibuat. Jalankan file supabase/schema.sql di Supabase → SQL Editor.';
  }
  return m;
}

export const tanggal = (d) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export const tanggalJam = (d) =>
  d
    ? new Date(d).toLocaleString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '';

export const STATUS = {
  menunggu_pembayaran: 'Menunggu Pembayaran',
  dibayar: 'Pembayaran Diterima',
  diproses: 'Sedang Diproses',
  dikirim: 'Dikirim',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
};

export const STATUS_FLOW = ['menunggu_pembayaran', 'dibayar', 'diproses', 'dikirim', 'selesai'];
export const STATUS_PAID = ['dibayar', 'diproses', 'dikirim', 'selesai'];

export const hargaAktif = (b) =>
  b.discount_price && Number(b.discount_price) < Number(b.price) ? Number(b.discount_price) : Number(b.price);

export function normalizeWa(n) {
  let d = String(n || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = '62' + d.slice(1);
  return d;
}

export const waLink = (number, text) =>
  `https://wa.me/${normalizeWa(number)}?text=${encodeURIComponent(text)}`;

export function downloadCsv(filename, rows) {
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function parseCsv(text) {
  const rows = [];
  let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',' || c === ';') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); cur = '';
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
    } else cur += c;
  }
  row.push(cur);
  if (row.some((x) => x.trim() !== '')) rows.push(row);
  return rows;
}
