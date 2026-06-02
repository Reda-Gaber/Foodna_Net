/**
 * Kitchen Model
 * عمليات الوصول إلى بيانات المطبخ
 */
const db = require('../../config/db');

class Kitchen {
  /**
   * الحصول على الطلبات غير المكتملة للمطبخ
   */
  static async fetchPendingOrders(limit = 50) {
    const [rows] = await db.query(
      `SELECT DISTINCT
           o.Order_ID,
           o.Total_Amount,
           o.Order_Status,
           o.Created_At,
           COALESCE(c.Customer_Name, 'عميل الكاشير') as Customer_Name
       FROM Orders o
       LEFT JOIN Customers c ON o.Customer_ID = c.Customer_Id
       LEFT JOIN Order_Items oi ON o.Order_ID = oi.Order_ID
       WHERE o.Order_Status IN ('Pending', 'Processing', 'Ready')
       ORDER BY o.Created_At ASC
       LIMIT ?`,
      [limit]
    );

    return rows;
  }

  /**
   * الحصول على تفاصيل العناصر لطلب معين
   */
  static async fetchOrderItems(orderId) {
    const [rows] = await db.query(
      `SELECT oi.*, p.Product_Name, p.Image
       FROM Order_Items oi
       JOIN Products p ON oi.Product_ID = p.Product_ID
       WHERE oi.Order_ID = ?`,
      [orderId]
    );

    return rows;
  }

  /**
   * تحديث حالة طلب المطبخ
   */
  static async updateOrderStatus(orderId, status) {
    return db.query(
      `UPDATE Orders SET Order_Status = ?, Updated_At = NOW() WHERE Order_ID = ?`,
      [status, orderId]
    );
  }
}

module.exports = Kitchen;
