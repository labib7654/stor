// كل استعلامات المنتجات (المتجر) هنا فقط

const supabase = require('../config/supabase');
const TABLE = 'products';

async function listProducts() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*, product_likes(count), category:categories(id, name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  // نحول شكل العلاقات المتداخلة لحقول بسيطة عشان الواجهة
  return (data || []).map((p) => ({
    ...p,
    likes_count: p.product_likes?.[0]?.count || 0,
    category_name: p.category?.name || null,
    product_likes: undefined,
    category: undefined,
  }));
}

async function createProduct(product) {
  const { data, error } = await supabase.from(TABLE).insert(product).select().single();
  if (error) throw error;
  return data;
}

async function updateProduct(id, updates) {
  const { data, error } = await supabase.from(TABLE).update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

async function deleteProduct(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
  return true;
}

module.exports = { listProducts, createProduct, updateProduct, deleteProduct };
