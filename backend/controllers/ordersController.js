const orderService = require('../services/orderService');
const notificationService = require('../services/notificationService');

async function index(req, res) {
  try {
    const { status } = req.query;
    res.json(await orderService.listOrders({ status }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

const STATUS_LABELS = { confirmed: '✅ تم تأكيد طلبك', cancelled: '❌ تم إلغاء طلبك' };

async function updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(id, status);

    if (order.visitor_id && STATUS_LABELS[status]) {
      try {
        await notificationService.create({
          visitorId: order.visitor_id,
          type: 'order_status',
          title: STATUS_LABELS[status],
          message: `طلبك رقم #${order.id}`,
          relatedType: 'order',
          relatedId: order.id,
        });
      } catch (_) {
        // فشل الإشعار ثانوي - ما نكسر تحديث حالة الطلب بسببه
      }
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { index, updateStatus };
