const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── View Engine Setup ───
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// ─── Middleware ───
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// ─── Session ───
app.use(
  session({
    secret: 'sistem-piket-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 jam
  })
);

// ─── Flash Messages ───
app.use(flash());

// ─── Global Variables (tersedia di semua view) ───
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.moment = require('moment');
  next();
});

// ─── Routes ───
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const guruPiketRoutes = require('./routes/guruPiketRoutes');
const siswaRoutes = require('./routes/siswaRoutes');

app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/guru-piket', guruPiketRoutes);
app.use('/siswa', siswaRoutes);

// ─── Root redirect ───
app.get('/', (req, res) => {
  if (req.session.user) {
    const role = req.session.user.role;
    if (role === 'ADMIN') return res.redirect('/admin/dashboard');
    if (role === 'GURU_PIKET') return res.redirect('/guru-piket/dashboard');
    if (role === 'SISWA') return res.redirect('/siswa/dashboard');
  }
  res.redirect('/login');
});

// ─── 404 Handler ───
app.use((req, res) => {
  res.status(404).render('errors/404', {
    title: '404 - Halaman Tidak Ditemukan',
    layout: 'layouts/main',
  });
});

// ─── Error Handler ───
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('errors/500', {
    title: '500 - Kesalahan Server',
    layout: 'layouts/main',
  });
});

// ─── Start Server ───
app.listen(PORT, () => {
  console.log(`\n🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`📌 Login: http://localhost:${PORT}/login\n`);
});

module.exports = app;
