const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/products', publicController.listProducts);
router.post('/orders', publicController.createOrder);
router.get('/orders/:id/status', publicController.getOrderStatus);

// تتبع الزوار (بصمة رقمية بدون تسجيل دخول)
router.post('/visit', publicController.trackVisit);
router.post('/visit/end', publicController.endVisit);

// التعليقات
router.get('/comments/:productId', publicController.getComments);
router.post('/comments', publicController.addComment);

// إعجاب بمنتج
router.post('/products/:id/like', publicController.toggleLike);

module.exports = router;
