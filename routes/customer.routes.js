const router = require("express").Router();

const home = require("../modules/customer/home.route");
const products = require("../modules/customer/products.routes");
const customerAuth = require("../modules/customer/auth.routes");

router.use("/", home);
router.use("/home", (req, res) => res.redirect("/"));
router.use("/api/products", products);
router.use("/user", customerAuth);

// مسار الملف الشخصي - يتطلب تسجيل الدخول
router.get("/profile", (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.redirect('/user/register?next=/profile');
  }
  res.render("customer/profile", { 
    user: req.session.user 
  });
});

router.get("/contact", (req, res) => res.render("customer/contact"));
router.get("/menu", (req, res) => res.render("customer/menu"));
router.get("/offers", (req, res) => res.render("customer/offers"));
router.get("/about", (req, res) => res.render("customer/about"));
router.get("/product-page", (req, res) => res.render("customer/product-page", { id: req.query.id }));
router.get("/orders", (req, res) => res.render("customer/orders"));
router.get("/customer/orders", (req, res) => res.render("customer/orders"));
router.get("/privacy-policy", (req, res) => res.render("customer/privacy-policy"));
router.get("/refund-policy", (req, res) => res.render("customer/refund-policy"));
router.get("/delivery-policy", (req, res) => res.render("customer/delivery-policy"));

// صفحة checkout - تتطلب تسجيل الدخول
router.get("/checkout", (req, res) => {
  // التحقق من تسجيل الدخول على الـ server-side
  if (!req.session || !req.session.userId) {
    return res.redirect('/user/register?next=' + encodeURIComponent('/checkout'));
  }
  res.render("customer/checkout", { user: req.session.user });
});

module.exports = router;