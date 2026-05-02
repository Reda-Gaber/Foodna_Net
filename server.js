/**
 * Server Entry Point
 * نقطة دخول التطبيق الرئيسية
 */
require('dotenv').config();
const express = require("express");
const session = require("express-session");
const MySqlStore = require("express-mysql-session")(session);
const path = require("path");
const compression = require('compression');
const cors = require('cors');

// Import Security Middleware
const { helmetConfig, apiLimiter } = require('./core/middlewares/security');
const Logger = require('./core/utils/logger');

// Import Routes
const unifiedAuth = require("./modules/auth/unified-auth.routes");
const employeeAuth = require("./modules/auth/employee-login");
const customerRoutes = require("./routes/customer.routes");
const adminRoutes = require("./routes/admin.routes");
const cashierRoutes = require("./modules/cashier/cashier.routes");
const chefRoutes = require("./modules/chef/auth.routes");
const kitchenRoutes = require("./modules/kitchen/kitchen.routes");
const cartRoutes = require("./modules/customer/cart.routes");
const orderRoutes = require("./modules/customer/order.routes");
const reviewRoutes = require("./modules/customer/review.routes");
const categoryRoutes = require("./modules/admin/category.routes");
const couponRoutes = require("./modules/admin/coupon.routes");
const chatbotRoutes = require("./modules/chatbot/chatbot.routes");

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== Security Middleware ====================
app.use(helmetConfig);
app.use(compression());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// ==================== Session Configuration ====================
const mysql = require('mysql2');
const sessionDbHost = process.env.DB_HOST || 'localhost';
const sessionUseSsl = !['localhost', '127.0.0.1', '::1'].includes(sessionDbHost);
const sessionDbPort = process.env.DB_PORT
  ? Number(process.env.DB_PORT)
  : sessionUseSsl ? 4000 : 3306;

const dbPool = mysql.createPool({
  host: sessionDbHost,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'Foodna_Online',
  port: sessionDbPort,
  ssl: sessionUseSsl
    ? { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
    : false,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const sessionStore = new MySqlStore({
  expiration: 8 * 60 * 60 * 1000,
  createDatabaseTable: true,
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
}, dbPool);

app.use(session({
  key: process.env.SESSION_KEY || "session_cookie",
  secret: process.env.SESSION_SECRET || "change-this-secret-in-production",
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  proxy: true,
  cookie: {
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 8 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    path: '/'
  }
}));

// ==================== Body Parsing Middleware ====================
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// ==================== Static Files ====================
app.use(express.static(path.join(__dirname, "public")));
app.use('/images', express.static(path.join(__dirname, "public/images")));

// ==================== View Engine ====================
app.set("view engine", "ejs");
app.set('view cache', false);
app.set("views", path.join(__dirname, "views"));

// ==================== Rate Limiting ====================
app.use('/api', apiLimiter);

// ============================================================
// helper: يشيك على أي طريقة حفظ للـ session
// ============================================================
function isLoggedIn(req) {
  return !!(
    req.session && (
      req.session.userId        ||
      req.session.user?.id      ||
      req.session.authenticated
    )
  );
}

// ============================================================
// Middleware: حماية API Routes
// بيرجع 401 JSON بدل redirect عشان الـ frontend يتعامل معاه
// ============================================================
function requireApiLogin(req, res, next) {
  if (!isLoggedIn(req)) {
    return res.status(401).json({
      success: false,
      message: 'يجب تسجيل الدخول أولاً',
      redirect: '/login?next=' + encodeURIComponent(req.originalUrl)
    });
  }
  next();
}

// ==================== Routes ====================

// Unified Authentication
app.use("/auth", unifiedAuth);

// مسار /login المباشر
app.get("/login", (req, res) => {
  if (isLoggedIn(req)) {
    const next = req.query.next ? decodeURIComponent(req.query.next) : '/';
    return res.redirect(next);
  }
  res.redirect("/auth/login");
});
app.post("/login", (req, res, next) => {
  const authController = require("./modules/auth/unified-auth.controller");
  return authController.unifiedLogin(req, res, next);
});

// ==================== Public API Routes ====================
// chatbot ومنتجات — بدون مصادقة
app.use("/api", chatbotRoutes);
app.use("/api/products", require("./modules/customer/products.routes"));

// تقييمات المنتجات — GET عام بدون مصادقة
// /api/products/:productId/reviews
app.use("/api", reviewRoutes);

// ==================== Protected API Routes ====================
// كل الـ routes دي بتبدأ بـ /cart أو /orders أو /reviews
// يعني الـ URL الكامل: /api/cart, /api/orders, /api/reviews
app.use("/api", requireApiLogin, cartRoutes);
app.use("/api", requireApiLogin, orderRoutes);

// Admin API
app.use("/admin/api", categoryRoutes);
app.use("/admin/api", couponRoutes);

// ==================== Page Routes ====================
app.use("/", employeeAuth);
app.use("/", customerRoutes);
app.use("/admin", adminRoutes);
app.use("/cashier", cashierRoutes);
app.use("/chef", chefRoutes);
app.use("/kitchen", kitchenRoutes);

// ==================== Error Handling ====================
app.use((err, req, res, next) => {
  Logger.error('Unhandled error', err);
  if (req.path.startsWith('/api')) {
    return res.status(err.status || 500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'حدث خطأ في الخادم' : err.message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  }
  res.status(err.status || 500).render('error', {
    message: process.env.NODE_ENV === 'production' ? 'حدث خطأ في الخادم' : err.message
  });
});

// ==================== 404 Handler ====================
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'المسار غير موجود' });
  }
  res.status(404).render('error', { message: 'الصفحة غير موجودة' });
});

// ==================== Start Server ====================
app.listen(PORT, () => {
  Logger.info(`Server running on http://localhost:${PORT}`);
  Logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});