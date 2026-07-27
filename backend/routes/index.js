// الملف اللي يجمع كل الراوترات مع بعض
// أي صفحة/ميزة جديدة: سوّي لها ملف راوت خاص بالمجلد هذا، وسجّلها هنا سطر وحد

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

const authRoutes = require('./auth');
const usersRoutes = require('./users');
const statsRoutes = require('./stats');
const storeRoutes = require('./store');
const ordersRoutes = require('./orders');
const broadcastRoutes = require('./broadcast');
const publicRoutes = require('./public');
const visitorsRoutes = require('./visitors');
const commentsRoutes = require('./comments');
const categoriesRoutes = require('./categories');

router.use('/auth', authRoutes); // بدون حماية - هذا نفسه صفحة تسجيل الدخول
router.use('/public', publicRoutes); // بدون حماية - يستخدمها المتجر العام (الزبائن)
router.use('/users', requireAuth, usersRoutes);
router.use('/stats', requireAuth, statsRoutes);
router.use('/store', requireAuth, storeRoutes);
router.use('/orders', requireAuth, ordersRoutes);
router.use('/broadcast', requireAuth, broadcastRoutes);
router.use('/visitors', requireAuth, visitorsRoutes);
router.use('/comments', requireAuth, commentsRoutes);
router.use('/categories', requireAuth, categoriesRoutes);

module.exports = router;
