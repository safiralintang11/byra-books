// Logika murni (tanpa library) untuk membaca baris Excel -> data buku.
// Input: array of arrays (baris pertama = judul kolom), seperti hasil XLSX.utils.sheet_to_json(ws, {header:1}).

// Kolom template (urutan sama dengan file Excel template & export)
export const COLUMNS = [
  'judul', 'penulis', 'penerbit', 'isbn', 'halaman', 'sinopsis', 'kategori', 'stok', 'harga',
  'harga_diskon', 'tahun', 'berat', 'bahasa', 'cover_url', 'varian', 'asal', 'status', 'tutup_po',
  'best_seller', 'baru', 'special_edition', 'shopee_url',
];

// nama kolom (alias) -> kolom database
const ALIAS = {
  judul: 'title', title: 'title', judul_buku: 'title',
  penulis: 'author', author: 'author',
  penerbit: 'publisher', publisher: 'publisher',
  isbn: 'isbn',
  halaman: 'pages', jumlah_halaman: 'pages', pages: 'pages',
  sinopsis: 'synopsis', synopsis: 'synopsis',
  kategori: 'category', category: 'category',
  stok: 'stock', stock: 'stock',
  harga: 'price', price: 'price',
  harga_diskon: 'discount_price', diskon: 'discount_price', discount_price: 'discount_price',
  tahun: 'year', tahun_terbit: 'year', year: 'year',
  berat: 'weight_grams', berat_gram: 'weight_grams', weight_grams: 'weight_grams',
  bahasa: 'language', language: 'language',
  cover_url: 'cover_url', sampul: 'cover_url', url_sampul: 'cover_url',
  varian: 'format', format: 'format',
  asal: 'origin', origin: 'origin',
  status: 'status',
  tutup_po: 'preorder_close', preorder_close: 'preorder_close', tanggal_tutup_po: 'preorder_close',
  best_seller: 'is_bestseller', bestseller: 'is_bestseller',
  baru: 'is_new', buku_baru: 'is_new',
  special_edition: 'is_special', special: 'is_special',
  shopee_url: 'shopee_url', link_shopee: 'shopee_url',
};

const LABEL = {
  pages: 'halaman', stock: 'stok', price: 'harga', discount_price: 'harga_diskon', year: 'tahun', weight_grams: 'berat',
};
const INT_FIELDS =['pages', 'stock', 'price', 'discount_price', 'year', 'weight_grams'];
const BOOL_FIELDS = ['is_bestseller', 'is_new', 'is_special'];
const TEXT_FIELDS = ['title', 'author', 'publisher', 'synopsis', 'category', 'language', 'cover_url', 'shopee_url'];

export function normHeader(h) {
  return String(h ?? '')
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[*]/g, '')
    .trim()
    .replace(/[\s\-/]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

const isEmpty = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

function toInt(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? Math.round(v) : NaN;
  const digits = String(v).replace(/[^\d-]/g, '');
  if (digits === '' || digits === '-') return NaN;
  return parseInt(digits, 10);
}

function toIsbn(v) {
  if (typeof v === 'number') return String(Math.trunc(v));
  const s = String(v).replace(/[\s-]/g, '');
  return s === '' ? undefined : s;
}

const pad = (n) => String(n).padStart(2, '0');

function toDate(v) {
  if (v instanceof Date && !isNaN(v)) return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/); // dd/mm/yyyy
  if (m) return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
  return null;
}

const toBool = (v) => (typeof v === 'boolean' ? v : /^(ya|y|yes|true|1|x|v|✓)$/i.test(String(v).trim()));

/**
 * @returns {{rows: object[], errors: string[], warnings: string[], skipped: number, recognized: string[], unknown: string[]}}
 */
export function parseBookRows(aoa) {
  const out = { rows: [], errors: [], warnings: [], skipped: 0, recognized: [], unknown: [] };
  if (!Array.isArray(aoa) || aoa.length === 0) {
    out.errors.push('File kosong.');
    return out;
  }

  // cari baris judul kolom: baris pertama yang berisi kolom "judul"/"title"
  let headIdx = aoa.findIndex((r) => Array.isArray(r) && r.some((c) => ALIAS[normHeader(c)] === 'title'));
  if (headIdx === -1) {
    out.errors.push('Kolom "judul" tidak ditemukan. Pakai template Excel dari tombol "Unduh template".');
    return out;
  }
  const head = aoa[headIdx].map((c) => ALIAS[normHeader(c)] || null);
  aoa[headIdx].forEach((c, i) => {
    if (isEmpty(c)) return;
    if (head[i]) out.recognized.push(String(c));
    else out.unknown.push(String(c));
  });

  const seenIsbn = new Map();

  for (let r = headIdx + 1; r < aoa.length; r++) {
    const line = aoa[r];
    if (!Array.isArray(line) || line.every(isEmpty)) continue;
    const excelRow = r + 1;
    const row = {};
    const rowErrors = [];

    head.forEach((key, i) => {
      if (!key) return;
      const raw = line[i];
      if (isEmpty(raw)) return;

      if (TEXT_FIELDS.includes(key)) row[key] = String(raw).trim();
      else if (key === 'isbn') row.isbn = toIsbn(raw);
      else if (INT_FIELDS.includes(key)) {
        const n = toInt(raw);
        if (Number.isNaN(n)) rowErrors.push(`kolom ${LABEL[key] || key} bukan angka ("${raw}")`);
        else row[key] = n;
      } else if (BOOL_FIELDS.includes(key)) row[key] = toBool(raw);
      else if (key === 'origin') row.origin = /impor|import/i.test(String(raw)) ? 'impor' : 'lokal';
      else if (key === 'status') row.status = /^(pre|po)/i.test(String(raw).trim()) ? 'preorder' : 'ready';
      else if (key === 'format') row.format = /hard/i.test(String(raw)) ? 'Hardcover' : 'Paperback';
      else if (key === 'preorder_close') {
        const d = toDate(raw);
        if (!d) rowErrors.push(`tanggal tutup PO tidak valid ("${raw}"), pakai format 2026-12-31`);
        else row.preorder_close = d;
      }
    });

    if (!row.title) rowErrors.push('judul kosong');
    if (row.stock !== undefined && row.stock < 0) rowErrors.push('stok tidak boleh minus');
    if (row.price !== undefined && row.price < 0) rowErrors.push('harga tidak boleh minus');

    if (rowErrors.length) {
      out.errors.push(`Baris ${excelRow}: ${rowErrors.join('; ')} — baris dilewati.`);
      out.skipped++;
      continue;
    }

    if (row.price === undefined || row.price === 0) out.warnings.push(`Baris ${excelRow} ("${row.title}"): harga kosong/0.`);
    if (row.discount_price !== undefined && row.price !== undefined && row.discount_price >= row.price)
      out.warnings.push(`Baris ${excelRow} ("${row.title}"): harga diskon tidak lebih murah dari harga normal, diskon tidak akan tampil.`);

    if (row.isbn) {
      if (seenIsbn.has(row.isbn)) {
        out.warnings.push(`Baris ${excelRow}: ISBN ${row.isbn} dobel di file, dipakai baris terakhir (menggantikan baris ${seenIsbn.get(row.isbn)}).`);
        const idx = out.rows.findIndex((x) => x.isbn === row.isbn);
        out.rows.splice(idx, 1);
      }
      seenIsbn.set(row.isbn, excelRow);
    }
    out.rows.push(row);
  }

  if (out.rows.length === 0 && out.errors.length === 0) out.errors.push('Tidak ada baris buku di file.');
  return out;
}

// Kelompokkan baris berdasarkan kumpulan kolom yang terisi, supaya sel kosong tidak menimpa data lama saat update.
export function groupBySignature(rows) {
  const groups = new Map();
  rows.forEach((r) => {
    const sig = Object.keys(r).sort().join('|');
    if (!groups.has(sig)) groups.set(sig, []);
    groups.get(sig).push(r);
  });
  return [...groups.values()];
}

export const chunk = (arr, n) => {
  const o = [];
  for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n));
  return o;
};

// baris buku database -> baris Excel (urutan = COLUMNS)
export function bookToExcelRow(b) {
  const yn = (v) => (v ? 'ya' : '');
  return [
    b.title, b.author ?? '', b.publisher ?? '', b.isbn ?? '', b.pages ?? '', b.synopsis ?? '', b.category ?? '',
    b.stock ?? 0, b.price ?? 0, b.discount_price ?? '', b.year ?? '', b.weight_grams ?? '', b.language ?? '',
    b.cover_url ?? '', b.format ?? 'Paperback', b.origin ?? 'lokal', b.status ?? 'ready', b.preorder_close ?? '',
    yn(b.is_bestseller), yn(b.is_new), yn(b.is_special), b.shopee_url ?? '',
  ];
}

export const SAMPLE_ROWS = [
  ['Contoh Novel Lokal', 'Penulis A', 'Penerbit X', '9786020000001', 320, 'Sinopsis singkat buku.', 'Novel', 10, 89000, 79000, 2024, 350, 'Indonesia', '', 'Paperback', 'lokal', 'ready', '', 'ya', 'ya', '', ''],
  ['Contoh Buku Impor', 'Author B', 'Publisher Y', '9781234567897', 400, 'Short synopsis.', 'Fantasy', 5, 185000, '', 2023, 500, 'Inggris', '', 'Hardcover', 'impor', 'ready', '', '', '', 'ya', ''],
  ['Contoh Pre-Order', 'Penulis C', '', '9786020000003', '', '', 'Non-Fiksi', 0, 120000, '', '', '', '', '', 'Paperback', 'impor', 'preorder', '2026-12-31', '', '', '', ''],
];

export const GUIDE_ROWS = [
  ['Petunjuk pengisian'],
  [''],
  ['judul', 'WAJIB diisi.'],
  ['isbn', 'Kunci penentu. Jika ISBN sudah ada di toko, data buku itu DIPERBARUI (stok/harga ikut berubah). Jika ISBN kosong, buku selalu ditambahkan sebagai buku baru.'],
  ['stok, harga, harga_diskon', 'Angka saja, tanpa "Rp" dan titik. Harga diskon harus lebih murah dari harga.'],
  ['varian', 'Paperback atau Hardcover.'],
  ['asal', 'lokal atau impor.'],
  ['status', 'ready (ready stock) atau preorder.'],
  ['tutup_po', 'Tanggal penutupan PO, contoh 2026-12-31 (kosongkan jika tidak PO).'],
  ['best_seller, baru, special_edition', 'Isi "ya" untuk memberi label, kosongkan jika tidak.'],
  ['cover_url', 'Link gambar sampul (opsional). Bisa juga diupload nanti dari menu Buku.'],
  ['Sel kosong', 'Saat memperbarui buku lama (ISBN sama), sel kosong tidak menghapus data yang sudah ada.'],
];
