/**
 * Unified Authentication Controller
 * معالج موحد لتسجيل الدخول لجميع الأدوار
 */
const db = require('../../config/db');
const bcrypt = require('bcrypt');
const Logger = require('../../core/utils/logger');

/**
 * تسجيل الدخول الموحد
 * يدعم: Client, Admin, Kitchen, Cashier
 */
exports.unifiedLogin = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'البريد الإلكتروني وكلمة المرور مطلوبان' 
      });
    }

    // تحديد الجدول حسب الدور
    let tableName, idField, nameField, roleField;
    
    if (role === 'Client' || !role) {
      // تسجيل دخول عميل
      tableName = 'Customers';
      idField = 'Customer_Id';
      nameField = 'Customer_Name';
      roleField = 'Client';
    } else {
      // تسجيل دخول موظف (Admin, Kitchen, Cashier)
      tableName = 'Employees';
      idField = 'Employee_ID';
      nameField = 'Employee_Name';
      roleField = 'Role';
    }

    // البحث عن المستخدم
    const [rows] = await db.query(
      `SELECT * FROM ${tableName} WHERE Email = ?`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' 
      });
    }

    const user = rows[0];

    // التحقق من كلمة المرور
    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' 
      });
    }

    // التحقق من الدور إذا كان محدداً
    if (role && role !== 'Client') {
      const userRole = tableName === 'Employees' ? user.Role : 'Client';
      if (userRole !== role) {
        return res.status(403).json({ 
          success: false,
          message: 'ليس لديك صلاحية للوصول بهذا الدور' 
        });
      }
    }

    // حفظ Session
    if (tableName === 'Customers') {
      req.session.userId = user[idField];
      req.session.email = user.Email;
      req.session.role = 'Client';
    } else {
      req.session.user = {
        id: user[idField],
        name: user[nameField],
        role: user[roleField]
      };
      req.session.role = user[roleField];
    }

    Logger.audit('USER_LOGIN', user[idField], { 
      email, 
      role: tableName === 'Customers' ? 'Client' : user[roleField] 
    });

    // إرجاع JSON response دائماً (سيتم التعامل معه في Frontend)
    const userRole = tableName === 'Customers' ? 'Client' : user[roleField];
    
    return res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      user: {
        id: user[idField],
        name: user[nameField],
        email: user.Email,
        role: userRole
      },
      redirect: (() => {
        switch (userRole) {
          case 'Admin':
            return '/admin/dashboard';
          case 'Cashier':
            return '/cashier';
          case 'Chef':
          case 'Kitchen':
            return '/kitchen';
          case 'Client':
          default:
            return '/';
        }
      })()
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
  const isAuthenticated = !!(req.session.user || req.session.userId);
  
  if (isAuthenticated) {
    const user = req.session.user || {
      id: req.session.userId,
      email: req.session.email,
      role: req.session.role || 'Client'
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

