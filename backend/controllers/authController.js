const authService = require('../services/authService');
const otpService = require('../services/otpService');

/**
 * تسجيل حساب جديد بالبريد وكلمة المرور واشترط موافقة الشروط
 */
async function register(req, res) {
  try {
    const { email, password, phone, termsAccepted } = req.body;

    if (!termsAccepted) {
      return res.status(400).json({
        ok: false,
        error: 'يجب موافقة المستخدم الواضحة والصريحة على الشروط وسياسة الخصوصية قبل إتمام التسجيل',
      });
    }

    const result = await authService.registerUser({ email, password, phone, termsAccepted });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
}

/**
 * تسجيل الدخول باستخدام البريد وكلمة المرور
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(401).json({ ok: false, error: err.message });
  }
}

/**
 * إرسال كود OTP جديد برقم الجوال
 */
async function sendOtp(req, res) {
  try {
    const { userId, phoneNumber } = req.body;
    const result = await otpService.generateAndSendOTP(userId, phoneNumber, '2fa_login');
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
}

/**
 * التحقق من كود الـ OTP بخطوتين (2FA) وتفعيل الجلسة تلقائياً
 */
async function verifyOtp(req, res) {
  try {
    const { phoneNumber, code } = req.body;
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await authService.verify2FAAndCreateSession({
      phoneNumber,
      code,
      userAgent,
      ipAddress,
    });

    // حفظ الجلسة في الكوكي
    req.session.sessionToken = result.sessionToken;
    req.session.isAdmin = true;
    req.session.user = result.user;

    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(401).json({ ok: false, error: err.message });
  }
}

/**
 * الاستعلام عن بيانات المستخدم الحالي للجلسة
 */
async function getMe(req, res) {
  try {
    const sessionToken = req.session ? req.session.sessionToken : null;
    if (!sessionToken && !req.session.isAdmin) {
      return res.status(401).json({ authenticated: false });
    }

    const sessionData = await authService.validateSession(sessionToken);
    res.json({
      authenticated: true,
      user: req.session.user || (sessionData ? sessionData.user : null) || { email: 'admin@panel.local' },
    });
  } catch (err) {
    res.status(500).json({ authenticated: false, error: err.message });
  }
}

/**
 * تسجيل الخروج وإنهاء الجلسة
 */
async function logout(req, res) {
  try {
    if (req.session && req.session.sessionToken) {
      await authService.destroySession(req.session.sessionToken);
    }
    req.session = null;
    res.json({ ok: true, message: 'تم تسجيل الخروج بنجاح' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

module.exports = {
  register,
  login,
  sendOtp,
  verifyOtp,
  getMe,
  logout,
};
