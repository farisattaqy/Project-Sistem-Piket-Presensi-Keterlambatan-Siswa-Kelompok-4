const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════
exports.dashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Statistik
    const totalSiswa = await prisma.student.count();
    const totalKelas = await prisma.class.count();
    const terlambatHariIni = await prisma.lateRecord.count({
      where: { tanggal: { gte: today, lt: tomorrow } },
    });

    // 7 hari terakhir
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const terlambatMingguIni = await prisma.lateRecord.count({
      where: { tanggal: { gte: weekAgo } },
    });

    // Siswa dengan poin tertinggi
    const topPelanggaran = await prisma.student.findMany({
      orderBy: { totalPoin: 'desc' },
      take: 10,
      include: { class: true },
    });

    // Keterlambatan terbaru hari ini
    const recentLate = await prisma.lateRecord.findMany({
      where: { tanggal: { gte: today, lt: tomorrow } },
      include: {
        student: { include: { class: true } },
        guruPiket: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Trend per hari (7 hari terakhir)
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);
      const count = await prisma.lateRecord.count({
        where: { tanggal: { gte: d, lt: nextD } },
      });
      trendData.push({
        tanggal: d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
        jumlah: count,
      });
    }

    // Distribusi per kelas
    const classDistribution = await prisma.class.findMany({
      include: {
        students: {
          include: {
            lateRecords: {
              where: { tanggal: { gte: weekAgo } },
            },
          },
        },
      },
    });

    const kelasData = classDistribution.map((c) => ({
      namaKelas: c.namaKelas,
      jumlahTerlambat: c.students.reduce((sum, s) => sum + s.lateRecords.length, 0),
    }));

    res.render('admin/dashboard', {
      title: 'Dashboard Admin - Sistem Piket',
      totalSiswa,
      totalKelas,
      terlambatHariIni,
      terlambatMingguIni,
      topPelanggaran,
      recentLate,
      trendData,
      kelasData,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    req.flash('error', 'Gagal memuat dashboard');
    res.redirect('/login');
  }
};

// ═══════════════════════════════════════════════════
// CRUD SISWA
// ═══════════════════════════════════════════════════
exports.listStudents = async (req, res) => {
  try {
    const { search, classId } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { nisn: { contains: search } },
      ];
    }
    if (classId) {
      where.classId = parseInt(classId);
    }

    const students = await prisma.student.findMany({
      where,
      include: { class: true, user: true },
      orderBy: { nama: 'asc' },
    });
    const classes = await prisma.class.findMany({ orderBy: { namaKelas: 'asc' } });

    res.render('admin/students', {
      title: 'Kelola Siswa - Admin',
      students,
      classes,
      search: search || '',
      selectedClassId: classId || '',
    });
  } catch (error) {
    console.error('List students error:', error);
    req.flash('error', 'Gagal memuat data siswa');
    res.redirect('/admin/dashboard');
  }
};

exports.createStudentPage = async (req, res) => {
  const classes = await prisma.class.findMany({ orderBy: { namaKelas: 'asc' } });
  res.render('admin/studentForm', {
    title: 'Tambah Siswa - Admin',
    student: null,
    classes,
    isEdit: false,
  });
};

exports.createStudent = async (req, res) => {
  try {
    const { nisn, nama, classId, username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password || 'password123', 10);

    const user = await prisma.user.create({
      data: {
        username: username || nisn,
        password: hashedPassword,
        nama,
        role: 'SISWA',
        nisn,
      },
    });

    await prisma.student.create({
      data: {
        userId: user.id,
        nisn,
        nama,
        classId: parseInt(classId),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.session.user.id,
        action: 'TAMBAH_SISWA',
        description: `Menambahkan siswa baru: ${nama} (${nisn})`,
        targetInfo: `${nama} (${nisn})`,
      },
    });

    req.flash('success', `Siswa ${nama} berhasil ditambahkan`);
    res.redirect('/admin/students');
  } catch (error) {
    console.error('Create student error:', error);
    if (error.code === 'P2002') {
      req.flash('error', 'NISN atau username sudah terdaftar');
    } else {
      req.flash('error', 'Gagal menambahkan siswa');
    }
    res.redirect('/admin/students/create');
  }
};

exports.editStudentPage = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { user: true, class: true },
    });
    const classes = await prisma.class.findMany({ orderBy: { namaKelas: 'asc' } });
    if (!student) {
      req.flash('error', 'Siswa tidak ditemukan');
      return res.redirect('/admin/students');
    }
    res.render('admin/studentForm', {
      title: 'Edit Siswa - Admin',
      student,
      classes,
      isEdit: true,
    });
  } catch (error) {
    console.error('Edit student page error:', error);
    req.flash('error', 'Gagal memuat data siswa');
    res.redirect('/admin/students');
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { nisn, nama, classId, totalPoin } = req.body;
    const studentId = parseInt(req.params.id);

    const student = await prisma.student.update({
      where: { id: studentId },
      data: {
        nisn,
        nama,
        classId: parseInt(classId),
        totalPoin: parseInt(totalPoin) || 0,
      },
    });

    // Update user juga
    await prisma.user.update({
      where: { id: student.userId },
      data: { nama, nisn },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.session.user.id,
        action: 'EDIT_SISWA',
        description: `Mengubah data siswa: ${nama} (${nisn})`,
        targetInfo: `${nama} (${nisn})`,
      },
    });

    req.flash('success', `Data siswa ${nama} berhasil diperbarui`);
    res.redirect('/admin/students');
  } catch (error) {
    console.error('Update student error:', error);
    req.flash('error', 'Gagal memperbarui data siswa');
    res.redirect('/admin/students');
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const student = await prisma.student.findUnique({ where: { id: studentId } });

    if (student) {
      await prisma.student.delete({ where: { id: studentId } });
      await prisma.user.delete({ where: { id: student.userId } });

      await prisma.auditLog.create({
        data: {
          userId: req.session.user.id,
          action: 'HAPUS_SISWA',
          description: `Menghapus siswa: ${student.nama} (${student.nisn})`,
          targetInfo: `${student.nama} (${student.nisn})`,
        },
      });

      req.flash('success', `Siswa ${student.nama} berhasil dihapus`);
    }
    res.redirect('/admin/students');
  } catch (error) {
    console.error('Delete student error:', error);
    req.flash('error', 'Gagal menghapus siswa');
    res.redirect('/admin/students');
  }
};

// ═══════════════════════════════════════════════════
// CRUD KELAS
// ═══════════════════════════════════════════════════
exports.listClasses = async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      include: { _count: { select: { students: true } } },
      orderBy: { namaKelas: 'asc' },
    });
    res.render('admin/classes', {
      title: 'Kelola Kelas - Admin',
      classes,
    });
  } catch (error) {
    console.error('List classes error:', error);
    req.flash('error', 'Gagal memuat data kelas');
    res.redirect('/admin/dashboard');
  }
};

exports.createClass = async (req, res) => {
  try {
    const { namaKelas, waliKelas } = req.body;
    await prisma.class.create({ data: { namaKelas, waliKelas } });

    await prisma.auditLog.create({
      data: {
        userId: req.session.user.id,
        action: 'TAMBAH_KELAS',
        description: `Menambahkan kelas baru: ${namaKelas}`,
        targetInfo: namaKelas,
      },
    });

    req.flash('success', `Kelas ${namaKelas} berhasil ditambahkan`);
    res.redirect('/admin/classes');
  } catch (error) {
    console.error('Create class error:', error);
    req.flash('error', 'Gagal menambahkan kelas');
    res.redirect('/admin/classes');
  }
};

exports.updateClass = async (req, res) => {
  try {
    const { namaKelas, waliKelas } = req.body;
    await prisma.class.update({
      where: { id: parseInt(req.params.id) },
      data: { namaKelas, waliKelas },
    });
    req.flash('success', `Kelas ${namaKelas} berhasil diperbarui`);
    res.redirect('/admin/classes');
  } catch (error) {
    console.error('Update class error:', error);
    req.flash('error', 'Gagal memperbarui kelas');
    res.redirect('/admin/classes');
  }
};

exports.deleteClass = async (req, res) => {
  try {
    const classId = parseInt(req.params.id);
    const kelas = await prisma.class.findUnique({
      where: { id: classId },
      include: { _count: { select: { students: true } } },
    });
    if (kelas && kelas._count.students > 0) {
      req.flash('error', 'Tidak bisa menghapus kelas yang masih memiliki siswa');
      return res.redirect('/admin/classes');
    }
    if (kelas) {
      await prisma.class.delete({ where: { id: classId } });
      req.flash('success', `Kelas ${kelas.namaKelas} berhasil dihapus`);
    }
    res.redirect('/admin/classes');
  } catch (error) {
    console.error('Delete class error:', error);
    req.flash('error', 'Gagal menghapus kelas');
    res.redirect('/admin/classes');
  }
};

// ═══════════════════════════════════════════════════
// CRUD ATURAN PELANGGARAN
// ═══════════════════════════════════════════════════
exports.listRules = async (req, res) => {
  try {
    const rules = await prisma.violationRule.findMany({
      orderBy: { bobotPoin: 'asc' },
    });
    res.render('admin/rules', {
      title: 'Aturan Pelanggaran - Admin',
      rules,
    });
  } catch (error) {
    console.error('List rules error:', error);
    req.flash('error', 'Gagal memuat aturan pelanggaran');
    res.redirect('/admin/dashboard');
  }
};

exports.createRule = async (req, res) => {
  try {
    const { namaPelanggaran, bobotPoin, sanksiDefault } = req.body;
    await prisma.violationRule.create({
      data: { namaPelanggaran, bobotPoin: parseInt(bobotPoin), sanksiDefault },
    });
    req.flash('success', 'Aturan pelanggaran berhasil ditambahkan');
    res.redirect('/admin/rules');
  } catch (error) {
    console.error('Create rule error:', error);
    req.flash('error', 'Gagal menambahkan aturan');
    res.redirect('/admin/rules');
  }
};

exports.updateRule = async (req, res) => {
  try {
    const { namaPelanggaran, bobotPoin, sanksiDefault } = req.body;
    await prisma.violationRule.update({
      where: { id: parseInt(req.params.id) },
      data: { namaPelanggaran, bobotPoin: parseInt(bobotPoin), sanksiDefault },
    });
    req.flash('success', 'Aturan pelanggaran berhasil diperbarui');
    res.redirect('/admin/rules');
  } catch (error) {
    console.error('Update rule error:', error);
    req.flash('error', 'Gagal memperbarui aturan');
    res.redirect('/admin/rules');
  }
};

exports.deleteRule = async (req, res) => {
  try {
    await prisma.violationRule.delete({ where: { id: parseInt(req.params.id) } });
    req.flash('success', 'Aturan pelanggaran berhasil dihapus');
    res.redirect('/admin/rules');
  } catch (error) {
    console.error('Delete rule error:', error);
    req.flash('error', 'Gagal menghapus aturan');
    res.redirect('/admin/rules');
  }
};

// ═══════════════════════════════════════════════════
// AUDIT LOG
// ═══════════════════════════════════════════════════
exports.auditLog = async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.render('admin/auditLog', {
      title: 'Audit Log - Admin',
      logs,
    });
  } catch (error) {
    console.error('Audit log error:', error);
    req.flash('error', 'Gagal memuat audit log');
    res.redirect('/admin/dashboard');
  }
};
