// كل تعامل مع تيليجرام API يمر من هنا فقط
// لو احتجت تغيّر مكتبة البوت مستقبلًا، تعدل هذا الملف بس

const { Telegraf } = require('telegraf');
const env = require('../config/env');

const bot = new Telegraf(env.botToken);

/**
 * يرسل رسالة لمستخدم واحد بالآيدي
 */
async function sendMessageToUser(chatId, text) {
  return bot.telegram.sendMessage(chatId, text);
}

/**
 * يرسل رسالة جماعية لكل مستخدم في القائمة
 * يرجع تقرير: كم نجح وكم فشل (ومين)
 */
async function broadcastMessage(chatIds, text) {
  const results = { success: 0, failed: [] };

  for (const chatId of chatIds) {
    try {
      await bot.telegram.sendMessage(chatId, text);
      results.success += 1;
    } catch (err) {
      results.failed.push({ chatId, reason: err.message });
    }
    // تأخير بسيط عشان ما نضرب rate limit تيليجرام
    await new Promise((r) => setTimeout(r, 60));
  }

  return results;
}

/**
 * معلومات البوت نفسه (يفيد بصفحة الإحصائيات للتأكد إنه شغال)
 */
async function getBotInfo() {
  return bot.telegram.getMe();
}

module.exports = {
  bot,
  sendMessageToUser,
  broadcastMessage,
  getBotInfo,
};
