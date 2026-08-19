async function loadMenu() {
  const grid = document.getElementById('menuGrid');
  try {
    const res = await fetch(`${API_BASE}/api/public/products`);
    const products = await res.json();

    if (!products.length) {
      grid.innerHTML = '<div class="empty-cart">القائمة فاضية حاليًا، رجعنا لك قريبًا</div>';
      return;
    }

    grid.innerHTML = '';
    products.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <div class="item-name">${p.name}</div>
        <div class="item-desc">${p.description || ''}</div>
        <div class="item-footer">
          <span class="item-price">${Number(p.price).toFixed(2)}</span>
          <button class="add-btn" data-id="${p.id}">أضف للسلة</button>
        </div>
      `;
      grid.appendChild(card);
      card.querySelector('.add-btn').addEventListener('click', () => addToCart(p));
    });
  } catch (err) {
    grid.innerHTML = '<div class="empty-cart">تعذر تحميل القائمة، حدّث الصفحة</div>';
  }
}

document.getElementById('goCheckoutBtn').addEventListener('click', () => {
  window.location.href = '/checkout.html';
});

loadMenu();
updateCartBar();
