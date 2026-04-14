/**
 * Order Model
 * إدارة الطلبات في قاعدة البيانات
 */

const db = require('../../config/db');

class Order {
  /**
   * إنشاء طلب جديد
   */
  static async create(customerId, cartItems, totalAmount, deliveryAddress, paymentMethod = 'cash') {
    const connection = await db.getConnection();
    try {
      console.log('[ORDER-MODEL] Starting transaction...');
      await connection.beginTransaction();
      console.log('[ORDER-MODEL] ✓ Transaction started');
      
      // إنشاء الطلب
      console.log('[ORDER-MODEL] Inserting order with customerId:', customerId, 'totalAmount:', totalAmount);
      const [orderResult] = await connection.query(
        `INSERT INTO Orders (Customer_ID, Total_Amount, Order_Status, Delivery_Address, Payment_Method, Created_At)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [customerId, totalAmount, 'Pending', deliveryAddress, paymentMethod]
      );
      
      const orderId = orderResult.insertId;
      console.log('[ORDER-MODEL] ✓ Order inserted with ID:', orderId);
      
      // إضافة تفاصيل الطلب
      for (const item of cartItems) {
        console.log('[ORDER-MODEL] Inserting order item:', item);
        await connection.query(
          `INSERT INTO Order_Items (Order_ID, Product_ID, Quantity, Price)
           VALUES (?, ?, ?, ?)`,
          [orderId, item.Product_ID, item.Quantity, item.price]
        );
        console.log('[ORDER-MODEL] ✓ Order item inserted for Product_ID:', item.Product_ID);
        
        // تحديث المخزون
        console.log('[ORDER-MODEL] Updating inventory for Product_ID:', item.Product_ID, 'Quantity:', item.Quantity);
        const updateResult = await connection.query(
          `UPDATE Inventory i
           JOIN Products_Inventory pi ON i.Inventory_ID = pi.Inventory_ID
           SET i.Quantity_Available = i.Quantity_Available - ?
           WHERE pi.Product_ID = ?`,
          [item.Quantity, item.Product_ID]
        );
        console.log('[ORDER-MODEL] ✓ Inventory updated:', updateResult[0].affectedRows, 'rows affected');
      }
      
      // حذف السلة
      console.log('[ORDER-MODEL] Deleting cart for Customer_ID:', customerId);
      const deleteResult = await connection.query(
        'DELETE FROM Carts WHERE Customer_ID = ?',
        [customerId]
      );
      console.log('[ORDER-MODEL] ✓ Cart deleted:', deleteResult[0].affectedRows, 'rows affected');
      
      console.log('[ORDER-MODEL] Committing transaction...');
      await connection.commit();
      console.log('[ORDER-MODEL] ✓ Transaction committed successfully');
      
      return orderId;
    } catch (error) {
      console.error('[ORDER-MODEL] ✗ Error in transaction, rolling back:', error.message);
      console.error('[ORDER-MODEL] Error stack:', error.stack);
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * الحصول على طلبات العميل
   */
  static async getOrdersByCustomer(customerId, limit = 20, offset = 0) {
    const [rows] = await db.query(
      `SELECT * FROM Orders 
       WHERE Customer_ID = ? 
       ORDER BY Created_At DESC
       LIMIT ? OFFSET ?`,
      [customerId, limit, offset]
    );
    return rows;
  }

  /**
   * الحصول على تفاصيل الطلب
   */
  static async getOrderDetails(orderId) {
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
   * الحصول على طلب كامل مع التفاصيل
   */
  static async getOrderById(orderId, customerId = null) {
    let query = `SELECT o.*, 
                        COUNT(oi.Order_Item_ID) as item_count
                 FROM Orders o
                 LEFT JOIN Order_Items oi ON o.Order_ID = oi.Order_ID
                 WHERE o.Order_ID = ?`;
    const params = [orderId];
    
    if (customerId) {
      query += ' AND o.Customer_ID = ?';
      params.push(customerId);
    }
    
    query += ' GROUP BY o.Order_ID';
    
    const [rows] = await db.query(query, params);
    return rows[0] || null;
  }

  /**
   * تحديث حالة الطلب
   */
  static async updateOrderStatus(orderId, status) {
    await db.query(
      'UPDATE Orders SET Order_Status = ?, Updated_At = NOW() WHERE Order_ID = ?',
      [status, orderId]
    );
  }

  /**
   * الحصول على جميع الطلبات (للإدارة)
   */
  static async getAllOrders(limit = 50, offset = 0, status = null) {
    let query = `SELECT o.*, 
                        c.Customer_Name,
                        COUNT(oi.Order_Item_ID) as item_count
                 FROM Orders o
                 JOIN Customers c ON o.Customer_ID = c.Customer_Id
                 LEFT JOIN Order_Items oi ON o.Order_ID = oi.Order_ID
                 WHERE 1=1`;
    const params = [];
    
    if (status) {
      query += ' AND o.Order_Status = ?';
      params.push(status);
    }
    
    query += ' GROUP BY o.Order_ID ORDER BY o.Created_At DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rows] = await db.query(query, params);
    return rows;
  }

  /**
   * إلغاء الطلب
   */
  static async cancelOrder(orderId, customerId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // التحقق من أن الطلب للعميل
      const [orderRows] = await connection.query(
        'SELECT * FROM Orders WHERE Order_ID = ? AND Customer_ID = ?',
        [orderId, customerId]
      );
      
      if (!orderRows || orderRows.length === 0) {
        throw new Error('الطلب غير موجود أو ليس لك');
      }
      
      const order = orderRows[0];
      
      if (order.Status === 'Delivered' || order.Status === 'Cancelled') {
        throw new Error('لا يمكن إلغاء هذا الطلب');
      }
      
      // إرجاع المنتجات للمخزون
      const [items] = await connection.query(
        'SELECT * FROM Order_Items WHERE Order_ID = ?',
        [orderId]
      );
      
      for (const item of items) {
        await connection.query(
          `UPDATE Inventory i
           JOIN Products_Inventory pi ON i.Inventory_ID = pi.Inventory_ID
           SET i.Quantity_Available = i.Quantity_Available + ?
           WHERE pi.Product_ID = ?`,
          [item.Quantity, item.Product_ID]
        );
      }
      
      // تحديث حالة الطلب
      await connection.query(
        'UPDATE Orders SET Order_Status = ?, Updated_At = NOW() WHERE Order_ID = ?',
        ['Cancelled', orderId]
      );
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Order;

