// عنصر التنقل الجانبي مشترك بكل الصفحات، نحقنه بـ JS
// عشان ما نكرر نفس الـ HTML بكل صفحة - أي تعديل بالقائمة يصير هنا بس

function renderNav(activePage) {
  const links = [
    { href: '/admin/index.html', key: 'overview', label: 'نظرة عامة' },
    { href: '/admin/users.html', key: 'users', label: 'المستخدمين' },
    { href: '/admin/store.html', key: 'store', label: 'المتجر' },
    { href: '/admin/orders.html', key: 'orders', label: 'الطلبات' },
  ];

  const linksHtml = links
    .map(
      (l) => `<a href="${l.href}" class="${l.key === activePage ? 'active' : ''}">${l.label}</a>`
    )
    .join('');

  const nav = document.createElement('aside');
  nav.className = 'sidebar';
  nav.innerHTML = `
    <div class="brand">
      <span class="dot" id="botStatusDot"></span>
      <div>
        <div class="brand-title">لوحة التحكم</div>
        <div class="brand-sub" id="botUsernameLabel">جاري التحقق...</div>
      </div>
    </div>
    <nav class="nav-links">${linksHtml}</nav>
    <div class="sidebar-footer">
      <button class="logout-btn" id="logoutBtn">تسجيل الخروج</button>
    </div>
  `;

  document.body.prepend(nav);

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch(API_BASE + '/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login.html';
  });

  // يجيب حالة البوت (شغال/متوقف) من صفحة الإحصائيات ويحدّث النقطة
  fetch(API_BASE + '/api/stats/overview')
    .then((r) => r.json())
    .then((data) => {
      const dot = document.getElementById('botStatusDot');
      const label = document.getElementById('botUsernameLabel');
      if (data.botStatus === 'online') {
        dot.classList.remove('offline');
        label.textContent = 'النظام متصل';
      } else {
        dot.classList.add('offline');
        label.textContent = 'النظام متوقف';
      }
    })
    .catch(() => {});
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}
