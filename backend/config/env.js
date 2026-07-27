// ملف واحد مسؤول عن قراءة كل متغيرات البيئة
// أي ملف ثاني يحتاج قيمة إعداد يجيبها من هنا، ما يقرأ process.env مباشرة

require('dotenv').config();

const required = ['BOT_TOKEN', 'ADMIN_TELEGRAM_ID', 'SUPABASE_URL', 'SUPABASE_KEY', 'ADMIN_EMAIL', 'ADMIN_PASSWORD_HASH'];

for (const key of required) {
  if (!process.env[key]) {
    console.warn(`⚠️  المتغير ${key} غير موجود في .env - بعض الميزات ما راح تشتغل`);
  }
}

module.exports = {
  botToken: process.env.BOT_TOKEN,
  adminTelegramId: process.env.ADMIN_TELEGRAM_ID,
  adminEmail: process.env.ADMIN_EMAIL,
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY,
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  port: process.env.PORT || 3000,
};
