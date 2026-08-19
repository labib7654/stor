async function loadProducts() {
  const res = await fetch(API_BASE + '/api/store');
  const products = await res.json();
  const body = document.getElementById('productsBody');
  body.innerHTML = '';

  document.getElementById('emptyState').classList.toggle('hidden', products.length > 0);

  products.forEach((p) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.name}<div style="color:var(--text-muted); font-size:11px;">${p.description || ''}</div></td>
      <td style="font-family: var(--mono);">${p.price}</td>
      <td><button class="btn danger" data-id="${p.id}">حذف</button></td>
    `;
    body.appendChild(tr);
  });

  body.querySelectorAll('button[data-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await fetch(`${API_BASE}/api/store/${btn.dataset.id}`, { method: 'DELETE' });
      showToast('تم الحذف');
      loadProducts();
    });
  });
}

document.getElementById('newProductBtn').addEventListener('click', () => {
  document.getElementById('productForm').classList.remove('hidden');
});
document.getElementById('cancelProductBtn').addEventListener('click', () => {
  document.getElementById('productForm').classList.add('hidden');
});

document.getElementById('saveProductBtn').addEventListener('click', async () => {
  const name = document.getElementById('pName').value.trim();
  const price = parseFloat(document.getElementById('pPrice').value);
  const description = document.getElementById('pDesc').value.trim();
  if (!name || !price) return;

  await fetch(API_BASE + '/api/store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, price, description }),
  });
  showToast('تم إضافة المنتج');
  document.getElementById('productForm').classList.add('hidden');
  document.getElementById('pName').value = '';
  document.getElementById('pPrice').value = '';
  document.getElementById('pDesc').value = '';
  loadProducts();
});

loadProducts();
