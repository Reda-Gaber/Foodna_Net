/**
 * Session Handler Middleware
 * ensures sessions are properly saved on Vercel serverless environment
 *
 * On Vercel, each request can hit a different server instance, so we need to:
 * 1. Explicitly save sessions before responding
 * 2. Use resave: true to save on every request
 * 3. Use proxy: true for HTTPS termination
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const Logger = require('../utils/logger');
const db = require('../../config/db');

/** منع reload متزامن لنفس session_id (سبب "failed to load session") */
const reloadLocks = new Map();

/**
 * Middleware to ensure session is saved after modifications
 * Should be used on routes that modify session data
 */
function ensureSessionSaved(req, res, next) {
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  // Wrap response methods to ensure session is saved first
  const saveSessionAndRespond = (callback) => {
    return (body) => {
      if (req.session && (req.session.userId || req.session.user)) {
        // Session has been modified or accessed, save it
        req.session.save((err) => {
          if (err) {
            Logger.error('Session save error:', err);
          }
          callback(body);
        });
      } else {
        callback(body);
      }
    };
  };

  res.json = saveSessionAndRespond(originalJson);
  res.send = saveSessionAndRespond(originalSend);

  next();
}

/**
 * Get user ID from session - handles both customer and employee sessions
 * @param {Object} session - Express session object
 * @returns {number|null}
 */
function getSessionUserId(session) {
  if (!session) return null;
  // Customer session: req.session.userId
  if (session.userId) return session.userId;
  // Employee session: req.session.user.id
  if (session.user && session.user.id) return session.user.id;
  return null;
}

/** استخراج معرّف العميل من صف DB (يدعم اختلاف أسماء الأعمدة) */
function resolveCustomerId(row) {
  if (!row) return null;
  const id = row.Customer_ID ?? row.Customer_Id ?? row.customer_id ?? row.id;
  return id != null && id !== '' ? Number(id) : null;
}

/** استخراج معرّف الموظف من صف DB */
function resolveEmployeeId(row) {
  if (!row) return null;
  const id = row.Employee_ID ?? row.Employee_Id ?? row.employee_id ?? row.id;
  return id != null && id !== '' ? Number(id) : null;
}

/**
 * يضمن وجود userId و session.user.id للعميل ويحفظ الجلسة
 */
function hasSessionAuth(req) {
  const s = req.session;
  if (!s) return false;
  if (s.userId || s.user?.id) return true;
  if (s.authenticated) return true;
  if (s.email && (s.role === 'Client' || s.user?.role === 'Client')) return true;
  if (s.user && Object.keys(s.user).length > 0) return true;
  return false;
}

function isStaleSessionLoadError(err) {
  const msg = err && err.message ? String(err.message) : '';
  return /failed to load session/i.test(msg);
}

async function reloadSessionOnce(req) {
  if (hasSessionAuth(req)) return true;
  if (!req.sessionID) return false;

  const sid = req.sessionID;
  if (reloadLocks.has(sid)) {
    await reloadLocks.get(sid);
    return hasSessionAuth(req);
  }

  const reloadWork = new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), 2500);
    try {
      req.session.reload((err) => {
        clearTimeout(timer);
        if (err) {
          // كوكي قديم أو جلسة منتهية في MySQL — طبيعي ولا يؤثر إن الجلسة الحالية صالحة
          if (!isStaleSessionLoadError(err)) {
            Logger.warn('[sessionHandler] Session reload failed', { sid, message: err.message });
          }
          return resolve(hasSessionAuth(req));
        }
        if (!req.session.userId && req.session.user?.id) {
          req.session.userId = req.session.user.id;
        }
        resolve(hasSessionAuth(req));
      });
    } catch (e) {
      clearTimeout(timer);
      if (!isStaleSessionLoadError(e)) {
        Logger.warn('[sessionHandler] Session reload threw', e);
      }
      resolve(hasSessionAuth(req));
    }
  });

  reloadLocks.set(sid, reloadWork);
  try {
    return await reloadWork;
  } finally {
    reloadLocks.delete(sid);
  }
}

async function ensureClientSessionIds(req) {
  if (!req.session) return null;

  const role = req.session.user?.role || req.session.role;
  if (role && role !== 'Client') return getSessionUserId(req.session);

  let id = req.session.userId || req.session.user?.id;
  if (id) {
    req.session.userId = id;
    req.session.user = req.session.user || {};
    if (req.session.user.id !== id) {
      req.session.user.id = id;
    }
    return id;
  }

  if (!req.session.email) return null;

  try {
    const [rows] = await db.query(
      'SELECT * FROM Customers WHERE Email = ? LIMIT 1',
      [req.session.email]
    );
    id = resolveCustomerId(rows[0]);
    if (!id) return null;

    const row = rows[0];
    req.session.userId = id;
    req.session.role = 'Client';
    req.session.authenticated = true;
    req.session.user = {
      id,
      name: req.session.user?.name || row.Customer_Name || row.customer_name || '',
      email: req.session.user?.email || row.Email || req.session.email,
      role: 'Client'
    };

    await new Promise((resolve, reject) => {
      req.session.save((err) => (err ? reject(err) : resolve()));
    });
    return id;
  } catch (error) {
    Logger.error('ensureClientSessionIds error', error);
    return null;
  }
}

/**
 * Get full user object from session
 * @param {Object} session - Express session object
 * @returns {Object|null}
 */
function getSessionUser(session) {
  if (!session) return null;

  // Return session.user if it exists (employee format)
  if (session.user) {
    return session.user;
  }

  // Build user object from customer session format
  if (session.userId) {
    return {
      id: session.userId,
      name: session.name || session.email || '',
      email: session.email || '',
      role: session.role || 'Client'
    };
  }

  return null;
}

/**
 * Check if user is authenticated (any role)
 * Uses express-session's built-in reload to re-fetch from store (MySQL)
 * which works across Vercel cold starts.
 * @param {Object} req - Express request
 * @returns {boolean}
 */
async function isAuthenticated(req) {
  if (hasSessionAuth(req)) return true;
  return reloadSessionOnce(req);
}
 
 
 /**
 * Check if user has specific role
 * @param {Object} req - Express request
 * @param {...string} roles - Allowed roles
 * @returns {boolean}
 */
function hasRole(req, ...roles) {
  const userRole = req.session?.user?.role || req.session?.role;
  return userRole && roles.includes(userRole);
}

/**
 * Clear session (logout)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} callback - Optional callback after logout
 */
function clearSession(req, res, callback) {
  req.session.destroy((err) => {
    if (err) {
      Logger.error('Session destroy error:', err);
    }
    if (callback) callback(err);
  });
}

// ==================== Security (Helmet & Rate limiting) ====================

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many login attempts',
    message: 'تم تجاوز عدد المحاولات المسموح. يرجى المحاولة مرة أخرى بعد 15 دقيقة'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 110,
  message: {
    success: false,
    error: 'Too many requests',
    message: 'تم تجاوز عدد الطلبات المسموح'
  }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many registration attempts',
    message: 'تم تجاوز عدد محاولات التسجيل المسموح'
  }
});

const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'https://fonts.googleapis.com', 'https://cdn.jsdelivr.net', 'https://unpkg.com'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net', 'https://unpkg.com'],
      scriptSrcAttr: ["'unsafe-inline'"],
      connectSrc: ["'self'", 'https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net', 'https://unpkg.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:', 'https://cdnjs.cloudflare.com', 'https://fonts.gstatic.com']
    }
  },
  crossOriginEmbedderPolicy: false
});

module.exports = {
  ensureSessionSaved,
  getSessionUserId,
  getSessionUser,
  resolveCustomerId,
  resolveEmployeeId,
  hasSessionAuth,
  reloadSessionOnce,
  ensureClientSessionIds,
  isAuthenticated,
  hasRole,
  clearSession,
  loginLimiter,
  apiLimiter,
  registerLimiter,
  helmetConfig
};
