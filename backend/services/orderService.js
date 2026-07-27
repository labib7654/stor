// كل استعلامات الطلبات هنا فقط

const supabase = require('../config/supabase');
const TABLE = 'orders';

async function listOrders({ status } = {}) {
  let query = supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function updateOrderStatus(id, status) {
  const { data, error } = await supabase.from(TABLE).update({ status }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

/**
 * يستخدمها الزبون من المتجر العام لإنشاء طلب جديد
 * items: [{ product_id, name, price, qty }]
 */
async function createOrder(order) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...order, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getOrderStatus(id) {
  const { data, error } = await supabase.from(TABLE).select('status').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

module.exports = { listOrders, updateOrderStatus, createOrder, getOrderStatus };
