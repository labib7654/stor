// إدارة السلة - كل الصفحات تستخدم نفس المفتاح بالـ localStorage
const CART_KEY = 'storefront_cart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (_) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find((i) => i.product_id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ product_id: product.id, name: product.name, price: product.price, qty: 1 });
  }
  saveCart(cart);
  updateCartBar();
}

function updateQty(productId, delta) {
  const cart = getCart();
  const item = cart.find((i) => i.product_id === productId);
  if (!item) return;
  item.qty += delta;
  const updated = item.qty > 0 ? cart : cart.filter((i) => i.product_id !== productId);
  saveCart(updated);
}

function removeFromCart(productId) {
  saveCart(getCart().filter((i) => i.product_id !== productId));
}

function cartTotal(cart) {
  return cart.reduce((sum, i) => sum + Number(i.price) * i.qty, 0);
}

function updateCartBar() {
  const bar = document.getElementById('cartBar');
  if (!bar) return;
  const cart = getCart();
  const count = cart.reduce((sum, i) => sum + i.qty, 0);
  document.getElementById('cartCount').textContent = count;
  document.getElementById('cartTotal').textContent = cartTotal(cart).toFixed(2);
  document.getElementById('goCheckoutBtn').disabled = count === 0;
}
