const router = require("express").Router();
const Category = require("./category.model");

// Middleware: إعادة تحميل الجلسة من قاعدة البيانات
router.use((req, res, next) => {
  if (req.session && req.session.reload) {
    req.session.reload((err) => {
      if (err) {
        console.error('❌ Session reload error:', err);
      } else {
        console.log('✅ Session reloaded from database');
      }
      next();
    });
  } else {
    next();
  }
});

router.get("/dashboard", async (req, res) => {
  console.log('🔵 Admin dashboard access attempt');
  console.log('Session data:', {
    user: req.session?.user,
    authenticated: req.session?.authenticated,
    role: req.session?.user?.role
  });
  // التحقق من تسجيل الدخول
  if (!req.session.user) {
    console.warn('⚠️ No session user found, redirecting to login');
    return res.redirect('/login');
  }

  // التحقق من الدور
  if (req.session.user.role !== "Admin") {
    console.warn('⚠️ User role not authorized:', req.session.user.role);
    return res.status(403).render('error', {
      message: 'ليس لديك صلاحية للوصول إلى لوحة التحكم'
    });
  }

  console.log('✅ Admin dashboard access granted');

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