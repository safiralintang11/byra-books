'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useSettings, useReloadSettings } from '@/lib/useSettings';
import { dbError } from '@/lib/format';
import {
  parseHomeLayout, serializeHomeLayout,
} from '@/lib/homeLayout';
import {
  parseAboutSections, serializeAboutSections, newAboutSection,
} from '@/lib/aboutDefaults';
import {
  IconChevronUp, IconChevronDown, IconPlus, IconCheck, IconArrowRight, IconLayout,
} from '@/components/Icons';

const TEXT_SECTIONS = new Set(['hero', 'events', 'new', 'best', 'ready', 'preorder', 'cta']);

function moveItem(list, index, dir, setter) {
  const next = [...list];
  const target = index + dir;
  if (target < 0 || target >= next.length) return;
  [next[index], next[target]] = [next[target], next[index]];
  setter(next);
}

export default function Tampilan() {
  const s = useSettings();
  const reload = useReloadSettings();
  const initialized = useRef(false);

  const [layout, setLayout] = useState(() => parseHomeLayout(undefined));
  const [about, setAbout] = useState(() => parseAboutSections(undefined));
  const [catalogView, setCatalogView] = useState('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [showCovers, setShowCovers] = useState(true);
  const [showCalc, setShowCalc] = useState(false);
  const [joinUrl, setJoinUrl] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialized.current || Object.keys(s).length === 0) return;
    initialized.current = true;
    setLayout(parseHomeLayout(s.home_layout));
    setAbout(parseAboutSections(s.about_sections));
    setCatalogView(['grid', 'list', 'table'].includes(s.catalog_default_view) ? s.catalog_default_view : 'grid');
    setShowFilters(s.catalog_show_filters !== '0');
    setShowCovers(s.catalog_show_covers !== '0');
    setShowCalc(s.show_calculator === '1' || s.show_calculator === 'true');
    setJoinUrl(s.join_group_url || '');
  }, [s]);

  const setLayoutField = (index, key, value) => {
    setLayout((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };
  const setAboutField = (index, key, value) => {
    setAbout((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const save = async () => {
    setBusy(true);
    setMsg('');
    const rows = [
      { key: 'home_layout', value: serializeHomeLayout(layout) },
      { key: 'about_sections', value: serializeAboutSections(about) },
      { key: 'catalog_default_view', value: catalogView },
      { key: 'catalog_show_filters', value: showFilters ? '1' : '0' },
      { key: 'catalog_show_covers', value: showCovers ? '1' : '0' },
      { key: 'show_calculator', value: showCalc ? '1' : '0' },
      { key: 'join_group_url', value: joinUrl.trim() },
    ];
    const { error } = await supabase.from('settings').upsert(rows);
    setBusy(false);
    if (error) { setMsg(dbError(error.message)); return; }
    await reload();
    setMsg('Tampilan tersimpan ✔ Perubahan langsung dipakai di toko.');
  };

  return (
    <>
      <div className="row between" style={{ marginBottom: 4 }}>
        <div>
          <h1>Tampilan</h1>
          <p className="muted" style={{ margin: 0 }}>Atur urutan beranda, tampilan katalog, grup order, dan halaman About tanpa mengedit kode.</p>
        </div>
        <div className="row">
          <Link href="/" target="_blank" className="btn btn-ghost btn-sm">Lihat toko</Link>
          <button className="btn" onClick={save} disabled={busy}>
            {busy ? 'Menyimpan…' : <><IconCheck width={17} height={17} /> Simpan</>}
          </button>
        </div>
      </div>

      {msg && <div className={`alert ${msg.includes('✔') ? 'ok' : ''}`}>{msg}</div>}

      <div className="grid grid-2" style={{ alignItems: 'start', marginTop: 16 }}>
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="stat-icon" style={{ width: 34, height: 34, borderRadius: 10 }}><IconLayout width={17} height={17} /></span>
            Urutan beranda
          </h2>
          <p className="muted" style={{ fontSize: '.84rem' }}>Gunakan panah untuk menggeser bagian. Hilangkan centang untuk menyembunyikan.</p>

          <div className="editor-list">
            {layout.map((sec, i) => (
              <div className="editor-row" key={sec.id}>
                <div className="editor-head">
                  <label className="check" style={{ margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={sec.visible !== false}
                      onChange={(e) => setLayoutField(i, 'visible', e.target.checked)}
                    />
                    <b>{sec.label}</b>
                  </label>
                  <div className="row" style={{ gap: 4 }}>
                    <button type="button" className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => moveItem(layout, i, -1, setLayout)} disabled={i === 0} aria-label="Naikkan">
                      <IconChevronUp width={15} height={15} />
                    </button>
                    <button type="button" className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => moveItem(layout, i, 1, setLayout)} disabled={i === layout.length - 1} aria-label="Turunkan">
                      <IconChevronDown width={15} height={15} />
                    </button>
                  </div>
                </div>
                {TEXT_SECTIONS.has(sec.id) && (
                  <div className="editor-body">
                    <div className="grid grid-2">
                      <div className="field">
                        <label>Judul (ID)</label>
                        <input value={sec.title_id || ''} onChange={(e) => setLayoutField(i, 'title_id', e.target.value)} />
                      </div>
                      <div className="field">
                        <label>Title (EN)</label>
                        <input value={sec.title_en || ''} onChange={(e) => setLayoutField(i, 'title_en', e.target.value)} />
                      </div>
                      <div className="field">
                        <label>Subjudul (ID)</label>
                        <input value={sec.subtitle_id || ''} onChange={(e) => setLayoutField(i, 'subtitle_id', e.target.value)} />
                      </div>
                      <div className="field">
                        <label>Subtitle (EN)</label>
                        <input value={sec.subtitle_en || ''} onChange={(e) => setLayoutField(i, 'subtitle_en', e.target.value)} />
                      </div>
                    </div>
                    {sec.id === 'hero' && (
                      <p className="muted" style={{ fontSize: '.76rem', margin: 0 }}>
                        Gunakan tanda bintang untuk kata bergaya italic, contoh: buka *cerita* barumu.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h2>Katalog</h2>
            <div className="field">
              <label>Tampilan default</label>
              <select value={catalogView} onChange={(e) => setCatalogView(e.target.value)}>
                <option value="grid">Catalogue listing (grid)</option>
                <option value="list">List view</option>
                <option value="table">Table view</option>
              </select>
            </div>
            <label className="check"><input type="checkbox" checked={showFilters} onChange={(e) => setShowFilters(e.target.checked)} />Tampilkan filter & pencarian</label>
            <label className="check"><input type="checkbox" checked={showCovers} onChange={(e) => setShowCovers(e.target.checked)} />Tampilkan foto sampul di list view (jika ada)</label>
            <p className="muted" style={{ fontSize: '.76rem', margin: '6px 0 0' }}>
              Table view selalu menampilkan ISBN, judul, penulis, format, dan harga tanpa foto.
            </p>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h2>Fitur toko</h2>
            <label className="check"><input type="checkbox" checked={showCalc} onChange={(e) => setShowCalc(e.target.checked)} />Tampilkan kalkulator fee</label>
            <div className="field" style={{ marginTop: 12 }}>
              <label>Link grup order (WhatsApp/Telegram)</label>
              <input value={joinUrl} onChange={(e) => setJoinUrl(e.target.value)} placeholder="https://chat.whatsapp.com/..." />
              <div className="muted" style={{ fontSize: '.76rem', marginTop: 4 }}>
                Tombol “Gabung grup order” muncul di beranda, katalog, dan halaman lacak pesanan.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="row between" style={{ marginBottom: 10 }}>
          <div>
            <h2 style={{ margin: 0 }}>Halaman About</h2>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '.84rem' }}>Urutan, judul, dan isi bagian halaman /tentang. Tersedia versi ID dan EN.</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAbout((prev) => [...prev, newAboutSection()])}>
            <IconPlus width={16} height={16} /> Tambah bagian
          </button>
        </div>

        <div className="editor-list">
          {about.map((sec, i) => (
            <div className="editor-row" key={sec.id}>
              <div className="editor-head">
                <label className="check" style={{ margin: 0 }}>
                  <input type="checkbox" checked={sec.visible !== false} onChange={(e) => setAboutField(i, 'visible', e.target.checked)} />
                  <b>{sec.title_id || sec.label || `Bagian ${i + 1}`}</b>
                </label>
                <div className="row" style={{ gap: 4 }}>
                  <button type="button" className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => moveItem(about, i, -1, setAbout)} disabled={i === 0} aria-label="Naikkan">
                    <IconChevronUp width={15} height={15} />
                  </button>
                  <button type="button" className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => moveItem(about, i, 1, setAbout)} disabled={i === about.length - 1} aria-label="Turunkan">
                    <IconChevronDown width={15} height={15} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => setAbout((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    Hapus
                  </button>
                </div>
              </div>
              <div className="editor-body">
                <div className="field">
                  <label>Label internal</label>
                  <input value={sec.label || ''} onChange={(e) => setAboutField(i, 'label', e.target.value)} />
                </div>
                <div className="grid grid-2">
                  <div className="field">
                    <label>Judul (ID)</label>
                    <input value={sec.title_id || ''} onChange={(e) => setAboutField(i, 'title_id', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Title (EN)</label>
                    <input value={sec.title_en || ''} onChange={(e) => setAboutField(i, 'title_en', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-2">
                  <div className="field">
                    <label>Isi (ID)</label>
                    <textarea rows={6} value={sec.body_id || ''} onChange={(e) => setAboutField(i, 'body_id', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Body (EN)</label>
                    <textarea rows={6} value={sec.body_en || ''} onChange={(e) => setAboutField(i, 'body_en', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="row" style={{ marginTop: 18 }}>
        <button className="btn" onClick={save} disabled={busy}>
          {busy ? 'Menyimpan…' : <><IconCheck width={17} height={17} /> Simpan semua</>}
        </button>
        <Link href="/tentang" target="_blank" className="btn btn-ghost">
          Lihat halaman About <IconArrowRight width={16} height={16} />
        </Link>
      </div>
    </>
  );
}
