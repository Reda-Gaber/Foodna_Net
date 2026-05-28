/**
 * Input Validation Middleware
 * يستخدم express-validator للتحقق من صحة البيانات المدخلة
 */

const { body, validationResult, param, query } = require('express-validator');

// Validation Result Handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.path.startsWith('/api')) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        errors: errors.array()
      });
    }
    // للصفحات العادية، يمكن إرجاع رسالة خطأ
    return res.status(400).render('error', {
      message: 'البيانات المدخلة غير صحيحة',
      errors: errors.array()
    });
  }
  next();
};

// Email Validation
const validateEmail = body('email')
  .isEmail()
  .withMessage('البريد الإلكتروني غير صحيح')
  .normalizeEmail();

// Password Validation
const validatePassword = body('password')
  .isLength({ min: 8 })
  .withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
  .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
  .withMessage('كلمة المرور يجب أن تحتوي على أحرف وأرقام');

// Name Validation
const validateName = body('name')
  .trim()
  .isLength({ min: 2, max: 100 })
  .withMessage('الاسم يجب أن يكون بين 2 و 100 حرف')
  .matches(/^[a-zA-Z\u0600-\u06FF\s]+$/)
  .withMessage('الاسم يجب أن يحتوي على أحرف فقط');

// Phone Validation
const validatePhone = body('phone')
  .optional()
  .isMobilePhone('ar-EG')
  .withMessage('رقم الهاتف غير صحيح');

// Product Validation
const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('اسم المنتج يجب أن يكون بين 2 و 255 حرف'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('السعر يجب أن يكون رقم موجب'),
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('الكمية يجب أن تكون رقم صحيح موجب'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('الفئة غير صحيحة'),
  handleValidationErrors
];

// Cart Item Validation
const validateCartItem = [
  body('productId')
    .isInt({ min: 1 })
    .withMessage('معرف المنتج غير صحيح'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('الكمية يجب أن تكون رقم صحيح أكبر من 0'),
  handleValidationErrors
];

// Order Validation
const validateOrder = [
  body('deliveryAddress')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('عنوان التوصيل يجب أن يكون بين 5 و 500 حرف'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('يجب أن يحتوي الطلب على منتج واحد على الأقل'),
  body('totalAmount')
    .isFloat({ min: 0 })
    .withMessage('المجموع يجب أن يكون قيمة موجبة'),
  handleValidationErrors
];

// Review Validation
const validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('التقييم يجب أن يكون بين 1 و 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('التعليق يجب ألا يتجاوز 1000 حرف'),
  handleValidationErrors
];

// ID Parameter Validation
const validateId = param('id')
  .isInt({ min: 1 })
  .withMessage('المعرف غير صحيح');

// Pagination Validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('رقم الصفحة يجب أن يكون رقم صحيح موجب'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('عدد العناصر يجب أن يكون بين 1 و 100'),
  handleValidationErrors
];

// Customer Registration Validation
const validateCustomerRegistration = [
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  handleValidationErrors
];

// Customer Login Validation
const validateCustomerLogin = [
  validateEmail,
  body('password')
    .notEmpty()
    .withMessage('كلمة المرور مطلوبة'),
  handleValidationErrors
];

module.exports = {
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  validateProduct,
  validateCartItem,
  validateOrder,
  validateReview,
  validateId,
  validatePagination,
  validateCustomerRegistration,
  validateCustomerLogin,
  handleValidationErrors
};


