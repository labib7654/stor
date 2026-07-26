// نقطة اتصال واحدة بقاعدة بيانات Supabase
// كل ملف يحتاج يتكلم مع القاعدة يستورد هذا الملف، ما يسوي createClient من جديد

const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

const supabase = createClient(env.supabaseUrl, env.supabaseKey);

module.exports = supabase;
