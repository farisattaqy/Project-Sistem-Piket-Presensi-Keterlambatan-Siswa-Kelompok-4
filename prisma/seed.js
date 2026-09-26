const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai seeding database...\n');

  // ─── Hapus data lama ───
  await prisma.auditLog.deleteMany();
  await prisma.lateRecord.deleteMany();
  await prisma.student.deleteMany();
  await prisma.violationRule.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // ─── 1. Buat Kelas ───
  const classes = await Promise.all([
    prisma.class.create({ data: { namaKelas: 'X RPL 1', waliKelas: 'Ibu Sri Wahyuni, S.Pd' } }),
    prisma.class.create({ data: { namaKelas: 'X RPL 2', waliKelas: 'Bapak Agus Santoso, S.Kom' } }),
    prisma.class.create({ data: { namaKelas: 'XI RPL 1', waliKelas: 'Ibu Dewi Lestari, M.Pd' } }),
    prisma.class.create({ data: { namaKelas: 'XI RPL 2', waliKelas: 'Bapak Hendra Wijaya, S.T' } }),
    prisma.class.create({ data: { namaKelas: 'XII RPL 1', waliKelas: 'Ibu Rina Fitriani, S.Kom' } }),
    prisma.class.create({ data: { namaKelas: 'XII RPL 2', waliKelas: 'Bapak Dedi Kurniawan, M.Kom' } }),
  ]);
  console.log(`✅ ${classes.length} kelas berhasil dibuat`);

  // ─── 2. Buat User Admin ───
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      nama: 'Drs. Budi Hartono, M.Pd',
      role: 'ADMIN',
    },
  });
  console.log('✅ Akun Admin dibuat: admin / password123');

  // ─── 3. Buat User Guru Piket ───
  const guruPiket1 = await prisma.user.create({
    data: {
      username: 'gurupiket',
      password: hashedPassword,
      nama: 'Pak Ahmad Fauzi, S.Pd',
      role: 'GURU_PIKET',
    },
  });
  const guruPiket2 = await prisma.user.create({
    data: {
      username: 'gurupiket2',
      password: hashedPassword,
      nama: 'Ibu Siti Nurhaliza, S.Pd',
      role: 'GURU_PIKET',
    },
  });
  console.log('✅ Akun Guru Piket dibuat: gurupiket / password123');

  // ─── 4. Buat User Siswa + Profil Student ───
  const siswaData = [
    { username: 'siswa', nama: 'Andi Pratama', nisn: '0081234567', classIdx: 0 },
    { username: 'siswa2', nama: 'Budi Setiawan', nisn: '0081234568', classIdx: 0 },
    { username: 'siswa3', nama: 'Citra Dewi', nisn: '0081234569', classIdx: 1 },
    { username: 'siswa4', nama: 'Dina Fitriani', nisn: '0081234570', classIdx: 1 },
    { username: 'siswa5', nama: 'Eko Prasetyo', nisn: '0081234571', classIdx: 2 },
    { username: 'siswa6', nama: 'Fani Rahayu', nisn: '0081234572', classIdx: 2 },
    { username: 'siswa7', nama: 'Galih Permana', nisn: '0081234573', classIdx: 3 },
    { username: 'siswa8', nama: 'Hani Safitri', nisn: '0081234574', classIdx: 3 },
    { username: 'siswa9', nama: 'Irfan Hakim', nisn: '0081234575', classIdx: 4 },
    { username: 'siswa10', nama: 'Jihan Aulia', nisn: '0081234576', classIdx: 5 },
  ];

  const students = [];
  for (const s of siswaData) {
    const user = await prisma.user.create({
      data: {
        username: s.username,
        password: hashedPassword,
        nama: s.nama,
        role: 'SISWA',
        nisn: s.nisn,
      },
    });
    const student = await prisma.student.create({
      data: {
        userId: user.id,
        nisn: s.nisn,
        nama: s.nama,
        classId: classes[s.classIdx].id,
        totalPoin: 0,
      },
    });
    students.push(student);
  }
  console.log(`✅ ${students.length} akun Siswa dibuat (demo: siswa / password123)`);

  // ─── 5. Buat Aturan Pelanggaran ───
  const rules = await Promise.all([
    prisma.violationRule.create({
      data: { namaPelanggaran: 'Terlambat 1-15 menit', bobotPoin: 5, sanksiDefault: 'Teguran Lisan' },
    }),
    prisma.violationRule.create({
      data: { namaPelanggaran: 'Terlambat 16-30 menit', bobotPoin: 10, sanksiDefault: 'Bersihkan Halaman' },
    }),
    prisma.violationRule.create({
      data: { namaPelanggaran: 'Terlambat 31-60 menit', bobotPoin: 15, sanksiDefault: 'Bersihkan Toilet' },
    }),
    prisma.violationRule.create({
      data: { namaPelanggaran: 'Terlambat lebih dari 60 menit', bobotPoin: 25, sanksiDefault: 'Panggilan Orang Tua' },
    }),
    prisma.violationRule.create({
      data: { namaPelanggaran: 'Izin keluar tanpa keterangan jelas', bobotPoin: 10, sanksiDefault: 'Teguran Tertulis' },
    }),
    prisma.violationRule.create({
      data: { namaPelanggaran: 'Bolos pelajaran', bobotPoin: 20, sanksiDefault: 'Surat Peringatan 1' },
    }),
    prisma.violationRule.create({
      data: { namaPelanggaran: 'Tidak memakai seragam lengkap', bobotPoin: 5, sanksiDefault: 'Teguran Lisan' },
    }),
    prisma.violationRule.create({
      data: { namaPelanggaran: 'Membawa HP saat pelajaran', bobotPoin: 15, sanksiDefault: 'HP disita 3 hari' },
    }),
  ]);
  console.log(`✅ ${rules.length} aturan pelanggaran dibuat`);

  // ─── 6. Buat Data Keterlambatan Awal (realistis) ───
  const today = new Date();
  const lateRecordsData = [
    {
      studentId: students[0].id,
      tanggal: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2),
      jamMasuk: '07:25',
      menitTelat: 10,
      alasan: 'Ban sepeda bocor di jalan',
      sanksi: 'Teguran Lisan',
      statusIzin: 'DIIZINKAN',
      poinDiberikan: 5,
      guruPiketId: guruPiket1.id,
    },
    {
      studentId: students[0].id,
      tanggal: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
      jamMasuk: '07:35',
      menitTelat: 20,
      alasan: 'Hujan deras, banjir di jalan',
      sanksi: 'Bersihkan Halaman',
      statusIzin: 'DIIZINKAN',
      poinDiberikan: 10,
      guruPiketId: guruPiket1.id,
    },
    {
      studentId: students[1].id,
      tanggal: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
      jamMasuk: '07:45',
      menitTelat: 30,
      alasan: 'Kesiangan bangun tidur',
      sanksi: 'Bersihkan Halaman',
      statusIzin: 'DIIZINKAN',
      poinDiberikan: 10,
      guruPiketId: guruPiket2.id,
    },
    {
      studentId: students[2].id,
      tanggal: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      jamMasuk: '07:20',
      menitTelat: 5,
      alasan: 'Macet di jalan raya',
      sanksi: 'Teguran Lisan',
      statusIzin: 'DIIZINKAN',
      poinDiberikan: 5,
      guruPiketId: guruPiket1.id,
    },
    {
      studentId: students[3].id,
      tanggal: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      jamMasuk: '07:50',
      menitTelat: 35,
      alasan: 'Antar adik ke sekolah dulu',
      sanksi: 'Bersihkan Toilet',
      statusIzin: 'MENUNGGU',
      poinDiberikan: 15,
      guruPiketId: guruPiket1.id,
    },
    {
      studentId: students[4].id,
      tanggal: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3),
      jamMasuk: '07:30',
      menitTelat: 15,
      alasan: 'Angkot penuh, harus menunggu',
      sanksi: 'Teguran Lisan',
      statusIzin: 'DIIZINKAN',
      poinDiberikan: 5,
      guruPiketId: guruPiket2.id,
    },
    {
      studentId: students[5].id,
      tanggal: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5),
      jamMasuk: '08:15',
      menitTelat: 60,
      alasan: 'Sakit perut di rumah pagi hari',
      sanksi: 'Panggilan Orang Tua',
      statusIzin: 'DIIZINKAN',
      poinDiberikan: 25,
      guruPiketId: guruPiket1.id,
    },
    {
      studentId: students[6].id,
      tanggal: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      jamMasuk: '07:22',
      menitTelat: 7,
      alasan: 'Motor mogok di tengah jalan',
      sanksi: 'Teguran Lisan',
      statusIzin: 'DIIZINKAN',
      poinDiberikan: 5,
      guruPiketId: guruPiket2.id,
    },
  ];

  for (const lr of lateRecordsData) {
    await prisma.lateRecord.create({ data: lr });
    // Update total poin siswa
    await prisma.student.update({
      where: { id: lr.studentId },
      data: { totalPoin: { increment: lr.poinDiberikan } },
    });
  }
  console.log(`✅ ${lateRecordsData.length} data keterlambatan awal dibuat`);

  // ─── 7. Buat Audit Log Awal ───
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: 'SEED_DATA',
        description: 'Inisialisasi data awal sistem piket',
        targetInfo: 'System',
      },
      {
        userId: guruPiket1.id,
        action: 'CATAT_TERLAMBAT',
        description: 'Mencatat keterlambatan Andi Pratama - 10 menit',
        targetInfo: 'Andi Pratama (0081234567)',
      },
      {
        userId: guruPiket1.id,
        action: 'TERBIT_SURAT_IZIN',
        description: 'Menerbitkan surat izin masuk kelas untuk Andi Pratama',
        targetInfo: 'Andi Pratama (0081234567)',
      },
    ],
  });
  console.log('✅ Audit log awal dibuat');

  console.log('\n🎉 Seeding selesai! Database siap digunakan.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📌 Akun Demo:');
  console.log('   Admin     : admin / password123');
  console.log('   Guru Piket: gurupiket / password123');
  console.log('   Siswa     : siswa / password123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
