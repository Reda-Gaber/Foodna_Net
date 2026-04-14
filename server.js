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
const employeeAuth = require("./modules/auth/employee-login"); // للتوافق مع الكود القديم
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
app.use(helmetConfig); // حماية Headers
app.use(compression()); // ضغط الاستجابات
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// ==================== Session Configuration ====================
// نحتاج إلى connection pool للـ session store
const mysql = require('mysql2');
const sessionDbHost = process.env.DB_HOST || 'localhost';
const sessionUseSsl = !['localhost', '127.0.0.1', '::1'].includes(sessionDbHost);
const sessionDbPort = process.env.DB_PORT
  ? Number(process.env.DB_PORT)
  : sessionUseSsl
    ? 4000
    : 3306;
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
  expiration: 8 * 60 * 60 * 1000, // 8 ساعات
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
  cookie: {
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 8 * 60 * 60 * 1000, // 8 ساعات
    secure: process.env.NODE_ENV === 'production', // HTTPS فقط في الإنتاج
    httpOnly: true, // لا يمكن الوصول من JavaScript
    sameSite: 'strict' // حماية CSRF
  }
}));

// ==================== Body Parsing Middleware ====================
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// ==================== Static Files ====================
// خدمة الملفات الثابتة من مجلد public
app.use(express.static(path.join(__dirname, "public")));
// مسار إضافي للصور (للتوافق مع الكود القديم)
app.use('/images', express.static(path.join(__dirname, "public/images")));

// ==================== View Engine ====================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ==================== Rate Limiting ====================
app.use('/api', apiLimiter);

// ==================== Routes ====================
// Unified Authentication (يجب أن يكون أول route)
app.use("/auth", unifiedAuth);
// PUBLIC API Routes (بدون مصادقة)
app.use("/api", chatbotRoutes);
// ملاحظة مهمة: /api/products يجب أن يكون متاح بدون مصادقة (عام)
const productsPublicRouter = require("./modules/customer/products.routes");
app.use("/api/products", productsPublicRouter);
// Customer API routes (تتطلب مصادقة)
app.use("/api", cartRoutes);
app.use("/api", orderRoutes);
app.use("/api", reviewRoutes);
app.use("/admin/api", categoryRoutes);
app.use("/admin/api", couponRoutes);
// Legacy routes (للتوافق)
app.use("/", employeeAuth);
app.use("/", customerRoutes);
app.use("/admin", adminRoutes);
app.use("/cashier", cashierRoutes);
app.use("/chef", chefRoutes);
app.use("/kitchen", kitchenRoutes);

// ==================== Error Handling Middleware ====================
app.use((err, req, res, next) => {
  Logger.error('Unhandled error', err);
  
  if (req.path.startsWith('/api')) {
    return res.status(err.status || 500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' 
        ? 'حدث خطأ في الخادم' 
        : err.message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  }
  
  res.status(err.status || 500).render('error', {
    message: process.env.NODE_ENV === 'production'
      ? 'حدث خطأ في الخادم'
      : err.message
  });
});

// ==================== 404 Handler ====================
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: 'المسار غير موجود'
    });
  }
  res.status(404).render('error', { message: 'الصفحة غير موجودة' });
});

// ==================== Start Server ====================
app.listen(PORT, () => {
  Logger.info(`Server running on http://localhost:${PORT}`);
  Logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});