(function () {
  let orders = [];
  let loading = false;
  let unauth = false;
  let customers = [];
  let loadingCustomers = false;
  let showCustomers = false;

  function timeElapsedString(ts) {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  async function fetchOrders() {
    loading = true;
    render();
    try {
      const res = await fetch('/kitchen/api/orders', { credentials: 'include' });
      if (res.status === 401) {
        orders = [];
        unauth = true;
        loading = false;
        render();
        return;
      }
      unauth = false;
      const data = await res.json();
      if (data && data.success && data.data && data.data.orders) {
        orders = (data.data.orders || []).map(o => ({
          id: o.id,
          items: o.items || [],
          createdAt: o.createdAt,
          notes: o.notes || '',
          status: o.status,
          address: o.address || '',
          phone: o.phone || ''
        }));
      }
    } catch (err) {
      // ignore fetch errors to match original behavior
    }
    loading = false;
    render();
  }

  async function fetchCustomers() {
    loadingCustomers = true;
    render();
    try {
      const res = await fetch('/api/customers', { credentials: 'include' });
      if (res.status === 401) {
        customers = [];
        loadingCustomers = false;
        render();
        return;
      }
      const data = await res.json();
      if (data && data.success && data.data && data.data.customers) {
        customers = data.data.customers;
      } else if (Array.isArray(data)) {
        customers = data;
      } else {
        customers = [];
      }
    } catch (err) {
      customers = [];
    }
    loadingCustomers = false;
    render();
  }

  async function markPrepared(orderId) {
    try {
      const res = await fetch('/kitchen/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId, status: 'Completed' })
      });
      const data = await res.json();
      if (data.success) {
        orders = orders.filter(o => o.id !== orderId);
        render();
        alert('✅ تم تحديث الطلب بنجاح');
      } else {
        alert(data.message || 'فشل التحديث');
      }
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  }

  function renderUnauth() {
    return `
      <div class="chef-react">
        <div class="header" style="margin-bottom:12px"><h2>طلبات المطبخ</h2></div>
        <div style="padding:20px; text-align:center">
          <p style="font-size:16px; color:#333">انتهت الجلسة أو لا توجد صلاحية. الرجاء تسجيل الدخول.</p>
          <a href="/register" style="display:inline-block;margin-top:10px;background:#ff6b6b;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">تسجيل / دخول</a>
        </div>
      </div>`;
  }

  function renderOrderCard(order) {
    const statusColor = order.status === 'Pending' ? '#ffc107'
      : order.status === 'Shipped' ? '#17a2b8' : '#28a745';

    const actionHtml = order.status !== 'Delivered'
      ? `<button class="complete-btn" data-id="${order.id}">تم التجهيز</button>`
      : `<div style="margin-top:10px;padding:0.75rem;background:#d4edda;color:#155724;border-radius:6px;text-align:center;font-weight:500">✅ تم تسليم الطلب</div>`;

    return `
      <div class="order-card" style="background:#fff;padding:12px;border-radius:10px;opacity:${order.status === 'Delivered' ? 0.6 : 1}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div><strong>طلب رقم: </strong><span>${order.id}</span></div>
          <div style="font-size:12px;padding:2px 8px;border-radius:4px;background:${statusColor};color:white">${order.status}</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <small>قبل: ${timeElapsedString(order.createdAt)}</small>
          <small>${new Date(order.createdAt).toLocaleString('ar-EG')}</small>
        </div>
        <div>
          ${order.items.map(it => `
            <div style="padding:6px 0;border-bottom:1px dashed #eee">
              <div style="font-weight:700">${it.quantity}x ${it.name}</div>
              ${it.options ? `<div>${it.options}</div>` : ''}
            </div>`).join('')}
        </div>
        ${order.notes ? `<div style="margin-top:8px;font-style:italic">ملاحظة: ${order.notes}</div>` : ''}
        ${order.address ? `<div style="margin-top:6px;font-size:13px;color:#555"><strong>العنوان: </strong><span>${order.address}</span></div>` : ''}
        ${order.phone ? `<div style="margin-top:4px;font-size:13px;color:#555"><strong>هاتف: </strong><span>${order.phone}</span></div>` : ''}
        <div style="margin-top:10px">${actionHtml}</div>
      </div>`;
  }

  function bindEvents() {
    const toggleBtn = document.getElementById('toggle-customers-btn');
    if (toggleBtn) {
      toggleBtn.onclick = () => {
        showCustomers = !showCustomers;
        if (showCustomers) {
          fetchCustomers();
        }
        render();
      };
    }

    const root = document.getElementById('chef-root');
    if (root) {
      root.onclick = (e) => {
        const btn = e.target.closest('[data-id]');
        if (btn) {
          markPrepared(btn.dataset.id);
        }
      };
    }
  }

  function render() {
    const root = document.getElementById('chef-root');
    if (!root) return;

    if (unauth) {
      root.innerHTML = renderUnauth();
      return;
    }

    const customersHtml = showCustomers ? `
      <div style="max-width:1200px;margin:0 auto 1rem;padding:0 1rem">
        ${loadingCustomers ? `<div style="text-align:center;padding:12px">جاري تحميل العملاء...</div>` : ''}
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">
          ${customers.map(c => `
            <div style="background:#fff;padding:12px;border-radius:8px;box-shadow:0 4px 10px rgba(0,0,0,0.06)">
              <div style="font-weight:700;margin-bottom:6px">${c.name}</div>
              <div style="font-size:13px;color:#666">${c.phone || c.email || ''}</div>
              <div style="margin-top:8px;font-size:13px">طلبات: ${c.orders || 0} • ${c.totalSpent || '0.00'} ج.م</div>
            </div>`).join('')}
        </div>
      </div>` : '';

    const ordersHtml = loading && orders.length === 0
      ? `<div>جاري التحميل...</div>`
      : !loading && orders.length === 0
        ? `<div class="no-orders-container"><div class="no-orders-text">لا توجد طلبات</div></div>`
        : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:16px">${orders.map(renderOrderCard).join('')}</div>`;

    root.innerHTML = `
      <div class="chef-react">
        <div class="header" style="margin-bottom:12px"><h2>طلبات المطبخ</h2></div>
        <div style="text-align:center;margin-bottom:12px">
          <button class="complete-btn" id="toggle-customers-btn"
            style="background:#fff;color:#ff6b6b;border:1px solid #ff6b6b;padding:8px 12px;border-radius:6px;cursor:pointer">
            ${showCustomers ? 'اغلاق العملاء' : 'عرض العملاء'}
          </button>
        </div>
        ${customersHtml}
        ${ordersHtml}
      </div>`;

    bindEvents();
  }

  function startClock() {
    const el = document.getElementById('currentTime');
    if (!el) return;

    function tick() {
      el.textContent = new Date().toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }

    tick();
    setInterval(tick, 1000);
  }

  function init() {
    startClock();
    fetchOrders();
    setInterval(fetchOrders, 3000);
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
    });
  } else {
    init();
  }
})();
