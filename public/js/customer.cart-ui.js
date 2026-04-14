/**
 * Modern Customer Cart UI Handler
 * Handles checkout form visibility, overlay interactions, and form validation
 * Does NOT touch cart state logic (that's in customer.min.js)
 */

(function() {
  'use strict';

  // DOM Elements
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartCloseBtn = document.querySelector('.close_cart');
  const confirmOrderBtn = document.getElementById('confirmOrderBtn');
  const continueShopping = document.getElementById('continueShopping');
  const checkoutFormContainer = document.getElementById('checkoutFormContainer');
  const backToCartBtn = document.getElementById('backToCartBtn');
  const submitCheckoutBtn = document.getElementById('submitCheckoutBtn');
  const checkoutForm = document.querySelector('.checkout-form');

  // Form Elements
  const deliveryAddressInput = document.getElementById('deliveryAddress');
  const phoneNumberInput = document.getElementById('phoneNumber');
  const paymentMethodRadios = document.querySelectorAll('input[name="paymentMethod"]');
  const orderNotesInput = document.getElementById('orderNotes');

  /**
   * Close Cart Drawer
   */
  function closeCart() {
    if (cartDrawer) {
      cartDrawer.classList.remove('active');
    }
    hideCheckoutForm();
  }

  /**
   * Open Cart Drawer
   */
  function openCart() {
    if (cartDrawer) {
      cartDrawer.classList.add('active');
    }
  }

  /**
   * Show Checkout Form (Hide Cart Items)
   */
  function showCheckoutForm() {
    if (checkoutFormContainer) {
      checkoutFormContainer.style.display = 'flex';
    }
  }

  /**
   * Hide Checkout Form (Show Cart Items)
   */
  function hideCheckoutForm() {
    if (checkoutFormContainer) {
      checkoutFormContainer.style.display = 'none';
    }
    // Clear form on close
    resetCheckoutForm();
  }

  /**
   * Reset Checkout Form to Initial State
   */
  function resetCheckoutForm() {
    if (deliveryAddressInput) deliveryAddressInput.value = '';
    if (phoneNumberInput) phoneNumberInput.value = '';
    if (orderNotesInput) orderNotesInput.value = '';
    // Set cash as default payment method
    const cashOption = document.querySelector('input[name="paymentMethod"][value="cash"]');
    if (cashOption) cashOption.checked = true;
    // Remove any validation errors
    document.querySelectorAll('.form-error').forEach(el => {
      el.remove();
    });
  }

  /**
   * Validate Checkout Form
   */
  function validateCheckoutForm() {
    let isValid = true;
    const errors = [];

    // Clear previous errors
    document.querySelectorAll('.form-error').forEach(el => {
      el.remove();
    });

    // Validate Delivery Address
    if (!deliveryAddressInput.value.trim()) {
      errors.push('عنوان التوصيل مطلوب');
      showFormError(deliveryAddressInput, 'عنوان التوصيل مطلوب');
      isValid = false;
    }

    // Validate Phone Number
    if (!phoneNumberInput.value.trim()) {
      errors.push('رقم الهاتف مطلوب');
      showFormError(phoneNumberInput, 'رقم الهاتف مطلوب');
      isValid = false;
    } else if (!/^[0-9]{10,15}$/.test(phoneNumberInput.value.replace(/\D/g, ''))) {
      errors.push('رقم الهاتف غير صحيح');
      showFormError(phoneNumberInput, 'رقم الهاتف غير صحيح');
      isValid = false;
    }

    return isValid;
  }

  /**
   * Show Form Error Message
   */
  function showFormError(inputElement, message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'form-error';
    errorEl.textContent = message;
    errorEl.style.cssText = `
      color: #dc3545;
      font-size: 0.85rem;
      margin-top: 0.375rem;
      font-weight: 500;
    `;
    inputElement.parentNode.appendChild(errorEl);
    inputElement.style.borderColor = '#dc3545';
  }

  /**
   * Handle Confirm Order Button Click
   */
  function handleConfirmOrder(e) {
    e.preventDefault();
    openCart(); // Ensure cart is open
    showCheckoutForm();
    // Focus on first input
    setTimeout(() => {
      if (deliveryAddressInput) deliveryAddressInput.focus();
    }, 300);
  }

  /**
   * Handle Back to Cart Button Click
   */
  function handleBackToCart(e) {
    e.preventDefault();
    hideCheckoutForm();
  }

  /**
   * Handle Checkout Submission
   */
  function handleSubmitCheckout(e) {
    e.preventDefault();

    // Validate form
    if (!validateCheckoutForm()) {
      return;
    }

    // Get form data
    const checkoutData = {
      deliveryAddress: deliveryAddressInput.value.trim(),
      phoneNumber: phoneNumberInput.value.trim(),
      paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
      orderNotes: orderNotesInput.value.trim(),
      cartItems: JSON.parse(localStorage.getItem('cart')) || [],
      timestamp: new Date().toISOString()
    };

    // TODO: Send checkout data to server
    console.log('Checkout Data:', checkoutData);

    // Show success message
    showCheckoutSuccess();

    // Clear cart and close
    setTimeout(() => {
      localStorage.setItem('cart', JSON.stringify([]));
      if (typeof updetecart === 'function') {
        updetecart();
      }
      hideCheckoutForm();
      closeCart();
    }, 1500);
  }

  /**
   * Show Checkout Success Message
   */
  function showCheckoutSuccess() {
    const message = document.getElementById('cart_message');
    if (message) {
      message.textContent = '✓ تم تأكيد طلبك بنجاح!';
      message.className = 'cart_message success show';
      setTimeout(() => {
        message.classList.remove('show');
      }, 3000);
    }
  }

  /**
   * Handle Continue Shopping Button Click
   */
  function handleContinueShopping(e) {
    e.preventDefault();
    closeCart();
  }

  /**
   * Initialize Event Listeners
   */
  function initEventListeners() {
    // Cart close button
    if (cartCloseBtn) {
      cartCloseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeCart();
      });
    }

    // Overlay click
    if (cartOverlay) {
      cartOverlay.addEventListener('click', (e) => {
        e.preventDefault();
        closeCart();
      });
    }

    // Confirm order button
    if (confirmOrderBtn) {
      confirmOrderBtn.addEventListener('click', handleConfirmOrder);
    }

    // Continue shopping button
    if (continueShopping) {
      continueShopping.addEventListener('click', handleContinueShopping);
    }

    // Back to cart button
    if (backToCartBtn) {
      backToCartBtn.addEventListener('click', handleBackToCart);
    }

    // Submit checkout button
    if (submitCheckoutBtn) {
      submitCheckoutBtn.addEventListener('click', handleSubmitCheckout);
    }

    // Clear error styling on input focus
    [deliveryAddressInput, phoneNumberInput].forEach(input => {
      if (input) {
        input.addEventListener('focus', function() {
          this.style.borderColor = '';
          const errorEl = this.parentNode.querySelector('.form-error');
          if (errorEl) errorEl.remove();
        });
      }
    });

    // Prevent form submission with Enter key (except in textarea)
    if (checkoutForm) {
      checkoutForm.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target !== orderNotesInput) {
          e.preventDefault();
        }
      });
    }
  }

  /**
   * Initialize on DOM Ready
   */
  function init() {
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initEventListeners);
    } else {
      initEventListeners();
    }
  }

  // Public API for external cart interactions
  window.cartUI = {
    openCart,
    closeCart,
    showCheckoutForm,
    hideCheckoutForm
  };

  // Start initialization
  init();
})();
