/**
 * Global Authentication State Manager
 * Maintains global auth state and fires events on auth changes
 */

(function() {
  'use strict';

  // Initialize global auth object
  window.auth = {
    authenticated: false,
    user: null,
    initialized: false
  };

  /**
   * Check authentication status from backend
   */
  async function checkAuthStatus() {
    try {
      const response = await fetch('/auth/api/auth/check', { 
        credentials: 'include',
        method: 'GET'
      });
      const data = await response.json();

      if (data.success) {
        window.auth = {
          authenticated: data.authenticated || false,
          user: data.user || null,
          initialized: true
        };
      } else {
        window.auth.initialized = true;
      }

      // Fire auth change event
      window.dispatchEvent(new CustomEvent('auth.statusChanged', { 
        detail: window.auth 
      }));

      return window.auth;
    } catch (error) {
      console.error('Error checking auth status:', error);
      window.auth.initialized = true;
      return window.auth;
    }
  }

  /**
   * Helper to check if user is authenticated
   */
  window.isAuthenticated = function() {
    return window.auth.authenticated === true;
  };

  /**
   * Helper to get current user
   */
  window.getCurrentUser = function() {
    return window.auth.user;
  };

  /**
   * Helper to redirect to login with next parameter
   */
  window.redirectToLogin = function(currentPath) {
    const path = currentPath || (window.location.pathname + window.location.search);
    const next = encodeURIComponent(path);
    try {
      // preserve intended path and cart for after-auth flow
      localStorage.setItem('postAuthRedirect', path);
      const pending = localStorage.getItem('cart');
      if (pending) localStorage.setItem('pendingCart', pending);
      localStorage.setItem('checkoutIntent', 'true');
    } catch (e) {
      console.warn('Could not persist post-auth state', e && e.message ? e.message : e);
    }
    // send user to register page with next query param so server can honor it too
    window.location.href = '/register?next=' + next;
  };

  /**
   * Initialize auth on page load
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuthStatus);
  } else {
    checkAuthStatus();
  }

  // Expose check function globally
  window.checkAuthStatus = checkAuthStatus;
})();
