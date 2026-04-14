/**
 * Home Page Cart Handler - Uses Global Cart State
 * Integrated with cart-state.js for unified cart management
 */

(function() {
  'use strict';

  // Cart DOM Elements
  let cartElement;
  let cartButton;
  let closeButton;
  let cartOverlay;

  /**
   * Initialize DOM references
   */
  function initDOMReferences() {
    cartElement = document.querySelector('.cart');
    cartButton = document.getElementById('cart-button');
    closeButton = document.querySelector('.close_cart');
    cartOverlay = document.getElementById('cartOverlay');

    if (!cartElement) {
      console.warn('Cart element not found');
      return false;
    }
    return true;
  }

  /**
   * Setup cart toggle buttons
   */
  function setupCartToggleButtons() {
    if (cartButton) {
      cartButton.addEventListener('click', () => {
        if (window.cartState) {
          window.cartState.open();
        }
      });
    }

    if (closeButton) {
      closeButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.cartState) {
          window.cartState.close();
        }
      });
    }

    if (cartOverlay) {
      cartOverlay.addEventListener('click', () => {
        if (window.cartState) {
          window.cartState.close();
        }
      });
    }
  }

  /**
   * Setup add to cart buttons
   */
  function setupAddToCartButtons() {
    fetch('/api/products')
      .then(res => res.json())
      .then(products => {
        const addToCartButtons = document.querySelectorAll('.button-data-id');

        addToCartButtons.forEach(button => {
          button.addEventListener('click', (e) => {
            e.preventDefault();
            
            const productId = Number(button.getAttribute('data-id'));
            const product = products.find(p => p.Product_ID === productId);

            if (!product) {
              console.error('Product not found:', productId);
              return;
            }

            // Add to global cart state
            const cartProduct = {
              id: product.Product_ID,
              title: product.Product_Name,
              price: product.Price,
              img: `images/products/${product.Image}`,
              quantity: 1
            };

            if (window.cartState) {
              window.cartState.addItem(cartProduct);
              
              // Visual feedback
              button.classList.add('activess');
              button.disabled = true;
              
              // Show notification
              showAddedNotification(`تم إضافة ${product.Product_Name} للسلة!`);
            }
          });
        });
      })
      .catch(error => console.error('Error loading products:', error));
  }

  /**
   * Show added to cart notification
   */
  function showAddedNotification(message) {
    const notificationEl = document.createElement('div');
    notificationEl.className = 'cart_message success';
    notificationEl.textContent = `✓ ${message}`;
    notificationEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      z-index: 1000;
      animation: slideDown 0.3s ease-out;
    `;
    document.body.appendChild(notificationEl);

    setTimeout(() => {
      notificationEl.remove();
    }, 3000);
  }

  /**
   * Sync cart UI with global state
   */
  function syncCartUI(state) {
    if (!cartElement) return;

    if (state.isOpen) {
      cartElement.classList.add('active');
    } else {
      cartElement.classList.remove('active');
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

    // Attach event listeners
    attachCartItemListeners();
  }

  /**
   * Attach listeners to quantity and delete buttons
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
   * Setup checkout button
   */
  function setupCheckoutButton() {
    const checkoutButtons = document.querySelectorAll('.btn_cart, .btn-complete-order');
    
    checkoutButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        handleCheckout();
      });
    });
  }

  /**
   * Handle checkout
   */
  function handleCheckout() {
    if (!window.cartState) return;

    const items = window.cartState.getItems();

    if (items.length === 0) {
      showMessage('السلة فارغة! الرجاء إضافة منتجات.', 'warning');
      return;
    }

    // Check authentication
    if (typeof window.isAuthenticated !== 'function' || !window.isAuthenticated()) {
      showMessage('يجب تسجيل الدخول أولاً لإتمام الطلب!', 'error');
      setTimeout(() => {
        try {
          localStorage.setItem('pendingCart', JSON.stringify(items));
          localStorage.setItem('postAuthRedirect', window.location.pathname);
          localStorage.setItem('checkoutIntent', 'true');
        } catch (e) {
          console.warn('Could not save pending cart');
        }
        window.location.href = '/register';
      }, 800);
      return;
    }

    // Proceed with checkout
    const totals = window.cartState.getTotals();
    showMessage(`جاري معالجة الطلب بقيمة ${totals.subtotal.toFixed(2)} جنيه...`, 'info');
    submitOrder(items, totals.subtotal);
  }

  /**
   * Submit order to server
   */
  async function submitOrder(items, totalAmount) {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price
          })),
          totalAmount: totalAmount,
          deliveryAddress: 'عنوان التوصيل'
        })
      });

      const data = await response.json();

      if (response.status === 401) {
        showMessage('يجب تسجيل الدخول أولاً!', 'error');
        setTimeout(() => window.location.href = '/register', 800);
        return;
      }

      if (!data.success) {
        const errorMessage = data.message || data.error?.message || 'فشل في إنشاء الطلب';
        showMessage(`✗ خطأ: ${errorMessage}`, 'error');
        return;
      }

      // Success
      showMessage(`✓ تم إنشاء الطلب بنجاح! رقم الطلب: ${data.data.orderNumber}`, 'success');
      
      // Clear cart
      window.cartState.clear();
      
      // Close cart after 2 seconds
      setTimeout(() => {
        if (window.cartState) {
          window.cartState.close();
        }
      }, 2000);
    } catch (error) {
      console.error('Checkout error:', error);
      showMessage(`✗ خطأ في الاتصال: ${error.message}`, 'error');
    }
  }

  /**
   * Show message notification
   */
  function showMessage(message, type = 'info') {
    const messageEl = document.getElementById('cart_message');
    if (!messageEl) {
      console.warn('Message element not found');
      return;
    }

    messageEl.textContent = message;
    messageEl.className = `cart_message ${type}`;
    messageEl.style.display = 'block';

    // Set color based on type
    const colors = {
      success: '#4CAF50',
      error: 'var(--text-color)',
      warning: '#ff9800',
      info: '#2196F3'
    };

    messageEl.style.backgroundColor = colors[type] || colors.info;
    messageEl.style.color = '#fff';

    if (type !== 'error') {
      setTimeout(() => {
        messageEl.style.display = 'none';
      }, 4000);
    }
  }

  /**
   * Initialize on DOM ready
   */
  function init() {
    // Initialize DOM references
    if (!initDOMReferences()) {
      console.warn('Could not initialize cart DOM references');
      return;
    }

    // Setup buttons
    setupCartToggleButtons();
    setupAddToCartButtons();
    setupCheckoutButton();

    // Subscribe to global cart state changes
    if (window.cartState) {
      // Listen to items changes
      window.cartState.onItemsChange((items) => {
        updateCartDisplay(items);
      });

      // Listen to UI state changes
      window.cartState.onUIChange((state) => {
        syncCartUI(state);
      });

      // Initial display
      updateCartDisplay(window.cartState.getItems());
      syncCartUI({ isOpen: window.cartState.isOpen() });
    } else {
      console.warn('Global cart state not available');
    }
  }

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
