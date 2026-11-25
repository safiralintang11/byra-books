export const DEFAULT_ABOUT_SECTIONS = [
  {
    id: 'about',
    label: 'Tentang Byra Books',
    visible: true,
    title_id: 'Tentang Byra Books',
    title_en: 'About Byra Books',
    body_id:
      'Byra Books adalah toko buku online yang melayani jastip buku impor, pre-order (PO), dan ready stock. Kami memilih judul satu per satu, baik buku lokal maupun impor, supaya kamu lebih mudah menemukan cerita berikutnya.\n\nSemua pesanan diproses oleh admin yang sama, jadi kamu bisa bertanya langsung lewat WhatsApp kapan saja.',
    body_en:
      'Byra Books is an online bookstore offering personal shopping for imported books, pre-orders (PO), and ready stock. We hand-pick every title, local or imported, to help you find your next story more easily.\n\nEvery order is handled by the same admin team, so you can ask us anything on WhatsApp anytime.',
  },
  {
    id: 'order',
    label: 'Cara order & pembayaran',
    visible: true,
    title_id: 'Cara order dan pembayaran',
    title_en: 'How to order and pay',
    body_id:
      '1. Pilih buku di katalog, lalu tambahkan ke keranjang.\n2. Isi data pengiriman dan buat pesanan — tidak perlu daftar akun.\n3. Admin akan mengonfirmasi ongkir dan total pembayaran lewat WhatsApp.\n4. Pembayaran dapat dilakukan dengan DP 50%, lalu pelunasan sebelum buku dikirim.\n5. Batas waktu pembayaran adalah 2×24 jam setelah konfirmasi admin. Jika lewat batas, pesanan dapat dibatalkan otomatis.\n\nSetelah transfer, unggah bukti pembayaran di halaman Lacak Pesanan agar pesananmu segera diproses.',
    body_en:
      '1. Pick a book in the catalog and add it to your cart.\n2. Fill in your shipping details and create the order — no account needed.\n3. Our admin will confirm shipping and the total payment via WhatsApp.\n4. You may pay a 50% down payment, then settle the balance before the book is shipped.\n5. Payment is due within 2×24 hours after admin confirmation. Late orders may be cancelled automatically.\n\nAfter transferring, upload your payment proof on the Track Order page so we can process your order right away.',
  },
  {
    id: 'po',
    label: 'Ketentuan PO',
    visible: true,
    title_id: 'Ketentuan pre-order (PO)',
    title_en: 'Pre-order (PO) terms',
    body_id:
      '• Setiap batch PO punya jadwal tutup sendiri. Tanggal tutup tertera di halaman buku dan section Pre-Order.\n• Estimasi kedatangan buku impor biasanya 3–6 minggu setelah PO ditutup, tergantung penerbit dan pengiriman internasional.\n• Jika buku tidak tersedia dari penerbit/distributor, dana DP akan dikembalikan penuh atau bisa dialihkan ke judul lain sesuai kesepakatan.\n• Keterlambatan dari pihak penerbit atau ekspedisi di luar kendali Byra Books, tetapi kami akan terus memberi update.',
    body_en:
      '• Each PO batch has its own closing date. The closing date is shown on the book page and in the Pre-Order section.\n• Imported books usually arrive 3–6 weeks after the PO closes, depending on the publisher and international shipping.\n• If a book is unavailable from the publisher/distributor, your down payment will be fully refunded or can be transferred to another title by agreement.\n• Delays caused by publishers or couriers are beyond Byra Books’ control, but we will keep you updated.',
  },
  {
    id: 'shipping',
    label: 'Pengiriman & pengembalian',
    visible: true,
    title_id: 'Pengiriman dan pengembalian',
    title_en: 'Shipping and returns',
    body_id:
      '• Buku dikirim dengan JNE, J&T, atau ekspedisi lain yang tersedia. Ongkir dihitung setelah alamat lengkap dikonfirmasi.\n• Setiap buku dikemas dengan bubble wrap dan pelindung tambahan agar aman selama perjalanan.\n• Jika paket rusak atau salah kirim, hubungi admin maksimal 1×24 jam setelah paket diterima dan sertakan video unboxing.\n• Pengembalian hanya berlaku untuk buku yang rusak/cacat dari kami, bukan karena perubahan pikiran. Buku PO yang sudah dipesan tidak dapat dibatalkan setelah batch ditutup.',
    body_en:
      '• Books are shipped via JNE, J&T, or another available courier. Shipping is calculated after your full address is confirmed.\n• Every book is packed with bubble wrap and extra protection for safe transit.\n• If a parcel is damaged or incorrect, contact admin within 1×24 hours of delivery and include an unboxing video.\n• Returns apply only to books damaged/defective from our side, not to change of mind. PO books cannot be cancelled once the batch is closed.',
  },
];

export function parseAboutSections(raw) {
  const defaults = DEFAULT_ABOUT_SECTIONS.map((s) => ({ ...s }));
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
    if (!item || !item.id || seen.has(item.id)) return;
    seen.add(item.id);
    const base = byId[item.id] || { id: item.id, label: item.label || 'Section' };
    out.push({
      ...base,
      label: item.label ?? base.label,
      visible: item.visible !== false,
      title_id: item.title_id ?? base.title_id ?? '',
      title_en: item.title_en ?? base.title_en ?? '',
      body_id: item.body_id ?? base.body_id ?? '',
      body_en: item.body_en ?? base.body_en ?? '',
    });
  });
  return out;
}

export function serializeAboutSections(sections) {
  return JSON.stringify(sections);
}

export function newAboutSection() {
  return {
    id: `section-${Date.now()}`,
    label: 'Bagian baru',
    visible: true,
    title_id: '',
    title_en: '',
    body_id: '',
    body_en: '',
  };
}
