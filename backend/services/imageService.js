// رفع صور المنتجات لـ Supabase Storage (bucket: product-images)
// لازم تجهّز الـ bucket أول - شوف الخطوات بـ README.md

const supabase = require('../config/supabase');
const BUCKET = 'product-images';

async function uploadProductImage(file) {
  const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
  const path = `products/${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

module.exports = { uploadProductImage };
