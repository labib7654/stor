// نظام دخول بسيط: نرسل كود مكوّن من 6 أرقام لآيدي المطور عبر البوت نفسه
// ما نحتاج نضيف باسورد أو Telegram Login Widget، البوت اللي عندك كافي

const env = require('../config/env');
const { sendMessageToUser } = require('./telegramService');

const pendingCodes = new Map(); // telegramId -> { code, expiresAt }
const CODE_TTL_MS = 5 * 60 * 1000; // 5 دقايق

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function requestLoginCode(telegramId) {
  if (String(telegramId) !== String(env.adminTelegramId)) {
    // ما نطلع رسالة خطأ توضح إنه الآيدي غلط، عشان ما نساعد أي حد يخمن
    return;
  }
  const code = generateCode();
  pendingCodes.set(String(telegramId), { code, expiresAt: Date.now() + CODE_TTL_MS });
  await sendMessageToUser(telegramId, `كود الدخول للوحة التحكم: ${code}\nصالح لمدة 5 دقايق.`);
}

function verifyLoginCode(telegramId, code) {
  const entry = pendingCodes.get(String(telegramId));
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    pendingCodes.delete(String(telegramId));
    return false;
  }
  const valid = entry.code === String(code) && String(telegramId) === String(env.adminTelegramId);
  if (valid) pendingCodes.delete(String(telegramId));
  return valid;
}

module.exports = { requestLoginCode, verifyLoginCode };
