(function(){
  'use strict';

  // Run after DOM ready to ensure elements exist
  function onReady(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  onReady(function(){
    const path = window.location.pathname || '/';
    const adminPrefixes = ['/admin', '/chef', '/cashier', '/kitchen'];
    const isAdminArea = adminPrefixes.some(p => path.startsWith(p));
    const bodyRole = document.body && document.body.getAttribute && document.body.getAttribute('data-role');
    const isCustomer = !isAdminArea && (!bodyRole || bodyRole === 'customer');
    if (!isCustomer){
      return;
    }

    // IDs and classes
    const USER_LINK_ID = 'user-icon-link';
    const SEARCH_SELECTORS = ['#search-button', '#search-icon', '.search-button', '.search-icon', '[data-search]'];

    // Drawer constants
    const DRAWER_ID = 'fsd-search-drawer';
    const OVERLAY_ID = 'fsd-search-overlay';
    const INPUT_ID = 'fsd-search-input';
    const RESULTS_ID = 'fsd-search-results';
    const ADDR_MODAL_ID = 'fsd-address-modal';
    const ADDR_OVERLAY_ID = 'fsd-address-overlay';

    let productsCache = null;
    let currentAddressModal = null;

    // ----- User icon logic -----
    async function checkAuth(){
      // Always verify with backend; do not rely only on window.auth
      try{
        const res = await fetch('/auth/api/auth/check', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        let data = { authenticated: false };
        try{ data = await res.json(); }catch(e){ /* ignore parse error */ }
        if (!res.ok) return { authenticated: false };
        return data;
      }catch(e){
        return { authenticated: false };
      }
    }

    async function handleUserIconClick(e){
      try{
        // Prefer backend verification but handle possible race with window.auth
        const auth = await checkAuth();
        if (auth && auth.authenticated){
          return window.location.assign('/profile');
        }

        // If backend says not authenticated but navbar has set window.auth, retry once (race condition)
        if (window.auth && window.auth.authenticated){
          await new Promise(r => setTimeout(r, 250));
          const auth2 = await checkAuth();
          if (auth2 && auth2.authenticated){
            return window.location.assign('/profile');
          }
        }
        return window.location.assign('/user/register');
      }catch(err){
        return window.location.assign('/user/register');
      }
    }

    // Listen for navbar's auth.changed event to keep local window.auth up-to-date
    try{
      window.addEventListener('auth.changed', function(e){
        try{ window.auth = e.detail; }catch(_){ }
      });
    }catch(_){ }

    function initUserIcon(){
      const userLink = document.getElementById(USER_LINK_ID);
      if (!userLink) return;
      if (userLink.dataset.fsdBound) return;
      userLink.dataset.fsdBound = '1';

      // neutralize legacy hrefs that point to orders register or similar to avoid full navigation
      try{
        const href = userLink.getAttribute('href');
        if (href && (href.indexOf('/customer/orders') !== -1 || href.indexOf('/user/register') !== -1 || href.indexOf('/register') !== -1)){
          userLink.setAttribute('href', '#');
        }
      }catch(_){ }

      userLink.addEventListener('click', function fsd_user_click_interceptor(ev){
        try{
          ev.preventDefault();
          if (typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
          if (typeof ev.stopPropagation === 'function') ev.stopPropagation();
        }catch(_){ }
        handleUserIconClick(ev);
      }, true); // capture-phase
    }

    // ----- Search drawer and triggers -----
    function createDrawerDOM(){
      if (document.getElementById(DRAWER_ID)) return;

      const overlay = document.createElement('div'); overlay.id = OVERLAY_ID; overlay.className = 'fsd-overlay';
      const drawer = document.createElement('aside'); drawer.id = DRAWER_ID; drawer.className = 'fsd-drawer';

      drawer.innerHTML = `
        <div class="fsd-header">
          <button type="button" class="fsd-close" aria-label="Close search">&times;</button>
          <div class="fsd-search-wrap">
            <input id="${INPUT_ID}" class="fsd-input" placeholder="ابحث عن منتج..." aria-label="Search products" />
          </div>
        </div>
        <div id="${RESULTS_ID}" class="fsd-results" role="list"></div>
      `;

      document.body.appendChild(overlay);
      document.body.appendChild(drawer);

      overlay.addEventListener('click', closeDrawer);
      drawer.querySelector('.fsd-close').addEventListener('click', closeDrawer);
      document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeDrawer(); });

      const input = document.getElementById(INPUT_ID);
      input.addEventListener('input', onSearchInput);
      input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') ev.preventDefault(); });
    }

    function openDrawer(){
      createDrawerDOM();
      document.getElementById(OVERLAY_ID).classList.add('active');
      document.getElementById(DRAWER_ID).classList.add('active');
      const input = document.getElementById(INPUT_ID);
      input.value = '';
      input.focus();
      renderResults(getLoadedProducts());
    }

    function closeDrawer(){
      const o = document.getElementById(OVERLAY_ID);
      const d = document.getElementById(DRAWER_ID);
      if (o) o.classList.remove('active');
      if (d) d.classList.remove('active');
    }

    function getLoadedProducts(){
      if (productsCache) return productsCache;
      if (window.__PRODUCTS__ && Array.isArray(window.__PRODUCTS__)) { productsCache = window.__PRODUCTS__; return productsCache; }
      if (window.products && Array.isArray(window.products)) { productsCache = window.products; return productsCache; }
      const cards = document.querySelectorAll('[data-product-id]');
      if (cards && cards.length){
        productsCache = Array.from(cards).map(card => {
          const id = card.dataset.productId || card.getAttribute('data-product-id');
          const name = card.dataset.productName || card.querySelector('.product-name')?.textContent?.trim() || '';
          const price = Number(card.dataset.productPrice || card.getAttribute('data-product-price') || card.querySelector('.price')?.textContent?.trim().replace(/[^0-9.]/g,'') || 0);
          const image = card.dataset.productImage || card.querySelector('img')?.getAttribute('src') || '';
          return { Product_ID: Number(id), Product_Name: name, Price: Number(price)||0, Image: image.replace(/^\/+/, '') };
        });
        return productsCache;
      }
      if (window.__INITIAL_STATE__ && Array.isArray(window.__INITIAL_STATE__.products)){ productsCache = window.__INITIAL_STATE__.products; return productsCache; }
      productsCache = [];
      return productsCache;
    }

    // Debounce timer
    let _searchTimer = null;

    function onSearchInput(e){
      const q = e.target.value.trim();
      clearTimeout(_searchTimer);
      if (!q) {
        renderResults(getLoadedProducts().slice(0, 50));
        return;
      }
      const container = document.getElementById(RESULTS_ID);
      if (container) container.innerHTML = '<div class="fsd-empty">جاري البحث...</div>';
      _searchTimer = setTimeout(function(){ fetchSearchResults(q); }, 250);
    }

    async function fetchSearchResults(q){
      try {
        const res = await fetch('/api/products?search=' + encodeURIComponent(q) + '&limit=30', { credentials: 'include' });
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.products || data.data || []);
        renderResults(items);
      } catch(err) {
        const all = getLoadedProducts();
        const ql = q.toLowerCase();
        const filtered = all.filter(p => (p.Product_Name||'').toLowerCase().includes(ql)).slice(0, 50);
        renderResults(filtered);
      }
    }

    function buildImgSrc(raw) {
      if (!raw) return '';
      raw = raw.replace(/^\/+/, '');
      // إذا كان المسار يحتوي على مجلد كامل نستخدمه مباشرة
      if (raw.startsWith('images/') || raw.startsWith('public/images/')) return '/' + raw;
      // افتراضي: صور المنتجات في /images/products/
      return '/images/products/' + raw;
    }

    function renderResults(items){
      const container = document.getElementById(RESULTS_ID);
      if (!container) return;
      container.innerHTML = '';
      if (!items || items.length===0){ container.innerHTML = '<div class="fsd-empty">لا توجد نتائج</div>'; return; }
      const frag = document.createDocumentFragment();
      items.forEach(prod => {
        const item = document.createElement('div'); item.className = 'fsd-item';
        const imgSrc    = buildImgSrc(prod.Image || prod.img || '');
        const name      = prod.Product_Name || prod.title || 'منتج';
        const rawPrice  = prod.Price || prod.price || 0;
        const price     = parseFloat(rawPrice).toFixed(2);
        const pid       = prod.Product_ID || prod.id || '';
        const detailUrl = pid ? '/product-page?id=' + pid : '#';

        const imgHtml = imgSrc
          ? `<img src="${imgSrc}" alt="${escapeHtml(name)}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;">`
          : `<div style="width:60px;height:60px;background:#f0f0f0;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:22px;">🍽️</div>`;

        item.innerHTML = `
          <a href="${detailUrl}" class="fsd-item-media" style="display:block;text-decoration:none;flex-shrink:0;">${imgHtml}</a>
          <div class="fsd-item-body" style="flex:1;min-width:0;padding:0 10px;">
            <a href="${detailUrl}" class="fsd-item-title" style="text-decoration:none;color:inherit;display:block;">${escapeHtml(name)}</a>
            <div class="fsd-item-sub">${price} جنيه</div>
          </div>
          <div class="fsd-item-action" style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
            <button class="fsd-add-btn" data-id="${pid}">أضف للسلة</button>
            <a href="${detailUrl}" style="font-size:12px;color:#555;text-decoration:underline;white-space:nowrap;">التفاصيل</a>
          </div>
        `;

        const imgElement = item.querySelector('img');
        if (imgElement) {
          imgElement.addEventListener('error', () => { imgElement.style.display = 'none'; });
        }

        frag.appendChild(item);
      });
      container.appendChild(frag);
      container.querySelectorAll('.fsd-add-btn').forEach(btn => {
        if (btn.dataset.fsdBound) return; btn.dataset.fsdBound = '1';
        btn.addEventListener('click', (ev) => {
          ev.preventDefault();
          const id = Number(btn.dataset.id); const product = findProductById(id); if (!product) return;
          try{
            if (typeof addToCart === 'function'){
              const payload = { Product_ID: product.Product_ID||product.id, Product_Name: product.Product_Name||product.title, Price: product.Price||product.price||0, Image: product.Image||product.img||'' };
              addToCart(payload);
              btn.textContent = '✓ أُضيف'; btn.style.background = '#10b981';
              setTimeout(() => { btn.textContent = 'أضف للسلة'; btn.style.background = ''; }, 1500);
            }
          }catch(err){ }
        });
      });
    }

    function findProductById(id){ const all = getLoadedProducts(); return all.find(p => Number(p.Product_ID) === Number(id) || Number(p.id) === Number(id)); }
    function escapeHtml(str){ return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

    function attachTriggers(){
      document.addEventListener('keydown', (e) => { if ((e.ctrlKey && e.key.toLowerCase()==='k') || (e.key==='/' )){ const active = document.activeElement; if (active && (active.tagName==='INPUT' || active.tagName==='TEXTAREA' || active.isContentEditable)) return; e.preventDefault(); openDrawer(); } });
      let found=false; for (const sel of SEARCH_SELECTORS){ const el = document.querySelector(sel); if (!el) continue; if (el.dataset.fsdBound){ found=true; break; } el.addEventListener('click', function fsd_search_click_interceptor(ev){ try{ ev.preventDefault(); if (typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation(); if (typeof ev.stopPropagation === 'function') ev.stopPropagation(); }catch(_){ } openDrawer(); }, true); el.dataset.fsdBound='1'; found=true; break; }
      if (!found){ try{ const icons = Array.from(document.querySelectorAll('header a, header button')).map(el => ({ tag: el.tagName, id: el.id, cls: el.className, href: el.getAttribute('href') })); }catch(err){ } }
    }

    // ----- Address Modal -----
    function createAddressModal(){
      if (document.getElementById(ADDR_MODAL_ID)) return;
      const overlay = document.createElement('div'); overlay.id = ADDR_OVERLAY_ID; overlay.className = 'fsd-modal-overlay';
      const modal = document.createElement('div'); modal.id = ADDR_MODAL_ID; modal.className = 'fsd-modal';
      modal.innerHTML = `
        <div class="fsd-modal-content">
          <h2>تأكيد العنوان</h2>
          <p class="fsd-product-info" id="fsd-product-info"></p>
          <label>العنوان:</label>
          <textarea id="fsd-address-input" class="fsd-input-field" rows="3" placeholder="أدخل عنوان التوصيل..."></textarea>
          <div style="margin-top:12px">
            <button id="fsd-addr-confirm" class="button__submit" style="background:#10b981">تأكيد</button>
            <button id="fsd-addr-cancel" class="button__submit" style="background:#ef4444">إلغاء</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay); document.body.appendChild(modal);
      currentAddressModal = { overlay, modal };
      overlay.addEventListener('click', closeAddressModal);
      document.getElementById('fsd-addr-cancel').addEventListener('click', closeAddressModal);
    }

    function openAddressModal(product, callback){
      createAddressModal();
      const infoEl = document.getElementById('fsd-product-info');
      const addrEl = document.getElementById('fsd-address-input');
      const confirmBtn = document.getElementById('fsd-addr-confirm');

      // Fetch stored address if available
      (async () => {
        try{
          const res = await fetch('/auth/api/auth/check', { method: 'GET', credentials: 'include', headers: { 'Content-Type':'application/json' } });
          const data = await res.json();
          if (data && data.user && data.user.Address) addrEl.value = data.user.Address;
        }catch(e){ }
      })();

      infoEl.textContent = `المنتج: ${product.Product_Name || product.title}, السعر: ${product.Price || product.price} جنيه`;
      
      confirmBtn.onclick = function(){
        const addr = addrEl.value.trim();
        if (!addr) { alert('الرجاء إدخال العنوان'); return; }
        closeAddressModal();
        if (callback) callback(addr);
      };

      currentAddressModal.overlay.classList.add('active');
      currentAddressModal.modal.classList.add('active');
      addrEl.focus();
    }

    function closeAddressModal(){
      if (currentAddressModal){
        currentAddressModal.overlay.classList.remove('active');
        currentAddressModal.modal.classList.remove('active');
      }
    }

    // initialization
    function init(){ initUserIcon(); createDrawerDOM(); attachTriggers(); }
    init();

    // expose
    window.fsd = window.fsd || {}; 
    window.fsd.openDrawer = openDrawer; 
    window.fsd.closeDrawer = closeDrawer; 
    window.fsd.getLoadedProducts = getLoadedProducts;
    window.fsd.openAddressModal = openAddressModal;
    window.fsd.closeAddressModal = closeAddressModal;
    window.fsd.checkAuth = checkAuth;
  });
})();
