// منع تشغيل الـ fallback في offers.ejs (يجب أن يُعرَّف قبل أي شيء آخر)



window.apiass = true;

(async function () {
  'use strict';

  const container = document.querySelector('.products-grid_1');
  if (!container) { return; }

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
    card.className = 'product';

    card.innerHTML = `
      <div class="product-discount-badge">خصم ${discount.toFixed(0)}%</div>
      <a href="/product-page?id=${pid}" class="product-image-link">
        ${imgSrc
          ? `<img src="${imgSrc}" alt="${escOffer(name)}" class="product-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`
          : ''
        }
        <div class="product-placeholder" style="${imgSrc ? 'display:none;' : 'display:flex;'}">
          🍽️
        </div>
      </a>
      <div class="product-info">
          <h3>${escOffer(name)}</h3>
        <div class="price">
          <span class="price__old">${oldPrice.toFixed(2)} جنيه</span>
          <span class="price__new" style="color:var(--main-color);font-weight:bold;font-family:var(--font-2);font-size: 18px;">${newPrice.toFixed(2)} جنيه</span>
        </div>
      </div>
         <div class="button__actions">
            <button class="Product__actions">
      <a href="/product-page?id=${pid}">اختر الوجبة</a>
      </button>
      </div>
    `;

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
        btn.textContent   = 'أضف للسلة';
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


  // Fallback: Display offers if customer.offers.js doesn't load
    if (window.apiass === undefined) {
        console.log('⚠️ customer.offers.js fallback بدأ');
        const container = document.querySelector('.products-grid_1');
        if (container) {
            fetch('/api/products?discounted=1&limit=100')
                .then(r => r.json())
                .then(products => {
                    console.log('✅ تم جلب', products.length, 'منتج');
                    container.innerHTML = '';
                    products.forEach(p => {
                        const oldPrice = Number(p.Price);
                        const discount = Number(p.Discount || 0);
                        const newPrice = oldPrice * (1 - discount / 100);
                        const el = document.createElement('div');
                        el.className = 'product product_only';
                        el.innerHTML = `
                            <div class="product-discount-badge">خصم ${discount.toFixed(0)}%</div>
                            <a href="/product-page?id=${p.Product_ID}" class="product-img-link">
                                <img src="/images/products/${p.Image}" alt="${p.Product_Name}" class="product-img" style="border-radius:0;">
                            </a>
                            <div class="product-info">
                                <a href="/product-page?id=${p.Product_ID}" class="product-title-link">
                                    <h3>${p.Product_Name}</h3>
                                </a>
                                <div class="price-row">
                                    <span class="price price__old">${oldPrice.toFixed(2)} جنيه</span>
                                    <span class="price price__new">${newPrice.toFixed(2)} جنيه</span>
                                </div>
                            </div>
                            <div class="button__actions"><button class="Product__actions"><a href="/product-page?id=${p.Product_ID}">اختر الوجبة</a></button></div>`;
                        container.appendChild(el);
                    });
                })
                .catch(e => console.error('❌ Fallback error:', e));
        }
    }