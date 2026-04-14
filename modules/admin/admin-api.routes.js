/**
 * Admin API Routes
 * توفر بيانات العملاء والطلبات والمنتجات والإحصائيات
 */

const router = require("express").Router();
const db = require("../../config/db");

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
