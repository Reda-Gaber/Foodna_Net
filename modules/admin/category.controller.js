/**
 * Category Controller
 * معالجة منطق التصنيفات
 */

const Category = require('./category.model');
const ApiResponse = require('../../core/utils/response');
const Logger = require('../../core/utils/logger');

/**
 * إنشاء تصنيف جديد
 */
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return ApiResponse.validationError(res, null, 'اسم التصنيف مطلوب');
    }

    const categoryId = await Category.create(name, description);
    Logger.audit('CATEGORY_CREATED', req.session.user?.id, { categoryId, name });

    return ApiResponse.success(res, { categoryId }, 'تم إنشاء التصنيف بنجاح', 201);
  } catch (error) {
    Logger.error('Create category error', error);
    return ApiResponse.error(res, error.message || 'فشل في إنشاء التصنيف', 500);
  }
};

/**
 * الحصول على جميع التصنيفات
 */
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.getAll();
    return ApiResponse.success(res, categories, 'تم جلب التصنيفات بنجاح');
  } catch (error) {
    Logger.error('Get categories error', error);
    return ApiResponse.error(res, 'فشل في جلب التصنيفات', 500);
  }
};

/**
 * الحصول على تصنيف معين
 */
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return ApiResponse.notFound(res, 'التصنيف غير موجود');
    }

    return ApiResponse.success(res, category, 'تم جلب التصنيف بنجاح');
  } catch (error) {
    Logger.error('Get category error', error);
    return ApiResponse.error(res, 'فشل في جلب التصنيف', 500);
  }
};

/**
 * تحديث تصنيف
 */
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return ApiResponse.validationError(res, null, 'اسم التصنيف مطلوب');
    }

    const affectedRows = await Category.update(id, name, description);

    if (affectedRows === 0) {
      return ApiResponse.notFound(res, 'التصنيف غير موجود');
    }

    Logger.audit('CATEGORY_UPDATED', req.session.user?.id, { categoryId: id });
    return ApiResponse.success(res, null, 'تم تحديث التصنيف بنجاح');
  } catch (error) {
    Logger.error('Update category error', error);
    return ApiResponse.error(res, error.message || 'فشل في تحديث التصنيف', 500);
  }
};

/**
 * حذف تصنيف
 */
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await Category.delete(id);
    Logger.audit('CATEGORY_DELETED', req.session.user?.id, { categoryId: id });

    return ApiResponse.success(res, null, 'تم حذف التصنيف بنجاح');
  } catch (error) {
    Logger.error('Delete category error', error);
    return ApiResponse.error(res, error.message || 'فشل في حذف التصنيف', 400);
  }
};



