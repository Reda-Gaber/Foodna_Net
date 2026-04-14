/**
 * Category Routes (Admin)
 * مسارات التصنيفات
 */

const express = require('express');
const categoryController = require('./category.controller');
const { requireEmployee, authorizeRole } = require('../../core/middlewares/authMiddleware');
const { validateName } = require('../../core/middlewares/validator');

const router = express.Router();

// الحصول على جميع التصنيفات - بدون تسجيل دخول
router.get('/categories', categoryController.getAllCategories);

// الحصول على تصنيف معين - بدون تسجيل دخول
router.get('/categories/:id', categoryController.getCategoryById);

// جميع المسارات التالية تتطلب تسجيل دخول كموظف
router.use(requireEmployee);

// إنشاء تصنيف جديد
router.post('/categories', validateName, categoryController.createCategory);

// تحديث تصنيف
router.put('/categories/:id', validateName, categoryController.updateCategory);

// حذف تصنيف
router.delete('/categories/:id', categoryController.deleteCategory);

module.exports = router;



