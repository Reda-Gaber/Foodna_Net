/**
 * Products Controller (Customer)
 * معالجة منطق المنتجات للعملاء
 */
const product = require("./products.model");
const ApiResponse = require('../../core/utils/response');
const Logger = require('../../core/utils/logger');

const getProducts = async (req, res) => {
    try {
        // دعم البحث
        if (req.query.search) {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
            const offset = (page - 1) * limit;
            const products = await product.searchProducts(req.query.search, limit, offset);
            return res.json(products);
        }

        // دعم التصفية حسب الفئة (باستخدام Category_ID)
        if (req.query.category_id) {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
            const offset = (page - 1) * limit;
            const products = await product.getProductsByCategory(req.query.category_id, limit, offset);
            return res.json(products);
        }

        // الحصول على جميع المنتجات
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, Math.min(1000, parseInt(req.query.limit) || 100));
        const offset = (page - 1) * limit;

            // دعم جلب المنتجات المخفضة فقط (صفحة العروض)
            if (req.query.discounted && String(req.query.discounted) === '1') {
                const products = await product.getDiscountedProducts(limit, offset);
                return res.json(products);
            }

            const products = await product.getAllProducts(limit, offset);
        const normalized = products.map(p => ({
            ...p,
            Image: p.Image || null
        }));

        // إرجاع البيانات بالشكل المتوقع من الواجهة الأمامية (مصفوفة مباشرة)
        // للتوافق مع الكود القديم
        return res.json(normalized);
    } catch (error) {
        Logger.error('Get products error', error);
        // إرجاع مصفوفة فارغة في حالة الخطأ للتوافق مع الواجهة الأمامية
        return res.json([]);
    }
}

module.exports = { getProducts }