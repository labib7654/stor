const crypto = require('crypto');
const supabase = require('../config/supabase');
const otpService = require('./otpService');

let bcrypt;
try {
  bcrypt = require('bcryptjs');
} catch (e) {
  bcrypt = null;
}

const USERS_TABLE = 'users';
const SESSIONS_TABLE = 'sessions';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 ساعة

// ذاكرة احتياطية محلياً عند عدم ربط قاعدة البيانات
const memoryUsers = new Map(); // email -> user object
const memorySessions = new Map(); // token -> session object

/**
 * تشفير كلمة المرور بأمان بأعلى معايير الحماية (bcryptjs أو PBKDF2/Crypto)
 */
async function hashPassword(password) {
  if (bcrypt) {
    return await bcrypt.hash(password, 10);
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `pbkdf2:${salt}:${hash}`;
}

/**
 * مطابقة كلمة المرور المشفّرة
 */
async function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  if (bcrypt && storedHash.startsWith('$2')) {
    return await bcrypt.compare(password, storedHash);
  }
  if (storedHash.startsWith('pbkdf2:')) {
    const [, salt, hash] = storedHash.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }
  if (bcrypt) {
    return await bcrypt.compare(password, storedHash);
  }
  return false;
}

/**
 * تسجيل حساب جديد مع اشتراط الموافقة الصريحة على الشروط والسياسة
 */
async function registerUser({ email, password, phone, termsAccepted }) {
  // 1. التثبت من شرط الموافقة الواضحة والصريحة على الشروط وسياسة الخصوصية
  if (!termsAccepted) {
    throw new Error('يجب الموافقة الصريحة على الشروط وسياسة الخصوصية لإتمام التسجيل');
  }

  if (!email || !password || !phone) {
    throw new Error('جميع الحقول (البريد الإلكتروني، كلمة المرور، ورقم الجوال) مطلوبة');
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanPhone = String(phone).trim();

  if (password.length < 6) {
    throw new Error('كلمة المرور يجب أن لا تقل عن 6 أحرف');
  }

  // 2. تشفير كلمة المرور
  const passwordHash = await hashPassword(password);
  const userId = crypto.randomUUID();
  const now = new Date().toISOString();

  const newUser = {
    id: userId,
    email: cleanEmail,
    password_hash: passwordHash,
    phone_number: cleanPhone,
    is_2fa_enabled: true,
    terms_accepted: true,
    terms_accepted_at: now,
    created_at: now,
  };

  // 3. تخزين في Supabase أو الذاكرة المؤقتة
  try {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .insert([newUser])
      .select();

    if (error) {
      if (error.code === '23505') { // unique violation
        throw new Error('البريد الإلكتروني مسجّل بالفعل');
      }
      console.warn('⚠️ حفظ المستخدِم في Supabase واجه ملاحظة، سيتم الاعتماد على الذاكرة المحليّة:', error.message);
      memoryUsers.set(cleanEmail, newUser);
    }
  } catch (err) {
    if (err.message.includes('مسجّل بالفعل')) throw err;
    memoryUsers.set(cleanEmail, newUser);
  }

  // 4. توليد كود التحقق بخطوتين 2FA وإرساله تلقائياً
  const otpResult = await otpService.generateAndSendOTP(userId, cleanPhone, '2fa_registration');

  return {
    success: true,
    userId,
    email: cleanEmail,
    phoneNumber: cleanPhone,
    require2FA: true,
    otpCode: otpResult.code, // للتأكيد والتحقق الآلي في واجهة المستخدم
    message: 'تم إنشاء الحساب بنجاح. يرجى إدخال كود التحقق المرسل لرقم جوالك لتأكيد 2FA',
  };
}

/**
 * تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور
 */
async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new Error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
  }

  const cleanEmail = String(email).trim().toLowerCase();
  let user = null;

  // 1. البحث في Supabase
  try {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if (!error && data) {
      user = data;
    }
  } catch (err) {
    // تجاهل خطأ الاتصال
  }

  // البحث في الذاكرة المؤقتة
  if (!user && memoryUsers.has(cleanEmail)) {
    user = memoryUsers.get(cleanEmail);
  }

  if (!user) {
    throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  }

  // 2. التحقق من كلمة المرور المشفّرة
  const isMatch = await verifyPassword(password, user.password_hash);
  if (!isMatch) {
    throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  }

  if (user.is_banned) {
    throw new Error(`الحساب محظور: ${user.ban_reason || 'تواصل مع الإدارة'}`);
  }

  // 3. إذا كان نظام 2FA مفعلاً، يتم إرسال كود OTP
  const otpResult = await otpService.generateAndSendOTP(user.id, user.phone_number, '2fa_login');

  return {
    success: true,
    userId: user.id,
    email: user.email,
    phoneNumber: user.phone_number,
    require2FA: true,
    otpCode: otpResult.code, // كود للاختبار وتسهيل التحقق التلقائي
    message: 'تم إرسال كود التحقق 2FA إلى رقم الجوال، يرجى إدخال الكود لتسجيل الدخول',
  };
}

/**
 * التحقق من كود الـ OTP وإنشاء جلسة آمنة (Session Token)
 */
async function verify2FAAndCreateSession({ phoneNumber, code, userAgent, ipAddress }) {
  const otpCheck = await otpService.verifyOTP(phoneNumber, code);
  if (!otpCheck.success) {
    throw new Error(otpCheck.reason);
  }

  // البحث عن المستخدم بواسطة رقم الجوال
  const cleanPhone = String(phoneNumber).trim();
  let user = null;

  try {
    const { data } = await supabase
      .from(USERS_TABLE)
      .select('*')
      .eq('phone_number', cleanPhone)
      .limit(1);

    if (data && data.length > 0) user = data[0];
  } catch (e) {}

  if (!user) {
    for (const u of memoryUsers.values()) {
      if (u.phone_number === cleanPhone) {
        user = u;
        break;
      }
    }
  }

  const userId = user ? user.id : otpCheck.userId || crypto.randomUUID();
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  const sessionObj = {
    id: crypto.randomUUID(),
    user_id: userId,
    session_token: sessionToken,
    user_agent: userAgent || 'Unknown',
    ip_address: ipAddress || '127.0.0.1',
    expires_at: expiresAt,
  };

  // حفظ الجلسة في Supabase أو الذاكرة
  try {
    await supabase.from(SESSIONS_TABLE).insert([sessionObj]);
  } catch (e) {}
  memorySessions.set(sessionToken, { ...sessionObj, user });

  return {
    success: true,
    sessionToken,
    expiresAt,
    user: user ? { id: user.id, email: user.email, phone: user.phone_number } : null,
  };
}

/**
 * التحقق من صحة الجلسة (Session)
 */
async function validateSession(sessionToken) {
  if (!sessionToken) return null;

  // فحص الذاكرة
  const memSession = memorySessions.get(sessionToken);
  if (memSession) {
    if (new Date(memSession.expires_at) < new Date()) {
      memorySessions.delete(sessionToken);
      return null;
    }
    return memSession;
  }

  // فحص قاعدة البيانات
  try {
    const { data, error } = await supabase
      .from(SESSIONS_TABLE)
      .select('*, users(*)')
      .eq('session_token', sessionToken)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (!error && data) {
      return data;
    }
  } catch (e) {}

  return null;
}

/**
 * تدمير الجلسة عند الخروج
 */
async function destroySession(sessionToken) {
  if (!sessionToken) return;
  memorySessions.delete(sessionToken);
  try {
    await supabase.from(SESSIONS_TABLE).delete().eq('session_token', sessionToken);
  } catch (e) {}
}

module.exports = {
  registerUser,
  loginUser,
  verify2FAAndCreateSession,
  validateSession,
  destroySession,
};
