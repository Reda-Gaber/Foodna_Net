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
const { helmetConfig, apiLimiter } = require('./core/middlewares/sessionHandler');
const Logger = require('./core/utils/logger');
const { requireApiLogin, requireClientApiLogin } = require('./core/middlewares/authMiddleware');

// Import Routes
const unifiedAuth = require("./modules/auth/unified-auth.routes");
const customerRoutes = require("./routes/customer.routes");
const adminRoutes = require("./routes/admin.routes");
const cashierRoutes = require("./modules/cashier/cashier.routes");
const chefRoutes = require("./modules/kitchen/kitchen.routes");
const cartRoutes = require("./modules/customer/cart.routes");
const orderRoutes = require("./modules/customer/order.routes");
const categoryRoutes = require("./modules/admin/category.routes");
const couponRoutes = require("./modules/admin/coupon.routes");
const chatbotRoutes = require("./modules/chatbot/chatbot.routes");

const app = express();
const PORT = process.env.PORT || 3000;

// If the app is behind a proxy (Vercel, Heroku, nginx), trust the first proxy.
app.set('trust proxy', 1);

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

dbPool.on('error', (err) => {
  Logger.error('Session DB pool error', err);
});

const sessionStore = new MySqlStore({
  expiration: 8 * 60 * 60 * 1000,
  createDatabaseTable: true,
  checkExpirationInterval: 15 * 60 * 1000,
  clearExpired: true,
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
}, dbPool);

const sessionCookieSecure = process.env.SESSION_SECURE
  ? ['1', 'true', 'yes'].includes(String(process.env.SESSION_SECURE).toLowerCase())
  : process.env.NODE_ENV === 'production';

app.use(session({
  key: process.env.SESSION_KEY || "session_cookie",
  secret: process.env.SESSION_SECRET || "change-this-secret-in-production",
  store: sessionStore,
  resave: true,
  saveUninitialized: false,
  rolling: true,
  proxy: true,
  cookie: {
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 8 * 60 * 60 * 1000,
    secure: sessionCookieSecure,
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

// ==================== Routes ====================

// Unified Authentication
app.use("/auth", unifiedAuth);

// مسار /login المباشر — توجيه العميل لـ /user/register والموظف لـ /auth/login
const CUSTOMER_LOGIN_PATHS = ['/checkout', '/profile', '/orders', '/customer/orders'];
app.get("/login", (req, res) => {
  if (isLoggedIn(req)) {
    const next = req.query.next ? decodeURIComponent(req.query.next) : '/';
    return res.redirect(next);
  }
  const nextRaw = req.query.next ? decodeURIComponent(req.query.next) : '';
  const isCustomerFlow = CUSTOMER_LOGIN_PATHS.some((p) => nextRaw === p || nextRaw.startsWith(p + '?'));
  if (isCustomerFlow) {
    const q = req.query.next ? '?next=' + encodeURIComponent(req.query.next) : '';
    return res.redirect('/user/register' + q);
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

// ==================== Protected API Routes ====================
// كل الـ routes دي بتبدأ بـ /cart أو /orders أو /reviews
// يعني الـ URL الكامل: /api/cart, /api/orders, /api/reviews
app.use("/api", requireClientApiLogin, cartRoutes);
app.use("/api", requireClientApiLogin, orderRoutes);

// Admin API
app.use("/admin/api", requireApiLogin, categoryRoutes);
app.use("/admin/api", requireApiLogin, couponRoutes);

// ==================== Page Routes ====================
app.use("/", customerRoutes);
app.use("/admin", adminRoutes);
app.use("/cashier", cashierRoutes);
app.use("/kitchen", chefRoutes);

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

// ==================== Global Error Handling ====================
process.on('unhandledRejection', (reason, promise) => {
  Logger.error('Unhandled Promise Rejection', { reason, promise });
});

process.on('uncaughtException', (error) => {
  Logger.error('Uncaught Exception', error);
});

// ==================== Start Server ====================
app.listen(PORT, () => {
  Logger.info(`Server running on http://localhost:${PORT}`);
  Logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});