/**
 * Middleware للأمان
 * يتضمن: Helmet, Rate Limiting, Input Sanitization
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate Limiting للـ Login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 5, // 5 محاولات فقط
  message: {
    success: false,
    error: 'Too many login attempts',
    message: 'تم تجاوز عدد المحاولات المسموح. يرجى المحاولة مرة أخرى بعد 15 دقيقة'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate Limiting عام للـ API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 110, // 100 طلب
  message: {
    success: false,
    error: 'Too many requests',
    message: 'تم تجاوز عدد الطلبات المسموح'
  }
});

// Rate Limiting للـ Registration
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة واحدة
  max: 10, // 3 محاولات
  message: {
    success: false,
    error: 'Too many registration attempts',
    message: 'تم تجاوز عدد محاولات التسجيل المسموح'
  }
});

// Helmet Configuration
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      /* Allow Google Fonts, cdnjs, jsdelivr and unpkg (or host these libs locally instead) */
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      connectSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

module.exports = {
  loginLimiter,
  apiLimiter,
  registerLimiter,
  helmetConfig
};



