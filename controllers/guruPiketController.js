const { PrismaClient } = require('@prisma/client');
const moment = require('moment');

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════
// DASHBOARD GURU PIKET
// ═══════════════════════════════════════════════════
exports.dashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const terlambatHariIni = await prisma.lateRecord.findMany({
      where: { tanggal: { gte: today, lt: tomorrow } },
      include: {
        student: { include: { class: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalHariIni = terlambatHariIni.length;
    const menunggu = terlambatHariIni.filter((r) => r.statusIzin === 'MENUNGGU').length;
    const diizinkan = terlambatHariIni.filter((r) => r.statusIzin === 'DIIZINKAN').length;

    const rules = await prisma.violationRule.findMany({ orderBy: { bobotPoin: 'asc' } });

    res.render('guru-piket/dashboard', {
      title: 'Dashboard Guru Piket',
      terlambatHariIni,
      totalHariIni,
      menunggu,
      diizinkan,
      rules,
      today: moment().format('dddd, DD MMMM YYYY'),
    });
  } catch (error) {
    console.error('Guru piket dashboard error:', error);
    req.flash('error', 'Gagal memuat dashboard');
    res.redirect('/login');
  }
};

// ═══════════════════════════════════════════════════
// CARI SISWA
// ═══════════════════════════════════════════════════
exports.searchStudent = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }

    const students = await prisma.student.findMany({
      where: {
        OR: [
          { nama: { contains: q } },
          { nisn: { contains: q } },
        ],
      },
      include: { class: true },
      take: 10,
    });

    res.json(students);
  } catch (error) {
    console.error('Search student error:', error);
    res.json([]);
  }
};

// ═══════════════════════════════════════════════════
// INPUT KETERLAMBATAN
// ═══════════════════════════════════════════════════
exports.inputLatePage = async (req, res) => {
  try {
    const rules = await prisma.violationRule.findMany({ orderBy: { bobotPoin: 'asc' } });
    const students = await prisma.student.findMany({
      include: { class: true },
      orderBy: { nama: 'asc' },
    });

    // Jika ada studentId di query (dari pencarian)
    let selectedStudent = null;
    if (req.query.studentId) {
      selectedStudent = await prisma.student.findUnique({
        where: { id: parseInt(req.query.studentId) },
        include: { class: true },
      });
    }

    res.render('guru-piket/inputLate', {
      title: 'Input Keterlambatan - Guru Piket',
      rules,
      students,
      selectedStudent,
    });
  } catch (error) {
    console.error('Input late page error:', error);
    req.flash('error', 'Gagal memuat halaman');
    res.redirect('/guru-piket/dashboard');
  }
};

exports.createLateRecord = async (req, res) => {
  try {
    const { studentId, jamMasuk, menitTelat, alasan, sanksi, poinDiberikan } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Buat record keterlambatan
    const record = await prisma.lateRecord.create({
      data: {
        studentId: parseInt(studentId),
        tanggal: today,
        jamMasuk,
        menitTelat: parseInt(menitTelat),
        alasan,
        sanksi: sanksi || null,
        statusIzin: 'DIIZINKAN',
        poinDiberikan: parseInt(poinDiberikan) || 0,
        guruPiketId: req.session.user.id,
      },
    });

    // Update total poin siswa
    if (parseInt(poinDiberikan) > 0) {
      await prisma.student.update({
        where: { id: parseInt(studentId) },
        data: { totalPoin: { increment: parseInt(poinDiberikan) } },
      });
    }

    // Ambil nama siswa untuk audit log
    const student = await prisma.student.findUnique({ where: { id: parseInt(studentId) } });

    // Buat audit log
    await prisma.auditLog.create({
      data: {
        userId: req.session.user.id,
        action: 'CATAT_TERLAMBAT',
        description: `Mencatat keterlambatan ${student.nama} - ${menitTelat} menit. Alasan: ${alasan}`,
        targetInfo: `${student.nama} (${student.nisn})`,
      },
    });

    req.flash('success', `Keterlambatan ${student.nama} berhasil dicatat. Surat izin masuk kelas diterbitkan.`);
    res.redirect(`/guru-piket/surat-izin/${record.id}`);
  } catch (error) {
    console.error('Create late record error:', error);
    req.flash('error', 'Gagal mencatat keterlambatan');
    res.redirect('/guru-piket/input-terlambat');
  }
};

// ═══════════════════════════════════════════════════
// SURAT IZIN MASUK KELAS
// ═══════════════════════════════════════════════════
exports.suratIzin = async (req, res) => {
  try {
    const record = await prisma.lateRecord.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        student: { include: { class: true } },
        guruPiket: true,
      },
    });

    if (!record) {
      req.flash('error', 'Data tidak ditemukan');
      return res.redirect('/guru-piket/dashboard');
    }

    res.render('guru-piket/suratIzin', {
      title: 'Surat Izin Masuk Kelas',
      record,
      printMode: req.query.print === 'true',
    });
  } catch (error) {
    console.error('Surat izin error:', error);
    req.flash('error', 'Gagal memuat surat izin');
    res.redirect('/guru-piket/dashboard');
  }
};

// ═══════════════════════════════════════════════════
// REKAP PIKET HARIAN & MINGGUAN
// ═══════════════════════════════════════════════════
exports.rekap = async (req, res) => {
  try {
    const { periode, tanggal } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate, endDate, periodeLabel;

    if (periode === 'mingguan') {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
      endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 1);
      periodeLabel = 'Mingguan (7 Hari Terakhir)';
    } else if (tanggal) {
      startDate = new Date(tanggal);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      periodeLabel = `Harian - ${moment(startDate).format('DD MMMM YYYY')}`;
    } else {
      startDate = today;
      endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 1);
      periodeLabel = `Harian - ${moment(today).format('DD MMMM YYYY')}`;
    }

    const records = await prisma.lateRecord.findMany({
      where: {
        tanggal: { gte: startDate, lt: endDate },
      },
      include: {
        student: { include: { class: true } },
        guruPiket: true,
      },
      orderBy: { tanggal: 'asc' },
    });

    const totalPoin = records.reduce((sum, r) => sum + r.poinDiberikan, 0);
    const avgTelat = records.length > 0
      ? Math.round(records.reduce((sum, r) => sum + r.menitTelat, 0) / records.length)
      : 0;

    res.render('guru-piket/rekap', {
      title: 'Rekap Piket - Guru Piket',
      records,
      periodeLabel,
      periode: periode || 'harian',
      tanggal: tanggal || moment(today).format('YYYY-MM-DD'),
      totalPoin,
      avgTelat,
    });
  } catch (error) {
    console.error('Rekap error:', error);
    req.flash('error', 'Gagal memuat rekap');
    res.redirect('/guru-piket/dashboard');
  }
};

// ═══════════════════════════════════════════════════
// UPDATE STATUS IZIN
// ═══════════════════════════════════════════════════
exports.updateStatusIzin = async (req, res) => {
  try {
    const { statusIzin } = req.body;
    await prisma.lateRecord.update({
      where: { id: parseInt(req.params.id) },
      data: { statusIzin },
    });
    req.flash('success', 'Status izin berhasil diperbarui');
    res.redirect('/guru-piket/dashboard');
  } catch (error) {
    console.error('Update status error:', error);
    req.flash('error', 'Gagal memperbarui status');
    res.redirect('/guru-piket/dashboard');
  }
};
