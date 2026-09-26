const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Batas poin peringatan
const BATAS_PERINGATAN = 50;
const BATAS_KRITIS = 75;
const BATAS_MAKSIMAL = 100;

// ═══════════════════════════════════════════════════
// DASHBOARD SISWA
// ═══════════════════════════════════════════════════
exports.dashboard = async (req, res) => {
  try {
    const student = await prisma.student.findFirst({
      where: { userId: req.session.user.id },
      include: { class: true },
    });

    if (!student) {
      req.flash('error', 'Data siswa tidak ditemukan');
      return res.redirect('/login');
    }

    // Ambil 5 keterlambatan terakhir
    const recentLate = await prisma.lateRecord.findMany({
      where: { studentId: student.id },
      include: { guruPiket: true },
      orderBy: { tanggal: 'desc' },
      take: 5,
    });

    // Total keterlambatan
    const totalKeterlambatan = await prisma.lateRecord.count({
      where: { studentId: student.id },
    });

    // Rata-rata menit terlambat
    const allRecords = await prisma.lateRecord.findMany({
      where: { studentId: student.id },
    });
    const avgMenitTelat = allRecords.length > 0
      ? Math.round(allRecords.reduce((sum, r) => sum + r.menitTelat, 0) / allRecords.length)
      : 0;

    // Peringatan poin
    let warningLevel = null;
    let warningMessage = null;
    if (student.totalPoin >= BATAS_MAKSIMAL) {
      warningLevel = 'danger';
      warningMessage = `⚠️ PERINGATAN KERAS: Poin Anda telah mencapai ${student.totalPoin} poin (Batas maksimal: ${BATAS_MAKSIMAL}). Anda akan dikenakan sanksi berat berupa panggilan orang tua dan surat peringatan terakhir.`;
    } else if (student.totalPoin >= BATAS_KRITIS) {
      warningLevel = 'warning';
      warningMessage = `⚠️ PERINGATAN: Poin Anda telah mencapai ${student.totalPoin} poin (Batas kritis: ${BATAS_KRITIS}). Segera perbaiki kedisiplinan Anda. Sisa ${BATAS_MAKSIMAL - student.totalPoin} poin sebelum sanksi berat.`;
    } else if (student.totalPoin >= BATAS_PERINGATAN) {
      warningLevel = 'info';
      warningMessage = `ℹ️ PERHATIAN: Poin pelanggaran Anda telah mencapai ${student.totalPoin} poin. Tetap jaga kedisiplinan! Sisa ${BATAS_MAKSIMAL - student.totalPoin} poin sebelum batas maksimal.`;
    }

    res.render('siswa/dashboard', {
      title: 'Dashboard Siswa',
      student,
      recentLate,
      totalKeterlambatan,
      avgMenitTelat,
      warningLevel,
      warningMessage,
      BATAS_PERINGATAN,
      BATAS_KRITIS,
      BATAS_MAKSIMAL,
    });
  } catch (error) {
    console.error('Siswa dashboard error:', error);
    req.flash('error', 'Gagal memuat dashboard');
    res.redirect('/login');
  }
};

// ═══════════════════════════════════════════════════
// RIWAYAT PELANGGARAN
// ═══════════════════════════════════════════════════
exports.riwayat = async (req, res) => {
  try {
    const student = await prisma.student.findFirst({
      where: { userId: req.session.user.id },
      include: { class: true },
    });

    if (!student) {
      req.flash('error', 'Data siswa tidak ditemukan');
      return res.redirect('/login');
    }

    const records = await prisma.lateRecord.findMany({
      where: { studentId: student.id },
      include: { guruPiket: true },
      orderBy: { tanggal: 'desc' },
    });

    res.render('siswa/riwayat', {
      title: 'Riwayat Pelanggaran - Siswa',
      student,
      records,
    });
  } catch (error) {
    console.error('Riwayat error:', error);
    req.flash('error', 'Gagal memuat riwayat');
    res.redirect('/siswa/dashboard');
  }
};

// ═══════════════════════════════════════════════════
// CEK SURAT IZIN
// ═══════════════════════════════════════════════════
exports.suratIzin = async (req, res) => {
  try {
    const student = await prisma.student.findFirst({
      where: { userId: req.session.user.id },
    });

    if (!student) {
      req.flash('error', 'Data siswa tidak ditemukan');
      return res.redirect('/login');
    }

    const records = await prisma.lateRecord.findMany({
      where: { studentId: student.id },
      include: { guruPiket: true },
      orderBy: { tanggal: 'desc' },
    });

    res.render('siswa/suratIzin', {
      title: 'Status Surat Izin - Siswa',
      student,
      records,
    });
  } catch (error) {
    console.error('Surat izin siswa error:', error);
    req.flash('error', 'Gagal memuat surat izin');
    res.redirect('/siswa/dashboard');
  }
};

// ═══════════════════════════════════════════════════
// LIHAT DETAIL SURAT IZIN
// ═══════════════════════════════════════════════════
exports.detailSuratIzin = async (req, res) => {
  try {
    const student = await prisma.student.findFirst({
      where: { userId: req.session.user.id },
    });

    const record = await prisma.lateRecord.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        student: { include: { class: true } },
        guruPiket: true,
      },
    });

    if (!record || record.studentId !== student.id) {
      req.flash('error', 'Surat izin tidak ditemukan');
      return res.redirect('/siswa/surat-izin');
    }

    res.render('guru-piket/suratIzin', {
      title: 'Detail Surat Izin - Siswa',
      record,
      printMode: req.query.print === 'true',
    });
  } catch (error) {
    console.error('Detail surat izin error:', error);
    req.flash('error', 'Gagal memuat detail surat izin');
    res.redirect('/siswa/surat-izin');
  }
};
