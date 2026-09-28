const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ─── Halaman Login ───
exports.loginPage = (req, res) => {
  if (req.session.user) {
    return redirectByRole(req, res);
  }
  res.render('auth/login', {
    title: 'Login - Sistem Piket',
    layout: false,
  });
};

// ─── Proses Login ───
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      req.flash('error', 'Username tidak ditemukan');
      return res.redirect('/login');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash('error', 'Password salah');
      return res.redirect('/login');
    }

    // Simpan session
    req.session.user = {
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
      nisn: user.nisn,
    };

    req.flash('success', `Selamat datang, ${user.nama}!`);
    return redirectByRole(req, res);
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'Terjadi kesalahan saat login');
    return res.redirect('/login');
  }
};

// ─── Logout ───
exports.logout = (req, res) => {
  if (req.session && typeof req.session.destroy === 'function') {
    req.session.destroy((err) => {
      if (err) console.error('Logout error:', err);
      res.redirect('/login');
    });
  } else {
    req.session = null;
    res.redirect('/login');
  }
};

// ─── Helper: Redirect berdasarkan role ───
function redirectByRole(req, res) {
  const role = req.session.user.role;
  if (role === 'ADMIN') return res.redirect('/admin/dashboard');
  if (role === 'GURU_PIKET') return res.redirect('/guru-piket/dashboard');
  if (role === 'SISWA') return res.redirect('/siswa/dashboard');
  return res.redirect('/login');
}
