// إشعارات خاصة لكل زبون (بالـ visitor_id - بدون تسجيل دخول)
// تتولد تلقائيًا لما حد يرد على تعليقه أو لما يتغير حالة طلبه

const supabase = require('../config/supabase');
const TABLE = 'notifications';

// ينشئ إشعار لزائر معيّن. لو ما فيه visitorId نتجاهل بهدوء (مو كل تعليق/طلب مربوط بزائر معروف)
async function create({ visitorId, type, title, message, relatedType = null, relatedId = null }) {
  if (!visitorId) return null;
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      visitor_id: visitorId,
      type,
      title,
      message,
      related_type: relatedType,
      related_id: relatedId != null ? String(relatedId) : null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function listForVisitor(visitorId, { limit = 30 } = {}) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('visitor_id', visitorId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

async function unreadCount(visitorId) {
  const { count, error } = await supabase
    .from(TABLE)
    .select('*', { count: 'exact', head: true })
    .eq('visitor_id', visitorId)
    .eq('is_read', false);
  if (error) throw error;
  return count || 0;
}

async function markRead(id, visitorId) {
  const { error } = await supabase.from(TABLE).update({ is_read: true }).eq('id', id).eq('visitor_id', visitorId);
  if (error) throw error;
  return true;
}

async function markAllRead(visitorId) {
  const { error } = await supabase
    .from(TABLE)
    .update({ is_read: true })
    .eq('visitor_id', visitorId)
    .eq('is_read', false);
  if (error) throw error;
  return true;
}

module.exports = { create, listForVisitor, unreadCount, markRead, markAllRead };
