const statusLabels = { pending: 'قيد الانتظار', confirmed: 'تم التأكيد', cancelled: 'ملغي' };
const statusPillClass = { pending: 'pending', confirmed: 'ok', cancelled: 'bad' };

async function loadOrders(status = '') {
  const res = await fetch(`${API_BASE}/api/orders?status=${status}`);
  const orders = await res.json();
  const body = document.getElementById('ordersBody');
  body.innerHTML = '';

  document.getElementById('emptyState').classList.toggle('hidden', orders.length > 0);

  orders.forEach((o) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family: var(--mono);">#${o.id}</td>
      <td>${o.customer_name || '—'}<div style="color:var(--text-muted); font-size:11px;">${o.customer_phone || ''}</div></td>
      <td style="font-size:11px; color:var(--text-muted);">${(o.items || []).map((i) => `${i.name} ×${i.qty}`).join('، ')}</td>
      <td style="font-family: var(--mono);">${o.total ?? '—'}</td>
      <td><span class="status-pill ${statusPillClass[o.status] || 'pending'}">${statusLabels[o.status] || o.status}</span></td>
      <td>
        <select data-id="${o.id}" class="statusSelect">
          <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>قيد الانتظار</option>
          <option value="confirmed" ${o.status === 'confirmed' ? 'selected' : ''}>تم التأكيد</option>
          <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>ملغي</option>
        </select>
      </td>
    `;
    body.appendChild(tr);
  });

  body.querySelectorAll('.statusSelect').forEach((sel) => {
    sel.addEventListener('change', async () => {
      await fetch(`${API_BASE}/api/orders/${sel.dataset.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: sel.value }),
      });
      showToast('تم تحديث الحالة');
      loadOrders(document.getElementById('statusFilter').value);
    });
  });
}

document.getElementById('statusFilter').addEventListener('change', (e) => loadOrders(e.target.value));

loadOrders();
