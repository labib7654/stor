// نظام دخول بإيميل + كلمة مرور لمطور واحد (الأدمن)
// كلمة المرور مخزنة كهاش bcrypt في متغير البيئة ADMIN_PASSWORD_HASH، مو نص عادي
// سوّي الهاش عبر: node scripts/hash-password.js "كلمة_المرور"

const bcrypt = require('bcryptjs');
const env = require('../config/env');

async function verifyCredentials(email, password) {
  if (!email || !password) return false;
  if (!env.adminPasswordHash) {
    console.warn('⚠️  ADMIN_PASSWORD_HASH غير موجود في .env - لا يمكن تسجيل الدخول');
    return false;
  }

  // نقارن الإيميل بشكل ثابت الوقت قدر الإمكان، ونتحقق من الباسورد بغض النظر
  // عن صحة الإيميل عشان ما نكشف (عبر فرق التوقيت) إذا الإيميل موجود أو لا
  const emailMatches = String(email).trim().toLowerCase() === String(env.adminEmail).trim().toLowerCase();
  const passwordMatches = await bcrypt.compare(password, env.adminPasswordHash);

  return emailMatches && passwordMatches;
}

module.exports = { verifyCredentials };
