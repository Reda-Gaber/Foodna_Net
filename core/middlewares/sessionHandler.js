/**
 * Session Handler Middleware
 * ensures sessions are properly saved on Vercel serverless environment
 *
 * On Vercel, each request can hit a different server instance, so we need to:
 * 1. Explicitly save sessions before responding
 * 2. Use resave: true to save on every request
 * 3. Use proxy: true for HTTPS termination
 */

const Logger = require('../utils/logger');

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
 * @param {Object} req - Express request
 * @returns {boolean}
 */
function isAuthenticated(req) {
  return !!(
    req.session?.userId ||
    req.session?.user?.id ||
    req.session?.authenticated
  );
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

module.exports = {
  ensureSessionSaved,
  getSessionUserId,
  getSessionUser,
  isAuthenticated,
  hasRole,
  clearSession
};
