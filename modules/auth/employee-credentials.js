/**
 * نموذج بيانات اعتماد الموظفين
 * يستخدم متغيرات البيئة بدلاً من قاعدة البيانات
 * 
 * الفائدة: يمكن رفع المشروع على الـ Repository بدون الحاجة لإنشاء قاعدة بيانات
 */

require('dotenv').config();

/**
 * بيانات الموظفين المقبولة
 * هذه البيانات محملة من متغيرات البيئة (.env)
 */
const EMPLOYEE_CREDENTIALS = {
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@foodna.com',
    password: process.env.ADMIN_PASSWORD || '000000',
    role: 'Admin',
    name: 'مدير النظام',
    id: 1
  },
  chef: {
    email: process.env.CHEF_EMAIL || 'chef@foodna.com',
    password: process.env.CHEF_PASSWORD || '111111',
    role: 'Chef',
    name: 'الشيف',
    id: 2
  },
  cashier: {
    email: process.env.CASHIER_EMAIL || 'cashier@foodna.com',
    password: process.env.CASHIER_PASSWORD || '222222',
    role: 'Cashier',
    name: 'أمين الصندوق',
    id: 3
  }
};

/**
 * التحقق من بيانات تسجيل الدخول للموظفين
 * @param {string} email - البريد الإلكتروني
 * @param {string} password - كلمة المرور
 * @returns {object|null} - كائن الموظف أو null إذا فشل التحقق
 */
const verifyEmployeeCredentials = (email, password) => {
  for (const [key, employee] of Object.entries(EMPLOYEE_CREDENTIALS)) {
    if (employee.email === email && employee.password === password) {
      // إرجاع نسخة آمنة بدون كلمة المرور
      return {
        id: employee.id,
        email: employee.email,
        role: employee.role,
        name: employee.name
      };
    }
  }
  return null;
};

/**
 * التحقق من البريد الإلكتروني
 * @param {string} email - البريد الإلكتروني
 * @returns {object|null} - بيانات الموظف أو null
 */
const getEmployeeByEmail = (email) => {
  for (const [key, employee] of Object.entries(EMPLOYEE_CREDENTIALS)) {
    if (employee.email === email) {
      return {
        id: employee.id,
        email: employee.email,
        role: employee.role,
        name: employee.name
      };
    }
  }
  return null;
};

/**
 * الحصول على جميع بيانات الموظفين (بدون كلمات المرور)
 * مفيدة للاختبار
 */
const getAllEmployees = () => {
  return Object.values(EMPLOYEE_CREDENTIALS).map(emp => ({
    id: emp.id,
    email: emp.email,
    role: emp.role,
    name: emp.name
  }));
};

module.exports = {
  EMPLOYEE_CREDENTIALS,
  verifyEmployeeCredentials,
  getEmployeeByEmail,
  getAllEmployees
};
