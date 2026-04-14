// منع تشغيل الـ fallback في offers.ejs (يجب أن يُعرَّف قبل أي شيء آخر)
window.apiass = true;

(async function () {
  'use strict';

  const container = document.querySelector('.products-grid_1');
  if (!container) { console.warn('[OFFERS] container .products-grid_1 not found'); return; }

  // ===== Loading skeleton =====
  container.innerHTML = Array(4).fill(
    `<div style="background:#f5f5f5;border-radius:12px;height:280px;animation:offerPulse 1.2s infinite alternate;"></div>`
  ).join('');

  // inject keyframe once
  if (!document.getElementById('offer-pulse-style')) {
    const s = document.createElement('style');
    s.id = 'offer-pulse-style';
    s.textContent = `@keyframes offerPulse{from{opacity:.5}to{opacity:1}}`;
    document.head.appendChild(s);
  }

  // ===== Fetch =====
  let products = [];
  try {
    const res = await fetch('/api/products?discounted=1&limit=100');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    products = await res.json();
    if (!Array.isArray(products)) products = products.data || products.products || [];
  } catch (err) {
    console.error('[OFFERS] fetch error:', err);
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">
        <p style="font-size:18px;">⚠️ تعذّر تحميل العروض</p>
        <button onclick="location.reload()" style="margin-top:10px;padding:8px 20px;border:1.5px solid var(--text-color);border-radius:8px;color:var(--text-color);background:#fff;cursor:pointer;">إعادة المحاولة</button>
      </div>`;
    return;
  }

  // ===== Filter & render =====
  const offers = products.filter(p => parseFloat(p.Discount || p.discount || 0) > 0);

  if (!offers.length) {
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:40px;color:#aaa;">
        <p style="font-size:20px;">🏷️</p>
        <p>لا توجد عروض متاحة حالياً</p>
      </div>`;
    return;
  }

  // ===== Build cards =====
  container.innerHTML = '';

  offers.forEach(product => {
    const pid      = product.Product_ID || product.id;
    const name     = product.Product_Name || product.name || 'منتج';
    const oldPrice = parseFloat(product.Price || product.price || 0);
    const discount = parseFloat(product.Discount || product.discount || 0);
    const newPrice = oldPrice * (1 - discount / 100);

    // بناء مسار الصورة
    let imgSrc = '';
    const rawImg = product.Image || product.img || '';
    if (rawImg) {
      const clean = rawImg.replace(/^\/+/, '');
      imgSrc = clean.startsWith('images/') ? '/' + clean : '/images/products/' + clean;
    }

    const card = document.createElement('div');
    card.className = 'product product_only';
    card.style.cssText = 'position:relative;border-radius:12px;overflow:hidden;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,0.08);transition:transform .2s,box-shadow .2s;cursor:pointer;';

    card.innerHTML = `
      <!-- شارة الخصم -->
      <div style="position:absolute;top:10px;right:10px;background:#e62a32;color:#fff;font-size:12px;font-weight:700;padding:4px 8px;border-radius:20px;z-index:2;">
        خصم ${discount.toFixed(0)}%
      </div>

      <!-- صورة المنتج -->
      <a href="/product-page?id=${pid}" style="display:block;text-decoration:none;">
        ${imgSrc
          ? `<img src="${imgSrc}" alt="${escOffer(name)}"
              style="width:100%;height:180px;object-fit:cover;display:block;"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`
          : ''
        }
        <div style="${imgSrc ? 'display:none;' : 'display:flex;'}width:100%;height:180px;align-items:center;justify-content:center;background:#f8f8f8;font-size:52px;">
          🍽️
        </div>
      </a>

      <!-- بيانات المنتج -->
      <div style="padding:12px 14px 14px;">
        <a href="/product-page?id=${pid}" style="text-decoration:none;color:inherit;">
          <h4 style="margin:0 0 8px;font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escOffer(name)}</h4>
        </a>

        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
          <span style="text-decoration:line-through;color:#bbb;font-size:13px;">${oldPrice.toFixed(2)} جنيه</span>
          <span style="color:#e62a32;font-weight:700;font-size:16px;">${newPrice.toFixed(2)} جنيه</span>
        </div>

        <div style="display:flex;gap:8px;">
          <button
            data-pid="${pid}"
            data-name="${escOffer(name)}"
            data-price="${newPrice.toFixed(2)}"
            data-img="${imgSrc}"
            class="offer-add-btn"
            style="flex:1;background:var(--text-color);color:#fff;border:none;border-radius:8px;padding:9px 0;font-size:13px;font-weight:700;cursor:pointer;transition:opacity .2s;">
            🛒 أضف للسلة
          </button>
          <a href="/product-page?id=${pid}"
            style="padding:9px 12px;border:1.5px solid var(--text-color);color:var(--text-color);border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;white-space:nowrap;">
            التفاصيل
          </a>
        </div>
      </div>
    `;

    // hover effect
    card.addEventListener('mouseenter', () => {
      card.style.transform  = 'translateY(-4px)';
      card.style.boxShadow  = '0 8px 24px rgba(0,0,0,0.13)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform  = '';
      card.style.boxShadow  = '0 2px 12px rgba(0,0,0,0.08)';
    });

    container.appendChild(card);
  });

  // ===== أزرار "أضف للسلة" =====
  container.addEventListener('click', function (e) {
    const btn = e.target.closest('.offer-add-btn');
    if (!btn) return;
    e.preventDefault();

    const payload = {
      Product_ID:   Number(btn.dataset.pid),
      Product_Name: btn.dataset.name,
      Price:        parseFloat(btn.dataset.price),
      Image:        btn.dataset.img || ''
    };

    // محاولة استخدام addToCart العامة
    if (typeof addToCart === 'function') {
      addToCart(payload);
      btn.textContent    = '✓ أُضيف للسلة';
      btn.style.opacity  = '0.75';
      setTimeout(() => {
        btn.textContent   = '🛒 أضف للسلة';
        btn.style.opacity = '1';
      }, 1800);
    } else {
      // fallback: حفظ في localStorage
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existing = cart.find(i => i.Product_ID === payload.Product_ID);
        if (existing) existing.quantity = (existing.quantity || 1) + 1;
        else cart.push({ ...payload, quantity: 1 });
        localStorage.setItem('cart', JSON.stringify(cart));
        btn.textContent   = '✓ أُضيف للسلة';
        btn.style.opacity = '0.75';
        setTimeout(() => { btn.textContent = '🛒 أضف للسلة'; btn.style.opacity = '1'; }, 1800);
      } catch (err) {
        console.error('[OFFERS] addToCart fallback error:', err);
      }
    }
  });

  // ===== Dark mode toggle (موروث من الملف القديم) =====
  const themButton = document.getElementById('theme-button');
  if (themButton) {
    const darkTheme = 'dark-theme';
    const iconTheme = 'ri-sun-line';
    const selectedTheme = localStorage.getItem('selected-theme');
    const selectedIcon  = localStorage.getItem('selected-icon');
    if (selectedTheme) {
      document.body.classList[selectedTheme === 'dark' ? 'add' : 'remove'](darkTheme);
      themButton.classList[selectedIcon === 'ri-moon-line' ? 'add' : 'remove'](iconTheme);
    }
    themButton.addEventListener('click', () => {
      document.body.classList.toggle(darkTheme);
      themButton.classList.toggle(iconTheme);
      localStorage.setItem('selected-theme', document.body.classList.contains(darkTheme) ? 'dark' : 'light');
      localStorage.setItem('selected-icon', themButton.classList.contains(iconTheme) ? 'ri-moon-line' : 'ri-sun-line');
    });
  }

  function escOffer(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

})();