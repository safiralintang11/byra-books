export const DEFAULT_HOME_SECTIONS = [
  {
    id: 'hero',
    label: 'Hero',
    visible: true,
    title_id: 'Temukan buku, buka *cerita* barumu.',
    title_en: 'Find a book, open your next *story*.',
    subtitle_id: '{store} merangkum buku baru, judul impor, dan pre-order pilihan. Pesan tanpa ribet, lalu lacak pesananmu kapan saja.',
    subtitle_en: '{store} brings together new releases, imported titles, and curated pre-orders. Order easily and track your parcel anytime.',
  },
  { id: 'marquee', label: 'Marquee', visible: true },
  { id: 'categories', label: 'Kategori', visible: true },
  {
    id: 'events',
    label: 'Event & PO',
    visible: true,
    title_id: 'Event & pre-order berjalan',
    title_en: 'Ongoing events & pre-orders',
    subtitle_id: 'Ikuti PO terbatas dan event buku terbaru.',
    subtitle_en: 'Join limited pre-orders and the latest book events.',
  },
  {
    id: 'new',
    label: 'Buku Baru',
    visible: true,
    title_id: 'Baru di rak',
    title_en: 'New on the shelf',
    subtitle_id: 'Tambahan terbaru untuk koleksimu.',
    subtitle_en: 'The latest additions to your collection.',
  },
  {
    id: 'best',
    label: 'Terlaris',
    visible: true,
    title_id: 'Paling dicari',
    title_en: 'Most wanted',
    subtitle_id: 'Judul favorit yang paling sering dipesan.',
    subtitle_en: 'Reader favorites that keep selling out.',
  },
  {
    id: 'ready',
    label: 'Ready Stock',
    visible: true,
    title_id: 'Ready stock',
    title_en: 'Ready stock',
    subtitle_id: 'Stok ada di tangan, tinggal checkout.',
    subtitle_en: 'On hand and ready to ship.',
  },
  {
    id: 'preorder',
    label: 'Pre-Order',
    visible: true,
    title_id: 'Pre-order',
    title_en: 'Pre-order',
    subtitle_id: 'Amankan judul terbatas sebelum tutup PO.',
    subtitle_en: 'Secure limited titles before the PO closes.',
  },
  { id: 'features', label: 'Keunggulan', visible: true },
  {
    id: 'cta',
    label: 'Call to action',
    visible: true,
    title_id: 'Bingung pilih buku berikutnya?',
    title_en: 'Not sure what to read next?',
    subtitle_id: 'Ceritakan genre atau judul yang kamu cari, admin kami bantu carikan. Bisa juga hitung dulu biaya buku impor.',
    subtitle_en: 'Tell us the genre or title you are looking for and our admin will help. You can also estimate import fees first.',
  },
];

const SECTION_IDS = DEFAULT_HOME_SECTIONS.map((s) => s.id);

export function parseHomeLayout(raw) {
  const defaults = DEFAULT_HOME_SECTIONS.map((s) => ({ ...s }));
  if (!raw) return defaults;
  let saved;
  try {
    saved = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return defaults;
  }
  if (!Array.isArray(saved)) return defaults;

  const byId = Object.fromEntries(defaults.map((s) => [s.id, s]));
  const seen = new Set();
  const out = [];
  saved.forEach((item) => {
    if (!item || !SECTION_IDS.includes(item.id) || seen.has(item.id)) return;
    seen.add(item.id);
    const base = byId[item.id];
    out.push({
      ...base,
      visible: item.visible !== false,
      ...(item.title_id != null ? { title_id: item.title_id } : {}),
      ...(item.title_en != null ? { title_en: item.title_en } : {}),
      ...(item.subtitle_id != null ? { subtitle_id: item.subtitle_id } : {}),
      ...(item.subtitle_en != null ? { subtitle_en: item.subtitle_en } : {}),
    });
  });
  defaults.forEach((base) => {
    if (!seen.has(base.id)) out.push(base);
  });
  return out;
}

export function serializeHomeLayout(layout) {
  return JSON.stringify(
    layout.map((s) => ({
      id: s.id,
      visible: s.visible !== false,
      title_id: s.title_id ?? '',
      title_en: s.title_en ?? '',
      subtitle_id: s.subtitle_id ?? '',
      subtitle_en: s.subtitle_en ?? '',
    }))
  );
}
