/**
 * Middleware موحد للمصادقة والتفويض
 * يدعم كل من Customer و Employee sessions
 */

/**
 * مساعد: استخراج userId من session بغض النظر عن طريقة الحفظ
 */
function getSessionUserId(session) {
  if (!session) return null;
  // Customer session: req.session.userId
  if (session.userId) return session.userId;
  // Employee session: req.session.user.id
  if (session.user && session.user.id) return session.user.id;
  return null;
}

/**
 * التحقق من أن المستخدم مسجل دخول
 * يدعم كلا من req.session.user (Employee) و req.session.userId (Customer)
 */
function authenticateUser(req, res, next) {
  if (getSessionUserId(req.session)) {
    return next();
  }

  if (req.path.startsWith('/api') || req.originalUrl.startsWith('/api')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'يجب تسجيل الدخول أولاً'
    });
  }

  return res.redirect('/auth/register');
}

/**
 * التحقق من أن المستخدم لديه دور معين
 * @param {...string} roles - الأدوار المسموحة
 */
function authorizeRole(...roles) {
  return (req, res, next) => {
    // دعم الأدوار من session.user.role أو session.role
    const userRole = req.session?.user?.role || req.session?.role;

    if (!userRole || !roles.includes(userRole)) {
      if (req.path.startsWith('/api') || req.originalUrl.startsWith('/api')) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'ليس لديك صلاحية للوصول إلى هذا المورد'
        });
      }
      return res.status(403).render('error', {
        message: 'ليس لديك صلاحية للوصول إلى هذه الصفحة'
      });
    }

    next();
  };
}

/**
 * التحقق من أن المستخدم هو Customer
 */
function requireCustomer(req, res, next) {
  // قبول userId مباشرة أو user.id في حالة Client
  const isCustomer = req.session?.userId ||
                     (req.session?.user && (req.session.user.role === 'Client' || !req.session.user.role));

  if (!isCustomer) {
    if (req.path.startsWith('/api') || req.originalUrl.startsWith('/api')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'يجب تسجيل الدخول كعميل'
      });
    }
    return res.redirect('/user/register');
  }
  next();
}

/**
 * التحقق من أن المستخدم هو Employee
 */
function requireEmployee(req, res, next) {
  if (!req.session?.user || !req.session.user.id) {
    if (req.path.startsWith('/api') || req.originalUrl.startsWith('/api')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'يجب تسجيل الدخول كموظف'
      });
    }
    // حفظ المسار الحالي في next عشان بعد login يرجع تاني
    const nextPath = encodeURIComponent(req.originalUrl || '/');
    return res.redirect(`/auth/login?next=${nextPath}`);
  }
  next();
}

module.exports = {
  authenticateUser,
  authorizeRole,
  requireCustomer,
  requireEmployee,
  getSessionUserId
};