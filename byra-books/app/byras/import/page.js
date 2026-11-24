'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { parseCsv, dbError } from '@/lib/format';
import { IconUpload, IconBook } from '@/components/Icons';
import {
  COLUMNS, SAMPLE_ROWS, GUIDE_ROWS, parseBookRows, groupBySignature, chunk, bookToExcelRow,
} from '@/lib/importBooks';

// library Excel dimuat hanya saat dibutuhkan (hemat ukuran halaman)
async function loadXlsx() {
  const mod = await import('xlsx');
  return mod.default && mod.default.read ? mod.default : mod;
}

const WIDTHS = [32, 22, 22, 16, 9, 40, 16, 8, 11, 12, 8, 8, 12, 30, 12, 8, 10, 12, 11, 7, 15, 28];

function saveWorkbook(XLSX, filename, sheets) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, rows, widths }) => {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    if (widths) ws['!cols'] = widths.map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(wb, ws, name);
  });
  XLSX.writeFile(wb, filename);
}

export default function Import() {
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  const say = (type, text) => setMsg({ type, text });

  const onFile = async (file) => {
    setParsed(null);
    setMsg({ type: '', text: '' });
    if (!file) return;
    setFileName(file.name);
    try {
      let aoa;
      if (/\.csv$/i.test(file.name) || file.type === 'text/csv') {
        aoa = parseCsv(await file.text());
      } else {
        const XLSX = await loadXlsx();
        const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        if (!ws) { say('err', 'File tidak punya lembar (sheet).'); return; }
        aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '', blankrows: false });
      }
      setParsed(parseBookRows(aoa));
    } catch (e) {
      say('err', 'File tidak bisa dibaca. Pastikan formatnya Excel (.xlsx / .xls). ' + (e?.message || ''));
    }
  };

  const run = async () => {
    if (!parsed || parsed.rows.length === 0) return;
    setBusy(true);
    say('', '');
    try {
      const withIsbn = parsed.rows.filter((r) => r.isbn);
      const noIsbn = parsed.rows.filter((r) => !r.isbn);

      for (const group of groupBySignature(withIsbn)) {
        for (const part of chunk(group, 200)) {
          const { error } = await supabase.from('books').upsert(part, { onConflict: 'isbn', defaultToNull: false });
          if (error) throw error;
        }
      }
      for (const group of groupBySignature(noIsbn)) {
        for (const part of chunk(group, 200)) {
          const { error } = await supabase.from('books').insert(part, { defaultToNull: false });
          if (error) throw error;
        }
      }
      say('ok', `Berhasil mengimport ${parsed.rows.length} buku ✔`);
      setParsed(null);
      setFileName('');
    } catch (e) {
      say('err', `Import gagal: ${dbError(e.message || e)}`);
    }
    setBusy(false);
  };

  const downloadTemplate = async () => {
    const XLSX = await loadXlsx();
    saveWorkbook(XLSX, 'template-buku-byra.xlsx', [
      { name: 'Buku', rows: [COLUMNS, ...SAMPLE_ROWS], widths: WIDTHS },
      { name: 'Petunjuk', rows: GUIDE_ROWS, widths: [34, 100] },
    ]);
  };

  const exportAll = async () => {
    setBusy(true);
    const { data, error } = await supabase.from('books').select('*').order('title').limit(10000);
    if (error) { setBusy(false); say('err', dbError(error.message)); return; }
    const XLSX = await loadXlsx();
    saveWorkbook(XLSX, 'buku-byra.xlsx', [
      { name: 'Buku', rows: [COLUMNS, ...(data || []).map(bookToExcelRow)], widths: WIDTHS },
    ]);
    setBusy(false);
  };

  const noIsbnCount = parsed ? parsed.rows.filter((r) => !r.isbn).length : 0;

  return (
    <>
      <h1>Import / Export Buku</h1>
      <p className="muted">Tambah atau perbarui banyak buku sekaligus lewat file Excel / CSV.</p>
      <div className="card" style={{ maxWidth: 860 }}>
        <p>
          Isi data buku di <b>Excel</b> memakai template, lalu upload di sini. Buku dengan <b>ISBN yang sudah ada</b> akan
          diperbarui (stok &amp; harga ikut berubah), buku baru ditambahkan.
        </p>
        <div className="row">
          <button className="btn btn-sky btn-sm" onClick={downloadTemplate}><IconUpload width={16} height={16} /> Unduh template Excel</button>
          <button className="btn btn-ghost btn-sm" onClick={exportAll} disabled={busy}><IconBook width={16} height={16} /> Export semua buku</button>
        </div>

        <div className="field" style={{ marginTop: 16 }}>
          <label>Pilih file Excel (.xlsx / .xls)</label>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => onFile(e.target.files?.[0])} />
        </div>

        {msg.text && <div className={`alert ${msg.type === 'ok' ? 'ok' : ''}`}>{msg.text}</div>}

        {parsed && (
          <>
            <p><b>{fileName}</b> — {parsed.rows.length} buku siap diimport{parsed.skipped > 0 && `, ${parsed.skipped} baris dilewati`}.</p>
            {parsed.unknown.length > 0 && (
              <div className="muted">Kolom tidak dikenali (diabaikan): {parsed.unknown.join(', ')}</div>
            )}
            {parsed.errors.length > 0 && (
              <div className="alert">{parsed.errors.slice(0, 15).map((e, i) => <div key={i}>{e}</div>)}
                {parsed.errors.length > 15 && <div>…dan {parsed.errors.length - 15} lainnya</div>}</div>
            )}
            {parsed.warnings.length > 0 && (
              <details style={{ margin: '8px 0' }}>
                <summary className="muted">{parsed.warnings.length} peringatan (tidak menghalangi import)</summary>
                {parsed.warnings.slice(0, 30).map((w, i) => <div key={i} className="muted">{w}</div>)}
              </details>
            )}
            {noIsbnCount > 0 && (
              <p className="muted">{noIsbnCount} buku tanpa ISBN akan selalu ditambahkan sebagai buku baru (tidak bisa dicocokkan dengan data lama).</p>
            )}
            {parsed.rows.length > 0 && (
              <>
                <div className="table-wrap" style={{ maxHeight: 280 }}>
                  <table>
                    <thead><tr><th>Judul</th><th>ISBN</th><th>Harga</th><th>Stok</th><th>Status</th><th>Asal</th></tr></thead>
                    <tbody>
                      {parsed.rows.slice(0, 50).map((r, i) => (
                        <tr key={i}><td>{r.title}</td><td>{r.isbn}</td><td>{r.price}</td><td>{r.stock}</td><td>{r.status || 'ready'}</td><td>{r.origin || 'lokal'}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsed.rows.length > 50 && <p className="muted">Menampilkan 50 baris pertama.</p>}
                <button className="btn" style={{ marginTop: 10 }} disabled={busy} onClick={run}>
                  {busy ? 'Mengimport…' : `Import ${parsed.rows.length} buku`}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
