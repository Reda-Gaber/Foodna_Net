/**
 * Admin API Routes
 * توفر بيانات العملاء والطلبات والمنتجات والإحصائيات
 */

const router = require("express").Router();
const db = require("../../config/db");
const { requireEmployee } = require("../../core/middlewares/authMiddleware");

// ============================================
// جميع العملاء
// ============================================
router.get("/customers", async (req, res) => {
  try {
    console.log('API: جاري جلب بيانات العملاء...');
    const customers = await db.query(`
      SELECT 
        c.Customer_Id as id,
        c.Customer_Name as name,
        c.Email as email,
        c.Phone as phone,
        COALESCE(COUNT(o.Order_ID), 0) as orders,
        COALESCE(SUM(o.Total_Amount), 0) as totalSpent
      FROM Customers c
      LEFT JOIN Orders o ON c.Customer_Id = o.Customer_ID
      GROUP BY c.Customer_Id
      ORDER BY c.Customer_Id DESC
    `);
    
    console.log('API: نتيجة الـ query:', customers);
    console.log('API: محتوى customers[0]:', customers[0]);
    console.log('API: عدد العملاء:', customers[0] ? customers[0].length : 0);
    
    if (!customers[0] || customers[0].length === 0) {
      console.warn('⚠️ API: لا توجد بيانات عملاء');
    }
    
    res.json(customers[0] || []);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "فشل جلب بيانات العملاء", details: error.message });
  }
});

// ============================================
// جميع الطلبات
// ============================================
router.get("/orders", async (req, res) => {
  try {
    const orders = await db.query(`
      SELECT 
        o.Order_ID as id,
        COALESCE(c.Customer_Name, 'عميل غير معروف') as customer,
        DATE_FORMAT(o.Order_Date, '%Y-%m-%d') as date,
        o.Total_Amount as total,
        o.Order_Status as status
      FROM Orders o
      LEFT JOIN Customers c ON o.Customer_ID = c.Customer_Id
      ORDER BY o.Order_ID DESC
      LIMIT 100
    `);
    
    // تحويل حالات الطلبات
    const formattedOrders = orders[0].map(order => ({
      ...order,
      status: getArabicStatus(order.status)
    }));
    
    
    res.json(formattedOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "فشل جلب بيانات الطلبات", details: error.message });
  }
});

// ============================================
// الإحصائيات العامة
// ============================================
router.get("/stats", async (req, res) => {
  try {
    const totalOrders = await db.query(
      "SELECT COUNT(*) as count FROM Orders"
    );
    
    const totalRevenue = await db.query(
      "SELECT COALESCE(SUM(Total_Amount), 0) as total FROM Orders"
    );
    
    const totalProducts = await db.query(
      "SELECT COUNT(*) as count FROM Products"
    );
    
    const totalCustomers = await db.query(
      "SELECT COUNT(*) as count FROM Customers"
    );
    
    res.json({
      orders: totalOrders[0][0].count,
      revenue: parseFloat(totalRevenue[0][0].total),
      products: totalProducts[0][0].count,
      customers: totalCustomers[0][0].count
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "فشل جلب الإحصائيات", details: error.message });
  }
});

// ============================================
// حذف عميل
// ============================================
router.delete("/customers/:id", requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ محاولة حذف العميل برقم:', id, 'من المستخدم:', req.session.user?.id);
    
    if (!id || isNaN(parseInt(id))) {
      console.warn('⚠️ معرف العميل غير صحيح:', id);
      return res.status(400).json({ error: "معرف العميل غير صحيح" });
    }
    
    const customerId = parseInt(id);
    
    let connection;
    try {
      connection = await db.getConnection();
      console.log('✅ تم الاتصال بقاعدة البيانات');
      
      await connection.beginTransaction();
      console.log('✅ تم بدء الـ transaction');
      
      // حذف الطلبات المتعلقة به أولاً
      const [deleteOrdersResult] = await connection.query(
        "DELETE FROM Orders WHERE Customer_ID = ?",
        [customerId]
      );
      console.log('🗑️ تم حذف', deleteOrdersResult.affectedRows, 'طلب');
      
      // ثم حذف العميل
      const [deleteCustomerResult] = await connection.query(
        "DELETE FROM Customers WHERE Customer_Id = ?",
        [customerId]
      );
      console.log('🗑️ تم حذف', deleteCustomerResult.affectedRows, 'عميل');
      
      if (deleteCustomerResult.affectedRows === 0) {
        await connection.rollback();
        console.warn('⚠️ العميل غير موجود:', customerId);
        return res.status(404).json({ error: "العميل غير موجود" });
      }
      
      await connection.commit();
      console.log('✅ تم تأكيد الـ transaction');
      
      console.log('✅ تم حذف العميل بنجاح:', customerId);
      return res.json({ success: true, message: "تم حذف العميل بنجاح" });
    } catch (dbError) {
      if (connection) {
        await connection.rollback();
        console.error('❌ تم إلغاء الـ transaction بسبب خطأ:', dbError);
      }
      throw dbError;
    } finally {
      if (connection) {
        connection.release();
        console.log('✅ تم إغلاق الاتصال');
      }
    }
  } catch (error) {
    console.error("❌ خطأ في حذف العميل:", error);
    res.status(500).json({ error: "فشل حذف العميل", details: error.message });
  }
});

// ============================================
// تحويل حالات الطلبات للعربية
// ============================================
function getArabicStatus(status) {
  const statusMap = {
    'Pending': 'قيد الانتظار',
    'Shipped': 'مرسل',
    'Delivered': 'تم التسليم',
    'Cancelled': 'ملغى'
  };
  return statusMap[status] || status;
}

module.exports = router;
