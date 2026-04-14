(function(){
  // بناء نافذة الدفع - التحقق من عدم وجودها أولاً
  function buildModal(){
    if (document.getElementById('checkoutModal')) return;

    const modal = document.createElement('div');
    modal.id = 'checkoutModal';
    modal.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);z-index:9999;overflow-y:auto;padding:16px 0;';
    modal.innerHTML = `
      <div style="background:#fff;border-radius:12px;width:560px;max-width:96%;padding:24px;box-shadow:0 12px 40px rgba(0,0,0,0.22);direction:rtl;font-family:inherit;position:relative;">
        <button id="checkoutClose" type="button" style="position:absolute;left:14px;top:14px;background:none;border:none;font-size:22px;cursor:pointer;color:#888;">&times;</button>
        <h3 style="margin:0 0 16px;font-size:20px;color:#1a1a1a;">تأكيد الطلب</h3>

        <div id="checkoutSummary" style="background:#f9f9f9;border-radius:8px;padding:12px;margin-bottom:14px;max-height:200px;overflow-y:auto;font-size:14px;"></div>
        <div id="checkoutTotal" style="text-align:left;font-weight:700;font-size:16px;color:#e62a32;margin-bottom:14px;"></div>

        <form id="checkoutForm">
          <div style="margin-bottom:10px">
            <label style="display:block;margin-bottom:4px;font-weight:600;font-size:14px;">طريقة الدفع</label>
            <div style="display:flex;gap:16px;">
              <label style="cursor:pointer;display:flex;align-items:center;gap:6px;">
                <input type="radio" name="paymentMethod" value="cash" checked>
                <span>💵 نقداً عند الاستلام</span>
              </label>
              <label style="cursor:pointer;display:flex;align-items:center;gap:6px;">
                <input type="radio" name="paymentMethod" value="card">
                <span>💳 بطاقة ائتمانية</span>
              </label>
            </div>
          </div>

          <div style="margin-bottom:10px">
            <label style="display:block;margin-bottom:4px;font-weight:600;font-size:14px;">عنوان التوصيل <span style="color:#e62a32">*</span></label>
            <input type="text" id="checkoutAddress" name="deliveryAddress"
              style="width:100%;padding:9px 12px;border:1.5px solid #ddd;border-radius:7px;font-size:14px;box-sizing:border-box;" required>
          </div>

          <div style="margin-bottom:10px">
            <label style="display:block;margin-bottom:4px;font-weight:600;font-size:14px;">رقم الهاتف <span style="color:#e62a32">*</span></label>
            <input type="text" id="checkoutPhone" name="phone"
              style="width:100%;padding:9px 12px;border:1.5px solid #ddd;border-radius:7px;font-size:14px;box-sizing:border-box;" required>
          </div>

          <div style="margin-bottom:10px">
            <label style="display:block;margin-bottom:4px;font-weight:600;font-size:14px;">ملاحظات إضافية</label>
            <textarea id="checkoutNotes" name="notes" rows="2"
              style="width:100%;padding:9px 12px;border:1.5px solid #ddd;border-radius:7px;font-size:14px;box-sizing:border-box;resize:vertical;"></textarea>
          </div>

          <div id="checkoutError" style="display:none;background:#fff0f0;border:1px solid #fcc;border-radius:6px;padding:9px 12px;color:#c00;font-size:13px;margin-bottom:10px;"></div>

          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;">
            <button type="button" id="checkoutCancel"
              style="background:#f0f0f0;color:#333;padding:10px 18px;border-radius:8px;border:none;font-size:14px;cursor:pointer;">إلغاء</button>
            <button type="submit" id="checkoutSubmit"
              style="background:linear-gradient(135deg,#ff6b6b,var(--text-color));color:#fff;padding:10px 22px;border-radius:8px;border:none;font-size:14px;font-weight:700;cursor:pointer;min-width:120px;">
              تأكيد الطلب 🛍️
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', function(e){ if (e.target === modal) closeModal(); });
    document.getElementById('checkoutClose').addEventListener('click', closeModal);
    document.getElementById('checkoutCancel').addEventListener('click', closeModal);
    document.getElementById('checkoutForm').addEventListener('submit', onSubmit);
  }

  function renderSummary(cartItems, totalAmount){
    const summaryEl = document.getElementById('checkoutSummary');
    const totalEl   = document.getElementById('checkoutTotal');
    if (!summaryEl || !totalEl) return;
    if (!cartItems || cartItems.length === 0){
      summaryEl.innerHTML = '<p style="color:#999;text-align:center;margin:0;">السلة فارغة</p>';
      totalEl.textContent = '';
      return;
    }
    summaryEl.innerHTML = cartItems.map(item => {
      const name  = item.Product_Name || item.title || item.name || 'منتج';
      const qty   = item.quantity  || item.Quantity || 1;
      const price = item.price     || item.Price    || 0;
      const sub   = (parseFloat(price) * parseInt(qty)).toFixed(2);
      return `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee;">
        <span>${name} × ${qty}</span>
        <span style="font-weight:600;">${sub} جنيه</span>
      </div>`;
    }).join('');
    totalEl.innerHTML = `الإجمالي: <span style="font-size:18px;">${parseFloat(totalAmount).toFixed(2)} جنيه</span>`;
  }

  function openCheckoutModal(cartItems, totalAmount){
    buildModal();
    const modal = document.getElementById('checkoutModal');
    modal.style.display = 'flex';
    try{
      if (window.currentUser && window.currentUser.address) document.getElementById('checkoutAddress').value = window.currentUser.address;
      if (window.currentUser && window.currentUser.phone)   document.getElementById('checkoutPhone').value   = window.currentUser.phone;
    }catch(e){}
    modal.__cart  = cartItems  || [];
    modal.__total = totalAmount || 0;
    renderSummary(cartItems, totalAmount);
    const errEl = document.getElementById('checkoutError');
    if (errEl) errEl.style.display = 'none';
  }

  function closeModal(){
    const modal = document.getElementById('checkoutModal');
    if (modal) modal.style.display = 'none';
  }

  function showError(msg){
    const errEl = document.getElementById('checkoutError');
    if (!errEl) return;
    errEl.textContent    = msg;
    errEl.style.display  = 'block';
  }

  function setSubmitLoading(loading){
    const btn = document.getElementById('checkoutSubmit');
    if (!btn) return;
    btn.disabled     = loading;
    btn.textContent  = loading ? 'جارٍ الإرسال...' : 'تأكيد الطلب 🛍️';
    btn.style.opacity= loading ? '0.7' : '1';
  }

  async function onSubmit(e){
    e.preventDefault();
    const modal = document.getElementById('checkoutModal');
    const cart  = modal.__cart  || [];
    const total = modal.__total || 0;

    const errEl = document.getElementById('checkoutError');
    if (errEl) errEl.style.display = 'none';

    if (!cart || cart.length === 0){ showError('السلة فارغة، أضف منتجات أولاً'); return; }

    const address = document.getElementById('checkoutAddress').value.trim();
    const phone   = document.getElementById('checkoutPhone').value.trim();
    const notes   = document.getElementById('checkoutNotes').value.trim();
    const pm      = document.querySelector('input[name="paymentMethod"]:checked').value;

    if (!address){ showError('عنوان التوصيل مطلوب'); return; }
    if (!phone || !/^[0-9\s\-\+]{7,20}$/.test(phone)){ showError('رقم هاتف صالح مطلوب'); return; }

    // التحقق من المصادقة
    let authOk = false;
    try{
      const r = await fetch('/auth/api/auth/check', { credentials: 'include' });
      const d = await r.json();
      authOk = d && d.authenticated === true;
    }catch(err){ console.warn('[Checkout] auth check failed', err); }

    if (!authOk){
      try{
        localStorage.setItem('pendingCart', JSON.stringify(cart));
        localStorage.setItem('postAuthRedirect', window.location.pathname + window.location.search);
        localStorage.setItem('checkoutIntent', 'true');
      }catch(e){}
      closeModal();
      alert('انتهت جلستك — يجب تسجيل الدخول مرة أخرى');
      window.location.href = '/user/register';
      return;
    }

    setSubmitLoading(true);

    const payload = {
      items: cart.map(item => ({
        productId: item.id || item.Product_ID || item.ProductId,
        quantity:  item.quantity || item.Quantity,
        price:     item.price    || item.Price
      })),
      totalAmount:     total,
      deliveryAddress: address,
      paymentMethod:   pm,
      phone:           phone,
      notes:           notes
    };

    try{
      const res  = await fetch('/api/orders', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.status === 401){
        try{
          localStorage.setItem('pendingCart', JSON.stringify(cart));
          localStorage.setItem('postAuthRedirect', window.location.pathname + window.location.search);
          localStorage.setItem('checkoutIntent', 'true');
        }catch(e){}
        setSubmitLoading(false);
        closeModal();
        alert('انتهت جلستك — يرجى تسجيل الدخول مرة أخرى');
        window.location.href = '/user/register';
        return;
      }

      if (!res.ok || !data.success){
        setSubmitLoading(false);
        showError((data && data.message) || 'فشل في إنشاء الطلب، حاول مرة أخرى');
        return;
      }

      // ✅ نجاح — تنظيف وتوجيه لصفحة الطلبات
      const orderId = data.data && (data.data.orderId || data.data.orderNumber);
      try{
        localStorage.removeItem('cart');
        localStorage.removeItem('pendingCart');
        localStorage.removeItem('postAuthRedirect');
        localStorage.removeItem('checkoutIntent');
      }catch(e){}

      try{ if (typeof updetecart === 'function') updetecart(); }catch(e){}

      closeModal();

      // التوجيه لصفحة الطلبات
      window.location.href = '/orders' + (orderId ? '?new=' + orderId : '');

    }catch(err){
      setSubmitLoading(false);
      console.error('[Checkout] Submit error', err);
      showError('حدث خطأ أثناء إرسال الطلب، تحقق من اتصالك');
    }
  }

  window.openCheckoutModal = openCheckoutModal;

  // استعادة السلة المعلقة
  document.addEventListener('DOMContentLoaded', function(){
    try{
      const intent       = localStorage.getItem('checkoutIntent');
      const pending      = localStorage.getItem('pendingCart');
      const redirectPath = localStorage.getItem('postAuthRedirect');
      if (intent && pending){
        if (!redirectPath || redirectPath === (window.location.pathname + window.location.search)){
          const cart  = JSON.parse(pending || '[]');
          const total = cart.reduce((s, it) => s + ((it.price || 0) * (it.quantity || 1)), 0);
          openCheckoutModal(cart, total);
          localStorage.removeItem('pendingCart');
          localStorage.removeItem('postAuthRedirect');
          localStorage.removeItem('checkoutIntent');
        }
      }
    }catch(e){ console.warn('[Checkout] Rehydrate failed', e && e.message ? e.message : e); }
  });
})();