
document.addEventListener('DOMContentLoaded', function () {

    // ─── State ───────────────────────────────────────────
    let products     = [];
    let cart         = [];
    let allOrders    = [];
    let currentFilter = 'all';

    const STATUS_LABELS = {
        'Pending':    'انتظار',
        'Processing': 'قيد التحضير',
        'Ready':      'جاهز',
        'Delivered':  'تم التسليم',
        'Cancelled':  'ملغى'
    };
    const PAYMENT_LABELS = {
        'cash': 'نقدي', 'card': 'بطاقة',
        'online': 'أونلاين', 'transfer': 'تحويل',
        'mobile': 'محفظة', 'wallet': 'محفظة', 'other': 'أخرى'
    };

    // ─── Helpers ─────────────────────────────────────────
    function fmtTime(ts) {
        if (!ts) return '—';
        const d = new Date(ts);
        return d.toLocaleString('ar-EG', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
    }
    function fmtMoney(v) { return parseFloat(v || 0).toFixed(2); }

    // ─── Clock ───────────────────────────────────────────
    function updateTime() { document.getElementById('currentTime').textContent = new Date().toLocaleTimeString('ar-EG'); }
    setInterval(updateTime, 1000); updateTime();

    // ═══════════════════════════════════════════════════════
    //  TAB SWITCHING
    // ═══════════════════════════════════════════════════════
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('tab-' + target).classList.add('active');
            if (target === 'orders') fetchOrders();
        });
    });

    // ═══════════════════════════════════════════════════════
    //  POS — PRODUCTS
    // ═══════════════════════════════════════════════════════
    async function fetchProducts() {
        try {
            const res  = await fetch('/cashier/api/products', { credentials: 'include' });
            const data = await res.json();
            if (data.success && data.data) {
                products = data.data;
                // رسم الـ grid مرة واحدة بس عند أول تحميل
                renderProductsGrid();
            } else {
                showError(data.message || 'فشل في جلب المنتجات', 'خطأ');
            }
        } catch { showError('تعذّر الاتصال بالسيرفر', 'خطأ'); }
    }

    // يرسم الـ grid كامل مرة واحدة عند التحميل فقط
    function renderProductsGrid() {
        const grid = document.getElementById('productsGrid');
        if (!products.length) {
            grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:2rem;color:#888;">لا توجد منتجات</p>';
            return;
        }
        grid.innerHTML = products.map(p => {
            const imageSrc = /^(https?:)?\/\//.test(p.Image || '') ? p.Image : `/images/products/${p.Image || ''}`;
            return `
            <div class="product-card" data-product-id="${p.Product_ID}">
                <img src="${imageSrc}" alt="${p.Product_Name}" class="product-image" onload="this.classList.add('loaded')" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'180\' height=\'120\' viewBox=\'0 0 180 120\'%3E%3Crect width=\'180\' height=\'120\' fill=\'%23f3f4f6\'/%3E%3Ctext x=\'90\' y=\'55\' font-family=\'Arial\' font-size=\'28\' fill=\'%23d1d5db\' text-anchor=\'middle\'%3E🍽%3C/text%3E%3Ctext x=\'90\' y=\'80\' font-family=\'Arial\' font-size=\'10\' fill=\'%239ca3af\' text-anchor=\'middle\'%3Eلا توجد صورة%3C/text%3E%3C/svg%3E';this.classList.add('loaded')"/>
                <div class="product-name">${p.Product_Name}</div>
                <div class="product-price">${fmtMoney(p.Price)} جنيه</div>
            </div>`
        }).join('');
        grid.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', () => addToCart(parseInt(card.dataset.productId)));
        });
    }

    // البحث يخفي/يظهر الكروت بدون ما يعمل re-render للـ DOM
    function renderProducts(filter = '') {
        const grid = document.getElementById('productsGrid');
        const cards = grid.querySelectorAll('.product-card');
        if (!filter.trim()) {
            // لو البحث فاضي — اظهر كل الكروت
            cards.forEach(c => c.style.display = '');
            return;
        }
        const lower = filter.toLowerCase();
        cards.forEach(card => {
            const id   = card.dataset.productId;
            const name = card.querySelector('.product-name')?.textContent?.toLowerCase() || '';
            card.style.display = (name.includes(lower) || id.includes(filter)) ? '' : 'none';
        });
        // لو مفيش نتايج خالص
        const visible = [...cards].filter(c => c.style.display !== 'none');
        const noResult = grid.querySelector('.no-result-msg');
        if (!visible.length) {
            if (!noResult) {
                const msg = document.createElement('p');
                msg.className = 'no-result-msg';
                msg.style = 'grid-column:1/-1;text-align:center;padding:2rem;color:#888;';
                msg.textContent = 'لا توجد منتجات مطابقة';
                grid.appendChild(msg);
            }
        } else if (noResult) {
            noResult.remove();
        }
    }

    function addToCart(productId) {
        const product = products.find(p => p.Product_ID === productId);
        if (!product) return;
        const existing = cart.find(i => i.productId === productId);
        if (existing) existing.quantity++;
        else cart.push({ productId: product.Product_ID, name: product.Product_Name, price: parseFloat(product.Price || 0), quantity: 1 });
        renderCart();
        showSuccess(`تمت إضافة ${product.Product_Name}`, 'تمت الإضافة', 1);
    }

    function renderCart() {
        const container = document.getElementById('cartItems');
        if (!cart.length) {
            container.innerHTML = `<div class="empty-cart"><i class="ri-shopping-cart-line" style="font-size:3rem;color:var(--border-color);"></i><p>السلة فارغة</p></div>`;
            document.getElementById('checkoutBtn').disabled = true;
            document.getElementById('totalAmount').textContent = '0.00';
            return;
        }
        container.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${fmtMoney(item.price)} × ${item.quantity} = ${fmtMoney(item.price * item.quantity)} جنيه</div>
                </div>
                <div class="quantity-controls">
                    <button class="qty-btn qty-minus" data-id="${item.productId}">−</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="qty-btn qty-plus"  data-id="${item.productId}">+</button>
                </div>
                <button class="btn btn-danger remove-btn" data-id="${item.productId}" style="padding:var(--spacing-xs) var(--spacing-sm);">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>`).join('');
        container.querySelectorAll('.qty-minus').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); updateQty(parseInt(b.dataset.id), -1); }));
        container.querySelectorAll('.qty-plus').forEach(b  => b.addEventListener('click', e => { e.stopPropagation(); updateQty(parseInt(b.dataset.id),  1); }));
        container.querySelectorAll('.remove-btn').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); removeFromCart(parseInt(b.dataset.id)); }));
        document.getElementById('checkoutBtn').disabled = false;
        const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
        document.getElementById('totalAmount').textContent = fmtMoney(total);
    }

    function updateQty(id, delta) {
        const item = cart.find(i => i.productId === id);
        if (!item) return;
        item.quantity += delta;
        if (item.quantity <= 0) removeFromCart(id);
        else renderCart();
    }
    function removeFromCart(id) {
        cart = cart.filter(i => i.productId !== id);
        renderCart();
    }

    // Payment method toggle
    document.querySelectorAll('.payment-method').forEach(m => {
        m.addEventListener('click', () => {
            document.querySelectorAll('.payment-method').forEach(x => x.classList.remove('active'));
            m.classList.add('active');
            m.querySelector('input').checked = true;
        });
    });

    // Checkout
    document.getElementById('checkoutBtn').addEventListener('click', checkout);
    document.getElementById('searchInput').addEventListener('input', e => renderProducts(e.target.value));

    async function checkout() {
        if (!cart.length) { showError('السلة فارغة', 'خطأ'); return; }
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
        const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
        const { isConfirmed } = await Swal.fire({
            title: 'تأكيد الدفع',
            text: `إتمام الدفع بمبلغ ${fmtMoney(total)} جنيه؟`,
            icon: 'question', showCancelButton: true,
            confirmButtonText: 'نعم، تأكيد', cancelButtonText: 'إلغاء',
            confirmButtonColor: '#50c878', cancelButtonColor: '#e94e77'
        });
        if (!isConfirmed) return;
        try {
            const res = await fetch('/cashier/api/orders', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                body: JSON.stringify({ items: cart.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })), totalAmount: total, paymentMethod: paymentMethod.value, customerId: null, notes: '' })
            });
            const data = await res.json();
            if (data.success) {
                const orderId = data.data.orderId;
                const orderNumber = data.data.orderNumber;
                
                // عرض رسالة النجاح مع أزرار الطباعة
                await Swal.fire({
                      title: 'نجح الدفع',
                    html: `
                        <div style="text-align: center; direction: rtl;">
                            <p style="font-size: 1.2rem; margin-bottom: 16px;">تم إنشاء الطلب!</p>
                            <p style="font-size: 1.5rem; color: #df4242; font-weight: bold; margin-bottom: 20px;">${orderNumber}</p>
                            <p style="color: #131212; margin-bottom: 24px;">هل تريد طباعة الإيصال؟</p>
                        </div>
                    `,
                    icon: 'success',
                    showCancelButton: true,
                    confirmButtonText: 'طباعة حرارية',
                    cancelButtonText: 'طباعة عادية',
                    confirmButtonColor: '#e0443e',
                    cancelButtonColor: '#cf3535',
                    allowOutsideClick: false,
                    didOpen: () => {
                        // إضافة زر ثالث للإغلاق
                        const footer = Swal.getFooter();
                        if (footer) {
                            const closeBtn = document.createElement('button');
                            closeBtn.textContent = 'لاحقاً';
                            closeBtn.className = 'swal2-confirm';
                            closeBtn.style.cssText = 'background-color: #e24545; margin-right: 8px; padding: 13px 24px; border: none; border-radius: 4px; color: white; font-size: 0.9rem; width: 20%;';
                            closeBtn.onclick = () => Swal.close();
                            footer.appendChild(closeBtn);
                        }
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        // الطباعة الحرارية
                        window.open(`/cashier/receipt/${orderId}?print=thermal`, '_blank', 'width=600,height=800');
                    } else if (result.dismiss === Swal.DismissReason.cancel) {
                        // الطباعة العادية
                        window.open(`/cashier/receipt/${orderId}?print=browser`, '_blank', 'width=600,height=800');
                    }
                });
                
                cart = []; renderCart();
            } else showError(data.message || 'فشل في إتمام الطلب', 'خطأ');
        } catch { showError('حدث خطأ في الاتصال', 'خطأ'); }
    }

    // ═══════════════════════════════════════════════════════
    //  ORDERS TAB
    // ═══════════════════════════════════════════════════════
    async function fetchOrders() {
        const btn = document.getElementById('refreshOrdersBtn');
        btn.classList.add('spinning');
        try {
            const url = currentFilter === 'all' ? '/cashier/api/authenticated/orders' : `/cashier/api/authenticated/orders?status=${currentFilter}`;
            const res  = await fetch(url, { credentials: 'include' });
            const data = await res.json();
            if (data.success) {
                allOrders = data.data || [];
                renderOrdersTable(allOrders);
                updatePendingBadge();
            } else {
                renderOrdersEmpty('فشل في جلب الطلبات');
            }
        } catch (e) {
            renderOrdersEmpty('تعذّر الاتصال بالسيرفر');
        } finally {
            btn.classList.remove('spinning');
        }
    }

    function updatePendingBadge() {
        const pending = allOrders.filter(o => o.Order_Status === 'Pending' || o.Order_Status === 'Processing').length;
        const badge = document.getElementById('pendingBadge');
        if (pending > 0) { badge.textContent = pending; badge.style.display = 'inline-flex'; }
        else badge.style.display = 'none';
    }

    function renderOrdersTable(orders) {
        const tbody = document.getElementById('ordersTableBody');
        if (!orders.length) { renderOrdersEmpty('لا توجد طلبات في هذا القسم'); return; }

        tbody.innerHTML = orders.map(o => {
            const status = o.Order_Status || 'Pending';
            const payLabel = PAYMENT_LABELS[o.Payment_Method?.toLowerCase()] || o.Payment_Method || '—';
            return `
            <tr data-order-id="${o.Order_ID}">
                <td>
                    <button class="order-id-link" data-order-id="${o.Order_ID}">#${o.Order_ID}</button>
                </td>
                <td>${o.Customer_Name || '<span style="color:#aaa">زبون مباشر</span>'}</td>
                <td style="font-weight:600;color:var(--main-color)">${fmtMoney(o.Total_Amount)} جنيه</td>
                <td>${payLabel}</td>
                <td style="color:#666;font-size:0.82rem">${fmtTime(o.Created_At)}</td>
                <td><span class="status-badge status-${status}">${STATUS_LABELS[status] || status}</span></td>
                <td>
                    <select class="status-select" data-order-id="${o.Order_ID}" data-current="${status}">
                        <option value="Pending"    ${status==='Pending'    ? 'selected':''}> انتظار</option>
                        <option value="Processing" ${status==='Processing' ? 'selected':''}> قيد التحضير</option>
                        <option value="Ready"      ${status==='Ready'      ? 'selected':''}> جاهز</option>
                        <option value="Delivered"  ${status==='Delivered'  ? 'selected':''}> تم التسليم</option>
                        <option value="Cancelled"  ${status==='Cancelled'  ? 'selected':''}> ملغى</option>
                    </select>
                </td>
            </tr>`;
        }).join('');

        // Status change listener
        tbody.querySelectorAll('.status-select').forEach(sel => {
            sel.addEventListener('change', async function () {
                const orderId  = this.dataset.orderId;
                const newStatus = this.value;
                const prevStatus = this.dataset.current;
                await updateOrderStatus(orderId, newStatus, prevStatus, this);
            });
        });

        // Open drawer on order ID click
        tbody.querySelectorAll('.order-id-link').forEach(btn => {
            btn.addEventListener('click', () => openOrderDrawer(parseInt(btn.dataset.orderId)));
        });
    }

    function renderOrdersEmpty(msg) {
        document.getElementById('ordersTableBody').innerHTML = `
            <tr><td colspan="7">
                <div class="empty-state">
                    <i class="ri-inbox-2-line"></i>
                    <p>${msg}</p>
                </div>
            </td></tr>`;
    }

    // ─── Update Order Status ──────────────────────────────
    async function updateOrderStatus(orderId, newStatus, prevStatus, selectEl) {
        // Optimistic UI — update badge immediately
        const row = document.querySelector(`tr[data-order-id="${orderId}"]`);
        if (row) {
            const badge = row.querySelector('.status-badge');
            if (badge) {
                badge.className = `status-badge status-${newStatus}`;
                badge.textContent = STATUS_LABELS[newStatus] || newStatus;
            }
        }

        try {
            const res = await fetch(`/cashier/api/authenticated/orders/${orderId}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();

            if (data.success) {
                // Update local data
                const order = allOrders.find(o => o.Order_ID == orderId);
                if (order) order.Order_Status = newStatus;
                selectEl.dataset.current = newStatus;
                updatePendingBadge();
                showSuccess(`تم تحديث حالة الطلب #${orderId} إلى "${STATUS_LABELS[newStatus]}"`, 'تم التحديث', 2);
            } else {
                // Rollback
                selectEl.value = prevStatus;
                if (row) {
                    const badge = row.querySelector('.status-badge');
                    if (badge) { badge.className = `status-badge status-${prevStatus}`; badge.textContent = STATUS_LABELS[prevStatus] || prevStatus; }
                }
                showError(data.message || 'فشل في تحديث الحالة', 'خطأ');
            }
        } catch {
            // Rollback on network error
            selectEl.value = prevStatus;
            if (row) {
                const badge = row.querySelector('.status-badge');
                if (badge) { badge.className = `status-badge status-${prevStatus}`; badge.textContent = STATUS_LABELS[prevStatus] || prevStatus; }
            }
            showError('تعذّر الاتصال بالسيرفر', 'خطأ');
        }
    }

    // ─── Filter Tabs ──────────────────────────────────────
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            fetchOrders();
        });
    });

    document.getElementById('refreshOrdersBtn').addEventListener('click', fetchOrders);

    // ─── Order Drawer ─────────────────────────────────────
    async function openOrderDrawer(orderId) {
        document.getElementById('drawerOrderId').textContent = `#${orderId}`;
        document.getElementById('drawerBody').innerHTML = `<div style="text-align:center;padding:3rem"><div class="skeleton-cell" style="height:14px;margin-bottom:12px"></div><div class="skeleton-cell" style="height:14px;width:70%"></div></div>`;
        document.getElementById('drawerOverlay').classList.add('open');
        document.getElementById('orderDrawer').classList.add('open');

        try {
            const res  = await fetch(`/cashier/api/authenticated/orders/${orderId}/receipt`, { credentials: 'include' });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);

            const { order, items, discount } = data.data;
            const status = order.Order_Status || 'Pending';
            const total  = parseFloat(order.Total_Amount || 0);

            document.getElementById('drawerBody').innerHTML = `
                <div class="drawer-info-grid">
                    <div class="info-card">
                        <label>رقم الطلب</label>
                        <span>#${order.Order_ID}</span>
                    </div>
                    <div class="info-card">
                        <label>الحالة</label>
                        <span class="status-badge status-${status}" style="font-size:0.78rem">${STATUS_LABELS[status] || status}</span>
                    </div>
                    <div class="info-card">
                        <label>طريقة الدفع</label>
                        <span>${PAYMENT_LABELS[order.Payment_Method?.toLowerCase()] || order.Payment_Method || '—'}</span>
                    </div>
                    <div class="info-card">
                        <label>وقت الطلب</label>
                        <span style="font-size:0.8rem">${fmtTime(order.Created_At)}</span>
                    </div>
                </div>

                <p class="drawer-items-title"><i class="ri-list-check"></i> المنتجات (${items.length} صنف)</p>
                ${items.map(item => `
                    <div class="drawer-item">
                        <div>
                            <div class="drawer-item-name">${item.Product_Name || item.name}</div>
                            <div class="drawer-item-qty">الكمية: ${item.Quantity || item.quantity}</div>
                        </div>
                        <div class="drawer-item-price">${fmtMoney((item.Price || item.price) * (item.Quantity || item.quantity))} جنيه</div>
                    </div>`).join('')}

                ${discount > 0 ? `<div style="margin-top:var(--spacing-md);padding:var(--spacing-sm) var(--spacing-md);background:#fff9c4;border-radius:var(--radius-sm);font-size:0.88rem;color:#856404;"><i class="ri-coupon-line"></i> خصم مطبّق: <strong>${fmtMoney(discount)} جنيه</strong></div>` : ''}

                <div class="drawer-total">
                    <span>الإجمالي النهائي</span>
                    <span>${fmtMoney(total)} جنيه</span>
                </div>`;
        } catch (e) {
            document.getElementById('drawerBody').innerHTML = `<div class="empty-state"><i class="ri-error-warning-line"></i><p>تعذّر تحميل تفاصيل الطلب</p></div>`;
        }
    }

    function closeDrawer() {
        document.getElementById('drawerOverlay').classList.remove('open');
        document.getElementById('orderDrawer').classList.remove('open');
    }
    document.getElementById('closeDrawerBtn').addEventListener('click', closeDrawer);
    document.getElementById('drawerOverlay').addEventListener('click', closeDrawer);

    // ─── Boot ─────────────────────────────────────────────
    fetchProducts();
});
