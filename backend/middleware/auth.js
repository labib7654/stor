const authService = require('../services/authService');

async function requireAuth(req, res, next) {
  // 1. التحقق من وجود جلسة صالحة بـ sessionCookie أو sessionToken
  if (req.session && (req.session.isAdmin || req.session.user)) {
    return next();
  }

  if (req.session && req.session.sessionToken) {
    const valid = await authService.validateSession(req.session.sessionToken);
    if (valid) {
      req.session.user = valid.user;
      return next();
    }
  }

  // 2. إذا كان الطلب استدعاء API يُرجع خطأ 401
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ ok: false, error: 'يجب تسجيل الدخول أولاً' });
  }

  // 3. التحويل لصفحة تسجيل الدخول للوحة التحكم
  return res.redirect('/admin/login.html');
}

module.exports = { requireAuth };
