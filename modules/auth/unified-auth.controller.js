/**
 * Unified Authentication Controller
 * معالج موحد لتسجيل الدخول لجميع الأدوار
 */
const db = require('../../config/db');
const bcrypt = require('bcrypt');
const Logger = require('../../core/utils/logger');
const {
  getSessionUserId,
  hasSessionAuth,
  ensureClientSessionIds,
  resolveCustomerId,
  resolveEmployeeId
} = require('../../core/middlewares/sessionHandler');
const {
  normalizeEmployeeRole,
  getRedirectUrlForRole
} = require('../../core/utils/roleRedirect');

async function restoreSessionUserId(req) {
  if (!req.session?.email) return null;
  if (req.session.userId && req.session.user?.id) {
    return req.session.userId;
  }

  const role = req.session.role || req.session.user?.role;
  if (!role) return null;

  if (role === 'Client') {
    return ensureClientSessionIds(req);
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM Employees WHERE Email = ? LIMIT 1',
      [req.session.email]
    );
    const resolvedId = resolveEmployeeId(rows[0]);
    if (!resolvedId) return null;

    req.session.userId = resolvedId;
    req.session.user = {
      ...(req.session.user || {}),
      id: resolvedId,
      email: req.session.user?.email || rows[0].Email,
      name: req.session.user?.name || rows[0].Employee_Name || '',
      role
    };

    await new Promise((resolve, reject) => {
      req.session.save((err) => (err ? reject(err) : resolve()));
    });
    return resolvedId;
  } catch (error) {
    console.error('[restoreSessionUserId] Failed to resolve session ID:', error);
    return null;
  }
}

/**
 * تسجيل الدخول الموحد
 * يدعم: Client, Admin, Kitchen, Cashier
 */
exports.unifiedLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'البريد الإلكتروني وكلمة المرور مطلوبان' 
      });
    }

    let user, tableName, idField, nameField, userRole;

    // البحث أولاً في جدول الموظفين
    const [employeeRows] = await db.query(
      `SELECT * FROM Employees WHERE Email = ?`,
      [email]
    );

    if (employeeRows.length > 0) {
      user = employeeRows[0];
      tableName = 'Employees';
      idField = 'Employee_ID';
      nameField = 'Employee_Name';
      userRole = normalizeEmployeeRole(user.Role) || user.Role;
    } else {
      // البحث في جدول العملاء
      const [customerRows] = await db.query(
        `SELECT * FROM Customers WHERE Email = ?`,
        [email]
      );

      if (customerRows.length > 0) {
        user = customerRows[0];
        tableName = 'Customers';
        idField = 'Customer_Id';
        nameField = 'Customer_Name';
        userRole = 'Client';
      } else {
        return res.status(401).json({ 
          success: false,
          message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' 
        });
      }
    }

    // التحقق من كلمة المرور
    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' 
      });
    }

    // حفظ Session - موحد لكل الأدوار
    // مهم: نحدد القيم دي قبل الـ save() عشان تتكتب في الـ database

    // تحديد الـ ID بناءً على الدور (نستخدم عدة احتمالات لاسم العمود)
    let resolvedId;
    if (userRole === 'Client') {
      resolvedId = resolveCustomerId(user);
    } else {
      resolvedId = resolveEmployeeId(user);
    }
    if (!resolvedId) {
      console.error('[unifiedLogin] Cannot resolve user ID! idField=', idField, 'user keys:', Object.keys(user));
    }

    const redirectUrl = getRedirectUrlForRole(userRole, req.body?.next);
    const sessionUser = {
      id: resolvedId,
      name: user[nameField],
      email: user.Email,
      role: userRole
    };

    Logger.audit('USER_LOGIN', user[idField], { email, role: userRole });

    const sendLoginSuccess = () => {
      req.session.save((err) => {
        if (err) {
          Logger.error('Session save error after login', err);
          return res.status(500).json({
            success: false,
            message: 'خطأ في حفظ الجلسة، حاول مرة أخرى'
          });
        }

        return res.json({
          success: true,
          message: 'تم تسجيل الدخول بنجاح',
          user: sessionUser,
          redirect: redirectUrl
        });
      });
    };

    // استبدال الجلسة القديمة بالكامل عند تسجيل دخول حساب جديد
    req.session.regenerate((regenErr) => {
      if (regenErr) {
        Logger.error('Session regenerate error after login', regenErr);
        return res.status(500).json({
          success: false,
          message: 'خطأ في إنشاء الجلسة، حاول مرة أخرى'
        });
      }

      req.session.userId = resolvedId;
      req.session.email = user.Email;
      req.session.role = userRole;
      req.session.authenticated = true;
      req.session.user = sessionUser;

      sendLoginSuccess();
    });

  } catch (error) {
    Logger.error('Unified login error', error);
    return res.status(500).json({ 
      success: false,
      message: 'حدث خطأ في الخادم' 
    });
  }
};

/**
 * تسجيل الخروج الموحد
 */
function destroySessionAndRespond(req, res) {
  req.session.destroy((err) => {
    if (err) {
      Logger.error('Logout error', err);
    }

    if (req.path.startsWith('/api') || req.get('Accept')?.includes('application/json')) {
      return res.json({
        success: true,
        message: 'تم تسجيل الخروج بنجاح',
        redirect: '/'
      });
    }

    res.redirect('/');
  });
}

/** GET — زر الخروج في واجهات الموظفين */
exports.unifiedLogoutGet = (req, res) => {
  destroySessionAndRespond(req, res);
};

/** POST — مع CSRF اختياري للتوافق */
exports.unifiedLogout = (req, res) => {
  const submittedToken = (req.body && req.body._csrf) || (req.query && req.query._csrf) || '';
  const validCsrf =
    submittedToken &&
    req.session?.csrfToken &&
    submittedToken === req.session.csrfToken;

  if (req.session?.csrfToken && !validCsrf) {
    if (req.path.startsWith('/api')) {
      return res.status(403).json({ success: false, message: 'طلب غير صالح' });
    }
    return res.status(403).render('error', { message: 'طلب غير صالح' });
  }

  destroySessionAndRespond(req, res);
};

/**
 * التحقق من حالة تسجيل الدخول
 */
exports.checkAuth = async (req, res) => {
  try {
    // express-session يحمّل الجلسة تلقائياً مع كل طلب — لا حاجة لـ reload هنا
    const authOk = hasSessionAuth(req);

    if (!authOk) {
      return res.json({
        success: true,
        authenticated: false,
        isClient: false
      });
    }

    const role = req.session.user?.role || req.session.role || 'Client';
    if (role === 'Client') {
      await ensureClientSessionIds(req);
    } else if (!req.session.userId && !req.session.user?.id) {
      await restoreSessionUserId(req);
    }

    const user = {
      ...req.session.user,
      id: req.session.user?.id || req.session.userId,
      name: req.session.user?.name || req.session.name || '',
      email: req.session.user?.email || req.session.email || '',
      role
    };

    const isClient = user.role === 'Client';
    const forCustomerUI = req.query.audience === 'customer';

    if (forCustomerUI) {
      return res.json({
        success: true,
        authenticated: isClient,
        isClient,
        user: isClient ? user : null
      });
    }

    return res.json({
      success: true,
      authenticated: true,
      isClient,
      user
    });
  } catch (err) {
    console.error('[checkAuth] Error:', err);
    return res.json({
      success: false,
      authenticated: false,
      message: 'خطأ في التحقق من حالة المستخدم'
    });
  }
};