/**
 * Product Page Handler - Fixed Version
 * Uses Global Cart State instead of local state
 * Cart does NOT open automatically when adding items
 */

(function() {
  'use strict';

  // Get product ID from URL
  const params = new URLSearchParams(window.location.search);
  const productId = Number(params.get('id'));

  /**
   * Render product details
   */
  function renderProductDetails() {
    fetch('/api/products')
      .then(res => res.json())
      .then(products => {
        const product = products.find(p => p.Product_ID === productId);
        
        if (!product) {
          document.getElementById('product').innerText = 'المنتج غير موجود';
          return;
        }

        document.getElementById('product').innerHTML = `
          <div class="product-up">
            <div class="scale">
              <div class="text-product">
                <h2 class="titel-product">${product.Product_Name}</h2>
                <p class="description-product">${product.Description}</p>
                <p class="points-one-product">إذا اشتريت هذا، ستحصل على ${Number(product.Quantity) || 0} نقاط!</p>
                <div class="points-two-product">
                  <i class="ri-award-fill"></i>
                  <p>إذا اشتريت هذا، ستحصل على ${Number(product.Quantity) || 0} نقاط!</p>
                </div>
                <div class="size-product">
                  <h3 class="size">الحجم:</h3>
                  <div class="size-options">
                    <button><a href="#">صغير</a></button>
                    <button><a href="#">متوسط</a></button>
                    <button><a href="#">كبير</a></button>
                    <button><a href="#">عائلي</a></button>
                  </div>
                </div>
              </div>
              <div class="img-product">
                <img src="/images/products/${product.Image}" alt="${product.Product_Name}">
              </div>
            </div>
              <div class="check_box">
              ${ (product.Discount && Number(product.Discount) > 0) ? (`<h2 class="price_product"><span class="old-price" style="text-decoration:line-through;color:#999;margin-right:8px">${Number(product.Price).toFixed(2)} جنيه</span><span class="new-price" style="color:#e62a32;font-weight:700">${(Number(product.Price)*(1-Number(product.Discount)/100)).toFixed(2)} جنيه</span></h2>`) : (`<h2 class="price_product">${Number(product.Price).toFixed(2)} جنيه</h2>`) }
              <!-- قسم الكومبو محذوف -->
              <!-- قسم الصلصة محذوف -->
              <h2 class="totil_price_product">إجمالي الطلب: <span>${ (product.Discount && Number(product.Discount) > 0) ? (Number(product.Price)*(1-Number(product.Discount)/100)).toFixed(2) : Number(product.Price).toFixed(2) } جنيه</span></h2>
              <button class="button-data-id" data-id="${product.Product_ID}">إضافة للسلة</button>
            </div>
          </div>
        `;

        // Add to cart event listener
        attachAddToCartListener(product);
      })
      .catch(error => {
        document.getElementById('product').innerText = 'حدث خطأ في تحميل المنتج';
      });
  }

  /**
   * Attach add to cart listener
   */
  function attachAddToCartListener(product) {
    const addButton = document.querySelector('.button-data-id');
    if (!addButton) return;

    // دالة تحكم في حالة الزر
    function setButtonAdded(added) {
      if (added) {
        addButton.classList.add('activess');
        addButton.classList.add('btn-added');
        addButton.textContent = '✓ تم الإضافة للسلة';
        addButton.disabled = true;
        addButton.style.background = '#9e9e9e';
        addButton.style.cursor = 'not-allowed';
        addButton.style.opacity = '0.75';
      } else {
        addButton.classList.remove('activess');
        addButton.classList.remove('btn-added');
        addButton.textContent = 'إضافة للسلة';
        addButton.disabled = false;
        addButton.style.background = '';
        addButton.style.cursor = '';
        addButton.style.opacity = '';
      }
    }

    // تحقق من حالة المنتج في السلة عند التحميل
    function syncButtonWithCart() {
      if (!window.cartState) return;
      const items = window.cartState.getItems();
      const inCart = items.some(item => item.id === product.Product_ID);
      setButtonAdded(inCart);
    }

    // مراقبة السلة — لو المنتج اتشال يرجع الزر
    if (window.cartState) {
      window.cartState.onItemsChange(function(items) {
        const inCart = items.some(item => item.id === product.Product_ID);
        setButtonAdded(inCart);
      });
      // تحقق فوري عند التحميل
      syncButtonWithCart();
    }

    addButton.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Add to global cart state
      const priceToUse = (product.Discount && Number(product.Discount) > 0) ? Number(product.Price) * (1 - Number(product.Discount) / 100) : Number(product.Price);
      const cartProduct = {
        id: product.Product_ID,
        title: product.Product_Name,
        price: parseFloat(priceToUse.toFixed(2)),
        img: `images/products/${product.Image}`,
        quantity: 1
      };

      // Use global cart state
      if (window.cartState) {
        window.cartState.addItem(cartProduct);
        showAddedMessage('تم إضافة المنتج للسلة بنجاح!');
        
        // الزر يبقى رمادي ومعطّل بعد الإضافة
        setButtonAdded(true);
      } else {
        showAddedMessage('خطأ: لم يتم تحميل السلة', true);
      }
    });
  }

  /**
   * Show message when item is added
   */
  function showAddedMessage(message, isError = false) {
    const messageEl = document.createElement('div');
    messageEl.className = `cart_message ${isError ? 'error' : 'success'}`;
    messageEl.textContent = `${isError ? '✗' : '✓'} ${message}`;
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${isError ? '#ef4444' : '#10b981'};
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      z-index: 1000;
      animation: slideDown 0.3s ease-out;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
      messageEl.style.opacity = '0';
      messageEl.style.transition = 'opacity 0.3s ease-out';
      setTimeout(() => messageEl.remove(), 300);
    }, 3000);
  }

  /**
   * Load recommended products
   */
  function loadRecommendedProducts() {
    fetch('/api/products')
      .then(res => res.json())
      .then(products => {
        // Filter out current product and get first 3
        const recommended = products
          .filter(p => p.Product_ID !== productId)
          .slice(0, 3);

        const grid = document.querySelector('.products-grid_1');
        if (!grid) return;

        grid.innerHTML = '';
        recommended.forEach(product => {
          const productCard = document.createElement('div');
          productCard.classList.add('product');
          
          // Calculate discount price
          const oldPrice = Number(product.Price || 0);
          const discount = Number(product.Discount || 0);
          const finalPrice = discount > 0 ? Math.max(0, oldPrice * (1 - discount / 100)) : oldPrice;
          
          productCard.innerHTML = `
            <img src="/images/products/${product.Image}" alt="${product.Product_Name}">
            <div class="product-info">
              <h3>${product.Product_Name}</h3>
              <div class="points">${product.Quantity} كمية</div>
              <div class="price">
                ${discount > 0 ? `<span class="old-price" style="text-decoration:line-through;color:#999;margin-right:8px">${oldPrice.toFixed(2)} جنيه</span>` : ''}
                <span class="final-price" style="color:${discount>0? '#e62a32':'#000'};font-weight:700">${finalPrice.toFixed(2)} جنيه</span>
              </div>
            </div>
            <div class="button__actions">
              <button class="Product__actions">
                <a href="product-page?id=${product.Product_ID}">اختر الخيارات</a>
              </button>
            </div>
          `;
          grid.appendChild(productCard);
        });
      })
      .catch(error => {
        if (error) {
          console.log('Error loading recommended products:', error);
        }
      }
      );
  }

  /**
   * Setup cart UI for product page
   */
  function setupCartUI() {
    // Close cart when sidebar close button is clicked
    const closeBtn = document.querySelector('.close_cart');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (window.cartState) {
          window.cartState.close();
        }
      });
    }

    // Open cart when complete order button is clicked
    const completeOrderBtn = document.querySelector('.btn-complete-order');
    if (completeOrderBtn) {
      completeOrderBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.cartState) {
          window.cartState.open();
        }
      });
    }

    // Continue shopping closes cart
    const continueShopping = document.querySelector('.btn-continue-shopping');
    if (continueShopping) {
      continueShopping.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.cartState) {
          window.cartState.close();
        }
      });
    }
  }

  /**
   * Update cart display
   */
  function updateCartDisplay(items) {
    const cartItemsContainer = document.getElementById('cart_items');
    const priceTotal = document.querySelector('.price_cart_total');
    const countBadge = document.querySelector('.count_item_cart');

    if (!cartItemsContainer) return;

    // Clear previous items
    cartItemsContainer.innerHTML = '';

    if (items.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="cart-empty">
          <i class="ri-shopping-cart-line"></i>
          <p>سلتك فارغة</p>
          <span>أضف منتجات لبدء التسوق</span>
        </div>
      `;
      if (priceTotal) priceTotal.textContent = '0.00 جنيه';
      if (countBadge) countBadge.textContent = '0';
      return;
    }

    let totalPrice = 0;
    let totalQuantity = 0;

    items.forEach((item) => {
      totalPrice += item.price * item.quantity;
      totalQuantity += item.quantity;

      const itemEl = document.createElement('div');
      itemEl.className = 'item_cart';
      itemEl.innerHTML = `
        <img src="/${item.img}" alt="${item.title}">
        <div class="content">
          <h4>${item.title}</h4>
          <p class="price_cart">${(item.price * item.quantity).toFixed(2)} جنيه</p>
          <div class="quantity_control">
            <button class="decrease-qty" data-product-id="${item.id}" aria-label="تقليل الكمية">−</button>
            <span class="quantity">${item.quantity}</span>
            <button class="increase-qty" data-product-id="${item.id}" aria-label="زيادة الكمية">+</button>
          </div>
        </div>
        <button class="delete_item" data-product-id="${item.id}" aria-label="حذف من السلة">
          <i class="ri-delete-bin-5-line"></i>
        </button>
      `;

      cartItemsContainer.appendChild(itemEl);
    });

    // Update totals
    if (priceTotal) priceTotal.textContent = `${totalPrice.toFixed(2)} جنيه`;
    if (countBadge) countBadge.textContent = totalQuantity;

    // Attach event listeners for quantity buttons and delete
    attachCartItemListeners();
  }

  /**
   * Attach listeners to cart item buttons
   */
  function attachCartItemListeners() {
    // Increase quantity
    document.querySelectorAll('.increase-qty').forEach(btn => {
      btn.addEventListener('click', function() {
        const productId = Number(this.dataset.productId);
        if (window.cartState) {
          window.cartState.increaseQuantity(productId);
        }
      });
    });

    // Decrease quantity
    document.querySelectorAll('.decrease-qty').forEach(btn => {
      btn.addEventListener('click', function() {
        const productId = Number(this.dataset.productId);
        if (window.cartState) {
          window.cartState.decreaseQuantity(productId);
        }
      });
    });

    // Delete item
    document.querySelectorAll('.delete_item').forEach(btn => {
      btn.addEventListener('click', function() {
        const productId = Number(this.dataset.productId);
        if (window.cartState) {
          window.cartState.removeItem(productId);
        }
      });
    });
  }

  /**
   * Initialize page on DOM ready
   */
  function init() {
    // Render product details
    renderProductDetails();
    
    // Load recommended products
    loadRecommendedProducts();
    
    // Setup cart UI
    setupCartUI();

    // Subscribe to cart changes
    if (window.cartState) {
      window.cartState.onItemsChange((items) => {
        updateCartDisplay(items);
      });

      // Initial display
      updateCartDisplay(window.cartState.getItems());
    } else {
    }
  }

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
