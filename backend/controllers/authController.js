const authService = require('../services/authService');

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const valid = await authService.verifyCredentials(email, password);
    if (!valid) {
      return res.status(401).json({ error: 'الإيميل أو كلمة المرور غير صحيحة' });
    }
    req.session.isAdmin = true;
    req.session.email = email;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function logout(req, res) {
  req.session = null;
  res.json({ ok: true });
}

module.exports = { login, logout };
