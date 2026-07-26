const authService = require('../services/authService');

async function requestCode(req, res) {
  try {
    const { telegramId } = req.body;
    await authService.requestLoginCode(telegramId);
    // نفس الرد سواء الآيدي صح أو غلط، عشان الأمان
    res.json({ ok: true, message: 'إذا الآيدي صحيح راح يوصلك كود على تيليجرام' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function verifyCode(req, res) {
  const { telegramId, code } = req.body;
  const valid = authService.verifyLoginCode(telegramId, code);
  if (!valid) {
    return res.status(401).json({ error: 'الكود غلط أو منتهي' });
  }
  req.session.isAdmin = true;
  req.session.telegramId = telegramId;
  res.json({ ok: true });
}

function logout(req, res) {
  req.session = null;
  res.json({ ok: true });
}

module.exports = { requestCode, verifyCode, logout };
