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

function getSessionRole(session) {
  if (!session) return null;
  return session.user?.role || session.role || null;
}

/** جلسة عميل (Client) فقط — ليس موظفاً */
function isClientSession(session) {
  if (!session) return false;
  const role = getSessionRole(session);
  if (role !== 'Client') return false;
  return !!(session.userId || session.user?.id);
}

/**
 * التحقق من أن المستخدم مسجل دخول
 * يدعم كلا من req.session.user (Employee) و req.session.userId (Customer)
 */
function authenticateUser(req, res, next) {
  if (
    getSessionUserId(req.session) ||
    (req.session?.user && Object.keys(req.session.user).length > 0)
  ) {
    return next();
  }

  if (req.path.startsWith('/api') || req.originalUrl.startsWith('/api')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'يجب تسجيل الدخول أولاً'
    });
  }

  return res.redirect('/user/register');
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
async function requireClient(req, res, next) {
  const { isAuthenticated, ensureClientSessionIds } = require('./sessionHandler');
  const auth = await isAuthenticated(req);
  if (auth) await ensureClientSessionIds(req);
  const isApi = req.path.startsWith('/api') || req.originalUrl.startsWith('/api');

  if (!auth || !isClientSession(req.session)) {
    if (isApi) {
      const nextUrl = encodeURIComponent(req.originalUrl || '/');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'يجب تسجيل الدخول كعميل',
        redirect: '/user/register?next=' + nextUrl
      });
    }
    const nextParam = req.originalUrl && req.originalUrl !== '/user/register'
      ? '?next=' + encodeURIComponent(req.originalUrl)
      : '';
    return res.redirect('/user/register' + nextParam);
  }
  next();
}

/** @deprecated استخدم requireClient — للتوافق مع الاستدعاءات القديمة */
async function requireCustomer(req, res, next) {
  return requireClient(req, res, next);
}

/**
 * التحقق من أن المستخدم هو Employee
 */
function requireEmployee(req, res, next) {
  console.log('🔐 Checking employee authentication...');
  console.log('Session user:', req.session?.user);
  
  if (!req.session?.user || !req.session.user.id) {
    console.warn('⚠️ No employee session found');
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
  
  console.log('✅ Employee authenticated:', req.session.user.id);
  next();
}

function requireAuth(req, res, next) {
  return requireClient(req, res, next);
}

async function requireApiLogin(req, res, next) {
  try {
    const { isAuthenticated } = require('./sessionHandler');
    const authOk = await isAuthenticated(req);
    if (!authOk) {
      const nextUrl = encodeURIComponent(req.originalUrl || '/');
      const isAdminApi = (req.originalUrl || req.path || '').startsWith('/admin');
      return res.status(401).json({
        success: false,
        message: 'يجب تسجيل الدخول أولاً',
        redirect: isAdminApi
          ? '/auth/login?next=' + nextUrl
          : '/user/register?next=' + nextUrl
      });
    }
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول أولاً' });
  }
}

/** حماية API خاصة بالعميل (سلة، طلبات، إلخ) */
async function requireClientApiLogin(req, res, next) {
  try {
    const { isAuthenticated } = require('./sessionHandler');
    const authOk = await isAuthenticated(req);
    if (!authOk || !isClientSession(req.session)) {
      const nextUrl = encodeURIComponent(req.originalUrl || '/');
      return res.status(401).json({
        success: false,
        message: 'يجب تسجيل الدخول أولاً',
        redirect: '/user/register?next=' + nextUrl
      });
    }
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول أولاً' });
  }
}

module.exports = {
  authenticateUser,
  authorizeRole,
  requireCustomer,
  requireClient,
  requireEmployee,
  requireAuth,
  getSessionUserId,
  getSessionRole,
  isClientSession,
  requireApiLogin,
  requireClientApiLogin
};