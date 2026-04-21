/**
 * Checkout Page JS - صفحة إتمام الطلب
 * Front-end only simulation for payment UI
 */
(function () {
  'use strict';

  let cartItems = [];
  let subtotal = 0;
  let discountAmount = 0;
  let selectedPayment = 'cash';

  // ===================== تحميل السلة =====================
  function loadCartItems() {
    // جرب من cartState أولاً
    if (window.cartState && typeof window.cartState.getItems === 'function') {
      cartItems = window.cartState.getItems();
    } else {
      // fallback إلى localStorage
      try {
        cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
      } catch (e) {
        cartItems = [];
      }
    }
    renderCheckoutItems();
    updateTotals();
  }

  // ===================== عرض المنتجات =====================
  function renderCheckoutItems() {
    const container = document.getElementById('checkout-items-list');
    if (!container) return;

    if (!cartItems || cartItems.length === 0) {
      container.innerHTML = `
        <div class="empty-cart-msg">
          <i class="ri-shopping-cart-line"></i>
          <p>لا توجد منتجات في السلة</p>
          <a href="/" class="back-to-shop-btn">ارجع للتسوق</a>
        </div>`;
      document.getElementById('confirm-order-btn').disabled = true;
      return;
    }

    container.innerHTML = '';
    cartItems.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'checkout-item';
      const itemTotal = (Number(item.price) * Number(item.quantity)).toFixed(2);
      itemEl.innerHTML = `
        <img src="/${item.img || 'images/placeholder.png'}" alt="${item.title}"
             onerror="this.src='/images/placeholder.png';this.onerror=null;">
        <div class="checkout-item-info">
          <div class="checkout-item-name">${item.title}</div>
          <div class="checkout-item-qty">الكمية: ${item.quantity} × ${Number(item.price).toFixed(2)} جنيه</div>
        </div>
        <div class="checkout-item-price">${itemTotal} جنيه</div>
      `;
      container.appendChild(itemEl);
    });
  }

  // ===================== حساب الإجماليات =====================
  function updateTotals() {
    subtotal = cartItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    const grandTotal = Math.max(0, subtotal - discountAmount);

    const sub = document.getElementById('subtotal-val');
    const grand = document.getElementById('grand-total-val');
    const discRow = document.getElementById('discount-row');
    const discVal = document.getElementById('discount-val');

    if (sub) sub.textContent = subtotal.toFixed(2) + ' جنيه';
    if (grand) grand.textContent = grandTotal.toFixed(2) + ' جنيه';

    if (discountAmount > 0) {
      if (discRow) discRow.style.display = 'flex';
      if (discVal) discVal.textContent = '- ' + discountAmount.toFixed(2) + ' جنيه';
    } else {
      if (discRow) discRow.style.display = 'none';
    }
  }

  // ===================== طرق الدفع =====================
  document.querySelectorAll('.payment-method-card').forEach(card => {
    card.addEventListener('click', function () {
      document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      selectedPayment = this.dataset.method;
      this.querySelector('input[type=radio]').checked = true;

      // إظهار/إخفاء نماذج الدفع
      const cardForm = document.getElementById('card-form-section');
      const onlineForm = document.getElementById('online-form-section');
      if (cardForm) cardForm.style.display = selectedPayment === 'card' ? 'block' : 'none';
      if (onlineForm) onlineForm.style.display = selectedPayment === 'online' ? 'block' : 'none';
    });
  });

  // خيارات المحافظ الإلكترونية
  document.querySelectorAll('.wallet-opt').forEach(opt => {
    opt.addEventListener('click', function () {
      document.querySelectorAll('.wallet-opt').forEach(o => o.classList.remove('active'));
      this.classList.add('active');
      this.querySelector('input[type=radio]').checked = true;
    });
  });

  // ===================== تنسيق رقم البطاقة =====================
  window.formatCardNumber = function (input) {
    let val = input.value.replace(/\D/g, '').substring(0, 16);
    val = val.replace(/(.{4})/g, '$1 ').trim();
    input.value = val;

    const display = document.getElementById('card-num-display');
    if (display) {
      const padded = val.replace(/\S{4}/g, m => m + ' ').trim().padEnd(19, '•');
      display.textContent = val || '•••• •••• •••• ••••';
    }

    // تحديد نوع البطاقة
    const icon = document.getElementById('card-brand-icon');
    if (icon) {
      const num = val.replace(/\s/g, '');
      if (num.startsWith('4')) icon.className = 'ri-visa-line';
      else if (num.startsWith('5')) icon.className = 'ri-mastercard-line';
      else icon.className = 'ri-bank-card-line';
    }
  };

  window.formatExpiry = function (input) {
    let val = input.value.replace(/\D/g, '').substring(0, 4);
    if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
    input.value = val;
    const display = document.getElementById('card-expiry-display');
    if (display) display.textContent = val || 'MM/YY';
  };

  // ===================== تطبيق الكوبون (محاكاة) =====================
  window.applyCoupon = function () {
    const code = (document.getElementById('coupon-input')?.value || '').trim().toUpperCase();
    const msgEl = document.getElementById('coupon-msg');
    if (!code) {
      showCouponMsg('أدخل كود الكوبون أولاً', 'error');
      return;
    }

    // محاكاة كوبونات للعرض
    const mockCoupons = {
      'FOODNA10': { type: 'percentage', value: 10 },
      'FOODNA20': { type: 'percentage', value: 20 },
      'SAVE50': { type: 'fixed', value: 50 },
    };

    const coupon = mockCoupons[code];
    if (!coupon) {
      discountAmount = 0;
      updateTotals();
      showCouponMsg('❌ كود الخصم غير صحيح', 'error');
      return;
    }

    if (coupon.type === 'percentage') {
      discountAmount = subtotal * (coupon.value / 100);
    } else {
      discountAmount = Math.min(coupon.value, subtotal);
    }

    updateTotals();
    showCouponMsg(`✅ تم تطبيق خصم ${coupon.value}${coupon.type === 'percentage' ? '%' : ' جنيه'}!`, 'success');
  };

  function showCouponMsg(text, type) {
    const el = document.getElementById('coupon-msg');
    if (!el) return;
    el.textContent = text;
    el.className = 'coupon-msg ' + type;
  }

  // ===================== تأكيد الطلب =====================
  window.submitCheckoutOrder = async function () {
    // التحقق من البيانات المدخلة
    const name = document.getElementById('full-name')?.value?.trim();
    const phone = document.getElementById('phone-number')?.value?.trim();
    const address = document.getElementById('delivery-address')?.value?.trim();

    if (!name) { showCheckoutMsg('أدخل اسمك الكامل', 'error'); return; }
    if (!phone || phone.length < 10) { showCheckoutMsg('أدخل رقم هاتف صحيح', 'error'); return; }
    if (!address) { showCheckoutMsg('أدخل عنوان التوصيل', 'error'); return; }

    // التحقق من بيانات البطاقة
    if (selectedPayment === 'card') {
      const cardNum = document.getElementById('card-number')?.value?.replace(/\s/g, '');
      const expiry = document.getElementById('card-expiry')?.value;
      const cvv = document.getElementById('card-cvv')?.value;
      if (!cardNum || cardNum.length < 16) { showCheckoutMsg('أدخل رقم بطاقة صحيح (16 رقم)', 'error'); return; }
      if (!expiry || expiry.length < 5) { showCheckoutMsg('أدخل تاريخ انتهاء البطاقة', 'error'); return; }
      if (!cvv || cvv.length < 3) { showCheckoutMsg('أدخل CVV البطاقة', 'error'); return; }
    }

    if (selectedPayment === 'online') {
      const walletPhone = document.getElementById('wallet-phone')?.value?.trim();
      if (!walletPhone || walletPhone.length < 10) { showCheckoutMsg('أدخل رقم المحفظة الإلكترونية', 'error'); return; }
    }

    if (!cartItems || cartItems.length === 0) {
      showCheckoutMsg('السلة فارغة!', 'error');
      return;
    }

    // إرسال للـ backend
    const btn = document.getElementById('confirm-order-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="ri-loader-4-line" style="animation:spin 1s linear infinite"></i> جاري تأكيد الطلب...';
    }

    showCheckoutMsg('جاري معالجة طلبك...', 'info');

    try {
      // إرسال الطلب للـ API
      const grandTotal = Math.max(0, subtotal - discountAmount);
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: cartItems.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price
          })),
          totalAmount: grandTotal,
          deliveryAddress: `${address} - ${name} - ${phone}`,
          paymentMethod: selectedPayment,
          notes: document.getElementById('order-notes')?.value || ''
        })
      });

      if (response.status === 401) {
        showCheckoutMsg('يجب تسجيل الدخول أولاً!', 'error');
        setTimeout(() => {
          localStorage.setItem('checkoutIntent', 'true');
          localStorage.setItem('postAuthRedirect', '/checkout');
          window.location.href = '/user/register';
        }, 1200);
        return;
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'فشل في إنشاء الطلب');
      }

      // نجاح
      const orderNum = data.data?.orderNumber || data.data?.Order_ID || '—';
      document.getElementById('success-order-num').textContent = '#' + orderNum;

      // مسح السلة
      if (window.cartState && typeof window.cartState.clear === 'function') {
        window.cartState.clear();
      } else {
        localStorage.removeItem('cart');
      }

      showSuccessModal();

    } catch (err) {
      console.error('Checkout error:', err);
      showCheckoutMsg('❌ ' + (err.message || 'حدث خطأ، حاول مرة أخرى'), 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="ri-check-double-line"></i> تأكيد الطلب';
      }
    }
  };

  function showCheckoutMsg(text, type) {
    const el = document.getElementById('checkout-msg');
    if (!el) return;
    el.textContent = text;
    el.className = 'checkout-msg-bar ' + type;
    el.style.display = 'block';
    if (type !== 'error') {
      setTimeout(() => { el.style.display = 'none'; }, 5000);
    }
  }

  // ===================== مودال النجاح =====================
  function showSuccessModal() {
    const modal = document.getElementById('order-success-modal');
    const overlay = document.getElementById('modal-overlay');
    if (modal) modal.style.display = 'block';
    if (overlay) overlay.style.display = 'block';
  }

  window.closeSuccessModal = function () {
    const modal = document.getElementById('order-success-modal');
    const overlay = document.getElementById('modal-overlay');
    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
  };

  // ===================== CSS لأنيميشن الـ spinner =====================
  const spinStyle = document.createElement('style');
  spinStyle.textContent = `@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`;
  document.head.appendChild(spinStyle);

  // ===================== تهيئة =====================
  function init() {
    loadCartItems();

    // لو في intent للـ checkout، اعمل redirect هنا
    const intent = localStorage.getItem('checkoutIntent');
    if (!intent) return;
    localStorage.removeItem('checkoutIntent');
    localStorage.removeItem('postAuthRedirect');

    // استرجاع السلة المعلقة
    try {
      const pendingCart = JSON.parse(localStorage.getItem('pendingCart') || '[]');
      if (pendingCart.length > 0) {
        if (window.cartState && typeof window.cartState.addItem === 'function') {
          pendingCart.forEach(item => window.cartState.addItem(item));
        }
        localStorage.removeItem('pendingCart');
        loadCartItems();
      }
    } catch (e) { /* ignore */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
