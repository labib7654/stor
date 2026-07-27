// كل شي هنا للزبائن العاديين بدون تسجيل دخول
// ما نرجع أي معلومة حساسة أو داخلية بالردود

const storeService = require('../services/storeService');
const orderService = require('../services/orderService');
const visitorService = require('../services/visitorService');
const commentService = require('../services/commentService');
const likeService = require('../services/likeService');
const notificationService = require('../services/notificationService');

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
    const { customer_name, customer_phone, items, visitorId } = req.body;

    if (!customer_name || !customer_phone || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'الطلب ناقص بيانات' });
    }

    const total = items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);

    const order = await orderService.createOrder({
      customer_name,
      customer_phone,
      items,
      total,
      visitor_id: visitorId || null,
    });
    res.json({ ok: true, orderId: order.id });
  } catch (err) {
    res.status(500).json({ error: 'ما قدرنا نسجل الطلب، حاول مرة ثانية' });
  }
}

// ===== تتبع الزوار (البصمة الرقمية) =====
async function trackVisit(req, res) {
  try {
    const { visitorId, entryPage, referrer, userAgent, language, screenRes, timezone } = req.body;
    if (!visitorId) return res.status(400).json({ error: 'ناقص معرف الزائر' });

    const visit = await visitorService.trackVisit({
      visitorId,
      entryPage,
      referrer,
      userAgent,
      language,
      screenRes,
      timezone,
    });
    res.json({ ok: true, visitId: visit.id });
  } catch (err) {
    res.status(500).json({ error: 'صار خطأ' });
  }
}

async function endVisit(req, res) {
  try {
    const { visitId, durationSeconds } = req.body;
    if (!visitId) return res.status(400).json({ error: 'ناقص معرف الزيارة' });
    await visitorService.endVisit(visitId, Math.max(0, Math.round(durationSeconds || 0)));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'صار خطأ' });
  }
}

// ===== التعليقات =====
async function getComments(req, res) {
  try {
    const comments = await commentService.listByProduct(req.params.productId);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'صار خطأ' });
  }
}

async function addComment(req, res) {
  try {
    const { productId, visitorId, name, text, parentCommentId } = req.body;
    if (!productId || !name || !name.trim() || !text || !text.trim()) {
      return res.status(400).json({ error: 'اكتب اسمك وتعليقك' });
    }

    // لو هذا رد على تعليق، نتأكد إنه موجود فعلًا وناخذ منه صاحبه عشان نبعثله إشعار
    let parent = null;
    if (parentCommentId) {
      parent = await commentService.getById(parentCommentId);
      if (!parent || String(parent.product_id) !== String(productId)) {
        return res.status(400).json({ error: 'التعليق اللي تحاول ترد عليه مو موجود' });
      }
    }

    const comment = await commentService.create({
      productId,
      visitorId,
      name: name.trim().slice(0, 40),
      text: text.trim().slice(0, 500),
      parentCommentId: parent ? parent.id : null,
    });

    // إشعار صاحب التعليق الأصلي (إلا لو رد على نفسه)
    if (parent && parent.visitor_id && String(parent.visitor_id) !== String(visitorId)) {
      try {
        await notificationService.create({
          visitorId: parent.visitor_id,
          type: 'comment_reply',
          title: `${comment.name} رد على تعليقك`,
          message: comment.text,
          relatedType: 'product',
          relatedId: productId,
        });
      } catch (_) {
        // فشل الإشعار ثانوي - ما نكسر حفظ الرد بسببه
      }
    }

    res.json({ ok: true, comment });
  } catch (err) {
    res.status(500).json({ error: 'ما قدرنا نحفظ التعليق' });
  }
}

// ===== الإعجاب بمنتج =====
async function toggleLike(req, res) {
  try {
    const { visitorId } = req.body;
    if (!visitorId) return res.status(400).json({ error: 'ناقص معرف الزائر' });
    const result = await likeService.toggleLike(req.params.id, visitorId);
    const count = await likeService.countForProduct(req.params.id);
    res.json({ ok: true, ...result, count });
  } catch (err) {
    res.status(500).json({ error: 'صار خطأ' });
  }
}

async function getOrderStatus(req, res) {
  try {
    const order = await orderService.getOrderStatus(req.params.id);
    if (!order) return res.status(404).json({ error: 'ما لقينا الطلب' });
    res.json({ status: order.status });
  } catch (err) {
    res.status(500).json({ error: 'صار خطأ' });
  }
}

// ===== إشعارات الزبون (خاصة بكل visitorId) =====
async function getNotifications(req, res) {
  try {
    const { visitorId } = req.params;
    const [items, unread] = await Promise.all([
      notificationService.listForVisitor(visitorId),
      notificationService.unreadCount(visitorId),
    ]);
    res.json({ items, unread });
  } catch (err) {
    res.status(500).json({ error: 'صار خطأ' });
  }
}

async function markNotificationRead(req, res) {
  try {
    const { visitorId, id } = req.params;
    await notificationService.markRead(id, visitorId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'صار خطأ' });
  }
}

async function markAllNotificationsRead(req, res) {
  try {
    const { visitorId } = req.params;
    await notificationService.markAllRead(visitorId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'صار خطأ' });
  }
}

module.exports = {
  listProducts,
  createOrder,
  getOrderStatus,
  trackVisit,
  endVisit,
  getComments,
  addComment,
  toggleLike,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
