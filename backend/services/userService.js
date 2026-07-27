// كل استعلامات جدول المستخدمين تعيش هنا فقط
// عدّل اسم الجدول/الأعمدة تحت لو جدولك بأسماء مختلفة

const supabase = require('../config/supabase');

const TABLE = 'users'; // غيّرها لاسم جدولك الفعلي إذا مختلف

async function listUsers({ page = 1, pageSize = 25, search = '' } = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from(TABLE).select('*', { count: 'exact' }).range(from, to);
  if (search) {
    // telegram_id عمود bigint - لو حطينا نص فيه حروف بـ telegram_id.eq بيرمي خطأ من Postgres
    // ويكسر الطلب كامل (يرجع 500 بدل النتائج). نتحقق إنه رقم قبل ما نضيفه للشرط
    const isNumeric = /^\d+$/.test(search.trim());
    query = isNumeric
      ? query.or(`username.ilike.%${search}%,telegram_id.eq.${search}`)
      : query.ilike('username', `%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count };
}

async function getUserByTelegramId(telegramId) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('telegram_id', telegramId).single();
  if (error) throw error;
  return data;
}

async function banUser(telegramId, reason = '') {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ is_banned: true, ban_reason: reason, banned_at: new Date().toISOString() })
    .eq('telegram_id', telegramId)
    .select();
  if (error) throw error;
  return data;
}

async function unbanUser(telegramId) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ is_banned: false, ban_reason: null, banned_at: null })
    .eq('telegram_id', telegramId)
    .select();
  if (error) throw error;
  return data;
}

module.exports = {
  listUsers,
  getUserByTelegramId,
  banUser,
  unbanUser,
};
