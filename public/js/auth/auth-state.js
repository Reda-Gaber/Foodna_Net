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
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      const contentType = response.headers.get('content-type') || '';
      let data = { authenticated: false };

      if (response.ok && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (e) {
          data = { authenticated: false };
        }
      }

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
   * Log out: clear auth state, storage, then redirect.
   * @param {string} [next] - Optional URL to redirect to after logout.
   */
  window.logout = function(next) {
    const target = next || '/user/register';

    // Clear global auth state
    window.auth = {
      authenticated: false,
      user: null,
      initialized: false
    };

    // Clear all auth-related storage
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('postAuthRedirect');
      localStorage.removeItem('checkoutIntent');
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('user');
    } catch (e) {
      // ignore storage errors in restricted contexts
    }

    // Request backend logout, then redirect
    try {
      fetch('/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    } finally {
      window.location.href = target;
    }
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

