// إعجابات المنتجات - "وش أعجبه" الزائر - جدول product_likes

const supabase = require('../config/supabase');
const TABLE = 'product_likes';

async function toggleLike(productId, visitorId) {
  const { data: existing } = await supabase
    .from(TABLE)
    .select('*')
    .eq('product_id', productId)
    .eq('visitor_id', visitorId)
    .maybeSingle();

  if (existing) {
    await supabase.from(TABLE).delete().eq('product_id', productId).eq('visitor_id', visitorId);
    return { liked: false };
  }

  await supabase.from(TABLE).insert({ product_id: productId, visitor_id: visitorId });
  return { liked: true };
}

async function countForProduct(productId) {
  const { count, error } = await supabase
    .from(TABLE)
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId);
  if (error) throw error;
  return count || 0;
}

module.exports = { toggleLike, countForProduct };
