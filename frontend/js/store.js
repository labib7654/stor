let CATEGORIES = [];
let PENDING_IMAGE_FILE = null;

// ===== الأقسام =====
async function loadCategories() {
  let res, data;
  try {
    res = await fetch(API_BASE + '/api/categories');
    data = await res.json();
  } catch (err) {
    console.error('تعذر تحميل الأقسام:', err);
    return;
  }
  if (!res.ok) {
    console.error('فشل تحميل الأقسام:', data);
    return;
  }
  CATEGORIES = data;

  const list = document.getElementById('categoriesList');
  list.innerHTML = CATEGORIES.length
    ? ''
    : '<span style="color:var(--text-muted); font-size:12px;">ما فيه أقسام بعد</span>';

  CATEGORIES.forEach((c) => {
    const chip = document.createElement('span');
    chip.style.cssText =
      'display:flex; align-items:center; gap:6px; background:var(--bg2,#1a1a1a); border:1px solid var(--line,#333); padding:5px 10px; border-radius:20px; font-size:12px;';
    chip.innerHTML = `${c.name} <button data-id="${c.id}" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:13px;">✕</button>`;
    chip.querySelector('button').addEventListener('click', async () => {
      if (!confirm(`حذف قسم "${c.name}"؟ (المنتجات فيه تصير بدون قسم، ما تنحذف)`)) return;
      await fetch(`${API_BASE}/api/categories/${c.id}`, { method: 'DELETE' });
      showToast('تم حذف القسم');
      loadCategories();
      loadProducts();
    });
    list.appendChild(chip);
  });

  // نحدث خيارات السلكت بفورم المنتج
  const select = document.getElementById('pCategory');
  select.innerHTML = '<option value="">بدون قسم</option>';
  CATEGORIES.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    select.appendChild(opt);
  });
}

document.getElementById('addCategoryBtn').addEventListener('click', async () => {
  const input = document.getElementById('newCategoryName');
  const name = input.value.trim();
  if (!name) return;

  try {
    const res = await fetch(API_BASE + '/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || `فشل إضافة القسم (كود ${res.status})`);
      console.error('فشل إضافة قسم:', data);
      return;
    }
    input.value = '';
    showToast('تمت إضافة القسم');
    loadCategories();
  } catch (err) {
    showToast('تعذر الاتصال بالسيرفر');
    console.error(err);
  }
});

// ===== المنتجات =====
async function loadProducts() {
  const res = await fetch(API_BASE + '/api/store');
  const products = await res.json();
  const body = document.getElementById('productsBody');
  body.innerHTML = '';

  document.getElementById('emptyState').classList.toggle('hidden', products.length > 0);

  products.forEach((p) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.image_url ? `<img src="${p.image_url}" style="width:42px; height:42px; object-fit:cover; border-radius:4px;" />` : '<span style="color:var(--text-muted); font-size:11px;">-</span>'}</td>
      <td>${p.name}<div style="color:var(--text-muted); font-size:11px;">${p.description || ''}</div></td>
      <td style="font-size:12px; color:var(--text-muted);">${p.category_name || '-'}</td>
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
  resetProductForm();
});

function resetProductForm() {
  document.getElementById('productForm').classList.add('hidden');
  document.getElementById('pName').value = '';
  document.getElementById('pPrice').value = '';
  document.getElementById('pDesc').value = '';
  document.getElementById('pCategory').value = '';
  document.getElementById('pImageFile').value = '';
  document.getElementById('pImageUrl').value = '';
  document.getElementById('pImagePreview').classList.add('hidden');
  PENDING_IMAGE_FILE = null;
}

document.getElementById('pImageFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  PENDING_IMAGE_FILE = file;
  const preview = document.getElementById('pImagePreview');
  preview.src = URL.createObjectURL(file);
  preview.classList.remove('hidden');
});

document.getElementById('saveProductBtn').addEventListener('click', async () => {
  const name = document.getElementById('pName').value.trim();
  const price = parseFloat(document.getElementById('pPrice').value);
  const description = document.getElementById('pDesc').value.trim();
  const categoryValue = document.getElementById('pCategory').value;
  const category_id = categoryValue ? Number(categoryValue) : null;
  if (!name || !price) return;

  let image_url = document.getElementById('pImageUrl').value || null;

  // لو المستخدم اختار صورة، نرفعها أول قبل حفظ المنتج
  if (PENDING_IMAGE_FILE) {
    const formData = new FormData();
    formData.append('image', PENDING_IMAGE_FILE);
    const uploadRes = await fetch(API_BASE + '/api/store/upload-image', { method: 'POST', body: formData });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) {
      showToast(uploadData.error || 'تعذر رفع الصورة');
      return;
    }
    image_url = uploadData.url;
  }

  const saveRes = await fetch(API_BASE + '/api/store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, price, description, category_id, image_url }),
  });
  const saveData = await saveRes.json();
  if (!saveRes.ok) {
    showToast(saveData.error || `فشل حفظ المنتج (كود ${saveRes.status})`);
    console.error('فشل حفظ منتج:', saveData);
    return;
  }
  showToast('تم إضافة المنتج');
  resetProductForm();
  loadProducts();
});

// ===== مراجعة تعليقات الزوار =====
async function loadComments() {
  const res = await fetch(API_BASE + '/api/comments');
  const comments = await res.json();
  const body = document.getElementById('commentsBody');
  body.innerHTML = '';

  document.getElementById('emptyCommentsState').classList.toggle('hidden', comments.length > 0);

  comments.forEach((c) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.products?.name || '-'}</td>
      <td>${c.name}</td>
      <td>${c.text}</td>
      <td><button class="btn danger" data-id="${c.id}">حذف</button></td>
    `;
    body.appendChild(tr);
  });

  body.querySelectorAll('button[data-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await fetch(`${API_BASE}/api/comments/${btn.dataset.id}`, { method: 'DELETE' });
      showToast('تم حذف التعليق');
      loadComments();
    });
  });
}

loadCategories();
loadProducts();
loadComments();
