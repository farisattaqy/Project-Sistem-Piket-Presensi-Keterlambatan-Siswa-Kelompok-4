const express = require('express');
const router = express.Router();
const siswaController = require('../controllers/siswaController');
const { isAuthenticated, authorizeRole } = require('../middlewares/auth');

// Semua route siswa dilindungi middleware
router.use(isAuthenticated, authorizeRole('SISWA'));

// Dashboard
router.get('/dashboard', siswaController.dashboard);

// Riwayat Pelanggaran
router.get('/riwayat', siswaController.riwayat);

// Status Surat Izin
router.get('/surat-izin', siswaController.suratIzin);
router.get('/surat-izin/:id', siswaController.detailSuratIzin);

module.exports = router;
