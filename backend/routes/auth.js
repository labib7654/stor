const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// التسجيل والدخول بالبريد وكلمة المرور
router.post('/register', authController.register);
router.post('/login', authController.login);

// التحقق بخطوتين عبر رقم الجوال 2FA OTP
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);

// بيانات المستخدِم الحالي وتسجيل الخروج
router.get('/me', authController.getMe);
router.post('/logout', authController.logout);

// مسارات للتوافق مع البوت
router.post('/request-code', authController.sendOtp);
router.post('/verify-code', authController.verifyOtp);

module.exports = router;
