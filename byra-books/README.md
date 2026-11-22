# Byra Books – Web Toko Buku (Next.js + Supabase + Vercel)

Fitur: katalog (cari, filter kategori/penulis/penerbit/harga, urut terbaru/terlaris), section Ready Stock & Pre-Order,
buku Lokal & Impor, label (Best Seller, Diskon, Pre-order, Baru, Special Edition), keranjang, checkout tamu (tanpa login),
wishlist, riwayat & **tracking pesanan** (kode + no. WA), upload bukti transfer/QRIS, event & PO, tombol WhatsApp,
dan **panel admin** (buku, stok otomatis, pesanan, event, laporan penjualan, import/export CSV, pengaturan).

## 1. Supabase (database)
1. Buat project di https://supabase.com (gratis).
2. **Authentication → Users → Add user**: buat akun admin (email + password). Ulangi untuk 2–3 admin lain.
3. Buka `supabase/schema.sql`, **ganti** `GANTI_DENGAN_EMAIL_ADMIN@gmail.com` dengan email admin
   (tambahkan baris `insert` lain untuk admin berikutnya), lalu salin seluruh isinya ke **SQL Editor → Run**.
4. **Project Settings → API**: salin `Project URL` dan `anon public` key.

## 2. GitHub
Upload semua file di folder ini ke repository baru (drag & drop di github.com, atau):
```bash
git init && git add . && git commit -m "Byra Books" && git branch -M main
git remote add origin https://github.com/USERNAME/byra-books.git && git push -u origin main
```

## 3. Vercel
1. https://vercel.com → **Add New → Project** → import repo `byra-books`.
2. Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon key
3. **Deploy**. Setelah jadi, buka `/admin` dan login.

## 4. Setelah online
- `/admin/pengaturan`: isi nomor WA admin, info rekening, upload QRIS, link Instagram/Shopee.
- `/admin/import`: unduh template CSV (atau pakai `sample-books.csv`), isi dari spreadsheet, import.
- Ganti warna/logo di `app/globals.css` dan `components/Header.js` sesuai aset brand.
- Google Analytics: aktifkan blok komentar di `app/layout.js` dan ganti ID.
- Dev lokal: salin `.env.example` ke `.env.local`, lalu `npm install && npm run dev`.

## Catatan
- Ongkir saat ini diisi admin per pesanan (menu Pesanan). Cek ongkir otomatis (RajaOngkir/Biteship) bisa ditambahkan sebagai tahap berikutnya.
- Notifikasi pesanan via WhatsApp memakai tombol chat (wa.me) dari admin; otomatis penuh butuh WhatsApp Business API.
- Stok berkurang otomatis saat checkout dan kembali otomatis jika pesanan dibatalkan.
