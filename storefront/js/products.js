let ALL_PRODUCTS = [];

function getSavedName() {
  return localStorage.getItem('storefront_name') || '';
}
function saveName(name) {
  localStorage.setItem('storefront_name', name);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderProducts(products) {
  const grid = document.getElementById('menuGrid');

  if (!products.length) {
    grid.innerHTML = '<div class="empty-cart">ما فيه منتجات مطابقة</div>';
    return;
  }

  // نجمع المنتجات حسب القسم - المنتجات بدون قسم توضع تحت "أخرى"
  const groups = new Map();
  products.forEach((p) => {
    const key = p.category_name || 'أخرى';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  });

  grid.innerHTML = '';
  groups.forEach((items, categoryName) => {
    const group = document.createElement('div');
    group.className = 'category-group';

    if (groups.size > 1) {
      const heading = document.createElement('div');
      heading.className = 'category-heading';
      heading.textContent = categoryName;
      group.appendChild(heading);
    }

    const section = document.createElement('div');
    section.className = 'menu-grid-section';

    items.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        ${p.image_url ? `<img class="item-image" src="${p.image_url}" alt="${escapeHtml(p.name)}" />` : ''}
        <div class="item-name">${escapeHtml(p.name)}</div>
        <div class="item-desc">${escapeHtml(p.description || '')}</div>
        <div class="item-footer">
          <span class="item-price">${Number(p.price).toFixed(2)}</span>
          <button class="add-btn" data-id="${p.id}">أضف للسلة</button>
        </div>
        <div class="item-actions">
          <button class="like-btn" data-id="${p.id}"><span class="like-icon">🤍</span> <span class="like-count">${p.likes_count || 0}</span></button>
          <button class="comment-toggle" data-id="${p.id}">💬 تعليقات</button>
        </div>
        <div class="comments-panel hidden" id="comments-${p.id}"></div>
      `;
      section.appendChild(card);
      card.querySelector('.add-btn').addEventListener('click', () => addToCart(p));
      card.querySelector('.like-btn').addEventListener('click', (e) => toggleLike(p.id, e.currentTarget));
      card.querySelector('.comment-toggle').addEventListener('click', () => toggleComments(p.id));
    });

    group.appendChild(section);
    grid.appendChild(group);
  });
}

async function loadMenu() {
  const grid = document.getElementById('menuGrid');
  try {
    const res = await fetch(`${API_BASE}/api/public/products`);
    ALL_PRODUCTS = await res.json();

    if (!ALL_PRODUCTS.length) {
      grid.innerHTML = '<div class="empty-cart">القائمة فاضية حاليًا، رجعنا لك قريبًا</div>';
      return;
    }
    renderProducts(ALL_PRODUCTS);
  } catch (err) {
    grid.innerHTML = '<div class="empty-cart">تعذر تحميل القائمة، حدّث الصفحة</div>';
  }
}

document.getElementById('searchInput').addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  const filtered = !q
    ? ALL_PRODUCTS
    : ALL_PRODUCTS.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
      );
  renderProducts(filtered);
});

async function toggleLike(productId, btn) {
  try {
    const res = await fetch(`${API_BASE}/api/public/products/${productId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId: VISITOR_ID }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('فشل الإعجاب:', data);
      alert(data.error || 'تعذر تسجيل الإعجاب، حاول مرة ثانية');
      return;
    }
    btn.querySelector('.like-count').textContent = data.count;
    btn.querySelector('.like-icon').textContent = data.liked ? '❤️' : '🤍';
  } catch (err) {
    console.error('تعذر الاتصال بالسيرفر:', err);
    alert('تعذر الاتصال بالسيرفر');
  }
}

async function toggleComments(productId) {
  const panel = document.getElementById(`comments-${productId}`);
  if (!panel.classList.contains('hidden')) {
    panel.classList.add('hidden');
    return;
  }
  panel.classList.remove('hidden');
  await loadComments(productId, panel);
}

async function loadComments(productId, panel) {
  panel.innerHTML = '<div class="empty-cart">جاري التحميل...</div>';
  let res, comments;
  try {
    res = await fetch(`${API_BASE}/api/public/comments/${productId}`);
    comments = await res.json();
  } catch (err) {
    console.error('تعذر الاتصال بالسيرفر:', err);
    panel.innerHTML = '<div class="empty-cart">تعذر الاتصال بالسيرفر</div>';
    return;
  }
  if (!res.ok) {
    console.error('فشل تحميل التعليقات:', comments);
    panel.innerHTML = `<div class="empty-cart">تعذر تحميل التعليقات (كود ${res.status})</div>`;
    return;
  }

  panel.innerHTML = `
    <div class="comments-list">
      ${
        comments.length
          ? comments
              .map(
                (c) => `
        <div class="comment-item">
          <span class="comment-name">${escapeHtml(c.name)}</span>
          <span class="comment-text">${escapeHtml(c.text)}</span>
        </div>`
              )
              .join('')
          : '<div class="empty-cart">لا يوجد تعليقات بعد، كن أول من يعلّق</div>'
      }
    </div>
    <div class="comment-form">
      <input type="text" class="comment-name-input" placeholder="اسمك" value="${escapeHtml(getSavedName())}" maxlength="40" />
      <textarea class="comment-text-input" rows="2" placeholder="اكتب تعليقك..." maxlength="500"></textarea>
      <button class="btn-add-comment">إرسال</button>
    </div>
  `;

  panel.querySelector('.btn-add-comment').addEventListener('click', async () => {
    const nameInput = panel.querySelector('.comment-name-input');
    const textInput = panel.querySelector('.comment-text-input');
    const name = nameInput.value.trim();
    const text = textInput.value.trim();
    if (!name || !text) return;

    saveName(name);
    try {
      const addRes = await fetch(`${API_BASE}/api/public/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, visitorId: VISITOR_ID, name, text }),
      });
      const addData = await addRes.json();
      if (!addRes.ok) {
        console.error('فشل إرسال التعليق:', addData);
        alert(addData.error || 'تعذر إرسال التعليق، حاول مرة ثانية');
        return;
      }
      await loadComments(productId, panel);
    } catch (err) {
      console.error('تعذر الاتصال بالسيرفر:', err);
      alert('تعذر الاتصال بالسيرفر');
    }
  });
}

document.getElementById('goCheckoutBtn').addEventListener('click', () => {
  window.location.href = '/checkout.html';
});

loadMenu();
updateCartBar();
