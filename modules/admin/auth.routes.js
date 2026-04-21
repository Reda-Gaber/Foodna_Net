const router = require("express").Router();
const isAuthenticated = require("../../core/middlewares/isAuth");

router.get("/dashboard", (req, res) => {
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
  
  res.render("admin/dashboard", { user: req.session.user });
});

// Route للتوافق مع الكود القديم
router.get("/", (req, res) => {
  res.redirect('/admin/dashboard');
});

module.exports = router;