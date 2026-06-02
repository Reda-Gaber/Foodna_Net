/**
 * Cashier Model
 * عمليات الوصول إلى بيانات الكاشير
 */
const db = require('../../config/db');
const Coupon = require('../admin/coupon.model');

class Cashier {
  /**
   * الحصول على جميع المنتجات
   */
  static async fetchProducts() {
    const [products] = await db.query(
      `SELECT p.Product_ID, p.Product_Name, p.Price, p.Discount, p.Image, 
              p.Quantity, p.Category, p.Description
       FROM Products p
       ORDER BY p.Product_Name`
    );
    return products;
  }

  /**
   * الحصول على العروض
   */
  static async fetchOffers() {
    try {
      const [offers] = await db.query(
        `SELECT * FROM Offers WHERE Is_Active = 1`
      );
      return offers;
    } catch (error) {
      return [];
    }
  }

  /**
   * إنشاء طلب جديد (مشترك بين الـ endpoints)
   */
  static async createOrder(connection, {
    items,
    totalAmount,
    paymentMethod,
    customerId,
    couponCode,
    discount,
    notes
  }) {
    try {
      // التحقق من الكوبون إذا كان موجوداً
      let finalDiscount = discount || 0;
      let couponId = null;

      if (couponCode) {
        try {
          const coupon = await Coupon.validateCoupon(couponCode);
          if (coupon) {
            finalDiscount = Coupon.calculateDiscount(coupon, totalAmount);
            couponId = coupon.Coupon_ID;
          }
        } catch (err) {
          // لا نرفع خطأ - الكوبون ليس حرجاً
        }
      }

      const finalAmount = Math.max(0, totalAmount - finalDiscount);

      // إنشاء الطلب
      const [orderResult] = await connection.query(
        `INSERT INTO Orders (Customer_ID, Total_Amount, Order_Status, Delivery_Address, Payment_Method, Created_At)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [customerId || null, finalAmount, 'Pending', 'في المتجر', paymentMethod]
      );

      const orderId = orderResult.insertId;

      // إضافة تفاصيل الطلب
      for (const item of items) {
        await connection.query(
          `INSERT INTO Order_Items (Order_ID, Product_ID, Quantity, Price)
           VALUES (?, ?, ?, ?)`,
          [orderId, item.productId, item.quantity, parseFloat(item.price)]
        );
      }

      // تطبيق الكوبون إذا كان موجوداً
      if (couponId && finalDiscount > 0) {
        try {
          await Coupon.applyCoupon(orderId, couponId, finalDiscount);
        } catch (err) {
          // لا نرفع خطأ - الطلب تم إنشاؤه بنجاح
        }
      }

      return {
        orderId,
        orderNumber: `#${orderId}`,
        totalAmount,
        discount: finalDiscount,
        finalAmount,
        paymentMethod
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * الحصول على بيانات صفحة الإيصال
   */
  static async fetchReceiptPageData(orderId) {
    const [orders] = await db.query('SELECT * FROM Orders WHERE Order_ID = ?', [orderId]);
    
    if (orders.length === 0) {
      return null;
    }

    const order = orders[0];
    const [items] = await db.query(
      `SELECT oi.*, p.Product_Name FROM Order_Items oi
       JOIN Products p ON oi.Product_ID = p.Product_ID
       WHERE oi.Order_ID = ?`,
      [orderId]
    );

    const [discounts] = await db.query(
      'SELECT Discount_Amount FROM Order_Discounts WHERE Order_ID = ?',
      [orderId]
    );

    const discount = discounts.length > 0 ? parseFloat(discounts[0].Discount_Amount) : 0;

    return {
      order,
      items,
      discount
    };
  }

  /**
   * الحصول على تفاصيل الطلب للإيصال (JSON)
   */
  static async fetchOrderReceipt(orderId) {
    const [orders] = await db.query(
      `SELECT Order_ID, Customer_ID, Total_Amount, Order_Status,
              Delivery_Address, Payment_Method, Created_At, Updated_At
       FROM Orders WHERE Order_ID = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      return null;
    }

    const order = orders[0];
    const [items] = await db.query(
      `SELECT oi.*, p.Product_Name FROM Order_Items oi
       JOIN Products p ON oi.Product_ID = p.Product_ID
       WHERE oi.Order_ID = ?`,
      [orderId]
    );

    // الحصول على الخصم من الكوبون
    const [discounts] = await db.query(
      'SELECT Discount_Amount FROM Order_Discounts WHERE Order_ID = ?',
      [orderId]
    );
    const discount = discounts.length > 0 ? parseFloat(discounts[0].Discount_Amount) : 0;

    return {
      order,
      items,
      discount
    };
  }

  /**
   * الحصول على الطلبات (نشطة أو مكتملة)
   */
  static async fetchOrders(status) {
    let whereClause = '';

    if (status === 'active') {
      whereClause = `WHERE o.Order_Status IN ('Pending', 'Processing', 'Ready')`;
    } else if (status === 'completed') {
      whereClause = `WHERE o.Order_Status IN ('Delivered', 'Cancelled')`;
    }

    const [orders] = await db.query(
      `SELECT o.Order_ID, o.Customer_ID, c.Customer_Name,
              o.Order_Status, o.Total_Amount,
              o.Payment_Method, o.Created_At
       FROM Orders o
       LEFT JOIN Customers c ON o.Customer_ID = c.Customer_Id
       ${whereClause}
       ORDER BY o.Created_At DESC
       LIMIT 100`
    );

    return orders;
  }

  /**
   * تحديث حالة الطلب
   */
  static async updateOrderStatus(orderId, status) {
    const [result] = await db.query(
      'UPDATE Orders SET Order_Status = ?, Updated_At = NOW() WHERE Order_ID = ?',
      [status, orderId]
    );

    return result;
  }
}

module.exports = Cashier;
