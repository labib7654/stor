// كل شي هنا للزبائن العاديين بدون تسجيل دخول
// ما نرجع أي معلومة حساسة أو داخلية بالردود

const storeService = require('../services/storeService');
const orderService = require('../services/orderService');

async function listProducts(req, res) {
  try {
    const products = await storeService.listProducts();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'صار خطأ، حاول مرة ثانية' });
  }
}

async function createOrder(req, res) {
  try {
    const { customer_name, customer_phone, items } = req.body;

    if (!customer_name || !customer_phone || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'الطلب ناقص بيانات' });
    }

    const total = items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);

    const order = await orderService.createOrder({ customer_name, customer_phone, items, total });
    res.json({ ok: true, orderId: order.id });
  } catch (err) {
    res.status(500).json({ error: 'ما قدرنا نسجل الطلب، حاول مرة ثانية' });
  }
}

module.exports = { listProducts, createOrder };
