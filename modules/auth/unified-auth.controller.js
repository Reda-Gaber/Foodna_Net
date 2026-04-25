/**
 * Unified Authentication Controller
 * معالج موحد لتسجيل الدخول لجميع الأدوار
 */
const db = require('../../config/db');
const bcrypt = require('bcrypt');
const Logger = require('../../core/utils/logger');
const { getSessionUserId } = require('../../core/middlewares/sessionHandler');

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
      userRole = user.Role;
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
    req.session.userId        = user[idField];
    req.session.email         = user.Email;
    req.session.role          = userRole;
    req.session.authenticated = true;
    req.session.user = {
      id:    user[idField],
      name:  user[nameField],
      email: user.Email,
      role:  userRole
    };

    const redirectUrl = (() => {
      switch (userRole) {
        case 'Admin':    return '/admin/dashboard';
        case 'Cashier':  return '/cashier';
        case 'Chef':
        case 'Kitchen':  return '/kitchen';
        case 'Client':
        default:         return req.body?.next ? decodeURIComponent(req.body.next) : '/';
      }
    })();

    Logger.audit('USER_LOGIN', user[idField], { email, role: userRole });

    // ==========================================
    // مهم جداً على Vercel:
    // 1. نستخدم session.save() صراحة قبل ما نرد
    // 2. نضمن إن الـ cookie بيتبعته مع الـ response
    // 3. نستخدم res.writeHead() قبل session.save() عشان الـ cookie يتحط
    // ==========================================

    // نضمن إن الـ session هتتحفظ قبل الـ response
    req.session.save((err) => {
      if (err) {
        Logger.error('Session save error after login', err);
        return res.status(500).json({
          success: false,
          message: 'خطأ في حفظ الجلسة، حاول مرة أخرى'
        });
      }

      // نتأكد من إن الـ cookie اتحط في الـ response headers
      const setCookieHeader = res.getHeader('Set-Cookie');
      if (setCookieHeader) {
        Logger.info('Session cookie set:', {
          path: req.path,
          cookieCount: Array.isArray(setCookieHeader) ? setCookieHeader.length : 1
        });
      }

      return res.json({
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        user: {
          id:    user[idField],
          name:  user[nameField],
          email: user.Email,
          role:  userRole
        },
        redirect: redirectUrl
      });
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
exports.unifiedLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      Logger.error('Logout error', err);
    }
    
    if (req.path.startsWith('/api')) {
      return res.json({
        success: true,
        message: 'تم تسجيل الخروج بنجاح'
      });
    }
    
    res.redirect('/login');
  });
};

/**
 * التحقق من حالة تسجيل الدخول
 */
exports.checkAuth = (req, res) => {
  // Debug: log session info
  console.log('[checkAuth] Session ID:', req.sessionID);
  console.log('[checkAuth] Session userId:', req.session.userId);
  console.log('[checkAuth] Session user:', req.session.user);
  console.log('[checkAuth] Session authenticated:', req.session.authenticated);
  
  // التحقق من أي من الطرق الممكنة لتخزين الـ session
  const isAuthenticated = !!(
    req.session.user ||
    req.session.userId ||
    req.session.authenticated
  );
  
  if (isAuthenticated) {
    const user = req.session.user || {
      id:    req.session.userId,
      name:  req.session.name || '',
      email: req.session.email || '',
      role:  req.session.role || 'Client'
    };
    
    return res.json({
      success: true,
      authenticated: true,
      user
    });
  }
  
  return res.json({
    success: true,
    authenticated: false
  });
};