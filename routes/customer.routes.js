const router = require("express").Router();
const db = require("../config/db");

const home = require("../modules/customer/home.route");
const products = require("../modules/customer/products.routes");
const customerAuth = require("../modules/customer/auth.routes");
const { requireCustomer, requireAuth } = require('../core/middlewares/authMiddleware');

router.use("/", home);
router.use("/home", (req, res) => res.redirect("/"));
router.use("/api/products", products);
router.use("/user", customerAuth);


// ============================================================
// صفحات عامة — لا تتطلب تسجيل دخول
// ============================================================
router.get("/contact",         (req, res) => res.render("customer/contact"));
router.get("/menu",            (req, res) => res.render("customer/menu"));
router.get("/offers",          (req, res) => res.render("customer/offers"));
router.get("/about",           (req, res) => res.render("customer/about"));
router.get("/privacy-policy",  (req, res) => res.render("customer/privacy-policy"));
router.get("/refund-policy",   (req, res) => res.render("customer/refund-policy"));
router.get("/delivery-policy", (req, res) => res.render("customer/delivery-policy"));

router.get("/product-page", (req, res) =>
  res.render("customer/product-page", { id: req.query.id })
);

// ============================================================
// صفحات محمية — تتطلب تسجيل دخول
// ============================================================
router.get("/profile", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId || (req.session.user && req.session.user.id);
    if (!userId) {
      return res.redirect('/login');
    }
    const [rows] = await db.query(
      'SELECT Customer_Id, Customer_Name, Email, Phone, Address FROM Customers WHERE Customer_Id = ?',
      [userId]
    );
    if (!rows || rows.length === 0) {
      return res.render('customer/profile', { user: null, error: 'تعذر العثور على بيانات المستخدم' });
    }
    const user = rows[0];
    // Prevent back button caching after logout
    res.setHeader('Cache-Control', 'no-store');
    res.render("customer/profile", { user });
  } catch (err) {
    console.error('Profile DB fetch error:', err);
    res.render('customer/profile', { user: null, error: 'حدث خطأ أثناء جلب البيانات' });
  }
});

router.get("/checkout", requireCustomer, async (req, res) => {
  // دعم كلا من Customer session و Employee session
  let user = req.session.user || null;

  // لو مش موجود في session.user، نجيبه من الـ DB باستخدام userId
  if (!user && req.session.userId) {
    try {
      const [rows] = await db.query(
        'SELECT Customer_Id as id, Customer_Name as name, Email as email, Phone as phone, Address as address FROM Customers WHERE Customer_Id = ?',
        [req.session.userId]
      );
      if (rows && rows.length > 0) {
        user = { ...rows[0], role: 'Client' };
      }
    } catch(e) {
      console.error('Checkout user fetch error:', e);
    }
  }

  res.render("customer/checkout", { user });
});

router.get("/orders",          requireCustomer, (req, res) =>
  res.redirect("/profile?tab=orders")
);
router.get("/customer/orders", requireCustomer, (req, res) =>
  res.redirect("/profile?tab=orders")
);

module.exports = router;