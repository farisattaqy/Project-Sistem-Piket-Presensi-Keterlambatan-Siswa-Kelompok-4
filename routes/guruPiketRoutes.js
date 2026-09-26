const express = require('express');
const router = express.Router();
const guruPiketController = require('../controllers/guruPiketController');
const { isAuthenticated, authorizeRole } = require('../middlewares/auth');

// Semua route guru piket dilindungi middleware
router.use(isAuthenticated, authorizeRole('GURU_PIKET'));

// Dashboard
router.get('/dashboard', guruPiketController.dashboard);

// Cari Siswa (AJAX)
router.get('/search-student', guruPiketController.searchStudent);

// Input Keterlambatan
router.get('/input-terlambat', guruPiketController.inputLatePage);
router.post('/input-terlambat', guruPiketController.createLateRecord);

// Surat Izin Masuk Kelas
router.get('/surat-izin/:id', guruPiketController.suratIzin);

// Update Status Izin
router.post('/status-izin/:id', guruPiketController.updateStatusIzin);

// Rekap Piket
router.get('/rekap', guruPiketController.rekap);

module.exports = router;
