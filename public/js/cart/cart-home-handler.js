/**
 * Home Page Cart Handler - Uses Global Cart State
 * Integrated with cart-state.js for unified cart management
 */

(function() {
  'use strict';

  // Cart DOM Elements
  let cartElement;
  let cartButton;
  let closeButton;
  let cartOverlay;

  function initDOMReferences() {
    cartElement = document.querySelector('.cart');
    cartButton = document.getElementById('cart-button');
    closeButton = document.querySelector('.close_cart');
    cartOverlay = document.getElementById('cartOverlay');
    if (!cartElement) return false;
    return true;
  }

  function setupCartToggleButtons() {
    if (cartButton) {
      cartButton.addEventListener('click', () => {
        if (window.cartState) window.cartState.open();
      });
    }
    if (closeButton) {
      closeButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.cartState) window.cartState.close();
      });
    }
    if (cartOverlay) {
      cartOverlay.addEventListener('click', () => {
        if (window.cartState) window.cartState.close();
      });
    }
  }

  function setupAddToCartButtons() {
    fetch('/api/products')
      .then(res => res.json())
      .then(products => {
        const addToCartButtons = document.querySelectorAll('.button-data-id');
        addToCartButtons.forEach(button => {
          button.addEventListener('click', (e) => {
            e.preventDefault();
            const productId = Number(button.getAttribute('data-id'));
            const product = products.find(p => p.Product_ID === productId);
            if (!product) return;

            const cartProduct = {
              id: product.Product_ID,
              title: product.Product_Name,
              price: product.Price,
              img: `images/products/${product.Image}`,
              quantity: 1
            };

            if (window.cartState) {
              window.cartState.addItem(cartProduct);
              button.classList.add('activess');
              button.disabled = true;
              showAddedNotification(`تم إضافة ${product.Product_Name} للسلة!`);
            }
          });
        });
      })
      .catch(error => console.error('Products fetch error:', error));
  }

  function showAddedNotification(message) {
    const notificationEl = document.createElement('div');
    notificationEl.className = 'cart_message success';
    notificationEl.textContent = `✓ ${message}`;
    notificationEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      z-index: 1000;
      animation: slideDown 0.3s ease-out;
    `;
    document.body.appendChild(notificationEl);
    setTimeout(() => notificationEl.remove(), 3000);
  }

  function syncCartUI(state) {
    if (!cartElement) return;
    if (state.isOpen) {
      cartElement.classList.add('active');
    } else {
      cartElement.classList.remove('active');
    }
  }

  function updateCartDisplay(items) {
    const cartItemsContainer = document.getElementById('cart_items');
    const priceTotal = document.querySelector('.price_cart_total');
    const countBadge = document.querySelector('.count_item_cart');

    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';

    if (items.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="cart-empty">
          <i class="ri-shopping-cart-line"></i>
          <p>سلتك فارغة</p>
          <span>أضف منتجات لبدء التسوق</span>
        </div>
      `;
      if (priceTotal) priceTotal.textContent = '0.00 جنيه';
      if (countBadge) countBadge.textContent = '0';
      return;
    }

    let totalPrice = 0;
    let totalQuantity = 0;

    items.forEach((item) => {
      totalPrice    += item.price * item.quantity;
      totalQuantity += item.quantity;

      const itemEl = document.createElement('div');
      itemEl.className = 'item_cart';
      itemEl.innerHTML = `
        <img src="/${item.img}" alt="${item.title}">
        <div class="content">
          <h4>${item.title}</h4>
          <p class="price_cart">${(item.price * item.quantity).toFixed(2)} جنيه</p>
          <div class="quantity_control">
            <button class="decrease-qty" data-product-id="${item.id}" aria-label="تقليل الكمية">−</button>
            <span class="quantity">${item.quantity}</span>
            <button class="increase-qty" data-product-id="${item.id}" aria-label="زيادة الكمية">+</button>
          </div>
        </div>
        <button class="delete_item" data-product-id="${item.id}" aria-label="حذف من السلة">
          <i class="ri-delete-bin-5-line"></i>
        </button>
      `;
      cartItemsContainer.appendChild(itemEl);
    });

    if (priceTotal) priceTotal.textContent = `${totalPrice.toFixed(2)} جنيه`;
    if (countBadge) countBadge.textContent = totalQuantity;

    attachCartItemListeners();
  }

  function attachCartItemListeners() {
    document.querySelectorAll('.increase-qty').forEach(btn => {
      btn.addEventListener('click', function() {
        const productId = Number(this.dataset.productId);
        if (window.cartState) window.cartState.increaseQuantity(productId);
      });
    });

    document.querySelectorAll('.decrease-qty').forEach(btn => {
      btn.addEventListener('click', function() {
        const productId = Number(this.dataset.productId);
        if (window.cartState) window.cartState.decreaseQuantity(productId);
      });
    });

    document.querySelectorAll('.delete_item').forEach(btn => {
      btn.addEventListener('click', function() {
        const productId = Number(this.dataset.productId);
        if (window.cartState) window.cartState.removeItem(productId);
      });
    });
  }

  function setupCheckoutButton() {
    const checkoutButtons = document.querySelectorAll('.btn_cart, .btn-complete-order');
    checkoutButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        handleCheckout();
      });
    });
  }

  // ============================================================
  // handleCheckout — الـ FIX الأساسي
  // بدل ما نعتمد على window.auth اللي مش موجود،
  // نسأل الـ server مباشرة عن حالة الـ session
  // ============================================================
  async function handleCheckout() {
    if (!window.cartState) {
      window.location.href = '/checkout';
      return;
    }

    const items = window.cartState.getItems();

    if (items.length === 0) {
      showMessage('السلة فارغة! الرجاء إضافة منتجات.', 'warning');
      return;
    }

    // نشيك على الـ session من الـ server فعلياً
    let isAuthenticated = false;
    try {
      const res = await fetch('/auth/api/auth/check', { credentials: 'include' });
      const data = await res.json();
      isAuthenticated = data.authenticated === true;
    } catch(e) {
      // لو فشل الـ check، نرجع على /login عشان نتأكد
      isAuthenticated = false;
    }

    if (!isAuthenticated) {
      // احفظ السلة عشان ترجع بعد تسجيل الدخول
      try {
        localStorage.setItem('pendingCart', JSON.stringify(items));
      } catch(e) {}

      // روح لـ /login مع next=/checkout ✅
      window.location.href = '/login?next=' + encodeURIComponent('/checkout');
      return;
    }

    // مسجّل دخول → روح لصفحة الـ checkout ✅
    window.location.href = '/checkout';
  }

  async function submitOrder(items, totalAmount) {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.id,
            quantity:  item.quantity,
            price:     item.price
          })),
          totalAmount:     totalAmount,
          deliveryAddress: 'عنوان التوصيل'
        })
      });

      const data = await response.json();

      if (response.status === 401) {
        showMessage('يجب تسجيل الدخول أولاً!', 'error');
        setTimeout(() => {
          window.location.href = '/login?next=' + encodeURIComponent('/checkout');
        }, 800);
        return;
      }

      if (!data.success) {
        showMessage(`✗ خطأ: ${data.message || 'فشل في إنشاء الطلب'}`, 'error');
        return;
      }

      showMessage(`✓ تم إنشاء الطلب بنجاح! رقم الطلب: ${data.data.orderNumber}`, 'success');
      window.cartState.clear();

      setTimeout(() => {
        if (window.cartState) window.cartState.close();
      }, 2000);

    } catch (error) {
      showMessage(`✗ خطأ في الاتصال: ${error.message}`, 'error');
    }
  }

  function showMessage(message, type = 'info') {
    const messageEl = document.getElementById('cart_message');
    if (!messageEl) return;

    messageEl.textContent = message;
    messageEl.className   = `cart_message ${type}`;
    messageEl.style.display = 'block';

    const colors = {
      success: '#4CAF50',
      error:   'var(--text-color)',
      warning: '#ff9800',
      info:    '#2196F3'
    };
    messageEl.style.backgroundColor = colors[type] || colors.info;
    messageEl.style.color = '#fff';

    if (type !== 'error') {
      setTimeout(() => { messageEl.style.display = 'none'; }, 4000);
    }
  }

  function init() {
    if (!initDOMReferences()) return;

    setupCartToggleButtons();
    setupAddToCartButtons();
    setupCheckoutButton();

    if (window.cartState) {
      window.cartState.onItemsChange((items) => updateCartDisplay(items));
      window.cartState.onUIChange((state) => syncCartUI(state));
      updateCartDisplay(window.cartState.getItems());
      syncCartUI({ isOpen: window.cartState.isOpen() });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();