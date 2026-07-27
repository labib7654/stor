let searchTimer;

async function loadUsers(search = '') {
  const res = await fetch(`${API_BASE}/api/users?search=${encodeURIComponent(search)}`);
  const json = await res.json();
  if (!res.ok) {
    console.error('فشل تحميل المستخدمين:', json);
    showToast(json.error || 'فشل تحميل المستخدمين');
    return;
  }
  const data = json.data || [];
  const body = document.getElementById('usersBody');
  body.innerHTML = '';

  document.getElementById('emptyState').classList.toggle('hidden', data.length > 0);

  data.forEach((user) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family: var(--mono);">${user.telegram_id}</td>
      <td>${user.username || '—'}</td>
      <td>
        <span class="status-pill ${user.is_banned ? 'bad' : 'ok'}">
          ${user.is_banned ? 'محظور' : 'نشط'}
        </span>
      </td>
      <td>
        <button class="btn ${user.is_banned ? 'secondary' : 'danger'}" data-id="${user.telegram_id}" data-banned="${user.is_banned}">
          ${user.is_banned ? 'فك الحظر' : 'حظر'}
        </button>
      </td>
    `;
    body.appendChild(tr);
  });

  body.querySelectorAll('button[data-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const isBanned = btn.dataset.banned === 'true';
      const endpoint = isBanned ? 'unban' : 'ban';
      await fetch(`${API_BASE}/api/users/${id}/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      showToast(isBanned ? 'تم فك الحظر' : 'تم الحظر');
      loadUsers(document.getElementById('searchInput').value);
    });
  });
}

document.getElementById('searchInput').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadUsers(e.target.value), 300);
});

loadUsers();
