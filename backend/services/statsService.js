// كل الأرقام والإحصائيات المعروضة بالصفحة الرئيسية تتجمع هنا
// عدّل أسماء الجداول تحت حسب قاعدتك

const supabase = require('../config/supabase');
const { getBotInfo } = require('./telegramService');

async function getOverview() {
  const [{ count: usersCount }, { count: bannedCount }, { count: ordersCount }] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_banned', true),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
  ]);

  let botStatus = 'offline';
  let botUsername = null;
  try {
    const me = await getBotInfo();
    botStatus = 'online';
    botUsername = me.username;
  } catch (_) {
    botStatus = 'offline';
  }

  return {
    usersCount: usersCount || 0,
    bannedCount: bannedCount || 0,
    ordersCount: ordersCount || 0,
    botStatus,
    botUsername,
  };
}

module.exports = { getOverview };
