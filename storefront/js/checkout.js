function renderCheckout() {
  const cart = getCart();
  const wrap = document.getElementById('checkoutBody');

  if (!cart.length) {
    wrap.innerHTML = '<div class="empty-cart">سلتك فاضية<br><a href="/index.html" class="back-link">رجوع للقائمة</a></div>';
    return;
  }

  let html = '';
  cart.forEach((item) => {
    html += `
      <div class="cart-line">
        <div>${item.name}</div>
        <div class="qty-controls">
          <button class="qty-btn" data-action="dec" data-id="${item.product_id}">-</button>
          <span>${item.qty}</span>
          <button class="qty-btn" data-action="inc" data-id="${item.product_id}">+</button>
          <button class="remove-link" data-action="remove" data-id="${item.product_id}">حذف</button>
        </div>
      </div>
    `;
  });

  html += `<div class="cart-total-row"><span>الإجمالي</span><span>${cartTotal(cart).toFixed(2)}</span></div>`;
  wrap.innerHTML = html;

  wrap.querySelectorAll('button[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      if (btn.dataset.action === 'inc') updateQty(id, 1);
      if (btn.dataset.action === 'dec') updateQty(id, -1);
      if (btn.dataset.action === 'remove') removeFromCart(id);
      renderCheckout();
    });
  });
}

document.getElementById('orderForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const cart = getCart();
  if (!cart.length) return;

  const customer_name = document.getElementById('custName').value.trim();
  const customer_phone = document.getElementById('custPhone').value.trim();
  if (!customer_name || !customer_phone) return;

  const btn = document.getElementById('submitOrderBtn');
  btn.disabled = true;
  btn.textContent = 'جاري الإرسال...';

  try {
    const res = await fetch(`${API_BASE}/api/public/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_name, customer_phone, items: cart }),
    });
    const data = await res.json();

    if (data.ok) {
      localStorage.removeItem('storefront_cart');
      document.getElementById('checkoutForm').classList.add('hidden');
      document.getElementById('confirmation').classList.remove('hidden');
      document.getElementById('orderIdLabel').textContent = data.orderId;
    } else {
      btn.disabled = false;
      btn.textContent = 'إرسال الطلب';
      alert(data.error || 'صار خطأ');
    }
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'إرسال الطلب';
    alert('تعذر إرسال الطلب، حاول مرة ثانية');
  }
});

renderCheckout();
