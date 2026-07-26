// أي راوت يحتاج تسجيل دخول يمر من هنا قبل ما يوصل للكنترولر

function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول' });
  }
  return res.redirect('/login.html');
}

module.exports = { requireAuth };
