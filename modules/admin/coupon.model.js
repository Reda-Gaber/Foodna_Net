/**
 * Coupon Model
 * إدارة الكوبونات والخصومات
 */

const db = require('../../config/db');

class Coupon {
  /**
   * إنشاء كوبون جديد
   */
  static async create(data) {
    const [result] = await db.query(
      `INSERT INTO Coupons (Code, Discount_Type, Discount_Value, Min_Purchase, 
                           Max_Discount, Expiry_Date, Usage_Limit, Is_Active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.code,
        data.discountType, // 'percentage' or 'fixed'
        data.discountValue,
        data.minPurchase || 0,
        data.maxDiscount || null,
        data.expiryDate,
        data.usageLimit || null,
        data.isActive !== undefined ? data.isActive : 1
      ]
    );
    return result.insertId;
  }

  /**
   * التحقق من صحة الكوبون
   */
  static async validateCoupon(code) {
    const [rows] = await db.query(
      `SELECT * FROM Coupons 
       WHERE Code = ? 
       AND Expiry_Date > NOW() 
       AND Is_Active = 1
       AND (Usage_Limit IS NULL OR Usage_Count < Usage_Limit)`,
      [code]
    );
    return rows[0] || null;
  }

  /**
   * تطبيق الكوبون على الطلب
   */
  static async applyCoupon(orderId, couponId, discountAmount) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // إضافة الخصم للطلب
      await connection.query(
        `INSERT INTO Order_Discounts (Order_ID, Coupon_ID, Discount_Amount)
         VALUES (?, ?, ?)`,
        [orderId, couponId, discountAmount]
      );

      // تحديث عدد الاستخدامات
      await connection.query(
        `UPDATE Coupons 
         SET Usage_Count = Usage_Count + 1
         WHERE Coupon_ID = ?`,
        [couponId]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * حساب قيمة الخصم
   */
  static calculateDiscount(coupon, totalAmount) {
    if (totalAmount < coupon.Min_Purchase) {
      throw new Error(`الحد الأدنى للشراء هو ${coupon.Min_Purchase}`);
    }

    let discount = 0;

    if (coupon.Discount_Type === 'percentage') {
      discount = (totalAmount * coupon.Discount_Value) / 100;
      if (coupon.Max_Discount && discount > coupon.Max_Discount) {
        discount = coupon.Max_Discount;
      }
    } else if (coupon.Discount_Type === 'fixed') {
      discount = coupon.Discount_Value;
      if (discount > totalAmount) {
        discount = totalAmount;
      }
    }

    return discount;
  }

  /**
   * الحصول على جميع الكوبونات
   */
  static async getAll(limit = 50, offset = 0) {
    const [rows] = await db.query(
      `SELECT * FROM Coupons 
       ORDER BY Created_At DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return rows;
  }

  /**
   * الحصول على كوبون بواسطة ID
   */
  static async findById(id) {
    const [rows] = await db.query(
      'SELECT * FROM Coupons WHERE Coupon_ID = ?',
      [id]
    );
    return rows[0] || null;
  }

  /**
   * تحديث كوبون
   */
  static async update(id, data) {
    const updates = [];
    const values = [];

    if (data.code !== undefined) {
      updates.push('Code = ?');
      values.push(data.code);
    }
    if (data.discountType !== undefined) {
      updates.push('Discount_Type = ?');
      values.push(data.discountType);
    }
    if (data.discountValue !== undefined) {
      updates.push('Discount_Value = ?');
      values.push(data.discountValue);
    }
    if (data.minPurchase !== undefined) {
      updates.push('Min_Purchase = ?');
      values.push(data.minPurchase);
    }
    if (data.maxDiscount !== undefined) {
      updates.push('Max_Discount = ?');
      values.push(data.maxDiscount);
    }
    if (data.expiryDate !== undefined) {
      updates.push('Expiry_Date = ?');
      values.push(data.expiryDate);
    }
    if (data.usageLimit !== undefined) {
      updates.push('Usage_Limit = ?');
      values.push(data.usageLimit);
    }
    if (data.isActive !== undefined) {
      updates.push('Is_Active = ?');
      values.push(data.isActive);
    }

    if (updates.length === 0) {
      throw new Error('لا توجد بيانات للتحديث');
    }

    values.push(id);

    const [result] = await db.query(
      `UPDATE Coupons SET ${updates.join(', ')} WHERE Coupon_ID = ?`,
      values
    );

    return result.affectedRows;
  }

  /**
   * حذف كوبون
   */
  static async delete(id) {
    const [result] = await db.query(
      'DELETE FROM Coupons WHERE Coupon_ID = ?',
      [id]
    );
    return result.affectedRows;
  }
}

module.exports = Coupon;



