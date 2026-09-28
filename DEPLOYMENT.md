# Panduan Deployment Sistem Piket & Presensi Keterlambatan Siswa

Dokumen ini berisi panduan lengkap untuk men-deploy aplikasi ke **Vercel** (menggunakan Vercel Postgres / Neon) serta alternatif lain seperti **Render**, **Railway**, atau **Docker**.

---

## ⚡ 1. Panduan Deploy di Vercel (Postgres + Serverless Cookie Session)

Aplikasi ini sudah dioptimalkan untuk Vercel Serverless:
- Menggunakan **`cookie-session`** (sesi login disimpan terenkripsi di browser, sehingga login **tidak akan hilang** saat berpindah fungsi serverless di Vercel).
- Menggunakan **PostgreSQL** (melalui Vercel Storage / Neon.tech) sehingga data tersimpan permanen di cloud.

### Langkah-langkah Deploy ke Vercel:

#### Langkah 1: Buat Database PostgreSQL Gratis di Vercel
1. Buka dashboard [Vercel](https://vercel.com/dashboard) dan pilih project Anda (`sistem-piket` atau nama project Anda).
2. Di menu bagian atas, klik tab **Storage**.
3. Klik tombol **Create Database** -> Pilih **Postgres** (Powered by Neon) -> Klik **Continue**.
4. Pilih Region yang terdekat (misal: `Singapore (sin1)`).
5. Klik **Create** dan hubungkan (*Connect*) ke project Anda.
6. Vercel akan secara otomatis mengisi environment variable:
   - `DATABASE_URL` (atau `POSTGRES_PRISMA_URL`)

*(Atau jika ingin membuat database sendiri di luar Vercel, Anda bisa membuat database gratis di [neon.tech](https://neon.tech) atau [supabase.com](https://supabase.com), lalu salin URL koneksinya ke Environment Variables Vercel dengan nama `DATABASE_URL`)*.

#### Langkah 2: Tambahkan Environment Variable di Vercel
Buka project Anda di Vercel -> tab **Settings** -> **Environment Variables**:
- `SESSION_SECRET`: `kunci-rahasia-piket-sekolah-2024-super-aman`
- `NODE_ENV`: `production`
- `DATABASE_URL`: *(otomatis terisi jika pakai Vercel Storage, atau tempel dari Neon/Supabase)*

#### Langkah 3: Inisialisasi Tabel & Akun Default (Migrasi & Seed)
Jalankan perintah ini di laptop Anda (arahkan sementara `DATABASE_URL` di file `.env` lokal ke URL PostgreSQL cloud yang Anda dapat dari Vercel/Neon):
```bash
npx prisma db push
node prisma/seed.js
```
Setelah perintah di atas selesai, seluruh tabel dan akun default langsung terisi di cloud database!

#### Langkah 4: Deploy Ulang / Push ke GitHub
Setiap kali Anda melakukan push ke GitHub, Vercel akan otomatis men-deploy aplikasi dengan konfigurasi [`vercel.json`](file:///vercel.json) dan [`api/index.js`](file:///api/index.js).

---

## 🔑 2. Akun Bawaan (Hasil Seed)

Setelah menjalankan `seed.js`:

| Role | Username | Password |
|---|---|---|
| **Admin** | `admin` | `admin123` |
| **Guru Piket** | `guru1` | `guru123` |
| **Guru Piket 2** | `guru2` | `guru123` |
| **Siswa (NISN)** | `1001` (Ahmad Fauzi) | `siswa123` |
| **Siswa (NISN)** | `1002` (Siti Aisyah) | `siswa123` |

---

## 🌐 3. Opsi Alternatif: Render.com (Jika Ingin Tetap Pakai SQLite)

Jika Anda ingin memakai SQLite tanpa membuat database PostgreSQL cloud:
1. Hubungkan repository ke [Render.com](https://dashboard.render.com/).
2. Ubah `schema.prisma` ke `provider = "sqlite"` dan `url = "file:./dev.db"`.
3. Set Build Command: `npm install && npm run build`
4. Set Start Command: `npm start`
5. Jalankan `npm run deploy:setup` di tab Shell Render.
