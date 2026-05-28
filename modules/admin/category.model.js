/**
 * Category Model
 * إدارة التصنيفات
 */

const db = require('../../config/db');

class Category {
  /**
   * إنشاء تصنيف جديد
   */
  static async create(name, description = null) {
    const [result] = await db.query(
      `INSERT INTO Categories (Category_Name, Description)
       VALUES (?, ?)`,
      [name, description]
    );
    return result.insertId;
  }

  /**
   * الحصول على جميع التصنيفات
   */
  static async getAll() {
    const [rows] = await db.query(
      `SELECT c.*, COUNT(p.Product_ID) as product_count
       FROM Categories c
       LEFT JOIN Products p ON c.Category_ID = p.Category_ID
       GROUP BY c.Category_ID
       ORDER BY c.Category_Name`
    );
    return rows;
  }

  /**
   * الحصول على تصنيف بواسطة ID
   */
  static async findById(id) {
    const [rows] = await db.query(
      'SELECT * FROM Categories WHERE Category_ID = ?',
      [id]
    );
    return rows[0] || null;
  }

  /**
   * تحديث تصنيف
   */
  static async update(id, name, description = null) {
    const [result] = await db.query(
      `UPDATE Categories 
       SET Category_Name = ?, Description = ?
       WHERE Category_ID = ?`,
      [name, description, id]
    );
    return result.affectedRows;
  }

  /**
   * حذف تصنيف
   */
  static async delete(id) {
    // التحقق من وجود منتجات في هذا التصنيف
    const [products] = await db.query(
      'SELECT COUNT(*) as count FROM Products WHERE Category_ID = ?',
      [id]
    );

    if (products[0].count > 0) {
      throw new Error('لا يمكن حذف التصنيف لأنه يحتوي على منتجات');
    }

    const [result] = await db.query(
      'DELETE FROM Categories WHERE Category_ID = ?',
      [id]
    );
    return result.affectedRows;
  }

  /**
   * الحصول على المنتجات حسب التصنيف
   */
  static async getProductsByCategory(categoryId, limit = 20, offset = 0) {
    const [rows] = await db.query(
      `SELECT p.*, i.Quantity_Available
       FROM Products p
       LEFT JOIN Products_Inventory pi ON p.Product_ID = pi.Product_ID
       LEFT JOIN Inventory i ON pi.Inventory_ID = i.Inventory_ID
       WHERE p.Category_ID = ?
       LIMIT ? OFFSET ?`,
      [categoryId, limit, offset]
    );
    return rows;
  }
}

module.exports = Category;



