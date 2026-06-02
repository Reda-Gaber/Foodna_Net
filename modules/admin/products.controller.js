/**
 * Product Controller (Admin)
 * معالجة منطق المنتجات - محدّث للعمل مع Vercel (memoryStorage)
 */
const Product = require('./products.model');
const ApiResponse = require('../../core/utils/response');
const Logger = require('../../core/utils/logger');
const cloudinaryService = require('../../config/cloudinary');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

function isCloudinaryUrl(value) {
    return typeof value === 'string' && value.includes('res.cloudinary.com');
}

async function deleteImageFile(reference) {
    if (!reference) return;

    if (isCloudinaryUrl(reference)) {
        await cloudinaryService.deleteResource(reference);
        return;
    }

    try {
        const filename = path.basename(reference);
        const isVercel = !!process.env.VERCEL;
        const filePath = isVercel
            ? path.join('/tmp', filename)
            : path.join(__dirname, '../../public/images/products/', filename);
        await unlinkAsync(filePath);
    } catch (err) {
        Logger.warn('Failed to delete image file', err);
    }
}

class ProductController {
    /**
     * إنشاء منتج جديد
     */
    static async create(req, res) {
        let imageUrl = null;
        try {
            Logger.info('📨 Received create product request', {
                body: req.body,
                hasFile: !!req.file
            });

            // رفع الصورة إلى Cloudinary إن كانت موجودة
            if (req.file && req.file.buffer) {
                const uploadResult = await cloudinaryService.uploadBuffer(req.file.buffer, {
                    folder: 'foodna/products'
                });
                imageUrl = uploadResult.secure_url;
            }

            const parsedQuantity = (req.body.quantity !== undefined && req.body.quantity !== '') ? parseInt(req.body.quantity) : null;
            const parsedPrice    = (req.body.price    !== undefined && req.body.price    !== '') ? parseFloat(req.body.price)    : null;
            const parsedDiscount = (req.body.discount !== undefined && req.body.discount !== '') ? parseFloat(req.body.discount) : null;

            const data = {
                name:        req.body.name,
                category:    req.body.category,
                category_id: req.body.category_id,
                description: req.body.description || '',
                quantity:    Number.isNaN(parsedQuantity) ? null : parsedQuantity,
                price:       Number.isNaN(parsedPrice)    ? null : parsedPrice,
                discount:    Number.isNaN(parsedDiscount) ? 0    : parsedDiscount,
                supplier_id: req.body.supplier_id || null
            };

            Logger.info('💾 Data to save:', data);

            const result = await Product.create(data, imageUrl);
            Logger.audit('PRODUCT_CREATED', req.session.user?.id, { productId: result.productId });

            return ApiResponse.success(res, {
                productId:   result.productId,
                inventoryId: result.inventoryId
            }, 'تم إضافة المنتج بنجاح', 201);

        } catch (error) {
            Logger.error('Create product error', error);
            // حذف الصورة المرفوعة في حالة الخطأ
            if (imageUrl) await deleteImageFile(imageUrl);
            return ApiResponse.error(res, error.message || 'فشل في إضافة المنتج', 500);
        }
    }

    /**
     * تحديث منتج
     */
    static async update(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (!id) {
                return ApiResponse.validationError(res, null, 'معرف المنتج مطلوب');
            }

            Logger.info('📨 Received update product request', {
                id,
                body: req.body,
                hasFile: !!req.file
            });

            const product = await Product.findById(id);
            if (!product) {
                return ApiResponse.notFound(res, 'المنتج غير موجود');
            }

            let imageUrl = product.Image;

            if (req.file && req.file.buffer) {
                const uploadResult = await cloudinaryService.uploadBuffer(req.file.buffer, {
                    folder: 'foodna/products'
                });
                const newImageUrl = uploadResult.secure_url;
                if (product.Image && product.Image !== newImageUrl) {
                    await deleteImageFile(product.Image);
                }
                imageUrl = newImageUrl;
            }

            const parsedQuantity = (req.body.quantity !== undefined && req.body.quantity !== '') ? parseInt(req.body.quantity)     : undefined;
            const parsedPrice    = (req.body.price    !== undefined && req.body.price    !== '') ? parseFloat(req.body.price)      : undefined;
            const parsedDiscount = (req.body.discount !== undefined && req.body.discount !== '') ? parseFloat(req.body.discount)   : undefined;

            const data = {
                name:        (req.body.name        !== undefined && req.body.name        !== '') ? req.body.name        : product.Product_Name,
                category:    req.body.category,
                category_id: req.body.category_id,
                description: (req.body.description !== undefined)                               ? req.body.description : product.Description,
                quantity:    parsedQuantity === undefined ? (product.Quantity_Available ?? null) : (Number.isNaN(parsedQuantity) ? null : parsedQuantity),
                price:       parsedPrice    === undefined ? (product.Price              ?? null) : (Number.isNaN(parsedPrice)    ? null : parsedPrice),
                discount:    parsedDiscount === undefined ? (product.Discount           ?? 0)   : (Number.isNaN(parsedDiscount) ? 0    : parsedDiscount),
                supplier_id: (req.body.supplier_id !== undefined) ? (req.body.supplier_id || null) : (product.Supplier_ID || null)
            };

            const result = await Product.update(id, data, imageUrl);
            Logger.audit('PRODUCT_UPDATED', req.session.user?.id, { productId: id });

            return ApiResponse.success(res, { productId: result.productId }, 'تم تحديث المنتج بنجاح');

        } catch (error) {
            Logger.error('Update product error', error);
            return ApiResponse.error(res, error.message || 'فشل في تحديث المنتج', 500);
        }
    }

    /**
     * حذف منتج
     */
    static async delete(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (!id) {
                return ApiResponse.validationError(res, null, 'معرف المنتج مطلوب');
            }

            const product = await Product.findById(id);
            if (!product) {
                return ApiResponse.notFound(res, 'المنتج غير موجود');
            }

            // حذف الصورة
            if (product.Image) await deleteImageFile(product.Image);

            await Product.deleteById(id);
            Logger.audit('PRODUCT_DELETED', req.session.user?.id, { productId: id });

            return ApiResponse.success(res, { productId: id }, 'تم حذف المنتج بنجاح');

        } catch (error) {
            Logger.error('Delete product error', error);
            return ApiResponse.error(res, error.message || 'فشل في حذف المنتج', 500);
        }
    }

    /**
     * الحصول على منتج بواسطة ID
     */
    static async getProductById(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (!id) {
                return ApiResponse.validationError(res, null, 'معرف المنتج مطلوب');
            }

            const product = await Product.findById(id);
            if (!product) {
                return ApiResponse.notFound(res, 'المنتج غير موجود');
            }

            return ApiResponse.success(res, product, 'تم جلب المنتج بنجاح');

        } catch (error) {
            Logger.error('Get product error', error);
            return ApiResponse.error(res, error.message || 'فشل في جلب المنتج', 500);
        }
    }

    /**
     * الحصول على جميع المنتجات
     */
    static async getAllProducts(req, res) {
        try {
            const page   = parseInt(req.query.page)  || 1;
            const limit  = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;

            const products = await Product.findAll(limit, offset);
            const total    = await Product.count();

            return ApiResponse.success(res, {
                products,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }, 'تم جلب المنتجات بنجاح');

        } catch (error) {
            Logger.error('Get all products error', error);
            return ApiResponse.error(res, error.message || 'فشل في جلب المنتجات', 500);
        }
    }
}

module.exports = ProductController;