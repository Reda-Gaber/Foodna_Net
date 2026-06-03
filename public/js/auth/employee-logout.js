/**
 * تسجيل خروج الموظفين (Dashboard / Kitchen / Cashier)
 */
(function () {
  'use strict';

  function clearAuthStorage() {
    const keys = [
      'authToken',
      'refreshToken',
      'user',
      'postAuthRedirect',
      'checkoutIntent',
      'pendingCart'
    ];
    keys.forEach((key) => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (_) {
        /* restricted storage */
      }
    });
    if (window.auth) {
      window.auth = { authenticated: false, user: null, initialized: false };
    }
  }

  async function confirmLogout() {
    if (typeof showConfirm === 'function') {
      const result = await showConfirm(
        'هل تريد تسجيل الخروج من الحساب؟',
        'تسجيل الخروج'
      );
      return result && result.isConfirmed;
    }
    return window.confirm('هل تريد تسجيل الخروج من الحساب؟');
  }

  async function employeeLogout() {
    const ok = await confirmLogout();
    if (!ok) return;

    clearAuthStorage();

    try {
      await fetch('/auth/logout', {
        method: 'GET',
        credentials: 'include'
      });
    } catch (_) {
      /* still redirect */
    }

    window.location.replace('/');
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-employee-logout]').forEach((btn) => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        employeeLogout();
      });
    });
  });

  window.employeeLogout = employeeLogout;
})();
