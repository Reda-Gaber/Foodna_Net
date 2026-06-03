        // Sample products data
        const products = [
            { id: 1, name: "إسبريسو", price: 25 },
            { id: 2, name: "كابتشينو", price: 35 },
            { id: 3, name: "لاتيه", price: 38 },
            { id: 4, name: "موكا", price: 42 },
            { id: 5, name: "أمريكانو", price: 28 },
            { id: 6, name: "شاي بالنعناع", price: 20 },
            { id: 7, name: "كرواسون", price: 30 },
            { id: 8, name: "مافن شوكولاتة", price: 35 },
            { id: 9, name: "كوكيز", price: 15 },
            { id: 10, name: "تشيز كيك", price: 45 },
            { id: 11, name: "ميلك شيك فانيليا", price: 40 },
            { id: 12, name: "عصير برتقال طازج", price: 30 }
        ];

        let cart = [];

        // DOM Elements
        const productsGrid = document.getElementById('productsGrid');
        const searchInput = document.getElementById('searchInput');
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        const payBtn = document.getElementById('payBtn');

        // Render all products
        function renderProducts(filter = '') {
            productsGrid.innerHTML = '';
            const filtered = products.filter(p => 
                p.name.toLowerCase().includes(filter.toLowerCase())
            );

            if (filtered.length === 0) {
                productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">لا توجد منتجات مطابقة</p>';
                return;
            }

            filtered.forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = `
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${product.price.toFixed(2)} جنيه</div>
                    <button class="add-btn" data-id="${product.id}">
                        إضافة للسلة
                    </button>
                `;
                productsGrid.appendChild(card);
            });
        }

        // Add to cart
        function addToCart(productId) {
            const product = products.find(p => p.id === productId);
            const existing = cart.find(item => item.id === productId);

            if (existing) {
                existing.quantity += 1;
            } else {
                cart.push({ ...product, quantity: 1 });
            }

            renderCart();
        }

        // Update quantity
        function updateQuantity(productId, change) {
            const item = cart.find(i => i.id === productId);
            if (item) {
                item.quantity = Math.max(1, item.quantity + change);
                if (item.quantity === 0) {
                    removeFromCart(productId);
                }
            }
            renderCart();
        }

        // Remove from cart
        function removeFromCart(productId) {
            cart = cart.filter(item => item.id !== productId);
            renderCart();
        }

        // Render cart
        function renderCart() {
            if (cart.length === 0) {
                cartItems.innerHTML = '<p class="empty-cart">لا توجد عناصر في السلة</p>';
                cartTotal.textContent = 'الإجمالي: 0.00 جنيه';
                payBtn.disabled = true;
                return;
            }

            cartItems.innerHTML = '';
            let total = 0;

            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                total += itemTotal;

                const div = document.createElement('div');
                div.className = 'cart-item';
                div.innerHTML = `
                    <div class="item-info">
                        <div class="item-name">${item.name}</div>
                        <div class="item-price">${item.price.toFixed(2)} جنيه × ${item.quantity}</div>
                    </div>
                    <div class="quantity-controls">
                        <button class="qty-btn" data-id="${item.id}" data-action="dec">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="qty-btn" data-id="${item.id}" data-action="inc">+</button>
                    </div>
                    <button class="remove-btn" data-id="${item.id}">حذف</button>
                `;
                cartItems.appendChild(div);
            });

            cartTotal.textContent = `الإجمالي: ${total.toFixed(2)} جنيه`;
            payBtn.disabled = false;
        }

        // Checkout - send to kitchen (console log)
        function checkout() {
            const order = {
                items: cart.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.price * item.quantity
                })),
                total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                timestamp: new Date().toLocaleString('ar-EG')
            };

            console.log('طلب جديد للمطبخ:', order);
            alert(`تم إرسال الطلب! الإجمالي: ${order.total.toFixed(2)} جنيه`);

            // Clear cart
            cart = [];
            renderCart();
        }

        // Event Listeners
        productsGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-btn')) {
                const id = parseInt(e.target.dataset.id);
                addToCart(id);
            }
        });

        cartItems.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            if (e.target.classList.contains('qty-btn')) {
                const action = e.target.dataset.action;
                updateQuantity(id, action === 'inc' ? 1 : -1);
            } else if (e.target.classList.contains('remove-btn')) {
                removeFromCart(id);
            }
        });

        searchInput.addEventListener('input', (e) => {
            renderProducts(e.target.value);
        });

        payBtn.addEventListener('click', checkout);

        // Initialize
        renderProducts();
  