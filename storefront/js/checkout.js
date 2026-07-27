function prefillCustomerInfo() {
  const savedName = localStorage.getItem('storefront_customer_name');
  const savedPhone = localStorage.getItem('storefront_customer_phone');
  if (savedName) document.getElementById('custName').value = savedName;
  if (savedPhone) document.getElementById('custPhone').value = savedPhone;
}

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
      body: JSON.stringify({ customer_name, customer_phone, items: cart, visitorId: VISITOR_ID }),
    });
    const data = await res.json();

    if (data.ok) {
      localStorage.removeItem('storefront_cart');
      localStorage.setItem('storefront_customer_name', customer_name);
      localStorage.setItem('storefront_customer_phone', customer_phone);
      document.getElementById('checkoutForm').classList.add('hidden');
      document.getElementById('confirmation').classList.remove('hidden');
      document.getElementById('orderIdLabel').textContent = data.orderId;
      watchOrderStatus(data.orderId);
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

const STATUS_LABELS = {
  pending: 'بانتظار المراجعة...',
  confirmed: '✅ تم تأكيد طلبك',
  cancelled: '❌ تم إلغاء الطلب',
};

// يتابع حالة الطلب لحظيًا (بدون تسجيل دخول) وينبّه الزبون فور ما الأدمن يوافق عليه
function watchOrderStatus(orderId) {
  if (window.Notification && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  const banner = document.getElementById('orderStatusBanner');
  let lastStatus = 'pending';

  const poll = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/public/orders/${orderId}/status`);
      if (!res.ok) return;
      const { status } = await res.json();
      if (status === lastStatus) return;

      lastStatus = status;
      banner.textContent = STATUS_LABELS[status] || status;
      banner.className = `order-status-banner ${status}`;

      if (status !== 'pending') {
        if (window.Notification && Notification.permission === 'granted') {
          new Notification(STATUS_LABELS[status] || 'تحديث حالة الطلب', {
            body: `طلبك رقم #${orderId}`,
          });
        }
        clearInterval(intervalId);
      }
    } catch (_) {
      // فشل مؤقت بالشبكة - نحاول مرة ثانية بالدورة الجاية
    }
  };

  poll();
  const intervalId = setInterval(poll, 4000);
}

prefillCustomerInfo();
renderCheckout();
