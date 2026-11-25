# Byra Books – Web Toko Buku (Next.js + Supabase + Vercel)

Fitur: katalog bilingual ID/EN (grid, list, table view, filter pencarian/harga), section Ready Stock & Pre-Order,
buku Lokal & Impor, label (Best Seller, Diskon, Pre-order, Baru, Special Edition), keranjang, checkout tamu (tanpa login),
wishlist, riwayat & **tracking pesanan** (kode + no. WA), upload bukti transfer/QRIS, event & PO, tombol WhatsApp,
**kalkulator fee buku impor** (bisa disembunyikan), halaman **About** yang bisa diedit, tombol **Join order group**,
import order lama (form/Excel) + fitur **Pesan lagi**, dan **panel admin** (buku, pesanan, event, laporan, import/export Excel,
pengaturan, serta editor tampilan beranda/katalog/About tanpa mengedit kode).

## 1. Supabase (database)
1. Buat project di https://supabase.com (gratis).
2. **Authentication → Users → Add user**: buat akun admin (email + password). Ulangi untuk 2–3 admin lain.
3. Buka `supabase/schema.sql`, ganti email default `admin@byra-books.com` jika perlu
   (tambahkan baris `insert` lain untuk admin berikutnya), lalu salin seluruh isinya ke **SQL Editor → Run**.
4. **Project Settings → API**: salin `Project URL` dan `anon public` key.
5. Untuk database yang sudah pernah dibuat, jalankan juga migrasi berikut di SQL Editor (aman diulang):
   - `supabase/migrations/002_kalkulator.sql`
   - `supabase/migrations/003_grants_dan_stok.sql` (wajib jika muncul `permission denied`)
   - `supabase/migrations/004_tampilan_bilingual.sql` (pengaturan bilingual/tampilan + fitur Pesan lagi)

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
3. **Deploy**. Setelah jadi, buka `/byras` dan login.

## 4. Setelah online
- `/byras/pengaturan`: isi nomor WA admin, info rekening, upload QRIS, link Instagram/Shopee.
- `/byras/import`: klik **Unduh template Excel** (contoh isi ada di `contoh-buku.xlsx`), isi di Excel, simpan, lalu upload `.xlsx`. ISBN yang sama otomatis diperbarui; ada pratinjau dan daftar baris bermasalah sebelum import.
- `/byras/tampilan`: atur urutan/visibilitas section beranda, teks section ID/EN, tampilan default katalog, foto list view, tombol kalkulator, link grup order, dan isi halaman About.
- `/byras/pesanan/import`: masukkan order lama lewat form manual atau file **Excel (.xlsx / .xls)**. Template Excel bisa diunduh langsung dari halaman itu (format item `ISBN:qty|ISBN:qty`) agar order bisa dilacak dan dipakai fitur “Pesan lagi”.
- `/byras/kalkulator`: isi **kurs, buffer %, fee jastip per buku, total quotation ongkir, dan berat quotation** untuk USD dan GBP, lalu klik Simpan. Mata uang baru muncul di halaman `/kalkulator` setelah kurs dan quotation terisi. Pelanggan hanya melihat total bayar; semua angka itu disimpan di tabel yang hanya bisa dibaca admin dan dihitung di database.
- Aset brand ada di `public/brand/` (logo navy & putih, ikon) dan `app/icon.png` untuk favicon. Palet warna utama ada di variabel `:root` pada `app/globals.css` (navy, sky, pink, cream).
- Google Analytics: aktifkan blok komentar di `app/layout.js` dan ganti ID.
- Dev lokal: salin `.env.example` ke `.env.local`, lalu `npm install && npm run dev`.

## Catatan
- Halaman admin ada di **`/byras`** (bukan `/admin`, agar tidak mudah ditebak bot). Keamanan tetap dari Supabase Auth + RLS + fungsi `is_admin()`, bukan hanya URL-nya. Untuk mengganti path lagi: rename folder `app/byras` lalu ganti string `/byras` di `components/Header.js`, `components/Footer.js`, dan file-file di dalam folder tersebut.
- Jika muncul error **permission denied for table books** (katalog kosong / admin tidak bisa masuk), jalankan `supabase/migrations/003_grants_dan_stok.sql` di Supabase → SQL Editor. File itu memberi hak akses ke role `anon`/`authenticated` tanpa mematikan RLS.
- Untuk fitur **Pesan lagi** dan pengaturan baru, jalankan `supabase/migrations/004_tampilan_bilingual.sql` (atau ulangi `supabase/schema.sql`). Tanpa migrasi ini, tombol Pesan lagi akan bilang tidak ada buku yang bisa dipesan.
- Bahasa toko disimpan di perangkat pengunjung (tombol ID/EN). Teks produk (judul/penulis) tetap mengikuti data yang diisi admin.
- Rumus kalkulator: kurs customer = kurs × (1 + buffer%); tarif/gram = quotation × kurs customer ÷ berat quotation; total = harga × kurs customer × qty + qty × berat × tarif + qty × fee, dibulatkan ke atas per Rp1.000.
- Ongkir saat ini diisi admin per pesanan (menu Pesanan). Cek ongkir otomatis (RajaOngkir/Biteship) bisa ditambahkan sebagai tahap berikutnya.
- Notifikasi pesanan via WhatsApp memakai tombol chat (wa.me) dari admin; otomatis penuh butuh WhatsApp Business API.
- Stok berkurang otomatis saat checkout dan kembali otomatis jika pesanan dibatalkan.
