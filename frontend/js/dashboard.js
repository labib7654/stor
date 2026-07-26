async function loadOverview() {
  const res = await fetch(API_BASE + '/api/stats/overview');
  const data = await res.json();
  document.getElementById('statUsers').textContent = data.usersCount;
  document.getElementById('statBanned').textContent = data.bannedCount;
  document.getElementById('statOrders').textContent = data.ordersCount;
  document.getElementById('statBotStatus').textContent = data.botStatus === 'online' ? 'شغال' : 'متوقف';
}

document.getElementById('sendBroadcastBtn').addEventListener('click', async () => {
  const text = document.getElementById('broadcastText').value.trim();
  if (!text) return;
  const btn = document.getElementById('sendBroadcastBtn');
  btn.disabled = true;
  btn.textContent = 'جاري الإرسال...';
  try {
    const res = await fetch(API_BASE + '/api/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    showToast(`تم الإرسال لـ ${data.success} مستخدم، فشل: ${data.failed?.length || 0}`);
    document.getElementById('broadcastText').value = '';
  } catch (err) {
    showToast('صار خطأ بالإرسال');
  } finally {
    btn.disabled = false;
    btn.textContent = 'إرسال للجميع';
  }
});

loadOverview();
