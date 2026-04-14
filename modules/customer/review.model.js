/**
 * Review Model
 * إدارة التقييمات والمراجعات
 */

const db = require('../../config/db');

class Review {
  /**
   * إنشاء تقييم جديد
   */
  static async create(customerId, productId, rating, comment = null) {
    // التحقق من أن العميل قد طلب هذا المنتج
    const [orderCheck] = await db.query(
      `SELECT COUNT(*) as count FROM Order_Items oi
       JOIN Orders o ON oi.Order_ID = o.Order_ID
       WHERE o.Customer_ID = ? AND oi.Product_ID = ? AND o.Order_Status = 'Delivered'`,
      [customerId, productId]
    );

    if (orderCheck[0].count === 0) {
      throw new Error('يجب أن تكون قد طلبت هذا المنتج لتتمكن من تقييمه');
    }

    // التحقق من أن العميل لم يقيم هذا المنتج من قبل
    const [existing] = await db.query(
      'SELECT * FROM Reviews WHERE Customer_ID = ? AND Product_ID = ?',
      [customerId, productId]
    );

    if (existing.length > 0) {
      throw new Error('لقد قيمت هذا المنتج من قبل');
    }

    const [result] = await db.query(
      `INSERT INTO Reviews (Customer_ID, Product_ID, Rating, Comment, Created_At)
       VALUES (?, ?, ?, ?, NOW())`,
      [customerId, productId, rating, comment]
    );

    return result.insertId;
  }

  /**
   * الحصول على تقييمات منتج معين
   */
  static async getProductReviews(productId, limit = 20, offset = 0) {
    const [rows] = await db.query(
      `SELECT r.*, c.Customer_Name 
       FROM Reviews r
       JOIN Customers c ON r.Customer_ID = c.Customer_Id
       WHERE r.Product_ID = ? 
       ORDER BY r.Created_At DESC
       LIMIT ? OFFSET ?`,
      [productId, limit, offset]
    );
    return rows;
  }

  /**
   * الحصول على متوسط التقييم وعدد التقييمات
   */
  static async getAverageRating(productId) {
    const [rows] = await db.query(
      `SELECT AVG(Rating) as avg_rating, 
              COUNT(*) as total_reviews,
              COUNT(CASE WHEN Rating = 5 THEN 1 END) as five_star,
              COUNT(CASE WHEN Rating = 4 THEN 1 END) as four_star,
              COUNT(CASE WHEN Rating = 3 THEN 1 END) as three_star,
              COUNT(CASE WHEN Rating = 2 THEN 1 END) as two_star,
              COUNT(CASE WHEN Rating = 1 THEN 1 END) as one_star
       FROM Reviews 
       WHERE Product_ID = ?`,
      [productId]
    );
    return rows[0] || { avg_rating: 0, total_reviews: 0 };
  }

  /**
   * تحديث تقييم
   */
  static async update(reviewId, customerId, rating, comment = null) {
    const [result] = await db.query(
      `UPDATE Reviews 
       SET Rating = ?, Comment = ?, Updated_At = NOW()
       WHERE Review_ID = ? AND Customer_ID = ?`,
      [rating, comment, reviewId, customerId]
    );

    if (result.affectedRows === 0) {
      throw new Error('التقييم غير موجود أو ليس لك');
    }

    return result.affectedRows;
  }

  /**
   * حذف تقييم
   */
  static async delete(reviewId, customerId) {
    const [result] = await db.query(
      'DELETE FROM Reviews WHERE Review_ID = ? AND Customer_ID = ?',
      [reviewId, customerId]
    );

    if (result.affectedRows === 0) {
      throw new Error('التقييم غير موجود أو ليس لك');
    }

    return result.affectedRows;
  }

  /**
   * الحصول على تقييمات العميل
   */
  static async getCustomerReviews(customerId, limit = 20, offset = 0) {
    const [rows] = await db.query(
      `SELECT r.*, p.Product_Name, p.Image
       FROM Reviews r
       JOIN Products p ON r.Product_ID = p.Product_ID
       WHERE r.Customer_ID = ?
       ORDER BY r.Created_At DESC
       LIMIT ? OFFSET ?`,
      [customerId, limit, offset]
    );
    return rows;
  }
}

module.exports = Review;


