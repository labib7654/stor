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

function buildCommentTree(comments) {
  const byId = new Map(comments.map((c) => [c.id, { ...c, replies: [] }]));
  const roots = [];
  byId.forEach((c) => {
    if (c.parent_comment_id && byId.has(c.parent_comment_id)) {
      byId.get(c.parent_comment_id).replies.push(c);
    } else {
      roots.push(c);
    }
  });
  return roots;
}

function renderCommentNode(c, productId, depth) {
  const replyFormId = `reply-form-${c.id}`;
  const repliesHtml = c.replies.map((r) => renderCommentNode(r, productId, depth + 1)).join('');
  return `
    <div class="comment-item" style="${depth ? 'margin-inline-start:18px; border-inline-start:2px solid var(--line);' : ''}">
      <span class="comment-name">${escapeHtml(c.name)}</span>
      <span class="comment-text">${escapeHtml(c.text)}</span>
      <button class="comment-reply-toggle" data-id="${c.id}">↩ رد</button>
      <div class="comment-reply-form hidden" id="${replyFormId}">
        <input type="text" class="reply-name-input" placeholder="اسمك" value="${escapeHtml(getSavedName())}" maxlength="40" />
        <textarea class="reply-text-input" rows="2" placeholder="اكتب ردك..." maxlength="500"></textarea>
        <button class="btn-add-comment btn-send-reply" data-parent-id="${c.id}">إرسال الرد</button>
      </div>
      ${repliesHtml ? `<div class="comment-replies">${repliesHtml}</div>` : ''}
    </div>`;
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

function wireCommentForm(panel, productId, formEl, parentCommentId) {
  const nameInput = formEl.querySelector(parentCommentId ? '.reply-name-input' : '.comment-name-input');
  const textInput = formEl.querySelector(parentCommentId ? '.reply-text-input' : '.comment-text-input');
  const btn = formEl.querySelector(parentCommentId ? '.btn-send-reply' : '.btn-add-comment');

  btn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const text = textInput.value.trim();
    if (!name || !text) return;

    saveName(name);
    try {
      const addRes = await fetch(`${API_BASE}/api/public/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, visitorId: VISITOR_ID, name, text, parentCommentId: parentCommentId || null }),
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

  const tree = buildCommentTree(comments);

  panel.innerHTML = `
    <div class="comments-list">
      ${
        tree.length
          ? tree.map((c) => renderCommentNode(c, productId, 0)).join('')
          : '<div class="empty-cart">لا يوجد تعليقات بعد، كن أول من يعلّق</div>'
      }
    </div>
    <div class="comment-form">
      <input type="text" class="comment-name-input" placeholder="اسمك" value="${escapeHtml(getSavedName())}" maxlength="40" />
      <textarea class="comment-text-input" rows="2" placeholder="اكتب تعليقك..." maxlength="500"></textarea>
      <button class="btn-add-comment">إرسال</button>
    </div>
  `;

  // فورم تعليق جديد (مستوى أول)
  wireCommentForm(panel, productId, panel.querySelector('.comment-form'), null);

  // زر "رد" تحت كل تعليق يفتح/يقفل فورم الرد الخاص فيه
  panel.querySelectorAll('.comment-reply-toggle').forEach((toggleBtn) => {
    toggleBtn.addEventListener('click', () => {
      const formEl = document.getElementById(`reply-form-${toggleBtn.dataset.id}`);
      formEl.classList.toggle('hidden');
    });
  });

  // فورم الرد لكل تعليق
  panel.querySelectorAll('.comment-reply-form').forEach((formEl) => {
    const parentId = formEl.querySelector('.btn-send-reply').dataset.parentId;
    wireCommentForm(panel, productId, formEl, parentId);
  });
}

document.getElementById('goCheckoutBtn').addEventListener('click', () => {
  window.location.href = '/checkout.html';
});

loadMenu();
updateCartBar();
