const router = require("express").Router();
const isAuthenticated = require("../../core/middlewares/isAuth");
const Category = require("./category.model");

router.get("/dashboard", async (req, res) => {
  // التحقق من تسجيل الدخول
  if (!req.session.user) {
    return res.redirect('/login');
  }

  // التحقق من الدور
  if (req.session.user.role !== "Admin") {
    return res.status(403).render('error', {
      message: 'ليس لديك صلاحية للوصول إلى لوحة التحكم'
    });
  }

  try {
    // جلب التصنيفات من DB وبعتها للـ view
    const categories = await Category.getAll();
    res.render("admin/dashboard", { 
      user: req.session.user,
      categories: categories || []
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render("admin/dashboard", { 
      user: req.session.user,
      categories: []
    });
  }
});

// Route للتوافق مع الكود القديم
router.get("/", (req, res) => {
  res.redirect('/admin/dashboard');
});

module.exports = router;