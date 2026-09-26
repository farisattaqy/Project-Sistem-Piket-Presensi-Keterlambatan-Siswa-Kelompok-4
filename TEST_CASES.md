# TEST_CASES.md — Skenario Pengujian Sistem Piket & Presensi

## Informasi Sistem

| Item            | Detail                                           |
| --------------- | ------------------------------------------------ |
| Nama Aplikasi   | Sistem Piket & Presensi Keterlambatan Siswa       |
| Tech Stack      | Node.js, Express.js, SQLite, Prisma ORM, EJS     |
| Tanggal Uji     | ______________________                           |
| Penguji         | ______________________                           |

## Akun Demo Login

| Role        | Username    | Password    |
| ----------- | ----------- | ----------- |
| Admin       | admin       | password123 |
| Guru Piket  | gurupiket   | password123 |
| Siswa       | siswa       | password123 |

---

## TC-01: Login sebagai Guru Piket dan Cari Siswa berdasarkan NISN/Nama

| Item               | Detail                                                        |
| ------------------ | ------------------------------------------------------------- |
| **Prasyarat**      | Server berjalan, database sudah di-seed                       |
| **Langkah Uji**    |                                                               |
| 1                  | Buka browser dan akses `http://localhost:3000/login`          |
| 2                  | Klik tombol **Guru Piket** di bagian "Akun Demo"              |
| 3                  | Atau isi manual: Username = `gurupiket`, Password = `password123` |
| 4                  | Klik tombol **Masuk ke Sistem**                               |
| 5                  | Setelah masuk, klik menu **Input Keterlambatan** di sidebar   |
| 6                  | Di kolom "Cari Siswa", ketik `0081234567` (NISN) atau `Andi`  |
| 7                  | Verifikasi hasil pencarian muncul dengan data yang sesuai     |
| 8                  | Klik nama siswa yang ditemukan                                |
| **Hasil Diharapkan** | Sistem menampilkan data siswa yang cocok, lengkap dengan nama, NISN, kelas, dan total poin |
| **Status**         | ☐ LULUS / ☐ GAGAL                                            |
| **Catatan**        |                                                               |

---

## TC-02: Input Keterlambatan 20 Menit dengan Alasan dan Sanksi

| Item               | Detail                                                        |
| ------------------ | ------------------------------------------------------------- |
| **Prasyarat**      | TC-01 sudah lulus (sudah login sebagai Guru Piket, siswa sudah dipilih) |
| **Langkah Uji**    |                                                               |
| 1                  | Setelah siswa terpilih di form Input Keterlambatan            |
| 2                  | Isi **Jam Masuk** sesuai waktu kedatangan siswa (misal: 07:35) |
| 3                  | Isi **Menit Terlambat** = `20`                                |
| 4                  | Verifikasi bahwa poin otomatis terisi `10` dan sanksi `Bersihkan Halaman` |
| 5                  | Ubah sanksi menjadi `Bersihkan Lapangan` (dropdown)           |
| 6                  | Isi **Alasan** = `Ban bocor`                                  |
| 7                  | Klik tombol **Simpan & Terbitkan Surat Izin Masuk Kelas**     |
| **Hasil Diharapkan** | Sistem menyimpan data keterlambatan, status otomatis menjadi DIIZINKAN, dan redirect ke halaman Surat Izin Masuk Kelas |
| **Status**         | ☐ LULUS / ☐ GAGAL                                            |
| **Catatan**        |                                                               |

---

## TC-03: Sistem Otomatis Menambah Poin dan Mengubah Status

| Item               | Detail                                                        |
| ------------------ | ------------------------------------------------------------- |
| **Prasyarat**      | TC-02 sudah lulus                                             |
| **Langkah Uji**    |                                                               |
| 1                  | Setelah data tersimpan, perhatikan halaman Surat Izin yang ditampilkan |
| 2                  | Verifikasi **Status** menampilkan badge hijau "DIIZINKAN"     |
| 3                  | Verifikasi **Poin Pelanggaran** menampilkan "+10 poin"        |
| 4                  | Kembali ke **Dashboard Guru Piket**                           |
| 5                  | Verifikasi data keterlambatan baru muncul di tabel "Daftar Keterlambatan Hari Ini" |
| 6                  | Login sebagai **Admin** dan cek menu **Data Siswa**           |
| 7                  | Cari siswa yang bersangkutan dan verifikasi total poin bertambah |
| 8                  | Cek **Audit Log** untuk memastikan tindakan tercatat          |
| **Hasil Diharapkan** | Poin siswa bertambah sesuai bobot, status DIIZINKAN, data muncul di dashboard guru piket, dan audit log mencatat tindakan |
| **Status**         | ☐ LULUS / ☐ GAGAL                                            |
| **Catatan**        |                                                               |

---

## TC-04: Terbitkan dan Cetak Slip Surat Izin Masuk Kelas Digital

| Item               | Detail                                                        |
| ------------------ | ------------------------------------------------------------- |
| **Prasyarat**      | TC-02 sudah lulus                                             |
| **Langkah Uji**    |                                                               |
| 1                  | Dari Dashboard Guru Piket, klik icon surat izin (📄) pada baris keterlambatan yang baru saja dicatat |
| 2                  | Verifikasi halaman Surat Izin Masuk Kelas tampil dengan format resmi |
| 3                  | Verifikasi surat memuat: nomor referensi, data siswa (Nama, NISN, Kelas), detail keterlambatan (tanggal, jam masuk, menit telat, alasan, sanksi, poin), catatan untuk guru pengajar, kolom tanda tangan |
| 4                  | Klik tombol **Cetak Surat Izin**                              |
| 5                  | Verifikasi preview cetak browser menampilkan surat dengan rapi (sidebar dan tombol tersembunyi) |
| 6                  | Verifikasi footer surat menampilkan waktu cetak dan keterangan elektronik |
| **Hasil Diharapkan** | Surat izin tercetak dalam format resmi, rapi, dan memuat seluruh informasi yang diperlukan. Layout cetak bersih tanpa elemen navigasi |
| **Status**         | ☐ LULUS / ☐ GAGAL                                            |
| **Catatan**        |                                                               |

---

## TC-05: Siswa Login dan Melihat Histori serta Akumulasi Poin Terbaru

| Item               | Detail                                                        |
| ------------------ | ------------------------------------------------------------- |
| **Prasyarat**      | TC-02 dan TC-03 sudah lulus                                   |
| **Langkah Uji**    |                                                               |
| 1                  | Logout dari akun Guru Piket                                   |
| 2                  | Login sebagai Siswa: Username = `siswa`, Password = `password123` |
| 3                  | Verifikasi Dashboard Siswa menampilkan **nama**, **kelas**, dan **NISN** yang benar |
| 4                  | Verifikasi card **Total Keterlambatan** menunjukkan jumlah yang bertambah |
| 5                  | Verifikasi card **Akumulasi Poin** menunjukkan poin terbaru   |
| 6                  | Verifikasi **Meter Poin Pelanggaran** (progress bar) sesuai   |
| 7                  | Jika poin >= 50, verifikasi muncul **peringatan otomatis**    |
| 8                  | Klik menu **Riwayat Pelanggaran** di sidebar                  |
| 9                  | Verifikasi catatan keterlambatan terbaru (dari TC-02) muncul di tabel |
| 10                 | Klik menu **Status Surat Izin**                               |
| 11                 | Verifikasi surat izin terbaru muncul dengan status **DIIZINKAN** (badge hijau) |
| 12                 | Klik **Lihat Surat Izin** untuk melihat detail surat         |
| **Hasil Diharapkan** | Siswa dapat melihat seluruh riwayat keterlambatan, akumulasi poin diperbarui, peringatan otomatis muncul jika mendekati batas, dan surat izin terlihat dengan status yang benar |
| **Status**         | ☐ LULUS / ☐ GAGAL                                            |
| **Catatan**        |                                                               |

---

## Skenario Pengujian Tambahan (Opsional)

### TC-06: Pengujian RBAC (Akses Ditolak)

| Item               | Detail                                                        |
| ------------------ | ------------------------------------------------------------- |
| **Langkah Uji**    | Login sebagai Siswa, lalu akses URL `/admin/dashboard` secara manual di browser |
| **Hasil Diharapkan** | Sistem menampilkan halaman 403 Forbidden                     |
| **Status**         | ☐ LULUS / ☐ GAGAL                                            |

### TC-07: CRUD Data Kelas oleh Admin

| Item               | Detail                                                        |
| ------------------ | ------------------------------------------------------------- |
| **Langkah Uji**    | Login sebagai Admin → Data Kelas → Tambah kelas baru → Edit → Hapus |
| **Hasil Diharapkan** | Semua operasi CRUD berhasil dengan notifikasi sukses         |
| **Status**         | ☐ LULUS / ☐ GAGAL                                            |

### TC-08: CRUD Aturan Pelanggaran oleh Admin

| Item               | Detail                                                        |
| ------------------ | ------------------------------------------------------------- |
| **Langkah Uji**    | Login sebagai Admin → Aturan Pelanggaran → Tambah → Edit → Hapus |
| **Hasil Diharapkan** | Semua operasi CRUD berhasil                                  |
| **Status**         | ☐ LULUS / ☐ GAGAL                                            |

---

## Ringkasan Hasil Pengujian

| No  | Skenario                                    | Status           |
| --- | ------------------------------------------- | ---------------- |
| 1   | Login Guru Piket + Cari Siswa               | ☐ LULUS / ☐ GAGAL |
| 2   | Input Keterlambatan 20 Menit                | ☐ LULUS / ☐ GAGAL |
| 3   | Otomatis Tambah Poin + Ubah Status          | ☐ LULUS / ☐ GAGAL |
| 4   | Cetak Slip Surat Izin Digital               | ☐ LULUS / ☐ GAGAL |
| 5   | Siswa Lihat Histori + Poin Diperbarui       | ☐ LULUS / ☐ GAGAL |

**Catatan Umum:**  
_____________________________________________________________

**Tanda Tangan Penguji:**  
_____________________________________________________________

**Tanggal:**  
_____________________________________________________________
