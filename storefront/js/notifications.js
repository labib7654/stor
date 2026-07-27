// جرس إشعارات خاص بكل زبون (visitor_id) - رد على تعليقك، تحديث حالة طلبك...
// يفترض إن fingerprint.js انحمّل قبله عشان يكون VISITOR_ID جاهز

if (typeof escapeHtml === 'undefined') {
  var escapeHtml = function (str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };
}

function notifTimeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `قبل ${mins} د`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `قبل ${hours} س`;
  return `قبل ${Math.floor(hours / 24)} يوم`;
}

function mountNotificationBell() {
  const bell = document.createElement('div');
  bell.className = 'notif-bell-wrap';
  bell.innerHTML = `
    <button class="notif-bell-btn" id="notifBellBtn">
      🔔<span class="notif-badge hidden" id="notifBadge">0</span>
    </button>
    <div class="notif-dropdown hidden" id="notifDropdown">
      <div class="notif-dropdown-header">
        <span>الإشعارات</span>
        <button id="notifMarkAllBtn">تعليم الكل كمقروء</button>
      </div>
      <div class="notif-list" id="notifList"><div class="empty-cart">جاري التحميل...</div></div>
    </div>
  `;
  document.body.appendChild(bell);

  const btn = document.getElementById('notifBellBtn');
  const dropdown = document.getElementById('notifDropdown');

  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const willOpen = dropdown.classList.contains('hidden');
    dropdown.classList.toggle('hidden');
    if (willOpen) await renderNotifList();
  });

  document.addEventListener('click', (e) => {
    if (!bell.contains(e.target)) dropdown.classList.add('hidden');
  });

  document.getElementById('notifMarkAllBtn').addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      await fetch(`${API_BASE}/api/public/notifications/${VISITOR_ID}/read-all`, { method: 'POST' });
      await refreshUnreadCount();
      await renderNotifList();
    } catch (_) {}
  });

  refreshUnreadCount();
  setInterval(refreshUnreadCount, 15000);
}

async function refreshUnreadCount() {
  try {
    const res = await fetch(`${API_BASE}/api/public/notifications/${VISITOR_ID}`);
    if (!res.ok) return;
    const { unread } = await res.json();
    const badge = document.getElementById('notifBadge');
    if (!badge) return;
    if (unread > 0) {
      badge.textContent = unread > 9 ? '9+' : unread;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  } catch (_) {
    // فشل مؤقت بالشبكة - نحاول بالدورة الجاية
  }
}

async function renderNotifList() {
  const list = document.getElementById('notifList');
  try {
    const res = await fetch(`${API_BASE}/api/public/notifications/${VISITOR_ID}`);
    const { items } = await res.json();
    if (!items.length) {
      list.innerHTML = '<div class="empty-cart">ما فيه إشعارات بعد</div>';
      return;
    }
    list.innerHTML = items
      .map(
        (n) => `
      <div class="notif-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}">
        <div class="notif-title">${escapeHtml(n.title)}</div>
        <div class="notif-message">${escapeHtml(n.message || '')}</div>
        <div class="notif-time">${notifTimeAgo(n.created_at)}</div>
      </div>`
      )
      .join('');

    list.querySelectorAll('.notif-item.unread').forEach((el) => {
      el.addEventListener('click', async () => {
        try {
          await fetch(`${API_BASE}/api/public/notifications/${VISITOR_ID}/${el.dataset.id}/read`, { method: 'POST' });
          el.classList.remove('unread');
          await refreshUnreadCount();
        } catch (_) {}
      });
    });
  } catch (err) {
    list.innerHTML = '<div class="empty-cart">تعذر تحميل الإشعارات</div>';
  }
}

mountNotificationBell();
