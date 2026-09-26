/**
 * Middleware: Cek apakah user sudah login
 */
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  req.flash('error', 'Silakan login terlebih dahulu');
  return res.redirect('/login');
}

/**
 * Middleware: Cek role user (RBAC)
 * @param  {...string} roles - Role yang diizinkan
 */
function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      req.flash('error', 'Silakan login terlebih dahulu');
      return res.redirect('/login');
    }
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).render('errors/403', {
        title: '403 - Akses Ditolak',
        layout: 'layouts/main',
      });
    }
    return next();
  };
}

module.exports = { isAuthenticated, authorizeRole };
