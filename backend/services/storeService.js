// كل استعلامات المنتجات (المتجر) هنا فقط

const supabase = require('../config/supabase');
const TABLE = 'products';

async function listProducts() {
  const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
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
