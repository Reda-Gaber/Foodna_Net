        // ============ STATE MANAGEMENT ============
        let state = {
            cart: [],
            products: [],
            categories: new Set(),
            appliedCoupon: null,
            paymentMethod: 'cash',
            currentCashier: '<%= user?.name || "الكاشير" %>'
        };

        // ============ INITIALIZATION ============
        document.addEventListener('DOMContentLoaded', async () => {
            updateTime();
            setInterval(updateTime, 1000);
            
            document.getElementById('cashierName').textContent = state.currentCashier;
            
            await loadProducts();
            setupEventListeners();
            restoreCart();
        });

        // ============ TIME UPDATE ============
        function updateTime() {
            const now = new Date();
            const time = now.toLocaleTimeString('ar-SA', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
            });
            document.getElementById('currentTime').textContent = time;
        }

        // ============ LOAD PRODUCTS ============
        async function loadProducts() {
            try {
                const response = await fetch('/cashier/api/products', {
                    credentials: 'include'
                });
                const data = await response.json();

                if (data.success && Array.isArray(data.data)) {
                    state.products = data.data;
                    processCategories();
                    renderProducts();
                } else {
                    showError('فشل تحميل المنتجات');
                }
            } catch (error) {
                console.error('Load products error:', error);
                showError('خطأ في الاتصال: ' + error.message);
            }
        }

        // ============ PROCESS CATEGORIES ============
        function processCategories() {
            state.categories = new Set();
            state.products.forEach(p => {
                if (p.Category) state.categories.add(p.Category);
            });

            const tabsContainer = document.getElementById('categoryTabs');
            tabsContainer.innerHTML = '<div class="category-tab active" data-category="all" onclick="filterByCategory(this)">جميع الفئات</div>';
            
            state.categories.forEach(category => {
                const tab = document.createElement('div');
                tab.className = 'category-tab';
                tab.textContent = category;
                tab.dataset.category = category;
                tab.onclick = function() { filterByCategory(this); };
                tabsContainer.appendChild(tab);
            });
        }

        // ============ FILTER BY CATEGORY ============
        function filterByCategory(element) {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            element.classList.add('active');
            
            const category = element.dataset.category;
            const filtered = category === 'all' 
                ? state.products 
                : state.products.filter(p => p.Category === category);
            
            renderProducts(filtered);
        }

        // ============ SEARCH PRODUCTS ============
        let searchDebounceTimer = null;
        document.getElementById('searchInput').addEventListener('input', (e) => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                const query = e.target.value.toLowerCase();
                if (!query) {
                    const activeCategory = document.querySelector('.category-tab.active');
                    filterByCategory(activeCategory);
                    return;
                }
                
                const filtered = state.products.filter(p => 
                    p.Product_Name.toLowerCase().includes(query) ||
                    p.Product_ID.toString().includes(query)
                );
                renderProducts(filtered);
            }, 300);
        });

        // ============ RENDER PRODUCTS ============
        function renderProducts(products = state.products) {
            const grid = document.getElementById('productsGrid');
            
            if (!products.length) {
                grid.innerHTML = '<div class="empty-cart" style="grid-column: 1/-1;"><i class="ri-inbox-line"></i><p>لا توجد منتجات</p></div>';
                return;
            }

            grid.innerHTML = products.map(product => {
                const isOutOfStock = product.Quantity <= 0;
                return `
                    <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''}" 
                         onclick="${isOutOfStock ? '' : `addToCart(${product.Product_ID})`}">
                        ${!isOutOfStock ? `<div class="stock-badge">${product.Quantity}</div>` : ''}
                        <img src="${product.Image || '/images/placeholder.png'}" alt="${product.Product_Name}" class="product-image" onerror="this.src='/images/placeholder.png'">
                        <div class="product-name">${product.Product_Name}</div>
                        <div class="product-price">${parseFloat(product.Price).toFixed(2)} ر.س</div>
                        <div class="product-qty">${product.Quantity} متوفر</div>
                        ${isOutOfStock ? '<div class="out-of-stock-badge">❌ غير متوفر</div>' : ''}
                    </div>
                `;
            }).join('');
        }

        // ============ ADD TO CART ============
        function addToCart(productId) {
            const product = state.products.find(p => p.Product_ID == productId);
            if (!product || product.Quantity <= 0) {
                showWarning('المنتج غير متوفر');
                return;
            }

            const existingItem = state.cart.find(item => item.Product_ID == productId);
            
            if (existingItem) {
                if (existingItem.quantity < product.Quantity) {
                    existingItem.quantity++;
                } else {
                    showWarning('الكمية المتاحة: ' + product.Quantity);
                }
            } else {
                state.cart.push({
                    Product_ID: product.Product_ID,
                    Product_Name: product.Product_Name,
                    Price: parseFloat(product.Price),
                    quantity: 1,
                    Image: product.Image,
                    MaxQuantity: product.Quantity
                });
            }

            renderCart();
            updateTotals();
            saveCart();
        }

        // ============ RENDER CART ============
        function renderCart() {
            const cartContainer = document.getElementById('cartItems');
            const cartCount = document.getElementById('cartCount');

            if (!state.cart.length) {
                cartContainer.innerHTML = `
                    <div class="empty-cart">
                        <i class="ri-shopping-cart-line"></i>
                        <p>السلة فارغة</p>
                    </div>
                `;
                cartCount.textContent = '0';
                return;
            }

            cartCount.textContent = state.cart.length;
            cartContainer.innerHTML = state.cart.map((item, index) => `
                <div class="cart-item">
                    <div class="cart-item-header">
                        <div class="cart-item-name">${item.Product_Name}</div>
                        <div class="cart-item-price">${item.Price.toFixed(2)} ر.س</div>
                    </div>
                    <div class="cart-item-controls">
                        <div class="qty-control">
                            <button class="qty-btn" onclick="updateQuantity(${index}, -1)">−</button>
                            <div class="qty-display">${item.quantity}</div>
                            <button class="qty-btn" onclick="updateQuantity(${index}, 1)">+</button>
                        </div>
                        <div class="cart-item-total">${(item.Price * item.quantity).toFixed(2)} ر.س</div>
                        <button class="delete-btn" onclick="removeFromCart(${index})">حذف</button>
                    </div>
                </div>
            `).join('');
        }

        // ============ UPDATE QUANTITY ============
        function updateQuantity(index, change) {
            const item = state.cart[index];
            const newQty = item.quantity + change;

            if (newQty < 1) {
                removeFromCart(index);
                return;
            }

            if (newQty > item.MaxQuantity) {
                showWarning('الكمية المتاحة: ' + item.MaxQuantity);
                return;
            }

            item.quantity = newQty;
            renderCart();
            updateTotals();
            saveCart();
        }

        // ============ REMOVE FROM CART ============
        function removeFromCart(index) {
            state.cart.splice(index, 1);
            renderCart();
            updateTotals();
            saveCart();
        }

        // ============ APPLY COUPON ============
        async function applyCoupon() {
            const couponCode = document.getElementById('couponInput').value.trim();
            const statusDiv = document.getElementById('couponStatus');

            if (!couponCode) {
                statusDiv.textContent = 'أدخل كود التخفيف';
                statusDiv.className = 'coupon-status coupon-invalid';
                return;
            }

            try {
                const response = await fetch('/cashier/api/coupon/validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ code: couponCode })
                });

                const data = await response.json();

                if (data.success) {
                    state.appliedCoupon = data.data;
                    statusDiv.textContent = `✓ ${data.data.Discount_Type === 'percentage' ? data.data.Discount_Value + '%' : data.data.Discount_Value + ' ر.س'} تخفيف`;
                    statusDiv.className = 'coupon-status coupon-valid';
                    updateTotals();
                } else {
                    state.appliedCoupon = null;
                    statusDiv.textContent = '❌ كود غير صحيح أو منتهي';
                    statusDiv.className = 'coupon-status coupon-invalid';
                    updateTotals();
                }
            } catch (error) {
                console.error('Coupon error:', error);
                showError('خطأ في التحقق من الكود');
            }
        }

        // ============ UPDATE TOTALS ============
        function updateTotals() {
            const subtotal = state.cart.reduce((sum, item) => sum + (item.Price * item.quantity), 0);
            
            let discount = 0;
            if (state.appliedCoupon) {
                if (state.appliedCoupon.Discount_Type === 'percentage') {
                    discount = subtotal * state.appliedCoupon.Discount_Value / 100;
                } else {
                    discount = state.appliedCoupon.Discount_Value;
                }
            }

            const afterDiscount = subtotal - discount;
            const tax = afterDiscount * 0.15;
            const serviceFee = afterDiscount * 0.05;
            const grandTotal = afterDiscount + tax + serviceFee;

            document.getElementById('subtotal').textContent = subtotal.toFixed(2) + ' ر.س';
            document.getElementById('tax').textContent = tax.toFixed(2) + ' ر.س';
            document.getElementById('serviceFee').textContent = serviceFee.toFixed(2) + ' ر.س';
            document.getElementById('grandTotal').textContent = grandTotal.toFixed(2) + ' ر.س';

            const discountRow = document.getElementById('discountRow');
            if (discount > 0) {
                discountRow.style.display = 'flex';
                document.getElementById('discountAmount').textContent = discount.toFixed(2) + ' ر.س';
            } else {
                discountRow.style.display = 'none';
                state.appliedCoupon = null;
            }

            calculateChange();
        }

        // ============ PAYMENT METHOD ============
        function setPaymentMethod(method) {
            state.paymentMethod = method;
            document.querySelectorAll('.payment-method-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelector(`[data-method="${method}"]`).classList.add('active');

            const cashGroup = document.getElementById('cashInputGroup');
            if (method === 'cash') {
                cashGroup.classList.add('show');
            } else {
                cashGroup.classList.remove('show');
                document.getElementById('amountReceived').value = '';
                document.getElementById('changeDisplay').textContent = 'الباقي: 0.00 ر.س';
            }
        }

        // ============ CALCULATE CHANGE ============
        function calculateChange() {
            const grandTotal = parseFloat(document.getElementById('grandTotal').textContent) || 0;
            const amountReceived = parseFloat(document.getElementById('amountReceived').value) || 0;
            const change = amountReceived - grandTotal;

            const changeDisplay = document.getElementById('changeDisplay');
            if (amountReceived < grandTotal) {
                changeDisplay.textContent = `المتبقي: ${(grandTotal - amountReceived).toFixed(2)} ر.س`;
                changeDisplay.style.background = '#ffebee';
                changeDisplay.style.color = '#c62828';
            } else {
                changeDisplay.textContent = `الباقي: ${change.toFixed(2)} ر.س`;
                changeDisplay.style.background = '#e8f5e9';
                changeDisplay.style.color = '#2e7d32';
            }
        }

        // ============ CANCEL ORDER ============
        function cancelOrder() {
            if (!state.cart.length) {
                showWarning('السلة فارغة بالفعل');
                return;
            }

            Swal.fire({
                title: 'هل أنت متأكد؟',
                text: 'سيتم مسح جميع العناصر من السلة',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'نعم، احذف',
                cancelButtonText: 'إلغاء',
                confirmButtonColor: '#c0392b',
                cancelButtonColor: '#9e9e9e'
            }).then((result) => {
                if (result.isConfirmed) {
                    state.cart = [];
                    state.appliedCoupon = null;
                    document.getElementById('couponInput').value = '';
                    document.getElementById('orderNotes').value = '';
                    document.getElementById('couponStatus').innerHTML = '';
                    renderCart();
                    updateTotals();
                    saveCart();
                    showSuccess('تم مسح السلة');
                }
            });
        }

        // ============ COMPLETE ORDER ============
        async function completeOrder() {
            if (!state.cart.length) {
                showWarning('السلة فارغة');
                return;
            }

            const btn = document.getElementById('checkoutBtn');
            btn.disabled = true;
            btn.classList.add('loading');
            btn.textContent = 'جاري الحفظ...';

            try {
                const items = state.cart.map(item => ({
                    productId: item.Product_ID,
                    quantity: item.quantity,
                    price: item.Price
                }));

                // Parse grandTotal safely - strip currency text before parseFloat
                const grandTotalText = document.getElementById('grandTotal').textContent;
                const grandTotal = parseFloat(grandTotalText.replace(/[^\d.]/g, ''));

                if (isNaN(grandTotal) || grandTotal <= 0) {
                    showError('خطأ في حساب الإجمالي، يرجى المحاولة مرة أخرى');
                    return;
                }

                const notes = document.getElementById('orderNotes').value;

                const response = await fetch('/cashier/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        items: items,
                        totalAmount: grandTotal,
                        notes: notes,
                        paymentMethod: state.paymentMethod,
                        couponCode: state.appliedCoupon?.Coupon_Code || null
                    })
                });

                const data = await response.json();

                if (data.success) {
                    showSuccess('✅ تم حفظ الطلب بنجاح');
                    state.cart = [];
                    state.appliedCoupon = null;
                    document.getElementById('couponInput').value = '';
                    document.getElementById('orderNotes').value = '';
                    document.getElementById('couponStatus').innerHTML = '';
                    document.getElementById('amountReceived').value = '';
                    renderCart();
                    updateTotals();
                    saveCart();
                } else {
                    showError(data.message || 'فشل حفظ الطلب');
                }
            } catch (error) {
                console.error('Complete order error:', error);
                showError('خطأ: ' + error.message);
            } finally {
                btn.disabled = false;
                btn.classList.remove('loading');
                btn.textContent = '✓ إتمام البيع';
            }
        }

        // ============ STORAGE ============
        function saveCart() {
            localStorage.setItem('pos_cart', JSON.stringify(state.cart));
        }

        function restoreCart() {
            const saved = localStorage.getItem('pos_cart');
            if (saved) {
                try {
                    state.cart = JSON.parse(saved);
                    renderCart();
                    updateTotals();
                } catch (e) {
                    console.error('Restore cart error:', e);
                }
            }
        }

        // ============ NOTIFICATIONS ============
        function showSuccess(message) {
            Swal.fire({
                title: 'نجاح',
                text: message,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        }

        function showError(message) {
            Swal.fire({
                title: 'خطأ',
                text: message,
                icon: 'error',
                confirmButtonText: 'حسناً'
            });
        }

        function showWarning(message) {
            Swal.fire({
                title: 'تحذير',
                text: message,
                icon: 'warning',
                timer: 1500,
                showConfirmButton: false
            });
        }

        // ============ LOGOUT ============
        function logout() {
            Swal.fire({
                title: 'تسجيل الخروج',
                text: 'هل تريد الخروج من الحساب؟',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'نعم',
                cancelButtonText: 'لا'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '/auth/logout';
                }
            });
        }

        // ============ SETUP EVENT LISTENERS ============
        function setupEventListeners() {
            // Prevent form submission
            document.querySelectorAll('input').forEach(input => {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && e.target.id === 'couponInput') {
                        applyCoupon();
                    }
                });
            });
        }
  
