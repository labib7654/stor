// الملف الرئيسي - يجمع كل شي مع بعض، ما فيه منطق تجاري هنا أبدًا
// أي تعديل بالميزات يصير بملفاته الخاصة (routes/controllers/services)

const express = require('express');
const cors = require('cors');
const cookieSession = require('cookie-session');
const path = require('path');

const env = require('./config/env');
const apiRoutes = require('./routes/index');
const { requireAuth } = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());
app.use(
  cookieSession({
    name: 'panel_session',
    keys: [env.sessionSecret],
    maxAge: 24 * 60 * 60 * 1000, // يوم وحد
    httpOnly: true,
    sameSite: 'lax',
  })
);

// API
app.use('/api', apiRoutes);

// ===== المتجر العام (الزبائن) - بدون تسجيل دخول، على الرابط الرئيسي =====
const storefrontPath = path.join(__dirname, '..', 'storefront');
app.use(express.static(storefrontPath));

// ===== لوحة التحكم الإدارية - محمية، تحت /admin =====
const adminPath = path.join(__dirname, '..', 'frontend');

app.get(
  ['/admin', '/admin/', '/admin/index.html', '/admin/users.html', '/admin/visitors.html', '/admin/stats.html', '/admin/store.html', '/admin/orders.html'],
  requireAuth,
  (req, res, next) => next()
);
app.use('/admin', express.static(adminPath));

app.use((req, res) => {
  res.status(404).sendFile(path.join(storefrontPath, '404.html'));
});

app.listen(env.port, () => {
  console.log(`✅ لوحة التحكم شغالة على المنفذ ${env.port}`);
});
