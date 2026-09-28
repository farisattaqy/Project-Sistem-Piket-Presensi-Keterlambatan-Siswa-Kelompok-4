# Panduan Deployment Sistem Piket & Presensi Keterlambatan Siswa

Dokumen ini berisi panduan lengkap untuk men-deploy aplikasi ke layanan cloud/hosting (seperti **Render**, **Railway**, **VPS/Docker**).

---

## 📋 1. Konfigurasi Environment Variables

Sebelum aplikasi dijalankan di server produksi, pastikan variabel lingkungan (*environment variables*) telah diisi:

| Variabel | Contoh Nilai | Keterangan |
|---|---|---|
| `PORT` | `3000` atau otomatis dari cloud | Port server aplikasi |
| `NODE_ENV` | `production` | Mode produksi |
| `SESSION_SECRET` | `kunci-rahasia-acak-minimal-32-karakter` | Secret key untuk enkripsi cookie session |
| `DATABASE_URL` | `file:./dev.db` (SQLite) | Lokasi file database SQLite atau URL PostgreSQL |

> 💡 Template konfigurasi tersedia di file [`.env.example`](file:///.env.example). Jangan pernah meng-upload file `.env` asli ke GitHub.

---

## 🚀 2. Pilihan Layanan Deployment

### Opsi A: Deploy di Render (Render.com) - Sangat Direkomendasikan (Mudah & Gratis)

1. **Push kode ke GitHub**:
   Pastikan seluruh perubahan terbaru sudah di-commit dan di-push ke repository GitHub Anda.
2. **Buat Web Service baru di Render**:
   - Buka dashboard [Render](https://dashboard.render.com/) -> klik **New +** -> pilih **Web Service**.
   - Hubungkan repository GitHub Anda (`Project-Sistem-Piket-Presensi-Keterlambatan-Siswa-Kelompok-4`).
3. **Pengaturan Konfigurasi**:
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
4. **Isi Environment Variables**:
   Tambahkan variabel berikut di tab *Environment*:
   - `NODE_ENV` = `production`
   - `SESSION_SECRET` = *(buat string acak panjang)*
   - `DATABASE_URL` = `file:./dev.db`
5. **Inisialisasi Database (Seed Akun Awal)**:
   Setelah build selesai dan status *Live*, buka tab **Shell** di Render dan jalankan:
   ```bash
   npm run deploy:setup
   ```
   *(Perintah ini akan membuat tabel dan mengisi akun awal: admin, guru piket, siswa)*.

---

### Opsi B: Deploy di Railway (Railway.app)

1. Buka [Railway](https://railway.app/) dan buat **New Project**.
2. Pilih **Deploy from GitHub repo** dan pilih repository ini.
3. Di tab **Variables**, tambahkan:
   - `NODE_ENV` = `production`
   - `SESSION_SECRET` = *(string acak)*
   - `DATABASE_URL` = `file:./dev.db`
4. Untuk menjaga agar file SQLite tidak hilang saat redeploy, Anda dapat menambahkan **Volume**:
   - Mount path: `/app/prisma`
5. Jalankan setup database di tab terminal Railway:
   ```bash
   npm run deploy:setup
   ```

---

### Opsi C: Deploy dengan Docker

Aplikasi ini sudah dilengkapi dengan [`Dockerfile`](file:///Dockerfile) dan [`.dockerignore`](file:///.dockerignore).

1. **Build image**:
   ```bash
   docker build -t sistem-piket:latest .
   ```
2. **Jalankan container**:
   ```bash
   docker run -d -p 3000:3000 \
     -e SESSION_SECRET="secret-super-kuat" \
     -e DATABASE_URL="file:./dev.db" \
     -v sistem_piket_data:/app/prisma \
     --name sistem-piket \
     sistem-piket:latest
   ```
3. **Inisialisasi database di dalam container**:
   ```bash
   docker exec -it sistem-piket npm run deploy:setup
   ```

---

### Opsi D: Deploy di VPS (Ubuntu / Debian dengan PM2 + Nginx)

1. **Clone repository di server VPS**:
   ```bash
   git clone <URL_REPO_ANDA> /var/www/sistem-piket
   cd /var/www/sistem-piket
   ```
2. **Salin dan sesuaikan file `.env`**:
   ```bash
   cp .env.example .env
   nano .env
   ```
3. **Install dependensi dan setup database**:
   ```bash
   npm install
   npm run build
   npm run deploy:setup
   ```
4. **Jalankan aplikasi dengan PM2**:
   ```bash
   sudo npm install -g pm2
   pm2 start app.js --name "sistem-piket"
   pm2 startup
   pm2 save
   ```
5. **Konfigurasi Reverse Proxy Nginx**:
   Arahkan Nginx `proxy_pass http://localhost:3000;` dengan header proxy standar (`Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`).

---

## 🔑 3. Akun Default Hasil Seed

Setelah menjalankan `npm run deploy:setup`, akun bawaan yang siap dipakai untuk login:

| Role | Username | Password |
|---|---|---|
| **Admin** | `admin` | `admin123` |
| **Guru Piket** | `guru1` | `guru123` |
| **Guru Piket 2** | `guru2` | `guru123` |
| **Siswa (NISN)** | `1001` (Ahmad Fauzi) | `siswa123` |
| **Siswa (NISN)** | `1002` (Siti Aisyah) | `siswa123` |

> ⚠️ **PENTING**: Segera ganti password default akun admin dan guru setelah aplikasi online!

---

## 🔄 4. Opsi Migrasi ke Database PostgreSQL (Opsional)

Jika ingin menggunakan PostgreSQL (misal: Supabase, Neon.tech, atau Render PostgreSQL):

1. Ubah provider di [`prisma/schema.prisma`](file:///prisma/schema.prisma):
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Ganti `DATABASE_URL` di `.env` dengan connection string PostgreSQL:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
   ```
3. Jalankan migrasi:
   ```bash
   npm run deploy:setup
   ```
