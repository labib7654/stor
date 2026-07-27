function formatDuration(totalSeconds) {
  const s = totalSeconds || 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}س ${m}د`;
  return `${m}د`;
}

function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' });
}

function shortId(id) {
  return id ? id.slice(0, 8) : '-';
}

async function loadVisitors() {
  const res = await fetch(API_BASE + '/api/visitors');
  const json = await res.json();
  if (!res.ok) {
    console.error('فشل تحميل الزوار:', json);
    showToast(json.error || 'فشل تحميل الزوار');
    return;
  }
  const data = json.data || [];
  const body = document.getElementById('visitorsBody');
  body.innerHTML = '';

  document.getElementById('emptyState').classList.toggle('hidden', data.length > 0);

  data.forEach((v) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family: var(--mono);">${shortId(v.id)}</td>
      <td>${formatDate(v.first_seen)}</td>
      <td>${formatDate(v.last_seen)}</td>
      <td>${v.visits_count || 1}</td>
      <td>${formatDuration(v.total_duration_seconds)}</td>
      <td>${v.last_entry_page || '-'}</td>
      <td style="color:var(--text-muted); font-size:11px;">${v.screen_res || ''} · ${v.language || ''}</td>
    `;
    body.appendChild(tr);
  });
}

loadVisitors();
