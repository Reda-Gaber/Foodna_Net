/**
 * توحيد أدوار الموظفين ومسارات التوجيه بعد تسجيل الدخول
 */

function normalizeEmployeeRole(role) {
  if (role == null || role === '') return null;
  const lower = String(role).trim().toLowerCase();
  switch (lower) {
    case 'admin':
      return 'Admin';
    case 'cashier':
      return 'Cashier';
    case 'chef':
      return 'Chef';
    case 'kitchen':
      return 'Kitchen';
    case 'client':
      return 'Client';
    default:
      return String(role).trim();
  }
}

/**
 * @param {string} role
 * @param {string} [next] - مسار ?next= من الطلب (يُتجاهل إن كان صفحة الدخول)
 */
function getRedirectUrlForRole(role, next) {
  const normalized = normalizeEmployeeRole(role);

  if (next) {
    try {
      const decoded = decodeURIComponent(next);
      if (
        decoded &&
        decoded.startsWith('/') &&
        !decoded.startsWith('/auth/login') &&
        decoded !== '/login'
      ) {
        return decoded;
      }
    } catch (_) {
      /* ignore malformed next */
    }
  }

  switch (normalized) {
    case 'Admin':
      return '/admin/dashboard';
    case 'Cashier':
      return '/cashier';
    case 'Chef':
    case 'Kitchen':
      return '/kitchen';
    case 'Client':
      return '/';
    default:
      return '/';
  }
}

module.exports = {
  normalizeEmployeeRole,
  getRedirectUrlForRole
};
