const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, authorizeRole } = require('../middlewares/auth');

// Semua route admin dilindungi middleware
router.use(isAuthenticated, authorizeRole('ADMIN'));

// Dashboard
router.get('/dashboard', adminController.dashboard);

// CRUD Siswa
router.get('/students', adminController.listStudents);
router.get('/students/create', adminController.createStudentPage);
router.post('/students', adminController.createStudent);
router.get('/students/:id/edit', adminController.editStudentPage);
router.post('/students/:id', adminController.updateStudent);
router.post('/students/:id/delete', adminController.deleteStudent);

// CRUD Kelas
router.get('/classes', adminController.listClasses);
router.post('/classes', adminController.createClass);
router.post('/classes/:id', adminController.updateClass);
router.post('/classes/:id/delete', adminController.deleteClass);

// CRUD Aturan Pelanggaran
router.get('/rules', adminController.listRules);
router.post('/rules', adminController.createRule);
router.post('/rules/:id', adminController.updateRule);
router.post('/rules/:id/delete', adminController.deleteRule);

// Audit Log
router.get('/audit-log', adminController.auditLog);

module.exports = router;
