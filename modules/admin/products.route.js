// modules/admin/routes/product.route.js
const express = require('express');
const router = express.Router();
const ProductController = require('./products.controller');
const multer = require('multer');
const path = require('path');

// =====================================================
// Multer config
// استخدام memoryStorage بدل diskStorage عشان Vercel
// بيئة Vercel مش بتدعم الكتابة على الديسك
// =====================================================
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) return cb(null, true);
        cb(new Error('صور فقط!'));
    }
});

// =====================================================
// Auth Middleware - التحقق من تسجيل الدخول كأدمن
// =====================================================
function requireAdmin(req, res, next) {
    if (!req.session?.user) {
        return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول أولاً' });
    }
    if (req.session.user.role !== 'Admin') {
        return res.status(403).json({ success: false, message: 'ليس لديك صلاحية للقيام بهذه العملية' });
    }
    next();
}

// =====================================================
// Routes
// =====================================================

// إنشاء منتج مع صورة
router.post('/create', requireAdmin, upload.single('image'), ProductController.create);

// تعديل منتج مع صورة
router.post('/update', requireAdmin, upload.single('image'), ProductController.update);

// حذف منتج
router.delete('/delete/:id', requireAdmin, ProductController.delete);

// جلب كل المنتجات مع المخزون (عام - بدون auth)
router.get('/', ProductController.getAllProducts);

// جلب منتج بالـ ID مع المخزون (عام - بدون auth)
router.get('/:id', ProductController.getProductById);

module.exports = router;