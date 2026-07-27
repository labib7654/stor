// الأقسام (الفئات) اللي تنظم تحتها المنتجات - جدول categories

const supabase = require('../config/supabase');
const TABLE = 'categories';

async function listCategories() {
  const { data, error } = await supabase.from(TABLE).select('*').order('sort_order', { ascending: true }).order('id');
  if (error) throw error;
  return data;
}

async function createCategory(name) {
  const { data, error } = await supabase.from(TABLE).insert({ name }).select().single();
  if (error) throw error;
  return data;
}

async function renameCategory(id, name) {
  const { data, error } = await supabase.from(TABLE).update({ name }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// حذف قسم ما يمسح منتجاته - يرجعها بدون قسم (category_id يصير null تلقائيًا بسبب on delete set null)
async function deleteCategory(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
  return true;
}

module.exports = { listCategories, createCategory, renameCategory, deleteCategory };
