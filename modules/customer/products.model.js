const db = require("../../config/db");

/**
 * الحصول على جميع المنتجات مع pagination
 */
const getAllProducts = async (limit = 20, offset = 0) => {
    // التأكد من أن القيم أرقام صحيحة
    const limitNum = parseInt(limit) || 20;
    const offsetNum = parseInt(offset) || 0;
    
    try {
        // استعلام بسيط يستخدم الأعمدة الموجودة فقط
        const query = `SELECT 
                           p.Product_ID,
                           p.Product_Name,
                           p.Category,
                           p.Description,
                           p.Image,
                           p.Quantity,
                           p.Price,
                           p.Discount,
                           p.Supplier_ID,
                           p.Category_ID,
                           COALESCE(
                               (SELECT AVG(r.Rating) 
                                FROM Reviews r 
                                WHERE r.Product_ID = p.Product_ID), 
                               0
                           ) as average_rating,
                           COALESCE(
                               (SELECT COUNT(r.Review_ID) 
                                FROM Reviews r 
                                WHERE r.Product_ID = p.Product_ID), 
                               0
                           ) as review_count
                       FROM Products p
                       ORDER BY p.Product_ID
                       LIMIT ${limitNum} OFFSET ${offsetNum}`;
        
        const [rows] = await db.query(query);
        return rows;
    } catch (error) {
        // إذا فشل - حاول بدون التقييمات
        try {
            const simpleQuery = `SELECT * FROM Products 
                                LIMIT ${limitNum} OFFSET ${offsetNum}`;
            const [rows] = await db.query(simpleQuery);
            return rows;
        } catch (err) {
            console.error('خطأ في جلب المنتجات:', err);
            return [];
        }
    }
};

/**
 * الحصول على عدد المنتجات الإجمالي
 */
const getProductsCount = async () => {
    const query = "SELECT COUNT(*) as total FROM Products";
    const [rows] = await db.query(query);
    return rows[0]?.total || 0;
};

/**
 * الحصول على منتج بواسطة ID
 */
const getProductById = async (id) => {
    const idNum = parseInt(id);
    if (isNaN(idNum)) {
        throw new Error('معرف المنتج غير صحيح');
    }
    
    try {
        const query = `SELECT 
                           p.Product_ID,
                           p.Product_Name,
                           p.Category,
                           p.Description,
                           p.Image,
                           p.Quantity,
                           p.Price,
                           p.Discount,
                           p.Supplier_ID,
                           p.Category_ID,
                           COALESCE(
                               (SELECT AVG(r.Rating) 
                                FROM Reviews r 
                                WHERE r.Product_ID = p.Product_ID), 
                               0
                           ) as average_rating,
                           COALESCE(
                               (SELECT COUNT(r.Review_ID) 
                                FROM Reviews r 
                                WHERE r.Product_ID = p.Product_ID), 
                               0
                           ) as review_count
                       FROM Products p
                       WHERE p.Product_ID = ?`;
        const [rows] = await db.query(query, [idNum]);
        return rows[0] || null;
    } catch (error) {
        // إذا فشل - حاول بدون التقييمات
        try {
            const simpleQuery = `SELECT * FROM Products WHERE Product_ID = ?`;
            const [rows] = await db.query(simpleQuery, [idNum]);
            return rows[0] || null;
        } catch (err) {
            console.error('خطأ في جلب المنتج:', err);
            return null;
        }
    }
};

/**
 * البحث عن المنتجات
 */
const searchProducts = async (searchTerm, limit = 20, offset = 0) => {
    const limitNum = parseInt(limit) || 20;
    const offsetNum = parseInt(offset) || 0;
    const searchPattern = `%${searchTerm}%`;
    
    try {
        const query = `SELECT * FROM Products 
                       WHERE Product_Name LIKE ? OR Description LIKE ?
                       LIMIT ${limitNum} OFFSET ${offsetNum}`;
        const [rows] = await db.query(query, [searchPattern, searchPattern]);
        return rows;
    } catch (error) {
        console.error('خطأ في البحث عن المنتجات:', error);
        return [];
    }
};

/**
 * الحصول على المنتجات حسب الفئة
 */
const getProductsByCategory = async (category, limit = 20, offset = 0) => {
    const limitNum = parseInt(limit) || 20;
    const offsetNum = parseInt(offset) || 0;
    
    try {
        const query = `SELECT * FROM Products 
                       WHERE Category = ?
                       LIMIT ${limitNum} OFFSET ${offsetNum}`;
        const [rows] = await db.query(query, [category]);
        return rows;
    } catch (error) {
        console.error('خطأ في جلب المنتجات حسب الفئة:', error);
        return [];
    }
};

/**
 * الحصول على المنتجات التي عليها خصم (Discount > 0)
 */
const getDiscountedProducts = async (limit = 20, offset = 0) => {
    const limitNum = parseInt(limit) || 20;
    const offsetNum = parseInt(offset) || 0;

    try {
        const query = `SELECT * FROM Products 
                       WHERE IFNULL(Discount, 0) > 0
                       ORDER BY Product_ID
                       LIMIT ${limitNum} OFFSET ${offsetNum}`;

        const [rows] = await db.query(query);
        return rows;
    } catch (error) {
        console.error('خطأ في جلب المنتجات المخفضة:', error);
        return [];
    }
};

module.exports = { 
    getAllProducts, 
    getProductsCount,
    getProductById,
    searchProducts,
    getProductsByCategory
    , getDiscountedProducts
};