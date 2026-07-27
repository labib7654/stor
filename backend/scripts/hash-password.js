// سكربت مساعد: يحول كلمة مرور نص عادي إلى هاش bcrypt
// استخدام: node scripts/hash-password.js "كلمة_المرور_الي_تبيها"
// الناتج تحطه في .env بمتغير ADMIN_PASSWORD_HASH

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.log('استخدام: node scripts/hash-password.js "كلمة_المرور"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('\nحط هذا السطر في ملف .env:\n');
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
