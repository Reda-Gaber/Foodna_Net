// modules/admin/routes/product.route.js
const express = require('express');
const router = express.Router();
const ProductController = require('./products.controller'); // تأكد من المسار
const multer = require('multer');
const path = require('path');

// Multer config للصور
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/products/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
        cb(null, filename);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) return cb(null, true);
        cb(new Error('صور فقط!'));
    }
});

// Routes

// إنشاء منتج مع صورة
router.post('/create', upload.single('image'), ProductController.create);

// تعديل منتج مع صورة
router.post('/update', upload.single('image'), ProductController.update);

// حذف منتج
router.delete('/delete/:id', ProductController.delete);

// جلب كل المنتجات مع المخزون
router.get('/', ProductController.getAllProducts);

// جلب منتج بالـ ID مع المخزون
router.get('/:id', ProductController.getProductById);

module.exports = router;
