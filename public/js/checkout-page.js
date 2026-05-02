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
  let currentOrderId  = null; // الطلب الحالي للـ grace period
  let graceInterval   = null; // مؤقت فترة السماح

  // CURRENT_USER بيجي من الـ EJS (session data) — null لو مش logged in
  const isLoggedIn = !!(window.CURRENT_USER);

  // ===================== التحقق من تسجيل الدخول أولاً =====================
  // نتحقق من الـ session قبل أي حاجة تانية
  async function checkAuthBeforeCheckout() {
    try {
      const res = await fetch('/auth/api/auth/check', {
        credentials: 'include'
      });
      const data = await res.json();

      if (!data.authenticated) {
        // احفظ السلة عشان ترجعها بعد تسجيل الدخول
        try {
          const currentCart = window.cartState?.getItems?.() || 
                              JSON.parse(localStorage.getItem('cart') || '[]');
          if (currentCart.length > 0) {
            localStorage.setItem('pendingCart', JSON.stringify(currentCart));
          }
        } catch(e) {}

        // روّح لصفحة الـ login مع الـ next parameter
        window.location.href = '/login?next=' + encodeURIComponent('/checkout');
        return false;
      }
      return true;
    } catch(e) {
      // لو فشل الـ check، متوقفش الصفحة — خليها تشتغل
      return true;
    }
  }

  // ===================== تحميل السلة =====================
  function loadCartItems() {
    if (window.cartState && typeof window.cartState.getItems === 'function') {
      cartItems = window.cartState.getItems();
    } else {
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
      const confirmBtn = document.getElementById('confirm-order-btn');
      if (confirmBtn) confirmBtn.disabled = true;
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

    const sub     = document.getElementById('subtotal-val');
    const grand   = document.getElementById('grand-total-val');
    const discRow = document.getElementById('discount-row');
    const discVal = document.getElementById('discount-val');

    if (sub)   sub.textContent   = subtotal.toFixed(2) + ' جنيه';
    if (grand) grand.textContent = grandTotal.toFixed(2) + ' جنيه';

    if (discountAmount > 0) {
      if (discRow) discRow.style.display = 'flex';
      if (discVal) discVal.textContent   = '- ' + discountAmount.toFixed(2) + ' جنيه';
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

      const cardForm   = document.getElementById('card-form-section');
      const onlineForm = document.getElementById('online-form-section');
      if (cardForm)   cardForm.style.display   = selectedPayment === 'card'   ? 'block' : 'none';
      if (onlineForm) onlineForm.style.display = selectedPayment === 'online' ? 'block' : 'none';
    });
  });

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
      display.textContent = val || '•••• •••• •••• ••••';
    }

    const icon = document.getElementById('card-brand-icon');
    if (icon) {
      const num = val.replace(/\s/g, '');
      if (num.startsWith('4'))      icon.className = 'ri-visa-line';
      else if (num.startsWith('5')) icon.className = 'ri-mastercard-line';
      else                          icon.className = 'ri-bank-card-line';
    }
  };

  window.formatExpiry = function (input) {
    let val = input.value.replace(/\D/g, '').substring(0, 4);
    if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
    input.value = val;
    const display = document.getElementById('card-expiry-display');
    if (display) display.textContent = val || 'MM/YY';
  };

  // ===================== تطبيق الكوبون =====================
  window.applyCoupon = async function () {
    const code = (document.getElementById('coupon-input')?.value || '').trim().toUpperCase();
    if (!code) {
      showCouponMsg('أدخل كود الكوبون أولاً', 'error');
      return;
    }

    const btn = document.getElementById('apply-coupon-btn');
    if (btn) { btn.disabled = true; btn.textContent = '...'; }

    try {
      const response = await fetch('/admin/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code, totalAmount: subtotal })
      });

      const data = await response.json();

      if (!data.success) {
        discountAmount = 0;
        updateTotals();
        showCouponMsg('❌ كود الخصم غير صحيح أو منتهي الصلاحية', 'error');
        return;
      }

      if (data.data?.discount !== undefined) {
        discountAmount = parseFloat(data.data.discount) || 0;
      } else {
        const coupon = data.data?.coupon || data.data;
        if (coupon.Discount_Type === 'percentage') {
          discountAmount = subtotal * (parseFloat(coupon.Discount_Value) / 100);
        } else {
          discountAmount = Math.min(parseFloat(coupon.Discount_Value), subtotal);
        }
      }

      updateTotals();
      showCouponMsg(`✅ تم تطبيق الكوبون! وفرت ${discountAmount.toFixed(2)} جنيه`, 'success');

    } catch (err) {
      discountAmount = 0;
      updateTotals();
      showCouponMsg('❌ حدث خطأ في التحقق من الكوبون', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'تطبيق'; }
    }
  };

  function showCouponMsg(text, type) {
    const el = document.getElementById('coupon-msg');
    if (!el) return;
    el.textContent = text;
    el.className   = 'coupon-msg ' + type;
  }

  // ===================== تأكيد الطلب =====================
  window.submitCheckoutOrder = async function () {
    const address = document.getElementById('delivery-address')?.value?.trim();
    let name, phone;

    if (!isLoggedIn) {
      // غير مسجل: اطلب الاسم والتليفون من الفورم
      name  = document.getElementById('full-name')?.value?.trim();
      phone = document.getElementById('phone-number')?.value?.trim();
      if (!name)                       { showCheckoutMsg('أدخل اسمك الكامل', 'error'); return; }
      if (!phone || phone.length < 10) { showCheckoutMsg('أدخل رقم هاتف صحيح', 'error'); return; }
    } else {
      // مسجل: ناخد البيانات من الـ session
      name  = window.CURRENT_USER?.name  || '';
      phone = window.CURRENT_USER?.phone || '';
    }

    if (!address) { showCheckoutMsg('أدخل عنوان التوصيل', 'error'); return; }

    if (selectedPayment === 'card') {
      const cardNum = document.getElementById('card-number')?.value?.replace(/\s/g, '');
      const expiry  = document.getElementById('card-expiry')?.value;
      const cvv     = document.getElementById('card-cvv')?.value;
      if (!cardNum || cardNum.length < 16) { showCheckoutMsg('أدخل رقم بطاقة صحيح (16 رقم)', 'error'); return; }
      if (!expiry || expiry.length < 5)    { showCheckoutMsg('أدخل تاريخ انتهاء البطاقة', 'error'); return; }
      if (!cvv || cvv.length < 3)          { showCheckoutMsg('أدخل CVV البطاقة', 'error'); return; }
    }

    if (selectedPayment === 'online') {
      const walletPhone = document.getElementById('wallet-phone')?.value?.trim();
      if (!walletPhone || walletPhone.length < 10) { showCheckoutMsg('أدخل رقم المحفظة الإلكترونية', 'error'); return; }
    }

    if (!cartItems || cartItems.length === 0) {
      showCheckoutMsg('السلة فارغة!', 'error');
      return;
    }

    const btn = document.getElementById('confirm-order-btn');
    if (btn) {
      btn.disabled  = true;
      btn.innerHTML = '<i class="ri-loader-4-line" style="animation:spin 1s linear infinite"></i> جاري تأكيد الطلب...';
    }

    showCheckoutMsg('جاري معالجة طلبك...', 'info');

    try {
      const grandTotal = Math.max(0, subtotal - discountAmount);

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: cartItems.map(item => ({
            productId: item.id,
            quantity:  item.quantity,
            price:     item.price
          })),
          totalAmount:     grandTotal,
          deliveryAddress: `${address} - ${name} - ${phone}`,
          paymentMethod:   selectedPayment,
          notes:           document.getElementById('order-notes')?.value || ''
        })
      });

      // ===================================================
      // الـ FIX الأساسي: لو الـ session انتهت أثناء الجلسة
      // نروح لصفحة الـ login مع next=/checkout
      // ===================================================
      if (response.status === 401) {
        try {
          localStorage.setItem('pendingCart', JSON.stringify(cartItems));
        } catch(e) {}
        showCheckoutMsg('انتهت جلستك، جاري تحويلك لتسجيل الدخول...', 'error');
        setTimeout(() => {
          window.location.href = '/login?next=' + encodeURIComponent('/checkout');
        }, 1200);
        return;
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'فشل في إنشاء الطلب');
      }

      // نجاح ✅
      const orderNum = data.data?.orderNumber || data.data?.orderId || data.data?.Order_ID || '—';
      const successNumEl = document.getElementById('success-order-num');
      if (successNumEl) successNumEl.textContent = '#' + orderNum;
      currentOrderId = orderNum;

      // مسح السلة
      if (window.cartState && typeof window.cartState.clear === 'function') {
        window.cartState.clear();
      } else {
        localStorage.removeItem('cart');
      }
      localStorage.removeItem('pendingCart');

      showSuccessModal(orderNum);

    } catch (err) {
      showCheckoutMsg('❌ ' + (err.message || 'حدث خطأ، حاول مرة أخرى'), 'error');
      if (btn) {
        btn.disabled  = false;
        btn.innerHTML = '<i class="ri-check-double-line"></i> تأكيد الطلب';
      }
    }
  };

  function showCheckoutMsg(text, type) {
    const el = document.getElementById('checkout-msg');
    if (!el) return;
    el.textContent   = text;
    el.className     = 'checkout-msg-bar ' + type;
    el.style.display = 'block';
    if (type !== 'error') {
      setTimeout(() => { el.style.display = 'none'; }, 5000);
    }
  }

  // ===================== مودال النجاح + Grace Period =====================
  function showSuccessModal(orderId) {
    const modal   = document.getElementById('order-success-modal');
    const overlay = document.getElementById('modal-overlay');
    if (modal)   modal.style.display   = 'block';
    if (overlay) overlay.style.display = 'block';

    // بدء العداد 3 دقائق
    startGraceTimer(orderId);
  }

  function startGraceTimer(orderId) {
    const GRACE_SECONDS = 3 * 60; // 3 دقائق
    let remaining = GRACE_SECONDS;
    const timerEl   = document.getElementById('grace-timer');
    const sectionEl = document.getElementById('grace-period-section');

    if (graceInterval) clearInterval(graceInterval);

    graceInterval = setInterval(() => {
      remaining--;
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      if (timerEl) timerEl.textContent = ` ${mins}:${secs.toString().padStart(2, '0')}`;

      if (remaining <= 0) {
        clearInterval(graceInterval);
        // إخفاء أزرار التعديل والإلغاء بعد انتهاء الوقت
        if (sectionEl) sectionEl.style.display = 'none';
      }
    }, 1000);
  }

  // تعديل الطلب — يرجع لصفحة الـ checkout مع نفس الطلب
  window.graceEditOrder = function () {
    if (!currentOrderId) return;
    clearInterval(graceInterval);
    window.location.href = '/checkout?edit=' + currentOrderId;
  };

  // إلغاء الطلب خلال فترة السماح
  window.graceCancelOrder = async function () {
    if (!currentOrderId) return;
    const editBtn   = document.getElementById('grace-edit-btn');
    const cancelBtn = document.getElementById('grace-cancel-btn');
    if (cancelBtn) { cancelBtn.disabled = true; cancelBtn.textContent = 'جاري الإلغاء...'; }
    if (editBtn)   editBtn.disabled = true;

    try {
      const res = await fetch('/api/orders/' + currentOrderId, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();

      if (res.ok && data.success) {
        clearInterval(graceInterval);
        // أغلق المودال وروح الرئيسية
        window.closeSuccessModal();
        window.location.href = '/';
      } else {
        if (cancelBtn) { cancelBtn.disabled = false; cancelBtn.textContent = 'إلغاء الطلب'; }
        if (editBtn)   editBtn.disabled = false;
        alert(data.message || 'فشل الإلغاء، حاول مرة أخرى');
      }
    } catch (e) {
      if (cancelBtn) { cancelBtn.disabled = false; cancelBtn.textContent = 'إلغاء الطلب'; }
      if (editBtn)   editBtn.disabled = false;
      alert('حدث خطأ في الاتصال');
    }
  };

  window.closeSuccessModal = function () {
    const modal   = document.getElementById('order-success-modal');
    const overlay = document.getElementById('modal-overlay');
    if (modal)   modal.style.display   = 'none';
    if (overlay) overlay.style.display = 'none';
    if (graceInterval) clearInterval(graceInterval);
  };

  // ===================== CSS spinner =====================
  const spinStyle = document.createElement('style');
  spinStyle.textContent = `@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`;
  document.head.appendChild(spinStyle);

  // ===================== تهيئة =====================
  async function init() {
    // استرجاع السلة المعلقة لو في pendingCart
    try {
      const pendingCart = JSON.parse(localStorage.getItem('pendingCart') || '[]');
      if (pendingCart.length > 0) {
        if (window.cartState && typeof window.cartState.clear === 'function') {
          window.cartState.clear();
          pendingCart.forEach(item => window.cartState.addItem?.(item));
        } else {
          localStorage.setItem('cart', JSON.stringify(pendingCart));
        }
        localStorage.removeItem('pendingCart');
      }
    } catch(e) {}

    // التحقق من تسجيل الدخول — لو مش مسجل يروح login
    const isAuth = await checkAuthBeforeCheckout();
    if (!isAuth) return;

    loadCartItems();
  }

  function attachPageEvents() {
    const confirmBtn = document.getElementById('confirm-order-btn');
    if (confirmBtn && !confirmBtn._bound) {
      confirmBtn.addEventListener('click', submitCheckoutOrder);
      confirmBtn._bound = true;
    }

    const applyBtn = document.getElementById('apply-coupon-btn');
    if (applyBtn && !applyBtn._bound) {
      applyBtn.addEventListener('click', applyCoupon);
      applyBtn._bound = true;
    }

    document.querySelectorAll('.payment-method-card').forEach(card => {
      if (card._bound) return;
      card.addEventListener('click', function () {
        document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        selectedPayment = this.dataset.method;
        const radio = this.querySelector('input[type=radio]');
        if (radio) radio.checked = true;

        const cardForm   = document.getElementById('card-form-section');
        const onlineForm = document.getElementById('online-form-section');
        if (cardForm)   cardForm.style.display   = selectedPayment === 'card'   ? 'block' : 'none';
        if (onlineForm) onlineForm.style.display = selectedPayment === 'online' ? 'block' : 'none';
      });
      card._bound = true;
    });

    document.querySelectorAll('.wallet-opt').forEach(opt => {
      if (opt._bound) return;
      opt.addEventListener('click', function () {
        document.querySelectorAll('.wallet-opt').forEach(o => o.classList.remove('active'));
        this.classList.add('active');
        const radio = this.querySelector('input[type=radio]');
        if (radio) radio.checked = true;
      });
      opt._bound = true;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
      attachPageEvents();
    });
  } else {
    init();
    attachPageEvents();
  }

})();