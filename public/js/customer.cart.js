(function(){
  'use strict';
  const $ = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));

  function addToCart(product){
    const item = { id: product.id||product.Product_ID, title: product.title||product.Product_Name, price: Number(product.price||product.Price)||0, img: product.img||`images/products/${product.Image}`, quantity:1 };
    if (window.cartState && typeof window.cartState.addItem==='function') { try{ window.cartState.addItem(item); }catch(e){} }
    else { const s=JSON.parse(localStorage.getItem('cart'))||[]; s.push(item); localStorage.setItem('cart',JSON.stringify(s)); if (typeof updetecart==='function') updetecart(); }
    const cartEl = $('.cart'); if (cartEl) cartEl.classList.add('active');
  }

  function updetecart(){
    const container = document.getElementById('cart_items'); if (!container) return;
    const items = (window.cartState && typeof window.cartState.getItems==='function') ? window.cartState.getItems() : (JSON.parse(localStorage.getItem('cart'))||[]);
    container.innerHTML=''; let total=0, qtyTotal=0;
    items.forEach(it=>{ const q=Number(it.quantity)||0, p=Number(it.price)||0; total+=q*p; qtyTotal+=q; const el=document.createElement('div'); el.className='item_cart'; el.innerHTML = `\n      <img src="/${it.img}" alt="${it.title}">\n      <div class="content">\n        <h4>${it.title}</h4>\n        <p class="price_cart">${(p*q).toFixed(2)} جنيه</p>\n        <div class="quantity_control">\n          <button class="decrese_quantity" data-id="${it.id}">-</button>\n          <span class="quantity">${q}</span>\n          <button class="increse_quantity" data-id="${it.id}">+</button>\n        </div>\n      </div>\n      <button class="delete_item" data-id="${it.id}"><i class="ri-delete-bin-5-line"></i></button>`; container.appendChild(el); });
    const priceEl = $('.price_cart_total'); if (priceEl) priceEl.textContent=`${total.toFixed(2)} جنيه`;
    const countEl = $('.count_item_cart'); if (countEl) countEl.textContent=`${qtyTotal}`;

    $$('.increse_quantity').forEach(b=>b.addEventListener('click', ()=>{ const id=Number(b.dataset.id); if (window.cartState && typeof window.cartState.increaseQuantity==='function') return window.cartState.increaseQuantity(id); const s=JSON.parse(localStorage.getItem('cart'))||[]; const idx=s.findIndex(x=>x.id==id); if (idx>-1){ s[idx].quantity=(s[idx].quantity||0)+1; localStorage.setItem('cart',JSON.stringify(s)); updetecart(); } }));
    $$('.decrese_quantity').forEach(b=>b.addEventListener('click', ()=>{ const id=Number(b.dataset.id); if (window.cartState && typeof window.cartState.decreaseQuantity==='function') return window.cartState.decreaseQuantity(id); const s=JSON.parse(localStorage.getItem('cart'))||[]; const idx=s.findIndex(x=>x.id==id); if (idx>-1){ s[idx].quantity=Math.max(1,(s[idx].quantity||1)-1); localStorage.setItem('cart',JSON.stringify(s)); updetecart(); } }));
    $$('.delete_item').forEach(b=>b.addEventListener('click', ()=>{ const id=Number(b.dataset.id||b.getAttribute('data-id')); if (window.cartState && typeof window.cartState.removeItem==='function') return window.cartState.removeItem(id); const s=JSON.parse(localStorage.getItem('cart'))||[]; const idx=s.findIndex(x=>x.id==id); if (idx>-1){ s.splice(idx,1); localStorage.setItem('cart',JSON.stringify(s)); updetecart(); updetButtoncart(id); } }));
  }

  function updetButtoncart(productId){ $$('.button-data-id[data-id="'+productId+'"').forEach(b=>{ b.classList.remove('activess'); b.disabled=false; }); }

  function showCartMessage(msg,type='info'){ const el=document.getElementById('cart_message'); if (!el) return; el.textContent=msg; el.className='cart_message '+type; el.style.display='block'; const colors={success:'#4CAF50',error:'var(--text-color)',warning:'#ff9800',info:'#2196F3'}; el.style.backgroundColor=colors[type]||colors.info; el.style.color='#fff'; if (type!=='error') setTimeout(()=>el.style.display='none',4000); }

  async function handleCheckout(){ 
    const items=(window.cartState && typeof window.cartState.getItems==='function')?window.cartState.getItems():(JSON.parse(localStorage.getItem('cart'))||[]); 
    if (!items||items.length===0){ showCartMessage('السلة فارغة! الرجاء إضافة منتجات.','warning'); return; } 
    
    // ✅ التحقق من تسجيل الدخول مباشرة من السيرفر
    let authOk = false;
    try {
      const authRes = await fetch('/auth/api/auth/check', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      const authData = await authRes.json();
      authOk = authData.success && authData.authenticated === true;
    } catch(e) {
      authOk = false;
    }
    
    if (!authOk){ 
      showCartMessage('يجب تسجيل الدخول أولاً لإتمام الطلب!','error'); 
      try{ localStorage.setItem('pendingCart',JSON.stringify(items)); localStorage.setItem('postAuthRedirect',window.location.pathname+window.location.search); localStorage.setItem('checkoutIntent','true'); }catch(e){} 
      setTimeout(()=>{ if (typeof window.redirectToLogin==='function') window.redirectToLogin(); else window.location.href='/user/register?next='+encodeURIComponent('/checkout'); },800); 
      return; 
    } 
    
    const totals=(window.cartState&&typeof window.cartState.getTotals==='function')?window.cartState.getTotals():{subtotal:items.reduce((s,i)=>(s+(i.price*i.quantity)),0)}; 
    if (typeof window.openCheckoutModal==='function') return window.openCheckoutModal(items,totals.subtotal); 
    showCartMessage(`جاري معالجة الطلب بقيمة ${totals.subtotal.toFixed(2)} جنيه...`,'info'); 
    submitOrder(items, totals.subtotal); 
  }

  async function submitOrder(items,totalAmount){ 
    try{ 
      const res=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({items:items.map(i=>({productId:i.id,quantity:i.quantity,price:i.price})), totalAmount, deliveryAddress:'عنوان التوصيل'})}); 
      const data=await res.json(); 
      
      if (res.status===401 || (data.success === false && data.message && data.message.includes('تسجيل'))){ 
        showCartMessage('يجب عليك تسجيل الدخول أولاً!','error'); 
        try{ localStorage.setItem('pendingCart',JSON.stringify(items)); localStorage.setItem('postAuthRedirect',window.location.pathname); }catch(e){} 
        setTimeout(()=>{ if (typeof window.redirectToLogin==='function') window.redirectToLogin(); else window.location.href='/user/register?next='+encodeURIComponent('/checkout'); },800); 
        return; 
      } 
      
      if (!data.success){ showCartMessage(data.message||'فشل في إنشاء الطلب','error'); return; } 
      showCartMessage(`✓ تم إنشاء الطلب بنجاح! رقم الطلب: ${data.data?.orderNumber || 'غير محدد'}`,'success'); 
      if (window.cartState&&typeof window.cartState.clear==='function') window.cartState.clear(); else localStorage.removeItem('cart'); 
      setTimeout(()=>{ if (window.cartState&&typeof window.cartState.close==='function') window.cartState.close(); updetecart(); },1500); 
    }catch(err){ showCartMessage('✗ خطأ في الاتصال','error'); } 
  }

  function bindCheckoutButtons(){ try{ $$('.btn_cart').forEach(b=>{ if (b._checkoutBound) return; b.addEventListener('click',e=>{ e.preventDefault(); handleCheckout(); }); b._checkoutBound=true; }); }catch(e){} }
  // Ensure direct binding to the explicit checkout button (added in footer)
  function ensureDirectCheckoutBinding(){
    try{
      const checkoutBtn = document.getElementById('checkout-btn');
      if (checkoutBtn && !checkoutBtn._checkoutBound){
        checkoutBtn.addEventListener('click', e=>{ e.preventDefault(); handleCheckout(); });
        checkoutBtn._checkoutBound = true;
      }
    }catch(e){}  
  }

  // Bind on DOM ready (covers scripts loaded before DOMContentLoaded)
  document.addEventListener('DOMContentLoaded',()=>{ bindCheckoutButtons(); ensureDirectCheckoutBinding(); updetecart(); });
  // Also bind immediately if script loaded after DOMContentLoaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') { bindCheckoutButtons(); ensureDirectCheckoutBinding(); updetecart(); }
  
  // Cart open/close bindings and UI sync
  function syncCartUI(state){
    const cartEl = document.querySelector('.cart');
    if (!cartEl) return;
    if (state && state.isOpen) cartEl.classList.add('active'); else cartEl.classList.remove('active');
  }

  function bindCartToggleButtons(){
    const cartButton = document.getElementById('cart-button');
    const closeButton = document.querySelector('.close_cart');
    const cartOverlay = document.getElementById('cartOverlay');

    if (cartButton) {
      cartButton.addEventListener('click', (e)=>{
        e.preventDefault();
        if (window.cartState && typeof window.cartState.open === 'function') return window.cartState.open();
        const c = document.querySelector('.cart'); if (c) c.classList.add('active');
      });
    }

    if (closeButton) {
      closeButton.addEventListener('click', (e)=>{ e.preventDefault(); if (window.cartState && typeof window.cartState.close === 'function') return window.cartState.close(); const c=document.querySelector('.cart'); if (c) c.classList.remove('active'); });
    }

    if (cartOverlay) {
      cartOverlay.addEventListener('click', ()=>{ if (window.cartState && typeof window.cartState.close === 'function') return window.cartState.close(); const c=document.querySelector('.cart'); if (c) c.classList.remove('active'); });
    }
  }

  // Hook cartState observers when available
  if (window.cartState) {
    try { if (typeof window.cartState.onItemsChange === 'function') window.cartState.onItemsChange(updetecart); } catch(e){}
    try { if (typeof window.cartState.onUIChange === 'function') window.cartState.onUIChange(syncCartUI); } catch(e){}
  }

  // bind toggle on DOM ready as well
  document.addEventListener('DOMContentLoaded', () => { bindCartToggleButtons(); });
  try{ document.addEventListener('click',function(e){ const btn = e.target.closest && e.target.closest('.btn_cart'); if (btn){ e.preventDefault(); handleCheckout(); } }); }catch(e){ }

  window.addToCart = addToCart; window.updetecart = updetecart;
})();

