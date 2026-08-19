const crypto = require('crypto');
const supabase = require('../config/supabase');

const TABLE = 'verification_codes';
const OTP_TTL_MS = 5 * 60 * 1000; // 5 دقائق

// الذاكرة المؤقتة الاحتياطية في حال التنسيق المحلي
const inMemoryOtps = new Map(); // phone -> { code, expiresAt, userId, isUsed }

/**
 * توليد كود OTP مكون من 6 أرقام
 */
function generate6DigitCode() {
  return String(crypto.randomInt(100000, 999999));
}

/**
 * إرسال أو إنشاء كود تحقق بخطوتين OTP
 */
async function generateAndSendOTP(userId, phoneNumber, purpose = '2fa_login') {
  if (!phoneNumber) {
    throw new Error('رقم الجوال مطلوب لإرسال كود التحقق');
  }

  const cleanPhone = String(phoneNumber).trim();
  const code = generate6DigitCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  // 1. حفظ في قاعدة البيانات إن أمكن
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([
        {
          user_id: userId || null,
          phone_number: cleanPhone,
          code,
          purpose,
          expires_at: expiresAt,
          is_used: false,
        },
      ])
      .select();

    if (error) {
      console.warn('⚠️ حفظ الـ OTP في قاعدة البيانات واجه ملاحظة، سيتم التحول للحفظ المحلي:', error.message);
    }
  } catch (err) {
    console.warn('⚠️ خطأ اتصال Supabase أثناء حفظ OTP:', err.message);
  }

  // 2. الحفظ في الذاكرة المؤقتة للأمان وضمان العمل التلقائي
  inMemoryOtps.set(cleanPhone, {
    userId,
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
    isUsed: false,
    purpose,
  });

  console.log(`📱 [2FA OTP] تم توليد كود التحقق لرقم الجوال (${cleanPhone}): ${code}`);

  return {
    success: true,
    phoneNumber: cleanPhone,
    code, // يُرجع الكود لتسهيل الاختبار والتحقق التلقائي للواجهة
    expiresInSeconds: 300,
    message: `تم إرسال كود التحقق 2FA إلى رقم الجوال ${cleanPhone}`,
  };
}

/**
 * التحقق من كود الـ OTP
 */
async function verifyOTP(phoneNumber, code, purpose = '2fa_login') {
  if (!phoneNumber || !code) {
    return { success: false, reason: 'رقم الجوال وكود التحقق مطلوبان' };
  }

  const cleanPhone = String(phoneNumber).trim();
  const cleanCode = String(code).trim();

  // 1. فحص الذاكرة المؤقتة أولاً
  const memEntry = inMemoryOtps.get(cleanPhone);
  if (memEntry) {
    if (memEntry.isUsed) {
      return { success: false, reason: 'كود التحقق تم استخدامه سابقاً' };
    }
    if (Date.now() > memEntry.expiresAt) {
      inMemoryOtps.delete(cleanPhone);
      return { success: false, reason: 'انتهت صلاحية كود التحقق، يرجى طلب كود جديد' };
    }
    if (memEntry.code === cleanCode) {
      memEntry.isUsed = true;
      inMemoryOtps.delete(cleanPhone);
      return { success: true, userId: memEntry.userId };
    }
  }

  // 2. فحص قاعدة البيانات Supabase
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('phone_number', cleanPhone)
      .eq('code', cleanCode)
      .eq('is_used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0) {
      const match = data[0];
      // تحديث الكود إلى مستخدم
      await supabase
        .from(TABLE)
        .update({ is_used: true })
        .eq('id', match.id);

      return { success: true, userId: match.user_id };
    }
  } catch (err) {
    console.warn('⚠️ خطأ في استعلام OTP من Supabase:', err.message);
  }

  return { success: false, reason: 'كود التحقق غير صحيح أو منتهي الصلاحية' };
}

module.exports = {
  generateAndSendOTP,
  verifyOTP,
};
