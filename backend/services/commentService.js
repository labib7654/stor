// التعليقات على المنتجات - كل استعلومات جدول comments هنا فقط

const supabase = require('../config/supabase');
const TABLE = 'comments';

async function listByProduct(productId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

async function getById(id) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

async function create({ productId, visitorId, name, text, parentCommentId = null }) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ product_id: productId, visitor_id: visitorId, name, text, parent_comment_id: parentCommentId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function remove(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
  return true;
}

// لِلوحة التحكم - كل التعليقات مع اسم المنتج واسم صاحب التعليق الأصلي (لو رد)، لِلمراجعة والحذف
async function listAll() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*, products(name), parent:parent_comment_id(name)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data;
}

module.exports = { listByProduct, getById, create, remove, listAll };
